# Plan Web60 — Linky UI

**Fichier canonique :** `PLAN_WEB60_LINKY_UI.md`
**Version :** 1.1.24 — mars 2026  
**Référence créa figée :** `ZeDocs/web59/stitch_carole_61`
**Espace de travail actif :** `ZeDocs/web60`
**Périmètre prioritaire :** cockpit **Pilotage**
**Statut :** cadrage publié

---

## 1. Objet du lot

Le présent lot **Web60** a pour objectif de stabiliser la nouvelle UI de **Linky** sur le régime **Pilotage**, en prenant comme référence créative figée le dossier `ZeDocs/web59/stitch_carole_61`.

L’enjeu n’est plus d’explorer librement une nouvelle direction visuelle, mais de **fermer un langage produit cohérent, crédible et montrable**, compatible avec l’ambition de Linky comme cockpit financier, probant et orienté décision.

Web60 constitue donc un **lot de convergence** entre :

* la vision produit Linky ;
* la créa canonique issue de `stitch_carole_61` ;
* l’implémentation réelle dans l’application ;
* les arbitrages UI/UX nécessaires pour aboutir à une première version stabilisée.

---

## 2. Intentions du lot

Web60 poursuit quatre intentions principales :

### 2.1 Stabiliser la grammaire visuelle générale

Le cockpit doit cesser d’être un assemblage de bons composants isolés pour devenir un **système lisible et cohérent** :

* hiérarchie visuelle stable ;
* chrome produit unifié ;
* segmentation claire entre zones système, zones métier et zones de confiance ;
* lecture immédiate du niveau d’importance de chaque instrument.

### 2.2 Unifier la grammaire des états

Les états de type **Fiable**, **Certifié**, **Synchro OK**, **Proxy data**, **absence de donnée**, **partiel**, **erreur**, **attente**, **preuve disponible** doivent être traités comme un **langage produit structuré** et non comme des badges ad hoc.

### 2.3 Fermer complètement les cartes maîtresses

Le lot traite en priorité les trois instruments qui portent l’essentiel de la promesse produit :

* **Trésorerie** ;
* **Business** ;
* **Flux net**.

Pour chacun, l’objectif est d’aboutir à une version cockpit cohérente, crédible et présentable, avec ses états et sa microcopy.

### 2.4 Préparer une base propre pour la suite

Web60 doit produire une base suffisamment stable pour permettre ensuite :

* l’alignement des cartes de second rang ;
* la consolidation de la vue **Synthèse comptable** ;
* la recette visuelle plus fine ;
* la production de démonstrations et de supports produit.

---

## 3. Références et règles de travail

### 3.1 Référence créa

La référence de travail côté design est **figée** dans :

`ZeDocs/web59/stitch_carole_61`

Cette référence constitue la base de comparaison prioritaire pour les sujets de :

* structure visuelle ;
* hiérarchie ;
* typographie ;
* densité ;
* rayons ;
* couleurs ;
* composants UI.

### 3.2 Espace de travail actif

Les décisions, arbitrages, plans, backlog, recette et documentation d’implémentation sont désormais produits dans :

`ZeDocs/web60`

### 3.3 Règle de séparation

La référence créa de `web59` n’est pas le chantier actif.
Le chantier actif est `web60`.

Autrement dit :

* `web59` = **source de vérité créa** ;
* `web60` = **espace d’arbitrage, de convergence et de stabilisation**.

### 3.4 Typologie des écarts

Tout écart identifié entre créa et implémentation doit être classé dans une des trois catégories suivantes :

* **Certain** : écart objectivable entre la référence et le code ;
* **Interprétatif** : sujet nécessitant une décision produit/UX ;
* **Assumé** : différence volontaire, explicitement conservée.

Cette distinction vise à éviter les débats esthétiques flous et à rendre le lot pilotable.

---

## 4. Périmètre du lot

### 4.1 Inclus dans Web60

Le lot couvre prioritairement le régime **Pilotage** de Linky, avec :

