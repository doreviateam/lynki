# RAPPORT_VALIDATION_SLA_ERP_TO_VAULT_v1.0

Date: 2026-03-09  
Perimetre: Environnement lab o19  
Auteur: Equipe plateforme Dorevia

## 1. Objet

Ce document formalise la validation technique du SLA:

`ERP event captured -> Vault sealed <= 5 s (P95)`

sur la chaine:

`Odoo -> DVIG -> Vault`

## 2. Contexte et incident initial

L'environnement Vault lab a presente un incident PostgreSQL de nature physique (storage), avec symptomes repetes:

- `could not read block`
- `unexpected data beyond EOF`
- `No such file or directory`

Actions tentees avant decision:

1. purge logique des doublons (`diva_insights`),
2. reindexation complete (`REINDEX DATABASE`),
3. verification des services.

Constat final: la corruption physique persistait et invalidait toute campagne SLA fiable.

## 3. Decision technique

Decision retenue:

> abandon de la base Vault lab corrompue et reconstruction propre par reset/remigration.

Motif:

- incident physique PostgreSQL persistant,
- environnement lab (objectif prioritaire: validation pipeline + metriques propres),
- non pertinence d'une investigation storage longue pour cette phase.

## 4. Correctifs et securisation prealables

Avant la campagne SLA, les points structurants suivants etaient deja traites:

- propagation des timestamps ERP -> DVIG -> Vault pour la mesure bout-en-bout,
- correction proof API tenant-aware cote Vault (`X-Tenant`),
- propagation du tenant cote Odoo pour la recuperation des preuves,
- instrumentation metriques et script de mesure SLA.

## 5. Procedure d'execution

### 5.1 Reset Vault DB lab + remigration

- reset du volume DB Vault lab,
- recreation des services Vault DB + API,
- application des migrations jusqu'a `040_expected_counts_generated_at`,
- verification de sante:
  - `GET /health` -> `200`,
  - `GET /api/v1/payments` -> `405` en GET (comportement attendu).

### 5.2 Relance des evenements en echec

- relance du lot IDs `107..126` (incluant 17 anciens `failed_soft`),
- verification DVIG/Odoo/Vault.

### 5.3 Campagnes de validation et SLA

Ordonnancement execute:

1. mini-campagne 20 (sanity post-reset),
2. campagne 100,
3. campagne 500.

## 6. Resultats

### 6.1 Reprise post-reset (lot 20, IDs 107..126)

- DVIG outbox: `forwarded = 20`, `failed_soft = 0`
- Odoo: `vaulted = 20/20`
- Vault: ingestion nominale, sans erreur storage

### 6.2 Campagne 100 (IDs 127..226)

- volumetrie: `100/100` forwarded et vaulted
- SLA ERP->Vault:
  - P50: `583.57 ms`
  - P95: `1013.15 ms`
  - P99: `1040.50 ms`
  - Min: `67.82 ms`
  - Max: `1058.12 ms`
  - Mean: `568.69 ms`

### 6.3 Campagne 500 (IDs 227..726)

- volumetrie: `500/500` forwarded et vaulted
- SLA ERP->Vault:
  - P50: `567.52 ms`
  - P95: `1017.96 ms`
  - P99: `1055.40 ms`
  - Min: `68.19 ms`
  - Max: `1074.30 ms`
  - Mean: `565.50 ms`

### 6.4 Controle global o19 (payment.posted)

- DVIG outbox: `forwarded = 728`
- `failed_soft = 0`
- aucune perte observee
- aucun doublon observe

## 7. Interpretation

Le SLA cible est largement respecte:

- cible contractuelle: `P95 <= 5 s`
- observe: `P95 ~= 1.02 s` (campagnes 100 et 500)

Marge de performance:

- environ 5x plus rapide que l'objectif P95.

Signal de stabilite:

- P95 campagne 100 (`1013 ms`) et campagne 500 (`1018 ms`) quasi identiques,
- absence de derive en charge,
- absence de backlog bloquant sur le flux teste.

## 8. Conclusion officielle

- L'incident initial provient d'une corruption physique PostgreSQL du volume Vault lab.
- La reconstruction propre de la base Vault en environnement lab a retabli un etat sain.
- Les campagnes SLA (20, 100, 500) demontrent une chaine stable `Odoo -> DVIG -> Vault`.

Resultat final:

`ERP event captured -> Vault sealed <= 5 s (P95)` est **largement respecte**.

Etat pipeline valide:

- `0 perte`
- `0 doublon`
- `0 failed_soft`

## 9. Limites et suites recommandees

- Ce rapport couvre la validation SLA ERP->Vault en lab o19.
- Etape suivante recommandee: formaliser la validation UX complementaire:
  - `Vault sealed -> Linky data available <= 2 s (P95)`,
  - sur campagne dediee avec traces horodatees cote Linky.

## 10. References

- `ZeDocs/web40/INCIDENT_VAULT_LAB_RESET_2026-03-09.md`
- `ZeDocs/web40/RESULTATS_RESET_VAULT_SLA_2026-03-09.md`
- `scripts/measure_sla_erp_to_vault_o19.py`

## 11. Addendum demonstration MOA (2026-03-09)

- Environnement Odoo lab remis en etat metier lisible (suppression des paiements de campagne `SLA-*`).
- Reference cockpit de recette:
  - Paiements: `4 387,00 EUR` total, `996,00 EUR` rapproche, `3 391,00 EUR` a rapprocher.
  - Tresorerie: `Position validee (Vault) = 996,00 EUR`.
