# ✅ Correction Problème d'Ordonnancement — SPEC v1.1.1

**Date** : 2026-01-12  
**Problème** : `job_trigger_worker` traitait l'outbox avant que l'événement ne soit envoyé vers DVIG  
**Solution** : `job_trigger_worker` envoie d'abord les événements vers `/ingest` avant de traiter l'outbox

---

## 🔧 Modification Apportée

### Fichier Modifié

- `units/odoo/custom-addons/dorevia_vault_connector/models/dorevia_dvig_service.py`

### Changement

**Avant** :
```python
def job_trigger_worker(self, limit=50):
    # Traiter directement l'outbox (qui est vide)
    result = self.trigger_worker(limit=limit)
    # ...
```

**Après** :
```python
def job_trigger_worker(self, limit=50):
    # 1. Envoyer d'abord les factures en 'todo' vers DVIG /ingest
    moves_todo = self.env['account.move'].search([
        ('state', '=', 'posted'),
        ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
        ('dorevia_vault_status', '=', 'todo'),
    ], limit=limit)
    
    for move in moves_todo:
        # Envoyer vers /ingest (comme CRON #1)
        # ...
        move.write({'dorevia_vault_status': 'pending_proof', ...})
    
    # 2. Maintenant traiter l'outbox avec /internal/outbox/process
    result = self.trigger_worker(limit=limit)
    
    # 3. Enchaîner job_vault_fetch_proof
    # ...
```

---

## ✅ Nouveau Flux

```
1. action_post() facture
   ↓
2. status='todo' + enqueue job_trigger_worker
   ↓
3. job_trigger_worker s'exécute
   ↓
4. ✅ Envoi facture vers DVIG /ingest (événement dans outbox)
   ↓
5. ✅ Traitement outbox avec /internal/outbox/process
   ↓
6. ✅ Forward vers Vault
   ↓
7. ✅ Enchaînement job_vault_fetch_proof
   ↓
8. ✅ Statut → vaulted (latence < 15s)
```

---

## 🧪 Tests Recommandés

1. **Test Happy Path** : Créer une facture et vérifier le vaulting en < 15s
2. **Test Logs** : Vérifier que `job_trigger_worker` envoie bien vers `/ingest` avant de traiter l'outbox
3. **Test Filets de Sécurité** : Vérifier que les CRONs continuent de fonctionner

---

## 📝 Notes

- La logique d'envoi vers `/ingest` est réutilisée depuis CRON #1
- Les erreurs lors de l'envoi vers `/ingest` ne bloquent pas le traitement de l'outbox
- Les filets de sécurité (CRONs) restent actifs

---

**Date** : 2026-01-12  
**Statut** : ✅ **CORRIGÉ**
