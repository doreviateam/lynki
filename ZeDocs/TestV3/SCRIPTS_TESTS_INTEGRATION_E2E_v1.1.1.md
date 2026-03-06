# 🧪 Scripts de Tests d'Intégration End-to-End — SPEC v1.1.1

**Date** : 2026-01-12  
**Version** : 1.1.1  
**Plan** : Phase 1.6 - Tests Intégration End-to-End

---

## 📋 Prérequis

### Environnement Requis

- ✅ Odoo avec module `dorevia_vault_connector` installé
- ✅ DVIG accessible et configuré
- ✅ Vault accessible et configuré
- ✅ `queue_job` installé et configuré dans Odoo
- ✅ Token interne DVIG configuré
- ✅ Token Vault configuré

### Configuration

```python
# Paramètres système Odoo requis
dorevia.dvig.internal.url = <url_dvig>
dorevia.dvig.internal.token = <token_interne>
dorevia.vault.url = <url_vault>
dorevia.vault.token = <token_vault>
dorevia.debug.actions = 1  # Pour tests (DEV)
```

---

## 🧪 Test 1.6.1 : Happy Path

**Objectif** : Vérifier que le chemin principal fonctionne (post facture → `vaulted` en < 15s)

### Script Python (Odoo Shell)

```python
#!/usr/bin/env python3
"""
Test 1.6.1 : Happy Path
Post facture → vaulted en < 15s
"""

import time
from datetime import datetime

# Créer une facture
partner = env['res.partner'].search([], limit=1)
journal = env['account.journal'].search([('type', '=', 'sale')], limit=1)

invoice = env['account.move'].create({
    'move_type': 'out_invoice',
    'partner_id': partner.id,
    'journal_id': journal.id,
    'invoice_date': datetime.now().date(),
    'invoice_line_ids': [(0, 0, {
        'name': 'Test Product Happy Path',
        'quantity': 1,
        'price_unit': 100.0,
    })],
})

# Mesurer le temps
start_time = time.time()

# Poster la facture (déclenche le vaulting)
invoice.action_post()

# Attendre que le statut soit 'vaulted'
max_wait = 30  # secondes
elapsed = 0
while invoice.dorevia_vault_status != 'vaulted' and elapsed < max_wait:
    time.sleep(1)
    elapsed = time.time() - start_time
    env.cr.commit()  # Rafraîchir depuis DB
    invoice.refresh()

# Vérifier le résultat
end_time = time.time()
latency = end_time - start_time

print(f"✅ Test 1.6.1 : Happy Path")
print(f"   Latence : {latency:.2f}s")
print(f"   Statut final : {invoice.dorevia_vault_status}")
print(f"   ID Vault : {invoice.dorevia_vault_id or 'N/A'}")
print(f"   Hash SHA256 : {invoice.dorevia_vault_sha256[:16] if invoice.dorevia_vault_sha256 else 'N/A'}...")

assert invoice.dorevia_vault_status == 'vaulted', f"Statut doit être 'vaulted', obtenu: {invoice.dorevia_vault_status}"
assert latency < 15, f"Latence doit être < 15s, obtenu: {latency:.2f}s"
```

### Script Bash (Alternative)

```bash
#!/bin/bash
# Test 1.6.1 : Happy Path

echo "🧪 Test 1.6.1 : Happy Path"
echo "Post facture → vaulted en < 15s"
echo ""

# Créer facture via API Odoo ou script Python
# (Utiliser odoo shell ou API REST)

# Mesurer le temps
START_TIME=$(date +%s)

# Post facture
# ... (commande pour poster facture)

# Attendre vaulted
MAX_WAIT=30
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(odoo shell -c /etc/odoo/odoo.conf -d <database> \
        -e "print(env['account.move'].browse(<invoice_id>).dorevia_vault_status)")
    
    if [ "$STATUS" = "vaulted" ]; then
        END_TIME=$(date +%s)
        LATENCY=$((END_TIME - START_TIME))
        echo "✅ Facture vaulted en ${LATENCY}s"
        exit 0
    fi
    
    sleep 1
    ELAPSED=$((ELAPSED + 1))
done

echo "❌ Timeout après ${MAX_WAIT}s"
exit 1
```

---

## 🧪 Test 1.6.2 : Vault 404 Temporaire

**Objectif** : Vérifier que les retries avec backoff fonctionnent quand Vault retourne 404 temporairement

### Script Python (Odoo Shell)

