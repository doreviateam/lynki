# -*- coding: utf-8 -*-
"""Synchro MVP billetterie : lecture commandes formulaire Event (ou type paramétrable), ancrage order.id."""

import logging

from odoo import _, fields
from odoo.exceptions import UserError

from odoo.addons.dorevia_helloasso_connector.models.helloasso_client import (
    HelloAssoClientError,
    fetch_client_credentials_token,
    fetch_form_orders_page,
    fetch_organization_forms,
    form_light_form_type_str,
    form_light_slug,
    form_light_title,
)
from odoo.addons.dorevia_helloasso_connector.models.helloasso_datetime import (
    parse_helloasso_api_datetime,
)

_logger = logging.getLogger(__name__)

_ORDER_PAGE_SIZE = 50
_MAX_ORDER_PAGES = 40
_HELLOASSO_AMOUNT_CENTS_PER_EURO = 100

_BAD_ORDER_STATES = frozenset(
    {"refused", "abandoned", "canceled", "cancelled", "expired"}
)


def _g(obj, *keys):
    if not isinstance(obj, dict):
        return None
    for k in keys:
        if k in obj:
            return obj[k]
    return None


def _norm_str(val):
    if val is None:
        return ""
    if isinstance(val, str):
        return val.strip()
    return str(val).strip()


def _order_id(order):
    v = _g(order, "id", "Id")
    if v is None:
        return None
    return str(v)


def _order_collect_state_strings(order):
    """États texte (minuscules) : racine commande + chaque paiement imbriqué.

    La liste ``…/forms/…/orders`` n’expose souvent **pas** ``state`` à la racine ; il est
    sur ``payments[].state`` (ex. Authorized) ou sur les lignes.
    """
    out = []
    if not isinstance(order, dict):
        return out
    rs = _norm_str(_g(order, "state", "State")).lower()
    if rs:
        out.append(rs)
    pays = _g(order, "payments", "Payments")
    if isinstance(pays, list):
        for p in pays:
            if not isinstance(p, dict):
                continue
            ps = _norm_str(_g(p, "state", "State")).lower()
            if ps:
                out.append(ps)
    return out


def _order_state_raw_for_storage(order):
    """Libellé statut HelloAsso pour affichage Odoo (racine → 1er paiement → 1ère ligne)."""
    if not isinstance(order, dict):
        return False
    root = _norm_str(_g(order, "state", "State"))
    if root:
        return root
    pays = _g(order, "payments", "Payments")
    if isinstance(pays, list):
        for p in pays:
            if not isinstance(p, dict):
                continue
            ps = _norm_str(_g(p, "state", "State"))
            if ps:
                return ps
    items = _g(order, "items", "Items")
    if isinstance(items, list):
        for it in items:
            if not isinstance(it, dict):
                continue
            st = _norm_str(_g(it, "state", "State"))
            if st:
                return st
    return False


def order_eligible_mvp(order):
    """Exclut les commandes annulées / refusées ; le reste est traité (MVP)."""
    states = _order_collect_state_strings(order)
    if not states:
        return True
    if any(s in _BAD_ORDER_STATES for s in states):
        return False
    return True


def _payer_identity_from_dict(payer):
    if not isinstance(payer, dict):
        return "", "", ""
    em = _g(payer, "email", "Email") or ""
    fn = _g(payer, "firstName", "FirstName", "firstname") or ""
    ln = _g(payer, "lastName", "LastName", "lastname") or ""
    return (em or "").strip().lower(), (fn or "").strip(), (ln or "").strip()


