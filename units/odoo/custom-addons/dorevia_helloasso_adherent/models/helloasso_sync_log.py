# -*- coding: utf-8 -*-
"""Journal léger des exécutions de synchro HelloAsso (recette / pilotage)."""

import json
import logging

from odoo import _, fields, models

_logger = logging.getLogger(__name__)

_DETAIL_MAX_LEN = 65000

# Nom technique sans segment « .sync. » : évite des soucis d’xmlid / ordre d’import CSV ir.model.access sous Odoo 19.
_MODEL = "dorevia.helloasso.logentry"


def _state_and_summary_from_stats(stats):
    """Déduit état + résumé court à partir d’un dict stats (billetterie ou adhérent ou inventaire)."""
    stats = stats or {}
    errs = stats.get("errors") or []
    cr = int(stats.get("created") or 0)
    up = int(stats.get("updated") or 0)
    sk = int(stats.get("skipped") or 0)
    proc = stats.get("processed")
    if proc is None:
        summary = _("Créations : %s — mises à jour : %s — ignorés : %s") % (cr, up, sk)
        has_work = bool(cr or up)
    else:
        proc = int(proc or 0)
        summary = _("Traités : %s — créés : %s — maj : %s — ignorés : %s") % (proc, cr, up, sk)
        has_work = bool(proc or cr or up)
    if errs and not has_work:
        state = "error"
    elif errs:
        state = "warning"
    else:
        state = "success"
    if errs:
        summary = "%s — %s" % (summary, _("erreurs : %s") % len(errs))
    return state, summary


def ensure_logentry_access(env):
    """Crée les ir.model.access si absents (idempotent, sudo)."""
    model = env["ir.model"].sudo().search([("model", "=", _MODEL)], limit=1)
    if not model:
        return
    Access = env["ir.model.access"].sudo()
    specs = [
        (
            "dorevia.helloasso.logentry — user",
            "base.group_user",
            (True, False, False, False),
        ),
        (
            "dorevia.helloasso.logentry — erp",
            "base.group_erp_manager",
            (True, False, False, True),
        ),
        (
            "dorevia.helloasso.logentry — system",
            "base.group_system",
            (True, True, True, True),
        ),
    ]
    for name, group_xmlid, perms in specs:
        group = env.ref(group_xmlid, raise_if_not_found=False)
        if not group:
            continue
        if Access.search(
            [("model_id", "=", model.id), ("group_id", "=", group.id)],
            limit=1,
        ):
            continue
        Access.create(
            {
                "name": name,
                "model_id": model.id,
                "group_id": group.id,
                "perm_read": perms[0],
                "perm_write": perms[1],
                "perm_create": perms[2],
                "perm_unlink": perms[3],
            }
        )


def helloasso_sync_log_push(env, flow, origin, stats):
    """
    Crée une ligne de journal (sudo). Ne lève pas si le modèle est absent (sécurité défensive).

    :param flow: clé Selection du modèle journal
    :param origin: clé Selection (origine de l’exécution)
    :param stats: dict retourné par les run_*_sync ou inventaire
    """
    try:
        Log = env[_MODEL].sudo()
    except KeyError:
        _logger.debug("helloasso_sync_log_push: modèle %s indisponible", _MODEL)
        return
    state, summary = _state_and_summary_from_stats(stats)
    try:
        detail = json.dumps(stats or {}, ensure_ascii=False, default=str)
    except TypeError:
        detail = str(stats)
    if len(detail) > _DETAIL_MAX_LEN:
        detail = detail[: _DETAIL_MAX_LEN] + "…"
    Log.create(
        {
            "flow": flow,
            "origin": origin,
            "state": state,
            "summary": (summary or "")[:512],
            "detail": detail,
        }
    )


class DoreviaHelloassoLogentry(models.Model):
    _name = _MODEL
    _description = "HelloAsso — journal des synchronisations"
    _order = "create_date desc, id desc"

    flow = fields.Selection(
        selection=[
            ("membership_payments", "Adhésions (paiements)"),
            ("billetterie_orders", "Billetterie (commandes)"),
            ("billetterie_forms_inventory", "Billetterie (inventaire formulaires)"),
        ],
        string="Flux",
        required=True,
        index=True,
    )
    origin = fields.Selection(
        selection=[
            ("settings", "Paramètres généraux"),
            ("wizard", "Assistant billetterie"),
            ("cron", "Planificateur"),
            ("catalog_form", "Inventaire — synchro depuis une ligne"),
            ("list_inventory", "Inventaire — actualisation liste"),
        ],
        string="Origine",
        required=True,
        index=True,
    )
    state = fields.Selection(
        selection=[
            ("success", "Succès"),
            ("warning", "Avertissement"),
            ("error", "Erreur"),
        ],
        string="Résultat",
        required=True,
        index=True,
    )
    summary = fields.Char(string="Résumé")
    detail = fields.Text(string="Détail (JSON)")

    def _register_hook(self):
        super()._register_hook()
        ensure_logentry_access(self.env)
