
# Brief de mission design — Lynki (version designeuse)

**Destinataires** : designeuse / designer produit
**Objectif** : formaliser une proposition visuelle et un système d’interface pour Lynki, sans imposer de lecture du dépôt technique.

**Document compagnon (interne équipe)** : le fichier `SQUELETTE_BRIEF_DESIGN_FRONT_END_LYNKI.md` (brief maître) contient la cartographie détaillée des écrans existants, fichiers et composants. Il est utile à l’équipe produit / dev, mais **n’est pas requis** pour comprendre la mission design.

**Principes produit (annexe active, court)** : [`PRODUCT_DESIGN_SYSTEM_PRINCIPLES_LYNKI_V1.md`](./PRODUCT_DESIGN_SYSTEM_PRINCIPLES_LYNKI_V1.md) — à lire en priorité avec ce brief.

**Design system produit (canon détaillé V0, hors charte visuelle)** : [`DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md`](./DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md) — approfondissement des mêmes notions.

---

## Objectif final de la mission

> L’objectif final de cette mission est de faire émerger une version **visuellement cohérente**, **publiquement montrable** et **réutilisable** de Lynki, capable de rendre **perceptibles** sa profondeur de pilotage, la **fiabilité** de la donnée et la **singularité** du produit — au-delà d’un simple habillage de l’existant.

---

## 0. Règles du jeu de la mission

### Non négociable

* Les **3 personas** (Max, Véréna, Esther) et ce qu’ils attendent de l’outil ;
* La distinction nette entre **Pilotage** et **Synthèse comptable** ;
* Le **périmètre réel des 12 tuiles** du Pilotage, tel qu’énoncé ci-dessous ;
* L’importance de la **fiabilité de la donnée** : fraîcheur, complétude, alertes, états partiels ou indisponibles ;
* Le fait que Lynki doit être **montrable en public** : sobriété premium, sérieux financier, lisibilité, pas de rendu “dashboard marketing générique”.

### Libre à interpréter visuellement

* Hiérarchie visuelle, layout, composition, grilles ;
* Navigation, regroupements, mise en scène des écrans ;
* Système de composants, typographie, couleurs, illustration ;
* Style des graphiques et tableaux, dans le respect des niveaux de lecture métier ;
* Articulation **mobile / desktop** dans le respect des personas.

### Droit de proposition

La designeuse est encouragée à **proposer** des améliorations de hiérarchie, de regroupement, de navigation ou de mise en scène, dès lors qu’elles respectent le périmètre fonctionnel décrit ici et qu’elles renforcent la lisibilité du produit. Les propositions structurantes se valident avec le produit.

### Priorité de conception attendue

1. **Pilotage mobile** pour Max
2. **Pilotage desktop** pour Véréna
3. **Synthèse comptable desktop** pour Esther
4. Détails, états transverses et système de composants

---

## 1. Contexte

Lynki est une application de **pilotage financier**, de **contrôle de gestion** et de **lecture fiable de la situation de l’entreprise**.

Le produit ne doit pas être conçu comme un simple dashboard de KPI, mais comme un **cockpit de lecture décisionnelle**, articulé autour de deux grands régimes d’usage :

* **Pilotage** : voir vite, arbitrer, surveiller, décider ;
* **Synthèse comptable** : comprendre, expliquer, structurer, restituer.

La mission vise une **traduction visuelle cohérente, distincte et publiquement montrable**, en repartant d’une lecture **fraîche** du produit, sans recopier ni subir nos explorations visuelles antérieures.

Le rendu attendu doit donner le sentiment d’un **cockpit financier fiable, lisible et maîtrisé**, capable d’être montré à un dirigeant, un RAF, un partenaire ou un investisseur sans paraître ni expérimental, ni générique.

---

## 2. Personas d’usage

### Max — CEO / Dirigeant

* **Usage** : lecture rapide sur **mobile** ;
* **Finalité** : décision et arbitrage immédiat ;
* **Attente** : voir en quelques secondes l’état global, les tensions, les signaux faibles et les priorités ;
* **Mode** : synthétique, visuel, orienté action.