def _order_payer(order):
    """E-mail payeur obligatoire pour le MVP ; tolère plusieurs emplacements JSON HelloAsso."""
    if not isinstance(order, dict):
        return "", "", ""
    payer = _g(
        order,
        "payer",
        "Payer",
        "buyer",
        "Buyer",
        "orderer",
        "Orderer",
        "consumer",
        "Consumer",
    )
    if isinstance(payer, dict):
        em, fn, ln = _payer_identity_from_dict(payer)
        if em:
            return em, fn, ln
    em_raw = _g(
        order,
        "payerEmail",
        "PayerEmail",
        "buyerEmail",
        "BuyerEmail",
        "userEmail",
        "UserEmail",
        "Email",
        "email",
    )
    em = (em_raw or "").strip().lower() if em_raw else ""
    if em:
        fn = _norm_str(
            _g(order, "firstName", "FirstName", "payerFirstName", "PayerFirstName") or ""
        )
        ln = _norm_str(
            _g(order, "lastName", "LastName", "payerLastName", "PayerLastName") or ""
        )
        return em, fn, ln
    return "", "", ""


def _item_person_block(item):
    if not isinstance(item, dict):
        return None
    for key in (
        "user",
        "User",
        "participant",
        "Participant",
        "attendee",
        "Attendee",
        "beneficiary",
        "Beneficiary",
    ):
        block = item.get(key)
        if isinstance(block, dict):
            return block
    return None


def _line_vals_from_item(idx, item, payer_fallback):
    """Construit les valeurs d'une ligne ; participant peut manquer (champs vides)."""
    label = _g(item, "name", "Name", "label", "Label", "title", "Title") or ""
    itype = _g(item, "type", "Type") or ""
    itype = _norm_str(itype)
    iid = _g(item, "id", "Id")
    iid_str = str(iid) if iid is not None else ""

    block = _item_person_block(item)
    if block:
        em, fn, ln = _payer_identity_from_dict(block)
    else:
        em = (_g(item, "email", "Email") or "").strip().lower()
        fn = (_g(item, "firstName", "FirstName", "firstname") or "").strip()
        ln = (_g(item, "lastName", "LastName", "lastname") or "").strip()

    if not em and payer_fallback:
        em, fn, ln = payer_fallback

    return {
        "sequence": (idx + 1) * 10,
        "ticket_label": _norm_str(label) or False,
        "item_type": itype or False,
        "participant_email": em or False,
        "participant_first_name": fn or False,
        "participant_last_name": ln or False,
        "helloasso_item_id": iid_str or False,
    }


def _order_amount_cents_from_items(order):
    """Somme des ``amount`` des lignes (centimes) si la commande ne les agrège pas en scalaire."""
    items = _g(order, "items", "Items")
    if not isinstance(items, list):
        return None
    total = 0.0
    any_ok = False
    for it in items:
        if not isinstance(it, dict):
            continue
        a = _g(it, "amount", "Amount")
        if a is None:
            continue
        try:
            total += float(a)
            any_ok = True
        except (TypeError, ValueError):
            continue
    return total if any_ok else None


def _order_amount_euros(order):
    """Montant total en euros.

    L’API v5 renvoie souvent ``amount`` comme entier (centimes) ou comme objet
    ``{"total": 4500, "vat": 0, "discount": 0}``. Un simple ``float(amount)`` échoue
    sur le dict → 0 € en base ; on lit ``total`` et, à défaut, on somme les lignes.
    """
    if not isinstance(order, dict):
        return False
    raw = _g(order, "amount", "Amount", "totalAmount", "TotalAmount")
    cents = None
    if isinstance(raw, dict):
        tv = raw.get("total")
        if tv is None:
            tv = raw.get("Total")
        if tv is not None:
            try:
                cents = float(tv)
            except (TypeError, ValueError):
                cents = None
    elif raw is not None:
        try:
            cents = float(raw)
        except (TypeError, ValueError):
            cents = None
    if cents is None:
        from_items = _order_amount_cents_from_items(order)
        if from_items is not None:
            cents = from_items
    if cents is None:
        return False
    return round(cents / _HELLOASSO_AMOUNT_CENTS_PER_EURO, 2)


