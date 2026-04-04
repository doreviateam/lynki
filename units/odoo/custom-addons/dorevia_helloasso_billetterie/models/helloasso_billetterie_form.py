# -*- coding: utf-8 -*-
"""Inventaire des formulaires HelloAsso (billetteries / campagnes) — avant synchro commandes."""

import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError

from odoo.addons.dorevia_helloasso_adherent.models.helloasso_client import (
    HelloAssoClientError,
    fetch_client_credentials_token,
    fetch_organization_forms,
    form_light_form_type_str,
    form_light_slug,
    form_light_title,
)

_logger = logging.getLogger(__name__)

_FORMS_PAGE_SIZE = 50
_MAX_FORM_PAGES = 40


def fetch_all_organization_forms(organization_slug, access_token, use_sandbox, form_types=None):
    """Parcourt la pagination GET /organizations/{slug}/forms. Retourne (items, nombre_de_pages_lues)."""
    slug = (organization_slug or "").strip()
    if not slug:
        return [], 0
    out = []
    pages_read = 0
    page = 1
    while page <= _MAX_FORM_PAGES:
        try:
            items, _total = fetch_organization_forms(
                slug,
                access_token,
                use_sandbox,
                form_types=form_types,
                page_index=page,
                page_size=_FORMS_PAGE_SIZE,
            )
        except HelloAssoClientError as err:
            _logger.warning("HelloAsso forms page %s: %s", page, err)
            raise
        if not items:
            break
        pages_read += 1
        out.extend(items)
        if len(items) < _FORMS_PAGE_SIZE:
            break
        page += 1
    return out, pages_read


def run_billetterie_forms_inventory(env, organization_slug, client_id, client_secret, use_sandbox):
    """
    Met à jour ``dorevia.helloasso.billetterie.form`` depuis l’API (tous les types de formulaires).
    Retourne un dict stats pour notification.
    """
    Form = env["dorevia.helloasso.billetterie.form"].sudo()
    org_slug = (organization_slug or "").strip()
    stats = {
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "pages": 0,
        "total_api_items": 0,
        "errors": [],
    }

    try:
        token_payload = fetch_client_credentials_token(
            client_id, client_secret, use_sandbox
        )
    except HelloAssoClientError as err:
        raise UserError(str(err)) from err

    token = token_payload["access_token"]
    try:
        items, pages_read = fetch_all_organization_forms(
            org_slug, token, use_sandbox, form_types=None
        )
    except HelloAssoClientError as err:
        stats["errors"].append(str(err))
        return stats

    stats["total_api_items"] = len(items)
    stats["pages"] = pages_read
    now = fields.Datetime.now()

    for raw in items:
        if not isinstance(raw, dict):
            stats["skipped"] += 1
            continue
        fslug = form_light_slug(raw)
        ftype = form_light_form_type_str(raw)
        title = form_light_title(raw) or fslug or _("(sans titre)")
        if not fslug or not ftype:
            stats["skipped"] += 1
            continue

        domain = [
            ("use_sandbox", "=", use_sandbox),
            ("organization_slug", "=", org_slug),
            ("form_type", "=", ftype),
            ("form_slug", "=", fslug),
        ]
        vals = {
            "use_sandbox": use_sandbox,
            "organization_slug": org_slug,
            "form_type": ftype,
            "form_slug": fslug,
            "helloasso_title": title,
            "last_inventory_at": now,
        }
        existing = Form.search(domain, limit=1)
        if existing:
            existing.write(vals)
            stats["updated"] += 1
        else:
            Form.create(vals)
            stats["created"] += 1

    return stats


def format_inventory_result_message(stats):
    parts = [
        _("Formulaires lus depuis l’API : %s (pages : %s)")
        % (stats.get("total_api_items", 0), stats.get("pages", 0)),
        _("Créations : %s — mises à jour : %s — ignorés (incomplets) : %s")
        % (stats["created"], stats["updated"], stats["skipped"]),
    ]
    if stats.get("errors"):
        parts.append(_("Erreurs : %s") % " ; ".join(str(x) for x in stats["errors"][:5]))
    return "\n".join(parts)


class DoreviaHelloassoBilletterieForm(models.Model):
    _name = "dorevia.helloasso.billetterie.form"
    _description = "Formulaire HelloAsso (inventaire billetterie)"
    _order = "form_type asc, form_slug asc"

    name = fields.Char(
        string="Libellé",
        compute="_compute_name",
        store=True,
    )
    helloasso_title = fields.Char(
        string="Titre HelloAsso",
        help="Libellé renvoyé par l’API (liste des formulaires).",
    )
    use_sandbox = fields.Boolean(
        string="Sandbox",
        required=True,
        default=True,
        help="Si coché, ce formulaire a été inventorié depuis l’API sandbox.",
    )
    organization_slug = fields.Char(
        string="Organisation (slug)",
        required=True,
        index=True,
    )
    form_type = fields.Char(
        string="Form type",
        required=True,
        index=True,
        help="Ex. Event, Membership, Donation… (valeur API).",
    )
    form_slug = fields.Char(
        string="Form slug",
        required=True,
        index=True,
    )
    last_inventory_at = fields.Datetime(string="Dernier inventaire", readonly=True)
    comment = fields.Text(string="Commentaire métier")

    _sql_constraints = [
        (
            "helloasso_billetterie_form_unique",
            "unique(use_sandbox, organization_slug, form_type, form_slug)",
            "Ce formulaire HelloAsso est déjà inventorié pour cet environnement et cette organisation.",
        ),
    ]

    @api.depends("helloasso_title", "form_slug", "form_type")
    def _compute_name(self):
        for rec in self:
            t = (rec.helloasso_title or "").strip()
            rec.name = t or "%s — %s" % (rec.form_type or "?", rec.form_slug or "?")

    @api.model
    def action_refresh_inventory_from_helloasso(self):
        """Bouton liste : recharge l’inventaire depuis les paramètres HelloAsso (adhérent)."""
        icp = self.env["ir.config_parameter"].sudo()
        cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        csec = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        if not (cid and csec):
            raise UserError(
                _(
                    "Identifiants API HelloAsso manquants. "
                    "Renseignez-les dans Paramètres généraux (bloc HelloAsso adhérent)."
                )
            )
        if not slug:
            raise UserError(_("Renseignez le slug organisation HelloAsso dans les paramètres."))
        use_sandbox = icp.get_param("dorevia_helloasso.use_sandbox") == "True"

        stats = run_billetterie_forms_inventory(
            self.env, slug, cid, csec, use_sandbox
        )
        message = format_inventory_result_message(stats)
        notif_type = "warning" if stats.get("errors") else "success"
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("Inventaire des formulaires HelloAsso"),
                "message": message,
                "type": notif_type,
                "sticky": True,
            },
        }
