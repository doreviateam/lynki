# SPEC — Vault Replay Button (ERP Reconnect) v1.2

**Date** : 2026-02-21  
**Statut** : Architecture souveraine consolidée — référence unique  
**Plan d'implémentation** : `PLAN_IMPLEMENTATION_ERP_Reconnect_Scrum.md`  
**Annexe modules Odoo** : `ANNEXE_Architecture_Modules_Odoo18_ERP_Adapter.md`  
**Annexe mapping / backfill / schémas** : `ANNEXE_Mapping_Backfill_Schema_JSON.md`  
**Décision structurante** : Le replay est servi uniquement depuis Vault via la table `economic_events`. DVIG est un adaptateur d'ingestion.

---

## 0. Principes non négociables

1. **Vault est canonique** : la vérité économique scellée est dans Vault.
2. **ERP-agnostic** : Vault ne dépend d'aucun modèle ERP.
3. **Déclenchement ≠ exécution** : Vault crée un job ; un Runner exécute.
4. **Idempotence** : relancer un replay ne duplique jamais (clé = `event_id`).
5. **Auditabilité** : journal d'exécution consultable + exportable.
6. **Dry-run d'abord** : par défaut, simulation sans écriture ERP.

---

## 1. Objectif et périmètre

**Objectif** : Depuis Vault, déclencher un replay vers un ERP cible (MVP : Odoo) afin d'assurer la continuité économique.

**Périmètre MVP (P0)** :
- Partners / Contacts : création minimale
- Invoices : reconstruction synthétique (header + 1 ligne « Vente HT »)
- Payments : encaissement/décaissement
- Open balances : recalcul soldes

**Hors périmètre (P1+)** : lignes détaillées produits, analytique, matching exact paiement↔facture.

---

## 2. Modèle de données Vault

### 2.1 Table `economic_events`

| Champ | Usage |
|-------|-------|
| `schema_version` | Évolution (ex: `dorevia.economic_event.v1`) |
| `ingest_source` | Traçabilité (ex: `dvig`, `manual`) |
| `ingest_idempotency_key` | Éviter double ingestion |
| `event_key` | Clé logique optionnelle (ex: `invoice:F2026-001`) |
| `company_id` | Multi-société futur (nullable) |

```sql
CREATE TABLE economic_events (
    event_id UUID PRIMARY KEY,
    tenant VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    sequence BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    payload_json JSONB NOT NULL,
    hash VARCHAR NOT NULL,
    prev_hash VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_payload_json JSONB,
    schema_version VARCHAR NOT NULL DEFAULT 'dorevia.economic_event.v1',
    ingest_source VARCHAR NOT NULL DEFAULT 'dvig',
    ingest_idempotency_key VARCHAR,
    event_key VARCHAR,
    company_id INTEGER,
    CONSTRAINT unique_sequence_per_tenant UNIQUE (tenant, sequence)
);

CREATE INDEX idx_economic_events_tenant_sequence ON economic_events (tenant, sequence);
CREATE INDEX idx_economic_events_tenant_timestamp ON economic_events (tenant, timestamp);
CREATE UNIQUE INDEX uniq_economic_events_tenant_event_key ON economic_events (tenant, event_key) WHERE event_key IS NOT NULL;
CREATE UNIQUE INDEX uniq_economic_events_tenant_ingest_key ON economic_events (tenant, ingest_idempotency_key) WHERE ingest_idempotency_key IS NOT NULL;
```

**🔐 A. Canonical Hash Definition (normatif)**

Le hash est calculé sur une représentation déterministe du `payload_json` canonique. Le `prev_hash` = hash du précédent événement.

**Règle de stabilité du JSON canonique** (obligatoire pour recalculabilité) :
- Clés triées (ordre alphabétique)
- Encodage UTF-8
- Pas d'espace (pas de séparateurs superflus)
- Nombres sérialisés sans format variable (ex : `1` pas `1.0`, `100` pas `1e2`)

Un changement de sérialiseur ne doit pas altérer le hash.

**Le hash est recalculable** à partir du `payload_json` canonique. Un auditeur peut vérifier l'intégrité du registre en recalculant hash et prev_hash sans dépendre d'un secret.

*En cas de non-respect : deux encodages différents du même contenu → hash différent → divergence entre preuve et replay.*

### 2.2 Table `tenant_sequences`

```sql
CREATE TABLE tenant_sequences (
    tenant VARCHAR PRIMARY KEY,
    last_sequence BIGINT NOT NULL
);
```

