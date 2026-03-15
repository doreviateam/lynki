# PARCOURS_MOA_LINKY_RECETTE_10_MIN

Date: 2026-03-09  
Périmètre: Linky `tenant=o19` (lab)  
Durée cible: 10 minutes

## 1) Objectif de la séance

Permettre à la MOA de vérifier rapidement que:

- le cockpit Linky est utilisable,
- les indicateurs sont cohérents et lisibles,
- la chaîne de valeur “preuve -> décision” est opérationnelle.

## 2) Pré-check (1 min)

- [ ] Ouvrir Linky (tenant `o19`) sans erreur bloquante.
- [ ] Vérifier présence du cockpit (header + cartes + footer).
- [ ] Vérifier que le footer affiche un état UX (`UX P95`) et la source `Vault`.

## 3) Parcours guidé (6 min)

### Étape A — Vue globale (2 min)

- [ ] Vérifier que les cartes principales s’affichent (Trésorerie, Cash, Business, etc.).
- [ ] Vérifier que les montants sont formatés et lisibles.
- [ ] Vérifier que l’état de complétude n’indique pas d’incohérence majeure.

### Étape B — Cohérence fonctionnelle (2 min)

- [ ] Ouvrir la carte Business et vérifier que la valeur est stable au refresh.
- [ ] Ouvrir la carte Cash et vérifier absence de “jitter” visible.
- [ ] Vérifier que les données affichées restent alignées après 2 rafraîchissements.

### Étape C — Signal de confiance (2 min)

- [ ] Vérifier le badge/intégrité et le footer (preuves + UX P95).
- [ ] Vérifier que `UX P95` est en état nominal (`ok`/signal vert).
- [ ] Vérifier que la mention “Source: Vault” est explicite.

## 4) Critères de validation MOA (2 min)

Valider **OK MOA** si:

- [ ] Navigation cockpit fluide, sans blocage.
- [ ] Indicateurs principaux compréhensibles et stables.
- [ ] Signal UX nominal et lisible (`UX P95`).
- [ ] Aucune anomalie fonctionnelle majeure remontée.

Déclarer **NOK MOA** si:

- [ ] carte critique vide/incohérente de façon persistante,
- [ ] divergence visible entre rafraîchissements successifs,
- [ ] indisponibilité cockpit ou erreur répétée.

## 5) Sortie attendue de la séance

- Verdict: **OK MOA** / **NOK MOA**
- Commentaires MOA (3 points max):
  1.  
  2.  
  3.  
- Action immédiate si NOK:
  - ticket + capture + horodatage

## 6) Références

- `ZeDocs/web40/DOSSIER_EXECUTION_RECETTE_SPRINT4_2026-03-09.md`
- `ZeDocs/web40/COPIL_ONE_PAGER_SPRINT4_2026-03-09.md`
- `ZeDocs/web40/RESULTATS_SPRINT3_UX_2026-03-09.md`

## 7) Ce que la MOA doit comprendre (Odoo -> Vault -> Linky)

### Rôle de chaque brique

- **Odoo (ERP)**: système de gestion opérationnelle (factures, paiements, écritures).
- **Vault**: coffre de preuves financières scellées (source de vérité probante).
- **Linky**: cockpit de lecture/pilotage qui affiche les indicateurs à partir des données Vault (et des contrôles de cohérence).

### Lecture fonctionnelle simple

- **Odoo dit "ce qui a été fait"** (événements comptables métier).
- **Vault dit "ce qui est prouvé/scellé"** (preuve opposable et traçable).
- **Linky dit "où on en est pour décider"** (niveau de couverture probante + écarts restants).

## 8) Lecture MOA sur les données actuelles (tenant o19)

### Chiffres de référence observés

- **Total paiements période**: `4 387,00 EUR`
- **Rapproché**: `996,00 EUR`
- **À rapprocher**: `3 391,00 EUR`
- **Position validée (Vault)**: `996,00 EUR`
- **Solde comptable (ERP)**: `996,00 EUR`

### Interprétation attendue

- Le cockpit montre un **total de flux paiements** (`4 387`) sur la période.
- Sur ce total, **996** sont déjà couverts/rapprochés par preuve bancaire.
- Le reliquat **3 391** reste à couvrir.
- Le ratio "flux non couverts" est donc cohérent avec `3 391 / 4 387 = 77,3 %`.

### Message métier pour la MOA

- La plateforme ne masque pas l'écart: elle le rend visible.
- Linky ne remplace pas Odoo: il explicite le passage de la comptabilité ERP vers la preuve scellée.
- La décision de pilotage se prend sur le couple:
  - **activité ERP** (ce qui est saisi),
  - **couverture Vault** (ce qui est prouvé).

## 9) Formulation MOA prête à l'emploi (COPIL/recette)

> Odoo porte l'activité financière métier.  
> Vault constitue la source de vérité scellée.  
> Linky rend lisible l'écart entre activité ERP et couverture probante, pour piloter le rapprochement et la décision.
