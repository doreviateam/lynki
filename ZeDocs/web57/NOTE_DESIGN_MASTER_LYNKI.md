# Note Design Master — Lynki

**Fichier canonique :** `NOTE_DESIGN_MASTER_LYNKI.md` — même convention de nommage que les autres documents master `ZeDocs/web57` (CDC, dictionnaire, référentiel).

**Version :** 2.7 — mars 2026  
**Révision v2.7 :** spec écran Synthèse **0.5** ; inventaire **v2.6**.  
**Révision v2.6 :** spec écran **0.4** (Vault / amont) ; inventaire **v2.5**.  
**Révision v2.5 :** spec écran **v0.3** ; inventaire **v2.4**.  
**Révision v2.4 :** spec écran **fichier unique** ; inventaire **v2.3**.  
**Révision v2.3 :** spec écran `*_v0.2.md` ; inventaire **v2.2**.  
**Révision v2.2 :** wireframes BF **fichier unique** **[WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md)** ; inventaire **v2.1**.  
**Révision v2.1 :** wireframes `*_v0.2.md` ; spec écran ; inventaire **v2.0**.  
**Révision v2.0 :** wireframes BF ASCII complets (fichier v0.1 puis **v0.2**) ; inventaire **v1.9**.  
**Révision v1.9 :** §11 — wireframes BF ; spec **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** (v0.3).  
**Révision v1.8 :** §11 — spec navigation unique **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)**.  
**Révision v1.7 :** §11 — spec `*_v0.2.md` (remplace v0.1).  
**Révision v1.6 :** §11 — renvoi vers spec navigation v0.1 + inventaire **v1.5**.  
**Révision v1.5 :** §11 — inventaire **v1.4** semi-rempli + **§6.1** décisions provisoires.  
**Révision v1.4 :** §11 — inventaire **v1.3** (§2 layout/shell, §8 sortie **persistance de vue**).  
**Révision v1.3 :** fichier renommé **`NOTE_DESIGN_MASTER_LYNKI.md`** ; §11 — inventaire **v1.2** (liens canoniques, persistance vue **§6** / **§8.1**).  
**Révision v1.2 :** §11 — détail du contenu de l’inventaire **v1.1** (preuves, desktop/mobile, arbitrages §8.1).  
**Révision v1.1 :** lien vers le cadre d’**[inventaire UX existant](INVENTAIRE_UX_EXISTANT_LYNKI.md)** (§11 ; document d’inventaire **v2.6**).  
**Statut :** Note de cadrage UX / design produit
**Objet :** cadrer une évolution de l’interface Lynki en continuité avec l’existant, autour de deux entrées majeures dans le header : **Pilotage** et **Synthèse comptable**.

---

## 1. Intention

Lynki dispose aujourd’hui d’une vue principale centrée sur le **cockpit de pilotage** :

* grille des **12 cards**,
* **bloc insights**,
* filtres de période et de périmètre,
* drill-down par indicateur.

La piste retenue consiste à faire évoluer Lynki non pas par refonte brutale, mais par **extension maîtrisée de la grammaire visuelle existante**.

L’hypothèse de travail est la suivante :

> ajouter dans le header **deux entrées / onglets majeurs** permettant deux lectures d’un même périmètre de gestion :
>
> * **Pilotage**
> * **Synthèse comptable**

Cette note ne fige pas encore l’UX finale. Elle vise d’abord à **aligner l’évolution envisagée avec l’interface existante**.

---

## 2. Principe directeur

La bonne question n’est pas encore :

> « Quelle serait l’UX idéale de Lynki ? »

mais plutôt :

> « Qu’est-ce que l’interface actuelle sait déjà porter sans rupture ? »

Le principe de design retenu est donc le suivant :