```python
#!/usr/bin/env python3
"""
Test 1.6.2 : Vault 404 temporaire
Vault 404 pendant 60s → retries avec backoff → vaulted
"""

import time
from datetime import datetime

# Note: Ce test nécessite de pouvoir simuler un 404 Vault temporaire
# Option 1 : Utiliser un mock Vault
# Option 2 : Arrêter Vault temporairement
# Option 3 : Utiliser un Vault de test qui retourne 404 pendant X secondes

# Créer une facture
partner = env['res.partner'].search([], limit=1)
journal = env['account.journal'].search([('type', '=', 'sale')], limit=1)

invoice = env['account.move'].create({
    'move_type': 'out_invoice',
    'partner_id': partner.id,
    'journal_id': journal.id,
    'invoice_date': datetime.now().date(),
    'invoice_line_ids': [(0, 0, {
        'name': 'Test Product 404',
        'quantity': 1,
        'price_unit': 100.0,
    })],
})

# Simuler 404 Vault (arrêter Vault ou utiliser mock)
# ... (arrêter Vault ou configurer mock)

start_time = time.time()

# Poster la facture
invoice.action_post()

# Attendre que le statut passe à 'pending_proof'
max_wait = 10
elapsed = 0
while invoice.dorevia_vault_status != 'pending_proof' and elapsed < max_wait:
    time.sleep(1)
    elapsed = time.time() - start_time
    env.cr.commit()
    invoice.refresh()

assert invoice.dorevia_vault_status == 'pending_proof', "Doit être pending_proof"

# Vérifier que les retries sont en cours (attempt_count augmente)
initial_attempts = invoice.dorevia_vault_attempt_count or 0

# Attendre quelques retries
time.sleep(20)

env.cr.commit()
invoice.refresh()

# Vérifier que attempt_count a augmenté
assert invoice.dorevia_vault_attempt_count > initial_attempts, \
    f"attempt_count doit avoir augmenté (était {initial_attempts}, maintenant {invoice.dorevia_vault_attempt_count})"

# Redémarrer Vault (ou désactiver mock)
# ... (redémarrer Vault)

# Attendre que le statut soit 'vaulted'
max_wait = 60
elapsed = 0
while invoice.dorevia_vault_status != 'vaulted' and elapsed < max_wait:
    time.sleep(2)
    elapsed = time.time() - start_time
    env.cr.commit()
    invoice.refresh()

print(f"✅ Test 1.6.2 : Vault 404 temporaire")
print(f"   Temps total : {elapsed:.2f}s")
print(f"   Tentatives : {invoice.dorevia_vault_attempt_count}")
print(f"   Statut final : {invoice.dorevia_vault_status}")

assert invoice.dorevia_vault_status == 'vaulted', f"Statut doit être 'vaulted', obtenu: {invoice.dorevia_vault_status}"
```

---

## 🧪 Test 1.6.3 : DVIG Down Temporaire

**Objectif** : Vérifier que les filets de sécurité fonctionnent quand DVIG est down temporairement

### Script Python (Odoo Shell)

```python
#!/usr/bin/env python3
"""
Test 1.6.3 : DVIG down temporaire
DVIG down 2 min → rattrapage via filet de sécurité
"""

import time
from datetime import datetime

# Créer une facture
partner = env['res.partner'].search([], limit=1)
journal = env['account.journal'].search([('type', '=', 'sale')], limit=1)

invoice = env['account.move'].create({
    'move_type': 'out_invoice',
    'partner_id': partner.id,
    'journal_id': journal.id,
    'invoice_date': datetime.now().date(),
    'invoice_line_ids': [(0, 0, {
        'name': 'Test Product DVIG Down',
        'quantity': 1,
        'price_unit': 100.0,
    })],
})

# Arrêter DVIG (ou simuler downtime)
# docker stop dvig-core-stinger
# ... (arrêter DVIG)

start_time = time.time()

# Poster la facture
invoice.action_post()

# Attendre que le statut passe à 'todo' (DVIG ne répond pas)
max_wait = 10
elapsed = 0
while invoice.dorevia_vault_status != 'todo' and elapsed < max_wait:
    time.sleep(1)
    elapsed = time.time() - start_time
    env.cr.commit()
    invoice.refresh()

assert invoice.dorevia_vault_status in ('todo', 'pending_proof'), \
    f"Statut doit être 'todo' ou 'pending_proof', obtenu: {invoice.dorevia_vault_status}"

# Attendre 2 minutes (filet de sécurité doit prendre le relais)
print("⏳ Attente 2 minutes pour que les filets de sécurité prennent le relais...")
time.sleep(120)

# Redémarrer DVIG
# docker start dvig-core-stinger
# ... (redémarrer DVIG)

# Attendre que le statut soit 'vaulted' (filet de sécurité a traité)
max_wait = 180  # 3 minutes
elapsed = 0
while invoice.dorevia_vault_status != 'vaulted' and elapsed < max_wait:
    time.sleep(5)
    elapsed = time.time() - start_time
    env.cr.commit()
    invoice.refresh()
    
    # Vérifier que le statut progresse
    print(f"   Statut actuel : {invoice.dorevia_vault_status} (tentative {invoice.dorevia_vault_attempt_count or 0})")

print(f"✅ Test 1.6.3 : DVIG down temporaire")
print(f"   Temps total : {elapsed:.2f}s")
print(f"   Statut final : {invoice.dorevia_vault_status}")

assert invoice.dorevia_vault_status == 'vaulted', \
    f"Statut doit être 'vaulted' après rattrapage, obtenu: {invoice.dorevia_vault_status}"
```

