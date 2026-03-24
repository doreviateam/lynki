# Exécution tickets — Sprint 12 Lynki (Phase 2)

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_12_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** exécution terrain — dérivé du [PLAN_SPRINT_12_LYNKI.md](PLAN_SPRINT_12_LYNKI.md) **v1.0**

**Références :**  
[PLAN_SPRINT_12_LYNKI.md](PLAN_SPRINT_12_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_11_LYNKI.md](RAPPORT_SPRINT_11_LYNKI.md) **v1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.3** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.4** · [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) **v0.5**

---

## 1. Objet

Ce document transforme le **PLAN_SPRINT_12_LYNKI.md** en **ordre d'exécution concret**, avec :

- séquence réelle de travail ;
- décisions à figer rapidement ;
- checkpoints intermédiaires ;
- critères de clôture ;
- sorties attendues pour le futur **`RAPPORT_SPRINT_12_LYNKI.md`**.

Le Sprint 12 vise deux chantiers visibles et un chantier de stabilisation :

1. **Balances tiers V2** plus fiables ;
2. **Insights comptables Diva v1** dans une logique **template-first, local-first** ;
3. **Bloc insight Synthèse** sobre, explicable, traçable.

---

## 2. Décisions à figer avant de coder

### 2.1 Balances tiers V2 : pas de faux "netting"

Le sprint améliore les balances tiers, mais **ne livre pas** un netting complet.

**Décision Sprint 12 :**
- exclusion des lignes avec `full_reconcile_id` non nul ;
- prise en compte de `date_maturity` si disponible ;
- fallback sur `line_date` sinon ;
- si `matching_number` existe mais sans montant résiduel fiable :
  - la ligne reste dans le périmètre,
  - la limite est explicitement documentée dans `v2_limitations`.

### 2.2 Insight Diva : hiérarchie stricte des couches

L'ordre de génération doit être verrouillé dès le départ.

**Décision Sprint 12 :**
1. **FactsPack comptable canonique**
2. **moteur template-first déterministe**
3. **reformulation Mistral interne optionnelle**
4. **aucune IA externe**

**Règle non négociable :**  
Mistral ne modifie jamais ni les chiffres, ni les signaux, ni la logique métier.

### 2.3 Bloc insight : posture produit sobre

L'encart d'insight ne doit pas transformer la Synthèse en "chat comptable".

**Décision Sprint 12 :**
- bloc court ;
- ton sobre ;
- pas de narration libre ;
- pas de multi-paragraphes longs ;
- pas de surcouche envahissante sur la page.

### 2.4 Observabilité : trace minimale obligatoire

Toute génération d'insight doit être auditable a minima.

**Décision Sprint 12 :**
- `facts_hash` obligatoire ;
- journalisation minimale des métadonnées :
  - tenant
  - société(s)
  - période
  - référentiel
  - horodatage
- pas besoin d'une usine à gaz, mais pas de génération opaque.

### 2.5 Export tiers V2 : alignement strict avec le périmètre V2

L'export doit refléter exactement ce que voit l'utilisateur, sans mélange implicite entre V1 et V2.

**Décision Sprint 12 :**
- colonnes `aging_basis`, `coverage`, `referentiel_version`, `generated_at` obligatoires ;
- si fallback `line_date`, l'export doit le dire ;
- pas de CSV ambigu.

---

## 3. Ordre d'attaque recommandé

Ordre conseillé :

1. **T66** — Vault balances tiers V2  
2. **T67** — Linky/UI balances tiers V2 + exports  
3. **T68** — Diva FactsPack comptable v1  
4. **T69** — Diva insight comptable v1  
5. **T70** — UI encart insight Synthèse  
6. **T71** — non-régression + doc

### Règle d'or

Ne pas démarrer sérieusement **T69** tant que **T68** n'a pas figé un `AccountingFactsPack` stable.  
Ne pas maquiller en "intelligence" ce qui doit rester un **moteur de restitution contrôlé**.

---

## 4. Tickets terrain

## T66 — Vault : balances tiers V2

### But
Améliorer la fiabilité des balances âgées clients / fournisseurs.

### Entrées
- schéma tiers V2 prêt (`date_maturity`, `full_reconcile_id`, `matching_number`)
- aged balances V1 stables

### Formule d'âge

```text
age_days = as_of_date - COALESCE(date_maturity, line_date)
```

### Travaux attendus
1. faire évoluer le calcul de l'ancienneté :
   - `date_maturity` si présente
   - sinon `line_date`
2. exclure les lignes avec `full_reconcile_id` non nul
3. conserver les lignes partiellement ambiguës si `matching_number` existe sans résiduel exploitable
4. enrichir la réponse avec :
   - `aging_basis`
   - `coverage`
   - `complete`
   - `v2_limitations`
5. conserver la rétrocompatibilité de structure générale

### Sorties attendues
- `aged-receivables` V2
- `aged-payables` V2
- transparence explicite sur les limites restantes

