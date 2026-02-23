# Audit flux de vaultage — Facture 2727 (FAC/2026/00069)

**Date** : 2026-02-22  
**Contexte** : Incrémentation du compteur de tentatives OK, mais facture ne passe jamais en « Protégée ».

---

## 1. Schéma du flux

```
Odoo (account.move posté)
    │
    ├─► POST /ingest (DVIG) ─► outbox_events (status=accepted)
    │
    ▼
DVIG Worker (scheduler 10s ou trigger Odoo)
    │
    ├─► POST /api/v1/invoices (Vault)  [invoice.posted]
    │   ou POST /api/v1/events (fallback)
    │   ou POST /api/v1/payments (payment.posted)
    │
    ▼
Vault
    │
    ├─► Crée document (odoo_model=account.move, odoo_id=2727)
    │
    ▼
Odoo cron / action « Sécuriser maintenant »
    │
    └─► GET /api/v1/proof/account_move/2727 ─► 404 ou 200
```

---

## 2. Points de vérification

### 2.1 Odoo → DVIG (ingest)

| Vérification | Commande / Méthode |
|-------------|--------------------|
| Event reçu par DVIG | Facture a `dorevia_dvig_event_id` = ad2283f7-b410-48df-9272-2148d662dcb4 ✅ |
| Config Odoo | `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.dvig.source` |

### 2.2 DVIG outbox

| Vérification | Commande |
|-------------|----------|
| Event dans outbox | `docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "SELECT event_id, status, last_error, attempt_count, next_retry_at FROM outbox_events WHERE event_id = 'ad2283f7-b410-48df-9272-2148d662dcb4';"` |
| Statuts possibles | accepted, forwarding, forwarded, failed_soft, failed_hard |
| Si failed_soft | Vérifier `last_error` |

### 2.3 DVIG → Vault (forward)

| Vérification | Détail |
|-------------|--------|
| URL cible | `http://vault-core-stinger:8080/api/v1/invoices` (VAULT_HOST) |
| Auth Vault | Vault AUTH_ENABLED=true — DVIG envoie X-Tenant, pas de Bearer ? |
| Réponse Vault | 201 = document créé, 4xx/5xx = échec |

### 2.4 Vault — Document créé

| Vérification | Commande |
|-------------|----------|
| Document pour odoo_id 2727 | `docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "SELECT id, odoo_model, odoo_id, tenant, created_at FROM documents WHERE odoo_model='account.move' AND odoo_id=2727;"` |
| Colonne lookup | `GetDocumentBySourceID` cherche `odoo_model='account.move' AND odoo_id::text='2727'` |

### 2.5 Vault — Endpoints exposés

| Endpoint | Rôle | Enregistré |
|----------|------|------------|
| POST /api/v1/invoices | Ingestion factures Odoo | ✅ Oui (vaulting.go) |
| POST /api/v1/events | Fallback DVIG | ✅ Oui |
| POST /api/v1/payments | Ingestion paiements Odoo (payment.posted) | ✅ Oui (depuis 2026-02-23) |
| GET /api/v1/proof/account_move/:id | Récupération preuve facture | ✅ Oui |
| GET /api/v1/proof/account_payment/:id | Récupération preuve paiement | ✅ Oui |

Toutes les routes vaulting sont enregistrées dans `sources/vault/internal/server/vaulting.go` via `RegisterVaultingRoutes`.

---

## 3. Corrections appliquées (2026-02-22)

| Action | Fichier | Modification |
|--------|---------|--------------|
| Enregistrement routes | `sources/vault/internal/server/vaulting.go` | Fichier créé — `POST /api/v1/invoices`, `GET /api/v1/proof/account_move/:id`, etc. |
| Appel dans main | `sources/vault/cmd/vault/main.go` | `server.RegisterVaultingRoutes(app, db, &cfg, log)` ajouté avant replay |
| Build | `sources/vault` | `go build ./cmd/vault` ✅ réussi |

### 3bis. Corrections paiements (2026-02-23)

