# ANNEXE — Mapper raw → canonique, Backfill, Schémas JSON

**Date :** 2026-02-21  
**Rattachement :** `SPEC_ERP_Reconnect_v1.2.md`  
**But :** Fixer les structures réelles pour mapper, backfill et schémas formels.

---

## 1. Payload DVIG raw (source)

### 1.1 Format Odoo → DVIG ingest

Odoo (`dorevia_vault_connector`) envoie à DVIG `/ingest` un payload structuré ainsi.  
**Source :** `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`, `account_payment.py` (`_build_dvig_payload`).

#### invoice.posted

```json
{
  "source": "odoo.stinger.sarl-la-platine",
  "event_type": "invoice.posted",
  "idempotency_key": "<sha256>",
  "data": {
    "db": "odoo_stinger_sarl-la-platine",
    "model": "account.move",
    "id": 1234,
    "name": "FAC/2026/00001",
    "move_type": "out_invoice",
    "partner_id": 42,
    "partner_name": "Client SARL",
    "amount_total": 1200.00,
    "amount_untaxed": 1000.00,
    "amount_tax": 200.00,
    "currency": "EUR",
    "date": "2026-02-15",
    "invoice_date": "2026-02-15"
  }
}
```

#### payment.posted

```json
{
  "source": "odoo.stinger.sarl-la-platine",
  "event_type": "payment.posted",
  "idempotency_key": "<sha256>",
  "data": {
    "db": "odoo_stinger_sarl-la-platine",
    "model": "account.payment",
    "id": 567,
    "name": "PAY/2026/00001",
    "amount": 500.00,
    "currency": "EUR",
    "date": "2026-02-16",
    "partner_id": 42,
    "partner_name": "Client SARL",
    "payment_type": "inbound",
    "method": "transfer",
    "is_refund": false,
    "company_id": 1,
    "memo": ""
  }
}
```

### 1.2 DVIG outbox_events

DVIG persiste dans `outbox_events` (schéma `sources/dvig/migrations/006_create_outbox_events.sql`) :

| Colonne | Type | Usage |
|---------|------|-------|
| event_id | UUID | Généré par DVIG |
| idempotency_key | VARCHAR(64) | SHA256 Odoo |
| tenant | VARCHAR(50) | Tenant |
| payload | JSONB | Payload complet (inclut event_type, data) |
| status | VARCHAR(20) | accepted, forwarded, etc. |

Le `payload` contient le même JSON que ci-dessus (source, event_type, idempotency_key, data).

---

## 2. Schémas canoniques (dorevia.economic_event.v1)

### 2.1 invoice_issued

**event_type :** `invoice_issued`

```json
{
  "event_type": "invoice_issued",
  "invoice_id": "FAC/2026/00001",
  "partner_ref": "42",
  "partner_name": "Client SARL",
  "amount_total": 1200.00,
  "amount_untaxed": 1000.00,
  "amount_tax": 200.00,
  "currency": "EUR",
  "date": "2026-02-15",
  "invoice_date": "2026-02-15",
  "move_type": "out_invoice"
}
```

| Champ | Source raw | Règle |
|-------|------------|-------|
| invoice_id | data.name | Identifiant facture |
| partner_ref | str(data.partner_id) | Valeur stable (spec §8 D) |
| partner_name | data.partner_name | Libellé |
| amount_total | data.amount_total | Float |
| amount_untaxed | data.amount_untaxed | Float |
| amount_tax | data.amount_tax | Float |
| currency | data.currency | ISO 4217 |
| date | data.date | Date ISO |
| invoice_date | data.invoice_date | Date ISO |
| move_type | data.move_type | out_invoice, in_invoice, etc. |

### 2.2 payment_received / payment_sent

**event_type :** `payment_received` (inbound) ou `payment_sent` (outbound)

