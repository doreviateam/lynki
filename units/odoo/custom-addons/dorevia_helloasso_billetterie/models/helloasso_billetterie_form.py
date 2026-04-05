# -*- coding: utf-8 -*-
"""Inventaire des formulaires HelloAsso (flux billetterie : événements / billets) — avant synchro commandes."""

import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError

from .helloasso_ux_labels import form_type_label_for_display
from odoo.addons.dorevia_helloasso_connector.models.helloasso_sync_log import (
    helloasso_sync_log_push,
)
from .helloasso_billetterie_sync import (
    format_billetterie_sync_result_message,
    run_billetterie_orders_sync,
)
from odoo.addons.dorevia_helloasso_connector.models.helloasso_client import (
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
    Met à jour ``dorevia.helloasso.billetterie.form`` depuis l’API (``formTypes=Event`` : billetteries).
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
            org_slug, token, use_sandbox, form_types=["Event"]
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
        _("Campagnes lues depuis HelloAsso : %s (pages : %s)")
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
        string="Billetterie",
        compute="_compute_name",
        store=True,
    )
    helloasso_title = fields.Char(
        string="Titre sur HelloAsso",
        help="Libellé tel qu’affiché sur HelloAsso pour cette campagne.",
    )
    use_sandbox = fields.Boolean(
        string="Essai HelloAsso",
        required=True,
        default=True,
        help="Coché si cette ligne provient du mode test HelloAsso (bac à sable).",
    )
    organization_slug = fields.Char(
        string="Réf. organisation HelloAsso",
        required=True,
        index=True,
        help="Identifiant technique d’organisation côté HelloAsso.",
    )
    form_type = fields.Char(
        string="Type (HelloAsso)",
        required=True,
        index=True,
        help="Valeur technique côté HelloAsso ; la colonne « Type » affiche un libellé métier.",
    )
    form_slug = fields.Char(
        string="Identifiant HelloAsso",
        required=True,
        index=True,
        help="Référence technique de la campagne sur HelloAsso.",
    )
    last_inventory_at = fields.Datetime(
        string="Dernière mise à jour",
        readonly=True,
    )
    comment = fields.Text(string="Commentaire métier")
    order_ids = fields.One2many(
        "dorevia.helloasso.billetterie.order",
        "catalog_form_id",
        string="Commandes (liées)",
    )
    order_count = fields.Integer(
        string="Nombre de commandes",
        compute="_compute_order_count",
    )

    _sql_constraints = [
        (
            "helloasso_billetterie_form_unique",
            "unique(use_sandbox, organization_slug, form_type, form_slug)",
            "Ce formulaire HelloAsso est déjà inventorié pour cet environnement et cette organisation.",
        ),
    ]

    @api.depends("helloasso_title", "form_slug", "form_type", "billetterie_type_caption")
    def _compute_name(self):
        for rec in self:
            t = (rec.helloasso_title or "").strip()
            type_label = rec.billetterie_type_caption or form_type_label_for_display(
                rec.form_type
            )
            rec.name = t or "%s — %s" % (type_label or "?", rec.form_slug or "?")

    @api.depends("order_ids")
    def _compute_order_count(self):
        for rec in self:
            rec.order_count = len(rec.order_ids)

    def _helloasso_api_credentials_aligned(self):
        """Client ID / secret + cohérence sandbox et slug organisation avec les paramètres."""
        self.ensure_one()
        icp = self.env["ir.config_parameter"].sudo()
        cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        csec = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        if not (cid and csec):
            raise UserError(
                _(
                    "Identifiants HelloAsso manquants. "
                    "Renseignez-les dans Paramètres généraux (bloc HelloAsso adhérent)."
                )
            )
        icp_slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        icp_sb = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        if icp_sb != self.use_sandbox:
            raise UserError(
                _(
                    "L’environnement des paramètres (essai ou production HelloAsso) doit correspondre "
                    "à la colonne « Essai HelloAsso » de cette ligne. Actualisez la liste ou les paramètres."
                )
            )
        if icp_slug.lower() != (self.organization_slug or "").strip().lower():
            raise UserError(
                _(
                    "L’organisation renseignée dans les paramètres (%s) ne correspond pas à celle de cette ligne (%s)."
                )
                % (icp_slug or _("(vide)"), self.organization_slug)
            )
        return cid, csec

    def action_open_orders(self, *args, **kwargs):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Commandes billetterie"),
            "res_model": "dorevia.helloasso.billetterie.order",
            "view_mode": "list,form",
            "domain": [("catalog_form_id", "=", self.id)],
        }

    def action_sync_orders(self, *args, **kwargs):
        """Synchro commandes HelloAsso pour ce formulaire (type + slug de la ligne)."""
        message_blocks = []
        has_errors = False
        for rec in self:
            cid, csec = rec._helloasso_api_credentials_aligned()
            stats = run_billetterie_orders_sync(
                rec.sudo().env,
                rec.organization_slug.strip(),
                cid,
                csec,
                rec.use_sandbox,
                rec.form_type,
                rec.form_slug,
                catalog_form_id=rec.id,
                log_origin="catalog_form",
            )
            message_blocks.append(
                _("[%s]\n%s")
                % (rec.display_name, format_billetterie_sync_result_message(stats))
            )
            if stats.get("errors"):
                has_errors = True
        notif_type = "warning" if has_errors else "success"
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("Import des commandes"),
                "message": "\n\n".join(message_blocks),
                "type": notif_type,
                "sticky": True,
            },
        }

    def action_refresh_inventory_from_helloasso(self, *args, **kwargs):
        """Bouton liste : recharge l’inventaire depuis les paramètres HelloAsso (adhérent).

        *args / **kwargs : compatibilité Odoo 19+ (call_button peut passer des arguments).
        """
        icp = self.env["ir.config_parameter"].sudo()
        cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        csec = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        if not (cid and csec):
            raise UserError(
                _(
                    "Identifiants HelloAsso manquants. "
                    "Renseignez-les dans Paramètres généraux (bloc HelloAsso adhérent)."
                )
            )
        if not slug:
            raise UserError(_("Renseignez l’organisation HelloAsso dans les paramètres."))
        use_sandbox = icp.get_param("dorevia_helloasso.use_sandbox") == "True"

        stats = run_billetterie_forms_inventory(
            self.env, slug, cid, csec, use_sandbox
        )
        helloasso_sync_log_push(
            self.env,
            "billetterie_forms_inventory",
            "list_inventory",
            stats,
        )
        message = format_inventory_result_message(stats)
        notif_type = "warning" if stats.get("errors") else "success"
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("Mise à jour des billetteries"),
                "message": message,
                "type": notif_type,
                "sticky": True,
            },
        }
