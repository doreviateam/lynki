# Suivi d'implémentation — Vault Replay (ERP Reconnect) v1.2

**Créé le :** 2026-02-21  
**Dernière mise à jour :** 2026-02-19  
**Plan de référence :** `PLAN_IMPLEMENTATION_ERP_Reconnect_Scrum.md`  
**Spec :** `SPEC_ERP_Reconnect_v1.2.md`  
**Annexe modules Odoo :** `ANNEXE_Architecture_Modules_Odoo18_ERP_Adapter.md`  
**Annexe mapping/backfill/schémas :** `ANNEXE_Mapping_Backfill_Schema_JSON.md`  
**Objet :** État d'avancement de l'implémentation — ERP Reconnect / Vault Replay Button

---

## 1. Vue d'ensemble

### 1.1 Progression globale

| Métrique | Valeur |
|----------|--------|
| Stories totales | 24 |
| Story points total | ~101 SP |
| Stories terminées | 23 |
| SP terminés | ~90 |

### 1.2 Par Sprint

| Sprint | Stories | Statut | SP |
|--------|---------|--------|-----|
| **S1** | E1‑US1, US2, US2bis, US3, US4 | ✅ Fait | 13 |
| **S2** | E3‑US0, E2‑US1, E2‑US2, E3‑US1a/b/c | ✅ Fait (E3‑US1c optionnel) | 22 |
| **S3** | E4‑US1 à US4, E5‑US1, E5‑US2 | ✅ Fait | 24 |
| **S4 (MVA)** | E6‑US1 à US4bis, E7‑US1 | ✅ Fait | ~17 |
| **S5** | E5‑US0, E5‑US3, DoD P0 | ✅ Fait (DoD P0 validé 2026-02-21) | 11 |
| **S5+** | E7‑US2 (DVIG live) | ⬜ À faire | 3 |

**Reste à faire :**

| Item | Description |
|------|-------------|
| ~~**DoD P0**~~ | ~~Validation staging E2E~~ → **✅ Acté** (3 partners, 10 factures, 5 paiements) |
| ~~**E6‑US4bis**~~ | ~~Journal allocations FIFO~~ → **✅ Fait** (_allocate_fifo, report) |
| ~~**E7‑US1**~~ | ~~Bouton + wizard UX~~ → **✅ Fait** (/replay/wizard, /replay/jobs/:id) |
| **E7‑US2** | Intégration DVIG live (Odoo source → DVIG → ingest Vault) |

**🎯 Ce qu'il reste (stratégique)**

| Item | Nature |
|------|--------|
| E7‑US2 (DVIG live) | Passage en flux continu Odoo → Vault |

*E6‑US4bis et E7‑US1 sont faits. E7‑US2 reste pour le flux continu.*

### 1.3 Par Story (ordre backlog)

