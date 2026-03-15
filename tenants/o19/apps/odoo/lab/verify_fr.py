env = env  # noqa: F821
Company = env["res.company"]
country_fr = env.ref("base.fr")
for c in Company.search([]):
    ok = c.country_id == country_fr and (not hasattr(c, "account_fiscal_country_id") or c.account_fiscal_country_id == country_fr)
    print("Société %s: country=%s, fiscal=%s -> %s" % (
        c.name,
        c.country_id.code if c.country_id else "?",
        getattr(c, "account_fiscal_country_id", None).code if hasattr(c, "account_fiscal_country_id") and c.account_fiscal_country_id else "?",
        "OK FR" if ok else "PAS FR",
    ))
# Plan comptable : comptes FR (4 chiffres)
accounts = env["account.account"].search([("company_id", "=", env.company.id)], limit=5)
for a in accounts:
    print("Compte: %s %s" % (a.code, a.name))