### Script Bash (Alternative)

```bash
#!/bin/bash
# Test 1.6.3 : DVIG down temporaire

echo "🧪 Test 1.6.3 : DVIG down temporaire"
echo "DVIG down 2 min → rattrapage via filet de sécurité"
echo ""

# Arrêter DVIG
echo "⏹️  Arrêt de DVIG..."
docker stop dvig-core-stinger

# Créer et poster facture
# ... (créer facture via API ou script)

# Attendre 2 minutes
echo "⏳ Attente 2 minutes..."
sleep 120

# Redémarrer DVIG
echo "▶️  Redémarrage de DVIG..."
docker start dvig-core-stinger

# Attendre que le statut soit 'vaulted'
MAX_WAIT=180
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(odoo shell -c /etc/odoo/odoo.conf -d <database> \
        -e "print(env['account.move'].browse(<invoice_id>).dorevia_vault_status)")
    
    if [ "$STATUS" = "vaulted" ]; then
        echo "✅ Facture vaulted après rattrapage"
        exit 0
    fi
    
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

echo "❌ Timeout après ${MAX_WAIT}s"
exit 1
```

---

## 🧪 Test 1.6.4 : Batch 20 Factures

**Objectif** : Vérifier qu'il n'y a pas de tempête de jobs avec un batch de 20 factures

### Script Python (Odoo Shell)

```python
#!/usr/bin/env python3
"""
Test 1.6.4 : Batch 20 factures
Batch 20 factures → pas de tempête de jobs
"""

import time
from datetime import datetime

partner = env['res.partner'].search([], limit=1)
journal = env['account.journal'].search([('type', '=', 'sale')], limit=1)

# Créer 20 factures
invoices = env['account.move'].create([{
    'move_type': 'out_invoice',
    'partner_id': partner.id,
    'journal_id': journal.id,
    'invoice_date': datetime.now().date(),
    'invoice_line_ids': [(0, 0, {
        'name': f'Test Product Batch {i}',
        'quantity': 1,
        'price_unit': 100.0 + i,
    })],
} for i in range(20)])

print(f"📦 Création de {len(invoices)} factures...")

# Compter les jobs trigger_worker avant
jobs_before = env['queue.job'].search_count([
    ('method_name', '=', 'job_trigger_worker'),
    ('state', 'in', ['pending', 'enqueued', 'started']),
])

start_time = time.time()

# Poster toutes les factures simultanément
for invoice in invoices:
    invoice.action_post()

# Attendre un peu pour que les jobs soient créés
time.sleep(2)

# Compter les jobs trigger_worker après
jobs_after = env['queue.job'].search_count([
    ('method_name', '=', 'job_trigger_worker'),
    ('state', 'in', ['pending', 'enqueued', 'started']),
])

# Vérifier qu'il n'y a pas de tempête (devrait être 1 job grâce à identity_key)
print(f"   Jobs trigger_worker avant : {jobs_before}")
print(f"   Jobs trigger_worker après : {jobs_after}")
print(f"   Nouveaux jobs : {jobs_after - jobs_before}")

# Avec identity_key, il devrait y avoir au maximum 1 job trigger_worker
# (ou quelques-uns si plusieurs tenants, mais pas 20)
assert jobs_after - jobs_before <= 5, \
    f"Il ne doit pas y avoir de tempête de jobs (attendu <= 5, obtenu {jobs_after - jobs_before})"

# Attendre que toutes les factures soient vaulted
max_wait = 60
elapsed = 0
while elapsed < max_wait:
    env.cr.commit()
    invoices.refresh()
    
    vaulted_count = len([inv for inv in invoices if inv.dorevia_vault_status == 'vaulted'])
    
    if vaulted_count == len(invoices):
        break
    
    print(f"   Progression : {vaulted_count}/{len(invoices)} factures vaulted")
    time.sleep(2)
    elapsed = time.time() - start_time

end_time = time.time()
latency = end_time - start_time

# Vérifier le résultat
vaulted_count = len([inv for inv in invoices if inv.dorevia_vault_status == 'vaulted'])

print(f"✅ Test 1.6.4 : Batch 20 factures")
print(f"   Temps total : {latency:.2f}s")
print(f"   Factures vaulted : {vaulted_count}/{len(invoices)}")
print(f"   Jobs trigger_worker créés : {jobs_after - jobs_before}")

assert vaulted_count == len(invoices), \
    f"Toutes les factures doivent être vaulted ({vaulted_count}/{len(invoices)})"
assert jobs_after - jobs_before <= 5, \
    f"Il ne doit pas y avoir de tempête de jobs (attendu <= 5, obtenu {jobs_after - jobs_before})"
```