### Véréna — RAF

* **Usage** : lecture sur **écran de travail** avec priorité desktop ;
* **Finalité** : pilotage financier quotidien ;
* **Attente** : suivre la trésorerie, les encours, les échéances, les écarts et les points de vigilance ;
* **Mode** : rapide mais plus dense, orienté contrôle et engagement.

### Esther — CDG / Contrôle de gestion

* **Usage** : lecture de synthèse comptable et **production de rapports** ;
* **Finalité** : analyse, explication, restitution ;
* **Attente** : accéder à une lecture consolidée, structurée, présentable et justifiable de la situation financière ;
* **Mode** : posé, analytique, orienté synthèse et reporting.

### Traduction produit

**Max voit vite · Véréna pilote · Esther explique.**

---

## 3. Principes structurants du produit

### Deux régimes de lecture

#### Pilotage

**Question directrice** :
**“Que dois-je voir maintenant pour surveiller, arbitrer ou décider ?”**

C’est une vue :

* plus dynamique ;
* plus orientée signal ;
* plus card-centric ;
* plus immédiate ;
* principalement pensée pour Max et Véréna.

#### Synthèse comptable

**Question directrice** :
**“Comment la situation financière se lit-elle de manière structurée, intelligible et restituable ?”**

C’est une vue :

* plus posée ;
* plus analytique ;
* plus hiérarchisée ;
* principalement pensée pour Esther et Véréna.

### En une phrase

Le **Pilotage** aide à **agir**.
La **Synthèse comptable** aide à **comprendre et restituer**.

---

## 4. Principes UX et visuels attendus

### Le design Lynki doit exprimer

* clarté ;
* fiabilité ;
* maîtrise ;
* sobriété premium ;
* lisibilité forte ;
* hiérarchie nette ;
* sérieux financier ;
* gouvernance de la donnée.

### Le design Lynki doit éviter

* le look ERP daté ;
* le dashboard marketing fourre-tout ;
* la surcharge décorative ;
* des cartes interchangeables sans logique métier ;
* une esthétique trop gadget ;
* une esthétique trop froide ou impersonnelle.

---

## 5. Principes transverses de conception

### Multi-niveaux de lecture

Chaque vue doit permettre :

1. une lecture immédiate ;
2. une lecture métier ;
3. un accès au détail analytique.

### Logique devices / personas

* **Max** : mobile-first ;
* **Véréna** : desktop de pilotage ;
* **Esther** : desktop de synthèse / analyse.

### Fiabilité de la donnée

Le design doit rendre perceptibles :

* la fraîcheur de la donnée ;
* la complétude ;
* la confirmation bancaire ;
* la couverture des sources ;
* la confiance / qualité ;
* les anomalies ;
* les données partielles ;
* les données indisponibles.

---

# Pilotage — Les 12 tuiles (périmètre exact)

Le cockpit **Pilotage** comporte **exactement 12 tuiles**, dans l’ordre ci-dessous.

Trois d’entre elles sont des **tuiles maîtresses**, destinées à bénéficier d’une mise en avant visuelle :

* **Trésorerie**
* **Business**
* **Flux net**

Les autres relèvent de priorités secondaires, avec deux niveaux possibles dans le système graphique.

| #  | Nom produit         | Rôle                                                                                                          |
| -- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1  | **Trésorerie**      | Position de trésorerie **à date**, distincte de la période filtrée, avec signaux de cohérence / rapprochement |
| 2  | **Business**        | Volume d’activité sur la **période** (ventes / achats), avec lecture des tensions clients                     |
| 3  | **Flux net**        | Entrées moins sorties de trésorerie sur la période                                                            |
| 4  | **Paiements**       | Paiements constatés sur la période ; rapprochement / volumes                                                  |
| 5  | **BFR**             | Besoin en fonds de roulement **à date**                                                                       |
| 6  | **Encours**         | Encours clients **à date**, avec retard, partenaires, alertes                                                 |
| 7  | **Taxes**           | TVA et fiscalité liée à l’activité sur la période                                                             |
| 8  | **EBE**             | Excédent brut d’exploitation sur la période, ou indicateur de substitution si données incomplètes             |
| 9  | **Notes de crédit** | Avoirs / corrections clients et fournisseurs sur la période                                                   |
| 10 | **Remboursements**  | Remboursements constatés sur la période                                                                       |
| 11 | **Points de vente** | Activité magasins / sessions POS selon le périmètre remonté                                                   |
| 12 | **Z de caisse**     | Emplacement prévu pour les clôtures de caisse ; état actuel : placeholder “bientôt disponible”                |