* structure générale du cockpit desktop ;
* barre supérieure / chrome produit ;
* navigation latérale ;
* barre de pilotage ;
* cartes maîtresses ;
* cartes de second rang si nécessaires à la cohérence d’ensemble ;
* trust bar / barre système basse ;
* doctrine des états UI ;
* microcopy structurante des états visibles.

### 4.2 Priorité fonctionnelle

L’ordre de priorité du lot est le suivant :

1. **Doctrine des états UI** ;
2. **Trésorerie** ;
3. **Business** ;
4. **Flux net** ;
5. cohérence des cartes de second rang ;
6. préparation du pont vers **Synthèse comptable**.

### 4.3 Hors périmètre immédiat

Sauf nécessité forte de cohérence, ne font pas partie du premier noyau Web60 :

* refonte complète de la vue **Synthèse comptable** ;
* redesign mobile exhaustif ;
* travaux backend lourds non indispensables à la fermeture UI ;
* enrichissements visuels exploratoires sans impact clair sur la lisibilité ;
* variations multiples de style non nécessaires à la stabilisation.

### 4.4 Non-objectifs du lot

Web60 n’a pas pour objectif :

* de redéfinir l’identité visuelle globale de Linky ;
* d’ouvrir un chantier backend de fond ;
* de traiter exhaustivement tous les cas mobiles ;
* de produire une version finale de la vue **Synthèse comptable** ;
* de multiplier les variantes créatives sans impact direct sur la fermeture produit.

---

## 5. Diagnostic de départ

À l’ouverture de Web60, la nouvelle UI a déjà franchi un cap important :

* l’écran principal donne une impression de produit réel ;
* la hiérarchie générale est désormais perceptible ;
* la tonalité visuelle est plus mature, sobre et fintech ;
* la barre haute, la sidebar et la trust bar commencent à former un ensemble crédible.

Cependant, plusieurs points restent insuffisamment fermés :

* la **grammaire des états** n’est pas encore normalisée ;
* les cartes maîtresses ne sont pas toutes également habitées ;
* la différenciation entre cartes **B** et **C** reste insuffisante ;
* certains signaux de confiance ou de disponibilité peuvent encore créer de l’ambiguïté ;
* l’ensemble manque encore d’une doctrine d’implémentation explicite pour éviter les réinventions locales.

Web60 répond précisément à cet état intermédiaire : **la base est bonne, mais le système n’est pas encore complètement fermé**.

---

## 6. Doctrine de conduite du lot

### 6.1 Fermer avant d’élargir

Le principe directeur du lot est le suivant :

> ne pas améliorer un peu partout ; terminer un bloc, puis le suivant.

L’avancement doit donc privilégier la fermeture produit plutôt que la créativité diffuse.

### 6.2 Favoriser les décisions réversibles courtes

Lorsqu’un arbitrage n’est pas structurel, il convient de prendre une décision simple, testable et réversible, plutôt que de laisser le sujet en suspension.

### 6.3 Ne pas surcharger les cartes maîtresses

La volonté d’enrichir les cartes majeures ne doit pas conduire à leur faire perdre leur lisibilité cockpit.
Le bon niveau est :

* une lecture principale immédiate ;
* une ou deux lectures secondaires utiles ;
* une impression de profondeur maîtrisée.

### 6.4 La vérité produit prime sur l’effet graphique

Toute décision visuelle doit être arbitrée à l’aune de la lisibilité métier, de la confiance perçue et de la compréhension des états.
L’effet de style ne constitue pas un objectif en soi.

### 6.5 L’implémentation réelle prévaut sur la maquette isolée

La référence créa guide la direction, mais la version finale doit rester compatible avec :

* la réalité des données ;
* les états partiels et asynchrones ;
* les contraintes d’exploitation ;
* la cohérence du système global Linky.

### 6.6 Règle d’arbitrage

En cas de tension entre :

* fidélité à la créa ;
* lisibilité métier ;
* vérité des données ;
* simplicité d’implémentation,

l’ordre de priorité retenu est le suivant :

1. lisibilité métier ;
2. vérité produit et cohérence des états ;
3. cohérence système ;
4. fidélité à la créa ;
5. sophistication visuelle.

### 6.7 Réorganisation du header cockpit (desktop)