---

## 📊 Script de Test Complet (Tous les Tests)

```python
#!/usr/bin/env python3
"""
Script de test complet pour SPEC v1.1.1 - Tests Intégration End-to-End
"""

import sys
import time
from datetime import datetime

def run_test_1_6_1():
    """Test 1.6.1 : Happy Path"""
    print("\n" + "="*60)
    print("🧪 Test 1.6.1 : Happy Path")
    print("="*60)
    # ... (code du test 1.6.1)
    return True

def run_test_1_6_2():
    """Test 1.6.2 : Vault 404 temporaire"""
    print("\n" + "="*60)
    print("🧪 Test 1.6.2 : Vault 404 temporaire")
    print("="*60)
    # ... (code du test 1.6.2)
    return True

def run_test_1_6_3():
    """Test 1.6.3 : DVIG down temporaire"""
    print("\n" + "="*60)
    print("🧪 Test 1.6.3 : DVIG down temporaire")
    print("="*60)
    # ... (code du test 1.6.3)
    return True

def run_test_1_6_4():
    """Test 1.6.4 : Batch 20 factures"""
    print("\n" + "="*60)
    print("🧪 Test 1.6.4 : Batch 20 factures")
    print("="*60)
    # ... (code du test 1.6.4)
    return True

def main():
    """Exécuter tous les tests"""
    print("🚀 Démarrage des tests d'intégration End-to-End - SPEC v1.1.1")
    print(f"Date : {datetime.now()}")
    
    results = {}
    
    try:
        results['test_1_6_1'] = run_test_1_6_1()
    except Exception as e:
        print(f"❌ Test 1.6.1 échoué : {str(e)}")
        results['test_1_6_1'] = False
    
    try:
        results['test_1_6_2'] = run_test_1_6_2()
    except Exception as e:
        print(f"❌ Test 1.6.2 échoué : {str(e)}")
        results['test_1_6_2'] = False
    
    try:
        results['test_1_6_3'] = run_test_1_6_3()
    except Exception as e:
        print(f"❌ Test 1.6.3 échoué : {str(e)}")
        results['test_1_6_3'] = False
    
    try:
        results['test_1_6_4'] = run_test_1_6_4()
    except Exception as e:
        print(f"❌ Test 1.6.4 échoué : {str(e)}")
        results['test_1_6_4'] = False
    
    # Résumé
    print("\n" + "="*60)
    print("📊 Résumé des Tests")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ Passé" if result else "❌ Échoué"
        print(f"   {test_name} : {status}")
    
    print(f"\nTotal : {passed}/{total} tests passés")
    
    if passed == total:
        print("✅ Tous les tests passent !")
        return 0
    else:
        print("❌ Certains tests ont échoué")
        return 1

if __name__ == '__main__':
    sys.exit(main())
```

---

## 📋 Checklist d'Exécution

### Avant les Tests

- [ ] Vérifier que DVIG est accessible
- [ ] Vérifier que Vault est accessible
- [ ] Vérifier que les tokens sont configurés
- [ ] Vérifier que `queue_job` est actif
- [ ] Vérifier que le CRON reconciler est actif
- [ ] Vérifier que le DVIG scheduler est actif

### Pendant les Tests

- [ ] Surveiller les logs Odoo
- [ ] Surveiller les logs DVIG
- [ ] Surveiller les métriques Prometheus
- [ ] Vérifier les jobs queue_job dans l'UI Odoo

### Après les Tests

- [ ] Nettoyer les factures de test créées
- [ ] Vérifier qu'aucun job n'est resté en attente
- [ ] Documenter les résultats dans le rapport

---

## 🔗 Références

- **Plan d'implémentation** : `ZeDocs/TestV3/PLAN_IMPLEMENTATION_SPEC_v1.1.1.md`
- **SPEC v1.1.1** : `ZeDocs/TestV3/SPEC_ORCHESTRATION_TEMPS_REEL_QUEUE_JOB_Odoo_DVIG_Vault_v1.1.1.md`
- **Scripts tests unitaires** : `ZeDocs/TestV3/SCRIPTS_TESTS_SPEC_v1.1.1.md`

---

**Date de création** : 2026-01-12  
**Version** : 1.0
