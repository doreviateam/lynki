# Plan recette continue — EBE OD Paie (scénarios hors périmètre v1.0)

**Date :** 2026-03-15  
**Référence :** SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md §7, RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md  
**Objectif :** Exécuter les scénarios recette continue (S-BE-3, S-FR-2 à S-FR-4, S-E2E-2). **Cadrage lot actuel :** le module Paie n’est pas encore installé en ERP ; la paie est gérée par OD comptables. Les tests liés à la source payslip (dont S-E2E-2) sont **N/A hors périmètre** du présent lot ; la recette v1.0 porte sur les flux de paie par OD. S-E2E-2 pourra être exécuté lorsque le module Paie sera installé et cadré.

---

## 1. Périmètre recette continue

| Id | Scénario | Prérequis | Exécution |
|----|----------|-----------|-----------|
| **S-BE-3** | Priorité payslip (pas de double comptage) | Tenant avec données hr.payslip **et** OD 641/645 sur la même période | **N/A hors périmètre** (scénario payslip ; recette v1.0 = OD) |
| **S-FR-2** | Affichage source bulletins | Réponse API avec `payroll_source = "payslip"` | **N/A hors périmètre** (scénario payslip ; recette v1.0 = OD) |
| **S-FR-3** | Affichage source indisponible | Réponse API avec `payroll_source = "none"` | ✅ **PASS** (tests unitaires) |
| **S-FR-4** | Rétrocompatibilité API sans `payroll_source` | Réponse API **sans** champ `payroll_source` | ✅ **PASS** (tests unitaires) |
| **S-E2E-2** | Non-régression tenant bulletins | Tenant avec **bulletins uniquement** (pas d’OD paie) | **N/A hors périmètre** (lot actuel : paie par OD ; à exécuter lorsque module Paie ERP installé) |

**Synthèse v1.0 :** S-FR-3, S-FR-4 = PASS ; S-BE-3, S-FR-2, S-E2E-2 = N/A hors périmètre.

---

## 2. Ordre d’exécution recommandé

1. **S-BE-3** (backend) — Vérifier la priorité payslip sur un tenant qui a les deux sources (payslip + OD). Si aucun tenant n’existe : exécuter le **test d’intégration** `TestPayrollAggregation_SourcePayslipPriority` (voir §4).
2. **S-FR-3** — Période ou tenant sans paie : appeler l’API puis ouvrir la card EBE et vérifier le badge « Source paie indisponible ».
3. **S-FR-4** — Mock ou proxy qui retire `payroll_source` de la réponse, puis vérifier l’affichage legacy_fallback en Linky.
4. **S-FR-2** et **S-E2E-2** — Tenant avec bulletins uniquement : vérifier API puis Linky (badge bulletins, EBE correct).

---

## 3. Prérequis environnement

- **Vault** et **Linky** déployés et joignables (même environnement que pour la validation v1.0 ou équivalent).
- **Au moins un tenant** avec données **hr.payslip** (bulletins ingérés dans Vault) pour S-FR-2 et S-E2E-2.
- **Optionnel pour S-BE-3** : un tenant avec **payslip + OD** sur la même période ; sinon, s’appuyer sur le test d’intégration (§4).

---

## 4. Test d’intégration S-BE-3 (priorité payslip)

Un test **TestPayrollAggregation_SourcePayslipPriority** a été ajouté dans `sources/vault/tests/integration/aggregations_payroll_test.go`. Il :

- Insère un document `hr.payslip` (table `documents`) pour un tenant de test sur 2026-01.
- Insère des lignes OD 641/645 pour le même tenant et la même période.
- Appelle `PayrollAggregation` et vérifie : `payroll_source = "payslip"`, total = total bulletins (pas bulletins + OD).

**Exécution :** avec une base de test (Postgres + migrations), comme pour S-BE-1/S-BE-2/S-BE-4 :

```bash
cd /opt/dorevia-plateform/sources/vault
TEST_DATABASE_URL="postgresql://vault:vault_password@localhost:5434/dorevia_vault?sslmode=disable" go test ./tests/integration/... -run Payroll -v
```

**Statut (2026-03-15)** : le test **TestPayrollAggregation_SourcePayslipPriority** existe et est exécutable (PASS en intégration). Pour la clôture v1.0, **S-BE-3 = N/A hors périmètre** (scénario payslip ; recette v1.0 = flux paie par OD).

---

## 5. Renseigner les statuts

Après chaque scénario, mettre à jour :

- **RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md** : tableau §2 (Statut = PASS ou FAIL, Date, Commentaire).
- **SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md** : tableau §5 (colonne Statut).

Lorsque **tous** les scénarios recette continue sont **PASS** (ou N/A documentés) :

- Prononcer la **clôture recette globale** (spec §7).
- Mettre à jour le **RAPPORT_AVANCEMENT** : Recette = Terminée, Clôture ticket = Fait.
- Clôturer le ticket **LINKY-EBE-OD-01 Lot 2**.

---

## 6. Références

- SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md (§7 critères validation globale)
- RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md
- RUNBOOK_EBE_OD_DEPLOY_2026-03-15.md

---

*ZeDocs/web50 — Plan recette continue EBE OD Paie — v1.0.*