| Story | Description | Statut | Commentaire |
|-------|-------------|--------|-------------|
| E1‑US1 | Schéma economic_events + tenant_sequences | ✅ | — |
| E1‑US2 | Hash canonique (🔐 A) | ✅ | — |
| E1‑US2bis | Chaînage prev_hash | ✅ | — |
| E1‑US3 | Endpoint ingest | ✅ | — |
| E1‑US4 | Validation types raw | ✅ | — |
| E3‑US0 | Write barrier (tenant lock) | ✅ | — |
| E2‑US1 | GET /replay/events + limit max | ✅ | — |
| E2‑US2 | Cursor HMAC | ✅ | — |
| E3‑US1a | Backfill invoices | ✅ | — |
| E3‑US1b | Backfill payments | ✅ | — |
| E3‑US1c | Backfill legacy events | ⬜ | Optionnel MVP |
| E4‑US1 | Tables replay_jobs, replay_job_logs | ✅ | — |
| E4‑US2 | POST /replay/jobs | ✅ | handlers/replay_jobs.go |
| E4‑US3 | GET /replay/jobs/{id} | ✅ | ReplayJobGetHandler |
| E4‑US4 | Logs + report JSON | ✅ | ReplayJobLogsHandler, ReplayJobReportHandler |
| E5‑US1 | Runner poll + feed + dry_run | ✅ | replay/runner.go |
| E5‑US2 | Ordonnancement (Partners → Invoices → …) | ✅ | orderEventsForReplay, extractPartnerRef |
| E6‑US1 | Modules dorevia_core + dorevia_adapter_odoo18 + mapping | ✅ | dorevia_core, dorevia_adapter_odoo18, replay_mapping |
| E6‑US2 | POST partner/upsert (idempotent par partner_ref) | ✅ | ReplayController.partner_upsert |
| E6‑US3 | POST invoice/create_synth (1 ligne « Vente HT ») | ✅ | ReplayController.invoice_create_synth |
| E6‑US4 | POST payment/create (sans FIFO, sans balances/recompute) | ✅ | ReplayController.payment_create |
| E6‑US4bis | Journal allocations FIFO | ✅ | ReplayController._allocate_fifo, mapping.details_json, report |
| E7‑US1 | Bouton + wizard UX | ✅ | /replay/wizard, /replay/jobs/:id, Home |
| E5‑US0 | Dataset régression | ✅ | regression_seed.go, replay_regression_test.go |
| E5‑US3 | Runner apply mode | ✅ | adapter.go, applyEvent, buildAdapter |
| E7‑US2 | Intégration DVIG → ingest | ⬜ | — |
| DoD P0 | Validation finale | ✅ | Acté 2026-02-21 |

*Légende : ⬜ À faire | 🔄 En cours | ✅ Fait*

---

## 2. Détail par Sprint

### S1 — Fondations (economic_events + ingestion)

| Story | Tâche plan | Statut | Livrable / commentaire |
|-------|------------|--------|------------------------|
| E1‑US1 | Migration SQL economic_events, tenant_sequences | ✅ | migrations/028_create_economic_events.sql |
| E1‑US1 | Exécuter en dev/staging | ⬜ | À exécuter manuellement |
| E1‑US1 | Documenter runbook | ⬜ | |
| E1‑US2 | Utilitaire canonical_json (clés triées, UTF-8, nombres stables) | ✅ | internal/utils/json_canonical.go |
| E1‑US2 | compute_hash(canonical) | ✅ | ComputeHash, CanonicalJSONAndHash |
| E1‑US2 | Tests unitaires | ✅ | json_canonical_test.go |
| E1‑US2bis | Récupérer dernier event tenant, prev_hash | ✅ | storage/economic_events.go |
| E1‑US2bis | Tests continuité chaîne (DB réel) | ✅ | economic_events_chain_test.go : trous, prev_hash, concurrence |
| E1‑US3 | API ingest POST, mapper invoice/payment | ✅ | handlers/replay_ingest.go, replay/mapper.go |
| E1‑US3 | sequence + hash + prev_hash | ✅ | InsertEconomicEvent |
| E1‑US3 | Idempotence ingest_idempotency_key | ✅ | GetEconomicEventByIdempotencyKey |
| E1‑US4 | Liste raw types supportés, rejet 400 | ✅ | IsSupportedRawType, rejet si non supporté |

---

### S2 — Replay feed + Backfill

| Story | Tâche plan | Statut | Livrable / commentaire |
|-------|------------|--------|------------------------|
| E3‑US0 | Table tenant_locks, refus 409 si lock | ✅ | migrations/029, tenant_locks.go, ErrTenantLocked |
| E2‑US1 | GET /replay/events, limit max 500 | ✅ | handlers/replay_events.go, storage.ListEconomicEvents |
| E2‑US2 | Cursor base64 + HMAC | ✅ | replay/cursor.go, REPLAY_CURSOR_SECRET |
| E3‑US1a | Backfill documents → invoice_issued | ✅ | replay/backfill.go, storage/backfill_documents.go |
| E3‑US1b | Backfill payments → payment_received | ✅ | inclus dans BackfillFromDocuments |
| E3‑US1c | Backfill legacy events | ⬜ | Optionnel MVP |

