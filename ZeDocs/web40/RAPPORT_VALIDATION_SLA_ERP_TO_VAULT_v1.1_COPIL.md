# RAPPORT_VALIDATION_SLA_ERP_TO_VAULT_v1.1_COPIL

Date: 2026-03-09  
Perimetre: Environnement lab o19  
Auteur: Equipe plateforme Dorevia  
Statut: Version prete COPIL

## Executive Summary (1 page)

### Contexte

L'objectif contractuel a valider etait:

`ERP event captured -> Vault sealed <= 5 s (P95)`

sur la chaine:

`Odoo -> DVIG -> Vault`

Un incident storage PostgreSQL sur Vault lab a interrompu la campagne initiale:

- `could not read block`
- `unexpected data beyond EOF`
- `No such file or directory`

### Decision d'ingenierie

Apres purge logique et reindexation insuffisantes, la decision a ete:

> reset propre de la base Vault lab + remigration complete.

Cette decision est adaptee au contexte lab et garantit une base saine pour mesurer le SLA sans ambiguite.

### Resultats de validation

1. Relance lot incident (IDs 107..126, incluant 17 anciens `failed_soft`):
   - DVIG `forwarded=20`, `failed_soft=0`
   - Odoo `vaulted=20/20`
2. Campagne 100:
   - DVIG `forwarded=100`, Odoo `vaulted=100`
   - P50 `583.57 ms`, P95 `1013.15 ms`, P99 `1040.50 ms`
3. Campagne 500:
   - DVIG `forwarded=500`, Odoo `vaulted=500`
   - P50 `567.52 ms`, P95 `1017.96 ms`, P99 `1055.40 ms`

Controle global o19 (`payment.posted`):

- `forwarded=728`
- `failed_soft=0`
- `0 perte`
- `0 doublon`

### Message cle COPIL

Le SLA contractuel est **largement respecte** (P95 autour de 1.02 s pour une cible a 5 s), avec une stabilite maintenue entre 100 et 500 evenements.  
Le pipeline `Odoo -> DVIG -> Vault` est valide en environnement lab dans un etat propre post-reset.

## 1. Objet

Ce document formalise la validation technique SLA post-incident et fournit une decision Go/No-Go pour la suite.

## 2. Incident et decision technique

### 2.1 Nature de l'incident

- Corruption physique PostgreSQL sur Vault lab.
- Symptomes storage repetes invalidant la fiabilite des campagnes.

### 2.2 Actions pre-reset

1. purge logique doublons (`diva_insights`),
2. `REINDEX DATABASE`,
3. verification services.

Conclusion: insuffisant face a corruption physique persistante.

### 2.3 Decision

Abandon de la base Vault lab corrompue et reconstruction propre par reset/remigration.

## 3. Correctifs structurants prealables

- Propagation des timestamps ERP -> DVIG -> Vault.
- Instrumentation metriques + script de mesure SLA.
- Proof API Vault tenant-aware (`X-Tenant`) + propagation tenant cote Odoo.

## 4. Execution post-reset

### 4.1 Reset + remigration

- Reset volume DB Vault lab.
- Redemarrage `vault-db-core-stinger` et `vault-core-stinger`.
- Migrations appliquees jusqu'a `040_expected_counts_generated_at`.
- Sante:
  - `GET /health` -> `200`
  - `GET /api/v1/payments` -> `405` sur GET (normal)

### 4.2 Relance lot incident

- IDs `107..126` rejoues.
- Tous les evenements confirmes forwarded/vaulted.

### 4.3 Campagnes SLA

- Sanity 20, puis 100, puis 500.

## 5. Resultats detailles

### 5.1 Campagne 20 (post-reset)

- DVIG: `forwarded=20`, `failed_soft=0`
- Odoo: `vaulted=20/20`
- Vault: ingestion nominale, aucune erreur storage

### 5.2 Campagne 100 (IDs 127..226)

- P50: `583.57 ms`
- P95: `1013.15 ms`
- P99: `1040.50 ms`
- Min: `67.82 ms`
- Max: `1058.12 ms`
- Mean: `568.69 ms`

### 5.3 Campagne 500 (IDs 227..726)

- P50: `567.52 ms`
- P95: `1017.96 ms`
- P99: `1055.40 ms`
- Min: `68.19 ms`
- Max: `1074.30 ms`
- Mean: `565.50 ms`

### 5.4 Controle global o19

- DVIG outbox `payment.posted`: `forwarded=728`
- `failed_soft=0`
- Aucune perte, aucun doublon observe

## 6. Analyse de conformite SLA

Exigence:

`ERP event captured -> Vault sealed <= 5 s (P95)`

Observe:

- P95 campagne 100: `1.013 s`
- P95 campagne 500: `1.018 s`

Conclusion de conformite:

- SLA respecte avec marge importante (environ 5x plus rapide que la cible P95).
- Stabilite en charge confirmee (P95 quasi identique entre 100 et 500).

## 7. Registre des risques residuels

| ID | Risque residuel | Impact | Prob. | Niveau | Mitigation en place | Action restante |
|---|---|---|---|---|---|---|
| R1 | Corruption storage PostgreSQL Vault (lab/prod) | Arret ingestion, campagne invalide | Faible | Moyen | Procedure reset lab testee, supervision DB | Formaliser runbook restore prod + tests de restauration trimestriels |
| R2 | Derive de latence sous charge superieure | Degradation P95/P99 | Faible | Moyen | Instrumentation DVIG/Vault, campagnes 100/500 | Campagne de stress > 1000 evenements et seuils d'alerte backlog |
| R3 | Regressions multi-tenant proof API | Fuite de preuve inter-tenant | Faible | Eleve | Filtrage tenant (`X-Tenant`) en place | Ajouter tests automatiques de non-regression tenant (positif/negatif) |
| R4 | Desynchronisation horloges | Mesures SLA biaisees | Moyen | Moyen | NTP exige dans plan Sprint 0 | Controles automatiques NTP et alerte si drift > 100 ms |
| R5 | Erreurs concurrentes Odoo ponctuelles | Statut local retarde | Moyen | Faible | Retries et fetch proof robustes | Durcir les retries transactionnels et monitoring des `serialize access` |

## 8. Bloc decision Go/No-Go (prod)

### 8.1 Criteres de Go proposes

- C1. SLA ERP->Vault tenu en P95 sur >= 500 evenements.
- C2. `failed_soft = 0` sur campagne cible.
- C3. `0 perte` et `0 doublon` verifies.
- C4. Tests tenant-aware proof passes (dont tenant inexistant -> `404`).
- C5. Supervision/alerting actifs (latence, backlog, erreurs ingest).
- C6. Runbook incident DB + restauration valide en exercice.

### 8.2 Evaluation actuelle (lab o19)

- C1: **OK**
- C2: **OK**
- C3: **OK**
- C4: **OK** (correctif en place; test negatif deja observe)
- C5: **Partiel** (a renforcer pour passage prod)
- C6: **Partiel** (runbook lab implicite; version prod a formaliser)

### 8.3 Decision recommandee

- **Go technique pour poursuite vers pre-prod**, sous reserve de clore C5 et C6.
- **No-Go prod immediate** tant que la supervision complete et le runbook restauration prod ne sont pas formellement valides.

## 9. Prochaine etape

Consolider la cloture Sprint 3 (alertes MCO + UAT) puis engager Sprint 4.

Etat Sprint 3 a date:

- `TST-UAT-005/006` valides en lab (UX P95/P99 conformes).
- Procedure d'escalade et regles d'alertes UX formalisees (`RUNBOOK_ALERTES_UX_SPRINT3.md`).
- Sprint 3 est pret a cloture; Sprint 4 est demarrable.

Synthese technique a retenir:

- Les campagnes Sprint 2 et Sprint 3 demontrent que la plateforme Dorevia capture un evenement financier ERP, scelle sa preuve et le rend visible dans le cockpit Linky en environ **2 secondes**, avec stabilite et sans perte d'evenement.

## 10. References

- `ZeDocs/web40/INCIDENT_VAULT_LAB_RESET_2026-03-09.md`
- `ZeDocs/web40/RESULTATS_RESET_VAULT_SLA_2026-03-09.md`
- `ZeDocs/web40/RAPPORT_VALIDATION_SLA_ERP_TO_VAULT_v1.0.md`
- `ZeDocs/web40/RUNBOOK_ALERTES_UX_SPRINT3.md`
- `scripts/measure_sla_erp_to_vault_o19.py`

## 11. Addendum demonstration MOA (2026-03-09)

Pour la demonstration MOA, l'environnement lab `o19` a ete remis en etat metier lisible:

- purge des donnees de campagne Odoo `SLA-*` (`721` paiements supprimes),
- conservation d'un jeu metier controle (`4` paiements `FAC/*`),
- alignement final cockpit:
  - Paiements: `Total 4 387,00 EUR`, `Rapproche 996,00 EUR`, `A rapprocher 3 391,00 EUR`,
  - Tresorerie: `Position validee (Vault) = 996,00 EUR`.
