# SPEC Observabilité trace_id v1.0 — version consolidée

**Date** : 2026-02-23  
**Statut** : prête à coder

---

## 1. Définition trace_id

- **Format** : UUID v4 (lowercase), transport HTTP header `X-Trace-Id`
- **Règle** : un `trace_id` par requête HTTP (pas par event « à vie »)

### Propagation

| Origine | Comportement |
|---------|--------------|
| **DVIG** | Génère trace_id (nouveau à chaque tentative de forward), envoie `X-Trace-Id` |
| **Vault** | Récupère `X-Trace-Id` ; si absent/invalide, génère un UUID v4 et log `trace_id_invalid=true` ; **renvoie toujours** `X-Trace-Id` en réponse |
| **Odoo → Vault (proof)** | Génère un UUID v4 par appel GET proof, envoie `X-Trace-Id` + `X-Tenant` |

### X-Trace-Id sur toutes les réponses

**Exigence explicite** : Vault ajoute `X-Trace-Id` sur **toutes** les réponses HTTP — 2xx, 4xx, 5xx. Le middleware Trace le pose avant d’appeler les handlers ; aucune réponse ne doit l’omettre.

---

## 2. Conventions logs

- **Format** : JSON 1 ligne
- **Champs communs obligatoires** : `ts`, `level`, `component`, `service`, `msg_code`, `trace_id`, `tenant`
- **Champs communs recommandés** : `duration_ms`, `http_method`, `path`, `http_status`
- **Champs diagnostic** (optionnels mais très rentables) :
  - `trace_id_source` = `"header"` \| `"generated"` \| `"invalid_replaced"` — composant n’envoie plus le header ?
  - `tenant_source` = `"header"` \| `"default"` \| `"missing"` — 80 % des bugs proof not found viennent de là
- **Privacy** : jamais de tokens ni payload complet

---

## 3. Events de logs

### DVIG — outbox forward

| msg_code | Champs |
|----------|--------|
| `vault_forward_ok` | event_id, attempt_count, target_url, http_status, duration_ms, vault_status_family=2xx |
| `vault_forward_non2xx` | vault_status_family=4xx\|5xx, error_class, response_size_bytes, body_truncated (max 2048) |
| `vault_forward_error` | vault_status_family=timeout\|network\|exception, error_class, error |

### Vault — ingest (events/invoices/payments)

| msg_code | Champs |
|----------|--------|
| `vault_ingest_ok` | event_type, odoo_model, odoo_id, document_id, duration_ms, event_id (optionnel) |
| `vault_ingest_idempotent` | idem + existing_document_id |
| `vault_ingest_error` | error_class, error |

### Vault — proof lookup

| msg_code | Champs |
|----------|--------|
| `vault_proof_lookup_ok` | model_in, model_normalized, odoo_id, found=true, document_id, duration_ms |
| `vault_proof_lookup_not_found` | found=false, duration_ms |
| `vault_proof_lookup_error` | error_class, error |

### Odoo — sécuriser / cron

| msg_code | Champs |
|----------|--------|
| `vault_proof_fetch` | move_id, vault_url, http_status, result=protected\|not_found\|error, duration_ms, proof_id (optionnel) |

---

## 4. Tronquage / erreurs HTTP

- **body_truncated** : 2048 chars max, UTF-8 safe
- **response_size_bytes** : si dispo, préférer à body pour les stats
- **error_class** + **error** (message court) ; stack uniquement en debug

---

## 5. Privacy

| ❌ Interdit | ✅ Autorisé |
|-------------|-------------|
| Authorization, tokens | trace_id, event_id, odoo_id, odoo_model |
| payload complet | invoice_number (si déjà visible) |
| données perso | payload_sha256, payload_size_bytes |

---

## 6. Multi-tenant

**tenant** = valeur exacte du header `X-Tenant` (pas une version interne).

---

## 7. Bonus (v1.1)

Table `vault_ingest_audit` TTL 7 jours, alimentée **uniquement** sur non-2xx / error (éviter le grossissement rapide).