* **conserver la grammaire visuelle de Lynki** ;
* **réutiliser le chrome existant** (header, filtres, logique de navigation) ;
* **changer la surface centrale**, pas la logique générale du produit ;
* distinguer clairement **deux lectures majeures** d’un même périmètre :

  * lecture **pilotage**,
  * lecture **synthèse comptable**.

---

## 3. Hypothèse UX structurante

### 3.1 Deux entrées de premier niveau dans le header

Le header Lynki pourrait à terme intégrer deux entrées principales :

* **Pilotage**
* **Synthèse comptable**

Ces deux entrées doivent être comprises comme :

* deux **modes de lecture** d’un même périmètre,
* partageant le même contexte,
* et non comme deux produits séparés.

### 3.2 Sens de chaque entrée

#### Pilotage

Vue actuelle ou très proche de l’actuelle :

* 12 cards,
* bloc insights,
* lecture CODIR / direction / manager,
* drill-down par KPI.

#### Synthèse comptable

Nouvelle vue orientée finance / réconciliation / justification :

* Structure financière / Bilan,
* Performance comptable / Compte de résultat,
* Balance clients,
* Balance fournisseurs,
* Balance générale,
* puis grand livre en drill-down.

---

## 4. Ce qui doit rester identique entre les deux vues

Pour préserver la cohérence produit, les éléments suivants doivent rester partagés entre **Pilotage** et **Synthèse comptable** :

* le **header global**,
* le **tenant** sélectionné,
* la **société** sélectionnée,
* la **période** et l’**année**,
* la **fraîcheur** des données,
* la logique générale de navigation,
* la sensation de **cockpit Lynki**,
* le dark mode, les contrastes et la hiérarchie visuelle existante.

Autrement dit :

> il ne s’agit pas de créer une seconde application dans Lynki, mais une seconde **lecture majeure** dans le même cadre.

---

## 5. Ce qui doit changer entre les deux vues

Les différences doivent porter principalement sur la **surface centrale**.

### 5.1 Dans Pilotage

Le corps principal reste structuré autour de :

* la grille des 12 cards,
* le bloc insights,
* les accès au détail.

### 5.2 Dans Synthèse comptable

Le corps principal devient une lecture plus structurée, moins “dashboard KPI”, davantage orientée :

* bilan,
* compte de résultat,
* balances tiers,
* balance générale,
* justification comptable.

Le **grand livre** n’est pas une entrée de premier niveau du header ; il reste une **vue de détail / preuve**.

---

## 6. Règles de continuité design

### 6.1 Pas de rupture de chrome

La future vue **Synthèse comptable** doit conserver :

* le même header,
* les mêmes filtres globaux,
* la même logique d’état,
* le même vocabulaire de navigation.

### 6.2 Pas de mélange des niveaux de lecture

Il convient d’éviter de mélanger dans une même grille :

* les **12 cards de pilotage**,
* et les **restitutions comptables structurantes**.

Les deux ensembles n’ont pas le même statut visuel ni le même usage métier.

### 6.3 Réutilisation des patterns existants

La vue comptable doit réutiliser autant que possible les patterns déjà présents dans Lynki :

* blocs synthèse,
* vue détail,
* drill-down,
* codes couleur,
* logiques de statuts,
* rythme visuel du cockpit.

---

## 7. Architecture fonctionnelle visée (première hypothèse)

### 7.1 Onglet 1 — Pilotage

Contenu principal :

* 12 cards,
* bloc insights,
* accès aux détails par KPI.

### 7.2 Onglet 2 — Synthèse comptable

Contenu principal :

* **Structure financière / Bilan**,
* **Performance comptable / Compte de résultat**,
* **Balance clients**,
* **Balance fournisseurs**,
* **Balance générale**.

### 7.3 Niveau de détail sous-jacent

Accessible depuis la vue Synthèse comptable :

* drill-down par rubrique,
* drill-down par compte,
* accès à la balance générale filtrée,
* accès au grand livre filtré,
* chaîne de preuve.