> **Référence desktop figée (mars 2026).** La composition **livrée** du bandeau Pilotage (frise + **carte unique** : Vue active et titre Pilotage, coquilles Tenant / Société / Période / Année, cloche + bloc session) est **normée** dans le [**CDCF** §2.12.1](../web61/cdcf.md) et illustrée par [`ZeDocs/web61/references/carole_suggest_01.html`](../web61/references/carole_suggest_01.html). Les sous-sections ci-dessous conservent la **grille de lecture** fonctionnelle (cadre / périmètre / régime) ; en cas d’écart avec le CDCF sur l’interface réelle, **le CDCF et le code déployé font foi** pour la recette lab.

#### Intention

Le header du cockpit ne doit pas juxtaposer sur un même plan visuel :

- l’identité du cockpit ;
- le périmètre métier ;
- le mode de lecture ;
- les actions système ;
- les indicateurs de confiance.

L’objectif est de rétablir une lecture plus calme, plus méthodique et plus cockpit, en séparant clairement :

1. le **cadre global** ;
2. le **périmètre de lecture** ;
3. le **régime de lecture**.

#### Décision de structure (logique) vs matérialisation (desktop)

Le cadrage distingue **trois niveaux de lecture produit** (cadre global, périmètre métier, régime de lecture). **Cette distinction ne vaut pas obligation** de les matérialiser par **trois barres pleine largeur** empilées : une sur-traduction littérale casse l’élégance de la composition et s’éloigne de la **créa canon v5** (Carole).

**Principe de matérialisation :**

> Le cadrage Web60 distingue bien cadre global, périmètre métier et régime de lecture, mais cette distinction ne vaut pas obligation de matérialisation en trois lignes de chrome. Sur desktop, l’**esprit canon** reste : **une ligne de chrome**, puis un **sous-header de page** hiérarchisé.

**Niveau A — ligne de chrome** (seule « barre système »)

Porte :

- la **recherche** ;
- les **actions système** (thème, notifications, réglages, avatar, menu) ;
- le **tenant** **uniquement en mobile** si nécessaire (sur desktop, le tenant peut aller dans le **rail de contexte**).

Exemple cible (desktop) :

```text
[Recherche …]                                           [Thème] [Notif] [Réglages] [Avatar] [Menu]
```

Règle : **aucun** filtre métier, **ni** titre cockpit, **ni** badge de fiabilité global, **ni** arrêté sur cette ligne.

---

**Niveau B — ancre canonique du sous-header (trio figé)**

> **Le header se construit autour du trio « titre + état global + arrêté », qui devient l’ancre canonique du sous-header de page.**

Bloc **à conserver tel quel** (statut **figé**) :

- **une seule ligne**, **groupé**, **non dissocié** ;
- placé **haut de page**, zone **centre-gauche** (aligné au début de la colonne de contenu) ;
- **ne pas** remonter le badge ni l’arrêté dans le chrome, **ni** les redescendre dans le rail de filtres.

Exemple canonique :

```text
Lynki Desktop Cockpit   [100.0 % Fiable]   Arrêté …
```

**Hiérarchie sémantique (ordre de lecture) :**

1. `Lynki Desktop Cockpit` — **ancre principale** ;
2. `100.0 % Fiable` — **état global secondaire** ;
3. `Arrêté …` — **horodatage tertiaire**.

---

**Niveau C — rail de contexte** (sous le trio, **sans** mélanger titre / fiabilité / arrêté)

Une ligne : à **gauche**, tenant (si absent du shell sur desktop) + périmètre métier ; à **droite**, régime de lecture + preuve de la vue.

Exemple cible :

```text
[La Platine]  [SARL La Platine]  [Tout]  [Exercice à date]  [2026]          [Pilotage | Synthèse]   [498 preuves de la vue]
```

*Sur **mobile**, le **tenant** peut rester dans la **ligne de chrome** pour la lisibilité ; sur **desktop**, il peut être porté par ce rail pour coller à la composition cible.*

Règles :

- les contrôles qui qualifient **ce que l’on regarde** restent groupés ;
- le switch de vue est **lisible en premier** dans la zone « régime » ; l’indicateur de preuve reste **secondaire** ;
- **pas** de multiplication de filets horizontaux « trois rails » si cela alourdit la lecture.

