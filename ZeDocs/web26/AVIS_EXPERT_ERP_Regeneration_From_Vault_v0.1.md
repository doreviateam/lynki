# Avis d'expert — Spec Vault Replay Button (ERP Reconnect) v1.2

**Date** : 2026-02-21  
**Spec analysée** : `SPEC_ERP_Reconnect_v1.2.md` (référence unique consolidée)  
**Plan** : `PLAN_IMPLEMENTATION_ERP_Reconnect_Scrum.md`  
**Annexe** : `ANNEXE_Architecture_Modules_Odoo18_ERP_Adapter.md`  
**Statut** : Analyse croisée spec ↔ plan ↔ annexe ↔ implémentation actuelle

---

## 1. Synthèse exécutive

La spec **Vault Replay Button (ERP Reconnect) v1.2** définit une architecture souveraine complète : table `economic_events`, ingestion avec mapping Vault-side, replay feed ordonné, cursor signé, backfill avec write barrier.

**Alignement** : La spec v1.2 a intégré les amendements opérationnels (A–F) :
- Champs robustesse (schema_version, ingest_source, ingest_idempotency_key, event_key, company_id)
- Séquence : tenant absent géré, multi-workers documenté
- Feed : filtres from/to/types dans le SQL
- Cursor : option HMAC pour éviter manipulation
- Backfill : source, ordre déterministe, write barrier (3 options)
- **Mapper** : vit dans Vault à l'ingestion (DVIG envoie raw, Vault stocke canonique)

**Écart restant** : L'implémentation n'existe pas encore. Le plan est clair.

---

## 2. Cohérence spec ↔ implémentation actuelle

### 2.1 Ce qui est cadré par la spec v1.2

| Élément | Spec v1.2 | Verdict |
|--------|-----------|---------|
| Table economic_events | SQL complet + champs robustesse + index | ✅ Prêt à exécuter |
| Sequence | tenant_sequences, ON CONFLICT, FOR UPDATE | ✅ Tenant absent + contention gérés |
| Replay feed | SQL avec from/to/types, cursor HMAC, limit max (clamp) | ✅ |
| Mapper | Vault à l'ingestion ; source_payload_json conservé | ✅ Décision souveraine |
| Backfill | Source (documents, events, payments), ordre, write barrier | ✅ |
| Périmètre MVP | Factures synthétiques, FIFO, produit générique | ✅ |
| Adapter Odoo | Modules dorevia_core + dorevia_adapter_odoo18, idempotence event_id | ✅ Spec §7–8 + annexe |
| Modules ERP | Source : dorevia_vault_connector ; Cible : dorevia_core, dorevia_adapter_odoo18 (+ account, product) | ✅ |

### 2.2 Données actuellement disponibles

**Flux Odoo → DVIG → Vault** :

| Type | DVIG outbox | Vault |
|------|-------------|-------|
| `invoice.posted` | ✅ payload (partner, totaux, dates) | Via `/api/v1/events` |
| `payment.posted` | ✅ payload (amount, partner, date) | Via `/api/v1/payments` |

**Format actuel** : raw (db, model, id, partner_name, amount_total, etc.). Le mapper Vault transformera vers `dorevia.economic_event.v1`.

**Précision** : aucun PDF stocké dans Vault ; contenu JSON uniquement.

---

## 3. Points tranchés par la spec v1.2

### 3.1 Source du feed

**Vault uniquement**, via `economic_events`. DVIG = adaptateur d'ingestion, non source de relecture.

### 3.2 Où vit le mapper

**Vault à l'ingestion.** Endpoint ingest accepte `source_payload_json` (raw) ; Vault transforme → `payload_json` canonique ; `source_payload_json` conservé pour debug. Le mapper ne vit pas dans DVIG.

### 3.3 Séquence

`tenant_sequences` avec `INSERT ON CONFLICT DO NOTHING` (tenant absent) ; `SELECT FOR UPDATE` (1 writer/tenant à la fois).

### 3.4 Cursor

Base64(json) + HMAC recommandé pour éviter manipulation. Opaque ≠ secret.

### 3.5 Backfill

Source : documents, events, payments. Ordre : `timestamp ASC, event_id ASC`. Write barrier : choisir tenant lock / table tampon / refus 409.

---

## 3.6 Décisions tranchées (annexe modules Odoo 18)

