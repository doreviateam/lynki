# -*- coding: utf-8 -*-
"""Page repère applicative : grands flux HelloAsso dans Odoo (lecture seule, sans fiche technique)."""

from odoo import _, api, fields, models


class DoreviaHelloassoFormGuide(models.TransientModel):
    _name = "dorevia.helloasso.form.guide"
    _description = "HelloAsso — page repère (transient)"
    _rec_name = "name"

    name = fields.Char(string="Titre", readonly=True)

    env_label = fields.Char(string="Environnement", readonly=True)
    org_slug = fields.Char(string="Organisation", readonly=True)
    count_event_forms = fields.Integer(
        string="Billetteries repérées",
        readonly=True,
    )
    membership_blurb = fields.Text(string="À quoi sert l’adhésion", readonly=True)
    billetterie_blurb = fields.Text(string="À quoi sert la billetterie", readonly=True)
    technical_blurb = fields.Text(string="Configuration commune", readonly=True)

    def name_get(self):
        label = _("Repère HelloAsso")
        return [(rec.id, label) for rec in self]

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        icp = self.env["ir.config_parameter"].sudo()
        use_sb = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        event_count = Form.search_count([("form_type", "=", "Event")])
        vals.update(
            {
                "name": _("Repère HelloAsso"),
                "env_label": _("Bac à sable (test)") if use_sb else _("Production"),
                "org_slug": slug or _("Non renseignée — à compléter dans les paramètres"),
                "count_event_forms": event_count,
                "membership_blurb": _(
                    "Les cotisations et adhésions saisies sur HelloAsso sont rapprochées vers vos contacts dans Odoo. "
                    "Retrouvez les fiches concernées sous le menu « Adhésion ». "
                    "Pour mettre à jour les données : Paramètres généraux, bloc HelloAsso dédié aux membres (synchronisation ou planificateur)."
                ),
                "billetterie_blurb": _(
                    "Les ventes de billets liées à vos événements HelloAsso sont suivies à part : "
                    "le menu « Billetteries » liste les campagnes connues ; les commandes importées sont accessibles depuis cette zone. "
                    "La mise à jour se fait depuis la liste des billetteries ou l’assistant de synchronisation."
                ),
                "technical_blurb": _(
                    "Une seule connexion HelloAsso (organisation, mode test ou production, identifiants) sert à la fois "
                    "à l’adhésion et à la billetterie. Tout se règle dans Paramètres généraux — les vérifications avant synchro "
                    "y sont également disponibles."
                ),
            }
        )
        return vals
