# -*- coding: utf-8 -*-

import logging

from odoo import SUPERUSER_ID, api

_logger = logging.getLogger(__name__)


def post_init_hook(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    _migrate_helloasso_icp_to_companies(env)
    _migrate_company_to_helloasso_accounts(env)
    _migrate_partner_helloasso_account_ids(env)


def _migrate_company_to_helloasso_accounts(env):
    """Crée un compte HelloAsso par société dès que des identifiants sont sur res.company."""
    Account = env["dorevia.helloasso.account"].sudo()
    for comp in env["res.company"].sudo().search([]):
        if not (comp.helloasso_client_id or "").strip():
            continue
        slug = (comp.helloasso_organization_slug or "").strip()
        if not slug:
            continue
        env_name = "sandbox" if comp.helloasso_use_sandbox else "production"
        if Account.search([("company_id", "=", comp.id)], limit=1):
            continue
        label = (comp.helloasso_organization_display_name or "").strip() or (
            "HelloAsso — %s" % (comp.name,)
        )
        ft = "Event"
        fs = ""
        if "helloasso_billetterie_form_type" in comp._fields:
            ft = (comp.helloasso_billetterie_form_type or "Event").strip() or "Event"
        if "helloasso_billetterie_form_slug" in comp._fields:
            fs = (comp.helloasso_billetterie_form_slug or "").strip()
        Account.create(
            {
                "name": label,
                "company_id": comp.id,
                "environment": env_name,
                "organization_slug": slug,
                "organization_display_name": (
                    comp.helloasso_organization_display_name or ""
                ).strip(),
                "client_id": comp.helloasso_client_id.strip(),
                "client_secret": (comp.helloasso_client_secret or "").strip(),
                "use_for_members": True,
                "use_for_ticketing": True,
                "billetterie_default_form_type": ft,
                "billetterie_default_form_slug": fs,
                "sequence": 5,
            }
        )


def _migrate_helloasso_icp_to_companies(env):
    """Recopie les anciens ir.config_parameter globaux sur chaque société encore vide."""
    icp = env["ir.config_parameter"].sudo()
    cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
    if not cid:
        return
    Companies = env["res.company"].sudo().search([])
    base_vals = {
        "helloasso_client_id": (icp.get_param("dorevia_helloasso.client_id") or "").strip(),
        "helloasso_client_secret": (
            icp.get_param("dorevia_helloasso.client_secret") or ""
        ).strip(),
        "helloasso_organization_slug": (
            icp.get_param("dorevia_helloasso.organization_slug") or ""
        ).strip(),
        "helloasso_organization_display_name": (
            icp.get_param("dorevia_helloasso.organization_display_name") or ""
        ).strip(),
        "helloasso_use_sandbox": icp.get_param("dorevia_helloasso.use_sandbox")
        == "True",
    }
    for comp in Companies:
        if (comp.helloasso_client_id or "").strip():
            continue
        comp.write(base_vals)


def _migrate_partner_helloasso_account_ids(env):
    """Rattache les adhérents HelloAsso sans compte (requis pour les ir.rule multi-sociétés)."""
    Partner = env["res.partner"].sudo()
    Account = env["dorevia.helloasso.account"].sudo()
    if "helloasso_account_id" not in Partner._fields:
        return
    domain = [
        ("helloasso_external_id", "!=", False),
        ("helloasso_account_id", "=", False),
        ("helloasso_form_type", "=ilike", "membership"),
    ]
    for p in Partner.search(domain):
        acc = Account.browse()
        if p.company_id:
            acc = Account.search(
                [("company_id", "=", p.company_id.id), ("use_for_members", "=", True)],
                limit=1,
            )
        if not acc:
            members = Account.search([("use_for_members", "=", True)])
            if len(members) == 1:
                acc = members
        if acc and len(acc) == 1:
            p.write({"helloasso_account_id": acc.id})
            _logger.info(
                "Migration HelloAsso : partenaire id=%s → compte id=%s",
                p.id,
                acc.id,
            )
