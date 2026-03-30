# Cahier des charges fonctionnel — Lynki

> **Document unique.** Ce fichier concentre le cahier des charges **et** le plan de migration vers la structure cible **V2**. Les sections numérotées **§1 à §7** ci‑dessous restent le **corps normatif** actuel ; le tableau qui suit indique comment elles se reporteront dans la numérotation V2 (vision §1 à traçabilité §15) lors des prochaines itérations.

**Primauté jusqu’à migration validée.** Tant qu’un bloc n’a pas été **migré** et **validé** sous la numérotation cible V2, seule la numérotation actuelle **§1 à §7** est **normative** pour l’exigence produit. Le plan V2 et le tableau de mapping sont des **instruments de conduite** : ils préparent la cible et le pilotage du travail, sans se substituer au corps tant que la bascule n’est pas actée.

**Lecture du fichier (trois strates).**

| Strate | Contenu | Statut |
|--------|---------|--------|
| **A — Plan de migration** | Lots, tableau §1–7 → V2, consolidations, chapitres V2 à créer, notes d’exécution | Conduite documentaire ; **non normatif** pour le périmètre produit couvert par §1–7 |
| **B — Corps normatif** | **§1 à §7** (après le séparateur « Corps normatif ») | **Norme produit** opposable jusqu’à migration validée |
| **C — Notes méthodo** | Précisions dans les notes d’exécution (strate A) et renvois entre sections | Guides de travail, à ne pas confondre avec l’exigence métier du corps |

---

## Plan cible (V2) et migration depuis les §1–7

### Lots de migration (ordre recommandé)

| Lot | Contenu | Action |
|-----|---------|--------|
| **1** | Ossature V2 | Intégrer dans ce document la table des matières V2 complète, puis renuméroter le corps par étapes |
| **2** | Transverse + socle | §4 Doctrine, §7 Grammaire, §3 Header, §5 Pilotage (cibles V2) |
| **3** | Capital existant riche | §8.1 Trésorerie, §11.7 Détail Trésorerie, §12 Synthèse |
| **4** | Trous critiques | §8.2 Business, §8.3 Flux net |
| **5** | Enrichissement | §9 B, §10 C, §13 Nav, §14 UX, §15 Traçabilité, §1 Vision, §6 Référentiel |

### Tableau principal — sections actuelles (§1–7) → cible V2

Valeurs suggérées pour **Statut** : `À faire` · `En cours` · `Migré` · `Vérifié` · `Fusionné` (contenu absorbé ailleurs) · `Obsolète` (abandonné volontairement, avec trace en note).

| Section actuelle (`cdcf.md`) | Cible V2 | Mode | Statut |
|------------------------------|----------|------|--------|
| **§1** Dashboard — 1.1 Objet | §2.1 (objet dashboard) | Migrer | À faire |
| **§1** — 1.2 Positionnement fonctionnel | §2.2, §1.3 (rappel Pilotage / Synthèse) | Migrer + renvoi | À faire |
| **§2** Header global — 2.1 à 2.4 | §3.1 à §3.3 | Migrer | À faire |
| **§2** — 2.5 Logo | §3.2 / §3.3 (composition) | Migrer | À faire |
| **§2** — 2.6 Titre page courante | §3.2 / §13.2 | Migrer + renvoi §13 | À faire |
| **§2** — 2.7 Session | §3.4 | Migrer | À faire |
| **§2** — 2.8 Sélecteurs | §3.3 | Migrer | À faire |
| **§2** — 2.9 Valeurs par défaut | §3.5 | Migrer | À faire |
| **§2** — 2.10 Dépendances / mise à jour contexte | §3.6 | Migrer | À faire |
| **§2** — 2.11 Cohérence | §3.7 | Migrer | À faire |
| **§2** — 2.12.1 Bandeau deux niveaux | §3.8 | Migrer | À faire |
| **§2** — 2.12.2 Wireframes bandeau | §3.8 | Migrer | À faire |
| **§2** — 2.13 Navigation latérale | §3.9 + **§13.1** | Migrer + doublon navigation | À faire |
| **§3** Pilotage — 3.1 à 3.3 | §5.1 / §5.2 | Migrer | À faire |
| **§3** — 3.4 Structure générale | §5.3 | Migrer | À faire |
| **§3** — 3.4.1 Prolongements sous grille | §5.7 | Migrer | À faire |
| **§3** — 3.5 Logique fonctionnelle | §5.4 / §5.6 | Migrer | À faire |
| **§3** — 3.6 Référentiel 12 tuiles | **§6** (chapitre référentiel) + rappel §5.5 | **Splitter** : liste → §6, usage cockpit → §5 | À faire |
| **§3** — 3.7 Principes d’affichage | §5.4 / §5.6 | Migrer | À faire |
| **§3** — 3.8 Comportement attendu | §5.4 + **§13** (extraits continuité) | Migrer + extraire vers §13 | À faire |
| **§3** — 3.9 Questions / 3.10 Hors périmètre | §5.6 / §5.8 | Migrer | À faire |
| **§3** — 3.11 Synthèse positionnement | §5.2 ou §5.9 | Migrer | À faire |
| **§3** — 3.12 Ordre de lecture | §5.4 | Migrer | À faire |
| **§3** — 3.13 Hiérarchie visuelle | §5.5 | Migrer | À faire |
| **§3** — 3.14 Navigation vers détail | **§13** + §5.6 | **Extraire** continuité → §13 | À faire |
| **§3** — 3.15 États UX | §5.8 + **§4** (synthèse transverse) | Migrer + consolider §4 | À faire |
| **§3** — 3.16 Règles confiance | **§4** + rappel §5.9 | **Extraire** → §4 | À faire |
| **§3** — 3.17 Principe directeur | §5.9 + **§14** (extraits UX) | Migrer + extraire §14 | À faire |
| **§3** — 3.18 (+ **3.18.0** cadre 4 régimes) Mode desktop compact / laptop | V2 §5 **paliers d’écran** Pilotage + rappels §3 header / rail | Migrer (famille bureau : grand desktop + compact) | À faire |
| **§3** — 3.19 Mode phone mobile — persona Max | V2 §5 **paliers d’écran** Pilotage + §14 UX mobile + §13 nav | Migrer (régime autonome, ≠ laptop rétréci) | À faire |
| **§3** — 3.20 Mode tablette / iPad | V2 §5 **paliers d’écran** Pilotage + §14 UX tactile + §13 nav | Migrer (palier autonome, entre laptop et phone) | À faire |
| **§4** Synthèse — 4.1 à 4.5 | §12.1 à §12.3 | Migrer | À faire |
| **§4** — 4.6 Blocs (structure) | §12.6 | Migrer | À faire |
| **§4** — 4.7 Principes d’affichage | §12.5 / §12.10 | Migrer | À faire |
| **§4** — 4.8 Comportement | §12.3 / **§13** | Migrer + §13 | À faire |
| **§4** — 4.9 Questions / 4.10 Hors périmètre | §12.7 / §12.10 | Migrer | À faire |
| **§4** — 4.11 Synthèse positionnement | §1.3 + §12.10 | Migrer | À faire |
| **§4** — 4.12 Ordre de lecture | §12.3 | Migrer | À faire |
| **§4** — 4.13 Hiérarchie visuelle | §12.4 / §12.5 | Migrer | À faire |
| **§4** — 4.14 Navigation vers détail | §12.7 + **§13** | Migrer + §13 | À faire |
| **§4** — 4.15 États UX | §12.9 + **§4** V2 transverse | Migrer + §4 | À faire |
| **§4** — 4.16 Confiance | **§4** V2 + §12.9 | **Extraire** → §4 | À faire |
| **§4** — 4.17 Principe directeur | §12.10 + **§14** | Migrer + §14 | À faire |
| **§5** Grammaire tuile — 5.1 à 5.3 | §7.1 | Migrer | À faire |
| **§5** — 5.4 à 5.9 | §7.1 / §7.4 / §7.5 | Migrer | À faire |
| **§5** — 5.10 Hiérarchie interne | §7.2 | Migrer | À faire |
| **§5** — 5.11 / 5.12 | §7.6 (+ **§14**) | Migrer + §14 | À faire |
| **§5** — 5.13 / 5.14 | §7.6 + rappel doctrine §4 | Migrer | À faire |
| **§6** Fiche Trésorerie (tuile) — 6.1 à 6.13 | **§8.1** | Migrer (alléger si doublon §4/§7) | À faire |
| **§7** Détail Trésorerie — 7.1 à 7.5 | **§11.7** ; 7.1 alimente **§11.1–11.6** (socle commun à rédiger) | Migrer + intro commune | À faire |

### Consolidations transverses (plusieurs sources → une cible V2)

#### → V2 §4 — Doctrine transverse (confiance, lisibilité)

| Source (sections actuelles) | Thème |
|-------------------------------|--------|
| §3.15 (états UX pilotage) | Chargement, vide, partiel, erreur |
| §3.16 | Règles UX confiance (pilotage) |
| §4.15 | États UX (synthèse) |
| §4.16 | Règles UX confiance (synthèse) |
| §5.7 | Disponibilité tuile |
| §5.8 | Signal de confiance (grammaire) |
| §6.4.3, §6.4.4 | Honnêteté / non-surinterprétation (Trésorerie → généraliser) |
| §6.7 | Signal confiance (Trésorerie) |
| §6.8 | Variantes d’état tuile |
| §7.3 | États UX par bloc (détail) |

#### → V2 §13 — Navigation et continuité applicative

| Source (sections actuelles) | Thème |
|-------------------------------|--------|
| §2.5 (logo, renvois navigation) | Point d’ancrage app |
| §2.13 | Rail latéral |
| §3.8 | Comportement vue pilotage |
| §3.14 | Navigation cockpit → détail |
| §4.8, §4.14 | Comportement / détail synthèse |
| §5.9 | Accès au détail (tuile) |
| §6.9.4 | Continuité de contexte (Trésorerie) |
| §7.2.1 | Nav et en-tête page détail |

#### → V2 §14 — Règles UX transverses

| Source (sections actuelles) | Thème |
|-------------------------------|--------|
| §2.5.3, §2.7.3 | Règles UX header |
| §3.17 | Principe directeur pilotage (parties « transverses ») |
| §3.18.0 | Cadre **quatre régimes** / **deux familles** (bureau vs tactile) |
| §3.18 | Mode desktop compact / laptop (densité, rail, bandeau, grille A/B/C) |
| §3.19 | Mode phone mobile — persona Max (priorisation, header, contexte, navigation) |
| §3.20 | Mode tablette / iPad (cockpit tactile compact, grille A/B/C, navigation) |
| §4.17 | Idem synthèse |
| §5.12 | Règles UX tuile |
| §6.11 | Règles UX spécifiques Trésorerie → généraliser ce qui est réutilisable |

### Chapitres V2 à créer (peu ou pas de bloc direct dans les §1–7)

| Cible V2 | Contenu attendu |
|----------|-----------------|
| **§1** Vision, promesse, personas, principes | Rédaction neuve (filigrane actuel dans §1–4) |
| **§6** Référentiel 12 instruments | Structurer §3.6 + tableau instrument / classe / rôle / détail |
| **§8.2** Business | Fiche instrument (priorité après §8.1) |
| **§8.3** Flux net | Fiche instrument |
| **§9** Classe B | Paiements, BFR, Encours, Taxes, EBE |
| **§10** Classe C | Version allégée puis densification |
| **§11.1–11.6** | Socle commun des vues détail (avant §11.7+) |
| **§15** Traçabilité | Stitch, primauté CDCF, écarts, backlog, registre |

### Documents dérivés (specs filles)