#### Règle de hiérarchie

Le header doit pouvoir être lu dans cet ordre :

1. **où suis-je ?**
2. **dans quel état global est le cockpit ?**
3. **sur quel périmètre suis-je en train de lire ?**
4. **dans quel mode de lecture suis-je ?**
5. **quelle est la preuve attachée à la vue affichée ?**

#### Règle de vocabulaire

Les libellés courts retenus pour le header desktop sont :

- `Pilotage`
- `Synthèse`
- `preuves de la vue`
- `Arrêté ...`
- `Fiable`

Le contrôle segmenté du header utilise la forme courte :

```text
[Pilotage | Synthèse]
```

La forme longue `Synthèse comptable` reste possible dans la documentation, les titres de pages ou les zones de contexte, mais pas dans le segment principal du header.

#### Effet recherché

Cette réorganisation vise à produire un header :

- plus respirant ;
- plus hiérarchisé ;
- moins « barre d’outils » ;
- plus cohérent avec une lecture RAF / pilotage ;
- plus compatible avec la doctrine de cockpit de gouvernance.

#### Conséquences d’implémentation

- **chrome** : recherche + actions (+ **tenant en mobile** si pertinent) — **jamais** le trio titre / fiabilité globale / arrêté, **jamais** les filtres métier dans ce bloc ;
- **sous-header** : d’abord le **trio figé** (une ligne, nowrap) ; **en dessous**, le **rail de contexte** (périmètre + à droite Pilotage | Synthèse + preuves) ;
- **ne pas** fragmenter le trio ni y injecter les filtres.

#### Règle canonique courte

> **Une ligne de chrome**, puis **l’ancre canonique** `Lynki Desktop Cockpit` + **fiabilité globale** + **Arrêté** sur **une seule ligne groupée** ; le reste (tenant, société, périodes, vue, preuves) se **compose autour**, sans déplacer le trio.

#### Formulation ultra-courte de décision

- **chrome** = shell (recherche, actions ; tenant optionnel mobile)
- **trio** = titre + % Fiable + Arrêté (**figé**, une ligne)
- **rail** = contexte métier + régime / preuve

---

## 7. Axes de travail

### 7.1 Axe A — Grammaire produit globale

Objectif : stabiliser le cadre général de lecture du cockpit.

Sujets attendus :

* hiérarchie A / B / C ;
* densité du layout ;
* cohérence des espacements ;
* rôle visuel des zones hautes et basses ;
* cohérence de la sidebar ;
* articulation Pilotage / Synthèse comptable.

### 7.2 Axe B — Doctrine des états UI

Objectif : produire un langage unique des états visibles.

Sujets attendus :

* fiabilité ;
* certification ;
* synchronisation ;
* proxy / donnée substitutive ;
* indisponibilité ;
* vide utile ;
* erreur ;
* attente ;
* preuve scellée ;
* fraîcheur / date d’arrêté / couverture.

Livrable attendu : une doctrine exploitable directement en implémentation.

### 7.3 Axe C — Cartes maîtresses

Objectif : fermer de bout en bout les cartes **Trésorerie**, **Business** et **Flux net**.

Pour chacune :

* structure cockpit ;
* hiérarchie interne ;
* matière visuelle ;
* badges/états ;
* microcopy ;
* préparation des détails.

### 7.4 Axe D — Cartes de second rang

Objectif : harmoniser BFR, Encours, Taxes, EBE, puis les cartes de contexte.

Le second rang ne doit pas rivaliser avec les cartes maîtresses, mais il doit être :

* stable ;
* cohérent ;
* immédiatement lisible ;
* correctement hiérarchisé.

### 7.5 Axe E — Recette visuelle et fermeture

Objectif : s’assurer que le cockpit atteint un niveau de finition compatible avec une présentation produit.

Sujets attendus :

* cohérence générale ;
* lisibilité instantanée ;
* homogénéité des badges ;
* ambiguïtés résiduelles ;
* qualité perçue ;
* capacité de démonstration.

---

## 8. Livrables du dossier Web60

