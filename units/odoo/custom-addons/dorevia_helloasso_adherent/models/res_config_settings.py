# -*- coding: utf-8 -*-

import logging

from odoo import _, fields, models
from odoo.exceptions import UserError

from .helloasso_client import (
    HelloAssoClientError,
    fetch_client_credentials_token,
    fetch_form_payments_page,
    fetch_form_orders_page,
    fetch_form_types_sample,
    fetch_organization_forms,
    form_light_slug,
    form_light_title,
    order_or_payment_trace_ids,
    pick_first_membership_form,
    form_light_form_type_str,
    summarize_form_type_entry,
)

_logger = logging.getLogger(__name__)


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    helloasso_use_sandbox = fields.Boolean(
        string="HelloAsso — utiliser le sandbox",
        config_parameter="dorevia_helloasso.use_sandbox",
        help="Si activé, les appels API cibleront l’environnement de test HelloAsso.",
    )
    helloasso_client_id = fields.Char(
        string="HelloAsso — client ID",
        config_parameter="dorevia_helloasso.client_id",
    )
    helloasso_client_secret = fields.Char(
        string="HelloAsso — client secret",
        config_parameter="dorevia_helloasso.client_secret",
    )
    helloasso_organization_slug = fields.Char(
        string="HelloAsso — slug organisation",
        config_parameter="dorevia_helloasso.organization_slug",
        help="organizationSlug dans les chemins API v5.",
    )

    def action_helloasso_test_connection(self):
        """OAuth client_credentials puis ping GET formTypes si slug renseigné (REF_API §2.2, §2.4)."""
        self.ensure_one()
        if not (self.helloasso_client_id and self.helloasso_client_secret):
            raise UserError(
                _("Renseignez le client ID et le client secret HelloAsso avant le test.")
            )
        use_sandbox = bool(self.helloasso_use_sandbox)
        try:
            token_payload = fetch_client_credentials_token(
                self.helloasso_client_id,
                self.helloasso_client_secret,
                use_sandbox,
            )
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        env_label = _("sandbox") if use_sandbox else _("production")
        parts = [
            _("Jeton d’accès HelloAsso obtenu avec succès (environnement : %s).") % env_label,
        ]
        expires = token_payload.get("expires_in")
        if expires is not None:
            parts.append(_("Durée indicative du jeton : %s secondes (cf. doc HelloAsso).") % expires)

        slug = (self.helloasso_organization_slug or "").strip()
        if slug:
            try:
                _items, count = fetch_form_types_sample(
                    slug,
                    token_payload["access_token"],
                    use_sandbox,
                )
            except HelloAssoClientError as err:
                raise UserError(
                    _(
                        "Le jeton est valide, mais la lecture des types de formulaires a échoué : %s"
                    )
                    % str(err)
                ) from err
            if count is not None:
                parts.append(
                    _("Lecture API OK : %s type(s) de formulaire(s) pour l’organisation « %s ».")
                    % (count, slug)
                )
            else:
                parts.append(
                    _("Lecture API OK pour l’organisation « %s » (réponse sans liste exploitable).")
                    % slug
                )
        else:
            parts.append(
                _(
                    "Renseignez aussi le slug organisation pour valider en plus l’appel « formTypes »."
                )
            )

        message = "\n".join(parts)
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("HelloAsso — connexion"),
                "message": message,
                "type": "success",
                "sticky": True,
            },
        }

    def action_helloasso_preview_data(self):
        """Lecture seule API : formTypes, formulaires Membership, volumes commandes/paiements (SPEC REF §3)."""
        self.ensure_one()
        if not (self.helloasso_client_id and self.helloasso_client_secret):
            raise UserError(
                _("Renseignez le client ID et le client secret HelloAsso avant la prévisualisation.")
            )
        slug = (self.helloasso_organization_slug or "").strip()
        if not slug:
            raise UserError(
                _("Renseignez le slug organisation pour prévisualiser les données HelloAsso.")
            )
        use_sandbox = bool(self.helloasso_use_sandbox)
        try:
            token_payload = fetch_client_credentials_token(
                self.helloasso_client_id,
                self.helloasso_client_secret,
                use_sandbox,
            )
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        token = token_payload["access_token"]

        try:
            ft_items, ft_count = fetch_form_types_sample(slug, token, use_sandbox)
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        forms_items = None
        forms_total = None
        membership_filter_nonempty = False
        try:
            forms_items, forms_total = fetch_organization_forms(
                slug, token, use_sandbox, form_types=["Membership"]
            )
            if forms_items:
                membership_filter_nonempty = True
        except HelloAssoClientError as err:
            _logger.warning("HelloAsso forms (filtre Membership) : %s", err)

        if not forms_items:
            try:
                forms_items, forms_total = fetch_organization_forms(
                    slug, token, use_sandbox, form_types=None
                )
            except HelloAssoClientError as err:
                raise UserError(str(err)) from err

        membership_form = pick_first_membership_form(forms_items or [])
        if (
            not membership_form
            and membership_filter_nonempty
            and forms_items
        ):
            try:
                alt_items, alt_total = fetch_organization_forms(
                    slug, token, use_sandbox, form_types=None
                )
                membership_form = pick_first_membership_form(alt_items or [])
                if membership_form:
                    forms_items, forms_total = alt_items, alt_total
            except HelloAssoClientError as err:
                _logger.warning("HelloAsso forms (2e passe sans filtre) : %s", err)

        order_total = payment_total = None
        order_ids_line = payment_ids_line = ""
        orders_err = payments_err = None

        if membership_form:
            fslug = form_light_slug(membership_form)
            ftype = form_light_form_type_str(membership_form) or "Membership"
            try:
                ord_items, order_total = fetch_form_orders_page(
                    slug, ftype, fslug, token, use_sandbox, page_index=1, page_size=5
                )
                if ord_items:
                    order_ids_line = "; ".join(order_or_payment_trace_ids(ord_items[0]))
            except HelloAssoClientError as err:
                orders_err = str(err)
                _logger.info("HelloAsso prévisualisation commandes : %s", err)
            try:
                pay_items, payment_total = fetch_form_payments_page(
                    slug, ftype, fslug, token, use_sandbox, page_index=1, page_size=5
                )
                if pay_items:
                    payment_ids_line = "; ".join(order_or_payment_trace_ids(pay_items[0]))
            except HelloAssoClientError as err:
                payments_err = str(err)
                _logger.info("HelloAsso prévisualisation paiements : %s", err)

        _logger.info(
            "HelloAsso prévisualisation (org=%s, sandbox=%s) formTypes=%s forms=%s membership=%s",
            slug,
            use_sandbox,
            ft_count,
            len(forms_items or []),
            form_light_slug(membership_form or {}) or "(aucun)",
        )

        env_label = _("sandbox") if use_sandbox else _("production")
        lines = [
            _("Aperçu non destructif — aucune écriture Odoo."),
            _("Environnement : %s — organisation : %s") % (env_label, slug),
        ]
        if ft_count is not None:
            lines.append(_("Types de formulaires (formTypes) : %s") % ft_count)
        if forms_total is not None:
            lines.append(_("Formulaires listés (filtre / pagination) : total API ≈ %s") % forms_total)
        elif forms_items is not None:
            lines.append(_("Formulaires sur cette requête : %s") % len(forms_items))

        if membership_form:
            lines.append("")
            lines.append(_("— Formulaire adhésion (premier « Membership ») —"))
            lines.append(_("Titre : %s") % (form_light_title(membership_form) or "—"))
            lines.append(_("formType : %s") % (form_light_form_type_str(membership_form) or "—"))
            lines.append(_("formSlug : %s") % (form_light_slug(membership_form) or "—"))
            if order_total is not None:
                lines.append(_("Commandes (total déclaré par l’API) : %s") % order_total)
            elif orders_err:
                lines.append(_("Commandes : %s") % orders_err)
            else:
                lines.append(_("Commandes : (aucune donnée)"))
            if order_ids_line:
                lines.append(_("Ex. identifiants commande : %s") % order_ids_line)
            if payment_total is not None:
                lines.append(_("Paiements (total déclaré par l’API) : %s") % payment_total)
            elif payments_err:
                lines.append(_("Paiements : %s") % payments_err)
            else:
                lines.append(_("Paiements : (aucune donnée)"))
            if payment_ids_line:
                lines.append(_("Ex. identifiants paiement : %s") % payment_ids_line)
            if orders_err and payments_err and "403" in (orders_err + payments_err):
                lines.append(
                    _(
                        "Astuce : la doc HelloAsso exige rôles FormAdmin / OrganizationAdmin "
                        "et privilège AccessTransactions pour commandes et paiements."
                    )
                )
        else:
            lines.append("")
            lines.append(_("Aucun formulaire de type « Membership » trouvé dans la liste."))
            if forms_items:
                max_rows = 8
                lines.append(_("Aperçu des formulaires retournés (types variés) :"))
                for i, f in enumerate(forms_items[:max_rows], start=1):
                    lines.append(
                        "  [%s] %s | slug=%s"
                        % (
                            i,
                            form_light_form_type_str(f) or "?",
                            form_light_slug(f) or "?",
                        )
                    )
                if len(forms_items) > max_rows:
                    lines.append(_("… (%s de plus)") % (len(forms_items) - max_rows))

        if ft_items:
            lines.append("")
            lines.append(_("— Détail formTypes (référence) —"))
            max_rows = 12
            for i, it in enumerate(ft_items[:max_rows], start=1):
                lines.append(summarize_form_type_entry(it, i))
            if len(ft_items) > max_rows:
                lines.append(_("… et %s autre(s).") % (len(ft_items) - max_rows))

        message = "\n".join(lines)
        wizard = self.env["dorevia.helloasso.preview.wizard"].create(
            {"preview_text": message}
        )
        return {
            "type": "ir.actions.act_window",
            "name": _("HelloAsso — prévisualisation (lecture seule)"),
            "res_model": "dorevia.helloasso.preview.wizard",
            "res_id": wizard.id,
            "view_mode": "form",
            "target": "new",
        }

    def action_helloasso_sync_members(self):
        """Stub : import adhérents à implémenter (mapping §6.2, rapprochement §7)."""
        self.ensure_one()
        if not self.helloasso_organization_slug:
            raise UserError(_("Renseignez le slug organisation HelloAsso."))
        raise UserError(
            _(
                "Synchronisation non implémentée dans ce squelette MVP. "
                "À brancher après audit payloads (commandes / paiements) et table SPEC §6.2."
            )
        )
