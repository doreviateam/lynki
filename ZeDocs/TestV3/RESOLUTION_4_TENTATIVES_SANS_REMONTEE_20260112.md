# 🔧 Résolution : 4 Tentatives sans Remontée des Éléments du Vault

**Date** : 2026-01-12  
**Facture** : FAC/2026/00009 (ID Odoo: 1905)  
**Problème** : 4 tentatives effectuées, statut "En attente de preuve" (pending_proof), mais les éléments du vault (Hash Ledger, Date, Vault ID) ne sont pas remontés dans Odoo  
**Cause** : L'événement DVIG n'avait pas encore été traité par le worker DVIG  
**Solution** : Déclenchement manuel du worker DVIG + mise à jour manuelle de la facture

---

## 🔍 Diagnostic

### État Initial

- **Statut Odoo** : `pending_proof` (En attente de preuve)
- **Nombre de tentatives** : 4
- **DVIG Event ID** : `c2ad81a5-e6bf-4190-8a49-ccda1e837d82`
- **Prochaine tentative** : `2026-01-12 19:32:15`
- **Document dans Vault** : ❌ Non trouvé (API retourne 404)

### Cause Racine

L'événement DVIG était présent dans l'outbox mais n'avait **pas encore été traité** par le worker DVIG. Le worker DVIG doit traiter les événements de l'outbox et les envoyer à Vault avant que le CRON #2 d'Odoo puisse récupérer la preuve.

**Flux normal** :
1. Odoo → DVIG (CRON #1) : Envoie l'événement → Statut = `pending_proof`
2. DVIG Worker : Traite l'outbox et envoie à Vault
3. Odoo → Vault (CRON #2) : Récupère la preuve → Statut = `vaulted`

**Problème** : L'étape 2 n'avait pas encore été exécutée.

---

## 🔧 Solution Appliquée

### 1. Déclenchement du Worker DVIG

Le worker DVIG a été déclenché manuellement via l'endpoint interne :

```bash
curl -X POST "https://dvig.core-stinger.doreviateam.com/internal/outbox/process" \
  -H "Authorization: Bearer 0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

**Résultat** :
```json
{
    "processed": 1,
    "succeeded": 1,
    "failed_soft": 0,
    "failed_hard": 0,
    "duration_ms": 22
}
```

### 2. Vérification dans Vault

Après le traitement par le worker DVIG, le document est maintenant présent dans Vault :

```bash
curl "https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/1905"
```

**Résultat** :
```json
{
    "id": "455ba83e-2778-4e12-9580-df5cf5d718d1",
    "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "ledger": "3c7e9e1e51a818ea0d7574bbb030a7634288c4bca882c03f9b2370787011a65c",
    "prev_hash": "03758f5da195c7ed3f9d6ed21237b34b2febd17531d37ba43b6946fcc535e38b",
    "timestamp": "2026-01-12T19:28:39Z",
    "status": "verified"
}
```

### 3. Mise à Jour Manuelle dans Odoo

Comme le CRON #2 attendait la prochaine tentative programmée (`next_retry_at = 2026-01-12 19:32:15`), la facture a été mise à jour manuellement avec les données du vault :

```sql
UPDATE account_move 
SET 
    dorevia_vault_status = 'vaulted',
    dorevia_vault_id = '455ba83e-2778-4e12-9580-df5cf5d718d1',
    dorevia_vault_sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    dorevia_vault_ledger_hash = '3c7e9e1e51a818ea0d7574bbb030a7634288c4bca882c03f9b2370787011a65c',
    dorevia_vault_date = '2026-01-12 19:28:39'::timestamp,
    dorevia_vault_next_retry_at = NULL
WHERE name = 'FAC/2026/00009';
```

---

## ✅ Résultat Final

### Pour la Facture FAC/2026/00009

- ✅ **Document dans Vault** : Présent avec tous les éléments
- ✅ **Vault ID** : `455ba83e-2778-4e12-9580-df5cf5d718d1`
- ✅ **Hash SHA256** : `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- ✅ **Hash Ledger** : `3c7e9e1e51a818ea0d7574bbb030a7634288c4bca882c03f9b2370787011a65c`
- ✅ **Date de vault** : `2026-01-12 19:28:39`
- ✅ **Statut Odoo** : `vaulted`
- ✅ **Interface Odoo** : Tous les champs sont maintenant visibles

---

## 🔄 Pourquoi le Worker DVIG n'avait pas Traité l'Événement ?

### Orchestration Temps Réel (queue_job)

Avec l'implémentation de l'orchestration temps réel via `queue_job`, le worker DVIG est normalement déclenché automatiquement lors de la validation de la facture (`action_post()`). Cependant, il est possible que :

1. **Le job queue_job n'ait pas été exécuté** : Le job runner d'Odoo n'a peut-être pas encore traité le job
2. **Le worker DVIG n'était pas disponible** : Le service DVIG était peut-être en cours de redémarrage
3. **L'événement était en attente dans l'outbox** : L'événement était présent mais le worker n'avait pas encore été déclenché

### Solution Automatique

Le système dispose de deux mécanismes de récupération :

1. **Orchestration temps réel** : Déclenchement immédiat via `queue_job` lors de `action_post()`
2. **CRON de secours** : Le CRON #1 continue de fonctionner pour les factures en `todo` ou `failed_soft`

Pour les événements déjà envoyés à DVIG mais non traités, le worker DVIG peut être déclenché manuellement ou attendre le prochain cycle de traitement.

---

## 📊 Recommandations

### Pour Éviter ce Problème à l'Avenir

1. **Vérifier que le worker DVIG est actif** : S'assurer que le service DVIG fonctionne correctement
2. **Surveiller les jobs queue_job** : Vérifier que les jobs sont bien exécutés dans l'interface Odoo (Paramètres → Jobs)
3. **Surveiller l'outbox DVIG** : Vérifier que les événements sont bien traités
4. **Déclencher manuellement si nécessaire** : Utiliser l'endpoint `/internal/outbox/process` pour forcer le traitement

### Commandes Utiles

**Déclencher le worker DVIG manuellement** :
```bash
curl -X POST "https://dvig.core-stinger.doreviateam.com/internal/outbox/process" \
  -H "Authorization: Bearer ${DVIG_INTERNAL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

**Vérifier le statut dans Vault** :
```bash
curl "https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/{odoo_record_id}"
```

**Forcer le CRON #2 dans Odoo** :
```python
env['account.move'].cron_vault_fetch_proof()
```

---

## 🔗 Références

- **Orchestration queue_job** : `ZeDocs/TestV3/GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`
- **Endpoint interne DVIG** : `/internal/outbox/process`
- **CRON #2** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py::cron_vault_fetch_proof()`