| Fichier | Instrument | Statut |
|---------|------------|--------|
| [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md) | Vue **Pilotage** (structure, régimes d’écran, grammaire commune, renvois) | Spec générale web61 ; **dérive** du CDCF ; **amont** des specs filles maîtresses |
| [`CADRAGE_VERSION_MOBILE_LYNKI.md`](./CADRAGE_VERSION_MOBILE_LYNKI.md) | **Phone** — cadrage cockpit compact (nav, header, cartes, prolongements) | **Complément** au **§3.19** ; **non normatif** si écart avec le CDCF |
| [`SPEC_CARTES_MAITRESSES_LINKY.md`](../web60/SPEC_CARTES_MAITRESSES_LINKY.md) | **Trésorerie**, **Business**, **Flux net** (Classe **A** du **§3.6**) | Spec d’exécution Web60 ; **dérive** du CDCF (primauté §3.6 en cas d’écart) |
| `SPEC_PILOTAGE_BUSINESS.md` (`web61`) | Business (Classe A) | Brouillon — aligné sur la structure §6 ; à rapprocher de la spec Web60 ci-dessus |
| *à créer* `SPEC_PILOTAGE_FLUX_NET.md` (`web61`) | Flux net (Classe A) | — ; couverture cockpit maîtresse prioritaire via spec Web60 |

### Notes pour l’exécution

1. **Doublons** : après migration vers la doctrine transverse (V2 §4), raccourcir les fiches §8.x en « renvoi §4 » pour les définitions communes.
2. **§3.6** : ne pas dupliquer la liste des 12 tuiles en entier dans §5 et §6 en V2 ; §6 = référentiel normatif, §5 = lecture dans l’écran Pilotage.
3. **Fiche instrument vs vue détaillée** : appliquer la règle **§6.0** du corps normatif ; toute évolution de §6.9 doit rester **alignée** avec §7 (sinon mise à jour CDCF, en priorité la section qui prime pour l’écran — voir §6.0).
4. **Pilotage du tableau** : mettre à jour la colonne **Statut** au fil des lots (éviter les lignes bloquées en « À faire » une fois le travail réellement avancé).

---

**Corps normatif — numérotation actuelle §1 à §7.**

## 1. Dashboard

### 1.1 Objet

Le Dashboard constitue l’espace principal de lecture de Lynki.
Il a pour vocation de fournir une vision structurée de l’entreprise à partir de données fiables, lisibles et actionnables.

Le Dashboard s’organise autour de deux vues complémentaires :

* **Pilotage**
* **Synthèse comptable**

### 1.2 Positionnement fonctionnel

Les deux vues du Dashboard répondent à deux usages distincts :

* **Pilotage** : lire pour décider
* **Synthèse comptable** : lire pour comprendre et justifier

Ces deux vues partagent un même contexte d’affichage, défini et piloté par le **header global**.

---

## 2. Header global

### 2.1 Objet

Le Dashboard est précédé d’un **header global de contexte**.
Ce composant constitue l’organe principal de pilotage de l’affichage. Il permet à l’utilisateur de définir, puis de lire, le périmètre organisationnel et temporel applicable à l’ensemble du Dashboard.

Le header ne relève pas d’un simple habillage visuel.
Il conditionne directement les données visibles dans les vues **Pilotage** et **Synthèse comptable**.

### 2.2 Objectifs

Le header doit permettre de :

* définir le contexte de lecture
* identifier la vue active
* identifier l’utilisateur connecté
* offrir un point de retour rapide vers la vue principale du produit

### 2.3 Composition fonctionnelle

Le header global regroupe quatre familles d’éléments :

* **logo**
* **titre de la page courante**
* **sélecteurs de contexte**
* **session utilisateur**

### 2.4 Règles fonctionnelles du header

Le header doit permettre :

* la sélection du **tenant**
* la sélection d’une **société** appartenant au tenant
* la sélection de la **période** de lecture
* la sélection de l’**année** de référence
* l’affichage du **titre de la page courante**
* l’affichage de l’**identité de l’utilisateur connecté**
* l’accès aux actions de session, dont au minimum **la déconnexion**

### 2.5 Logo

#### 2.5.1 Rôle

Le logo constitue un point de retour rapide vers la vue principale du produit.

#### 2.5.2 Comportement par défaut

Un clic sur le logo ramène l’utilisateur vers :

**Dashboard > Pilotage**

#### 2.5.3 Règle UX

Le logo doit rester identifiable, stable et accessible depuis l’ensemble des vues du Dashboard.

### 2.6 Titre de la page courante

#### 2.6.1 Rôle

Le header doit afficher le **titre de la page courante**.

Ce titre permet à l’utilisateur d’identifier immédiatement la vue active.

#### 2.6.2 Exemples

* **Pilotage**
* **Synthèse comptable**

#### 2.6.3 Distinction fonctionnelle

Le titre de page ne doit pas être confondu avec le contexte de lecture :

* le **contexte** répond à : *sur quoi suis-je en train de lire ?*
* le **titre de page** répond à : *où suis-je dans le produit ?*

### 2.7 Session utilisateur

#### 2.7.1 Rôle

Le header doit afficher l’**avatar de l’utilisateur connecté** ou, à défaut, son **nom**.

#### 2.7.2 Actions minimales

Depuis cet élément, l’utilisateur doit pouvoir accéder à un menu contenant au minimum :

* **Se déconnecter**

#### 2.7.3 Règle UX

L’accès aux actions de session doit être simple, stable et constant.

### 2.8 Sélecteurs de contexte

#### 2.8.1 Logique générale

Le header repose sur une logique de sélection en quatre niveaux :

1. **Tenant**
2. **Société**
3. **Période**
4. **Année**

#### 2.8.2 Tenant

L’utilisateur sélectionne le **tenant actif**.
Ce choix détermine le périmètre principal de travail.

#### 2.8.3 Société

L’utilisateur sélectionne **une société parmi n sociétés appartenant au tenant**.
La société sélectionnée devient l’entité de référence pour l’affichage des données.

#### 2.8.4 Période

L’utilisateur sélectionne la **période de lecture**.
La période correspond au mode de lecture temporelle appliqué au Dashboard.

Exemples :

* **Exercice à date**
* **Mois X**

#### 2.8.5 Année

L’utilisateur sélectionne l’**année de référence**.
L’année permet d’ancrer temporellement la période choisie.

### 2.9 Valeurs par défaut au chargement initial

#### 2.9.1 Vue par défaut

À l’ouverture de Lynki, le Dashboard s’affiche par défaut sur :

**Dashboard > Pilotage**

#### 2.9.2 Initialisation du contexte

Le header est initialisé selon les règles suivantes :

* **Tenant** : dernier tenant actif de l’utilisateur, ou tenant par défaut si aucun contexte précédent n’est disponible
* **Société** : société par défaut associée au tenant actif, ou dernière société consultée dans ce tenant
* **Période** : **Exercice à date**
* **Année** : **année en cours**

#### 2.9.3 Objectif UX

Le chargement initial doit privilégier :

* la continuité d’usage
* la rapidité d’accès à la lecture principale
* la stabilité du contexte
* la limitation des manipulations inutiles

### 2.10 Dépendances et mise à jour du contexte

#### 2.10.1 Principe général

Toute modification d’un paramètre de contexte doit entraîner une mise à jour cohérente des paramètres associés et des données affichées.

#### 2.10.2 Changement de tenant

Lors d’un changement de tenant :

* la liste des sociétés disponibles est recalculée
* la société active est réinitialisée si elle n’appartient pas au nouveau tenant
* la période et l’année conservent leur valeur courante, sauf impossibilité fonctionnelle
* la vue active est rechargée avec le nouveau contexte

#### 2.10.3 Changement de société

Lors d’un changement de société :

* la société sélectionnée devient l’entité de référence
* la période et l’année conservent leur valeur courante
* les données de la vue active sont recalculées

#### 2.10.4 Changement de période

Lors d’un changement de période :

* la fenêtre de lecture temporelle est modifiée
* l’année reste inchangée
* les données de la vue active sont recalculées selon la nouvelle période

#### 2.10.5 Changement d’année

Lors d’un changement d’année :

* la période conserve son type de lecture
* l’ancrage temporel est déplacé
* les données de la vue active sont recalculées en conséquence

### 2.11 Règles de cohérence

Le Dashboard ne doit jamais afficher un état incohérent entre :

* tenant
* société
* période
* année
* vue active

Toute mise à jour du header doit produire un état complet, valide et lisible.

### 2.12 Principe directeur

Toute donnée affichée dans le Dashboard doit être interprétée à partir du contexte défini dans le header.

Le header constitue ainsi la barre maîtresse de contexte commune à l’ensemble du Dashboard.

#### 2.12.1 Bandeau Pilotage — référence desktop (figée)

**Statut (mars 2026).** La composition **desktop** du bandeau **Pilotage** est **figée** comme référence produit : elle sert de **base** pour la recette, les évolutions en finition (espacements, hauteurs, contraste) et les maquettes statiques alignées.

**Desktop compact / laptop.** Pour les largeurs d’écran intermédiaires (fenêtre desktop étroite, ordinateur portable), la **même logique fonctionnelle** (zones gauche / centre / droite, rôles des sélecteurs) s’applique sous une **composition plus dense** : exigences détaillées au **§3.18**.

**Phone mobile.** Sur téléphone, le bandeau **ne** reprend **pas** la composition desktop miniaturisée : régime autonome, priorisation de lecture et contexte adaptés — **§3.19**.

**Tablette / iPad.** Palier tactile intermédiaire : cockpit encore panoramique, recomposition du header et de la grille sans équivaloir au laptop rétréci ni au phone agrandi — **§3.20**.

**Règles produit — pied de page.** L’utilisateur doit pouvoir lire la **version** plateforme et, sur un **segment distinct** (lisible en desktop), une **référence UI** assortie d’un **hash git** rattachant l’écran au déploiement consulté. Le libellé du lien vers le coffre de preuves est **Dorevia-Vault**.

**Règles produit — choix de tenant dans le bandeau.** Lorsque plusieurs espaces sont proposés, le changement de tenant depuis la coquille **Tenant** reste **actionnable et lisible** : aucune liste de choix ne doit être **inaccessible** ou **illusoire** (ex. ouverte mais masquée) du fait du conteneur des coquilles lorsque celui-ci autorise le **défilement horizontal**.

**Alignement technique** (traçabilité recette / implémentation — ne pas substituer aux règles ci-dessus) : bandeau `ReportHeaderContentBody` (mode `cockpitAppBar`) ; maquette [`ZeDocs/web61/references/carole_suggest_01.html`](references/carole_suggest_01.html) ; recette sur [lab.linky — tenant laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026) (conteneur `linky_generic`) ; pied `LinkyFooter`, injection build `NEXT_PUBLIC_LINKY_UI_BUILD_REF` ; libellé coffre depuis `GET /api/tenant-config` → `chrome.footer.vaultLinkLabel`. **Tenant** : `TenantSelector` (liste en portail sur `document.body`, position fixe, recalcul au scroll / resize) pour rester utilisable malgré un ruban de coquilles en `overflow-x-auto`.

**Matérialisation — une carte composée** (sous une **frise** supérieure discrète : bordure basse, fond secondaire, léger flou) :

