# COPIL_ONE_PAGER_SPRINT4_2026-03-09

Date: 2026-03-09  
Périmètre: tenant pilote `o19` (lab)  
Objet: décision Go/No-Go de clôture Sprint 4

## 1) Décision attendue

Valider la poursuite vers pré-production sur la base des résultats consolidés Sprint 2 + Sprint 3 + Sprint 4.

## 2) Résumé exécutif

- SLA preuve `ERP event captured -> Vault sealed` **conforme** et stable.
- SLO UX `Vault sealed -> Linky data available` **conforme** et stable.
- Fiabilité flux validée (`0 perte` constatée sur périmètre campagne, `0 doublon`, `failed_soft=0`).
- Alerting UX et escalade formalisés (runbook + journal d’incident simulé).

## 3) KPI clés (preuves)

### SLA ERP -> Vault (campagne 500)

- P50: `567.52 ms`
- P95: `1017.96 ms` (objectif `<= 5 s`)
- P99: `1055.40 ms` (objectif `<= 10 s`)

### UX Vault -> Linky (campagne 60)

- P50: `859 ms`
- P95: `905.25 ms` (objectif `<= 2 s`)
- P99: `920.28 ms` (objectif `<= 4 s`)
- `slo_state = ok`

### Fiabilité

- DVIG global (`payment.posted`, `o19`): `forwarded=728`, `failed_soft=0`
- Contrôle campagne IDs `107..726`:
  - DVIG forwarded: `620`
  - Odoo vaulted: `620`
  - Écart: `0`

## 4) Critères Sprint 4

- [x] SLA P95/P99 conformes
- [x] UX P95/P99 conformes
- [x] Perte = 0 (périmètre campagne)
- [x] Doublon = 0 (périmètre campagne)
- [x] Alerting UX opérationnel (seuils + simulation + escalade)
- [ ] Checklist recette signée MOA/MOE/MCO (dernier point administratif)

## 5) Recommandation

> **GO technique pour poursuite pré-production**, sous réserve de signature recette formelle MOA/MOE/MCO en clôture COPIL.

## 6) Pièces de référence

- `ZeDocs/web40/DOSSIER_EXECUTION_RECETTE_SPRINT4_2026-03-09.md`
- `ZeDocs/web40/DECISION_COPIL_SPRINT4_2026-03-09_PREP.md`
- `ZeDocs/web40/RESULTATS_RESET_VAULT_SLA_2026-03-09.md`
- `ZeDocs/web40/RESULTATS_SPRINT3_UX_2026-03-09.md`
- `ZeDocs/web40/UAT_005_006_SPRINT3_2026-03-09.md`
- `ZeDocs/web40/JOURNAL_ALERTES_UX_SPRINT3_2026-03-09.md`

## 7) Validation COPIL (à renseigner)

- Décision: GO / NO-GO  
- Conditions:  
- Date:  
- Signataires:
  - MOA:
  - MOE:
  - MCO:

## 8) Addendum coherence donnees MOA (2026-03-09)

- Odoo lab nettoye des donnees de campagne (`721` paiements `SLA-*` supprimes).
- Etat demo retenu:
  - Paiements: `4 387,00 EUR` total, `996,00 EUR` rapproche, `3 391,00 EUR` a rapprocher.
  - Tresorerie: `Position validee (Vault) = 996,00 EUR`.
- Lecture MOA:
  - Odoo = activite comptable,
  - Vault = preuve scellee,
  - Linky = pilotage de l'ecart entre activite et couverture probante.
