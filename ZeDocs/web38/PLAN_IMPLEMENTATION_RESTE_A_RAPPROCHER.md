# Plan d'implémentation — Indicateur « Reste à rapprocher (%) »

**Référence :** `ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md`  
**Date :** 2026-03-03  
**Périmètre :** Card PAIEMENTS uniquement (TreasuryCardWithPolling)

---

## 1. Prérequis (blocant)

### 1.1 Backfill confirmation bancaire

**Avant toute implémentation**, exécuter le runbook pour laplatine2026 :

```
ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md
```

Vérifier : `SELECT COUNT(*) FROM financial_recon_deltas WHERE tenant='laplatine2026'` > 0.

Sans cela, l'indicateur affichera 100 % (tous non rapprochés) ou sera masqué si complétude KO.

---

## 2. Phases d'implémentation

### Phase 1 — Vault : requêtes et agrégation

| Tâche | Fichier(s) | Description |
|-------|------------|--------------|
| 1.1 | `sources/vault/internal/storage/` | Créer `ReconciliationMetricsAggregation(ctx, tenant, companyID, dateFrom, dateTo)` retournant `total_amount_abs`, `reconciled_amount_abs`, `remaining_amount_abs`, `remaining_ratio` |
| 1.2 | Requêtes SQL | Implémenter A (§8.1) et R (§8.2) avec `payment_date`, `COALESCE(SUM(direction), 0) > 0`. **Cohérence impérative** : réutiliser strictement la même logique d’exclusion que `PaymentsAggregation` (`aggregations_payments.go`) : inbound + outbound avec `COALESCE((payload_json->>'is_refund')::boolean, false) = false` pour outbound. Idéalement appeler `PaymentsAggregation` (inbound) + `PaymentsAggregation` (outbound) et sommer, ou extraire la logique dans une fonction partagée. Sinon `total Paiements affiché ≠ A` et la confiance est cassée. |
| 1.3 | Complétude | La complétude est déterminée par `completeness_check.ok` (sources payments + bank_reconciliation). **`financial_recon_deltas` vide n’implique pas `completeness.ok = false`.** Dans ce cas, l’indicateur renvoie 100 % (reste à rapprocher), ce qui reflète l’absence de rapprochement (état métier réel, pas problème technique). KO = pas de preuve / source non répondante / expected_count pas atteint. |

**Livrable :** Fonction storage testable unitairement.

**Référence filtre :** `aggregations_payments.go` lignes 54–61 (`baseWhere`, `is_refund` outbound).

---

### Phase 2 — Vault : exposition API

**P0 = `/api/treasury` uniquement.** dashboard-metrics uniquement si un autre consommateur (DIVA, export) en a besoin.

| Tâche | Fichier(s) | Description |
|-------|------------|-------------|
| 2.1 | `aggregations_treasury.go` | Enrichir la réponse treasury avec `reconciliation_metrics` : `{ total_amount_abs, reconciled_amount_abs, remaining_amount_abs, remaining_ratio, generated_at }` |
| 2.2 | Complétude | Réutiliser `completeness_check` existant : si payments ou bank_reconciliation KO → `remaining_ratio = null`, % masqué. Si OK et deltas vides → `remaining_ratio = 1.0` (100 % à rapprocher). |
| 2.3 | Paramètres | Réutiliser `date_debut`, `date_fin`, `company_id` déjà passés au handler treasury |

**Livrable :** Réponse treasury contenant `reconciliation_metrics`.

---

### Phase 3 — Linky : proxy et types

| Tâche | Fichier(s) | Description |
|-------|------------|-------------|
| 3.1 | `app/api/treasury/route.ts` | Étendre `TreasuryV4Response` avec `reconciliation_metrics?: { total_amount_abs, reconciled_amount_abs, remaining_amount_abs, remaining_ratio, generated_at }` et `completeness` |
| 3.2 | Pass-through | S’assurer que le proxy transmet `reconciliation_metrics` et `completeness_check` (déjà présent) |

**Livrable :** API treasury Linky exposant `reconciliation_metrics`.

---

### Phase 4 — Linky : Card PAIEMENTS (UI)

| Tâche | Fichier(s) | Description |
|-------|------------|-------------|
| 4.1 | `TreasuryCardWithPolling.tsx` | Ajouter l’affichage « Reste à rapprocher : XX % » en haut à droite (zone « des paiements rapprochés ») ou à côté |
| 4.2 | États | Si `completeness_check.ok = false` → masquer le % (afficher « — »). Si A = 0 → « Aucun paiement sur la période ». |
| 4.3 | Couleurs | < 10 % 🟢 Vert ; 10–30 % 🟡 Jaune ; > 30 % 🟠 Orange fort + texte « Fiabilité faible » ; Complétude KO → 🔴 Rouge (indicateur bloqué). |
| 4.4 | Option P0 | Afficher `Rapproché : R €`, `Total : A €` (optionnel `Non rapproché : A − R`) |
| 4.5 | Donut | Adapter le donut existant (Traité / À traiter) pour refléter R vs (A − R) si cohérent avec la spec, ou conserver le donut actuel et ajouter le % en complément |

