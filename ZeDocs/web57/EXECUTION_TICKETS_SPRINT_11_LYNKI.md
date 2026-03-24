# Exécution tickets — Sprint 11 Lynki (Phase 2)

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_11_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** exécution terrain — dérivé du [PLAN_SPRINT_11_LYNKI.md](PLAN_SPRINT_11_LYNKI.md) **v1.0**

**Références :**  
[PLAN_SPRINT_11_LYNKI.md](PLAN_SPRINT_11_LYNKI.md) · [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) · [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)

---

## 1. Objet

Ce document transforme le **PLAN_SPRINT_11_LYNKI.md** en **ordre d'exécution concret**, avec :

- séquence réelle de travail ;
- décisions à figer rapidement ;
- checkpoints intermédiaires ;
- critères de clôture ;
- sorties attendues pour le futur **`RAPPORT_SPRINT_11_LYNKI.md`**.

Le Sprint 11 vise à faire passer Lynki de la **lecture comparative décisionnelle par société** à une **lecture consolidée, plus robuste et mieux préparée pour les balances tiers V2** :

1. **multi-sociétés** ;
2. **comparatifs enrichis** ;
3. **préparation du netting tiers V2** ;
4. **exports comparatifs**.

---

## 2. Décisions à figer avant de coder

### 2.1 `company_ids` = représentation canonique du périmètre multi-sociétés

Pour éviter les ambiguïtés d'URL et de reproductibilité, le périmètre multi-sociétés doit être **canonique**.

**Décision Sprint 11 :**
- `company_ids` est le paramètre de référence pour le multi-sociétés
- les IDs sont :
  - convertis en entiers
  - dédupliqués
  - triés croissants
- l'URL canonique devient par exemple :
  - `company_ids=1,2,3`
  - jamais `3,1,2`

### 2.2 "Toutes les sociétés" = état explicite

Il ne faut pas laisser une ambiguïté entre :
- **absence de filtre**
- et **choix explicite utilisateur**

**Décision Sprint 11 :**
- côté métier, les deux représentent le même périmètre
- côté UI, "Toutes les sociétés" est un état explicite
- côté URL :
  - V1 acceptable : absence de `company_ids` = toutes sociétés
  - mais le shell doit afficher clairement "Toutes les sociétés"
- si besoin, le futur pourra introduire une représentation explicite, mais pas dans ce sprint

### 2.3 Comparatifs enrichis : priorité fonctionnelle stricte

Le risque principal du sprint est de faire dériver le sélecteur de période.

**Décision Sprint 11 :**
ordre de priorité :
1. trimestre
2. semestre
3. personnalisé

Si le sprint tend, le **personnalisé** est le premier élément reportable.

### 2.4 Netting tiers V2 : préparation seulement

Le Sprint 11 ne doit pas dériver vers une implémentation métier complète du netting.

**Décision Sprint 11 :**
- T63/T64 s'arrêtent à :
  - migration de schéma
  - lecture / upsert
  - alimentation connecteur
- aucun moteur de netting complet
- aucune logique avancée de lettrage partiel / avoir / compensation métier dans ce sprint

### 2.5 Consolidation multi-sociétés : somme additive V1

Le périmètre consolidé de Sprint 11 est une **agrégation additive** sur les sociétés sélectionnées.

**Décision Sprint 11 :**
- pas de logique spécifique de retraitement inter-sociétés
- pas d'élimination de flux internes
- la limitation doit être assumée et documentée

---

## 3. Ordre d'attaque recommandé

Ordre conseillé :

1. **T59** — Vault multi-sociétés  
2. **T60** — Linky sélecteur multi-sociétés + URL  
3. **T61** — comparatifs enrichis  
4. **T62** — exports comparatifs  
5. **T63** — migration schéma tiers V2  
6. **T64** — connecteur Odoo enrichi  
7. **T65** — non-régression + doc

### Règle d'or

Ne pas lancer sérieusement **T60** tant que le contrat `company_ids` n'est pas figé côté Vault.  
Ne pas laisser **T63/T64** polluer le sprint fonctionnel : c'est un axe de préparation, pas le cœur visible du sprint.

---

## 4. Tickets terrain

## T59 — Vault : consolidation multi-sociétés

### But
Permettre aux endpoints comptables ciblés d'agréger sur plusieurs sociétés d'un même tenant.

### Endpoints concernés
- `trial-balance`
- `balance-sheet/rubrics`
- `income-statement/rubrics`
- `aged-receivables`
- `aged-payables`

### Entrées
- endpoints single company stables
- périmètre tenant déjà en place

### Travaux attendus
1. accepter `company_ids` en query param CSV
2. parser, dédupliquer, trier
3. si `company_ids` existe :
   - ignorer `company_id`
4. si rien n'est fourni :
   - utiliser "toutes sociétés du tenant"
5. appliquer le filtre SQL correspondant

### Règle de contrat
- `company_id` = historique
- `company_ids` = nouveau contrat multi-sociétés
- `company_ids` prime si présent

