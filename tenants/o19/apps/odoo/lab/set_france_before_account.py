#!/usr/bin/env python3
"""
Force la société et le partenaire principal en France AVANT l'installation de account.
À exécuter après base, avant account,l10n_fr,l10n_fr_account,sale.
"""
env = env  # noqa: F821

country_fr = env.ref("base.fr")
Company = env["res.company"]
Partner = env["res.partner"]

for company in Company.search([]):
    vals = {"country_id": country_fr.id}
    if hasattr(Company, "account_fiscal_country_id"):
        vals["account_fiscal_country_id"] = country_fr.id
    company.write(vals)
    if company.partner_id:
        company.partner_id.write({"country_id": country_fr.id})
    print("Société %s : France (country + fiscal)" % company.name)

env.cr.commit()
