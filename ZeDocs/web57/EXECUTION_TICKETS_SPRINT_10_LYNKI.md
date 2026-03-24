# Exécution tickets — Sprint 10 Lynki (Phase 2)

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_10_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** exécution terrain — dérivé du [PLAN_SPRINT_10_LYNKI.md](PLAN_SPRINT_10_LYNKI.md) **v1.0**

**Références :**  
[PLAN_SPRINT_10_LYNKI.md](PLAN_SPRINT_10_LYNKI.md) · [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (§10.3 SIG optionnels) · [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** (§4.4 comparaisons, §5.3 rejouabilité) · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)

---

## 1. Objet

Ce document transforme le **PLAN_SPRINT_10_LYNKI.md** en **ordre d'exécution concret**, avec :

- séquence réelle de travail ;
- points de décision à figer rapidement ;
- checkpoints intermédiaires ;
- critères de clôture ;
- sorties attendues pour le futur **`RAPPORT_SPRINT_10_LYNKI.md`**.

Le Sprint 10 vise à faire passer la Synthèse comptable de la **lecture structurée** à la **lecture comparative et décisionnelle** :

1. **comparatif N / N-1** sur Bilan et CR rubriques ;
2. **SIG optionnels** dans le bloc CR ;
3. **exports CSV balances tiers** ;
4. **sélecteur de période élargi** si le sprint le permet sans dérive.

---

## 2. Décisions à figer avant de coder

### 2.1 Matching N / N-1 par `rubric_id` uniquement

Le comparatif ne doit **jamais** reposer sur l'ordre des lignes.

**Décision Sprint 10 :**
- la correspondance entre période courante et période N-1 se fait **exclusivement par `rubric_id`**
- si une rubrique est absente en N-1 :
  - la ligne courante reste affichée
  - `amount_previous = null`
  - `delta = null`
  - `delta_percent = null`
  - l'UI affiche `—`

### 2.2 Sémantique de variation : prudence par défaut

La couleur "favorable / défavorable" ne doit pas être appliquée naïvement à toutes les rubriques.

**Décision Sprint 10 :**
- V1 : variation **neutre par défaut**
- coloration explicite seulement sur :
  - `is.net_income`
  - `is.operating_profit`
  - `lynki.rubric.is.gross_margin`
  - `lynki.rubric.is.value_added`
  - `lynki.rubric.is.ebitda`
- pour les autres rubriques : affichage de la variation sans jugement visuel fort

### 2.3 Sélecteur de période : version minimale si tension de sprint

Le sélecteur de période ne doit pas mettre en risque T54–T56.

**Décision Sprint 10 :**
ordre de priorité :
1. exercice courant
2. exercice N-1
3. trimestre
4. semestre
5. personnalisé seulement si le sprint le permet sans glissement

### 2.4 SIG optionnels : affichage conditionnel

Les SIG sont exposés si les rubriques contributives existent.

**Décision Sprint 10 :**
- si toutes les rubriques contributives sont absentes ou nulles : masquer la ligne SIG
- si elles existent avec montant nul réel : afficher `0`

---

## 3. Ordre d'attaque recommandé

Ordre conseillé :

1. **T54** — Vault : comparatif N / N-1  
2. **T55** — Vault : SIG optionnels  
3. **T56** — Linky / UI : comparatif + SIG  
4. **T57** — Exports balances tiers CSV  
5. **T58** — Non-régression + doc

### Règle d'or

Ne pas commencer l'UI comparative tant que les réponses Vault ne sont pas stabilisées sur :
- `compare`
- `lines`
- `lines_previous`
- `period_previous_from`
- `period_previous_to`
- présence cohérente des `rubric_id`
- comportement documenté si N-1 absent

---

## 4. Tickets terrain

## T54 — Vault : comparatif N / N-1

### But
Permettre aux endpoints rubriques Bilan et CR de renvoyer une période courante et une période N-1 comparable.

### Entrées
- endpoints rubriques Sprint 08 livrés
- structure `RubricLine` stable
- conventions de signe déjà validées

### Cibles
- `GET /api/accounting/balance-sheet/rubrics?compare=n-1`
- `GET /api/accounting/income-statement/rubrics?compare=n-1`

### Travaux attendus
1. calculer la période N-1 à partir de `date_debut` / `date_fin`
2. exécuter une seconde agrégation sur N-1
3. renvoyer :
   - `lines` (courant)
   - `lines_previous` (N-1)
   - `period_previous_from`
   - `period_previous_to`
4. documenter le cas absence de données N-1

### Contrat attendu
```json
{
  "detail_level": "rubrics",
  "compare": "n-1",
  "lines": [],
  "lines_previous": [],
  "period_previous_from": "YYYY-MM-DD",
  "period_previous_to": "YYYY-MM-DD",
  "complete_previous": true
}
```

### Sorties attendues

* endpoints Vault compatibles comparatif
* aucun changement de comportement si `compare` absent
* calcul N-1 robuste

### Checkpoints

* **CP1** : Bilan avec `compare=n-1` renvoie `lines` + `lines_previous`
* **CP2** : CR avec `compare=n-1` renvoie `lines` + `lines_previous`
* **CP3** : sans `compare`, payload rétrocompatible
* **CP4** : période N-1 correctement calculée
* **CP5** : `complete_previous=false` si N-1 introuvable

### Fichiers pressentis

* `sources/vault/internal/storage/accounting_rubrics.go`
* `sources/vault/internal/handlers/accounting_rubrics.go`

---

## T55 — Vault : SIG optionnels

### But

Calculer et exposer les premiers SIG optionnels dans le CR.

### Entrées

* rubriques CR Sprint 08 livrées
* T54 amorcé ou terminé

### SIG attendus

* `lynki.rubric.is.gross_margin`
* `lynki.rubric.is.value_added`
* `lynki.rubric.is.ebitda`

### Formules

* **gross_margin** = `revenue - purchases_consumed`
* **value_added** = `revenue + other_operating_income - purchases_consumed - external_services`
* **ebitda** = `revenue + other_operating_income - purchases_consumed - external_services - taxes_and_duties - payroll - other_operating_expenses`

### Travaux attendus

1. étendre `IncomeStatementFormulas`
2. calculer les SIG après agrégation des rubriques sources
3. exposer les lignes SIG dans la réponse CR
4. conserver `operating_profit`, `financial_result`, `exceptional_result`, `net_income`

### Sorties attendues

* réponse CR enrichie
* SIG documentés
* ordre d'affichage stable

### Checkpoints

* **CP6** : `gross_margin` présent si données suffisantes
* **CP7** : `value_added` présent si données suffisantes
* **CP8** : `ebitda` présent si données suffisantes
* **CP9** : `net_income` inchangé
* **CP10** : aucune formule SQL inutile si calcul Go suffit

### Fichiers pressentis

* `sources/vault/internal/storage/accounting_rubrics.go`
* éventuellement fichier handler partagé déjà créé en Sprint 08

---

## T56 — Linky / UI : comparatif + SIG

### But

Rendre visibles le comparatif N / N-1 et les SIG dans la Synthèse.

### Entrées

* T54 livré
* T55 livré
* blocs rubriques Bilan / CR déjà présents

### Travaux attendus

1. étendre `RubricsBlock` :

   * colonne période courante
   * colonne N-1
   * colonne Δ
   * colonne Δ %
2. faire le matching **par `rubric_id`**
3. afficher les SIG dans le bloc CR
4. ajouter un badge "Comparatif N/N-1"
5. ajouter un sélecteur de période minimal dans le shell Synthèse

### Règles UI

* si N-1 absent : afficher `—`
* variation en pourcentage seulement si `amount_previous != 0`
* pas de code couleur agressif par défaut
* SIG en gras / visuellement distincts

### Sorties attendues

* Bilan comparatif
* CR comparatif
* SIG visibles dans CR
* sélecteur de période fonctionnel au minimum sur exercice / N-1

### Checkpoints

* **CP11** : Bilan affiche N, N-1, Δ, Δ %
* **CP12** : CR affiche N, N-1, Δ, Δ %
* **CP13** : matching par `rubric_id` effectif
* **CP14** : SIG visibles si peuplés
* **CP15** : sélecteur de période change les dates effectives
* **CP16** : pas de régression drill rubrique → BG
* **CP17** : pas de régression BG / GL / balances tiers

### Fichiers pressentis

* `units/dorevia-linky/components/AccountingSummaryView.tsx`
* routes proxy rubriques côté Linky
* éventuel état période dans le shell

---

## T57 — Exports balances tiers CSV

### But

Compléter les exports sur le bloc balances tiers.

### Entrées

* balances tiers Sprint 09 livrées

### Cibles

* `GET /api/accounting/aged-receivables/export`
* `GET /api/accounting/aged-payables/export`

### Colonnes minimales

* `partner_id`
* `partner_name`
* `not_due`
* `range_0_30`
* `range_31_60`
* `range_61_90`
* `range_91_180`
* `range_over_180`
* `total`
* `as_of_date`
* `tenant`
* `referentiel_version`
* `coverage`
* `generated_at`

### Travaux attendus

1. handlers export côté Vault
2. routes proxy côté Linky
3. boutons d'export dans `AgedBalanceBlock`
4. cohérence avec la doctrine Vault

### Sorties attendues

* CSV clients exportable
* CSV fournisseurs exportable
* métadonnées présentes

### Checkpoints

* **CP18** : export receivables OK
* **CP19** : export payables OK
* **CP20** : header `X-Lynki-Accounting-Source: vault`
* **CP21** : aucun export de secours trompeur si Vault indisponible

### Fichiers pressentis

* `sources/vault/internal/handlers/accounting_aged_balance_export.go` *(ou équivalent)*
* routes proxy Linky aged export
* `AccountingSummaryView.tsx`

---

## T58 — Non-régression + doc

### But

Clore proprement le sprint avec preuve de stabilité et mise à jour documentaire.

### Travaux attendus

1. vérifier non-régression des 4 blocs de Synthèse
2. vérifier drill rubrique → BG → GL
3. vérifier exports existants BG / GL / rubriques
4. vérifier exports tiers nouveaux
5. mettre à jour :

   * `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md`
   * `BACKLOG_PHASE2_LYNKI.md`
   * `RAPPORT_SPRINT_10_LYNKI.md`

### Sorties attendues

* note de non-régression
* liste des écarts ou reports
* rapport sprint rédigé
* bump documentaire associé

### Checkpoints

* **CP22** : Bilan inchangé hors comparatif
* **CP23** : CR inchangé hors comparatif + SIG
* **CP24** : balances tiers inchangées hors export
* **CP25** : BG inchangée
* **CP26** : GL inchangé
* **CP27** : rapport sprint prêt

---

## 5. Critères de complétude intermédiaires

## Palier A — Vault comparatif prêt

Atteint si :

* **T54** et **T55** sont livrés
* le comparatif N / N-1 répond correctement
* les SIG sont présents côté CR
* aucune régression sans paramètre `compare`

## Palier B — UI décisionnelle prête

Atteint si :

* **T56** est livré
* Bilan et CR affichent N / N-1 / Δ / Δ %
* SIG visibles
* sélecteur de période minimal utilisable

## Palier C — Sprint clôturable

Atteint si :

* **T57** et **T58** sont livrés
* exports tiers OK
* non-régression documentée
* rapport sprint prêt

---

## 6. Recette minimale à exécuter

### Comparatif Bilan

* appeler endpoint Bilan avec `compare=n-1`
* vérifier `lines_previous`
* vérifier matching par `rubric_id`
* vérifier variation affichée
* tester cas N-1 absent

### Comparatif CR

* appeler endpoint CR avec `compare=n-1`
* vérifier colonnes comparatives
* vérifier `gross_margin`, `value_added`, `ebitda`
* vérifier `net_income`

### Sélecteur période

* changer exercice
* changer N-1
* vérifier rechargement cohérent
* vérifier que les blocs restent synchronisés

### Exports tiers

* télécharger CSV clients
* télécharger CSV fournisseurs
* vérifier colonnes et source Vault

### Non-régression

* drill rubrique → BG OK
* BG OK
* GL OK
* exports BG / GL / rubriques OK
* balances tiers UI OK

---

## 7. Points de vigilance d'exécution

### 7.1 N-1 absent

Ne jamais transformer une absence de données N-1 en zéro silencieux.
Toujours préférer `—` et un statut explicite.

### 7.2 Matching des lignes

Pas de matching par ordre visuel.
Toujours matcher par `rubric_id`.

### 7.3 SIG

Un SIG faux est pire qu'un SIG absent.
Si les rubriques sources sont inexploitables, masquer.

### 7.4 Sélecteur de période

Ne pas le laisser dériver vers un mini-framework de calendrier.
Version minimale d'abord.

---

## 8. État attendu en fin de sprint

| Ticket | État cible |
| ------ | ---------- |
| T54    | done       |
| T55    | done       |
| T56    | done       |
| T57    | done       |
| T58    | done       |

Si **T57** glisse, le sprint reste acceptable uniquement si :

* T54 à T56 sont livrés
* T58 documente explicitement le report export tiers

---

## 9. Sorties documentaires attendues

* `RAPPORT_SPRINT_10_LYNKI.md`
* mise à jour `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md`
* mise à jour `BACKLOG_PHASE2_LYNKI.md`

---

## 10. Suite logique après Sprint 10

Si Sprint 10 est livré proprement, Sprint 11 pourra se concentrer sur :

* consolidation **multi-sociétés**
* comparatifs plus riches
* **netting tiers V2**
* premières décisions sur **insights comptables Diva**
* approche plus formelle de la **rejouabilité**