### Checkpoints
- **CP1** : `date_maturity` est utilisée quand présente
- **CP2** : fallback `line_date` quand absente
- **CP3** : lignes totalement lettrées exclues
- **CP4** : `matching_number` sans résiduel = limite documentée
- **CP5** : conventions de signe inchangées
- **CP6** : build Vault OK

### Fichiers pressentis
- `aged_balance.go`
- handlers aged receivables / payables
- éventuels types de réponse partagés

---

## T67 — Linky / UI : balances tiers V2 + exports

### But
Rendre visible la V2 côté produit et aligner les exports.

### Entrées
- T66 livré

### Travaux attendus
1. mettre à jour les routes proxy Linky balances tiers
2. mettre à jour le composant `AgedBalanceBlock`
3. afficher :
   - base d'ancienneté (`date_maturity` / fallback)
   - couverture
   - limites V2
4. mettre à jour les exports CSV clients / fournisseurs avec colonnes V2 :
   - `partner_id`, `partner_name`, `not_due`, `range_0_30`, `range_31_60`, `range_61_90`, `range_91_180`, `range_over_180`, `total`
   - `aging_basis`, `as_of_date`, `tenant`, `referentiel_version`, `coverage`, `generated_at`
5. s'assurer qu'aucune ambiguïté V1/V2 ne subsiste côté UI

### Sorties attendues
- bloc balances tiers V2 lisible
- exports V2 cohérents
- badge / légende fiables

### Checkpoints
- **CP7** : bannière de limite V2 visible si nécessaire
- **CP8** : `aging_basis` visible ou lisible
- **CP9** : export clients V2 OK
- **CP10** : export fournisseurs V2 OK
- **CP11** : pas de régression du bloc 3 Synthèse

### Fichiers pressentis
- routes proxy aged receivables / payables
- routes proxy export aged receivables / payables
- `AccountingSummaryView.tsx`

---

## T68 — Diva : AccountingFactsPack comptable v1

### But
Produire un socle de faits canonique avant toute génération textuelle.

### Entrées
- Synthèse complète Sprint 11
- balances tiers V2 en cours ou livrées
- rubriques Bilan / CR comparatives disponibles

### Contenu attendu du FactsPack
- tenant
- `company_ids`
- période
- rubriques Bilan N
- rubriques Bilan N-1
- rubriques CR N
- rubriques CR N-1
- deltas principaux
- balances tiers V2 :
  - agrégats
  - partenaires sensibles
  - tranches sensibles
- qualité / couverture
- `referentiel_version`
- `facts_hash`

### Travaux attendus
1. définir le type `AccountingFactsPack`
2. produire le payload depuis les données disponibles
3. ajouter un hash stable de contexte
4. journaliser minimalement la génération

### Sorties attendues
- FactsPack stable
- hash exploitable
- base saine pour T69

### Checkpoints
- **CP12** : le payload couvre bien Bilan / CR / tiers
- **CP13** : période et périmètre sont exacts
- **CP14** : `facts_hash` stable à entrée égale
- **CP15** : journalisation minimale disponible
- **CP16** : aucun texte généré à cette étape

### Fichiers pressentis
- nouveau fichier Diva facts comptables
- éventuel dossier `facts/`
- éventuelle persistance / logs côté Diva

---

## T69 — Diva : insight comptable v1

### But
Générer un insight comptable court, explicable, contrôlé.

### Entrées
- T68 livré
- moteur template-first figé

### Sortie attendue
```json
{
  "headline": "...",
  "what_i_see": "...",
  "to_check": "...",
  "scope_note": "...",
  "facts_hash": "...",
  "generated_at": "..."
}
```

### Travaux attendus
1. implémenter un moteur de signaux simples :
   - variation forte d'une rubrique
   - tension clients
   - dette fournisseurs concentrée
   - dégradation / amélioration du résultat
   - signal de qualité / couverture
2. transformer ces signaux en texte **template-first**
3. ajouter une reformulation Mistral interne **optionnelle**
4. ne jamais laisser Mistral modifier le fond

### Sorties attendues
- insight comptable v1 stable
- texte utile mais court
- logique local-first respectée

### Checkpoints
- **CP17** : sortie disponible sans Mistral
- **CP18** : sortie disponible avec Mistral interne si activé
- **CP19** : même `facts_hash` entre facts et insight
- **CP20** : aucun chiffre inventé
- **CP21** : texte honnête si couverture partielle
- **CP22** : aucune dépendance IA externe

### Fichiers pressentis
- engine Diva insight comptable
- éventuel prompt local Mistral
- types de sortie insight

---

## T70 — Linky / UI : encart insight Synthèse

### But
Afficher l'insight comptable sans casser la hiérarchie de la page.

### Entrées
- T69 livré

### Travaux attendus
1. intégrer un bloc discret dans la Synthèse
2. afficher :
   - `headline`
   - `what_i_see`
   - `to_check`
   - fraîcheur
   - périmètre
   - `facts_hash`