def _order_first_datetime_raw(order):
    """Première date non vide sur la commande API (champs directs ou ``meta`` HelloAsso v5)."""
    if not isinstance(order, dict):
        return None
    for key in (
        "date",
        "Date",
        "orderDate",
        "OrderDate",
        "createdAt",
        "CreatedAt",
    ):
        if key not in order:
            continue
        v = order[key]
        if v is None:
            continue
        if isinstance(v, str) and not v.strip():
            continue
        return v
    meta = _g(order, "meta", "Meta")
    if isinstance(meta, dict):
        for key in ("createdAt", "CreatedAt", "updatedAt", "UpdatedAt"):
            if key not in meta:
                continue
            v = meta[key]
            if v is None:
                continue
            if isinstance(v, str) and not v.strip():
                continue
            return v
    return None


def _partner_display_name(firstname, lastname, email):
    parts = [p for p in [firstname, lastname] if p]
    name = " ".join(parts).strip()
    return name or (email or _("Contact HelloAsso"))


def _pick_payer_partner_by_email(Partner, payer_em, payer_fn, payer_ln, stats):
    """
    Partenaire payeur existant pour cet e-mail, ou recordset vide pour en créer un.

    Plusieurs ``res.partner`` avec le même e-mail : départage par proximité avec le nom
    HelloAsso (prénom/nom contenus dans ``name``), sinon partenaire au plus petit id
    (création la plus ancienne). Évite de bloquer la synchro ; un avertissement est journalisé.
    """
    by_mail = Partner.search([("email", "=ilike", payer_em)], order="id asc")
    if not by_mail:
        return Partner.browse()
    if len(by_mail) == 1:
        return by_mail[0]

    fn_norm = _norm_str(payer_fn).lower()
    ln_norm = _norm_str(payer_ln).lower()
    candidates = by_mail
    if fn_norm or ln_norm:
        narrowed = Partner.browse()
        for p in by_mail:
            pname = _norm_str(p.name).lower()
            ok_fn = not fn_norm or fn_norm in pname
            ok_ln = not ln_norm or ln_norm in pname
            if ok_fn and ok_ln:
                narrowed |= p
        if len(narrowed) == 1:
            stats["shared_email_partner_picked"] += 1
            _logger.info(
                "HelloAsso billetterie: e-mail %s départagé par nom affiché → partenaire id=%s",
                payer_em,
                narrowed.id,
            )
            return narrowed[0]
        if len(narrowed) > 1:
            candidates = narrowed

    chosen = candidates.sorted("id")[0]
    stats["shared_email_partner_picked"] += 1
    _logger.warning(
        "HelloAsso billetterie: e-mail %s partagé par %s partenaires ; choix déterministe id=%s (%s). "
        "Fusionnez les doublons dans Contacts si besoin.",
        payer_em,
        len(by_mail),
        chosen.id,
        chosen.display_name,
    )
    return chosen


def pick_first_form_by_type(forms_list, wanted_type):
    wt = (wanted_type or "").strip().lower()
    if not wt:
        return None
    for form in forms_list or []:
        ft = form_light_form_type_str(form)
        if ft and ft.lower() == wt:
            return form
    return None


def resolve_billetterie_form(
    organization_slug,
    access_token,
    use_sandbox,
    form_type,
    form_slug=None,
):
    """
    Retourne le dict « form light » HelloAsso pour la billetterie.

    Si ``form_slug`` est renseigné : on retourne un dict minimal {formSlug, formType, title}
    pour appeler directement l’API (le type doit correspondre au chemin v5).

    Sinon : premier formulaire dont le formType correspond (insensible à la casse).
    """
    slug = (organization_slug or "").strip()
    ft = (form_type or "Event").strip() or "Event"
    fs = (form_slug or "").strip()

    if fs:
        return {
            "formSlug": fs,
            "formType": ft,
            "title": fs,
        }

    forms_items = None
    try:
        forms_items, _ = fetch_organization_forms(
            slug, access_token, use_sandbox, form_types=[ft]
        )
    except HelloAssoClientError:
        pass

    if not forms_items:
        forms_items, _ = fetch_organization_forms(
            slug, access_token, use_sandbox, form_types=None
        )

    return pick_first_form_by_type(forms_items, ft)