---

### S3 — Jobs API + Runner dry-run

| Story | Tâche plan | Statut | Livrable / commentaire |
|-------|------------|--------|------------------------|
| E4‑US1 | Migration SQL + modèles + storage | ✅ | 030_create_replay_jobs.sql, models/replay_job.go, storage/replay_jobs.go |
| E4‑US2 | POST /replay/jobs (tenant, mode, range, options) | ✅ | validation, status=queued |
| E4‑US3 | GET /replay/jobs/{id} | ✅ | job_id, progress_*, stats_json, error_message |
| E4‑US4 | Logs + report JSON | ✅ | ReplayJobLogsHandler, ReplayJobReportHandler |
| E5‑US1 | Poll jobs, GET feed, dry_run, schema_version check | ✅ | Runner, checkpoint batch, stats_json |
| E5‑US2 | Ordre Partners → Invoices → Payments → Balances | ✅ | orderEventsForReplay, partner_ref |

---

### S4 — Adapter Odoo + UX

| Story | Tâche plan | Statut | Livrable / commentaire |
|-------|------------|--------|------------------------|
| E6‑US1 | Module dorevia_core | ✅ | custom-addons/dorevia_core |
| E6‑US1 | Module dorevia_adapter_odoo18 | ✅ | custom-addons/dorevia_adapter_odoo18 |
| E6‑US1 | Modèle dorevia.replay.mapping | ✅ | models/replay_mapping.py |
| E6‑US2 | POST partner/upsert (idempotent par partner_ref) | ✅ | /dorevia/replay/partner/upsert |
| E6‑US3 | POST invoice/create_synth (1 ligne « Vente HT (Vault) ») | ✅ | /dorevia/replay/invoice/create_synth |
| E6‑US4 | POST payment/create (sans FIFO, sans balances/recompute) | ✅ | /dorevia/replay/payment/create |
| E6‑US4bis | Journal allocations FIFO | ✅ | _allocate_fifo, mapping.details_json, report payment_allocations |
| E7‑US1 | Bouton + wizard UX | ✅ | /replay/wizard, /replay/jobs/:id, lien Home |

---

### S5 — Intégration + DoD P0

| Story | Tâche plan | Statut | Livrable / commentaire |
|-------|------------|--------|------------------------|
| E5‑US0 | Dataset 10 invoices + 5 payments | ✅ | SeedRegressionDataset, TestReplayRegression_DatasetAndDryRun |
| E5‑US3 | Runner apply → Odoo | ✅ | adapter.go, options odoo_url/user/password |
| E7‑US2 | DVIG → Vault ingest | ⬜ | |
| DoD P0 | Backfill staging, dry-run E2E, apply E2E | ✅ | Script run_dod_p0_validation.sh ; base dorevia_p0 (account + dorevia) |

---

## 3. Notes / Blocages

*À compléter au fil de l'eau.*

