# DECISION_COPIL_SPRINT4_2026-03-09_PREP

Date préparation: 2026-03-09  
Périmètre: tenant pilote `o19` (lab)

## 1) Objet

Préparer la décision COPIL Go/No-Go sur la base des preuves Sprint 2 + Sprint 3 + passe 1 Sprint 4.

## 2) Synthèse exécutive

La plateforme démontre sur environnement lab:

- SLA preuve `ERP event captured -> Vault sealed` conforme et stable.
- SLO UX `Vault sealed -> Linky data available` conforme et stable.
- Fiabilité validée (`failed_soft=0`, perte constatée `0`, doublon constaté `0` sur périmètre campagne).

## 3) Résultats clés à rappeler en COPIL

### SLA ERP -> Vault (campagne 500)

- P50: `567.52 ms`
- P95: `1017.96 ms` (objectif: `<= 5 s`)
- P99: `1055.40 ms` (objectif: `<= 10 s`)

### UX Vault -> Linky (campagne dédiée 60)

- P50: `859 ms`
- P95: `905.25 ms` (objectif: `<= 2 s`)
- P99: `920.28 ms` (objectif: `<= 4 s`)
- `slo_state = ok`

### Fiabilité flux

- DVIG outbox (`payment.posted`, `o19`): `forwarded=728`, `failed_soft=0`
- Contrôle campagne IDs `107..726`:
  - DVIG forwarded: `620`
  - Odoo vaulted: `620`
  - écart: `0`

## 4) Évaluation des critères Sprint 4

- [x] P95 SLA <= 5 s
- [x] P99 SLA <= 10 s
- [x] P95 UX <= 2 s
- [x] P99 UX <= 4 s
- [x] 0 perte constatée (périmètre campagne)
- [x] 0 doublon constaté (périmètre campagne)
- [x] Alerting UX et escalade formalisés
- [ ] Checklist recette signée MOA/MOE/MCO (à clôturer en séance)

## 5) Recommandation

### Recommandation proposée

> **GO technique pour poursuite pré-production**, sous réserve de validation formelle des signatures recette et de l’archivage COPIL.

### Limites connues

- Validation effectuée en lab sur tenant pilote.
- Extension statistique et gouvernance finale à confirmer en pré-production avant généralisation.

## 6) Décision COPIL (à renseigner)

- Décision: GO / NO-GO
- Date:
- Participants:
  - MOA:
  - MOE:
  - MCO:
- Conditions complémentaires:
- Actions post-décision:

## 7) Addendum mise en coherence MOA (2026-03-09)

- Nettoyage Odoo lab des traces de campagne `SLA-*` effectue (`721` paiements supprimes).
- Valeurs cockpit validees pour la presentation:
  - Paiements: `Total 4 387,00 EUR`, `Rapproche 996,00 EUR`, `A rapprocher 3 391,00 EUR`.
  - Tresorerie: `Position validee (Vault) = 996,00 EUR`.
- Point de gouvernance:
  - Linky affiche des ecarts de couverture probante (et non une simple repetition ERP).