### Sorties attendues
- endpoints Vault compatibles multi-sociétés
- périmètre consolidé stable
- régression single company nulle

### Checkpoints
- **CP1** : `company_id=1` fonctionne comme avant
- **CP2** : `company_ids=1,2` agrège bien sur 1 et 2
- **CP3** : `company_ids=2,1,2` est normalisé en `1,2`
- **CP4** : absence de `company_id(s)` = toutes sociétés
- **CP5** : aucun endpoint ciblé ne casse

### Fichiers pressentis
- handlers Vault comptables déjà existants
- éventuels helpers communs query parsing

---

## T60 — Linky / UI : sélecteur multi-sociétés + persistance URL

### But
Rendre visible et manipulable le périmètre multi-sociétés dans la Synthèse.

### Entrées
- T59 livré
- état URL / filtres existant stable

### Travaux attendus
1. ajouter un sélecteur multi-sociétés dans le shell Synthèse
2. prévoir :
   - "Toutes les sociétés"
   - sélection multiple explicite
3. refléter le choix dans l'URL
4. transmettre `company_ids` aux blocs
5. afficher un badge ou libellé de périmètre

### Sorties attendues
- périmètre multi-sociétés pilotable depuis l'UI
- URL partageable
- tous les blocs suivent le même périmètre

### Checkpoints
- **CP6** : "Toutes les sociétés" recharge tous les blocs
- **CP7** : sélection 2 sociétés recharge tous les blocs
- **CP8** : URL rejoue le périmètre
- **CP9** : drill rubrique → BG conserve `company_ids`
- **CP10** : drill BG → GL conserve `company_ids` si applicable

### Fichiers pressentis
- `AccountingSummaryView.tsx`
- éventuel composant filtre shell
- routes proxy Linky comptables

---

## T61 — Comparatifs enrichis

### But
Étendre le comparatif au-delà de l'exercice courant / N-1.

### Entrées
- comparatif N / N-1 Sprint 10 stable

### Périmètres cibles
- trimestre
- semestre
- personnalisé

### Travaux attendus
1. centraliser le calcul de période
2. ajouter les modes :
   - `quarter`
   - `semester`
   - `custom`
3. conserver la règle :
   - comparaison à période équivalente N-1
4. propager les dates à tous les blocs
5. garder la rétrocompatibilité du mode actuel

### Règles
- N-1 absent → `—`
- pas de faux zéro
- le mode "personnalisé" est reportable si tension de sprint

### Sorties attendues
- comparatif enrichi fonctionnel
- logique de période centralisée
- cohérence inter-blocs

### Checkpoints
- **CP11** : trimestre courant compare au trimestre N-1
- **CP12** : semestre courant compare au semestre N-1
- **CP13** : mode personnalisé calcule bien la même durée N-1
- **CP14** : sans données N-1, l'UI reste honnête
- **CP15** : pas de régression sur exercice courant

### Fichiers pressentis
- shell Synthèse
- logique de calcul de période côté UI
- routes proxy si besoin d'enrichissement paramétrique

---

## T62 — Exports comparatifs Bilan / CR

### But
Rendre les exports comparatifs cohérents avec la nouvelle lecture N / N-1.

### Entrées
- T61 livré
- exports rubriques Sprint 08 stables

### Cibles
- `balance-sheet/rubrics/export?compare=n-1`
- `income-statement/rubrics/export?compare=n-1`

### Colonnes attendues
- `rubric_id`
- `label`
- `section`
- `amount_current`
- `amount_previous`
- `delta`
- `delta_percent`
- `period_from`
- `period_to`
- `period_previous_from`
- `period_previous_to`
- `tenant`
- `referentiel_version`

### Règles
- si N-1 absent :
  - colonnes previous / delta vides
- pas de zéro trompeur

### Sorties attendues
- export Bilan comparatif
- export CR comparatif
- doctrine Vault respectée

### Checkpoints
- **CP16** : export Bilan comparatif OK
- **CP17** : export CR comparatif OK
- **CP18** : colonnes current / previous / delta présentes
- **CP19** : header source Vault présent
- **CP20** : régression nulle sur exports non comparatifs

### Fichiers pressentis
- handlers export rubriques Vault
- routes proxy Linky export rubriques
- boutons export si adaptation UI nécessaire

---

## T63 — Migration schéma tiers V2

### But
Préparer le terrain pour des balances tiers plus fiables au Sprint 12.

### Entrées
- schéma `account_move_lines` actuel
- logique aged balance Sprint 09 stable

### Colonnes à ajouter
- `date_maturity`
- `full_reconcile_id`
- `matching_number`

### Travaux attendus
1. migration SQL idempotente
2. extension des structs Vault
3. lecture compatible `NULL`
4. build Vault propre

### Sorties attendues
- schéma prêt pour V2
- aucune régression de lecture existante

### Checkpoints
- **CP21** : migration s'applique proprement
- **CP22** : build Vault OK
- **CP23** : anciennes lignes restent lisibles
- **CP24** : colonnes disponibles pour le connecteur

