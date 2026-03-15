# Rapport d'avancement — EBE OD Paie (LINKY-EBE-OD-01)

**Date :** 2026-03-15  
**Périmètre :** Lot 2 Backend Vault + Lot 2 Front Linky  
**Référentiels :** LINKY_EBE_OD_01, SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0, SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0, plans d’implémentation associés, SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0

---

## 1. Synthèse

L’implémentation est **terminée** pour le backend Vault et le frontend Linky. Le **déploiement** a été réalisé le 2026-03-15. Le **module Paie** sera installé dans l’ERP lorsqu’il aura été clairement identifié et cadré ; **en attendant, la paie est gérée via des OD comptables**. Les tests liés à la source payslip ne sont pas exécutés dans le cadre du présent lot et sont classés **N/A hors périmètre**. **La recette v1.0 porte sur les flux de paie par OD comptables.**

| Étape | Statut | Commentaire |
|-------|--------|-------------|
| **Développement** | ✅ Terminé | Backend + front livrés ; backfill et migrations documentés |
| **Déploiement** | ✅ Fait | Vault + Linky redémarrés (images ebe-od-payroll-2026-03-15) ; backfill laplatine2026 exécuté (4 lignes, 21 500 €) |
| **Recette** | ✅ **Recette v1.0 (OD) complète** | S-BE-1, S-BE-2, S-BE-4, S-FR-1, S-FR-3, S-FR-4, S-FR-5, S-E2E-1 = PASS ; S-BE-3, S-FR-2, S-E2E-2 = N/A hors périmètre. |
| **Clôture ticket** | ✅ **Fait** | Lot 2 **clos** le 2026-03-15 ; recette v1.0 (OD) complète, scénarios payslip N/A hors périmètre |

| Composant | Statut | Commentaire |
|-----------|--------|-------------|
| **Backend Vault** | ✅ Livré et déployé | Migration 043, ingestion, agrégation, API enrichie ; image `dorevia/vault:ebe-od-payroll-2026-03-15` |
| **Front Linky** | ✅ Livré et déployé | Module payroll-source-ui, EbeCard/EbeCardWithPolling, mapping §10 ; image `dorevia/linky:laplatine-ebe-od-2026-03-15` |
| **Backfill laplatine2026** | ✅ Exécuté | 4 lignes ingérées, total 21 500 € ; API `payroll_source = "od"` confirmée |
| **Migrations** | ✅ Documenté | Commande `vault migrate` + doc `sources/vault/docs/MIGRATE.md` |
| **Spec de recette** | ✅ Gelée v1.0 | SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0 — bonne pour gel ; section Gel v1.0 ajoutée |

---

## 2. Backend Vault — réalisations

### 2.1 Données et ingestion

- **Migration 043** — Table `payroll_od_lines` (tenant, move_id, line_id, line_date, account_code, debit, credit, currency, state, company_id) avec contrainte unique `(tenant, move_id, line_id)` et index.
- **Storage** — `internal/storage/payroll_od.go` : struct `PayrollODLine`, `IsEligibleAccountCode` (641/645 inclus, 421/431 exclus), `UpsertPayrollODLine` / `UpsertPayrollODLines`, `GetPayrollODAggregate` (net signé, count = move_id distincts, séries, breakdown 641/645).
- **Ingestion** — `POST /api/v1/payroll-od-lines` (header `X-Tenant`, body `{ "lines": [ ... ] }`), validation 641\*/645\* et `state = posted`, idempotence par (tenant, move_id, line_id).

### 2.2 Agrégation et API

- **Refactor** — `payrollFromPayslips` (logique hr.payslip inchangée) et **orchestrateur** dans `PayrollAggregation` : priorité payslip → od → none ; log de coexistence payslip+od.
- **Réponse enrichie** — `PayrollAggregationResponse` : `payroll_source`, `payroll_unavailable`, `breakdown` (optionnel), `total` (alias). Handler avec log debug (source, total, count, breakdown).
- **Tests** — Unitaires (handler 400/503, structure de réponse) ; intégration (SourceNone, SourceOD 21 500 €, Extourne).

### 2.3 Outillage

- **Backfill** — `tenants/laplatine2026/scripts/backfill_payroll_od_lines.py` (shell Odoo) + `run_backfill_payroll_od_lines.sh`.
- **Migrations** — Sous-commande `vault migrate` ; doc `sources/vault/docs/MIGRATE.md`.

---

## 3. Front Linky — réalisations

### 3.1 Module payroll-source-ui

- **Fichier** — `units/dorevia-linky/app/lib/payroll-source-ui.ts`.
- **Contenu** : types `PayrollSourceUi`, `NormalizedPayrollResponse` ; `normalizePayrollResponse(raw)` ; `resolvePayrollSourceUi(payroll)` (spec §11.1) ; `PAYROLL_SOURCE_UI` (badge + messages principal/secondaire par état, spec §10).

### 3.2 EbeCardWithPolling

- Normalisation de la réponse `/api/payroll` et résolution de l’état UI.
- Calcul de **hasPayroll** dans le parent : `(payrollSourceUi === "payslip" || payrollSourceUi === "od") && payrollTotal != null`.
- Passage à EbeCard : `payrollSourceUi`, `hasPayroll`, `payrollBreakdown`, plus champs existants.

