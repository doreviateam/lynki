#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script temporaire pour tester le CRON #2 manuellement"""

import sys
import os

# Ajouter le chemin Odoo
sys.path.insert(0, '/usr/lib/python3/dist-packages')

import odoo
from odoo import api, SUPERUSER_ID

# Configuration
db_name = 'odoo_stinger_sarl-la-platine'

# Initialiser Odoo
odoo.tools.config.parse_config(['-d', db_name, '--stop-after-init'])
odoo.service.db.exp_db(db_name)

# Créer l'environnement
with odoo.api.Environment.manage():
    env = api.Environment(odoo.registry(db_name), SUPERUSER_ID, {})
    
    # Appeler la méthode cron_vault_fetch_proof
    print("🔍 Déclenchement manuel du CRON #2 (Fetch Proof)...")
    try:
        result = env['account.move'].cron_vault_fetch_proof()
        print("✅ CRON #2 exécuté avec succès")
        
        # Vérifier l'état de la facture
        move = env['account.move'].search([('name', '=', 'FAC/2026/00001')], limit=1)
        if move:
            print(f"\n📊 État de la facture FAC/2026/00001:")
            print(f"   - Statut: {move.dorevia_vault_status}")
            print(f"   - Tentatives: {move.dorevia_vault_attempt_count}")
            print(f"   - Vault ID: {move.dorevia_vault_id or 'Non disponible'}")
            if move.dorevia_vault_status == 'vaulted':
                print("   ✅ Facture vaultée avec succès !")
            elif move.dorevia_vault_status == 'failed_soft':
                print(f"   ⚠️  Échec temporaire (tentative {move.dorevia_vault_attempt_count})")
                if move.dorevia_vault_last_error:
                    print(f"   Erreur: {move.dorevia_vault_last_error[:100]}...")
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
