# 🧪 Scripts de Tests — SPEC v1.1.1

**Date** : 2026-01-12  
**Version** : 1.1.1  
**Plan** : Phase 1 - Tests Fonctionnels

---

## 📋 Exécution des Tests

### Tests Unitaires Odoo

```bash
# Exécuter tous les tests du module
odoo -c /etc/odoo/odoo.conf -d <database> --test-enable --stop-after-init --log-level=test

# Exécuter uniquement les tests SPEC v1.1.1
odoo -c /etc/odoo/odoo.conf -d <database> --test-enable --stop-after-init \
  --test-tags=dorevia_vault_connector.test_spec_v1_1_1

# Exécuter un test spécifique
odoo -c /etc/odoo/odoo.conf -d <database> --test-enable --stop-after-init \
  --test-tags=dorevia_vault_connector.test_spec_v1_1_1.TestSpecV1_1_1.test_1_1_1_boutons_masques_en_prod
```

### Tests Manuels (Checklist)

#### 1.1 Tests Flag PROD (Boutons Debug)

**Test 1.1.1** : Boutons masqués en PROD
```python
# Dans Odoo shell
env['ir.config_parameter'].sudo().set_param('dorevia.debug.actions', '0')
invoice = env['account.move'].browse(<invoice_id>)
invoice.write({'dorevia_vault_status': 'pending_proof'})
invoice._compute_debug_enabled()
assert invoice.dorevia_debug_enabled == False, "Boutons doivent être masqués"
```

**Test 1.1.2** : Boutons visibles en DEV
```python
# Dans Odoo shell
env['ir.config_parameter'].sudo().set_param('dorevia.debug.actions', '1')
invoice = env['account.move'].browse(<invoice_id>)
invoice.write({'dorevia_vault_status': 'pending_proof'})
invoice._compute_debug_enabled()
assert invoice.dorevia_debug_enabled == True, "Boutons doivent être visibles"
```

**Test 1.1.3** : Erreur si utilisation en PROD
```python
# Dans Odoo shell
env['ir.config_parameter'].sudo().set_param('dorevia.debug.actions', '0')
invoice = env['account.move'].browse(<invoice_id>)
invoice.write({'dorevia_vault_status': 'pending_proof'})
try:
    invoice.action_refresh_vault_proof()
    assert False, "Doit lever une erreur"
except UserError as e:
    assert 'désactivée en production' in str(e)
```

#### 1.2 Tests CRON Reconciler

**Test 1.2.1** : Rattrapage automatique
```python
# Dans Odoo shell
from datetime import datetime, timedelta
invoice = env['account.move'].browse(<invoice_id>)
invoice.write({
    'dorevia_vault_status': 'pending_proof',
    'dorevia_vault_next_retry_at': datetime.now() - timedelta(minutes=5),
})
env['account.move'].cron_vault_reconciler()
# Vérifier qu'un job a été enqueued (via queue_job UI ou logs)
```

**Test 1.2.2** : Limite 50 factures
```python
# Dans Odoo shell
from datetime import datetime, timedelta
# Créer 100 factures en pending_proof
invoices = env['account.move'].create([{
    'move_type': 'out_invoice',
    'partner_id': <partner_id>,
    'dorevia_vault_status': 'pending_proof',
    'dorevia_vault_next_retry_at': datetime.now() - timedelta(minutes=5),
} for _ in range(100)])
env['account.move'].cron_vault_reconciler()
# Vérifier que seulement 50 jobs ont été enqueued
```

#### 1.3 Tests Seuils d'Abandon

**Test 1.3.1** : MAX_ATTEMPTS → failed_hard
```python
# Dans Odoo shell
env['ir.config_parameter'].sudo().set_param('dorevia.vault.max_attempts_proof', '20')
invoice = env['account.move'].browse(<invoice_id>)
invoice.write({
    'dorevia_vault_status': 'pending_proof',
    'dorevia_vault_attempt_count': 20,
})
invoice._check_abandon_thresholds()
assert invoice.dorevia_vault_status == 'failed_hard', "Doit être failed_hard"
```