**Pseudo-code assignation sequence :**
```
BEGIN
  INSERT INTO tenant_sequences (tenant, last_sequence) VALUES ($tenant, 0) ON CONFLICT (tenant) DO NOTHING;
  SELECT last_sequence FROM tenant_sequences WHERE tenant = $tenant FOR UPDATE;
  next = last_sequence + 1;
  UPDATE tenant_sequences SET last_sequence = next WHERE tenant = $tenant;
  INSERT INTO economic_events (..., sequence, ...) VALUES (..., next, ...);
COMMIT
```
Tenant absent : `ON CONFLICT DO NOTHING`. Multi-workers : 1 writer/tenant à la fois.

---

## 3. Schéma canonique — ingestion — versioning

### 3.1 invoice_issued / payment_received

Structure `dorevia.economic_event.v1`. Exemples minimaux :

```json
{"event_type": "invoice_issued", "invoice_id": "F2026-001", "partner_ref": "...", "amount_total": 1000.00, "currency": "EUR", "date": "2026-02-15"}
```
```json
{"event_type": "payment_received", "payment_id": "PAY-001", "partner_ref": "...", "amount": 500.00, "currency": "EUR", "date": "2026-02-16"}
```

### 3.2 Ingestion — Où vit le mapper

Vault fait le mapping **à l'ingestion**. DVIG envoie raw ; Vault transforme → `payload_json` canonique. `source_payload_json` conservé (debug).

### 3.3 Versioning

- **v1** : stable. **v2+** : supporté à terme.

**🔁 B. Schema Evolution Policy (normatif)**

Le replay feed peut contenir plusieurs `schema_version`. Le runner doit refuser toute version non supportée.

**Toute évolution du schéma canonique** donnera lieu à `dorevia.economic_event.v2` (ou v3, etc.) **sans altération des événements v1 existants**. Les anciens events restent inchangés ; la chaîne prev_hash ne doit jamais être réécrite.

---

## 4. API Replay Feed

`GET /api/v1/replay/events` — Paramètres : tenant, from, to, types, cursor, limit.

**Limit** : limit max configurable (ex: 500). Si limit > max → clamp pour éviter requêtes énormes.

**Cursor** : base64(json) + '.' + base64(HMAC). Vérifier HMAC avant décoder.

**Filtres** : `from` (>=), `to` exclusif (<), `types` (vide = tous).

```sql
SELECT * FROM economic_events
WHERE tenant = $1 AND sequence > $2
  AND ($3::timestamptz IS NULL OR timestamp >= $3)
  AND ($4::timestamptz IS NULL OR timestamp < $4)
  AND (cardinality($5::text[]) = 0 OR event_type = ANY($5::text[]))
ORDER BY sequence ASC LIMIT $6;
```

---

## 5. Migration (Backfill)

1. Gel (write barrier : tenant lock / table tampon / refus 409)
2. Extraire : documents, events, payments
3. Tri : `timestamp ASC, event_id ASC`
4. Mapper → `dorevia.economic_event.v1`
5. Insérer avec sequence incrémentale. Idempotent (skip si event_id existe)
6. Déverrouiller

---

## 6. UX — Jobs API — Orchestration

**UX** : Bouton « Rebrancher un ERP » / « Dry-run ». Wizard : ERP cible, période, mode, stratégies.

**Jobs API** :
- `POST /api/v1/replay/jobs` — créer job
- `GET /api/v1/replay/jobs/{id}` — statut, progression
- `GET /api/v1/replay/jobs/{id}/logs` — logs
- `GET /api/v1/replay/jobs/{id}/report` — rapport (JSON/CSV/PDF)

**Flux** : Vault UI → POST job → Runner poll → GET replay/events → Adapter ERP → Vault met à jour.

**Table replay_jobs** : job_id, tenant, mode, status, range, options, progress, dates. Logs dans `replay_job_logs`.

---

## 7. Modules ERP requis

| Rôle | Module | Usage |
|------|--------|-------|
| **ERP source** (alimente Vault) | `dorevia_vault_connector` | Envoi factures/paiements vers DVIG → ingest Vault |
| **ERP cible** (reconnecté) | `dorevia_core` + `dorevia_adapter_odoo18` | Réception des événements du Runner (partner, invoice, payment, balances) |
| ERP cible | `account`, `product` | Dépendances Odoo standards |

**Architecture détaillée** : Voir annexe `ANNEXE_Architecture_Modules_Odoo18_ERP_Adapter.md` (graphe de dépendances, modèle `dorevia.replay.mapping`, endpoints, produit synthétique).

