# Tickets d'exécution — Sprint 16 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_16_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Référence plan :** [PLAN_SPRINT_16_LYNKI.md](PLAN_SPRINT_16_LYNKI.md) **v1.1**  
**Référence métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) **v0.2**  
**Sprint précédent :** [RAPPORT_SPRINT_15_LYNKI.md](RAPPORT_SPRINT_15_LYNKI.md) **v1.1**  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)

**Séquence d'exécution :** **T88 + T89 + T90** en parallèle → **T91** *(uniquement si validé métier)* → **T92**

---

## T88 — Linky — 4 KPI cards Synthèse

**Objectif :** ajouter en tête de la vue **Synthèse comptable** une bande de **4 cartes KPI** donnant une **lecture haute** cohérente avec les agrégations existantes, sans créer de logique métier parallèle.

### Prérequis

- Sprint 15 livré (bloc **État du rapprochement bancaire** en place en tête de Synthèse)
- Plan Sprint 16 v1.1 validé
- Contrat métier v0.2 disponible
- Agrégations existantes accessibles via Vault / proxies Linky
- Arbitrage minimal disponible sur l'hypothèse de contenu des 4 cartes, ou à défaut hypothèse provisoire explicitée

### Règle fondamentale

Les **KPI cards complètent** la lecture haute de la Synthèse ; elles **ne remplacent pas** le bloc **État du rapprochement bancaire**, qui demeure l'**entrée métier de confiance** de la vue.

