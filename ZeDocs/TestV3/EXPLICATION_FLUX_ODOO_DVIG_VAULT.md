# 📋 Explication du Flux Odoo → DVIG → Vault

**Date** : 2026-01-11  
**Contexte** : Facture FAC/2026/00001 en statut `pending_proof`

---

## 🔄 Flux Complet (Asynchrone)

### Étape 1 : Odoo → DVIG (CRON #1) ✅ **FAIT**
```
Odoo CRON #1 (cron_vault_send_dvig)
  ↓
POST /ingest vers DVIG
  ↓
DVIG stocke l'événement dans outbox_events (status='accepted')
  ↓
Odoo met à jour : dorevia_vault_status = 'pending_proof'
```

**Résultat actuel** : ✅ L'événement est dans la outbox DVIG

---

### Étape 2 : DVIG → Vault (Worker Asynchrone) ⏳ **EN ATTENTE**
```
DVIG Outbox Worker (process_outbox_events)
  ↓
Sélectionne les événements status='accepted' de outbox_events
  ↓
Pour chaque événement :
  - POST /api/v1/events vers Vault
  - Vault stocke le document
  - Mise à jour : status='forwarded'
```

**Problème actuel** : ⚠️ **Le worker DVIG n'est pas en cours d'exécution**

Le worker doit être :
- Lancé manuellement : `python -m dvig.cli.outbox_worker --limit 50`
- Ou configuré en CRON pour s'exécuter automatiquement

---

### Étape 3 : Odoo → Vault (CRON #2) ⏳ **EN ATTENTE**
```
Odoo CRON #2 (cron_vault_fetch_proof)
  ↓
GET /api/v1/proof/account_move/1896 vers Vault
  ↓
Si document trouvé :
  - Récupération de la preuve (hash, JWS, etc.)
  - Odoo met à jour : dorevia_vault_status = 'vaulted'
```

**Résultat actuel** : ⏳ Le document n'existe pas encore dans Vault (normal, étape 2 pas encore faite)

---

## 🎯 Situation Actuelle

### ✅ Ce qui fonctionne
1. **CRON #1** : L'événement a été envoyé vers DVIG avec succès
2. **Outbox DVIG** : L'événement est stocké dans `outbox_events` avec `status='accepted'`
3. **Statut Odoo** : `pending_proof` (correct, en attente de l'étape 2)
4. **Endpoint Vault** : Fonctionne correctement (retourne 404 au lieu de 500)

### ⏳ Ce qui est en attente
1. **Worker DVIG** : Doit traiter l'événement de l'outbox et l'envoyer vers Vault
2. **Document dans Vault** : Une fois l'étape 2 faite, le document sera dans Vault
3. **CRON #2** : Pourra alors récupérer la preuve et mettre le statut à `vaulted`

---

## 🔧 Solution : Lancer le Worker DVIG

### Option 1 : Lancement manuel (test)
```bash
docker exec -it dvig-core-stinger python3 -m dvig.cli.outbox_worker --limit 50
```

### Option 2 : Configuration CRON (production)
Le worker doit être configuré pour s'exécuter automatiquement, par exemple :
- Via un CRON système dans le conteneur
- Via un service systemd
- Via un orchestrateur (Kubernetes Jobs, etc.)

### Option 3 : Worker en continu (production recommandée)
Le worker peut tourner en continu et traiter les événements au fur et à mesure :
```bash
# Dans le conteneur DVIG
while true; do
  python3 -m dvig.cli.outbox_worker --limit 50
  sleep 10  # Attendre 10 secondes avant le prochain batch
done
```

---

## 📊 Vérification de l'État

### Vérifier les événements dans l'outbox DVIG
```sql
-- PostgreSQL (si DVIG utilise PostgreSQL)
SELECT event_id, tenant, status, attempt_count, created_at 
FROM outbox_events 
WHERE status = 'accepted'
ORDER BY created_at DESC;
```

### Vérifier si le document est dans Vault
```sql
-- PostgreSQL Vault
SELECT id, filename, odoo_model, odoo_id, created_at 
FROM documents 
WHERE odoo_id = 1896;
```

### Vérifier le statut dans Odoo
```python
invoice = env['account.move'].search([('name', '=', 'FAC/2026/00001')], limit=1)
print(f"Statut: {invoice.dorevia_vault_status}")
```

---

## 🎯 Résumé

**Pourquoi le document n'est pas encore dans Vault ?**

Parce que le **worker DVIG n'a pas encore traité l'événement** de l'outbox pour l'envoyer vers Vault.

**Le flux est asynchrone** :
1. ✅ Odoo → DVIG : **FAIT** (événement dans outbox)
2. ⏳ DVIG → Vault : **EN ATTENTE** (worker doit traiter l'outbox)
3. ⏳ Odoo → Vault : **EN ATTENTE** (CRON #2 attend que le document soit dans Vault)

**Action requise** : Lancer le worker DVIG pour traiter l'outbox et envoyer le document vers Vault.

---

**Auteur** : Assistant IA (Auto)  
**Date** : 2026-01-11