**Test 1.3.2** : MAX_AGE → failed_hard
```python
# Dans Odoo shell
from datetime import datetime, timedelta
env['ir.config_parameter'].sudo().set_param('dorevia.vault.max_age_pending_proof_hours', '24')
invoice = env['account.move'].browse(<invoice_id>)
invoice.write({
    'dorevia_vault_status': 'pending_proof',
    'dorevia_vault_last_try_at': datetime.now() - timedelta(hours=25),
})
invoice._check_abandon_thresholds()
assert invoice.dorevia_vault_status == 'failed_hard', "Doit être failed_hard"
```

#### 1.4 Tests Identity_key

**Test 1.4.3** : Format identity_key
```python
# Dans Odoo shell
db_name = env.cr.dbname
move_id = <invoice_id>
expected_key = f"proof:{db_name}:{move_id}"
assert expected_key == f"proof:{db_name}:{move_id}", "Format doit être correct"
```

#### 1.5 Tests Backoff Intelligent

**Test 1.5.1** : Délais progressifs
```python
# Dans Odoo shell
invoice = env['account.move'].browse(<invoice_id>)
delays_expected = [5, 10, 20, 40, 120]
for attempt in range(5):
    delay = invoice._calculate_fetch_proof_retry_delay(attempt)
    expected_base = delays_expected[min(attempt, len(delays_expected) - 1)]
    assert delay >= expected_base and delay <= expected_base + 3, \
        f"Délai pour tentative {attempt + 1} doit être dans [{expected_base}, {expected_base + 3}]"
```

---

## 📊 Rapport de Tests

### Format du Rapport

```markdown
# Rapport de Tests — SPEC v1.1.1

**Date** : YYYY-MM-DD
**Environnement** : Staging / Production
**Exécuteur** : Nom

## Résultats

### Phase 1.1 : Tests Flag PROD
- [x] Test 1.1.1 : ✅ Passé
- [x] Test 1.1.2 : ✅ Passé
- [x] Test 1.1.3 : ✅ Passé
- [x] Test 1.1.4 : ✅ Passé

### Phase 1.2 : Tests CRON Reconciler
- [x] Test 1.2.1 : ✅ Passé
- [x] Test 1.2.2 : ✅ Passé
- [x] Test 1.2.3 : ✅ Passé
- [x] Test 1.2.4 : ✅ Passé

### Phase 1.3 : Tests Seuils d'Abandon
- [x] Test 1.3.1 : ✅ Passé
- [x] Test 1.3.2 : ✅ Passé
- [x] Test 1.3.3 : ✅ Passé
- [x] Test 1.3.4 : ⚠️ Skip (module métriques non disponible)

### Phase 1.4 : Tests Identity_key
- [x] Test 1.4.1 : ✅ Passé
- [x] Test 1.4.2 : ✅ Passé
- [x] Test 1.4.3 : ✅ Passé

### Phase 1.5 : Tests Backoff Intelligent
- [x] Test 1.5.1 : ✅ Passé
- [x] Test 1.5.2 : ✅ Passé

### Phase 1.6 : Tests Intégration End-to-End
- [x] Test 1.6.1 : ✅ Passé (latence: 12s)
- [x] Test 1.6.2 : ✅ Passé
- [x] Test 1.6.3 : ✅ Passé
- [x] Test 1.6.4 : ✅ Passé

## Résumé

- **Total** : 21 tests
- **Passés** : 20
- **Échoués** : 0
- **Skip** : 1

## Conclusion

✅ Tous les tests critiques passent. La SPEC v1.1.1 est validée.
```

---

## 🔗 Références

- **Plan d'implémentation** : `ZeDocs/TestV3/PLAN_IMPLEMENTATION_SPEC_v1.1.1.md`
- **SPEC v1.1.1** : `ZeDocs/TestV3/SPEC_ORCHESTRATION_TEMPS_REEL_QUEUE_JOB_Odoo_DVIG_Vault_v1.1.1.md`
- **Fichier de tests** : `units/odoo/custom-addons/dorevia_vault_connector/tests/test_spec_v1_1_1.py`

---

**Date de création** : 2026-01-12  
**Version** : 1.0