def format_billetterie_sync_result_message(stats):
    """Texte détaillé pour notification / logs après run_billetterie_orders_sync."""
    parts = [
        _("Formulaire API : type « %s », slug « %s »")
        % (stats.get("resolved_form_type") or "—", stats.get("resolved_form_slug") or "—"),
    ]
    fpc = stats.get("first_page_count")
    if fpc is not None:
        parts.append(_("Nombre de commandes sur la 1ʳᵉ page API : %s") % fpc)
    art = stats.get("api_reported_total")
    if art is not None:
        parts.append(_("Total commandes annoncé par l’API : %s") % art)
    parts.append(
        _("Créations : %s — mises à jour : %s — ignorées : %s")
        % (stats["created"], stats["updated"], stats["skipped"])
    )
    parts.append(
        _("Prises en charge après contrôle payeur : %s") % stats.get("processed", 0)
    )
    if stats.get("skip_bad_state"):
        parts.append(_("Ignorées (statut refusé / annulé / expiré…) : %s") % stats["skip_bad_state"])
    if stats.get("skip_no_payer_email"):
        parts.append(_("Ignorées (pas d’e-mail payeur dans la réponse API) : %s") % stats["skip_no_payer_email"])
    if stats.get("skip_ambiguous_partner"):
        parts.append(_("Ignorées (e-mail payeur ambigu dans Odoo) : %s") % stats["skip_ambiguous_partner"])
    if stats.get("shared_email_partner_picked"):
        parts.append(
            _("Payeur choisi parmi plusieurs contacts avec le même e-mail : %s (voir journal serveur).")
            % stats["shared_email_partner_picked"]
        )
    if stats.get("skip_no_id"):
        parts.append(_("Ignorées (sans identifiant commande) : %s") % stats["skip_no_id"])
    if stats.get("skip_not_dict"):
        parts.append(_("Ignorées (ligne API invalide) : %s") % stats["skip_not_dict"])
    if stats.get("skip_duplicate_odoo"):
        parts.append(_("Ignorées (doublon technique Odoo pour un même id commande) : %s") % stats["skip_duplicate_odoo"])
    if (
        stats.get("first_page_count") == 0
        and not stats.get("errors")
        and stats.get("created", 0) == 0
        and stats.get("updated", 0) == 0
    ):
        parts.append(
            _(
                "Aucune commande sur ce formulaire : vérifier le slug événement (billetterie), "
                "le type (souvent Event), et que vous êtes en production ou sandbox comme sur HelloAsso."
            )
        )
    if stats.get("errors"):
        parts.append(
            _("Erreurs / messages : %s")
            % " ; ".join(str(x) for x in stats["errors"][:8])
        )
    return "\n".join(parts)