```json
{
  "event_type": "payment_received",
  "payment_id": "PAY/2026/00001",
  "partner_ref": "42",
  "partner_name": "Client SARL",
  "amount": 500.00,
  "currency": "EUR",
  "date": "2026-02-16",
  "payment_type": "inbound",
  "method": "transfer",
  "is_refund": false,
  "company_id": 1
}
```

| Champ | Source raw | Règle |
|-------|------------|-------|
| payment_id | data.name | Identifiant paiement |
| partner_ref | str(data.partner_id) | Valeur stable |
| partner_name | data.partner_name | Libellé |
| amount | data.amount | Float |
| currency | data.currency | ISO 4217 |
| date | data.date | Date ISO |
| payment_type | data.payment_type | inbound / outbound |
| method | data.method | transfer, cash, etc. |
| is_refund | data.is_refund | Booléen |
| company_id | data.company_id | Entier |

### 2.3 counterparty (pour partner/upsert)

**Champs obligatoires :** `name`, `partner_ref`.  
**Champs optionnels :** `vat`, `email`, `street`, `city`, `zip`, `country`.

```json
{
  "name": "Client SARL",
  "partner_ref": "42",
  "vat": "FR12345678901"
}
```

| Champ | Source raw | Règle |
|-------|------------|-------|
| name | data.partner_name | Libellé |
| partner_ref | str(data.partner_id) | Valeur stable (clé dédup) |
| vat | — | Extrait du raw si disponible (achat) |

**`partner_ref`** : toujours issu du raw (`partner_id` ou `vat`). Jamais généré (pas de nom, pas de hash).

---

## 3. Règles de mapping raw → canonique

### 3.1 invoice.posted → invoice_issued

| Canonique | Raw | Règle |
|-----------|-----|-------|
| event_type | — | `invoice_issued` (inbound) ou `invoice_refund` (out_refund/in_refund) selon move_type |
| invoice_id | data.name | Direct |
| partner_ref | data.partner_id | `str(data.partner_id)` |
| partner_name | data.partner_name | Direct |
| amount_* | data.amount_* | Direct (float) |
| currency | data.currency | Direct, défaut EUR |
| date | data.date | Direct |
| invoice_date | data.invoice_date | Direct, fallback date |
| move_type | data.move_type | Direct |

### 3.2 payment.posted → payment_received / payment_sent

| Canonique | Raw | Règle |
|-----------|-----|-------|
| event_type | data.payment_type | `payment_received` si inbound, `payment_sent` si outbound |
| payment_id | data.name | Direct |
| partner_ref | data.partner_id | `str(data.partner_id)` |
| partner_name | data.partner_name | Direct |
| amount | data.amount | Direct (float) |
| currency | data.currency | Direct, défaut EUR |
| date | data.date | Direct |
| payment_type | data.payment_type | Direct |
| method | data.method | Direct |
| is_refund | data.is_refund | Direct |
| company_id | data.company_id | Direct |

### 3.3 Extraction counterparty (pour partner/upsert)

Extraire des payloads `invoice_issued` ou `payment_received` :

- `name` ← partner_name
- `partner_ref` ← partner_ref (déjà en str)
- `vat` ← si présent dans le raw (ex. buyer_vat, seller_vat selon modèle)

---

## 4. Backfill — Structure des tables Vault

### 4.1 Table `documents` (Vault)

**Source :** `sources/vault/migrations/`, `internal/models/document.go`

Colonnes pertinentes pour le backfill :

| Colonne | Type | Usage backfill |
|---------|------|----------------|
| id | UUID | event_id généré pour economic_events |
| tenant | VARCHAR | tenant |
| source | TEXT | 'sales', 'purchase', 'payment', 'pos' |
| odoo_model | TEXT | account.move, account.payment |
| odoo_id | INTEGER | ID source |
| move_type | VARCHAR | out_invoice, in_invoice, etc. |
| invoice_number | TEXT | = name facture |
| invoice_date | DATE | Date facture |
| total_ht | DECIMAL | amount_untaxed |
| total_ttc | DECIMAL | amount_total |
| currency | TEXT | Devise |
| idempotency_key | VARCHAR | Clé idempotence |
| payload_json | JSONB | Payload brut (POS) |
| created_at | TIMESTAMP | timestamp |
| company_id | TEXT | Multi-société |

