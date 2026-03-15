# Résultats d’exécution recette — EBE OD Paie (LINKY-EBE-OD-01)

**Date :** 2026-03-15  
**Référence :** SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md  
**Périmètre :** Lot 2 Backend Vault + Front Linky

---

## 1. Exécution automatisée (2026-03-15)

| Action | Résultat | Détail |
|--------|----------|--------|
| **Tests unitaires Vault (payroll)** | ✅ PASS | `go test ./tests/unit/... -run Payroll` : handler (503 sans DB, 400 sans tenant), structure de réponse `payroll_source` / `total_charges`. |
| **Vérification S-FR-5 (wording obsolète)** | ✅ PASS | Recherche « Aucun bulletin dans le Vault » dans `units/dorevia-linky` : **0 occurrence** dans le code applicatif. Uniquement le message générique « Aucun bulletin ni OD de paie intégrés… » dans `payroll-source-ui.ts`. |
| **Tests d’intégration Vault (S-BE-1, S-BE-2, S-BE-4)** | ✅ PASS | Base de test : Postgres éphémère (docker, port 5434), migrations appliquées (`go run ./cmd/vault migrate`). `TEST_DATABASE_URL=postgresql://vault:vault_password@localhost:5434/dorevia_vault?sslmode=disable go test ./tests/integration/... -run Payroll -v` → **TestPayrollAggregation_SourceNone**, **TestPayrollAggregation_SourceOD**, **TestPayrollAggregation_Extourne** tous passés. |
| **Appel API payroll (environnement déployé)** | ⏭️ Non exécuté | Vault non joignable en local (curl localhost:8080). À exécuter sur l’environnement où Vault/Linky sont déployés (voir RUNBOOK_EBE_OD_DEPLOY_2026-03-15.md). |

---

## 2. Tableau des scénarios — statuts

| Id | Type | Titre | Statut | Date | Commentaire / preuve |
|----|------|--------|--------|------|----------------------|
| S-BE-1 | Backend | Agrégat payroll source OD (La Platine) | **PASS** | 2026-03-15 | Tests d’intégration `TestPayrollAggregation_SourceOD` : OD 21 500 €, `payroll_source=od`, count=2, breakdown 641/645. |
| S-BE-2 | Backend | Source none | **PASS** | 2026-03-15 | Tests d’intégration `TestPayrollAggregation_SourceNone` : `payroll_source=none`, total=0, `payroll_unavailable=true`. |
| S-BE-3 | Backend | Priorité payslip | **N/A hors périmètre** | 2026-03-15 | Scénario payslip ; hors périmètre v1.0 (paie par OD). Test d’intégration `TestPayrollAggregation_SourcePayslipPriority` exécutable ultérieurement. |
| S-BE-4 | Backend | Extourne / correction OD | **PASS** | 2026-03-15 | Tests d’intégration `TestPayrollAggregation_Extourne` : débit 1000 €, crédit 300 € → total 700 € (net signé). |
| S-FR-1 | Front | Affichage source OD | **PASS** | 2026-03-15 | Gel v1.0 : capture card EBE laplatine2026 (badge OD, 2 écritures OD, -21 500 €). Conforme spec §10. |
| S-FR-2 | Front | Affichage source bulletins | **N/A hors périmètre** | 2026-03-15 | Affichage source bulletins ; hors périmètre v1.0 (paie par OD). |
| S-FR-3 | Front | Affichage source indisponible | **PASS** | 2026-03-15 | Tests unitaires : badge « Source paie indisponible », message générique (pas « Aucun bulletin dans le Vault »). |
| S-FR-4 | Front | Rétrocompatibilité API sans payroll_source | **PASS** | 2026-03-15 | Tests unitaires : réponse sans `payroll_source` → legacy_fallback, badge générique. |
| S-FR-5 | Front | Suppression wording obsolète | **PASS** | 2026-03-15 | Vérification code : 0 occurrence « Aucun bulletin dans le Vault » dans le code Linky. |
| S-E2E-1 | E2E | La Platine OD → API → EBE | **PASS** | 2026-03-15 | Déploiement : API `payroll_source=od`, `total_charges=21500` ; capture EBE complète, pas « paie indisponible ». |
| S-E2E-2 | E2E | Non-régression tenant bulletins | **N/A hors périmètre** | 2026-03-15 | Module Paie non installé en ERP ; paie gérée par OD comptables. Tests source payslip non exécutés dans le cadre du lot. |