def run_billetterie_orders_sync(
    env,
    organization_slug,
    client_id,
    client_secret,
    use_sandbox,
    form_type,
    form_slug=None,
    catalog_form_id=None,
    log_origin=None,
):
    """
    Retourne un dict : processed, created, updated, skipped, errors (liste de messages).

    :param catalog_form_id: id d’un ``dorevia.helloasso.billetterie.form`` (inventaire) pour
        lier les commandes créées / mises à jour à cette ligne.
    :param log_origin: si renseigné, enregistre une ligne dans ``dorevia.helloasso.logentry``.
    """
    Order = env["dorevia.helloasso.billetterie.order"]
    Line = env["dorevia.helloasso.billetterie.line"]
    Partner = env["res.partner"]

    org_slug = (organization_slug or "").strip()
    stats = {
        "processed": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": [],
        "resolved_form_type": None,
        "resolved_form_slug": None,
        "first_page_count": None,
        "api_reported_total": None,
        "skip_not_dict": 0,
        "skip_bad_state": 0,
        "skip_no_id": 0,
        "skip_no_payer_email": 0,
        "skip_ambiguous_partner": 0,
        "shared_email_partner_picked": 0,
        "skip_duplicate_odoo": 0,
    }

    try:
        token_payload = fetch_client_credentials_token(
            client_id, client_secret, use_sandbox
        )
    except HelloAssoClientError as err:
        raise UserError(str(err)) from err

    token = token_payload["access_token"]
    billet_form = resolve_billetterie_form(
        org_slug, token, use_sandbox, form_type or "Event", form_slug
    )
    if not billet_form:
        raise UserError(
            _(
                "Aucun formulaire billetterie trouvé pour le type « %s ». "
                "Vérifiez le formType ou renseignez un formSlug explicite."
            )
            % (form_type or "Event")
        )

    fslug = form_light_slug(billet_form)
    ftype = form_light_form_type_str(billet_form) or (form_type or "Event")
    if not fslug:
        raise UserError(_("Le formulaire billetterie n’a pas de formSlug exploitable."))

    stats["resolved_form_type"] = ftype
    stats["resolved_form_slug"] = fslug

    page = 1
    while page <= _MAX_ORDER_PAGES:
        try:
            items, _total, _raw = fetch_form_orders_page(
                org_slug,
                ftype,
                fslug,
                token,
                use_sandbox,
                page_index=page,
                page_size=_ORDER_PAGE_SIZE,
            )
        except HelloAssoClientError as err:
            stats["errors"].append(str(err))
            _logger.warning("HelloAsso billetterie orders page %s: %s", page, err)
            break

        if page == 1:
            stats["first_page_count"] = len(items) if items else 0
            stats["api_reported_total"] = _total

        if not items:
            break

        for order in items:
            if not isinstance(order, dict):
                stats["skipped"] += 1
                stats["skip_not_dict"] += 1
                continue
            if not order_eligible_mvp(order):
                stats["skipped"] += 1
                stats["skip_bad_state"] += 1
                continue

            oid = _order_id(order)
            if not oid:
                stats["skipped"] += 1
                stats["skip_no_id"] += 1
                stats["errors"].append(_("Commande sans id, ignorée."))
                continue

            payer_em, payer_fn, payer_ln = _order_payer(order)
            if not payer_em:
                stats["skipped"] += 1
                stats["skip_no_payer_email"] += 1
                _logger.warning("HelloAsso billetterie: commande %s sans e-mail payeur", oid)
                continue

            payer_partner = _pick_payer_partner_by_email(
                Partner, payer_em, payer_fn, payer_ln, stats
            )
            if not payer_partner:
                payer_partner = Partner.create(
                    {
                        "name": _partner_display_name(payer_fn, payer_ln, payer_em),
                        "email": payer_em,
                    }
                )

            amt = _order_amount_euros(order)
            dt = parse_helloasso_api_datetime(_order_first_datetime_raw(order))
            st_raw = _order_state_raw_for_storage(order) or False

            order_vals = {
                "helloasso_order_id": oid,
                "form_slug": fslug,
                "form_type": ftype,
                "state_raw": st_raw,
                "amount_total": amt if amt is not False else False,
                "date_order": dt or False,
                "payer_partner_id": payer_partner.id,
                "sync_status": "synced",
                "last_sync_at": fields.Datetime.now(),
                "sync_message": False,
            }
            if catalog_form_id:
                order_vals["catalog_form_id"] = catalog_form_id

            existing = Order.search([("helloasso_order_id", "=", oid)])
            if len(existing) > 1:
                stats["skipped"] += 1
                stats["skip_duplicate_odoo"] += 1
                _logger.warning(
                    "HelloAsso billetterie: plusieurs enregistrements pour commande %s", oid
                )
                continue

            stats["processed"] += 1

            payer_fb = (payer_em, payer_fn, payer_ln)
            items_list = _g(order, "items", "Items")
            line_vals_list = []
            if isinstance(items_list, list) and items_list:
                for i, it in enumerate(items_list):
                    if not isinstance(it, dict):
                        continue
                    line_vals_list.append(_line_vals_from_item(i, it, payer_fb))
            if not line_vals_list:
                line_vals_list.append(
                    {
                        "sequence": 10,
                        "ticket_label": False,
                        "item_type": False,
                        "participant_email": payer_em or False,
                        "participant_first_name": payer_fn or False,
                        "participant_last_name": payer_ln or False,
                    }
                )

            if existing:
                existing.line_ids.unlink()
                existing.write(order_vals)
                rec = existing
                for lv in line_vals_list:
                    vals = dict(lv)
                    vals["order_id"] = rec.id
                    Line.create(vals)
                stats["updated"] += 1
            else:
                order_vals["line_ids"] = [(0, 0, dict(lv)) for lv in line_vals_list]
                rec = Order.create(order_vals)
                stats["created"] += 1

            _logger.info(
                "HelloAsso billetterie: commande %s → enregistrement Odoo id=%s",
                oid,
                rec.id,
            )

        if len(items) < _ORDER_PAGE_SIZE:
            break
        page += 1

    if log_origin:
        from odoo.addons.dorevia_helloasso_connector.models.helloasso_sync_log import (
            helloasso_sync_log_push,
        )

        helloasso_sync_log_push(
            env,
            "billetterie_orders",
            log_origin,
            stats,
        )
    return stats