**Installation** : Sur l'ERP cible : `dorevia_core` puis `dorevia_adapter_odoo18`. Sur l'ERP source : `dorevia_vault_connector` pour l'ingestion continue.

**État final cible (ex. sarl-la-platine)** : Dorevia Linky continue de tourner ; Odoo accessible à `https://odoo.stinger.sarl-la-platine.doreviateam.com`.

---

## 8. Règles replay — Adapter Odoo

**Ordre** : Partners → Invoices → Payments → Balances.

**🧠 C. Source des Partners (normatif)**

Le schéma canonique MVP ne contient pas d'événement `partner_created` ou `counterparty_seen`. **Le partner est dérivé implicitement** des événements `invoice_issued` et `payment_received` qui contiennent `partner_ref` (et champs associés). Le Runner extrait le counterparty du payload de chaque invoice/payment et appelle `partner/upsert` avant l'événement qui le référence. Aucune logique implicite inventée : la règle est explicite.

**D. partner/upsert et idempotence (normatif)**

Le partner n'est pas un event first-class. `partner/upsert` est **idempotent par `(tenant, partner_ref)`** côté adapter : pas d'entrée dans `dorevia.replay.mapping` pour les partners. Le mapping ne concerne que invoice, payment, balances. Le Runner peut passer `event_id` en corrélation (logs), mais l'adapter déduplique par partner_ref.

**`partner_ref`** = valeur stable issue du raw (ex : `partner_id`, `vat`, ou identifiant métier source). Jamais générée dynamiquement (pas le nom du partenaire, pas un hash de champs variables). Sinon l'idempotence et la déduplication se dégradent.

**E. Schéma counterparty minimal (MVP)**

Champs obligatoires : `name`, `partner_ref` (ou `ref`). Optionnels : `vat`, `email`, `street`, `city`, `zip`, `country`. Le `partner_ref` doit être une valeur stable du raw (partner_id, vat, etc.), jamais générée dynamiquement. Schéma JSON formel à documenter en annexe.

**F. Runner — localisation**

Le Runner est un **processus intégré au service Vault** (même binaire Go) ou un worker dédié. MVP : processus intégré recommandé (simplicité déploiement, credentials partagés).

**G. Tenant et ERP cible**

**Un Odoo par tenant** en MVP. Un job replay = 1 tenant = 1 URL Odoo. Multi-tenant partagé (1 Odoo, plusieurs sociétés = tenants) = P1.

**Idempotence** : modèle `dorevia.replay.mapping` (event_id unique, status applied|skipped|failed). Si event_id déjà appliqué → status `skipped`. S'applique aux events invoice, payment, balances (pas aux partners).

**Adapter Odoo (MVP)** : Modules `dorevia_core` + `dorevia_adapter_odoo18`. Endpoints : `/dorevia/replay/partner/upsert`, `invoice/create_synth`, `payment/create`, `balances/recompute`. Stratégies : `generic_sale_line`, `fifo_best_effort`. Voir annexe.

---

## 9. Sécurité — Observabilité — DoD

**Sécurité** : Credentials en référence secret manager. Permissions « Continuity Operator ». Rate limiting. Connexion Odoo cible : identifiants par défaut admin/admin (secret manager en prod).

**Observabilité** : Métriques jobs_queued/running/failed, events_processed/sec. Logs par job_id.

**DoD P0** : economic_events + feed opérationnel, jobs API, runner dry_run, adapter Odoo idempotent, backfill validé.

---

## 10. Risques — Roadmap

**Risques** : allocation FIFO imprécise (accepter MVP) ; write barrier à choisir ; schema_version non supporté (refuser).

**Roadmap v1.3+** : allocations explicites, avoirs/refunds, multi-société.

---

## Annexe — Architecture modules Odoo 18

Détaillée dans `ANNEXE_Architecture_Modules_Odoo18_ERP_Adapter.md` :
- Graphe de dépendances : `base` → `dorevia_core` → `dorevia_adapter_odoo18` (account, product)
- Schéma counterparty : name, partner_ref (obligatoires) ; vat, email, street, city, zip, country (optionnels)
- Modèle `dorevia.replay.mapping` pour invoice, payment, balances uniquement (partners = idempotence par partner_ref)
- Endpoints techniques authentifiés (admin/admin par défaut)
- Produit synthétique « Vente HT (Vault) » créé à l'install
- Journal allocations FIFO dans details_json ou table dédiée
