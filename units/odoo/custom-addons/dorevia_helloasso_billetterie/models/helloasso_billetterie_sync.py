# -*- coding: utf-8 -*-
"""Synchro MVP billetterie : lecture commandes formulaire Event (ou type paramétrable), ancrage order.id."""

import logging

from odoo import _, fields
from odoo.exceptions import UserError

from odoo.addons.dorevia_helloasso_adherent.models.helloasso_client import (
    HelloAssoClientError,
    fetch_client_credentials_token,
    fetch_form_orders_page,
    fetch_organization_forms,
    form_light_form_type_str,
    form_light_slug,
    form_light_title,
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


def order_eligible_mvp(order):
    """Exclut les commandes annulées / refusées ; le reste est traité (MVP)."""
    st = _norm_str(_g(order, "state", "State")).lower()
    if st and st in _BAD_ORDER_STATES:
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
    payer = _g(order, "payer", "Payer")
    return _payer_identity_from_dict(payer)


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


def _order_amount_euros(order):
    raw = _g(order, "amount", "Amount", "totalAmount", "TotalAmount")
    if raw is None:
        return False
    try:
        cents = float(raw)
    except (TypeError, ValueError):
        return False
    return round(cents / _HELLOASSO_AMOUNT_CENTS_PER_EURO, 2)


def _order_datetime(raw):
    if raw is None:
        return False
    try:
        return fields.Datetime.to_datetime(raw)
    except Exception:
        return False


def _partner_display_name(firstname, lastname, email):
    parts = [p for p in [firstname, lastname] if p]
    name = " ".join(parts).strip()
    return name or (email or _("Contact HelloAsso"))


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


def run_billetterie_orders_sync(
    env,
    organization_slug,
    client_id,
    client_secret,
    use_sandbox,
    form_type,
    form_slug=None,
):
    """
    Retourne un dict : processed, created, updated, skipped, errors (liste de messages).
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

        if not items:
            break

        for order in items:
            if not isinstance(order, dict):
                stats["skipped"] += 1
                continue
            if not order_eligible_mvp(order):
                stats["skipped"] += 1
                continue

            oid = _order_id(order)
            if not oid:
                stats["skipped"] += 1
                stats["errors"].append(_("Commande sans id, ignorée."))
                continue

            stats["processed"] += 1
            payer_em, payer_fn, payer_ln = _order_payer(order)
            if not payer_em:
                stats["skipped"] += 1
                _logger.warning("HelloAsso billetterie: commande %s sans e-mail payeur", oid)
                continue

            by_mail = Partner.search([("email", "=ilike", payer_em)])
            if len(by_mail) > 1:
                stats["skipped"] += 1
                stats["errors"].append(
                    _("E-mail payeur ambigu pour la commande %s : %s partenaires.")
                    % (oid, len(by_mail))
                )
                continue

            payer_partner = by_mail[:1]
            if payer_partner:
                payer_partner = payer_partner[0]
            else:
                payer_partner = Partner.create(
                    {
                        "name": _partner_display_name(payer_fn, payer_ln, payer_em),
                        "email": payer_em,
                    }
                )

            amt = _order_amount_euros(order)
            dt = _order_datetime(_g(order, "date", "Date", "createdAt", "CreatedAt"))
            st_raw = _norm_str(_g(order, "state", "State")) or False

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

            existing = Order.search([("helloasso_order_id", "=", oid)])
            if len(existing) > 1:
                stats["skipped"] += 1
                _logger.warning(
                    "HelloAsso billetterie: plusieurs enregistrements pour commande %s", oid
                )
                continue

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
    from odoo.addons.dorevia_helloasso_adherent.models.helloasso_client import (
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
