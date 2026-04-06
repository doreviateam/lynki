# -*- coding: utf-8 -*-
"""Résolution des paramètres HelloAsso : compte dédié (prioritaire), puis res.company, puis ICP."""


def _default_helloasso_account(env, company):
    """Compte actif préféré pour la société (sequence, id)."""
    if not company:
        return env["dorevia.helloasso.account"].browse()
    return (
        env["dorevia.helloasso.account"]
        .sudo()
        .search(
            [("active", "=", True), ("company_id", "=", company.id)],
            order="sequence, id",
            limit=1,
        )
    )


def get_helloasso_connection_params(env, company=None):
    """
    Retourne les identifiants / options HelloAsso pour la société courante.

    Clés : use_sandbox (bool), client_id, client_secret, organization_slug,
    organization_display_name, billetterie_form_type, billetterie_form_slug (str),
    helloasso_account_id (int|False), helloasso_account (recordset).
    """
    company = company or env.company
    if not company:
        company = env.user.company_id

    account = _default_helloasso_account(env, company)
    if account:
        p = account._to_connection_params()
        return p

    icp = env["ir.config_parameter"].sudo()

    def _legacy_icp_allowed_for_company():
        """En multi-sociétés, ne pas mélanger les identifiants globaux ICP avec une autre société."""
        n = env["res.company"].sudo().search_count([])
        if n <= 1:
            return True
        if not company:
            return False
        icp_cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        co_cid = (company.helloasso_client_id or "").strip()
        return bool(icp_cid and co_cid and co_cid == icp_cid)

    def _str_from_company(fname, icp_key):
        if company and fname in company._fields:
            v = company[fname]
            if v is not None and isinstance(v, str) and v.strip():
                return v.strip()
        if not _legacy_icp_allowed_for_company():
            return ""
        return (icp.get_param(icp_key) or "").strip()

    def _bool_from_company(fname, icp_key):
        if company and fname in company._fields:
            v = company[fname]
            if isinstance(v, bool):
                return v
        if not _legacy_icp_allowed_for_company():
            return False
        return icp.get_param(icp_key) == "True"

    ft = _str_from_company(
        "helloasso_billetterie_form_type",
        "dorevia_helloasso_billetterie.form_type",
    )
    if not ft:
        ft = "Event"
    fs = _str_from_company(
        "helloasso_billetterie_form_slug",
        "dorevia_helloasso_billetterie.form_slug",
    )

    return {
        "use_sandbox": _bool_from_company(
            "helloasso_use_sandbox", "dorevia_helloasso.use_sandbox"
        ),
        "client_id": _str_from_company(
            "helloasso_client_id", "dorevia_helloasso.client_id"
        ),
        "client_secret": _str_from_company(
            "helloasso_client_secret", "dorevia_helloasso.client_secret"
        ),
        "organization_slug": _str_from_company(
            "helloasso_organization_slug", "dorevia_helloasso.organization_slug"
        ),
        "organization_display_name": _str_from_company(
            "helloasso_organization_display_name",
            "dorevia_helloasso.organization_display_name",
        ),
        "billetterie_form_type": ft,
        "billetterie_form_slug": fs,
        "helloasso_account_id": False,
        "helloasso_account": env["dorevia.helloasso.account"].browse(),
    }
