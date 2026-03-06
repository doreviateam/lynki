# Points verrouillés avant P0 — Adapter Replay

**Date :** 2026-02-19  
**Mise à jour :** 2026-02-21 (DoD P0 acté)  
**Contexte :** SPEC ERP Reconnect v1.2 — Vault → Adapter Odoo

---

## 1. Timeout HTTP Adapter

| Élément | Implémentation |
|--------|------------------|
| **Timeout configuré** | `ODOO_TIMEOUT_SEC` (env, défaut 30s) ou `options.odoo_timeout_sec` |
| **Retry raisonnable** | `ODOO_RETRY_MAX` (env, défaut 2) — retry sur erreur réseau et HTTP 5xx |
| **Pas de blocage infini** | `http.Client.Timeout` strict, backoff 2s/4s entre retries |

---

## 2. Validation stricte des réponses Odoo

**Applied** uniquement si :

- HTTP 200 ou 201
- `status` ∈ { `applied`, `created`, `updated` }
- `move_id` / `payment_id` / `partner_id` > 0

Sinon → `ApplyResult.Failed = true`.

---

## 3. Gestion erreurs partielles

**Décision explicite :**

| Situation | Job status | Commentaire |
|-----------|------------|-------------|
| Tous appliqués | `completed` | — |
| Certains en échec | `completed` | `error_message` = "N événement(s) en échec — voir logs" |
| Erreur bloquante | `failed` | Pas d'Odoo URL, List events échoue |

Chaque échec : log + `AppendReplayJobLog` (warn). Les stats `applied/skipped/failed` donnent le détail.

---

## 4. Auth Basic

| Contexte | Action |
|----------|--------|
| **Prod** | Credentials depuis secret manager → `options.odoo_user`, `options.odoo_password` |
| **admin/admin** | Log `Warn` : "en prod utiliser credentials depuis secret manager" |

Ne pas hardcoder admin/admin en prod.

---

## 5. DoD P0 — Statut

**Acté le 2026-02-21** : validation E2E réussie (3 partners, 10 factures, 5 paiements). Procédure : `DOD_P0_VALIDATION_STAGING.md`, script `run_dod_p0_validation.sh`.

---

## Fichiers modifiés

- `internal/config/config.go` — OdooTimeoutSec, OdooRetryMax
- `internal/replay/adapter.go` — doWithRetry, isAppliedStatus, validation stricte
- `internal/replay/runner.go` — buildAdapter (timeout, retry, auth warn), status completed + error_message