---

## 3. Comment compléter la recette

### Relancer les tests d’intégration backend (S-BE-1, S-BE-2, S-BE-4)

```bash
# Option : Postgres éphémère (docker)
docker run -d --rm --name vault-test-db-ebe -e POSTGRES_USER=vault -e POSTGRES_PASSWORD=vault_password -e POSTGRES_DB=dorevia_vault -p 5434:5432 postgres:16
sleep 4
cd /opt/dorevia-plateform/sources/vault
DATABASE_URL="postgresql://vault:vault_password@localhost:5434/dorevia_vault?sslmode=disable" go run ./cmd/vault migrate
TEST_DATABASE_URL="postgresql://vault:vault_password@localhost:5434/dorevia_vault?sslmode=disable" go test ./tests/integration/... -run Payroll -v
docker stop vault-test-db-ebe
```

### Recette continue (scénarios hors périmètre v1.0)

Les points ci-dessous correspondent aux scénarios recette continue ; pour la clôture v1.0, seuls S-FR-3 et S-FR-4 sont dans le périmètre (PASS) :

1. **S-BE-3** — **N/A hors périmètre** (scénario payslip ; test d’intégration exécutable ultérieurement).
2. **S-FR-2** — **N/A hors périmètre** (affichage source bulletins).
3. **S-FR-3, S-FR-4** — ✅ PASS (tests unitaires `tests/unit/payroll-source-ui.test.ts`).
4. **S-E2E-2** — **N/A hors périmètre** : module Paie ERP non installé ; paie gérée par OD dans le cadre du lot.

La **recette v1.0 (flux paie par OD comptables)** est complète (voir §4). S-BE-3, S-FR-2, S-E2E-2 = N/A hors périmètre.

---

## 4. Validation périmètre OD La Platine (v1.0) — 2026-03-15

**Lot 2 livré, déployé et validé sur le périmètre OD La Platine. Recette v1.0 = flux de paie par OD comptables.**

- **Contexte** : Le module Paie sera installé dans l’ERP lorsqu’il aura été identifié et cadré ; en attendant, la paie est gérée via des OD comptables. Les tests liés à la source payslip ne sont pas exécutés dans le cadre du présent lot et sont classés **N/A hors périmètre**.
- **Périmètre v1.0 (OD)** : S-BE-1, S-BE-2, S-BE-4, S-FR-1, S-FR-3, S-FR-4, S-FR-5, S-E2E-1 = PASS ; S-BE-3, S-FR-2, S-E2E-2 = **N/A hors périmètre**. Chaîne « Aucun bulletin dans le Vault » : 0 occurrence (S-FR-5).
- **Clôture** : Recette v1.0 (OD) complète ; **ticket Lot 2 clôturé** le 2026-03-15.

---

## 5. Références

- SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md (gel v1.0)
- **PLAN_RECETTE_CONTINUE_EBE_OD_PAYROLL_v1.0.md** — Plan et ordre d’exécution des scénarios recette continue (S-FR-2 à S-FR-4, S-E2E-2).
- RUNBOOK_EBE_OD_DEPLOY_2026-03-15.md
- RAPPORT_AVANCEMENT_EBE_OD_PAYROLL_2026-03-15.md

---

*ZeDocs/web50 — Résultats recette EBE OD Paie — 2026-03-15 — Lot 2 clos.*