**Règles extraction :**

- **Factures** : `source IN ('sales','purchase')` ou `odoo_model = 'account.move'` → `invoice_issued`
- **Paiements** : `source = 'payment'` ou `odoo_model = 'account.payment'` → `payment_received` / `payment_sent`

### 4.2 Table `outbox_events` (DVIG, optionnel)

Si le backfill lit depuis DVIG (copie ou accès cross-DB) :

| Colonne | Usage |
|---------|--------|
| event_id | UUID événement DVIG |
| tenant | Tenant |
| payload | JSONB (format raw §1) |
| created_at | Timestamp |

Le `payload` contient `event_type` et `data`. Mapper via les règles §3.

**Note :** Pour le MVP, le backfill peut se limiter à la table Vault `documents`. Les `outbox_events` DVIG servent si les documents n’ont pas encore été créés ou pour une source complémentaire.

### 4.3 Pas de table `payments` dédiée

Les paiements Vault sont stockés dans `documents` avec `source = 'payment'`.  
**Source :** `sources/vault/internal/handlers/payments.go`, `migrations/024_allow_source_payment.sql`.

---

## 5. Ordre d’extraction backfill

1. **Documents factures** : `SELECT * FROM documents WHERE tenant = $1 AND (source IN ('sales','purchase') OR odoo_model = 'account.move') ORDER BY created_at ASC, id ASC`
2. **Documents paiements** : `SELECT * FROM documents WHERE tenant = $1 AND (source = 'payment' OR odoo_model = 'account.payment') ORDER BY created_at ASC, id ASC`
3. **Fusion** : concaténer les deux jeux, tri global `timestamp ASC, event_id ASC` (timestamp = created_at ou date métier selon dispo)
4. **Mapper** : chaque ligne → `dorevia.economic_event.v1` via les règles §3
5. **Insérer** : dans `economic_events` avec sequence, write barrier active

---

## 6. JSON Schema formel (MVP)

### 6.1 invoice_issued (payload_json canonique)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["event_type", "invoice_id", "partner_ref", "amount_total", "currency", "date"],
  "properties": {
    "event_type": { "const": "invoice_issued" },
    "invoice_id": { "type": "string" },
    "partner_ref": { "type": "string" },
    "partner_name": { "type": "string" },
    "amount_total": { "type": "number" },
    "amount_untaxed": { "type": "number" },
    "amount_tax": { "type": "number" },
    "currency": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "date": { "type": "string", "format": "date" },
    "invoice_date": { "type": "string", "format": "date" },
    "move_type": { "type": "string", "enum": ["out_invoice", "in_invoice", "out_refund", "in_refund"] }
  }
}
```

### 6.2 payment_received / payment_sent

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["event_type", "payment_id", "partner_ref", "amount", "currency", "date"],
  "properties": {
    "event_type": { "type": "string", "enum": ["payment_received", "payment_sent"] },
    "payment_id": { "type": "string" },
    "partner_ref": { "type": "string" },
    "partner_name": { "type": "string" },
    "amount": { "type": "number" },
    "currency": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "date": { "type": "string", "format": "date" },
    "payment_type": { "type": "string", "enum": ["inbound", "outbound"] },
    "method": { "type": "string" },
    "is_refund": { "type": "boolean" },
    "company_id": { "type": "integer" }
  }
}
```

### 6.3 counterparty (partner/upsert)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "partner_ref"],
  "properties": {
    "name": { "type": "string" },
    "partner_ref": { "type": "string" },
    "vat": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "street": { "type": "string" },
    "city": { "type": "string" },
    "zip": { "type": "string" },
    "country": { "type": "string" }
  }
}
```

---

*Fin d'annexe.*
