#!/usr/bin/env python3
"""
Configure Odoo o19 en français avec le plan comptable français (PCG).

Exécuter :
  docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < tenants/o19/apps/odoo/lab/configure_fr_plan_comptable.py

Prérequis : Base odoo_lab_o19 existante.
Note : Si la base a déjà un plan comptable (ex. générique), l'installation de l10n_fr_account
      peut nécessiter une intervention manuelle (Comptabilité > Configuration > Comptes).
"""
env = env  # noqa: F821

# 1. Activer la langue française
Lang = env["res.lang"]
fr = Lang.search([("code", "=", "fr_FR")], limit=1)
if fr and not fr.active:
    fr.active = True
    print("Langue fr_FR activée")
elif fr:
    print("Langue fr_FR déjà active")
else:
    print("ATTENTION: Langue fr_FR non trouvée")

# 2. Définir la société sur France (country_id + account_fiscal_country_id)
Company = env["res.company"]
country_fr = env.ref("base.fr")
for company in Company.search([]):
    vals = {}
    if company.country_id != country_fr:
        vals["country_id"] = country_fr.id
    if hasattr(company, "account_fiscal_country_id") and company.account_fiscal_country_id != country_fr:
        vals["account_fiscal_country_id"] = country_fr.id
    if vals:
        company.write(vals)
        print("Société %s : pays et fiscal country définis sur France" % company.name)
    else:
        print("Société %s : déjà France" % company.name)

# 3. Installer l10n_fr et l10n_fr_account (plan comptable)
Module = env["ir.module.module"]
to_install = ["l10n_fr", "l10n_fr_account"]
for name in to_install:
    mod = Module.search([("name", "=", name)], limit=1)
    if mod:
        if mod.state == "installed":
            print("Module %s déjà installé" % name)
        elif mod.state == "uninstalled":
            mod.button_immediate_install()
            print("Module %s installé" % name)
        else:
            print("Module %s : état %s" % (name, mod.state))
    else:
        print("Module %s non trouvé (vérifier addons_path)" % name)

env.cr.commit()
print("\nConfiguration terminée. Recharger la page Odoo.")
