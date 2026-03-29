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

| Fichier (`ZeDocs/web61/`) | Instrument | Statut |
|---------------------------|------------|--------|
| `SPEC_PILOTAGE_BUSINESS.md` | Business (Classe A) | Brouillon — aligné sur la structure §6 |
| *à créer* `SPEC_PILOTAGE_FLUX_NET.md` | Flux net (Classe A) | — |

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

#### 2.12.1 Bandeau Pilotage — deux niveaux (référence produit)

Sur la vue **Pilotage**, le bandeau supérieur est structuré en **deux niveaux** :

* **Niveau d’orientation** : titre de la vue courante (« Pilotage ») et **identité de session** ; il répond à *où suis-je ?* et *qui suis-je ?* sans cumuler au même rang recherche, fraîcheur, badges de preuve ni icônes système multiples.
* **Niveau de contexte** : **tenant**, **société**, **période** et **année**, groupés de façon compacte et homogène ; un **signal secondaire** de confiance ou de couverture (ex. preuves de la vue) n’y est admis que s’il reste **visuellement subordonné** au bloc de contexte.

Le bandeau **prépare** la lecture ; il ne doit **pas concurrencer** la grille cockpit. Les éléments secondaires (recherche globale, dernière mise à jour, métadonnées techniques) ne sont ajoutés qu’à condition de rester **subordonnés** ; le **thème d’affichage** est exposé hors bandeau, dans le rail latéral section **Outils** (réglage préférence locale clair / sombre), et non dans **Session**.

**Vocabulaire affiché** : le premier sélecteur de contexte porte le libellé **Tenant** (aligné §2.8), pour éviter l’écart entre langage produit, fonctionnel et technique (« Espace » n’est pas retenu comme libellé canonique du filtre).

#### 2.12.2 Wireframes texte — options de bandeau (référence)

**Option A — V1 canonique (base Lynki)** : ligne 1 = titre + session ; ligne 2 = tenant, société, période, année **uniquement**.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Pilotage                                                          [Avatar ▾] │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Tenant ▼]   [Société ▼]   [Période ▼]   [Année ▼]                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Option B** : même chose + badge **preuves** à droite de la ligne 2, **plus discret** que les filtres et que le titre (métadonnée de confiance, pas CTA).

**Option C** : recherche discrète sur la ligne 1 (centre ou avant l’avatar), sans dominer le titre ni le bloc contexte.

**Option D** : cumul recherche + **Dernière MAJ** sur la ligne 1 ; la MAJ doit rester une **note système** très faible, jamais un sous-titre de page ; badge preuves optionnel en ligne 2 comme en B.

**Ordre d’introduction recommandé** : valider **A** → activer **B** (badge) si besoin → **C** (recherche) si produit → **D** (MAJ) seulement si la fraîcheur doit être dans le bandeau.

*Principe lecture* : ligne 1 = *je me repère* ; ligne 2 = *je cadre ma lecture* ; ensuite = *je lis le cockpit*.

### 2.13 Navigation latérale — périmètre initial

La **navigation latérale** (rail gauche) ne doit pas anticiper des modules fonctionnels non spécifiés ni court-circuiter la logique cockpit **Dashboard → Pilotage → tuile → vue de détail**.

À ce stade du produit, les entrées latérales visibles de Lynki se limitent aux familles suivantes.

**Dashboard**

* **Pilotage** — accès à la vue cockpit et à ses vues de détail accessibles depuis les tuiles (ex. détail Trésorerie depuis la tuile Trésorerie, et non depuis un intitulé métier autonome dans le rail).
* **Synthèse comptable** — accès à la vue de restitution comptable décrite au §4.

**Outils**

* **Lexique** — ressources de lecture et vocabulaire pilotage.
* **Aide** — support utilisateur.
* **Thème** — bascule clair / sombre (préférence d’affichage locale ; hors périmètre « session » au sens authentification).

**Session**

* **Déconnexion** — action de fin de session.

Toute autre entrée latéraire (domaines métier type ventes, achats, banque, facturation, etc.) relève d’un **périmètre ultérieur** : elle ne doit pas être exposée tant qu’elle n’est pas décrite et positionnée dans ce cahier des charges, afin d’éviter une promesse produit incompatible avec l’espace de lecture prioritaire du Dashboard.

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

#### Rôle de lecture par classe

* Les **trois premières** tuiles (Classe A) portent la **lecture prioritaire** du cockpit.
* Les **cinq suivantes** (Classe B) **expliquent**, **qualifient** ou **prolongent** la lecture principale.
* Les **quatre dernières** (Classe C) **contextualisent** sans prendre le dessus sur A et B.

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