### Fichiers pressentis
- migration SQL
- storage / structs Vault liés à `account_move_lines`

---

## T64 — Connecteur Odoo enrichi

### But
Alimenter le Vault avec les nouvelles colonnes tiers V2.

### Entrées
- T63 livré
- connecteur Odoo Sprint 07 stable

### Champs à pousser
- `date_maturity`
- `full_reconcile_id`
- `matching_number`

### Travaux attendus
1. enrichir l'extraction Odoo
2. transmettre les nouveaux champs
3. upsert idempotent côté Vault
4. tolérer les `NULL`

### Sorties attendues
- connecteur prêt pour balances tiers V2
- aucune casse sur les flux actuels

### Checkpoints
- **CP25** : payload Odoo enrichi
- **CP26** : ingest Vault accepte les nouveaux champs
- **CP27** : re-push sans doublons
- **CP28** : données visibles en base sur un échantillon

### Fichiers pressentis
- addon Odoo connecteur
- handler ingest Vault `account_move_lines`

---

## T65 — Non-régression + doc + recette terrain

### But
Clore proprement le sprint avec preuve de stabilité.

### Travaux attendus
1. vérifier non-régression de la surface 4 blocs
2. vérifier drill rubrique → BG → GL
3. vérifier exports existants
4. vérifier multi-sociétés
5. vérifier comparatifs enrichis
6. vérifier schéma tiers V2 sans casse
7. mettre à jour :
   - `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md`
   - `BACKLOG_PHASE2_LYNKI.md`
   - `RAPPORT_SPRINT_11_LYNKI.md`

### Sorties attendues
- note de non-régression
- liste des reports
- rapport sprint rédigé

### Checkpoints
- **CP29** : surface 4 blocs inchangée
- **CP30** : BG inchangée hors multi-sociétés
- **CP31** : GL inchangé hors périmètre transmis
- **CP32** : exports existants inchangés
- **CP33** : comparatifs enrichis stables
- **CP34** : rapport sprint prêt

---

## 5. Critères de complétude intermédiaires

## Palier A — Consolidation prête
Atteint si :
- **T59** et **T60** sont livrés
- multi-sociétés fonctionne côté Vault et UI
- URL rejoue le périmètre

## Palier B — Comparatifs enrichis prêts
Atteint si :
- **T61** et **T62** sont livrés
- trimestre / semestre fonctionnent
- exports comparatifs existent

## Palier C — Préparation tiers V2 prête
Atteint si :
- **T63** et **T64** sont livrés
- schéma et connecteur sont prêts
- aucune logique de netting complet n'a pollué le sprint

## Palier D — Sprint clôturable
Atteint si :
- **T65** est livré
- non-régression documentée
- rapport sprint prêt

---

## 6. Recette minimale à exécuter

### Multi-sociétés
- charger 1 société
- charger 2 sociétés
- vérifier les agrégats
- vérifier l'URL
- vérifier drill et retour

### Comparatifs enrichis
- tester trimestre
- tester semestre
- tester personnalisé
- vérifier absence de faux zéro N-1

### Exports comparatifs
- télécharger export Bilan comparatif
- télécharger export CR comparatif
- vérifier current / previous / delta

### Tiers V2
- appliquer migration
- pousser données depuis Odoo
- vérifier présence des colonnes en base
- vérifier absence de doublons

### Non-régression
- 4 blocs Synthèse OK
- drill OK
- BG OK
- GL OK
- exports existants OK
- habilitations `/accounting/*` OK

---

## 7. Points de vigilance d'exécution

### 7.1 Multi-sociétés
Ne pas laisser coexister plusieurs représentations du même périmètre.  
`company_ids` doit rester canonique.

### 7.2 Personnalisé
Très utile, mais potentiellement coûteux en UX.  
À reporter si ça menace le cœur du sprint.

### 7.3 Netting V2
Préparer le terrain, pas plus.  
Tout signe de dérive vers une logique métier complète doit être stoppé.

### 7.4 Consolidation
En Sprint 11, la consolidation est additive.  
Ne pas prétendre à une consolidation retraitée.

---

## 8. État attendu en fin de sprint

| Ticket | État cible |
|--------|------------|
| T59 | done |
| T60 | done |
| T61 | done |
| T62 | done |
| T63 | done |
| T64 | done |
| T65 | done |

Si **T64** glisse, le sprint peut rester acceptable seulement si :
- T59 à T62 sont livrés
- T63 est livré
- T65 documente explicitement le report connecteur

---

## 9. Sorties documentaires attendues

- `RAPPORT_SPRINT_11_LYNKI.md`
- mise à jour `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md`
- mise à jour `BACKLOG_PHASE2_LYNKI.md`

---

## 10. Suite logique après Sprint 11

Si Sprint 11 est livré proprement, Sprint 12 pourra se concentrer sur :
- **balances tiers V2** plus fines
- premiers **insights comptables Diva**
- consolidation plus avancée si nécessaire
- premiers jalons de **rejouabilité formelle**
