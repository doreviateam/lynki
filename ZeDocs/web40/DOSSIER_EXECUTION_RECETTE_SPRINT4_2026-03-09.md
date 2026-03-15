# DOSSIER_EXECUTION_RECETTE_SPRINT4_2026-03-09

Date: 2026-03-09  
Tenant pilote: `o19`  
Objet: exécution recette finale + décision COPIL Go/No-Go

## 1) Objectif Sprint 4

Valider officiellement la chaîne complète:

- `ERP event captured -> Vault sealed <= 5 s (P95)`  
- `Vault sealed -> Linky data available <= 2 s (P95)`

et statuer Go/No-Go avec dossier de preuves consolidé.

## 2) Entrées obligatoires (déjà disponibles)

- `ZeDocs/web40/RESULTATS_RESET_VAULT_SLA_2026-03-09.md`
- `ZeDocs/web40/RESULTATS_SPRINT3_UX_2026-03-09.md`
- `ZeDocs/web40/UAT_005_006_SPRINT3_2026-03-09.md`
- `ZeDocs/web40/RUNBOOK_ALERTES_UX_SPRINT3.md`
- `ZeDocs/web40/RAPPORT_VALIDATION_SLA_ERP_TO_VAULT_v1.1_COPIL.md`

## 3) Ordre d’exécution recommandé (jour recette)

1. Pré-check environnement (ERP/DVIG/Vault/Linky + NTP + corrélation logs).  
2. Vérification SLA preuve (export métriques existantes + contrôle cohérence).  
3. Vérification UX (export `/api/ux-metrics` + capture cockpit footer).  
4. Vérification fiabilité (`events_lost`, doublons, `failed_soft`).  
5. Vérification alertes (seuils + simulation + journal horodaté).  
6. Consolidation des preuves dans un bundle unique.  
7. Revue MOA/MOE/MCO et décision COPIL.

## 4) Checkpoints de validation finale

### 4.1 SLA preuve (ERP -> Vault)

- [x] P95 <= 5 s
- [x] P99 <= 10 s
- [x] `events_lost = 0`
- [x] `failed_soft = 0`
- [x] Doublons métier = 0

### 4.2 SLO UX (Vault -> Linky)

- [x] P95 <= 2 s
- [x] P99 <= 4 s
- [x] `count` suffisant et documenté
- [x] `slo_state = ok`

### 4.3 Observabilité / alertes

- [x] Seuils WATCH/ALERT documentés
- [x] Simulation d’une dérive UX prouvée
- [x] Journal d’alertes horodaté joint
- [x] Procédure d’escalade validée

## 5) Pièces à joindre au dossier de preuves

### Exports techniques

- [x] Export percentiles SLA (P50/P95/P99)
- [x] Export `GET /api/ux-metrics` (JSON complet)
- [x] Extrait de métriques DVIG/Vault (forwarded/failed/lost)

### Traces et captures

- [ ] Capture cockpit Linky (footer UX P95 + état)
- [ ] Capture état services (containers/health)
- [ ] Extrait logs corrélés (`event_id`, `idempotency_key`)

### Documents de validation

- [x] UAT-005/006 signé (ou visé QA/MOE)
- [ ] Checklist recette signée MOA/MOE/MCO
- [x] Synthèse de décision COPIL (préparée)

## 5 bis) Passe 1 exécutée (pré-check + preuves techniques)

Exécution: 2026-03-09

### État services

- `linky_lab_o19`: Up
- `vault-core-stinger`: Up (healthy)
- `dvig-core-stinger`: Up (healthy)
- `odoo_lab_o19`: Up

### Preuve SLA ERP -> Vault (campagne 500, IDs 227..726)

- P50: `567.52 ms`
- P95: `1017.96 ms`
- P99: `1055.40 ms`
- Min: `68.19 ms`
- Max: `1074.30 ms`

### Preuve UX Vault -> Linky (fenêtre 30 min)

- `count = 60`
- `p50_ms = 859`
- `p95_ms = 905.25`
- `p99_ms = 920.28`
- `slo_state = ok`

### Fiabilité DVIG/Odoo

- Outbox DVIG (`payment.posted`, tenant `o19`): `forwarded = 728`, `failed_soft = 0`
- Contrôle périmètre campagne (IDs 107..726):
  - DVIG forwarded: `620`
  - Odoo vaulted: `620`
  - écart: `0` (perte constatée: `0`)

Note:

- La passe 2 conserve un rapprochement final global comme contrôle de clôture.

## 5 ter) Pièces passe 2 (gouvernance)

- Journal alertes UX:
  - `ZeDocs/web40/JOURNAL_ALERTES_UX_SPRINT3_2026-03-09.md`
- Décision COPIL (préparation):
  - `ZeDocs/web40/DECISION_COPIL_SPRINT4_2026-03-09_PREP.md`

## 6) Trame de décision COPIL (à copier)

### Option GO

> Les critères Sprint 4 sont satisfaits: SLA preuve conforme, SLO UX conforme, fiabilité validée (0 perte, 0 doublon), alerting opérationnel. Décision: **GO**.

### Option NO-GO

> Un ou plusieurs critères ne sont pas satisfaits (détaillés ci-dessous). Décision: **NO-GO** avec plan d’actions correctives et date de re-test.

## 7) Registre de décision (à remplir)

- Date COPIL:  
- Participants MOA:  
- Participants MOE:  
- Participants MCO:  
- Décision: GO / NO-GO  
- Conditions éventuelles:  
- Actions post-COPIL:  

## 8) Sortie attendue Sprint 4

- Dossier recette final consolidé.
- Décision COPIL formelle archivée.
- Passage en phase suivante validé (pré-prod/prod selon gouvernance).

## 9) Addendum etat final demo MOA (2026-03-09)

### Nettoyage environnement

- Donnees de campagne Odoo `SLA-*` retirees: `721` paiements supprimes.
- Base Odoo lab stabilisee sur le jeu metier de demonstration.

### Valeurs de reference a presenter

- Paiements:
  - Total periode: `4 387,00 EUR`
  - Rapproche: `996,00 EUR`
  - A rapprocher: `3 391,00 EUR`
- Tresorerie:
  - Solde comptable (ERP): `996,00 EUR`
  - Position validee (Vault): `996,00 EUR`