Le **grand livre** doit rester un **niveau de preuve**, pas une entrée principale du header.

---

## 8. Ce qui ne doit pas être figé trop tôt

À ce stade, il ne faut pas figer prématurément :

* le nom final exact des onglets,
* le niveau de densité de la vue comptable,
* la hiérarchie précise entre bilan / compte de résultat / balances,
* la forme exacte du drill-down,
* la présence ou non d’un troisième niveau visible.

L’objectif immédiat est d’abord de répondre à la question :

> comment cette évolution s’aligne-t-elle avec l’existant ?

---

## 9. Questions d’alignement à traiter avant figer l’UX

Avant toute spécification détaillée, il conviendra de répondre clairement aux questions suivantes.

### 9.1 Qu’est-ce qui relève déjà du contexte global ?

À confirmer dans l’existant :

* tenant,
* société,
* période,
* année,
* modes de vue,
* fraîcheur,
* navigation centrale.

### 9.2 Qu’est-ce qui peut être réutilisé tel quel ?

À inventorier :

* header,
* filtres,
* composants de blocs,
* mécanismes de drill-down,
* logique de routing / états.

### 9.3 Qu’est-ce qui devra être spécifique à la vue Synthèse comptable ?

À isoler :

* blocs comptables structurants,
* balance générale,
* logique de preuve,
* hiérarchie vers le grand livre.

### 9.4 Qu’est-ce qui doit rester hors du header ?

A priori :

* grand livre,
* vue preuve détaillée,
* administration,
* configuration.

---

## 10. Position produit retenue à ce stade

La position retenue n’est pas :

> « inventer une nouvelle navigation comptable »

mais plutôt :

> « conserver Lynki tel qu’il est dans sa logique principale, et lui ajouter une seconde lecture majeure dans le même cadre ».

C’est cette logique qui justifie la piste :

* **Pilotage**
* **Synthèse comptable**

avec comme exigence prioritaire :

> **s’aligner d’abord sur l’existant avant de figer l’UX cible**.

---

## 11. Prochain pas recommandé

**Réalisé :** inventaire **[INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md)** (v2.6 — lien §9) + spec **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** (v0.3) + wireframes **[WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md)** + spec écran **[SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)** (doc **0.5**).

**Historique — inventaire :** il portait sur le header, filtres globaux, modes de lecture, patterns synthèse/détail, frictions pour une vue « Synthèse comptable ».

**Cadre d’exécution (inventaire) :** grilles de questionnement, colonnes **Preuve**, **Desktop / Mobile**, **Global / local**, **layout vs shell cockpit** (**§2**), persistance **URL vs state** (**§6**, **§8**, **§8.1**), repères code `units/dorevia-linky`, **§8.1** arbitrages restants (green / amber / red list + persistance de vue).

**Suite logique :**

* enrichir les **wireframes** (visuels Figma / captures) ;
* finaliser les arbitrages **§8.1** de l’inventaire (insights en Synthèse, flags, droits) ;
* puis **maquette** / spec d’écran de la vue **Synthèse comptable** (sans casser la continuité produit).

---

## 12. Synthèse

Cette note retient comme piste de design structurante pour Lynki :

* **deux entrées principales dans le header**,
* une vue **Pilotage** correspondant à la lecture actuelle,
* une vue **Synthèse comptable** dédiée aux restitutions comptables structurantes,
* avec un principe fort de **continuité avec l’existant**.

La logique de conception retenue est la suivante :

* ne pas refondre Lynki,
* ne pas mélanger pilotage et comptabilité dans une même grille,
* conserver le même cadre de navigation,
* faire évoluer la surface centrale,
* et réserver la preuve détaillée (grand livre) au drill-down.

En synthèse :

> **Lynki doit pouvoir proposer deux lectures majeures d’un même périmètre — pilotage et synthèse comptable — sans rupture de grammaire visuelle ni de logique de navigation.**