Le dossier `ZeDocs/web60` doit au minimum contenir les pièces suivantes :

* `PLAN_WEB60_LINKY_UI.md` — cadrage général du lot ;
* `DOCTRINE_ETATS_UI_LINKY.md` — norme d’états et de badges ;
* `SPEC_CARTES_MAITRESSES_LINKY.md` — spécification des cartes Trésorerie / Business / Flux net ;
* `BACKLOG_WEB60_LINKY.md` — suivi opérationnel (**v1.1.10**, items **W60-xxx**, priorités P0–P3, axes A–E) ;
* `RECETTE_WEB60_LINKY.md` — protocole de validation Pilotage (**v1.1.17** : chrome §5 incl. footer **Dorevia-Vault**, **UI**+hash, rail **DL**, favicon, tenant portail ; doctrine visible, T/B/F, second rang, **R60-001 … R60-010**, personas, sortie « montrable », CR).  
* `EXECUTION_TICKETS_WEB60_LINKY.md` — fermeture par **passes** et tickets **T-W60-xxx** (miroir **W60-xxx**), **R60** ([recette §10](./RECETTE_WEB60_LINKY.md)), **lab public** / **UI hash**, régimes d’usage, DoD persona/viewport, **§13** journal / **§13.1** gabarit **T-W60-001**, **§4.2** clôture **W60-005**, **§5** Passe 2 P0 **W60-101–103** **Fait**, **§14** PR trio **T-W60-001 → T-W60-003** — **v1.1.20**.

**Synthèse versions / statuts** (à aligner sur la [recette §2.2](./RECETTE_WEB60_LINKY.md) lors des publications) :

| Pièce | Fichier | Version | Statut |
|-------|---------|---------|--------|
| Cadre | `PLAN_WEB60_LINKY_UI.md` | v1.1.24 | Cadrage publié (**§6.7** trio figé + rail contexte) |
| Norme | `DOCTRINE_ETATS_UI_LINKY.md` | v1.1.3 | Doctrine publiée (**§5.4** / **§5.4.7** cartes principales, **§9.5** sans `Proxy` en UI Vault) |
| Spec | `SPEC_CARTES_MAITRESSES_LINKY.md` | v1.1.17 | Spécification publiée |
| Arbitrages | `BACKLOG_WEB60_LINKY.md` | v1.1.10 | Backlog ouvert |
| Validation | `RECETTE_WEB60_LINKY.md` | v1.1.17 | Protocole de validation publié (chrome §5 : footer **Dorevia-Vault**, **UI**+hash, rail **DL**, favicon, tenant portail) |
| Fermeture par blocs | `EXECUTION_TICKETS_WEB60_LINKY.md` | v1.1.20 | Guide d’exécution publié (5 passes + recette ; Passe 2 P0 **W60-101–103** **Fait** ; **R60-004** ; lab public / **UI hash** ; §13 journal ; §4.2 **W60-005** ; §14 trame **T-W60-002** ; **Web61 CDCF** §2.12–§2.13 alignés) |