| Point | Décision |
|-------|----------|
| **Naming** | `dorevia_replay` remplacé par `dorevia_core` + `dorevia_adapter_odoo18` (architecture modulaire) |
| **Auth endpoints** | Session admin (admin/admin par défaut). Secret manager en prod. |
| **Produit synthétique** | Créé automatiquement à l'installation du module. |
| **Status `skipped`** | = event_id déjà appliqué (idempotence). |
| **dorevia_vault_connector** | ERP **source** (existant) ; `dorevia_adapter_odoo18` = ERP **cible** (replay). |
| **Modèle idempotence** | `dorevia.replay.mapping` (event_id, tenant, model, res_id, status, details_json). |

---

## 3.7 Verrous stratégiques (spec v1.2)

| Point | Verrou |
|-------|--------|
| **🔐 Hash recalculable** | Le hash est recalculable à partir du payload_json canonique. Règle de stabilité : clés triées, UTF-8, pas d'espaces, nombres sans format variable (1 pas 1.0). Registre vérifiable sans secret. |
| **📦 Évolution v2** | Toute évolution → `dorevia.economic_event.v2` sans altération des events v1. Chaîne prev_hash jamais réécrite. |
| **🧠 Source Partners** | Partner dérivé implicitement de `invoice_issued` et `payment_received` (partner_ref). Runner extrait counterparty et appelle partner/upsert avant l'event. Pas d'event `counterparty_seen` en MVP. |

---

## 3.8 Clarifications complémentaires (spec §8 D–G)

| Point | Décision |
|-------|----------|
| **D. partner/upsert** | Idempotence par `(tenant, partner_ref)`. `partner_ref` = valeur stable du raw (partner_id, vat, etc.), jamais générée dynamiquement (pas le nom). Pas d'entrée dans `dorevia.replay.mapping`. |
| **E. Schéma counterparty** | Obligatoires : `name`, `partner_ref`. Optionnels : `vat`, `email`, `street`, `city`, `zip`, `country`. |
| **F. Runner** | Processus intégré au service Vault (Go) recommandé pour le MVP. |
| **G. Tenant / ERP** | Un Odoo par tenant en MVP. Multi-tenant partagé = P1. |

---

## 4. Plan d'implémentation (aligné spec v1.2)

**Référence détaillée** : `PLAN_IMPLEMENTATION_ERP_Reconnect_Scrum.md` — 5 sprints, ~100 SP.

| Sprint | Focus | SP |
|--------|-------|-----|
| S1 | economic_events + ingestion + hash + prev_hash + raw types | 13 |
| S2 | Write barrier, replay feed (limit max, cursor HMAC), backfill découpé (invoices, payments, events) | 22 |
| S3 | Jobs API, Runner dry-run, ordonnancement (Partners → Invoices → Payments → Balances) | 24 |
| S4 | Adapter Odoo (dorevia_core + dorevia_adapter_odoo18), journal allocations FIFO, UX wizard | 29 |
| S5 | Dataset régression, Runner apply, intégration DVIG, DoD P0 | 13 |

---

## 5. Risques résiduels et mitigations

| Risque | Mitigation |
|--------|------------|
| Données manquantes (gaps) | Journaliser ; rapport avec liste des manques |
| Volume | Pagination cursor ; checkpoints ; backpressure |
| Credentials ERP | Référence secret manager |
| FIFO imprécis | Accepter en MVP ; P1 = allocations explicites |
| Write barrier pendant backfill | Choisir une option (lock / buffer / 409) selon tolérance latence |

---

## 6. Conclusion

La spec **Vault Replay Button v1.2** est **prête à implémenter**. Toutes les décisions structurantes sont prises : Vault seul, mapper à l'ingestion, sequence, cursor, backfill, write barrier.

Le plan Scrum détaillé (`PLAN_IMPLEMENTATION_ERP_Reconnect_Scrum.md`) et l'annexe modules Odoo (`ANNEXE_Architecture_Modules_Odoo18_ERP_Adapter.md`) sont alignés avec la spec. Les décisions tranchées (§3.6) valident l'architecture modulaire et les choix d'authentification, de produit synthétique et de modèle d'idempotence.

---

*Document produit par analyse croisée de la spec `SPEC_ERP_Reconnect_v1.2.md`, du plan `PLAN_IMPLEMENTATION_ERP_Reconnect_Scrum.md`, de l'annexe et du code (Odoo, DVIG, Vault).*