| Date | Note | Auteur |
|------|------|--------|
| 2026-02-19 | Prérequis compilation : storage.DB, models agrégations, auth RBAC, document_store, PaymentsService. Projet compile. | — |
| 2026-02-19 | S1 + S2 validés. Démarrage S3 (E4-US1). | — |
| 2026-02-19 | Vigilance : test chaîne E1-US2bis, backfill tri global, replay_jobs checkpoint (stats_json). | — |
| 2026-02-19 | E4-US4 : logs paginés, report JSON exportable, Content-Disposition attachment. E5-US0 : SeedRegressionDataset (10 inv, 5 pay, 3 partners, partiel), test E2E dry_run. Runner.ProcessOneJob pour tests. | — |
| 2026-02-19 | **Prochaine trajectoire** : Étape 1 Adapter MVA — E6-US1 → US2 → US3 → US4. Étape 2 E5-US3 : Runner apply. | — |
| 2026-02-19 | E6-US1 à US4 : dorevia_core, dorevia_adapter_odoo18, mapping, partner/upsert, invoice/create_synth, payment/create. Basic Auth via dorevia.adapter.auth_user/password. Produit « Vente HT (Vault) » en data. | — |
| 2026-02-19 | E5-US3 : Runner apply mode. adapter.go (HTTP Odoo), orderEventsForReplay respecté, partner/upsert avant invoice/payment, stats applied/skipped/failed, options odoo_url. Voir TEST_APPLY_REGRESSION.md. | — |
| 2026-02-19 | P0 verrouillé : timeout/retry (ODOO_TIMEOUT_SEC, ODOO_RETRY_MAX), validation stricte réponses Odoo, status=completed même si failed>0, auth admin/admin → Warn. Voir POINTS_VERROUILLES_P0.md. | — |
| 2026-02-21 | **DoD P0 acté** : script run_dod_p0_validation.sh, base dorevia_p0 (account,dorevia_core,dorevia_adapter_odoo18). Adaptations Odoo 18 : product type, payment_reference, controllers/__init__.py, dbfilter. 15 events appliqués (3 partners, 10 factures, 5 paiements). Procédure DOD_P0_VALIDATION_STAGING.md. | — |
| 2026-02-19 | **E6-US4bis + E7-US1 actés** : allocations FIFO (_allocate_fifo, report payment_allocations), wizard « Rebrancher un ERP » (/replay/wizard, /replay/jobs/:id). SUIVI aligné — reste E7-US2 (DVIG live). | — |

---

## 4. Livrables techniques (chemin des fichiers)

| Composant | Chemin |
|-----------|--------|
| Migrations economic_events, tenant_sequences | `sources/vault/migrations/028_create_economic_events.sql` |
| Migration tenant_locks | `sources/vault/migrations/029_create_tenant_locks.sql` |
| Migration replay_jobs | `sources/vault/migrations/030_create_replay_jobs.sql` |
| Modèles replay_job | `sources/vault/internal/models/replay_job.go` |
| Storage replay_jobs | `sources/vault/internal/storage/replay_jobs.go` |
| Test continuité chaîne (E1-US2bis) | `tests/integration/economic_events_chain_test.go` |
| Migration stats_json checkpoint | `migrations/031_add_replay_jobs_stats.sql` |
| Handler POST/GET replay/jobs | `handlers/replay_jobs.go` |
| Runner dry_run | `replay/runner.go` |
| Server wiring | `server/replay.go`, `cmd/vault/main.go` |
| Hash canonique | `sources/vault/internal/utils/json_canonical.go` |
| Storage economic_events | `sources/vault/internal/storage/economic_events.go` |
| Storage tenant_locks | `sources/vault/internal/storage/tenant_locks.go` |
| Storage backfill | `sources/vault/internal/storage/backfill_documents.go` |
| Handler ingest | `sources/vault/internal/handlers/replay_ingest.go` |
| Handler replay/events | `sources/vault/internal/handlers/replay_events.go` |
| Handler replay/backfill | `sources/vault/internal/handlers/replay_backfill.go` |
| Mapper raw → canonique | `sources/vault/internal/replay/mapper.go` |
| Cursor HMAC | `sources/vault/internal/replay/cursor.go` |
| Backfill logique | `sources/vault/internal/replay/backfill.go` |
| Module dorevia_core | `units/odoo/custom-addons/dorevia_core/` |
| Module dorevia_adapter_odoo18 | `units/odoo/custom-addons/dorevia_adapter_odoo18/` |
| Runner (Go) | Intégré Vault (recommandé MVP) |
| Dataset régression (E5-US0) | `internal/replay/regression_seed.go` |
| Test E2E dry_run + logs/report | `tests/integration/replay_regression_test.go` |
| Adapter HTTP Odoo (E5-US3) | `internal/replay/adapter.go` |
| Procédure test apply | `ZeDocs/web26/TEST_APPLY_REGRESSION.md` |

---

*Document de suivi — à mettre à jour à chaque avancement significatif.*
