# Exécution tickets — Sprint 07 Lynki (Phase 2)

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_07_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** document d’exécution terrain — découpage opératoire du [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0**

**Sources :** [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v1.9** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.8** · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)

---

## 1. Objet

Ce document transforme le **Sprint 07** en **ordre d’attaque exécutable**.

Il ne remplace pas le plan de sprint ; il précise :

- l’ordre concret des tickets ;
- les prérequis de démarrage ;
- les fichiers / zones techniques probables ;
- les points de contrôle intermédiaires ;
- la **Definition of Done terrain** ;
- le critère de clôture du sprint.

---

## 2. Rappel objectif Sprint 07

Après **Gate B pleine et close**, le Sprint 07 vise à :

1. enrichir le **connecteur Odoo** pour remonter `partner_id` / `partner_name` ;
2. rendre ce signal **visible et utile** dans le **grand livre** ;
3. ouvrir les premières restitutions :
   - **`lynki.accounting.balance_sheet`**
   - **`lynki.accounting.income_statement`**
4. renforcer les **habilitations** sur les routes `/accounting/*` ;
5. synchroniser la documentation produit / technique.

---

## 3. Ordre d’attaque recommandé

Ordre d’exécution recommandé, pour limiter les blocages :

```text
T37 → T38 → T39 → T40 → T41 → T42
```

### Pourquoi cet ordre

* **T37** fournit la donnée partenaire à la source.
* **T38** exploite cette donnée dans le GL déjà existant.
* **T39 / T40** ouvrent les nouvelles restitutions comptables.
* **T41** durcit l’accès une fois les surfaces disponibles.
* **T42** clôture et aligne la documentation.

### Règle de pilotage

* **T39 et T40** peuvent se chevaucher si le socle d’agrégation Vault est mutualisé.
* **T39 / T40** ne doivent **pas attendre inutilement T37 / T38** si l’agrégation Bilan / CR n’a pas besoin des partenaires pour un premier incrément (cf. [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) — capitaliser sur Gate B sans couplage artificiel).
* **T41** ne doit pas partir trop tôt si les routes `/accounting/*` concernées ne sont pas encore stabilisées.
* **T42** se fait **à la fin**, sauf mise à jour minimale continue si nécessaire.

---

## 4. Vue synthétique des tickets

| Ticket  | Intitulé                                                | Priorité        | Dépendance réelle   | Sortie attendue                                               |
| ------- | ------------------------------------------------------- | --------------- | ------------------- | ------------------------------------------------------------- |
| **T37** | Connecteur Odoo — `partner_id` / `partner_name`         | Haute           | Gate B close        | Données partenaires présentes dans `account_move_lines` Vault |
| **T38** | GL — exploitation partenaire côté Vault / Linky / UI    | Haute           | T37                 | Filtre / affichage partenaire opérationnel                    |
| **T39** | `lynki.accounting.balance_sheet` — premier incrément    | Haute           | Vault + référentiel | Première restitution Bilan disponible                         |
| **T40** | `lynki.accounting.income_statement` — premier incrément | Haute           | T39 ou parallèle    | Première restitution Compte de résultat disponible            |
| **T41** | Habilitations fines `/accounting/*`                     | Moyenne / haute | T39–T40 stabilisés  | Accès cohérents Admin / Controller / Manager                  |
| **T42** | Doc / ALIGNEMENT / backlog / rapport                    | Haute           | T37–T41             | Clôture documentaire Sprint 07                                |

---

## 5. Pré-check avant démarrage

Avant de coder, vérifier :

| Contrôle                 | Attendu                                               |
| ------------------------ | ----------------------------------------------------- |
| Gate B                   | **Pleine et close** dans les docs de référence        |
| Référentiel comptable    | Version lisible dans l’en-tête du fichier             |
| Routes GL existantes     | `general_ledger` et export GL déjà stables            |
| Connecteur Odoo          | point d’entrée `account_move_lines_push.py` identifié |
| Habilitations existantes | `/admin/*` déjà protégées, modèle rôles réutilisable  |

**Si un de ces points n’est pas vrai :** le noter immédiatement dans le journal sprint avant d’ouvrir les tickets.

---

## 6. Détail opératoire par ticket

---

### T37 — Connecteur Odoo : pousser `partner_id` / `partner_name` vers Vault

**But**
Enrichir l’alimentation `account_move_lines` côté Vault pour exploiter réellement le partenaire dans le GL.

**Entrées**

* connecteur Odoo Sprint 04/06 existant ;
* table Vault `account_move_lines` déjà étendue avec `partner_id`, `partner_name` ;
* flux de push déjà opérationnel.

**Sorties**

* `partner_id` et `partner_name` transmis quand disponibles ;
* upsert idempotent inchangé ;
* aucune régression sur les pushes existants.

**Zones probables**

* `units/odoo/custom-addons/dorevia_vault_connector/models/account_move_lines_push.py`
* éventuels serializers / payload builders du connecteur
* logs / cron liés au push comptable

**Checklist exécution**

* [ ] Identifier la source Odoo exacte de `partner_id`
* [ ] Ajouter `partner_name` dans le payload envoyé au Vault
* [ ] Vérifier le comportement si partenaire absent (`NULL` toléré)
* [ ] Tester un push manuel sur un petit périmètre
* [ ] Vérifier l’upsert côté Vault sans duplication

**Points de contrôle**

* **CP1** : payload envoyé contient `partner_id` / `partner_name`
* **CP2** : le Vault stocke correctement les colonnes
* **CP3** : re-push idempotent, aucun doublon

**DoD terrain**

* au moins un échantillon réel remonte `partner_id` / `partner_name` jusqu’au Vault ;
* aucun incident sur les pushes existants ;
* résultat consigné pour T42.

---

### T38 — GL : exploitation partenaire côté Vault / Linky / UI

**But**
Rendre le partenaire utile dans la restitution GL : affichage, filtre, export cohérents.

**Entrées**

* T37 terminé ;
* colonnes Vault alimentées ;
* GL route / page déjà livrée.

**Sorties**

* `partner_name` visible dans l’UI quand présent ;
* filtre partenaire exploitable côté API ;
* export GL cohérent avec le filtre.

**Zones probables**

* `sources/vault/internal/storage/general_ledger.go`
* `sources/vault/internal/handlers/accounting_general_ledger.go`
* `sources/vault/internal/handlers/accounting_general_ledger_export.go`
* `units/dorevia-linky/app/api/accounting/general-ledger/route.ts`
* `units/dorevia-linky/app/api/accounting/general-ledger/export/route.ts`
* `units/dorevia-linky/app/accounting/gl/[account_code]/GeneralLedgerPageClient.tsx`

**Checklist exécution**

* [ ] Vérifier que le filtre `partner_id` retourne bien des lignes filtrées
* [ ] Ajouter / finaliser le contrôle UI partenaire dans `FilterBar`
* [ ] Afficher `partner_name` proprement dans le tableau GL
* [ ] Vérifier l’export GL avec filtre partenaire
* [ ] Tester le cas partenaire absent

**Points de contrôle**

* **CP4** : filtrage API partenaire effectif
* **CP5** : affichage UI cohérent
* **CP6** : export GL respecte le filtre partenaire

**DoD terrain**

* utilisateur peut filtrer ou lire le partenaire dans le GL ;
* pas de régression journal / pagination / export ;
* comportement `NULL` propre et non bloquant.

---

### T39 — `lynki.accounting.balance_sheet` : premier incrément

**But**
Livrer un premier **Bilan** exploitable dans la Synthèse comptable, honnête sur son périmètre, aligné avec le référentiel.

**Entrées**

* référentiel comptable ;
* dictionnaire des restitutions ;
* socle Vault / Linky stabilisé ;
* Gate B close.

**Sorties**

* endpoint Vault bilan ;
* route Linky dédiée ;
* premier bloc UI Synthèse pour le bilan ;
* `restitution_id = lynki.accounting.balance_sheet`.

**Zones probables**

* `sources/vault/internal/storage/...` (nouveau module bilan)
* `sources/vault/internal/handlers/accounting_balance_sheet.go`
* `sources/vault/internal/server/replay.go`
* `units/dorevia-linky/app/api/accounting/balance-sheet/route.ts`
* `units/dorevia-linky/components/AccountingSummaryView.tsx`
* composant dédié éventuel `BalanceSheetBlock.tsx`

**Checklist exécution**

* [ ] Définir contrat minimal bilan
* [ ] Aligner rubriques sur `lynki.rubric.*`
* [ ] Exposer `referentiel_version`
* [ ] Implémenter état chargement / vide / erreur
* [ ] Afficher un bloc Synthèse lisible, non trompeur

**Points de contrôle**

* **CP7** : `restitution_id` exact
* **CP8** : `referentiel_version` présent
* **CP9** : `502` si Vault indisponible en strict
* **CP10** : UI affiche un premier incrément clair

**DoD terrain**

* un premier Bilan est accessible depuis Lynki ;
* source = Vault uniquement ;
* périmètre / limites documentés si incomplet.

---

### T40 — `lynki.accounting.income_statement` : premier incrément

**But**
Livrer le premier **Compte de résultat** sur la même discipline que le Bilan.

**Entrées**

* T39 ou socle parallèle si mutualisable ;
* référentiel ;
* conventions de contrat déjà fixées pour le bilan.

**Sorties**

* endpoint Vault compte de résultat ;
* route Linky dédiée ;
* bloc UI Synthèse ;
* `restitution_id = lynki.accounting.income_statement`.

**Zones probables**

* `sources/vault/internal/storage/...`
* `sources/vault/internal/handlers/accounting_income_statement.go`
* `units/dorevia-linky/app/api/accounting/income-statement/route.ts`
* composant UI dédié

**Checklist exécution**

* [ ] Définir contrat minimal CR
* [ ] Exposer rubriques cohérentes avec le référentiel
* [ ] Ajouter `referentiel_version`
* [ ] Vérifier cohérence avec états d’écran Synthèse
* [ ] Valider la lecture métier minimale

**Points de contrôle**

* **CP11** : `restitution_id` exact
* **CP12** : `referentiel_version` présent
* **CP13** : source Vault uniquement
* **CP14** : bloc UI cohérent avec la Synthèse existante

**DoD terrain**

* premier Compte de résultat visible et exploitable ;
* cohérence produit avec le Bilan ;
* aucune ambiguïté sur le périmètre.

---

### T41 — Habilitations fines sur `/accounting/*`

**But**
Étendre la logique de rôles au périmètre comptable, pas seulement `/admin/*`.

**Entrées**

* T32 Sprint 06 ;
* routes comptables désormais plus riches ;
* matrice de rôle minimale Admin / Controller / Manager.

**Sorties**

* politique claire sur `/accounting/*` ;
* accès lecture / export / drill conformes au rôle ;
* documentation courte de la matrice.

**Zones probables**

* `units/dorevia-linky/middleware.ts`
* `units/dorevia-linky/app/lib/auth-roles.ts`
* guards éventuels côté pages / APIs comptables

**Matrice cible minimale proposée**

* **Admin** : tout
* **Controller** : BG / GL / Bilan / CR + exports
* **Manager** : lecture Synthèse, pas d’export comptable avancé

**Checklist exécution**

* [ ] Formaliser la matrice avant codage
* [ ] Protéger `/accounting/*` selon le rôle
* [ ] Vérifier que le cockpit standard n’est pas cassé
* [ ] Vérifier le refus d’export pour Manager
* [ ] Documenter la règle

**Points de contrôle**

* **CP15** : Admin accès complet
* **CP16** : Controller accès comptable attendu
* **CP17** : Manager lecture limitée
* **CP18** : pas de régression sur `/admin/*`

**DoD terrain**

* routes `/accounting/*` couvertes ;
* comportement cohérent pour les 3 rôles ;
* matrice documentée dans T42.

---

### T42 — Documentation / alignement / rapport sprint

**But**
Clore proprement le sprint dans la chaîne documentaire.

**Entrées**

* T37 à T41 terminés ou explicitement arbitrés.

**Sorties**

* `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` mis à jour ;
* `BACKLOG_PHASE2_LYNKI.md` mis à jour ;
* `RAPPORT_SPRINT_07_LYNKI.md` rédigé ;
* état Gates C / D actualisé.

**Checklist exécution**

* [ ] Mettre à jour l’alignement
* [ ] Mettre à jour le backlog
* [ ] Rédiger le rapport Sprint 07
* [ ] Reporter clairement ce qui est livré / reporté
* [ ] Mettre à jour la cible des gates

**Points de contrôle**

* **CP19** : rapport cohérent avec le code
* **CP20** : backlog aligné
* **CP21** : alignement CDC / implémentation à jour

**DoD terrain**

* aucune divergence entre doc, backlog et dépôt ;
* lecture claire pour ouvrir Sprint 08.

---

## 7. Points de contrôle globaux du sprint

| CP   | Critère                             | Ticket |
| ---- | ----------------------------------- | ------ |
| CP1  | payload Odoo enrichi partenaire     | T37    |
| CP2  | stockage Vault correct              | T37    |
| CP3  | upsert idempotent                   | T37    |
| CP4  | filtre partenaire API effectif      | T38    |
| CP5  | affichage partenaire UI             | T38    |
| CP6  | export GL compatible partenaire     | T38    |
| CP7  | `restitution_id` bilan exact        | T39    |
| CP8  | `referentiel_version` bilan présent | T39    |
| CP9  | strict mode respecté bilan          | T39    |
| CP10 | bloc bilan lisible                  | T39    |
| CP11 | `restitution_id` CR exact           | T40    |
| CP12 | `referentiel_version` CR présent    | T40    |
| CP13 | source Vault CR                     | T40    |
| CP14 | bloc CR lisible                     | T40    |
| CP15 | Admin OK                            | T41    |
| CP16 | Controller OK                       | T41    |
| CP17 | Manager limité                      | T41    |
| CP18 | non-régression `/admin/*`           | T41    |
| CP19 | rapport cohérent                    | T42    |
| CP20 | backlog à jour                      | T42    |
| CP21 | alignement à jour                   | T42    |

---

## 8. Critère de clôture du sprint

Le sprint est considéré **clôturable** si :

* **T37** et **T38** sont livrés ;
* **au moins un premier incrément** de **T39** et **T40** est livré ;
* **T41** protège effectivement `/accounting/*` selon la matrice minimale ;
* **T42** synchronise la documentation.

### Variante acceptable

Si **T40** glisse légèrement mais que :

* **T39** est solide,
* **T41** est livré,
* **T42** documente le report proprement,

alors le sprint peut être clôturé avec un **report explicite** du CR vers Sprint 08.

---

## 9. Risques terrain

| Risque                              | Mitigation                          |
| ----------------------------------- | ----------------------------------- |
| `partner_name` peu alimenté en Odoo | tolérance `NULL`, message clair     |
| Bilan / CR trop ambitieux           | premier incrément seulement         |
| Habilitations trop complexes        | rester sur 3 rôles fixes            |
| Régression GL existant              | tests de non-régression avant merge |
| Divergence doc / code               | T42 obligatoire avant clôture       |

---

## 10. Sortie attendue

À la fin du Sprint 07, on doit avoir :

* un connecteur Odoo enrichi partenaire ;
* un GL plus utile métier ;
* un premier **Bilan** ;
* un premier **Compte de résultat** ;
* des habilitations cohérentes sur `/accounting/*` ;
* un rapport sprint permettant d’ouvrir Sprint 08 proprement.

---

## 11. Préparation du rapport Sprint 07

Le rapport devra répondre clairement à ces questions :

1. `partner_id` / `partner_name` remontent-ils bien jusqu’au Vault ?
2. Le GL exploite-t-il réellement le partenaire ?
3. Le Bilan est-il disponible et sous quel périmètre ?
4. Le Compte de résultat est-il disponible et sous quel périmètre ?
5. Les rôles protègent-ils correctement `/accounting/*` ?
6. Gate C et Gate D ont-elles été renforcées ?

---

## 12. Suite logique après Sprint 07

Si Sprint 07 est livré proprement, la suite naturelle devient :

* enrichissement du **Bilan / CR** ;
* exports comptables plus riches ;
* durcissement des habilitations ;
* consolidation recette / performance ;
* préparation **Sprint 08**.

---

*Document d’exécution terrain — Sprint 07.*  
*Suite documentaire attendue : `RAPPORT_SPRINT_07_LYNKI.md`.*