* **Zone gauche** — étiquette **Vue active** (métadonnée) et titre **Pilotage** : répond à *quelle vue ?* sans surcharger la grille cockpit.
* **Zone centre** — **Tenant**, **Société**, **Période**, **Année** regroupés en **coquilles** visuellement homogènes (contrôles intégrés, pas de double cadre interne / externe).
  * **Desktop** — le **bloc** des quatre coquilles est **centré horizontalement** dans la colonne centrale de la carte (entre le titre **Pilotage** et la zone cloche / session).
  * **Groupement** — **Tenant** et **Société** dans une sous-zone pouvant **défiler horizontalement** si la largeur est contrainte ; le conteneur ne doit **pas** comprimer les coquilles au point de **cacher** le nom de société. **Période** et **Année** forment une sous-zone **fixe** et **contiguë** (même espacement qu’entre les autres coquilles).
  * **Style** — **homogénéité** : **Période** n’est **pas** le seul filtre mis en **couleur d’accent** sur libellé et valeur ; le produit figé aligne **Période** sur **Société** et **Année** (style neutre). L’accent peut rester sur des repères hors filtre (ex. icône **Tenant**).
* **Zone droite** — **notification** (réservée produit ; placeholder tant que non câblée) et **bloc session** compact, associant repère visuel utilisateur, libellé d’espace lisible et identifiant technique secondaire si nécessaire ; calibrage type compromis lisible / crédible sans sur-articulation.

**Sous le bandeau (desktop Pilotage)** — un **espace horizontal de respiration** peut rester **volontairement** entre la carte de contexte et la **grille cockpit**, afin d’accueillir ultérieurement un **fil de navigation** (fil d’Ariane ou équivalent). Tant que ce composant n’est pas branché, cet espace assure la respiration ; son introduction ne doit pas repousser la grille de façon disproportionnée par rapport à la référence §2.12.1.

**Principes** (inchangés sur le fond) :

* Le bandeau **prépare** la lecture du cockpit ; il ne **concurrente** pas les cartes maîtresses.
* Un **signal secondaire** de confiance ou de couverture dans le bandeau n’est admis que s’il reste **subordonné** au bloc contexte ; en **V1 canonique**, ce signal n’occupe pas le bandeau (voir implémentation : flag `COCKPIT_HEADER_SHOW_TRUST_IN_CONTEXT_STRIP`).
* Les ajouts futurs (recherche globale, dernière mise à jour, métadonnées techniques) restent **subordonnés** au même principe.
* Le **thème** clair / sombre reste **hors** bandeau : rail latéral, section **Session** (§2.13), avec **Déconnexion**.

**Lecture sémantique** (deux niveaux de sens, **une** composition visuelle) :

1. **Orientation** — vue active + ancrage session (réparties dans la grille de la carte, pas sur deux barres indépendantes).
2. **Contexte** — tenant, société, période, année.

**Vocabulaire affiché** : le premier sélecteur de contexte porte le libellé **Tenant** (aligné §2.8) ; « Espace » n’est pas retenu comme libellé canonique du filtre.

#### 2.12.2 Schéma et extensions — bandeau (référence)

**Schéma logique — référence desktop figée** (carte unique sous frise) :