**Livrable :** Card Paiements avec indicateur « Reste à rapprocher » opérationnel.

---

### Phase 5 — Extension dashboard-metrics (optionnel)

**Uniquement si besoin DIVA / export.** La Card Paiements consomme `/api/treasury` directement.

| Tâche | Fichier(s) | Description |
|-------|------------|-------------|
| 5.1 | `app/api/dashboard-metrics/route.ts` | Extraire ou fetcher `reconciliation_metrics` pour agrégation dashboard. |
| 5.2 | Types | Étendre `DashboardMetricsResponse` avec `reconciliation_metrics`. |

---

## 3. Ordre des tâches

```
P0  Backfill confirmation (runbook)
│
├─ Phase 1  Vault storage (ReconciliationMetricsAggregation)
├─ Phase 2  Vault handler (enrichissement treasury)
├─ Phase 3  Linky proxy (types + pass-through)
└─ Phase 4  Linky UI (TreasuryCardWithPolling)
    │
    └─ Phase 5  dashboard-metrics (si besoin)
```

---

## 4. Tests

| Type | Description |
|------|-------------|
| **AT1** | `completeness.ok = false` → % masqué |
| **AT2** | A=1000, R=250 → reste = 75 % |
| **AT3** | A=0 → « Aucun paiement sur la période » |
| **AT4** | Idempotence `financial_recon_deltas` (event_uid) |
| **AT5** | `completeness_check.ok = true` et `financial_recon_deltas` vide → `remaining_ratio = 1.0`, couleur 🟠 (fort). Prouve qu’on n’a pas masqué le problème métier (aucun rapprochement fait). |
| **Unit** | `ReconciliationMetricsAggregation` avec jeu de données (A, R, ratio) |
| **E2E** | Card Paiements affiche le % après backfill |

---

## 5. Fichiers impactés (résumé)

| Composant | Fichiers |
|-----------|----------|
| **Vault** | `storage/` (nouvelle fonction ou `aggregations_*.go`), `handlers/aggregations_treasury.go` |
| **Linky** | `app/api/treasury/route.ts`, `components/TreasuryCardWithPolling.tsx` |
| **Optionnel** | `app/api/dashboard-metrics/route.ts` |

---

## 6. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| `financial_recon_deltas` vide (ordre ingestion) | Runbook P0. Une fois fait, deltas vides = état métier (aucun rapprochement) → 100 % affiché en 🟠, pas masqué. |
| Complétude KO (sources non répondantes) | Masquage % (🔴). KO ≠ deltas vides. |
| Période vide (A=0) | Affichage « Aucun paiement » |
| NULL sur SUM(direction) | `COALESCE(..., 0)` dans la requête (spec §8.2) |
| Divergence A vs totaux card | Réutiliser la même logique que `PaymentsAggregation` (filtres inbound/outbound, is_refund) |

---

## 7. Références

* `ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md`
* `ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md`
* `sources/vault/internal/storage/aggregations_payments.go` — filtre `payment_date`
* `sources/vault/internal/handlers/aggregations_treasury.go` — structure réponse
* `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` — Card Paiements

---

## 8. État de couverture (2026-03-03)

| Phase | Tâche | Statut | Fichier / remarque |
|-------|-------|--------|---------------------|
| **Prérequis** | Backfill confirmation | ⏳ À faire | Runbook — action Ops |
| **Phase 1** | 1.1 GetReconciliationMetrics | ✅ | `aggregations_payments.go` |
| | 1.2 Filtres PaymentsAggregation | ✅ | baseWhere identique (inbound + outbound, is_refund) |
| | 1.3 Complétude | ✅ | completeness_check côté Linky ; deltas vides → 100 % |
| **Phase 2** | 2.1 reconciliation_metrics | ✅ | `aggregations_treasury.go` |
| | 2.2 Complétude | ✅ | Réutilise completeness_check existant |
| | 2.3 Paramètres | ✅ | date_debut, date_fin, company_id |
| **Phase 3** | 3.1 Types + pass-through | ✅ | `treasury/route.ts` |
| | 3.2 Pass-through | ✅ | |
| **Phase 4** | 4.1 Affichage « Reste à rapprocher » | ✅ | `TreasuryCardWithPolling.tsx` |
| | 4.2 États (masquage, A=0) | ✅ | |
| | 4.3 Couleurs (🟢🟡🟠) | ✅ | |
| | 4.4 Rapproché / Total € | ✅ | |
| | 4.5 Donut | ✅ | Conservé (Traité / À traiter) + % en complément |
| **Phase 5** | dashboard-metrics | ⏸️ Optionnel | Si besoin DIVA / export |
| **Tests** | AT1–AT5, Unit, E2E | ⏳ À faire | |
| **Doc** | SPEC, runbook, rapport MOA, CHANGELOG | ✅ | |
