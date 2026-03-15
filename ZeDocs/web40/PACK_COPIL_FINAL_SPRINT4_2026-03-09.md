# PACK_COPIL_FINAL_SPRINT4_2026-03-09

Date: 2026-03-09  
Perimetre: tenant pilote `o19` (lab)  
Usage: support unique pour presentation COPIL + decision GO/NO-GO

## 1) Objectif du pack

Fournir en un seul document:

- l'ordre de lecture recommande pour le COPIL,
- la synthese executive "1 slide",
- les KPI de decision,
- la trame de decision formelle a renseigner.

## 2) Ordre de lecture recommande (15 min)

1. **One-pager decision**
   - `ZeDocs/web40/COPIL_ONE_PAGER_SPRINT4_2026-03-09.md`
2. **Dossier d'execution recette**
   - `ZeDocs/web40/DOSSIER_EXECUTION_RECETTE_SPRINT4_2026-03-09.md`
3. **Rapport validation SLA v1.1 COPIL**
   - `ZeDocs/web40/RAPPORT_VALIDATION_SLA_ERP_TO_VAULT_v1.1_COPIL.md`
4. **Pieces UX Sprint 3**
   - `ZeDocs/web40/RESULTATS_SPRINT3_UX_2026-03-09.md`
   - `ZeDocs/web40/UAT_005_006_SPRINT3_2026-03-09.md`
   - `ZeDocs/web40/RUNBOOK_ALERTES_UX_SPRINT3.md`
5. **Decision prep**
   - `ZeDocs/web40/DECISION_COPIL_SPRINT4_2026-03-09_PREP.md`

## 3) Slide unique (copier-coller)

### Titre

**Dorevia o19 (lab) - Validation Sprint 4 et passage pre-production**

### Message cle (executif)

- SLA preuve valide avec marge significative.
- SLO UX valide avec marge significative.
- Fiabilite pipeline validee (perte/doublon/failed_soft a 0 sur perimetre campagne).
- Demonstration MOA stabilisee et lisible (donnees metier nettoyees).

### KPI de decision

- SLA `ERP event captured -> Vault sealed`:
  - P95 `1017.96 ms` (objectif `<= 5 s`)
  - P99 `1055.40 ms` (objectif `<= 10 s`)
- UX `Vault sealed -> Linky data available`:
  - P95 `905.25 ms` (objectif `<= 2 s`)
  - P99 `920.28 ms` (objectif `<= 4 s`)
- Fiabilite:
  - `0 perte`, `0 doublon`, `failed_soft=0` (perimetre campagne)

### Coherence fonctionnelle MOA (etat final)

- Odoo lab nettoye des donnees `SLA-*` (`721` paiements supprimes).
- Paiements Linky:
  - Total `4 387,00 EUR`
  - Rapproche `996,00 EUR`
  - A rapprocher `3 391,00 EUR`
- Tresorerie Linky:
  - Solde comptable (ERP) `996,00 EUR`
  - Position validee (Vault) `996,00 EUR`

### Decision proposee

> **GO technique vers pre-production**, sous reserve de signature recette formelle MOA/MOE/MCO.

## 4) Storyline de presentation (4 minutes)

- **Pourquoi**: reduire le "temps de verite financiere" de l'evenement ERP a la lecture cockpit.
- **Ce qui est prouve**: SLA preuve, UX, fiabilite, observabilite.
- **Ce qui a ete assaini**: retrait des donnees de campagne pour une lecture MOA metier.
- **Ce qui reste**: formalisation administrative (signatures recette + decision COPIL archivee).

## 5) Trame de decision COPIL (a renseigner en seance)

- Decision: GO / NO-GO
- Date:
- Participants:
  - MOA:
  - MOE:
  - MCO:
- Conditions eventuelles:
- Actions post-COPIL:
  1.
  2.

## 6) Check final avant seance

- [ ] Le cockpit Linky o19 affiche les valeurs de reference (`4 387 / 996 / 3 391`).
- [ ] La card Tresorerie affiche `Position validee (Vault) = 996,00 EUR`.
- [ ] Les documents de reference sont accessibles en lecture.
- [ ] Le support de decision (section 5) est pre-rempli avec la date et les participants.