def build_billetterie_preview_report(
    env,
    organization_slug,
    client_id,
    client_secret,
    use_sandbox,
    form_type=None,
    form_slug=None,
):
    """Texte multi-lignes pour le wizard de prévisualisation (sans écriture métier)."""
    from odoo.addons.dorevia_helloasso_connector.models.helloasso_client import (
        order_or_payment_trace_ids,
    )

    icp = env["ir.config_parameter"].sudo()
    if form_type is None:
        form_type = (icp.get_param("dorevia_helloasso_billetterie.form_type") or "Event").strip()
    else:
        form_type = (form_type or "Event").strip()
    if form_slug is None:
        form_slug = (icp.get_param("dorevia_helloasso_billetterie.form_slug") or "").strip()
    else:
        form_slug = (form_slug or "").strip()

    slug = (organization_slug or "").strip()
    lines = [
        _("Aperçu billetterie — lecture seule, aucune écriture Odoo."),
        _("Organisation : %s — formType paramétré : %s") % (slug, form_type),
    ]
    if form_slug:
        lines.append(_("Form slug forcé : %s") % form_slug)

    try:
        token_payload = fetch_client_credentials_token(
            client_id, client_secret, use_sandbox
        )
    except HelloAssoClientError as err:
        return "\n".join(lines + [str(err)])

    token = token_payload["access_token"]
    billet_form = resolve_billetterie_form(
        slug, token, use_sandbox, form_type, form_slug or None
    )
    if not billet_form:
        lines.append(
            _("Aucun formulaire trouvé pour le type « %s ».") % form_type,
        )
        return "\n".join(lines)

    fslug = form_light_slug(billet_form)
    ftype = form_light_form_type_str(billet_form) or form_type
    lines.append("")
    lines.append(_("— Formulaire retenu —"))
    lines.append(_("Titre : %s") % (form_light_title(billet_form) or "—"))
    lines.append(_("formType : %s") % ftype)
    lines.append(_("formSlug : %s") % (fslug or "—"))

    if not fslug:
        return "\n".join(lines)

    try:
        ord_items, order_total, _raw = fetch_form_orders_page(
            slug, ftype, fslug, token, use_sandbox, page_index=1, page_size=5
        )
    except HelloAssoClientError as err:
        lines.append(_("Commandes : %s") % str(err))
        return "\n".join(lines)

    if order_total is not None:
        lines.append(_("Commandes (total déclaré API) : %s") % order_total)
    elif ord_items is not None:
        lines.append(_("Commandes sur cette page : %s") % len(ord_items))

    if ord_items:
        trace = "; ".join(order_or_payment_trace_ids(ord_items[0]))
        if trace:
            lines.append(_("Ex. identifiants commande : %s") % trace)

    return "\n".join(lines)