3. gérer les états :
   - chargement
   - non disponible
   - partiel
   - erreur
   - disponible
4. exposer un refresh / reformulation si prévu

### Sorties attendues
- encart insight stable
- ton sobre
- traçabilité minimale visible

### Checkpoints
- **CP23** : le bloc ne concurrence pas le cockpit KPI
- **CP24** : le bloc ne concurrence pas les 4 blocs comptables
- **CP25** : `facts_hash` ou trace visible
- **CP26** : état partiel bien rendu
- **CP27** : refresh / reformulation fonctionne si exposé

### Fichiers pressentis
- `AccountingSummaryView.tsx`
- éventuelle route proxy insight comptable
- composants UI dédiés

---

## T71 — Non-régression + doc + recette terrain

### But
Clore proprement le sprint avec preuve de stabilité.

### Travaux attendus
1. vérifier balances tiers V2
2. vérifier non-régression de la Synthèse
3. vérifier non-régression BG / GL / exports / comparatifs
4. vérifier cohérence du bloc insight
5. mettre à jour :
   - `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md`
   - `BACKLOG_PHASE2_LYNKI.md`
   - `RAPPORT_SPRINT_12_LYNKI.md`

### Sorties attendues
- note de non-régression
- liste des limites restantes
- rapport sprint rédigé

### Checkpoints
- **CP28** : surface 4 blocs inchangée
- **CP29** : balances tiers V2 stables
- **CP30** : comparatifs inchangés
- **CP31** : multi-sociétés inchangé
- **CP32** : drill rubrique → BG → GL inchangé
- **CP33** : exports existants inchangés
- **CP34** : rapport sprint prêt

---

## 5. Critères de complétude intermédiaires

## Palier A — Tiers V2 prêts
Atteint si :
- **T66** et **T67** sont livrés
- aged balances V2 sont visibles
- exports V2 sont alignés

## Palier B — Diva comptable prêt
Atteint si :
- **T68** et **T69** sont livrés
- FactsPack stable
- insight comptable v1 stable
- aucune dépendance IA externe

## Palier C — UI insight prête
Atteint si :
- **T70** est livré
- encart visible et sobre
- traçabilité minimale affichée

## Palier D — Sprint clôturable
Atteint si :
- **T71** est livré
- non-régression documentée
- rapport sprint prêt

---

## 6. Recette minimale à exécuter

### Balances tiers V2
- tester avec `date_maturity`
- tester sans `date_maturity`
- tester exclusion `full_reconcile_id`
- tester présence `matching_number`
- vérifier `aging_basis`
- vérifier `v2_limitations`

### Insight Diva
- générer un FactsPack
- générer un insight sans Mistral
- générer un insight avec Mistral interne si activé
- vérifier `facts_hash`
- vérifier que le texte reste fidèle aux faits

### UI Synthèse
- afficher bloc insight
- tester état chargé
- tester état non disponible
- tester état partiel
- tester refresh si présent

### Non-régression
- 4 blocs Synthèse OK
- comparatifs OK
- multi-sociétés OK
- drill OK
- BG OK
- GL OK
- exports OK
- habilitations `/accounting/*` OK

---

## 7. Points de vigilance d'exécution

### 7.1 Tiers V2
Ne pas laisser croire que le problème du lettrage est entièrement résolu.
Sprint 12 = amélioration nette, pas version finale.

### 7.2 Diva
L'intelligence n'est pas le but.
La **fiabilité du commentaire** est le but.

### 7.3 Mistral
Mistral est une couche de reformulation, pas une couche métier.

### 7.4 Bloc insight
Le bloc doit rester à sa place :
- utile
- discret
- contrôlé

### 7.5 IA externe
Strictement hors sprint.
Aucune dérive ne doit apparaître dans l'implémentation.

---

## 8. État attendu en fin de sprint

| Ticket | État cible |
|--------|------------|
| T66 | done |
| T67 | done |
| T68 | done |
| T69 | done |
| T70 | done |
| T71 | done |

Si **T70** glisse, le sprint reste acceptable seulement si :
- T66 à T69 sont livrés
- T71 documente explicitement le report UI

Si **T69** glisse, le sprint ne doit pas être présenté comme "insight comptable livré".

---

## 9. Sorties documentaires attendues

- `RAPPORT_SPRINT_12_LYNKI.md`
- mise à jour `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md`
- mise à jour `BACKLOG_PHASE2_LYNKI.md`

---

## 10. Suite logique après Sprint 12

Si Sprint 12 est livré proprement, Sprint 13 pourra se concentrer sur :
- **Balances tiers V2+** avec meilleure prise en compte du résiduel / lettrage partiel
- **Insights comptables Diva** plus riches, toujours local-first
- Premiers travaux de **rapport structuré** généré à partir du FactsPack
- **Consolidation avancée** si besoin métier
- Premiers jalons de **rejouabilité formelle**
