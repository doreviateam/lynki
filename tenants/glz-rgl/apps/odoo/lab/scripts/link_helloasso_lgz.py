# -*- coding: utf-8 -*-
# Fragment à exécuter dans odoo shell (stdin). Ne pas commiter d'identifiants.
#
# Usage (lab glz-rgl, société id=1 « LES GRANDLIEU'ZARTS ») :
#
#   export HELLOASSO_CLIENT_ID='...'
#   export HELLOASSO_CLIENT_SECRET='...'
#   # optionnel : HELLOASSO_ENVIRONMENT=sandbox|production (défaut: production)
#   docker exec -e HELLOASSO_CLIENT_ID -e HELLOASSO_CLIENT_SECRET \
#     -e HELLOASSO_ENVIRONMENT -i odoo_lab_glz-rgl \
#     odoo shell -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl --no-http \
#     < /opt/dorevia-plateform/tenants/glz-rgl/apps/odoo/lab/scripts/link_helloasso_lgz.py
#
import os
import sys

client_id = (os.environ.get("HELLOASSO_CLIENT_ID") or "").strip()
client_secret = (os.environ.get("HELLOASSO_CLIENT_SECRET") or "").strip()
environment = (os.environ.get("HELLOASSO_ENVIRONMENT") or "production").strip()
if environment not in ("sandbox", "production"):
    environment = "production"

if not client_id or not client_secret:
    sys.stderr.write(
        "HELLOASSO_CLIENT_ID et HELLOASSO_CLIENT_SECRET sont requis (export puis docker exec -e …).\n"
    )
    raise SystemExit(1)

company_id = int((os.environ.get("HELLOASSO_COMPANY_ID") or "1").strip())
company = env["res.company"].browse(company_id)
if not company.exists():
    sys.stderr.write("Société id=%s introuvable.\n" % company_id)
    raise SystemExit(1)

expected = "LES GRANDLIEU'ZARTS"
if company.name != expected:
    sys.stderr.write(
        "Refus sécurité : société id=%s a le nom %r (attendu %r). "
        "Ajustez HELLOASSO_COMPANY_ID si besoin.\n"
        % (company_id, company.name, expected)
    )
    raise SystemExit(1)

slug = (os.environ.get("HELLOASSO_ORG_SLUG") or "").strip()
display = (os.environ.get("HELLOASSO_ORG_DISPLAY_NAME") or "").strip()

vals = {
    "environment": environment,
    "client_id": client_id,
    "client_secret": client_secret,
    "organization_slug": slug,
    "organization_display_name": display,
    "use_for_members": True,
    "use_for_ticketing": True,
}

company.write(
    {
        "helloasso_use_sandbox": environment == "sandbox",
        "helloasso_client_id": vals["client_id"],
        "helloasso_client_secret": vals["client_secret"],
        "helloasso_organization_slug": vals["organization_slug"],
        "helloasso_organization_display_name": vals["organization_display_name"],
    }
)

Account = env["dorevia.helloasso.account"].sudo()
acc = Account.search([("company_id", "=", company.id)], limit=1)
if acc:
    acc.write(vals)
else:
    Account.create(
        {
            "name": "HelloAsso — %s" % (company.name,),
            "company_id": company.id,
            **vals,
        }
    )

env.cr.commit()
print("OK — HelloAsso lié à %s (environnement=%s)." % (company.name, environment))
