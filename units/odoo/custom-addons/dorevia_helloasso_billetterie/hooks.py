# -*- coding: utf-8 -*-

import logging

from odoo import SUPERUSER_ID, api

_logger = logging.getLogger(__name__)


def post_init_hook(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    _migrate_billetterie_icp_to_companies(env)
    _migrate_billetterie_helloasso_account_ids(env)


def _migrate_billetterie_helloasso_account_ids(env):
    """Rattache inventaire et commandes à ``dorevia.helloasso.account`` (slug + environnement)."""
    Form = env["dorevia.helloasso.billetterie.form"].sudo()
    Order = env["dorevia.helloasso.billetterie.order"].sudo()
    Account = env["dorevia.helloasso.account"].sudo()

    def _env_key(use_sandbox):
        return "sandbox" if use_sandbox else "production"

    for f in Form.search([("helloasso_account_id", "=", False)]):
        slug = (f.organization_slug or "").strip().lower()
        if not slug:
            continue
        cands = Account.search(
            [
                ("environment", "=", _env_key(f.use_sandbox)),
            ]
        )
        cands = cands.filtered(
            lambda a: (a.organization_slug or "").strip().lower() == slug
        )
        if len(cands) == 1:
            f.write({"helloasso_account_id": cands.id})
        elif len(cands) > 1:
            _logger.warning(
                "Migration billetterie : formulaire id=%s, slug=%s — plusieurs comptes HelloAsso, "
                "rattachement manuel requis.",
                f.id,
                slug,
            )

    # Pass 2 : slug sur res.company (souvent renseigné alors que le compte HelloAsso a encore slug vide).
    Company = env["res.company"].sudo()
    for f in Form.search([("helloasso_account_id", "=", False)]):
        slug = (f.organization_slug or "").strip().lower()
        if not slug:
            continue
        for company in Company.search([]):
            cslug = (company.helloasso_organization_slug or "").strip().lower()
            if not cslug or cslug != slug:
                continue
            accs = Account.search(
                [
                    ("company_id", "=", company.id),
                    ("environment", "=", _env_key(f.use_sandbox)),
                ]
            )
            if len(accs) == 1:
                f.write({"helloasso_account_id": accs.id})
                _logger.info(
                    "Migration billetterie : formulaire id=%s → compte id=%s (slug société %s)",
                    f.id,
                    accs.id,
                    company.name,
                )
            break

    # Pass 3 : un seul compte billetterie pour l’environnement (essai / prod) → rattachement sans ambiguïté.
    # Couvre les bases où le slug API est sur le formulaire mais pas encore copié sur ``helloasso.account`` /
    # ``res.company`` (lignes orphelines : company_id NULL → invisible pour les ir.rule multi-sociétés).
    for f in Form.search([("helloasso_account_id", "=", False)]):
        accs = Account.search(
            [
                ("use_for_ticketing", "=", True),
                ("environment", "=", _env_key(f.use_sandbox)),
            ]
        )
        if len(accs) == 1:
            f.write({"helloasso_account_id": accs.id})
            _logger.info(
                "Migration billetterie : formulaire id=%s → seul compte billetterie id=%s (%s)",
                f.id,
                accs.id,
                _env_key(f.use_sandbox),
            )

    for o in Order.search([("helloasso_account_id", "=", False)]):
        if o.catalog_form_id and o.catalog_form_id.helloasso_account_id:
            o.write(
                {"helloasso_account_id": o.catalog_form_id.helloasso_account_id.id}
            )
            continue
        if not (o.form_slug and o.form_type):
            continue
        fms = Form.search(
            [
                ("form_slug", "=", o.form_slug),
                ("form_type", "=", o.form_type),
                ("helloasso_account_id", "!=", False),
            ]
        )
        accounts = fms.mapped("helloasso_account_id")
        accounts = accounts.sudo().filtered(lambda r: r.id)
        if len(accounts) == 1:
            o.write({"helloasso_account_id": accounts.id})
        elif len(accounts) > 1:
            _logger.warning(
                "Migration billetterie : commande id=%s, form %s/%s — compte HelloAsso ambigu, "
                "rattachement manuel requis.",
                o.id,
                o.form_type,
                o.form_slug,
            )


def _migrate_billetterie_icp_to_companies(env):
    icp = env["ir.config_parameter"].sudo()
    ft = (icp.get_param("dorevia_helloasso_billetterie.form_type") or "").strip()
    fs = (icp.get_param("dorevia_helloasso_billetterie.form_slug") or "").strip()
    if not ft and not fs:
        return
    for comp in env["res.company"].sudo().search([]):
        vals = {}
        if ft and not (comp.helloasso_billetterie_form_type or "").strip():
            vals["helloasso_billetterie_form_type"] = ft
        if fs and not (comp.helloasso_billetterie_form_slug or "").strip():
            vals["helloasso_billetterie_form_slug"] = fs
        if vals:
            comp.write(vals)