### En dehors des 12 tuiles

Sans faire partie de la grille des 12 tuiles, l’écran de Pilotage peut intégrer :

* un **en-tête** : société, période, filtres de vue, confiance / intégrité ;
* un **insight** sous la grille ;
* un **bloc décisions** ou gouvernance courte ;
* des messages de **chargement**, de **donnée partielle** ou de **donnée incomplète** ;
* un **pied de page** de confiance.

Ces éléments appartiennent à l’expérience globale, mais **ne s’ajoutent pas** au périmètre des 12 tuiles.

---

## Fiches synthétiques par tuile

### 1 — Trésorerie (tuile maîtresse)

* **Question** : quelle est ma trésorerie à date, et est-elle alignée avec ce que je crois savoir ?
* **Personas** : Max, Véréna
* **Lecture** : instantanée puis détail
* **Représentations** : grand chiffre, évolution, badges d’état
* **États** : normal, alerte, critique, partiel, indisponible, à confirmer

### 2 — Business (tuile maîtresse)

* **Question** : comment l’activité se comporte-t-elle sur la période, et où sont les tensions clients ?
* **Personas** : Max, Véréna
* **Lecture** : synthèse puis graphiques et listes
* **Représentations** : courbes, barres, tableaux, badges de risque ou priorité

### 3 — Flux net (tuile maîtresse)

* **Question** : le cash net sur la période augmente-t-il ou se contracte-t-il ?
* **Personas** : Véréna, Max
* **Lecture** : entrées / sorties / solde net
* **Représentations** : graphique dual, montant net, aide à l’interprétation

### 4 — Paiements

* **Question** : les paiements et rapprochements sur la période sont-ils sous contrôle ?
* **Personas** : Véréna
* **Lecture** : taux, montants, restes à rapprocher, complétude

### 5 — BFR

* **Question** : quelle liquidité est mobilisée dans le cycle d’exploitation ?
* **Personas** : Véréna
* **Lecture** : montant global puis décomposition

### 6 — Encours

* **Question** : qui me doit quoi, avec quel retard ?
* **Personas** : Véréna, Esther
* **Lecture** : totaux puis détail partenaires et évolution

### 7 — Taxes

* **Question** : quelle TVA sur la période : collectée, déductible, solde ?
* **Personas** : Véréna, Esther
* **Lecture** : montants et graphique fiscal

### 8 — EBE

* **Question** : quel excédent brut d’exploitation sur la période, réel ou approché selon les données disponibles ?
* **Personas** : Véréna, Esther
* **Lecture** : résultat synthétique puis détail des composantes et évolution

### 9 — Notes de crédit

* **Question** : quel volume d’avoirs et de corrections sur la période ?
* **Personas** : Véréna
* **Lecture** : séries client / fournisseur

### 10 — Remboursements

* **Question** : quels remboursements ont été constatés sur la période ?
* **Personas** : Véréna
* **Lecture** : séries et montants agrégés

### 11 — Points de vente

* **Question** : comment se comportent les magasins / sessions : ventes, tickets, statuts de clôture ?
* **Personas** : Véréna, Max
* **Lecture** : synthèse par point de vente puis détail si pertinent

### 12 — Z de caisse

* **Question** : accès aux clôtures Z
* **État produit** : fonctionnalité en montée ; le design peut préparer l’écran sans inventer de métrique

---

# Synthèse comptable — Blocs de lecture

