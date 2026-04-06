# -*- coding: utf-8 -*-

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class DoreviaHelloassoAccount(models.Model):
    _name = "dorevia.helloasso.account"
    _description = (
        "Compte HelloAsso lié à une société Odoo (bijection : "
        "une société ↔ un compte, un couple OAuth ↔ une société)."
    )
    _order = "company_id, sequence, id"

    name = fields.Char(string="Libellé", required=True)
    sequence = fields.Integer(
        string="Priorité",
        default=10,
        help="Champ technique ; une seule liaison par société Odoo.",
    )
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        "res.company",
        string="Société Odoo",
        required=True,
        index=True,
        ondelete="cascade",
        help=(
            "Une société Odoo = au plus un compte HelloAsso. "
            "Réciproquement, pour associer un compte HelloAsso à une société, "
            "on enregistre les identifiants OAuth sur cette société (ou via ce modèle) : "
            "le même client ID ne peut pas servir pour deux sociétés."
        ),
    )
    environment = fields.Selection(
        [
            ("sandbox", "Essai (bac à sable)"),
            ("production", "Production"),
        ],
        string="Environnement HelloAsso",
        required=True,
        default="sandbox",
    )
    organization_slug = fields.Char(
        string="Slug organisation",
        help="organizationSlug dans les chemins API v5 HelloAsso.",
    )
    organization_display_name = fields.Char(
        string="Nom affiché (facultatif)",
        help="Libellé lisible dans les vues métier HelloAsso.",
    )
    client_id = fields.Char(
        string="Client ID",
        help="Identifiant OAuth HelloAsso : unique dans la base (une autre société ne peut le réutiliser).",
    )
    client_secret = fields.Char(string="Client secret")
    use_for_members = fields.Boolean(
        string="Adhésions (Membership)",
        default=True,
        help="Autorise la synchronisation des adhésions pour ce compte.",
    )
    use_for_ticketing = fields.Boolean(
        string="Billetterie",
        default=True,
        help="Autorise l’inventaire billetterie et l’import des commandes pour ce compte.",
    )
    billetterie_default_form_type = fields.Char(
        string="Type de campagne billetterie (défaut)",
        default="Event",
    )
    billetterie_default_form_slug = fields.Char(
        string="Identifiant campagne billetterie (optionnel)",
    )

    _helloasso_account_company_unique = models.Constraint(
        "UNIQUE(company_id)",
        "Une société Odoo ne peut avoir qu’un seul compte HelloAsso (liaison 1:1).",
    )

    @api.constrains("client_id", "client_secret", "organization_slug", "active")
    def _check_credentials_nonempty(self):
        """ID + secret obligatoires ensemble si au moins un champ est renseigné ; slug optionnel (Paramètres généraux)."""
        for rec in self:
            if not rec.active:
                continue
            cid = (rec.client_id or "").strip()
            sec = (rec.client_secret or "").strip()
            slug = (rec.organization_slug or "").strip()
            if not cid and not sec and not slug:
                continue
            if not (cid and sec):
                raise ValidationError(
                    _(
                        "Renseignez l’ID et le secret HelloAsso ensemble. "
                        "Le slug organisation peut être complété plus tard (Comptes HelloAsso)."
                    )
                )

    @api.constrains("client_id", "company_id", "active")
    def _check_client_id_unique_per_database(self):
        for rec in self:
            cid = (rec.client_id or "").strip()
            if not cid or not rec.active:
                continue
            others = self.search(
                [
                    ("id", "!=", rec.id),
                    ("active", "=", True),
                ],
            )
            for o in others:
                if (o.client_id or "").strip() == cid:
                    raise ValidationError(
                        _(
                            "Ce client ID HelloAsso est déjà associé à la société Odoo « %(name)s ». "
                            "Un compte HelloAsso ne peut lier qu’une seule société."
                        )
                        % {"name": o.company_id.display_name}
                    )

    def _to_connection_params(self):
        """Dict aligné sur get_helloasso_connection_params (sans repli)."""
        self.ensure_one()
        return {
            "use_sandbox": self.environment == "sandbox",
            "client_id": (self.client_id or "").strip(),
            "client_secret": (self.client_secret or "").strip(),
            "organization_slug": (self.organization_slug or "").strip(),
            "organization_display_name": (self.organization_display_name or "").strip(),
            "billetterie_form_type": (self.billetterie_default_form_type or "Event").strip()
            or "Event",
            "billetterie_form_slug": (self.billetterie_default_form_slug or "").strip(),
            "helloasso_account_id": self.id,
            "helloasso_account": self,
        }
