#!/usr/bin/env python3
"""
Configure les paramètres Vault/DVIG pour Odoo 19 (tenant o19).
Exécuter via: docker exec odoo_lab_o19 odoo shell -d odoo_lab_o19 < configure_vault_dvig.py
Ou: docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 < tenants/o19/apps/odoo/lab/configure_vault_dvig.py
"""
import os

# Valeurs depuis manifest o19 (core-stinger partagé)
# URLs internes (http://...) : Odoo résout les hostnames Docker depuis le conteneur
# URLs externes (https://...) : pour navigateur / Linky
params = {
    "dorevia.dvig.url": "http://dvig-core-stinger:8080",
    "dorevia.dvig.internal.url": "http://dvig-core-stinger:8080/internal/outbox/process",
    "dorevia.dvig.token": os.environ.get("DOREVIA_DVIG_TOKEN", ""),  # Remplacer ou exporter DOREVIA_DVIG_TOKEN
    "dorevia.dvig.source": "odoo.lab.o19",
    "dorevia.dvig.internal.token": "dvig_internal_core-stinger_stinger",
    "dorevia.vault.url": "http://vault-core-stinger:8080",
    "dorevia.vault.tenant": "o19",
    "dorevia.tenant": "o19",
    "dorevia_session_guard.logout_linky_url": "https://ui.lab.o19.doreviateam.com",
}

env = globals().get("env")
if env:
    ICP = env["ir.config_parameter"].sudo()
    for key, val in params.items():
        ICP.set_param(key, val)
        print(f"  {key} = {val}")
    env.cr.commit()
    print("OK: Paramètres configurés.")
else:
    print("Usage: exécuter dans Odoo shell (env disponible)")
