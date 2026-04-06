# -*- coding: utf-8 -*-

from odoo import api, fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    helloasso_environment = fields.Selection(
        [
            ("sandbox", "Essai (bac à sable)"),
            ("production", "Production"),
        ],
        string="Environnement HelloAsso",
        compute="_compute_helloasso_settings_fields",
        inverse="_inverse_helloasso_settings_fields",
    )
    helloasso_client_id = fields.Char(
        string="Identifiant HelloAsso (client ID)",
        compute="_compute_helloasso_settings_fields",
        inverse="_inverse_helloasso_settings_fields",
    )
    # Nom de champ sans « secret » : le client web Odoo peut filtrer les champs *secret* dans
    # les réponses JSON (clé absente à l’écran malgré un compute correct).
    helloasso_oauth_key = fields.Char(
        string="Clé API OAuth HelloAsso",
        compute="_compute_helloasso_settings_fields",
        inverse="_inverse_helloasso_settings_fields",
    )
    helloasso_organization_slug = fields.Char(
        string="Organisation (slug)",
        compute="_compute_helloasso_settings_fields",
        inverse="_inverse_helloasso_settings_fields",
    )
    helloasso_organization_display_name = fields.Char(
        string="Nom affiché (facultatif)",
        compute="_compute_helloasso_settings_fields",
        inverse="_inverse_helloasso_settings_fields",
    )

    def _helloasso_merge_display_str(self, acc_val, company_val):
        """Si compte HelloAsso et res.company divergent, préférer la valeur la plus complète."""
        a = (acc_val or "").strip()
        c = (company_val or "").strip()
        if not a:
            return c or False
        if not c:
            return a or False
        if a == c:
            return a
        return a if len(a) >= len(c) else c

    def _helloasso_apply_icp_display_fallback(self, settings_rec):
        """
        Anciens réglages globaux (ir.config_parameter) : repli d'affichage uniquement si la
        société courante est bien celle liée au même client ID que l'ICP (ou base mono-société).

        Ne jamais injecter l'ID / secret ICP pour une autre société (ex. plusieurs associations
        dans la même base : chaque société = ses propres identifiants HelloAsso).
        """
        settings_rec.ensure_one()
        company = settings_rec.company_id
        if not company:
            return
        icp = self.env["ir.config_parameter"].sudo()
        icp_cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        icp_sec = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        if not icp_sec:
            return
        if (settings_rec.helloasso_oauth_key or "").strip():
            return

        Account = self.env["dorevia.helloasso.account"].sudo()
        acc = Account.search([("company_id", "=", company.id)], limit=1)
        cid_stored = (company.helloasso_client_id or "").strip()
        cid_acc = (acc.client_id or "").strip() if acc else ""
        binding_cid = cid_stored or cid_acc

        n_companies = self.env["res.company"].sudo().search_count([])
        if n_companies <= 1:
            settings_rec.helloasso_oauth_key = icp_sec
            return
        # Multi-sociétés : secret ICP seulement si cette société est explicitement liée au même client ID.
        if icp_cid and binding_cid and icp_cid == binding_cid:
            settings_rec.helloasso_oauth_key = icp_sec

    @api.depends("company_id")
    def _compute_helloasso_settings_fields(self):
        Account = self.env["dorevia.helloasso.account"].sudo()
        for s in self:
            company = s.company_id
            if not company:
                s.helloasso_environment = "sandbox"
                s.helloasso_client_id = False
                s.helloasso_oauth_key = False
                s.helloasso_organization_slug = False
                s.helloasso_organization_display_name = False
                continue
            cid_c = (company.helloasso_client_id or "").strip()
            sec_c = (company.helloasso_client_secret or "").strip()
            acc = Account.search([("company_id", "=", company.id)], limit=1)
            if acc:
                cid_a = (acc.client_id or "").strip()
                sec_a = (acc.client_secret or "").strip()
                s.helloasso_environment = acc.environment
                s.helloasso_client_id = self._helloasso_merge_display_str(cid_a, cid_c)
                # Secret souvent sur la société seule (repli) ou inversement sur le compte.
                s.helloasso_oauth_key = sec_a or sec_c or False
                s.helloasso_organization_slug = (
                    acc.organization_slug or company.helloasso_organization_slug
                )
                s.helloasso_organization_display_name = (
                    acc.organization_display_name
                    or company.helloasso_organization_display_name
                )
            else:
                s.helloasso_environment = (
                    "sandbox" if company.helloasso_use_sandbox else "production"
                )
                s.helloasso_client_id = cid_c or False
                s.helloasso_oauth_key = sec_c or False
                s.helloasso_organization_slug = company.helloasso_organization_slug
                s.helloasso_organization_display_name = (
                    company.helloasso_organization_display_name
                )
            self._helloasso_apply_icp_display_fallback(s)

    def _inverse_helloasso_settings_fields(self):
        Account = self.env["dorevia.helloasso.account"].sudo()
        for s in self:
            company = s.company_id
            if not company:
                continue
            env_key = s.helloasso_environment or "sandbox"
            acc = Account.search([("company_id", "=", company.id)], limit=1)
            cid = (s.helloasso_client_id or "").strip()
            # Champ mot de passe : vide en UI = souvent « non modifié », pas « effacer ».
            raw_secret = s.helloasso_oauth_key
            if raw_secret:
                sec = (raw_secret or "").strip()
            elif acc and (acc.client_secret or "").strip():
                sec = (acc.client_secret or "").strip()
            else:
                sec = (company.helloasso_client_secret or "").strip()
            vals = {
                "environment": env_key,
                "client_id": cid,
                "client_secret": sec,
                "organization_slug": (s.helloasso_organization_slug or "").strip(),
                "organization_display_name": (
                    s.helloasso_organization_display_name or ""
                ).strip(),
                "use_for_members": True,
                "use_for_ticketing": True,
            }
            company.write(
                {
                    "helloasso_use_sandbox": env_key == "sandbox",
                    "helloasso_client_id": vals["client_id"],
                    "helloasso_client_secret": vals["client_secret"],
                    "helloasso_organization_slug": vals["organization_slug"],
                    "helloasso_organization_display_name": vals[
                        "organization_display_name"
                    ],
                }
            )
            if not acc:
                if not (vals["client_id"] or vals["client_secret"]):
                    continue
                Account.create(
                    {
                        "name": "HelloAsso — %s" % (company.name,),
                        "company_id": company.id,
                        **vals,
                    }
                )
            else:
                acc.write(vals)