**Build, déploiement et recette — priorité lab :** l’environnement de référence pour valider les changements Web60 est [https://lab.linky.doreviateam.com/?tenant=laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026) (détails dans [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) et [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md)).

Des annexes peuvent être ajoutées si besoin, notamment :

* inventaire des écarts Certain / Interprétatif / Assumé ;
* captures de référence ;
* matrice de composants ;
* journal d’arbitrage.

---

## 9. Critères de succès

Web60 sera considéré comme réussi si les conditions suivantes sont réunies :

### 9.1 Côté produit

* le cockpit **Pilotage** est immédiatement lisible ;
* la hiérarchie des instruments est claire ;
* les trois cartes maîtresses portent réellement la promesse produit ;
* la perception de sérieux, de confiance et de maîtrise est renforcée.

### 9.2 Côté UI/UX

* les états visibles suivent une grammaire unique ;
* les ambiguïtés majeures ont été réduites ;
* la grille est cohérente ;
* la différence entre cartes structurantes et cartes de contexte est nette.

### 9.3 Côté implémentation

* les décisions structurantes sont documentées ;
* le backlog distingue bien les écarts certains, interprétatifs et assumés ;
* les choix retenus peuvent être appliqués de façon répétable sans réinventer chaque composant.

### 9.4 Côté démonstration

* l’écran principal est montrable sans justification lourde ;
* la narration produit est claire ;
* la confiance issue des données et des preuves est visible sans surcharge.

### 9.5 Sortie attendue

La sortie attendue de Web60 est :

* un cockpit **Pilotage** visuellement stabilisé ;
* une doctrine d’états exploitable en implémentation ;
* trois cartes maîtresses réellement fermées ;
* un backlog priorisé pour l’harmonisation du second rang ;
* une base montrable sans requalification permanente du design.

---

## 10. Séquencement recommandé

Le séquencement recommandé pour Web60 est le suivant.

### Phase 1 — Cadrage et doctrine

* ouvrir le plan ;
* figer les règles de lecture ;
* rédiger la doctrine des états ;
* créer le backlog du lot.

### Phase 2 — Fermeture des cartes maîtresses

* Trésorerie ;
* Business ;
* Flux net ;
* états associés ;
* microcopy ;
* harmonisation cockpit.

### Phase 3 — Harmonisation du second rang

* BFR ;
* Encours ;
* Taxes ;
* EBE ;
* cartes de contexte si nécessaire.

### Phase 4 — Recette de fermeture

* revue visuelle globale ;
* revue de cohérence produit ;
* arbitrages finaux ;
* validation de la version montrable.

---

## 11. Décisions déjà actées à l’ouverture

À l’ouverture de Web60, les points suivants sont considérés comme actés :

* la référence créa est `ZeDocs/web59/stitch_carole_61` ;
* le chantier actif est `ZeDocs/web60` ;
* le lot vise une **stabilisation UI**, pas une relance libre de design ;
* le régime **Pilotage** est prioritaire ;
* la doctrine des états est un chantier central ;
* les cartes **Trésorerie / Business / Flux net** sont prioritaires ;
* la progression doit se faire par **fermeture de blocs** et non par dispersion.

---

## 12. Suite immédiate

À l’issue de ce plan, la suite immédiate attendue est :

1. rédaction de `DOCTRINE_ETATS_UI_LINKY.md` — **fait** (v1.1 publiée) ;
2. ouverture de `BACKLOG_WEB60_LINKY.md` — **fait** ;
3. rédaction de `SPEC_CARTES_MAITRESSES_LINKY.md` — **fait** (v1.1 publiée) ;
4. entrée en phase de stabilisation effective du cockpit ;
5. publication du protocole [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.1** — **fait** ;
6. publication du guide [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1** (passes, **T-W60-xxx**) — **fait**.

**Prochain bloc d’implémentation recommandé :** **Passe 1 — États visibles** dans [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) (**T-W60-001 … T-W60-010**).

---

## 13. Formule de cap

La formule de cap du lot Web60 est la suivante :

> **faire passer Linky d’une très bonne direction UI à un cockpit Pilotage canonique, cohérent, crédible et montrable.**

---

## Historique des versions

| Version | Contenu |
|---------|---------|
| **1.0** | Cadrage initial du lot Web60. |
| **1.1** | Ajout des **non-objectifs** (§4.4), de la **règle d’arbitrage** (§6.6) et de la **sortie attendue** (§9.5) ; passage en **cadrage publié**. |
| **1.1.1** | §12 **Suite immédiate** : statut **fait** pour doctrine (v1.1), backlog, spec cartes maîtresses (v1.0). |
| **1.1.2** | §12 : référence spec cartes maîtresses **v1.1** (personas + recette par persona). |
| **1.1.3** | §8 livrables : **RECETTE_WEB60_LINKY.md v1.0** ; backlog **v1.0.1** (champ optionnel Artefact cible). |
| **1.1.4** | Recette **v1.1** (protocole complet, **R60-xxx**) ; backlog **v1.0.2** ; tableau synthèse §8 ; §12 point 5 recette **fait**. |
| **1.1.5** | Livrable **`EXECUTION_TICKETS_WEB60_LINKY.md` v1.0** ; tableau §8 : ligne *Guide chantier*. |
| **1.1.6** | **EXECUTION v1.1** : 5 passes, **T-W60-001…406**, **T-W60-501…506** ; §12 point 6 ; renvoi **Passe 1**. |
| **1.1.7** | Priorité **build / deploy / recette** : **lab** + tenant **`laplatine2026`** ; recette **v1.1.4**, exécution **v1.1.1**. |
| **1.1.8** | **EXECUTION v1.1.2** : régimes d’usage, raccord **R60** §10 recette, DoD persona/viewport. |
| **1.1.9** | **EXECUTION v1.1.3** : **Passe 1 ouverte** ; **§14** trio PR ; backlog **v1.0.7** ; recette **v1.1.6** ; spec **v1.1.7**. |
| **1.1.10** | **EXECUTION v1.1.4** ; **§13.1** brouillon **T-W60-001** ; backlog **v1.0.8**. |
| **1.1.11** | **EXECUTION v1.1.5** ; **§13** vs **§13.1** (journal / gabarit) ; backlog **v1.0.9**. |
| **1.1.12** | Backlog **v1.1.0**, **EXECUTION v1.1.7** ; **W60-001** / **T-W60-001** Fait ; spec **v1.1.10**, recette **v1.1.8** (renvois). |
| **1.1.13** | **EXECUTION v1.1.8** ; **§14** trame PR **T-W60-002** ; tableau §8 aligné (plan, spec, recette, exécution). |
| **1.1.14** | Backlog **v1.1.1**, **EXECUTION v1.1.9**, recette **v1.1.10**, spec **v1.1.11** ; **W60-005** / **T-W60-005** Fait ; tableau §8 aligné. |
| **1.1.15** | Backlog **v1.1.4**, **EXECUTION v1.1.13**, recette **v1.1.11** ; lab public vs deploy local ; **`./scripts/deploy-linky-lab.sh`** ; tableau §8 aligné. |
| **1.1.16** | **EXECUTION v1.1.14**, recette **v1.1.12** ; **`deploy-linky-lab.sh`** rebuild **linky_generic** + **linky_lab_laplatine2026** ; tableau §8 aligné. |
| **1.1.17** | **EXECUTION v1.1.15**, recette **v1.1.13**, backlog **v1.1.6** ; **W60-101** / **W60-102** **En cours** ; tableau §8 aligné. |
| **1.1.18** | **EXECUTION v1.1.16**, recette **v1.1.14**, backlog **v1.1.7**, spec **v1.1.15** ; **W60-103** ; tableau §8 aligné. |
| **1.1.19** | **EXECUTION v1.1.17**, recette **v1.1.15**, backlog **v1.1.8**, spec **v1.1.16**, doctrine **v1.1.2** ; **§5.3.1** contour cockpit ; tableau §8 aligné. |
| **1.1.20** | **EXECUTION v1.1.18**, recette **v1.1.16**, backlog **v1.1.9**, spec **v1.1.17** ; **W60-103** / **T-W60-103** **Fait** ; **R60-004** ; tableau §8 aligné. |
| **1.1.21** | **§6.7** — réorganisation du **header cockpit desktop** : trois lignes (cadre global, périmètre de lecture, régime de lecture) ; vocabulaire court Pilotage / Synthèse ; tableau §8 aligné. |
| **1.1.22** | **§6.7** — précision **matérialisation** : grille logique ≠ trois rails chrome ; **chrome une ligne** + **sous-header de page** (esprit canon Carole) ; conséquences d’implémentation et formulations courtes mises à jour. |
| **1.1.23** | **§6.7** — **trio canonique figé** (titre + % Fiable + Arrêté, une ligne) ; **rail de contexte** sous le trio ; hiérarchie sémantique ; tenant shell mobile / rail desktop. |
| **1.1.24** | **§8** — tableau synthèse et listes livrables alignés **recette v1.1.17** / **exécution v1.1.20** (chrome pied **Dorevia-Vault**, **UI**+hash, **TenantSelector** portail, rail **DL**, favicon ; raccord **Web61** [`cdcf.md`](../web61/cdcf.md) §2.12–§2.13). |

---

**Fin du document**