### 3.3 EbeCard

- Nouvelles props : `payrollSourceUi`, `hasPayroll` (fourni par le parent), `payrollBreakdown`.
- Bloc « composantes manquantes » : badge et messages dérivés de **PAYROLL_SOURCE_UI[payrollSourceUi]** (plus de texte en dur).
- Libellé « Charges de personnel » : « (N écritures OD) » si source od, « (N bulletins) » si payslip.
- Détail optionnel 641\*/645\* lorsque `payrollSourceUi === "od"` et `payrollBreakdown` présent.
- **Suppression** : aucune occurrence de « Aucun bulletin dans le Vault » dans le projet.

---

## 4. Documentation mise à jour

| Document | Statut |
|----------|--------|
| **PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0.md** | Toutes les tâches cochées [x] ; mention « Implémentation : 2026-03-15 ». |
| **PLAN_IMPLEMENTATION_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.md** | Toutes les tâches cochées [x] ; mention « Implémentation : 2026-03-15 ». |
| **SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md** | **Validée et gelée v1.0** ; section « Gel v1.0 » ajoutée (indice fort PASS S-FR-1, S-FR-5, S-E2E-1). |
| **RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md** | Résultats recette : tableau statuts (PASS / hors périmètre v1.0), preuves automatisées, **validation périmètre OD La Platine (v1.0)**. |
| **PLAN_RECETTE_CONTINUE_EBE_OD_PAYROLL_v1.0.md** | Plan recette continue ; S-FR-3, S-FR-4 = PASS ; S-BE-3, S-FR-2, S-E2E-2 = N/A hors périmètre. |
| **RUNBOOK_EBE_OD_DEPLOY_2026-03-15.md** | Runbook déploiement Vault, backfill, Linky et recette. |

---

## 5. Déploiement et recette (2026-03-15)

- **Images** : `dorevia/vault:ebe-od-payroll-2026-03-15`, `dorevia/linky:laplatine-ebe-od-2026-03-15` construites.
- **Docker-compose** : `tenants/core-stinger/platform` (Vault), `tenants/laplatine2026/apps/ui/lab` (Linky) mis à jour.
- **Vault** : redémarré avec la nouvelle image ; migration 043 appliquée au démarrage.
- **Backfill** : `run_backfill_payroll_od_lines.sh` exécuté ; 4 lignes ingérées, total 21 500 €.
- **Linky** : redémarré avec la nouvelle image.
- **Contrôle API** : `GET /ui/aggregations/payroll?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-02-28` → `payroll_source = "od"`, `total_charges` = 21 500, `breakdown` présent.
- **Capture card EBE** : statut « EBE — Complet », « Charges de personnel (2 écritures OD) », - 21 500 €, EBE complet affiché ; aucun wording « Aucun bulletin dans le Vault » ni état « paie indisponible ».
- **Correctif tuile EBE synthèse (2026-03-15)** : alimentation de la tuile EBE de la page de synthèse via l’agrégat payroll dans `dashboard-metrics` ; cohérence synthèse / détail rétablie (même montant que la card EBE détaillée).

---

## 6. Recette v1.0 et clôture

- **Périmètre recette v1.0** : flux de paie par **OD comptables** uniquement. Le module Paie sera installé dans l’ERP lorsqu’il aura été identifié et cadré ; les tests liés à la source payslip (dont S-E2E-2) sont **N/A hors périmètre** du présent lot.
- **Recette v1.0 (OD)** : complète (**tous les scénarios dans le périmètre sont passés ; les scénarios hors périmètre sont classés N/A et documentés**).
- **Ticket** : LINKY-EBE-OD-01 Lot 2 — **clôturé** le 2026-03-15 (recette v1.0 OD complète).

---

## 7. Références

| Document | Rôle |
|----------|------|
| LINKY_EBE_OD_01.md | Ticket / contexte métier |
| LINKY_EBE_OD_01_EVALUATION.md | Évaluation et décision Lot 1 / Lot 2 |
| SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0.md | Spec backend |
| SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.md | Spec front |
| PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0.md | Plan backend (implémenté) |
| PLAN_IMPLEMENTATION_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.md | Plan front (implémenté) |
| SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md | Spec de recette (gelée v1.0) |
| RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md | Résultats d’exécution recette (tableau statuts, preuves automatisées) |
| PLAN_RECETTE_CONTINUE_EBE_OD_PAYROLL_v1.0.md | Plan recette continue ; S-FR-3, S-FR-4 = PASS ; S-BE-3, S-FR-2, S-E2E-2 = N/A hors périmètre |
| RUNBOOK_EBE_OD_DEPLOY_2026-03-15.md | Runbook déploiement et backfill |

---

### Validation du rapport

Le rapport d’avancement EBE OD Paie est **validé comme document de suivi projet**. Il confirme que le développement, le déploiement et la recette v1.0 (flux paie par OD comptables) ont été réalisés, que les scénarios source payslip sont N/A hors périmètre du lot, et que **le ticket Lot 2 est clôturé** (2026-03-15).

---

*ZeDocs/web50 — Rapport d’avancement EBE OD Paie — 2026-03-15 — Lot 2 clos.*