```text
┌── frise (bordure basse, fond secondaire) ────────────────────────────────────┐
│ ┌── carte : panel, coins ~20px, bordure, ombre ──────────────────────────────┐ │
│ │ Vue active          │ [ Tenant ][ Société ][ Période ][ Année ] │ 🔔 │user│ │ │
│ │ Pilotage            │     (coquilles / filtres)              │  bloc session │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘
╔════════════════════════════════════════════════════════════════════════════════╗
║▸ Espace réservé sous le bandeau — fil de navigation (Ariane) : option future   ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

**Extensions futures** (hors socle figé ci-dessus ; à valider avant ajout) :

* **B** — Badge **preuves** / confiance dans ou à côté du bloc contexte, **plus discret** que filtres et titre.
* **C** — Recherche discrète, sans dominer titre ni coquilles.
* **D** — **Dernière MAJ** comme note système très faible ; combinaison avec **B** si besoin.

**Ordre d’introduction recommandé** : stabiliser la **référence §2.12.1** → **B** si besoin → **C** → **D**.

*Principe lecture* : gauche = *quelle vue ?* ; centre = *je cadre ma lecture* ; droite = *session / notification* ; dessous = *cockpit*.

### 2.13 Navigation latérale — périmètre initial

La **navigation latérale** (rail gauche) ne doit pas anticiper des modules fonctionnels non spécifiés ni court-circuiter la logique cockpit **Dashboard → Pilotage → tuile → vue de détail**.

À ce stade du produit, les entrées latérales visibles de Lynki se limitent aux familles suivantes.

**Dashboard**

* **Pilotage** — accès à la vue cockpit et à ses vues de détail accessibles depuis les tuiles (ex. détail Trésorerie depuis la tuile Trésorerie, et non depuis un intitulé métier autonome dans le rail).
* **Synthèse comptable** — accès à la vue de restitution comptable décrite au §4.

**Outils**

* **Lexique** — ressources de lecture et vocabulaire pilotage.
* **Aide** — support utilisateur.

**Session**

* **Thème** — bascule clair / sombre (préférence d’affichage locale ; hors bandeau Pilotage, §2.12.1).
* **Déconnexion** — action de fin de session.

**Identité rail et favicon**

* **Marque** — en tête du rail : pastille **DL** (Dorevia Lynki), titre **Lynki**, sous-titre **Cockpit financier**. L’ensemble forme une **zone cliquable** unique qui renvoie au **Pilotage** (route `/` avec conservation du paramètre de requête **`tenant`**). Implémentation : `Sidebar.tsx`.
* **Favicon** — glyphe **DL** sur fond accent ; fichier **`app/icon.png`** (convention Next.js App Router, route **`/icon.png`**).

**Mode desktop compact / laptop** — largeur du rail, densité interne et libellés : **§3.18.3**.

Toute autre entrée latérale (domaines métier type ventes, achats, banque, facturation, etc.) relève d’un **périmètre ultérieur** : elle ne doit pas être exposée tant qu’elle n’est pas décrite et positionnée dans ce cahier des charges, afin d’éviter une promesse produit incompatible avec l’espace de lecture prioritaire du Dashboard.

---

## 3. Vue 1 — Pilotage

### 3.1 Objet

La vue **Pilotage** constitue la vue cockpit de Lynki.
Elle permet au dirigeant et au responsable financier d’apprécier rapidement la situation de l’entreprise et d’identifier les sujets nécessitant une attention immédiate.

### 3.2 Objectifs

La vue Pilotage doit permettre de :

* situer l’entreprise à date
* repérer les tensions, anomalies ou signaux faibles
* offrir une lecture immédiate des grands équilibres
* permettre l’accès à un niveau de détail par instrument

### 3.3 Utilisateurs cibles

* **Max** : lecture rapide, décisionnelle
* **Véréna** : lecture opérationnelle et financière

### 3.4 Structure générale

La page Pilotage se compose de :

* le **header global de contexte**
* une grille de **12 tuiles de pilotage**
* une navigation vers une lecture détaillée
* des marqueurs de fraîcheur, de couverture et de fiabilité

#### 3.4.1 Prolongements sous la grille (cockpit → détail / signaux)

Sous la grille des tuiles maîtresses et secondaires (hiérarchie §3.13), la vue peut inclure des **blocs de prolongement** : liens ou surfaces vers une **vue détail** d’instrument (ex. pont vers le détail Trésorerie, cohérent avec **§7**), et blocs transverses du type **alertes** ou **signaux** contextualisés.

Ces blocs ne se substituent pas aux tuiles ; ils assument la **continuité de lecture** après le premier niveau cockpit. Leur périmètre exact, leur nommage canonique et leur priorité dans le document global peuvent être **affinés par itération produit** : l’implémentation peut légèrement précéder la formalisation complète dans ce CDCF pour autant qu’elle reste alignée sur la doctrine **tuile → détail** et sur les exigences des **§6–7** par instrument.

### 3.5 Logique fonctionnelle

Chaque tuile représente un **instrument de pilotage**.
Une tuile ne doit pas chercher à restituer l’ensemble de l’information disponible. Elle doit fournir un point de lecture immédiatement exploitable.

Chaque tuile doit présenter :

* une information principale
* un contexte de lecture
* un niveau de confiance
* un accès au détail

### 3.6 Référentiel des 12 tuiles

Ce référentiel est **canonique** pour la vue **Pilotage** : toute évolution de la grille cockpit (nom, ordre, regroupement par classe) doit rester alignée sur cette liste ou faire l’objet d’une **décision produit documentée** (mise à jour du présent CDCF).

**Primauté CDCF / dérivation SPEC.** Le présent **§3.6** pose la **loi produit** (inventaire des 12 tuiles, classes **A / B / C**, logique de lecture). Une **spec générale** cockpit — [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md) — en facilite l’application (structure d’écran, régimes, renvois normatifs) **sans** se substituer au CDCF. Le détail d’exécution UI des **tuiles maîtresses** — **Trésorerie**, **Business**, **Flux net** — est développé dans [`SPEC_CARTES_MAITRESSES_LINKY.md`](../web60/SPEC_CARTES_MAITRESSES_LINKY.md) (lot Web60). En cas d’écart sur le fond fonctionnel entre ces specs et le CDCF, **le présent document prime** ; les specs et l’implémentation se mettent en conformité.

**Synthèse — hiérarchie de lecture A / B / C :**

| Classe | Tuiles (n°) | Rôle de lecture sur le cockpit |
|--------|-------------|--------------------------------|
| **A** — Maîtresses | 1 à 3 | **Lecture prioritaire** : situation immédiate, grands équilibres, décision |
| **B** — Intermédiaires | 4 à 8 | **Explication**, **qualification**, **prolongement** de la lecture portée par la classe **A** |
| **C** — Contexte | 9 à 12 | **Contextualisation** : informations périphériques **sans** prendre le dessus sur **A** ni **B** |

La **traduction visuelle** de cette hiérarchie (poids, densité, ordre d’attention) est précisée en **§3.13**.

#### Classe A — Tuiles maîtresses

1. **Trésorerie**
2. **Business**
3. **Flux net**

#### Classe B — Tuiles intermédiaires

4. **Paiements**
5. **BFR**
6. **Encours**
7. **Taxes**
8. **EBE**

#### Classe C — Tuiles de contexte

9. **Notes de crédit**
10. **Remboursements**
11. **Points de vente**
12. **Z de caisse**

### 3.7 Principes d’affichage

Une tuile doit montrer :

* un intitulé clair
* une valeur principale
* un court contexte d’interprétation
* un état de disponibilité
* un signal de confiance ou de fraîcheur

Une tuile ne doit pas se transformer en mini page comptable.

### 3.8 Comportement attendu

Depuis la vue cockpit :

* l’utilisateur lit les 12 tuiles
* il identifie une tuile prioritaire
* il accède à une vue détaillée dédiée
* il peut revenir facilement au cockpit

### 3.9 Questions auxquelles la vue doit répondre

* quelle est ma situation immédiate ?
* où se situent les tensions ?
* où faut-il regarder maintenant ?
* les données sont-elles suffisamment fiables pour décider ?
* sur quel sujet faut-il approfondir ?

### 3.10 Hors périmètre

La vue Pilotage n’est pas :

* une balance comptable
* un tableau exhaustif
* une restitution pour expert-comptable
* une vue analytique complexe

### 3.11 Synthèse de positionnement

**Pilotage = lire pour décider.**

### 3.12 Ordre de lecture

La vue **Pilotage** doit être conçue selon un ordre de lecture simple, rapide et stable.

L’ordre de lecture attendu est le suivant :

1. **header global de contexte**
2. **lecture d’ensemble de la grille cockpit**
3. **identification des tuiles prioritaires**
4. **accès à une vue de détail dédiée**
5. **retour au cockpit**

Cet ordre de lecture doit permettre à l’utilisateur de comprendre rapidement la situation générale avant d’approfondir un sujet particulier.

### 3.13 Hiérarchie visuelle

La vue Pilotage repose sur une hiérarchie visuelle explicite entre les 12 tuiles.

Cette hiérarchie distingue trois niveaux :

#### 3.13.1 Tuiles maîtresses

Les tuiles de **Classe A** constituent les points d’entrée prioritaires de la lecture cockpit :

* Trésorerie
* Business
* Flux net

Elles doivent bénéficier de la plus forte présence visuelle.

#### 3.13.2 Tuiles intermédiaires

Les tuiles de **Classe B** complètent la lecture principale et permettent de préciser ou d’expliquer une situation :

* Paiements
* BFR
* Encours
* Taxes
* EBE

Elles doivent rester visibles et lisibles immédiatement, sans concurrencer les tuiles maîtresses.

#### 3.13.3 Tuiles de contexte

Les tuiles de **Classe C** apportent des informations complémentaires ou périphériques :

* Notes de crédit
* Remboursements
* Points de vente
* Z de caisse

Elles doivent exister dans la composition d’ensemble sans perturber la lecture prioritaire.

### 3.14 Navigation vers le détail

La vue Pilotage doit permettre une navigation fluide entre le cockpit et une vue de détail.

#### 3.14.1 Principe

Chaque tuile cockpit doit pouvoir constituer un point d’entrée vers une **vue détaillée dédiée**.

#### 3.14.2 Comportement attendu

Lorsqu’un utilisateur clique sur une tuile :

* la vue détaillée correspondante s’ouvre
* le contexte défini par le **header global** est conservé
* l’utilisateur peut revenir facilement au cockpit

#### 3.14.3 Règle de continuité

Le passage du cockpit au détail ne doit pas rompre la compréhension du contexte.
L’utilisateur doit toujours pouvoir identifier :

* la vue active
* le sujet détaillé
* le contexte de lecture
* le chemin de retour vers le cockpit

### 3.15 États UX

La vue Pilotage doit prévoir plusieurs états d’interface afin de garantir une lecture robuste et compréhensible, y compris en cas d’information manquante ou indisponible.

#### 3.15.1 État de chargement

Lorsqu’une donnée est en cours de chargement :

* la structure générale de la page doit rester stable
* la grille cockpit doit conserver sa place
* les tuiles doivent signaler un état transitoire de chargement

#### 3.15.2 État vide

Lorsqu’aucune donnée exploitable n’est disponible pour une tuile ou pour un périmètre donné :

* l’absence d’information doit être explicitée
* la tuile doit rester lisible
* l’utilisateur ne doit pas confondre absence de donnée et erreur système

#### 3.15.3 État partiel

Lorsqu’une information n’est disponible que partiellement :

* la tuile doit pouvoir afficher une lecture partielle
* cette lecture doit être accompagnée d’un signal clair sur son niveau de couverture ou de fiabilité

#### 3.15.4 État d’erreur

En cas d’erreur de récupération ou d’incohérence technique :

* la tuile ou la vue concernée doit signaler explicitement le problème
* l’utilisateur doit comprendre qu’il s’agit d’un incident de disponibilité et non d’une valeur métier

### 3.16 Règles UX associées à la confiance

La vue Pilotage doit permettre à l’utilisateur d’évaluer rapidement le degré de confiance qu’il peut accorder à l’information affichée.

Les signaux de confiance doivent notamment permettre d’indiquer :

* la fraîcheur de la donnée
* son niveau de couverture
* son niveau de disponibilité
* son caractère complet ou partiel

Ces signaux doivent rester sobres, lisibles et cohérents avec la logique cockpit.

### 3.17 Principe directeur de la vue Pilotage

La vue Pilotage doit privilégier :

* la rapidité de lecture
* la hiérarchie des priorités
* la stabilité visuelle
* la continuité entre cockpit et détail
* l’honnêteté sur la qualité de l’information

Elle ne doit jamais sacrifier la lisibilité ou la confiance au profit d’une densité d’information excessive.

### 3.18 Mode desktop compact / laptop

#### 3.18.0 Quatre régimes d’écran et deux familles (Pilotage)

La vue **Pilotage** se lit selon **quatre régimes d’écran** distincts : **Desktop**, **Laptop**, **Tablette** et **Phone**. Ces régimes ne constituent **pas** une simple **échelle de réduction continue** du même gabarit : ce sont **quatre compositions** adaptées à des contextes de lecture différents.

* **Famille bureau** — **Desktop** (ample) et **Laptop** (dense) : navigation principale par **rail** ; cockpit **panoramique** ; hiérarchie **A / B / C** tenue sur toute la surface utile. Le **grand desktop** est décrit au **§2.12.1** (bandeau) et comparé au compact au **§3.18.9** ; le corps **§3.18.1 à §3.18.11** détaille surtout le palier **desktop compact / laptop**.
* **Famille tactile** — **Tablette** : **cockpit tactile compact**, encore structuré et panoramique — **§3.20**.
* **Famille tactile** — **Phone** : **cockpit priorisé** (persona **Max**) — **§3.19**.

> **Desktop / Laptop / Tablette / Phone = quatre régimes, deux familles, une même grammaire produit.**

| Régime | Famille | Logique dominante |
|--------|---------|-------------------|
| **Desktop** | Bureau | Cockpit **ample**, bandeau riche |
| **Laptop** | Bureau | Cockpit **dense**, sans « desktop cassé » |
| **Tablette** | Tactile | Cockpit **compact tactile**, recomposition maîtrisée |
| **Phone** | Tactile | Lecture **priorisée** (**A** d’abord) |

**À ne surtout pas casser — Desktop et Laptop.** La **famille bureau** (Desktop ample, Laptop dense) constitue la **référence de crédibilité** du cockpit sur écran large. Les régimes **Tablette** et **Phone** sont **distincts** : ils ne doivent **ni** se substituer **ni** imposer des choix qui fragilisent le **grand desktop** ou le **desktop compact / laptop** (bandeau, rail, grille **A / B / C**, lisibilité des montants). Le Laptop reste un **cockpit tenu**, pas une dégradation non maîtrisée du Desktop — voir **§3.18.8** (invariants et interdits).

#### 3.18.1 Objet

Le mode **desktop compact / laptop** couvre les écrans d’ordinateur portable et les fenêtres desktop **plus étroites**, lorsque la composition **grand desktop** commence à se comprimer **sans** entrer dans les **régimes tablette / phone** — lesquels constituent des **paliers distincts** (voir **§3.18.2** ; **phone** au **§3.19**, **tablette / iPad** au **§3.20**).

Ce mode est un **palier produit dédié** : il ne se réduit pas à une simple mise à l’échelle du grand desktop.

Il doit **préserver** :

* la hiérarchie de lecture **Pilotage** (**§3.6**, **§3.13**) ;
* la logique du cockpit à **12 tuiles** ;
* le rôle du **header** comme maître du contexte (**§2.8**, **§2.12.1**) ;
* l’identité Lynki : sobre, fiable, premium.

Il doit **adapter** :

* la densité et les espacements ;
* la largeur du **rail latéral** (**§2.13**) ;
* la composition du **bandeau Pilotage** ;
* la taille et la respiration des **cartes** cockpit.

#### 3.18.2 Périmètre cible (largeurs)

Plage recommandée pour traiter explicitement ce palier :

* environ **1180 px à 1440 px** de largeur de viewport pour le mode **desktop compact** ;
* **en dessous** : bascule vers des **régimes distincts** (dont le **phone mobile**, **§3.19**, et la **tablette / iPad**, **§3.20**) — **hors** périmètre du présent §3.18 — **sans** continuation linéaire du seul rétrécissement du compact.

#### 3.18.3 Rail latéral

**Largeur** — le rail doit être **plus étroit** qu’en grand desktop, pour libérer la largeur utile du cockpit. Cibles indicatives :

* **grand desktop** : environ **272 px** ;
* **desktop compact / laptop** : environ **224 px à 236 px**.

**Densité interne** — réduire modérément : espacements du bloc identité / logo, paddings verticaux des entrées, espacements entre sections (**Dashboard**, **Outils**, **Session**).

**Libellés** — les libellés du rail **restent visibles** ; on ne bascule **pas** en mode « icône seule » sur ce palier.

**Objectif** — le rail reste **lisible** et **identifiable**, sans consommer une part disproportionnée de la grille cockpit.

#### 3.18.4 Bandeau Pilotage (header cockpit)

**Principe** — le bandeau reste une **composition unique** (même lecture sémantique que **§2.12.1**), avec des **zones plus denses** et des contrôles mieux calibrés en largeur.

**Structure** — les rôles sont inchangés :

* **gauche** : vue active / titre **Pilotage** ;
* **centre** : **Tenant**, **Société**, **Période**, **Année** ;
* **droite** : notification (placeholder si non câblée) et **bloc session**.

**Sélecteurs de contexte** — les quatre sélecteurs ne se comportent pas comme des blocs à **largeur libre** : largeurs **minimales contrôlées**, paddings internes **resserrés**, hiérarchie **compacte** ; libellés ou valeurs affichées **raccourcis si nécessaire** pour éviter la concurrence visuelle.

Calibrage recommandé des largeurs relatives :

* **Tenant** — étroit ;
* **Société** — moyen ;
* **Période** — moyen ;
* **Année** — étroit.

**Réorganisation contrôlée** — le groupe de contexte peut **se réorganiser** lorsque l’espace l’exige, tout en restant perçu comme **une seule bande**. Dispositions admises :

* **3 + 1** (une ligne de trois coquilles, une quatrième sur la ligne suivante) ;
* ou **2 + 2**.

Le **retour à la ligne** du groupe de contexte n’est admis que s’il est **explicitement composé** (grille, alignements, gouttières stables) : il **ne doit jamais** résulter d’un **manque de place non traité** (chevauchements, alignements aléatoires, coupures imposées par défaut).

**Bloc session** — simplifier et compacter : padding réduit, avatar légèrement plus petit, texte plus dense, icône notification discrète.

**Rythme vertical** — la **hauteur** du bandeau peut être **légèrement réduite** pour préserver la hauteur utile du cockpit sur écran portable.

#### 3.18.5 Espace entre bandeau et grille cockpit

En mode compact, l’**écart vertical** entre le bas du bandeau et le haut de la **grille cockpit** doit être **réduit** par rapport au grand desktop, **sans** supprimer une **respiration minimale** volontaire.

Sur laptop, la contrainte de **hauteur** rend ce réglage **prioritaire** pour la lisibilité d’ensemble.

#### 3.18.6 Grille cockpit

**Principe** — le cockpit reste **lisible** ; il ne doit pas être **seulement compressé** (pas de montants rognés, pas de cartes écrasées).

**Tuiles maîtresses (Classe A)** — elles restent **dominantes**. En compact : padding interne **diminué** ; taille des **grands montants** légèrement **réduite** ; sous-lignes et interlignes **resserrés** ; ornementation / vide décoratif **réduit**.

**Structure de grille** — les **trois** tuiles **A** restent sur **une seule ligne** uniquement si la largeur permet une lecture **propre** des chiffres et des signaux de confiance. Sinon : répartition **explicitement choisie**, par exemple **deux tuiles** sur une ligne puis **une** sur la suivante, ou autre combinaison **documentée** — **sans** forcer trois colonnes étriquées.

**Tuiles Classe B et C** — elles tolèrent davantage la **densification** : hauteur et padding légèrement réduits, en **préservant** la hiérarchie **titre / valeur** et la **visibilité** des signaux de confiance (**§3.16**).

#### 3.18.7 Échelle typographique

L’objectif n’est pas « plus petit » au détriment de la crédibilité : il s’agit d’une lecture **plus dense, plus nette, plus tenue**.

* **Bandeau** — titre vue active légèrement réduit ; métadonnées et textes des sélecteurs resserrés si nécessaire.
* **Tuiles A** — grands montants un cran au-dessous du grand desktop ; textes secondaires et espacements internes réduits.
* **Tuiles B / C** — titres et montants **lisibles**, dans une variante **plus dense**.

#### 3.18.8 Invariants et interdits

**À préserver** :

* lisibilité des **trois** tuiles maîtresses ;
* hiérarchie **A / B / C** (**§3.6**, **§3.13**) ;
* visibilité des **signaux de confiance** ;
* clarté de la **vue active** et cohérence des **sélecteurs** de contexte.

**À proscrire** :

* retours à la ligne ou troncatures **accidentels** ;
* montants **rognés** ou **illisibles** ;
* cartes **écrasées** ou en concurrence visuelle avec le bandeau ;
* rail **disproportionné** par rapport au cockpit ;
* zones du bandeau en **concurrence** (même hiérarchie visuelle pour tout).

#### 3.18.9 Règles de mise en œuvre par palier

| Palier | Rail | Bandeau | Grille cockpit | Typographie |
|--------|------|---------|----------------|-------------|
| **Grand desktop** | plus large (~272 px) | espacements confortables | paddings généreux, 3×A si possible | montants les plus grands |
| **Desktop compact / laptop** | ~224–236 px | dense, sélecteurs calibrés, wrapping **contrôlé** | paddings réduits, 3×A **ou** rupture contrôlée | montants A un cran en dessous |
| **Phone mobile** | **§3.19** | simplifié, pas de bandeau desktop miniaturisé | tuiles **A** prioritaires, empilées | priorisation lecture (persona Max) |
| **Tablette / iPad** | **§3.20** | recomposé, plus riche que phone ; pas ruban saturé | grille cockpit compacte tactile | entre laptop et phone |

Les régimes **tablette / phone** ne sont **pas** une simple **réduction supplémentaire** du compact : ils relèvent de règles **distinctes** (hors §3.18). Le **phone mobile** est normé au **§3.19** ; la **tablette / iPad** au **§3.20**.

#### 3.18.10 Priorités d’implémentation (recommandé)

1. Réduire la **largeur** du rail latéral.
2. Mettre en place la **variante compacte** du bandeau (sélecteurs + session).
3. Réduire l’**écart** sous le bandeau.
4. Resserrer les **tuiles A** (padding, montants, interlignes).
5. Trancher : **trois A sur une ligne** ou **répartition compacte contrôlée** selon la largeur réelle.

#### 3.18.11 Principe directeur

> **Le mode Lynki desktop compact / laptop n’est pas un desktop réduit : c’est un cockpit plus dense, rééquilibré et conçu pour les écrans professionnels plus étroits.**

### 3.19 Mode phone mobile — persona Max

#### 3.19.1 Objet

Le mode **phone mobile** couvre la lecture de la vue **Pilotage** sur téléphone intelligent, dans un usage de consultation rapide, décisionnelle et en mobilité.

Ce régime vise en priorité la persona **Max** :

* consultation rapide ;
* temps d’attention limité ;
* besoin de voir l’essentiel immédiatement ;
* possibilité d’approfondir ponctuellement via une vue détail.

Le mode phone mobile constitue un **régime produit autonome** : il ne doit pas être traité comme un simple **desktop** ou **laptop** rétréci.

#### 3.19.2 Principe directeur

Sur téléphone, la vue Pilotage doit privilégier une logique de **priorisation**.

Elle doit permettre à l’utilisateur :

* de lire rapidement la situation ;
* de qualifier la fiabilité de ce qu’il voit ;
* de décider s’il faut agir ou approfondir ;
* d’accéder ensuite au détail si nécessaire.

> **Phone mobile = lire, qualifier, décider, puis approfondir éventuellement.**

#### 3.19.3 Périmètre de lecture prioritaire

Sur téléphone, la lecture doit d’abord se concentrer sur les **tuiles maîtresses** de classe **A** :

1. **Trésorerie**
2. **Business**
3. **Flux net**

Ces trois tuiles constituent la **colonne vertébrale** de la lecture mobile.

Les tuiles de classes **B** et **C** viennent ensuite, dans un ordre secondaire, sans concurrencer la lecture prioritaire.

#### 3.19.4 Header mobile

Le header mobile doit être **significativement simplifié** par rapport aux régimes desktop et laptop.

Il doit permettre :

* d’identifier la vue active (**Pilotage**) ;
* de conserver un rappel compact du contexte ;
* d’accéder au menu, à la session et aux actions globales.

Il ne doit pas :

* reproduire le bandeau desktop sous forme miniaturisée ;
* afficher quatre grosses coquilles de contexte côte à côte ;
* concurrencer visuellement les tuiles maîtresses.

#### 3.19.5 Contexte global en mobile

Le contexte global reste composé des quatre paramètres canoniques :

* **Tenant**
* **Société**
* **Période**
* **Année**

En mode phone mobile, ces paramètres ne doivent pas nécessairement être exposés simultanément sous forme de quatre sélecteurs complets visibles à l’écran.

Le mode mobile peut privilégier :

* un **résumé compact** du contexte actif ;
* ou un **point d’entrée unique** vers un panneau de contexte.

Le contexte doit rester :

* lisible ;
* accessible ;
* cohérent avec la logique du header global ;
* modifiable sans ambiguïté.

#### 3.19.6 Modification du contexte

Sur téléphone, la modification du contexte peut être opérée via :

* un **drawer** ;
* une **sheet** ;
* un panneau contextuel dédié ;
* ou un composant équivalent explicitement choisi.

Le produit doit éviter une exposition simultanée trop dense des quatre sélecteurs à l’écran principal.

La logique fonctionnelle reste inchangée :

* tout changement de contexte doit recalculer la lecture cockpit ;
* le Dashboard doit conserver un état cohérent et complet.

#### 3.19.7 Ordre de lecture mobile

L’ordre de lecture attendu sur téléphone est le suivant :

1. **header mobile**
2. **Trésorerie**
3. **Business**
4. **Flux net**
5. **alertes et signaux**
6. **tuiles de classe B**
7. **tuiles de classe C**
8. **accès au détail**

Cet ordre vise à limiter la charge cognitive et à mettre en avant les informations les plus décisionnelles pour Max.

#### 3.19.8 Tuiles maîtresses (classe A)

Les tuiles **Trésorerie**, **Business** et **Flux net** doivent être empilées verticalement, en pleine largeur, dans un ordre stable et lisible.

Elles doivent conserver :

* une forte dominance visuelle ;
* un montant principal immédiatement lisible ;
* un contexte court ;
* un signal de confiance clair ;
* un accès simple vers la vue détaillée.

La densité des cartes peut être ajustée pour mobile, mais sans affaiblir leur rôle prioritaire.

#### 3.19.9 Tuiles intermédiaires (classe B)

Les tuiles de classe **B** doivent rester accessibles sur mobile, mais avec une présence secondaire par rapport aux tuiles maîtresses.

Leur exposition peut suivre une logique :

* de cartes empilées plus compactes ;
* ou de regroupement sous une section dédiée ;
* ou d’un affichage partiellement repliable si le produit le justifie.

En toute hypothèse, elles doivent :

* rester lisibles ;
* conserver leur hiérarchie métier ;
* ne pas remonter au niveau de priorité des tuiles A.

#### 3.19.10 Tuiles de contexte (classe C)

Les tuiles de classe **C** ne doivent pas perturber la lecture initiale sur téléphone.

Elles peuvent être :

* regroupées sous une section **Contexte** ;
* présentées dans un bloc **Autres indicateurs** ;
* ou partiellement repliées par défaut.

Elles restent présentes dans le régime mobile, mais dans une logique de contextualisation secondaire.

#### 3.19.11 Alertes et signaux

Le bloc **Alertes & signaux** peut occuper une place plus centrale sur téléphone que sur desktop, car il permet une transition directe entre lecture et action.

Sur mobile, ce bloc peut être positionné :

* juste après les trois tuiles maîtresses ;
* ou à un emplacement proche du haut de la page, tant qu’il ne concurrence pas la lecture initiale de la Trésorerie.

L’objectif est d’aider Max à identifier rapidement s’il existe un sujet nécessitant une attention immédiate.

#### 3.19.12 Navigation mobile

Le rail latéral desktop ne doit pas être repris tel quel sur téléphone.

La navigation mobile doit être assurée par un mécanisme adapté, par exemple :

* menu mobile ;
* drawer latéral ;
* navigation basse ;
* ou autre schéma explicitement retenu.

L’utilisateur doit au minimum pouvoir accéder à :

* **Pilotage**
* **Synthèse comptable**
* **Lexique**
* **Aide**
* **Thème**
* **Déconnexion**

#### 3.19.13 Footer mobile

Le footer technique doit être significativement allégé sur téléphone.

Les informations techniques non essentielles à la lecture immédiate ne doivent pas concurrencer le contenu principal.

Le produit peut choisir :

* d’alléger le footer visible ;
* ou de déplacer certaines informations dans une zone secondaire ou un panneau système.

#### 3.19.14 Invariants du régime phone mobile

Le régime phone mobile doit préserver :

* la hiérarchie **A / B / C** ;
* la sincérité sur la confiance et la disponibilité ;
* la continuité cockpit → détail ;
* la lisibilité des montants ;
* la cohérence du contexte global.

#### 3.19.15 Interdits

Le régime phone mobile ne doit pas produire :

* un desktop miniaturisé ;
* un header desktop compressé sans recomposition ;
* une exposition simultanée trop dense des sélecteurs ;
* une surcharge de cartes au-dessus de la ligne de lecture initiale ;
* une concurrence visuelle entre header, cartes A, alertes et blocs secondaires.

#### 3.19.16 Principe directeur

> **Le mode phone mobile de Lynki doit offrir à Max une lecture courte, priorisée et fiable, centrée d’abord sur Trésorerie, Business et Flux net, avec un accès simple au contexte et au détail.**

### 3.20 Mode tablette / iPad

#### 3.20.1 Objet

Le mode **tablette / iPad** couvre la lecture de la vue **Pilotage** sur terminal tactile intermédiaire, dans un usage de consultation mobile ou semi-mobile, avec une surface d’affichage supérieure au téléphone mais inférieure au laptop.

Ce régime constitue un **palier produit autonome** : il ne doit être traité ni comme un **desktop compact** simplement réduit, ni comme un **phone mobile** agrandi.

Il vise un usage où l’utilisateur conserve un vrai confort de lecture visuelle, tout en étant soumis à :

* une largeur plus contrainte que sur laptop ;
* une interaction tactile ;
* une navigation plus compacte ;
* une densité d’écran à arbitrer plus finement.

#### 3.20.2 Principe directeur

Le mode tablette / iPad doit conserver une véritable logique de **cockpit**, tout en réduisant la concurrence horizontale et en adaptant les interactions au tactile.

Il doit permettre :

* une lecture structurée et crédible ;
* une hiérarchie cockpit encore pleinement visible ;
* une continuité simple vers le détail ;
* un usage plus souple que sur laptop, sans basculer dans la logique très priorisée du phone.

> **Tablette / iPad = cockpit compact tactile, hiérarchisé, lisible et encore panoramique.**

#### 3.20.3 Positionnement entre laptop et phone

Le mode tablette / iPad se situe entre :

* le **desktop compact / laptop**, qui conserve une logique relativement large et plus horizontale ;
* le **phone mobile**, qui impose une priorisation forte des contenus et un empilement plus radical.

Le régime tablette doit donc :

* conserver davantage de simultanéité que le phone ;
* mais accepter une recomposition plus forte que le laptop.

#### 3.20.4 Périmètre cible

Ce régime couvre les tablettes et terminaux assimilés, en orientation portrait ou paysage, dans une plage de largeur intermédiaire à définir dans l’implémentation.

La logique fonctionnelle reste celle de **Pilotage** :

* lecture cockpit ;
* hiérarchie **A / B / C** ;
* contexte global commun ;
* accès au détail.

#### 3.20.5 Header tablette / iPad

Le header tablette doit être recomposé par rapport au desktop, mais rester plus riche que le header phone.

Il doit permettre :

* d’identifier la vue active (**Pilotage**) ;
* d’afficher un contexte lisible ;
* d’accéder à la session et aux actions globales ;
* de rester compatible avec une interaction tactile.

Il ne doit pas :

* répliquer le bandeau desktop sans adaptation ;
* produire un ruban horizontal saturé ;
* concurrencer la grille cockpit.

#### 3.20.6 Contexte global sur tablette

Le contexte global reste défini par :

* **Tenant**
* **Société**
* **Période**
* **Année**

Sur tablette, ces paramètres peuvent rester visibles de manière plus explicite que sur phone, mais dans une composition adaptée.

Configurations admises :

* quatre sélecteurs visibles dans une composition plus compacte ;
* répartition sur plusieurs lignes maîtrisées ;
* combinaison d’un résumé visible et d’un accès à un panneau de contexte.

Le retour à la ligne éventuel doit être **composé**, non subi.

#### 3.20.7 Modification du contexte

La modification du contexte peut être gérée :

* directement dans le header si l’espace le permet ;
* ou via un drawer / panneau contextuel si la densité devient excessive.

Le produit doit privilégier une modification du contexte :

* claire ;
* tactile ;
* stable ;
* sans surcharge du bandeau principal.

#### 3.20.8 Navigation tablette

Le rail latéral desktop peut être conservé sous une forme plus compacte, ou remplacé par un autre dispositif adapté à la tablette, selon l’arbitrage produit.

L’objectif est de préserver :

* l’accès à **Pilotage** ;
* l’accès à **Synthèse comptable** ;
* l’accès aux outils ;
* l’accès à la session ;

sans gaspiller excessivement la largeur utile.

Le régime tablette peut donc admettre :

* un rail plus fin ;
* un rail partiellement condensé ;
* ou une autre logique de navigation clairement définie.

#### 3.20.9 Grille cockpit tablette

La vue tablette doit conserver une vraie **grille cockpit**, mais avec une composition plus compacte que sur laptop.

La grille doit :

* conserver la hiérarchie **A / B / C** ;
* rester lisible au toucher ;
* éviter l’écrasement des tuiles ;
* réduire la concurrence horizontale.

#### 3.20.10 Tuiles maîtresses (classe A)

Les tuiles **Trésorerie**, **Business** et **Flux net** doivent rester les points d’entrée prioritaires.

Sur tablette, plusieurs organisations peuvent être admises, à condition que la hiérarchie reste claire :

* trois tuiles si la largeur le permet proprement ;
* deux puis une ;
* ou toute autre répartition explicitement choisie.

Le produit ne doit pas forcer une composition qui rendrait les montants ou les signaux de confiance difficilement lisibles.

#### 3.20.11 Tuiles intermédiaires (classe B)

Les tuiles de classe **B** doivent rester visibles et immédiatement accessibles dans le régime tablette.

Elles peuvent apparaître :

* dans une grille plus compacte ;
* sur deux colonnes ;
* ou dans une composition tactile stable.

Elles doivent continuer à jouer leur rôle de :

* qualification ;
* explication ;
* prolongement de la lecture des tuiles A.

#### 3.20.12 Tuiles de contexte (classe C)

Les tuiles de classe **C** restent présentes sur tablette, avec une visibilité plus forte que sur phone, mais toujours inférieure aux classes **A** et **B**.

Elles peuvent être :

* intégrées dans la continuité de la grille ;
* légèrement repoussées plus bas dans la lecture ;
* ou regroupées dans une section dédiée, si cela améliore la lisibilité générale.

#### 3.20.13 Alertes et signaux

Le bloc **Alertes & signaux** peut conserver une présence visible sur tablette, sans nécessairement remonter aussi haut que sur phone.

Il doit jouer un rôle de prolongement de la lecture cockpit, sans concurrencer les tuiles maîtresses.

#### 3.20.14 Continuité cockpit → détail

Le passage du cockpit au détail doit rester simple et naturel sur tablette.

Le régime tablette doit préserver :

* le contexte global ;
* la compréhension de la vue active ;
* le retour vers le cockpit ;
* la stabilité tactile des points d’entrée vers le détail.

#### 3.20.15 Footer tablette

Le footer technique peut rester plus riche que sur phone, mais doit rester secondaire par rapport au cockpit.

Il ne doit pas prendre une place disproportionnée dans la surface utile.

#### 3.20.16 Invariants

Le mode tablette / iPad doit préserver :

* la hiérarchie **A / B / C** ;
* la lisibilité des montants ;
* la visibilité des signaux de confiance ;
* la stabilité du contexte ;
* la continuité cockpit → détail ;
* la cohérence avec la logique générale de la vue Pilotage.

#### 3.20.17 Interdits

Le mode tablette / iPad ne doit pas produire :

* un desktop simplement rétréci ;
* un laptop tassé ;
* un phone artificiellement élargi ;
* une grille tactile trop dense ;
* un header saturé ;
* une navigation qui consomme excessivement la largeur utile.

#### 3.20.18 Principe directeur

> **Le mode tablette / iPad de Lynki doit conserver une vraie lecture cockpit, plus compacte que le laptop mais plus panoramique que le phone, avec une hiérarchie claire, une interaction tactile stable et une continuité forte vers le détail.**

---

## 4. Vue 2 — Synthèse comptable

### 4.1 Objet

La vue **Synthèse comptable** constitue la vue de lecture structurée de Lynki.
Elle permet au responsable financier, au contrôleur de gestion et au dirigeant de lire l’entreprise avec une profondeur plus comptable que la vue Pilotage.

### 4.2 Objectifs

La vue Synthèse comptable doit permettre de :

* comprendre ce que racontent les comptes
* lire les grands équilibres comptables de manière organisée
* analyser les masses principales
* suivre les tiers et les situations à surveiller
* préparer une lecture justifiable et restituable

### 4.3 Utilisateurs cibles

* **Véréna** : lecture financière structurée, contrôle, justification
* **Esther** : lecture comptable, analyse, restitution
* **Max** : consultation ponctuelle à un niveau plus détaillé que Pilotage

### 4.4 Structure générale

La page Synthèse comptable se compose de :

* le **header global de contexte**
* des blocs comptables structurés
* des zones de lecture par masse ou par famille
* des tableaux ou restitutions lisibles
* des accès vers un niveau de détail complémentaire

### 4.5 Logique fonctionnelle

Chaque bloc représente un **angle de lecture comptable**.
Contrairement à la vue Pilotage, il ne s’agit plus d’une lecture immédiate par instrument, mais d’une lecture :

* plus structurée
* plus explicable
* plus vérifiable
* plus détaillée

### 4.6 Blocs fonctionnels de référence

#### Bloc 1 — Vue d’ensemble comptable

* masses principales
* grands équilibres
* variations utiles sur la période

#### Bloc 2 — Compte de tiers

* clients
* fournisseurs
* soldes ouverts
* identification des concentrations ou situations sensibles

#### Bloc 3 — Balance âgée

* créances échues / non échues
* dettes échues / non échues
* vision du retard et de l’ancienneté

#### Bloc 4 — Lecture des masses

* produits
* charges
* taxes
* éléments structurants de l’activité

#### Bloc 5 — Restitution / export

* lecture imprimable ou exportable
* support de partage ou d’analyse complémentaire

### 4.7 Principes d’affichage

La Synthèse comptable doit privilégier :

* la clarté
* la stabilité visuelle
* la lisibilité des montants
* la hiérarchie des blocs
* une logique de restitution sérieuse

Elle ne doit pas chercher à reproduire les codes du cockpit.

### 4.8 Comportement attendu

Depuis la vue Synthèse comptable :

* l’utilisateur lit une structure comptable organisée
* il repère un bloc ou un poste d’intérêt
* il approfondit si nécessaire
* il retrouve les éléments utiles à la justification ou à la restitution

### 4.9 Questions auxquelles la vue doit répondre

* que racontent les comptes à cette date ou sur cette période ?
* quels postes expliquent la situation ?
* quels tiers demandent une attention particulière ?
* où se situent les retards, déséquilibres ou concentrations ?
* quels éléments peuvent être mobilisés pour justifier ou restituer la situation ?

### 4.10 Hors périmètre

La Synthèse comptable n’est pas :

* un cockpit de signaux rapides
* une page de 12 tuiles
* une comptabilité brute illisible
* un module expert sans hiérarchie de lecture

### 4.11 Synthèse de positionnement

**Synthèse comptable = lire pour comprendre et justifier.**

### 4.12 Ordre de lecture

La vue **Synthèse comptable** doit être conçue selon un ordre de lecture structuré, progressif et stable.

L’ordre de lecture attendu est le suivant :

1. **header global de contexte**
2. **lecture d’ensemble de la synthèse**
3. **identification des blocs comptables prioritaires**
4. **lecture détaillée d’un bloc ou d’un poste**
5. **retour à la vue d’ensemble**

Cet ordre de lecture doit permettre à l’utilisateur de passer d’une compréhension générale de la situation comptable à une analyse plus ciblée, sans rupture de cohérence.

### 4.13 Hiérarchie visuelle

La vue Synthèse comptable repose sur une hiérarchie visuelle entre ses différents blocs de lecture.

Cette hiérarchie distingue trois niveaux :

#### 4.13.1 Blocs structurants

Les blocs structurants constituent les points d’entrée principaux de la lecture comptable :

* Vue d’ensemble comptable
* Lecture des masses

Ils doivent bénéficier de la plus forte présence visuelle.

#### 4.13.2 Blocs d’analyse

Les blocs d’analyse permettent de préciser, expliquer ou documenter la situation comptable :

* Compte de tiers
* Balance âgée

Ils doivent être immédiatement accessibles, sans concurrencer la lecture structurante.

#### 4.13.3 Blocs de restitution

Les blocs de restitution prolongent la lecture vers le partage, l’export ou la justification :

* Restitution / export

Ils doivent être clairement identifiables, sans détourner l’attention de la lecture comptable elle-même.

### 4.14 Navigation vers le détail

La vue Synthèse comptable doit permettre une navigation fluide entre la vue d’ensemble et un niveau de détail complémentaire.

#### 4.14.1 Principe

Chaque bloc de la synthèse doit pouvoir constituer un point d’entrée vers une lecture plus détaillée.

#### 4.14.2 Comportement attendu

Lorsqu’un utilisateur sélectionne un bloc ou un poste :

* le détail correspondant s’ouvre ou se déploie
* le contexte défini par le **header global** est conservé
* l’utilisateur peut revenir facilement à la synthèse globale

#### 4.14.3 Règle de continuité

Le passage de la synthèse au détail ne doit pas rompre la compréhension du contexte.
L’utilisateur doit toujours pouvoir identifier :

* la vue active
* le bloc ou le poste analysé
* le contexte de lecture
* le chemin de retour vers la synthèse

### 4.15 États UX

La vue Synthèse comptable doit prévoir plusieurs états d’interface afin de garantir une lecture robuste, compréhensible et honnête, y compris lorsque certaines données sont absentes, partielles ou indisponibles.

#### 4.15.1 État de chargement

Lorsqu’une donnée est en cours de chargement :

* la structure générale de la page doit rester stable
* les blocs comptables doivent conserver leur place
* les tableaux et restitutions doivent signaler un état transitoire lisible

#### 4.15.2 État vide

Lorsqu’aucune donnée exploitable n’est disponible pour un bloc ou pour un périmètre donné :

* l’absence d’information doit être explicitée
* le bloc concerné doit rester lisible
* l’utilisateur ne doit pas confondre absence de donnée et erreur système

#### 4.15.3 État partiel

Lorsqu’une information n’est disponible que partiellement :

* la vue doit pouvoir afficher une lecture partielle
* cette lecture doit être accompagnée d’un signal clair sur son niveau de couverture ou de complétude

#### 4.15.4 État d’erreur

En cas d’erreur de récupération ou d’incohérence technique :

* le bloc ou la zone concernée doit signaler explicitement le problème
* l’utilisateur doit comprendre qu’il s’agit d’un incident technique et non d’une interprétation métier

### 4.16 Règles UX associées à la confiance

La vue Synthèse comptable doit permettre à l’utilisateur d’évaluer rapidement le degré de confiance qu’il peut accorder à l’information affichée.

Les signaux de confiance doivent notamment permettre d’indiquer :

* la fraîcheur de la donnée
* son niveau de couverture
* son niveau de disponibilité
* son caractère complet ou partiel

Ces signaux doivent rester sobres, lisibles et compatibles avec une logique de restitution sérieuse.

### 4.17 Principe directeur de la vue Synthèse comptable

La vue Synthèse comptable doit privilégier :

* la clarté de lecture
* la stabilité visuelle
* la hiérarchie des masses et des blocs
* la continuité entre synthèse et détail
* l’honnêteté sur la qualité de l’information
* la capacité de justification et de restitution

Elle ne doit jamais sacrifier la compréhension ni la fiabilité perçue au profit d’une densité excessive ou d’un effet cockpit artificiel.

---

## 5. Grammaire d’une tuile Pilotage

### 5.1 Objet

La tuile Pilotage constitue l’unité de lecture élémentaire du cockpit Lynki.
Elle représente un **instrument de pilotage** destiné à fournir une information immédiatement exploitable dans un contexte de lecture rapide et décisionnelle.

Une tuile n’a pas vocation à restituer l’ensemble des données disponibles sur un sujet.
Elle doit permettre de comprendre l’essentiel, d’évaluer la qualité de l’information affichée, puis d’accéder si nécessaire à une vue de détail.

### 5.2 Rôle

Une tuile Pilotage doit remplir simultanément quatre fonctions :

* **signaler** un sujet de lecture
* **résumer** une information principale
* **qualifier** la fiabilité ou la couverture de cette information
* **orienter** vers un niveau de détail complémentaire

### 5.3 Structure fonctionnelle minimale

Toute tuile Pilotage doit comporter, au minimum, les éléments suivants :

1. **Intitulé**
2. **Valeur principale**
3. **Contexte d’interprétation**
4. **État de disponibilité**
5. **Signal de confiance**
6. **Point d’entrée vers le détail**

### 5.4 Intitulé

#### 5.4.1 Rôle

L’intitulé identifie clairement l’instrument représenté par la tuile.

#### 5.4.2 Exigence

L’intitulé doit être :

* court
* explicite
* stable dans le temps
* cohérent avec le vocabulaire métier du produit

#### 5.4.3 Exemples

* Trésorerie
* Business
* Flux net
* Encours
* Taxes

### 5.5 Valeur principale

#### 5.5.1 Rôle

La valeur principale constitue l’information centrale lue en premier par l’utilisateur.

#### 5.5.2 Exigence

La valeur principale doit être :

* immédiatement visible
* hiérarchiquement dominante dans la tuile
* compréhensible sans effort
* cohérente avec la promesse de l’instrument

#### 5.5.3 Principe

Une tuile ne doit afficher qu’une **seule valeur principale** à un niveau dominant.

### 5.6 Contexte d’interprétation

#### 5.6.1 Rôle

Le contexte d’interprétation permet d’éviter une lecture brute ou ambiguë de la valeur principale.

#### 5.6.2 Contenu possible

Le contexte peut prendre la forme de :

* un sous-libellé
* une précision temporelle
* une comparaison utile
* un commentaire métier bref
* une indication de périmètre

#### 5.6.3 Exigence

Ce contexte doit rester :

* court
* lisible
* secondaire par rapport à la valeur principale
* directement utile à la compréhension

### 5.7 État de disponibilité

#### 5.7.1 Rôle

L’état de disponibilité informe l’utilisateur de la possibilité effective de lire l’instrument.

#### 5.7.2 États attendus

Une tuile doit pouvoir exprimer au minimum :

* un état **disponible**
* un état **en chargement**
* un état **vide**
* un état **partiel**
* un état **en erreur**

#### 5.7.3 Exigence

L’état de disponibilité doit être explicite et ne jamais être confondu avec une information métier.

### 5.8 Signal de confiance

#### 5.8.1 Rôle

Le signal de confiance permet à l’utilisateur d’évaluer rapidement le degré de fiabilité qu’il peut accorder à l’information affichée.

#### 5.8.2 Dimensions couvertes

Le signal de confiance peut porter sur :

* la fraîcheur de la donnée
* le niveau de couverture
* le caractère complet ou partiel
* la disponibilité effective de la source

#### 5.8.3 Exigence

Le signal de confiance doit être :

* sobre
* lisible
* constant dans sa logique d’affichage
* distinct de la valeur principale

### 5.9 Accès au détail

#### 5.9.1 Rôle

La tuile doit permettre un passage naturel du cockpit vers une lecture plus détaillée.

#### 5.9.2 Principe

Toute tuile Pilotage doit constituer, sauf exception explicitement définie, un point d’entrée vers une **vue de détail dédiée**.

#### 5.9.3 Exigence UX

L’accès au détail doit être :

* simple
* cohérent
* prévisible
* conservant le contexte global défini par le header

### 5.10 Hiérarchie interne de lecture

L’ordre de lecture interne d’une tuile doit être le suivant :

1. **Intitulé**
2. **Valeur principale**
3. **Contexte d’interprétation**
4. **Signal de confiance / état**
5. **interaction vers le détail**

Cette hiérarchie doit garantir une lecture rapide sans surcharge visuelle.

### 5.11 Règles d’affichage

Une tuile Pilotage doit respecter les règles suivantes :

* ne pas multiplier les messages concurrents
* ne pas présenter plusieurs valeurs dominantes
* ne pas surcharger l’espace avec des détails d’analyse
* ne pas exiger un effort d’interprétation excessif
* ne pas masquer l’incertitude ou l’indisponibilité de l’information

### 5.12 Règles UX

Une tuile Pilotage doit privilégier :

* la lisibilité immédiate
* la stabilité visuelle
* la cohérence d’une tuile à l’autre
* la hiérarchie claire de l’information
* la continuité entre lecture cockpit et lecture détaillée

### 5.13 Hors périmètre

Une tuile Pilotage n’est pas :

* une mini-page de reporting
* un tableau comptable condensé
* une fiche analytique complète
* un espace d’explication détaillée autonome

### 5.14 Principe directeur

Une tuile Pilotage doit être conçue comme un **instrument de lecture rapide**, et non comme un conteneur d’information exhaustif.

Sa fonction première est de permettre à l’utilisateur :

* de voir
* de comprendre
* d’évaluer la confiance
* puis d’approfondir si nécessaire

---

## 6. Fiche détaillée — Tuile Pilotage « Trésorerie »

### 6.0 Primauté — fiche instrument et vue détaillée

Pour tout instrument disposant à la fois d’une **fiche tuile** (ex. **§6** pour Trésorerie) et d’une **section vue détaillée** (ex. **§7** pour Trésorerie) :

* la **fiche instrument** décrit la **promesse fonctionnelle** du détail : finalité, données d’entrée, calculs, signaux de confiance, continuité cockpit → détail, hors périmètre ;
* la **section vue détaillée** décrit la **composition d’écran normative** : blocs, ordre de lecture, états par bloc, navigation de page.

**Règle en cas de divergence** sur ce qui doit **figurer à l’interface** : la **section vue détaillée** **prime** pour la spécification d’écran. La fiche instrument doit alors être **réalignée** (mise à jour du présent CDCF). Toute divergence **volontaire** et durable relève d’une **décision produit documentée** (comme pour les écarts maquettes / CDCF en fin de document).

### 6.1 Objet

La tuile **Trésorerie** constitue l’un des instruments majeurs du cockpit Lynki.
Elle a pour objet de fournir une lecture immédiate, exploitable et qualifiée de la situation de trésorerie dans le contexte défini par le header global.

Elle appartient à la catégorie des **tuiles maîtresses** de la vue Pilotage.

### 6.2 Finalité métier

La tuile Trésorerie doit permettre à l’utilisateur de répondre rapidement aux questions suivantes :

* quel est le niveau de trésorerie lu à date ?
* cette lecture est-elle fiable, partielle ou fragile ?
* faut-il approfondir le détail de trésorerie ?
* existe-t-il un signal d’écart ou de couverture à surveiller ?

### 6.3 Données d’entrée

La tuile Trésorerie repose sur les données nécessaires à la construction d’une lecture de cash dans le périmètre sélectionné.

#### 6.3.1 Données de contexte

Les données de contexte sont fournies par le **header global** :

* **tenant**
* **société**
* **période**
* **année**

#### 6.3.2 Données métier attendues

La tuile peut s’appuyer sur les éléments suivants, selon les sources disponibles :

* soldes bancaires disponibles dans le périmètre
* soldes de caisse disponibles dans le périmètre
* indicateurs de couverture ou de validation
* éventuelle valeur de comparaison ERP
* éventuels indicateurs de fraîcheur ou de synchronisation
* éventuels signaux d’incomplétude ou de source partielle

#### 6.3.3 Principe de dépendance

La tuile ne doit afficher que des informations compatibles avec le contexte actif.
Toute modification du header doit entraîner le recalcul de la lecture de trésorerie.

### 6.4 Calcul métier

#### 6.4.1 Principe général

La tuile Trésorerie doit afficher une **lecture de trésorerie à date** correspondant à la meilleure valeur disponible dans le contexte sélectionné.

#### 6.4.2 Règle de calcul fonctionnelle

La valeur principale doit être construite à partir :

* des composantes de trésorerie effectivement disponibles dans le périmètre
* du niveau de consolidation atteignable à la date de lecture
* des règles de couverture ou de validation applicables

#### 6.4.3 Exigence d’honnêteté fonctionnelle

Si la lecture n’est pas complète, la tuile ne doit pas masquer cette limite.
Elle doit afficher une valeur qualifiée comme :

* complète
* partielle
* fragile
* indisponible

#### 6.4.4 Règle de non-surinterprétation

La tuile ne doit jamais laisser entendre qu’une valeur est totalement fiable si le niveau de couverture ou de disponibilité ne le permet pas.

### 6.5 Valeur principale affichée

#### 6.5.1 Nature

La valeur principale correspond au **montant de trésorerie à date** pour le périmètre actif.

#### 6.5.2 Format

La valeur principale doit être :

* exprimée dans une devise explicite
* visuellement dominante
* immédiatement lisible
* cohérente avec la grammaire commune des tuiles Pilotage

#### 6.5.3 Unicité

Une seule valeur principale dominante doit être affichée.

### 6.6 Contexte d’interprétation

#### 6.6.1 Rôle

Le contexte d’interprétation permet de qualifier la lecture affichée.

#### 6.6.2 Contenus possibles

Le contexte peut indiquer, par exemple :

* que la lecture est **à date**
* qu’elle est **partielle**
* qu’elle est **en attente de consolidation**
* qu’elle présente un **écart à surveiller**
* qu’elle repose sur un **périmètre incomplet**
* qu’elle est **alignée** ou **non alignée** avec une référence secondaire

#### 6.6.3 Exigence

Ce contexte doit rester :

* bref
* utile
* métier
* non ambigu

### 6.7 Signal de confiance

#### 6.7.1 Rôle

Le signal de confiance permet à l’utilisateur d’évaluer immédiatement le niveau de fiabilité de la lecture de trésorerie.

#### 6.7.2 Dimensions possibles

Le signal de confiance peut refléter :

* la fraîcheur de la donnée
* le niveau de couverture
* le caractère complet ou partiel de la lecture
* la disponibilité effective des sources
* la cohérence de la lecture avec une référence secondaire

#### 6.7.3 Exigence

Le signal de confiance doit être :

* visible sans dominer la valeur principale
* cohérent avec les autres tuiles
* suffisamment explicite pour éviter toute surconfiance

### 6.8 Variantes d’état de la tuile

#### 6.8.1 État nominal

La tuile affiche :

* une valeur principale
* un contexte d’interprétation
* un signal de confiance
* un accès au détail

Cet état correspond à une lecture exploitable.

#### 6.8.2 État de chargement

La tuile affiche un état transitoire lorsque les données sont en cours de récupération.

Exigences :

* la structure de la tuile reste stable
* l’utilisateur comprend que la donnée est en cours d’actualisation
* aucune valeur métier trompeuse n’est affichée

#### 6.8.3 État vide

La tuile signale explicitement qu’aucune donnée exploitable n’est disponible dans le contexte sélectionné.

Exigences :

* l’absence de donnée doit être comprise comme telle
* la tuile ne doit pas être interprétée comme une valeur nulle
* le contexte doit rester visible

#### 6.8.4 État partiel

La tuile affiche une lecture incomplète, mais néanmoins informative.

Exigences :

* la valeur peut être affichée
* le caractère partiel doit être visible
* le signal de confiance doit refléter cette limite
* l’utilisateur doit comprendre qu’une prudence est requise

#### 6.8.5 État d’erreur

La tuile signale une impossibilité technique ou une anomalie empêchant la lecture correcte.

Exigences :

* l’erreur est explicitement signalée
* elle n’est pas confondue avec une valeur métier
* la tuile conserve une structure lisible
* le passage au détail peut rester possible si pertinent

### 6.9 Contenu exact de la vue détaillée Trésorerie

La **découpe par blocs d’écran** normative est portée par le **§7**. La présente sous-section en rappelle l’**intention fonctionnelle** ; en cas d’écart avec le §7 sur le périmètre écran, s’applique la **primauté** définie en **§6.0**.

#### 6.9.1 Objet de la vue détaillée

La vue détaillée Trésorerie a pour objet de prolonger la lecture cockpit par une compréhension plus précise de la situation de cash.

Elle ne doit pas casser la logique de continuité avec la tuile.

#### 6.9.2 Contenus attendus

La vue détaillée doit permettre d’afficher, selon les données disponibles :

* le montant de trésorerie à date
* le rappel du contexte actif
* le niveau de confiance associé
* les composantes principales de la trésorerie lue
* les éventuels écarts ou limites de couverture
* les éventuels signaux de vigilance
* une lecture plus détaillée par sous-composant ou source
* un chemin de retour clair vers le cockpit

#### 6.9.3 Règle de cohérence

La valeur affichée dans le détail doit être cohérente avec la valeur principale de la tuile, sous réserve des arrondis ou précisions d’affichage.

#### 6.9.4 Règle de continuité de contexte

La vue détaillée doit conserver :

* le **tenant**
* la **société**
* la **période**
* l’**année**

définis dans le header global.

### 6.10 Critères de qualité métier

La tuile Trésorerie est considérée comme fonctionnellement satisfaisante si l’utilisateur peut, en quelques secondes :

* lire un montant de trésorerie
* comprendre s’il s’agit d’une lecture solide, partielle ou fragile
* identifier la nécessité éventuelle d’approfondir
* accéder au détail sans rupture de contexte

### 6.11 Règles UX spécifiques

La tuile Trésorerie doit privilégier :

* la lisibilité immédiate du cash
* la sincérité sur la qualité de la donnée
* la stabilité visuelle
* la cohérence avec les autres tuiles de Classe A
* la facilité d’accès au détail

### 6.12 Hors périmètre

La tuile Trésorerie n’a pas vocation à devenir :

* une réconciliation bancaire complète
* un tableau détaillé de tous les mouvements
* une vue analytique exhaustive des flux
* un rapport complet de justification comptable

### 6.13 Principe directeur

La tuile Trésorerie doit être conçue comme **un instrument de décision rapide sur la situation de cash**, avec une exigence forte de lisibilité, de continuité et d’honnêteté sur la qualité de l’information.

---

## 7. Vue détaillée Trésorerie — découpage par blocs d’écran

### 7.1 Objet et raccord avec le §6.9

La présente section **décline** les contenus listés au **§6.9.2** en **blocs d’écran** identifiables, recettables et traçables dans le registre d’implémentation.

Chaque bloc doit respecter :

* **§6.9.3** — cohérence du montant affiché avec la tuile cockpit ;
* **§6.9.4** — conservation du tenant, de la société, de la période et de l’année définis dans le header global.

L’**ordre de lecture** ci-dessous est l’ordre **logique et pédagogique** ; l’ordonnancement visuel exact peut suivre la maquette Stitch **sous réserve** que toute exigence du §6.9.2 reste couverte par au moins un bloc.

### 7.2 Blocs fonctionnels

#### 7.2.1 Navigation et en-tête de page

* retour explicite vers le **cockpit Pilotage** (ou équivalent défini produit) ;
* titre stable identifiant la vue **Détail — Trésorerie** ;
* actions de page pertinentes (ex. actualisation des indicateurs) ; les exports ou actions secondaires peuvent être désactivés tant qu’ils sont signalés comme tels.

#### 7.2.2 Rappel du contexte actif

* **Période**, **société**, **tenant** lisibles sans ouvrir les filtres ;
* lorsque les données le permettent, **indicateur de fraîcheur** (ex. dernière importation de relevé) sans le confondre avec le signal de confiance global.

#### 7.2.3 Synthèse — montant principal à date

* **une** valeur monétaire dominante, cohérente avec le §6.9.3 et la **valeur principale** de la tuile (§6.5) ;
* libellé métier bref (ex. nature du solde affiché) ;
* pas de seconde valeur concurrente au même niveau hiérarchique sans justification produit documentée.

#### 7.2.4 Bloc confiance

* signal de **fiabilité / complétude** associé à la lecture trésorerie, aligné sur l’esprit du **§6.7** ;
* le bloc ne doit **pas** remplacer la lecture du montant ni masquer une donnée partielle.

#### 7.2.5 Interprétation et périmètre des données

* texte ou encart expliquant la **source** dominante (ex. Vault vs ERP), les **limites** de la vue et le caractère **non exhaustif** de la lecture ;
* prolonge le **contexte d’interprétation** (§6.6) au niveau de la page entière.

#### 7.2.6 Composantes et discipline de rapprochement

* lorsque les données sont disponibles : **composantes principales** (ex. montants rapprochés, à rapprocher, taux de rapprochement, journaux) ;
* lorsque le breakdown n’est pas disponible : **message explicite** (absence de donnée ≠ valeur nulle) conformément aux états UX (§3.15, §5.7).

#### 7.2.7 Signaux de vigilance

* alertes **contextualisées** (ex. ancienneté maximale d’écritures non rapprochées, seuils métier) ;
* distinction claire entre **signal métier** et **erreur technique**.

#### 7.2.8 Lecture temporelle ou par sous-périmètre

* représentation de l’**évolution** du solde sur la période sélectionnée, ou autre découpage validé produit ;
* état **vide explicite** lorsque la série ou le découpage ne peut pas être construit (nombre de points insuffisant, etc.).

#### 7.2.9 Synthèse de gouvernance (optionnel)

* bloc complémentaire de **méta-pilotage** (ex. synthèse « santé » ou dispositif de suivi) ;
* ne se substitue pas aux blocs **7.2.3** à **7.2.8** ; reste **hors obligation** si le produit choisit de le reporter à une autre vue.

### 7.3 États UX par bloc

Chaque bloc listé au **§7.2** doit pouvoir être affiché dans les états **chargement**, **vide**, **partiel** et **erreur** lorsque applicable, sans que l’utilisateur confonde absence de donnée, limite métier et incident technique (cf. **§3.15**, **§5.7**).

### 7.4 Hors périmètre au niveau de la page détail

Sauf extension produit documentée, la vue détaillée Trésorerie **ne remplace pas** :

* une **réconciliation bancaire complète** ;
* un **grand livre** ou un listing exhaustif de mouvements ;
* un **rapport d’audit** ou de justification comptable autonome.

(Cohérent avec **§6.12**.)

### 7.5 Référence créa (Stitch)

La maquette `ZeDocs/web59/stitch_carole_61/stitch/d_tail_tr_sorerie_v_r_na_canon_v5/code.html` illustre une **composition** et une **densité** possibles. En cas d’écart entre maquette et présent §7 sur le fond fonctionnel, **le CDCF prime** ; l’écart est tracé dans le registre de traçabilité §6 / §7.

---

**Documents associés (implémentation).** Toute refonte ou évolution majeure de Lynki doit viser à **coller au plus près** du présent cahier des charges : périmètre des vues, header, grammaire des tuiles (§5), exigences par instrument (ex. §6), découpage des vues détail (ex. **§7** Trésorerie). Les maquettes Stitch précisent le **rendu visuel** et l’ordonnancement des blocs à l’écran **sans se substituer** aux exigences fonctionnelles ci-dessus ; en cas d’écart, c’est le CDCF qui fait foi, sauf **décision produit documentée** (colonne « Décision / arbitrage » du registre Trésorerie, mise à jour du présent document, ou backlog).

* [`ROADMAP_REFONTE_LINKY_STITCH_CAROLE_61.md`](./ROADMAP_REFONTE_LINKY_STITCH_CAROLE_61.md) — jalons, recette lab, critères Stitch **sous contrainte CDCF**.
* [`TABLEAU_TRACE_CDCF6_TRESORERIE.md`](./TABLEAU_TRACE_CDCF6_TRESORERIE.md) — registre vivant §6 et **§7** Trésorerie ↔ composants UI ↔ données.
* [`EXECUTION_TICKETS_TACTILE_LINKY.md`](./EXECUTION_TICKETS_TACTILE_LINKY.md) — tickets **T-PH-xxx** / **T-TB-xxx** (phone + tablette pilotage), journal d’implémentation et recette lab.

**Note implémentation (mars 2026, non normative).** L’endpoint Next **`GET /api/accounting/periods`** (pastilles / statuts de période dans le bandeau cockpit) est traité de façon à éviter un **401** middleware lorsque la page pilotage est servie sans la même contrainte de session que les autres routes **`/api/accounting/*`** : exemption ciblée dans le middleware Lynki et contrôle dans le handler (proxy Vault uniquement si session valide avec droit compta équivalent synthèse ; sinon réponse vide). Détail dans le journal du fichier d’exécution tactile ci-dessus.