**Ordre de lecture attendu :**
1. Bloc confiance (Sprint 15)
2. KPI cards Synthèse
3. Restitutions détaillées (BG / Bilan / CdR / Tiers / GL selon l'état de la vue)

Aucune carte ne doit afficher un chiffre **sans** :
- périmètre cohérent,
- source d'agrégation identifiable,
- et état explicite si la donnée est partielle ou ambiguë.

### Travaux attendus

#### 1. Ajouter une bande de 4 cartes en tête de la Synthèse

Créer ou intégrer un composant du type :

- `AccountingSummaryKpiCards.tsx`

Positionnement :
- **sous** le bloc **État du rapprochement bancaire**
- **au-dessus** des restitutions détaillées

#### 2. Alimenter les 4 cartes avec des sources existantes

Chaque carte doit être adossée à une **source d'agrégation existante** ou à une donnée déjà exposée dans la Synthèse / Vault.

Hypothèses de contenu initiales (à confirmer / annoter via T90) :

| Carte | Hypothèse cible |
|------|------------------|
| **Bilan** | Total actif ou indicateur patrimonial clé |
| **Compte de résultat** | Chiffre d'affaires ou résultat |
| **Tiers** | Nombre de tiers actifs ou encours clé |
| **Grand livre** | Nombre d'écritures / transactions sur la période |

#### 3. Contrat minimal par carte

Avant ou pendant l'implémentation, chaque carte doit avoir :

- **un intitulé**
- **une définition courte en une phrase**
- **une source d'agrégation**
- **un comportement si donnée absente / partielle**

Exemple attendu :

- **Bilan** — "Total actif sur le périmètre filtré" — source : agrégation X — état : `Partiel` si rubriques incomplètes

#### 4. Gérer les états métier des cartes

Chaque carte doit pouvoir rendre au minimum :

- **OK**
- **Partiel**
- **Indisponible**

Le rendu d'état peut être :
- badge discret,
- sous-ligne,
- ou mention intégrée

Mais il ne doit pas laisser penser qu'une valeur est absolue si la source est partielle.

#### 5. Respecter le responsive

- Desktop : 4 cartes sur une ligne si l'espace le permet
- Tablette : 2 × 2 acceptable
- Mobile : pile verticale acceptable
- Pas de chevauchement ni compression abusive

#### 6. Référence / source visible

Chaque carte doit permettre d'identifier sa source :
- soit via une ligne `Réf. ...`
- soit via une info secondaire uniforme
- soit via un pattern commun de source/état

### Checkpoint

- [ ] 4 cartes KPI visibles en Synthèse
- [ ] Le bloc rapprochement reste **au-dessus** et n'est pas écrasé visuellement
- [ ] Chaque carte a un intitulé, une définition courte et une source d'agrégation
- [ ] Les valeurs sont cohérentes avec les agrégations existantes
- [ ] États `OK / Partiel / Indisponible` rendus si nécessaire
- [ ] Responsive correct (desktop / tablette / mobile)
- [ ] Build Linky OK

### Fichiers concernés

- `units/dorevia-linky/components/AccountingSummaryView.tsx`
- `units/dorevia-linky/components/AccountingSummaryKpiCards.tsx` — **nouveau** *(ou équivalent)*
- éventuels composants KPI / cards existants à factoriser
- routes API existantes si adaptation mineure nécessaire

---

## T89 — Linky — breadcrumb drill-down réel

**Objectif :** rendre visible le parcours de navigation comptable sous forme de **breadcrumb réel**, aligné sur l'URL, l'état applicatif et le drill-down existant.

### Prérequis

- Navigation Pilotage / Synthèse stable
- Drill-down BG → GL existant
- Routage et état de vue connus dans Linky

### Règle fondamentale

Le breadcrumb ne doit **pas** être une décoration de contexte statique.  
Il doit refléter un **état réel de navigation**, c'est-à-dire :
- ce que l'utilisateur voit,
- ce qu'il peut remonter,
- et ce qui est réellement représenté dans l'URL / l'état du composant.

### Travaux attendus

#### 1. Ajouter un breadcrumb visible sur les écrans concernés

Exemples de niveaux :
- `Synthèse`
- `Synthèse > Balance générale`
- `Synthèse > Balance générale > Grand livre`

Le rendu peut rester sobre en Sprint 16.

#### 2. Connecter le breadcrumb à l'état réel

Le breadcrumb doit dériver :
- de l'URL,
- ou de l'état de drill-down existant,
- ou d'une combinaison des deux si c'est déjà le pattern applicatif

Aucun niveau ne doit être affiché s'il n'est pas réellement actif.

#### 3. Permettre la remontée de navigation

Chaque segment pertinent doit permettre de revenir à l'état précédent :
- vers la Synthèse
- vers la Balance
- vers le Grand livre si actif

#### 4. Accessibilité

- segments focusables si cliquables
- libellés compréhensibles
- séparation visuelle lisible
- pas de duplication trompeuse avec d'autres titres de page

### Checkpoint

- [ ] Breadcrumb visible sur les niveaux concernés
- [ ] Le breadcrumb reflète l'état réel de navigation
- [ ] Les segments permettent une remontée cohérente
- [ ] Pas de faux niveau affiché
- [ ] Accessibilité correcte
- [ ] Build Linky OK

### Fichiers concernés

- `units/dorevia-linky/components/...` *(breadcrumb / header local de page)*
- `units/dorevia-linky/components/AccountingSummaryView.tsx`
- éventuels hooks d'état / navigation existants

---

## T90 — MOA / produit — atelier Esther + mise à jour contrat §4.1 / ordre des blocs

**Objectif :** produire l'**arbitrage métier minimal requis** pour livrer une lecture haute crédible de la Synthèse, sans attendre encore un gel complet du contrat v0.3.

### Prérequis

- Contrat métier v0.2 existant
- Capture ou démonstration de la Synthèse actuelle
- Hypothèses de contenu des 4 cartes préparées

### Règle fondamentale

Ce ticket n'est **pas** un bonus documentaire.  
C'est une **condition de livraison crédible** du Sprint 16.

### Travaux attendus

#### 1. Tenir un atelier MOA ciblé

Sujet minimal :
- §4.1 du contrat : source canonique du %, base de calcul, états, seuils de prudence
- validation / ajustement des 4 cartes KPI
- hiérarchie de lecture des blocs :
  - bloc confiance
  - KPI cards
  - BG / Bilan / CdR / Tiers / GL
- confirmation que le breadcrumb correspond bien à la logique de lecture attendue

#### 2. Mettre à jour le contrat métier

Mettre à jour `CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md` avec au minimum :
- annotations §4.1
- arbitrages obtenus
- décisions provisoires explicites si gel incomplet
- ordre de lecture des blocs si validé

#### 3. Tracer les hypothèses non tranchées

Si l'atelier ne permet pas de tout figer :
- noter ce qui reste ouvert
- documenter la décision provisoire utilisée en Sprint 16
- éviter toute ambiguïté silencieuse

### Checkpoint

- [ ] Atelier MOA tenu ou retour MOA formalisé
- [ ] §4.1 enrichi ou annoté
- [ ] Hypothèses des 4 cartes confirmées ou ajustées
- [ ] Ordre de lecture des blocs explicité
- [ ] Décisions provisoires documentées si nécessaire

### Fichiers concernés

- `ZeDocs/.../CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md`
- éventuelle note d'atelier / annexe si nécessaire

---

## T91 — Linky — premier graphique optionnel

**Objectif :** livrer **un premier graphique** uniquement si la série, le libellé et l'usage métier sont suffisamment clairs pour éviter un rendu décoratif.

### Prérequis

- T90 suffisamment avancé
- Série disponible et stable
- Validation métier explicite du chart à livrer

### Règle fondamentale

**Aucun chart décoratif** ne doit être livré en Sprint 16.

L'absence de chart en Sprint 16 **n'est pas un échec** si aucune série n'est jugée assez claire.

### Travaux attendus

#### 1. Choisir un seul chart

Un seul parmi :
- line chart d'évolution sur la période
- donut de répartition

Choix seulement si :
- source connue
- libellé métier clair
- utilité réelle dans la lecture haute

#### 2. Implémenter sobrement

Pas de refonte design system globale.  
Le chart doit :
- être lisible
- respecter le périmètre filtré
- afficher un libellé clair
- éviter l'effet "widget pour faire joli"

#### 3. Prévoir le report explicite si non retenu

Si le chart n'est pas livré :
- le rapport Sprint 16 doit l'indiquer explicitement
- le report vers Sprint 17 doit être assumé comme choix de prudence produit

### Checkpoint

- [ ] Un seul chart livré si validé métier
- [ ] Série, libellé et usage explicités
- [ ] Aucun chart décoratif
- [ ] Si non livré, report explicite documenté
- [ ] Build Linky OK

### Fichiers concernés

- composants charts Linky
- éventuelles routes / séries déjà existantes
- tests visuels / recette si nécessaire

---

## T92 — Transversal — clôture sprint, Gate D, non-régression, rapport

**Objectif :** fermer proprement le Sprint 16, vérifier la non-régression, et documenter le statut de la **Gate D — Lecture haute Synthèse**.

### Prérequis

- T88 à T90 livrés
- T91 livré ou explicitement reporté

### Travaux attendus

#### 1. Builds

- [ ] Build Linky : `npx next build`
- [ ] Autres builds concernés si un composant partagé ou une route a été modifié

#### 2. Recette fonctionnelle

Vérifier :
- bloc confiance toujours correct et visible
- 4 cartes KPI cohérentes
- breadcrumb fonctionnel
- ordre de lecture respecté
- aucun chart décoratif
- responsive correct
- non-régression Synthèse existante

#### 3. Gate D

Le rapport Sprint 16 doit expliciter :
- statut KPI cards
- statut breadcrumb
- statut §4.1 / arbitrages MOA
- statut chart (livré ou reporté)
- conclusion Gate D

#### 4. Mise à jour documentaire

Mettre à jour :
- `RAPPORT_SPRINT_16_LYNKI.md`
- `BACKLOG_PHASE2_LYNKI.md`
- `CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md` si T90 a produit des arbitrages

#### 5. Non-régression

Vérifier que restent inchangés :
- bloc **État du rapprochement bancaire**
- navigation Pilotage / Synthèse
- BG / Bilan / CdR / Tiers / Insight
- exports existants
- DOCX v2
- archivage / rétention FactsPack
- habilitations `/accounting/*`

### Checkpoint

- [ ] Build Linky OK
- [ ] Recette fonctionnelle OK
- [ ] Gate D explicitée dans le rapport
- [ ] Backlog mis à jour
- [ ] Contrat mis à jour si arbitrages obtenus
- [ ] Non-régression validée

### Fichiers concernés

- `ZeDocs/.../RAPPORT_SPRINT_16_LYNKI.md`
- `ZeDocs/.../BACKLOG_PHASE2_LYNKI.md`
- `ZeDocs/.../CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md`

---

## Vigilances spéciales

| Sujet | Point d'attention |
|-------|-------------------|
| **Bloc confiance vs KPI** | Les KPI cards complètent la lecture haute ; elles ne doivent pas affaiblir le rôle du bloc confiance. |
| **Source des KPI** | Réutiliser les agrégations existantes ; pas de double logique métier parallèle. |
| **Breadcrumb** | Refléter un état réel de navigation, pas un décor statique. |
| **Chart optionnel** | L'absence de chart n'est pas un échec si la série métier n'est pas claire. |
| **Prudence produit** | Une lecture sobre et juste vaut mieux qu'un habillage prématuré. |
| **Design system** | Aucune refonte CSS lourde en Sprint 16. |
| **Non-régression** | Le gain de lecture haute ne doit pas dégrader la Synthèse déjà livrée. |

---

## Suite logique

1. **Sprint 17** — charts + hiérarchie de lecture renforcée + placement de l'insight  
2. **Sprint 18** — design system V2 / thème / polish global  
3. **Contrat v0.3** — 4 blocs canoniques complets

---

## Gel documentaire

| Version | Contenu |
|---------|---------|
| **1.0** | Première rédaction alignée sur `PLAN_SPRINT_16_LYNKI.md` v1.1. |
| **1.1** | Cible après relecture ticket par ticket. |

**Exécution mars 2026 :** T88–T90 et T92 réalisés — voir [RAPPORT_SPRINT_16_LYNKI.md](RAPPORT_SPRINT_16_LYNKI.md) v1.0. **T91** (chart) volontairement non livré — report Sprint 17.

---

*Fin des tickets d'exécution Sprint 16.*