La **Synthèse comptable** n’est pas un doublon du Pilotage.
C’est une lecture **structurée**, orientée **explication**, **restitution** et **production de rapports**.

Elle s’adresse principalement à :

* **Esther**
* **Véréna**
* et secondairement au **CODIR**

### Chaîne de lecture visée

**Synthèse → balance / rubriques → grand livre → écriture**

Les blocs suivants décrivent le **fond métier** à couvrir.
La forme visuelle — tableaux, blocs latéraux, graphiques, navigation, drill-down — est **à proposer** dans le respect de cette logique.

### 1. Résumé exécutif

Vue d’ensemble du dossier : périmètre, sociétés, période, source, premiers indicateurs agrégés.

### 2. Compte de résultat synthétique

Rubriques, comparaison de périodes, lecture structurée, exports possibles.

### 3. Bilan / structure patrimoniale

Lecture actif / passif par masses et grands postes, cohérente avec la lecture patrimoniale du dossier.

### 4. Créances, dettes, échéances

Balances âgées clients et fournisseurs, tranches d’âge, tiers, exports.

### 5. Variations et tendances

Graphiques de tendance et de répartition pour compléter les tableaux de synthèse.

### 6. Qualité et confiance

Alignement bancaire, preuves, alertes, documentation, états de confiance.

### 7. Notes et explication

Couche narrative, insight comptable, préparation à la restitution, navigation vers le détail.

---

# Livrables attendus

## 8. Écrans et parcours

### Pour Max

* accueil **Pilotage** sur **mobile** ;
* lecture rapide des signaux ;
* accès simple aux alertes et aux détails essentiels.

### Pour Véréna

* **Pilotage desktop** : grille des 12 tuiles et vues détaillées ;
* synthèse opérationnelle structurée ;
* accès au détail de gestion.

### Pour Esther

* **Synthèse comptable desktop** ;
* vues analytiques et tabulaires ;
* lisibilité adaptée à la préparation de restitutions.

### Écrans complémentaires

* détail d’une tuile structurante ;
* états d’alerte / anomalies / données partielles ;
* vues analytiques tabulaires ;
* système de **statuts de fiabilité** de la donnée.

---

## 8.5 Formats de livrables attendus

* **Maquettes haute fidélité** pour mobile et desktop selon les personas ;
* **Design system** ou mini **UI kit** réutilisable ;
* **Règles de composants** : tuiles, badges, filtres, périodes, tableaux, graphiques ;
* **États principaux** : chargement, vide, erreur, donnée partielle, donnée indisponible ;
* **Fichiers source éditables** : Figma, Sketch ou équivalent, à préciser avec le commanditaire ;
* **Prototype cliquable** souhaitable sur les parcours clés :

  * Pilotage synthétique
  * détail d’une tuile
  * Synthèse comptable
  * drill vers le détail

---

## 9. Composants à formaliser

Liste ouverte, à structurer comme un système cohérent :

* tuiles ;
* badges ;
* statuts ;
* filtres ;
* sélecteurs de période ;
* sélecteurs d’entité ;
* tableaux ;
* mini-graphes ;
* graphes analytiques ;
* empty states ;
* loading states ;
* états de données partielles ;
* états de données indisponibles.

---

## 10. Critères de réussite

La proposition sera jugée sur sa capacité à :

* traduire la **profondeur métier** de Lynki ;
* distinguer clairement **Pilotage** et **Synthèse comptable** ;
* articuler correctement **Max, Véréna et Esther** ;
* proposer un design **montrable en public** et **cohérent produit** ;
* faire sentir la **fiabilité de la donnée** comme un trait fort ;
* fournir une base **exploitable** pour le futur front-end, sans imposer une copie pixel-perfect de l’existant.

---

## Note sur le détail technique

Les références précises — composants logiciels, fichiers, APIs, implémentation actuelle — sont volontairement **hors de ce brief**.

Elles sont consolidées dans le **brief maître interne**, pour l’alignement de l’équipe produit et développement.

La mission design porte ici sur la **formalisation visuelle et ergonomique du produit**, pas sur son implémentation.

---