| Action | Fichier / Composant | Modification |
|--------|---------------------|--------------|
| POST /api/v1/payments | `sources/vault/internal/server/vaulting.go` | Route ajoutée via `PaymentsService` + `PaymentsHandler` |
| Retry failed_hard | `sources/dvig` | Endpoint `POST /internal/outbox/retry` pour réinitialiser événements failed_hard |
| Tenant Odoo | `dorevia_vault_connector/models/account_payment.py` | Utilise `cfg['tenant']` (`dorevia.vault.tenant`) au lieu de `dorevia.tenant` |
| company_id paiements | `sources/vault/internal/services/payments_service.go` | Dérive `company_id = "odoo:N"` depuis `CompanyID` si `CompanyIDString` vide |
| Exclure odoo:0 Linky | `units/dorevia-linky/app/api/companies/route.ts` | odoo:0 exclu de la liste (éviter auto-sélection par défaut) |
| Badge preuves Linky | `units/dorevia-linky` | Poll 2 min, bouton ↻ pour rafraîchir, `onRefreshMetrics` |

**Prochaines étapes** :
1. ✅ Build : `docker build -t dorevia/vault:vaulting-routes -f sources/vault/Dockerfile sources/vault`
2. ✅ Redémarrage : `docker compose -p dorevia_core-stinger_platform up -d vault --force-recreate`
3. Vérifier outbox DVIG : statut de l’event `ad2283f7-b410-48df-9272-2148d662dcb4` — si `failed_soft`, relancer le forward après redéploiement
4. ✅ Routes OK : GET proof/2727 → 404 `{"error":"Proof not found"}` | GET invoices → 405

---

## 4. Actions recommandées (post-déploiement)

1. **Vérifier les routes Vault exposées**  
   - Tester `curl https://vault.core-stinger.doreviateam.com/api/v1/invoices` (GET → 405 attendu)  
   - Tester `curl https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/2727` (404 = route absente ou doc absent)

2. **Requêtes SQL de diagnostic** (si accès DB)  
   - Outbox : statut de l’event ad2283f7…  
   - Documents : présence d’un document odoo_id=2727  

3. **Routes Vault** (✅ complètes depuis 2026-02-23) — `RegisterVaultingRoutes` enregistre :
   - `InvoicesHandler`, `EventsHandler`, `PaymentsHandler`
   - Routes proof : `account_move`, `account_payment`, `pos_order`, `pos_payment`

4. **Logs DVIG**  
   - `docker logs dvig-core-stinger 2>&1 | grep -E "outbox|forward|ad2283f7|2727"`  
   - Rechercher `outbox_event_forwarded` ou `outbox_event_failed_soft`

---

## 5. Script de diagnostic

```bash
./scripts/audit_vaultage_flow.sh 2727
```

---

## 6. Config pour flux 100 % automatique (sans bouton « Sécuriser maintenant »)

Pour que les factures passent automatiquement en « Protégée » sans action utilisateur :

| Paramètre | Rôle |
|-----------|------|
| `dorevia.dvig.url` | URL DVIG (ingest) |
| `dorevia.dvig.token` | Token pour /ingest |
| `dorevia.dvig.source` | Source (ex. `odoo.stinger.sarl-la-platine`) |
| `dorevia.vault.url` | URL Vault pour fetch proof |
| **`dorevia.dvig.internal.url`** | URL pour déclencher le worker (ex. `https://dvig.../internal/outbox/process`) |
| **`dorevia.dvig.internal.token`** | Token pour /internal/outbox/process (souvent = `DVIG_INTERNAL_TOKEN` du compose) |

Sans `dorevia.dvig.internal.token`, le CRON ne peut pas déclencher le worker ; les événements attendent le scheduler DVIG (30 s par défaut). Pour un flux rapide et fiable, lancer : `./scripts/set_odoo_config_duree_vault_30s.sh`

**Correction 2026-02-23** : Le CRON `cron_vault_send_dvig` appelle désormais `trigger_worker` à chaque exécution, ce qui garantit le traitement immédiat de l’outbox DVIG même sans queue_job.

---

## 7. Références

- DVIG worker : `sources/dvig/workers/outbox_worker.py` — routage invoice.posted → /api/v1/invoices
- Vault InvoicesHandler : `sources/vault/internal/handlers/invoices.go`
- Vault Proof : `sources/vault/internal/handlers/proof.go` — `GetDocumentBySourceID`
- Odoo connecteur : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`
