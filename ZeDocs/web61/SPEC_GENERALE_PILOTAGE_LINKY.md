# Spécification générale — cockpit Pilotage (Lynki)

**Fichier canonique :** `ZeDocs/web61/SPEC_GENERALE_PILOTAGE_LINKY.md`  
**Version :** 0.6.2 — mars 2026  
**Statut :** brouillon — **§8.0** doctrine multi-régimes ; **§8.3** / **§17** alignés (tactile assumé, hors périmètre adouci) ; **§7.6** bandeau ; CDCF **§3.18–§3.20** ; cadrage / maquettes phone & tablette ; tickets tactiles **EXECUTION_TICKETS_TACTILE_LINKY v0.2**  
**Portée :** vue **Pilotage** (cockpit)  
**CDCF de référence :** [`cdcf.md`](./cdcf.md)  
**Rôle :** pont **normatif exploitable** entre le CDCF et les specs filles ; ne substitue pas au CDCF (**§2.2** ci-dessous).

---

## 1. Objet du document

La présente spécification générale décrit le fonctionnement, la structure et les règles d’interface de la vue **Pilotage** de Lynki.

Elle a pour rôle de :

* traduire le cahier des charges fonctionnel en règles de conception plus directement exploitables ;
* fixer la structure générale du cockpit Pilotage ;
* préciser la hiérarchie de lecture, les comportements communs et les régimes d’écran ;
* servir de socle aux spécifications dérivées, notamment celles des **tuiles maîtresses** et des **vues détail**.

Cette spec ne remplace pas le CDCF : elle en constitue un document d’application.

---

## 2. Position documentaire et primauté

### 2.1 Hiérarchie documentaire

L’ordre de référence est le suivant :

1. **CDCF Lynki** — loi produit
2. **SPEC_GENERALE_PILOTAGE_LINKY** — spécification générale cockpit
3. **Specs filles** — instruments, détails, composants ou comportements spécialisés
4. **Backlog / tickets / recette** — mise en œuvre et validation

### 2.2 Règle de primauté

En cas d’écart sur le fond fonctionnel entre la présente spécification et le CDCF, **le CDCF prime**.

En cas d’écart entre une spec fille et la présente spécification générale, **la présente spécification prime**, sauf décision produit documentée.

### 2.3 Documents liés

La présente spécification s’articule notamment avec :

* **[`cdcf.md`](./cdcf.md)** — loi produit ;
* **[`CADRAGE_VERSION_MOBILE_LYNKI.md`](./CADRAGE_VERSION_MOBILE_LYNKI.md)** — cadrage d’application **phone** (complément **CDCF §3.19**, navigation, header, grammaire carte) ;
* **[`SPEC_CARTES_MAITRESSES_LINKY.md`](../web60/SPEC_CARTES_MAITRESSES_LINKY.md)** — exécution des **trois** tuiles **Classe A** ;
* **[`DOCTRINE_ETATS_UI_LINKY.md`](../web60/DOCTRINE_ETATS_UI_LINKY.md)** — norme d’états et badges (complément **§13–§14** ci-dessous) ;
* les futures specs dédiées aux instruments **B / C** ou vues détail ;
* recette / exécution Web60 ([`RECETTE_WEB60_LINKY.md`](../web60/RECETTE_WEB60_LINKY.md), [`EXECUTION_TICKETS_WEB60_LINKY.md`](../web60/EXECUTION_TICKETS_WEB60_LINKY.md)) ;
* exécution refonte **tactile** phone + tablette ([`EXECUTION_TICKETS_TACTILE_LINKY.md`](./EXECUTION_TICKETS_TACTILE_LINKY.md) **v0.2** — tickets **T-PH-xxx** / **T-TB-xxx**, journal d’implémentation §8).

### 2.4 Index des renvois vers le CDCF

| Thème (cette spec) | Sections CDCF |
|--------------------|----------------|
| Vue Pilotage, objet, finalité | **§3.1–§3.3** |
| Structure (rail, bandeau, grille, footer) | **§3.4**, **§2.13**, **§2.12.1** |
| 12 tuiles, classes **A / B / C** | **§3.6**, **§3.13** |
| Contexte Tenant → Année | **§2.8–§2.11** |
| Bandeau cockpit (zones, principes) | **§2.12.1**, **§2.12.2** |
| **Famille bureau** — grand desktop + desktop compact / laptop | **§2.12.1**, **§3.18** (dont tableau **§3.18.9**) |
| **Phone mobile** (persona Max) | **§3.19** |
| **Tablette / iPad** | **§3.20** |
| Ordre de lecture cockpit | **§3.12** |
| Grammaire minimale d’une tuile | **§5** |
| États UX, confiance (vue) | **§3.15**, **§3.16** |
| Navigation cockpit → détail | **§3.14** |

### 2.5 Renvois vers la spec cartes maîtresses (Web60)

Document : [`SPEC_CARTES_MAITRESSES_LINKY.md`](../web60/SPEC_CARTES_MAITRESSES_LINKY.md).

| Sujet | Sections |
|-------|----------|
| Doctrine **commune** aux trois cartes | **§3**, **§4** |
| **Trésorerie** | **§5** |
| **Business** | **§6** |
| **Flux net** | **§7** |
| Règles transverses (contenu, placement, couleur) | **§8–§10** |

Les sections **§11–§14** de la spec cartes (implémentation, recette, décisions Web60) et la suite documentaire **§15+** complètent la validation sans dupliquer la présente spec générale.

---

## 3. Objet de la vue Pilotage

### 3.1 Définition

La vue **Pilotage** constitue le cockpit principal de Lynki.

Elle doit permettre à l’utilisateur de lire rapidement la situation de l’entreprise dans un contexte défini, à partir de données qualifiées, hiérarchisées et actionnables.

### 3.2 Finalité

La vue Pilotage a pour finalité de :

* fournir une lecture immédiate de la situation ;
* mettre en évidence les grands équilibres ;
* signaler les tensions, anomalies ou fragilités ;
* orienter l’utilisateur vers les détails utiles ;
* maintenir une lecture sincère sur le niveau de confiance de l’information.

### 3.3 Formule de référence

> **Pilotage = lire pour décider.**

---

## 4. Utilisateurs cibles

La vue Pilotage s’adresse principalement à :

### 4.1 Max

Lecture rapide, décisionnelle, orientée synthèse et priorités.

### 4.2 Véréna

Lecture opérationnelle et financière, plus régulière, avec besoin de signaux fiables et de continuité vers le détail.

### 4.3 Positionnement commun

Quel que soit l’utilisateur, la vue Pilotage ne doit pas devenir :

* une balance comptable ;
* un tableau exhaustif ;
* un module expert sans hiérarchie ;
* une page de détail déguisée.

---

## 5. Structure générale de la vue

La vue Pilotage se compose des blocs suivants :

1. **Rail latéral**
2. **Bandeau / header global de contexte**
3. **Espace de respiration ou de liaison sous bandeau**
4. **Grille cockpit**
5. **Prolongements éventuels sous grille**
6. **Footer système**

### 5.1 Rail latéral

Le rail latéral porte la navigation de premier niveau :

* Dashboard / Pilotage
* Dashboard / Synthèse comptable
* Outils
* Session

Sa largeur, sa densité et son comportement peuvent varier selon le palier d’écran.

### 5.2 Bandeau de contexte

Le bandeau constitue la barre maîtresse de contexte du cockpit.
Il prépare la lecture ; il ne concurrence pas les tuiles maîtresses.

### 5.3 Grille cockpit

La grille cockpit est le cœur de la vue Pilotage.
Elle porte les 12 instruments répartis selon la hiérarchie **A / B / C**.

### 5.4 Prolongements sous grille

Des blocs complémentaires peuvent apparaître sous la grille pour assurer la continuité de lecture :

* liens vers détail ;
* alertes ;
* signaux ;
* futurs blocs transverses.

### 5.5 Footer système

Le footer système regroupe les éléments techniques ou transverses non concurrents de la lecture cockpit.

---

## 6. Contexte global de lecture

### 6.1 Rôle

Toute lecture du cockpit est conditionnée par le contexte actif.

### 6.2 Paramètres de contexte

Le contexte comprend au minimum :

* **Tenant**
* **Société**
* **Période**
* **Année**

### 6.3 Règle générale

Toute donnée visible dans la vue Pilotage doit être interprétée à partir de ce contexte.

### 6.4 Effets des changements de contexte

Toute modification de Tenant, Société, Période ou Année doit entraîner :

* une mise à jour cohérente de l’état courant ;
* un recalcul des données affichées ;
* le maintien d’un état lisible et complet.

---

## 7. Bandeau / header du cockpit

### 7.1 Objet

Le bandeau du cockpit Pilotage organise la lecture du contexte et de la vue active.

### 7.2 Composition fonctionnelle

Le bandeau comporte trois zones :

* **zone gauche** : vue active / titre de page ;
* **zone centre** : sélecteurs de contexte ;
* **zone droite** : notification et bloc session.

### 7.3 Principe de composition

Le bandeau doit être lu comme **une composition unique**, même si ses contenus portent deux niveaux de sens :

1. orientation ;
2. contexte.

### 7.4 Principes UX

Le bandeau :

* prépare la lecture ;
* ne doit pas voler l’attention aux cartes maîtresses ;
* doit rester stable ;
* doit conserver une hiérarchie nette.

### 7.5 Éléments admis / non admis

Admis :

* vue active ;
* sélecteurs de contexte ;
* bloc session ;
* cloche / notification discrète ;
* éventuels signaux secondaires strictement subordonnés.

Non admis sans arbitrage :

* surcharge de métadonnées ;
* densité technique excessive ;
* recherche dominante ;
* signaux de confiance concurrents du cockpit.

### 7.6 Comportement figé — zone centre (implémentation de référence, mars 2026)

Les règles ci-dessous **figent** le comportement livré sur le **lab** (`ReportHeaderContentBody`, mode `cockpitAppBar`) pour la recette et les évolutions ; elles **complètent** le CDCF **§2.12.1** sans s’y substituer.

* **Alignement horizontal avec le corps** : marges latérales du bandeau calées sur le `main` cockpit fusionné (`DashboardWithFilters`) pour une même colonne visuelle titre / cartes.
* **Grille desktop** : trois colonnes dès **`md` (900px)** — titre **Vue active / Pilotage** | filtres | cloche + session.
* **Centrage des quatre coquilles** : sur desktop, l’ensemble **Tenant · Société · Période · Année** est **centré** dans la colonne du milieu (`justify-center`, largeur du groupe en `w-auto`, pas d’étirement sur toute la `1fr`).
* **Groupement** :
  * **Tenant** et **Société** dans une sous-zone à **défilement horizontal** si la place manque ;
  * le conteneur de cette sous-zone ne doit **pas** être compressé par le flex au point de **tronquer** la société (`shrink-0` sur le ruban scroll) ;
  * **Période** et **Année** dans un **bloc fixe adjacent** (même `gap` qu’entre les autres coquilles, pas d’écart artificiel entre Période et Année).
* **Année** : coquille à **largeur fixe** raisonnable ; libellé et valeur **centrés** dans la coquille.
* **Période** : **largeur max** plus faible que par le passé pour **équilibrer** avec Société ; texte tronqué possible sur la valeur avec **infobulle** (`title`) reprenant le libellé complet.
* **Couleur** : **Période** en **style neutre** (libellé `muted`, valeur `text`), comme **Société** et **Année** — **pas** d’accent réservé au seul filtre Période (écart volontaire par rapport à la maquette statique `carole_suggest_01.html` qui explorait l’accent sur Période).
* **Signaux secondaires** : si le bloc **Confiance** est affiché (`COCKPIT_HEADER_SHOW_TRUST_IN_CONTEXT_STRIP`), il suit les filtres dans le **même** groupe flex centré.

**Fichiers de code** : `components/ReportHeaderContentBody.tsx`, `components/DashboardWithFilters.tsx`, `components/CockpitDesktopView.tsx`, `tailwind.config.js` (breakpoint `xl` étendu pour la grille secondaires cockpit), `app/lib/cockpit/cockpit-typography.ts`, `components/cockpit/CockpitMasterKpiValue.tsx`.

---

## 8. Régimes d’écran

### 8.0 Quatre régimes, deux familles — doctrine Lynki

Lynki distingue **quatre régimes d’écran** pour la vue **Pilotage**. Ils ne forment **pas** une simple **échelle de réduction continue** : ce sont **quatre compositions** adaptées à des contextes de lecture différents.

> **Lynki repose sur quatre régimes d’écran distincts : Desktop, Laptop, Tablette et Phone. Ces régimes ne constituent pas une simple échelle de réduction continue, mais quatre compositions adaptées à des contextes de lecture différents.**

> **Desktop et Laptop relèvent de la famille bureau ; Tablette et Phone relèvent de la famille tactile.**

**À ne surtout pas casser — famille bureau.** Les régimes **Desktop** et **Laptop** sont le **socle** du Pilotage sur poste de travail. Ils ne doivent **pas** être absorbés dans une seule courbe « responsive » ni dégradés au profit des paliers tactiles : chacun garde sa **composition explicite** (ample vs dense). Le **Laptop** n’est **pas** un desktop ratatiné : c’est un **cockpit dense tenu** (**§3.18**, **§8.2**, **§8.4**). Toute livraison touchant le bandeau, le rail ou la grille doit **vérifier** ces deux paliers avant de valider.

**Lecture synthétique**

| Famille | Régimes | Logique dominante |
|---------|---------|-------------------|
| **Bureau** | **Desktop** | Cockpit **ample**, bandeau riche, hiérarchie **A / B / C** pleinement lisible |
| **Bureau** | **Laptop** | Cockpit **dense** : rail et bandeau resserrés, grille compacte, **sans** chevauchements ni « desktop cassé » |
| **Tactile** | **Tablette** | **Cockpit tactile compact** : encore panoramique et structuré, recomposition pour éviter la saturation horizontale (**§3.20**) |
| **Tactile** | **Phone** | **Cockpit priorisé** (persona **Max**) : **A** d’abord, alertes puis **B** / **C**, contexte compact, navigation mobile simple (**§3.19**) |

**Formulation opérationnelle**

> **Desktop / Laptop / Tablette / Phone = quatre régimes, deux familles, une même grammaire produit (A / B / C, contexte, confiance, continuité vers le détail).**

**Implications de synthèse**

| Sujet | Desktop | Laptop | Tablette | Phone |
|-------|---------|--------|----------|-------|
| **Header** | Riche, centré, stable | Plus dense, calibré | Recomposé, tactile | Simplifié, **non** miniaturisé desktop |
| **Grille** | Ample | Serrée mais stable | Compacte tactile | Empilement **priorisé** |
| **Navigation** | Rail | Rail | Rail compact ou schéma adapté | Navigation mobile (ex. bottom nav) |
| **Priorité de lecture** | Cockpit complet | Cockpit complet | Cockpit complet | **A** d’abord, suite ensuite |

**Normes détaillées (CDCF)**

* **Bureau** — **grand desktop** et **desktop compact / laptop** : **[`cdcf.md`](./cdcf.md) §2.12.1**, **§3.18** (exigences détaillées du palier compact / laptop ; rappel **grand desktop** au **§3.18.9** et bandeau **§2.12.1**).
* **Phone mobile** : **[`cdcf.md`](./cdcf.md) §3.19**.
* **Tablette / iPad** : **[`cdcf.md`](./cdcf.md) §3.20**.

### 8.1 Grand desktop

Le grand desktop constitue le régime de référence le plus ample :

* rail plus large ;
* bandeau plus généreux ;
* cockpit plus respirant ;
* tuiles A fortement valorisées.

### 8.2 Desktop compact / laptop

Le mode **desktop compact / laptop** constitue un **palier produit dédié** : il ne correspond pas à un simple grand desktop réduit (voir **§3.18** du CDCF).

En résumé pour l’implémentation :

* rail plus étroit ;
* bandeau plus dense ;
* sélecteurs de contexte à largeur contrôlée ;
* écart sous bandeau réduit ;
* tuiles A resserrées ;
* éventuelle réorganisation contrôlée de la grille.

### 8.3 Phone mobile et tablette / iPad

Les régimes **phone mobile** et **tablette / iPad** sont reconnus ici comme des **régimes à part entière** du cockpit **Pilotage** (voir **§8.0** : famille **tactile**). Leur **norme détaillée** reste portée par le **CDCF** et par les **documents de cadrage** / maquettes associés ; la présente spec en rappelle la **place dans l’architecture d’ensemble** et les renvois normatifs :

* **§3.19** — Mode **phone mobile** — persona **Max**
* **§3.20** — Mode **tablette / iPad**

**Cadrage d’implémentation (phone)** — bottom nav, header à deux niveaux, séquence verticale, exclusions : **[`CADRAGE_VERSION_MOBILE_LYNKI.md`](./CADRAGE_VERSION_MOBILE_LYNKI.md)** (maquette **[`references/carole_suggest_02.html`](./references/carole_suggest_02.html)**).

**Maquette statique (tablette / iPad)** — lecture cockpit plus panoramique, alignée **§3.20** : **[`references/carole_suggest_03.html`](./references/carole_suggest_03.html)**.

### 8.4 Verdict produit — distinction **grand desktop** vs **desktop compact / laptop** (mars 2026)

Synthèse de recette : les deux régimes sont **lisiblement distincts** — ce n’est plus un seul layout qui se déforme, mais **deux paliers** qui gardent la même identité avec des **densités** différentes, **sans rompre** la hiérarchie **A / B / C**.

**Ce que montre le grand desktop**

* header plus aéré ;
* les quatre sélecteurs de contexte tiennent proprement ;
* la grille cockpit laisse davantage de tuiles visibles ;
* les prolongements sous la grille (ex. détail Trésorerie, alertes) respirent avec l’ensemble ;
* lecture ample, ton « bureau ».

**Ce que montre le desktop compact / laptop**

* rail plus contenu ;
* header plus dense ;
* le groupe de contexte se compresse sans perdre la **composition unique** du bandeau ;
* les trois tuiles **A** et les cartes **B** restent crédibles ;
* sensation d’un **vrai mode compact**, pas d’un desktop écrasé.

**Formulation cible (une phrase)** : on distingue enfin une **version desktop** et une **version laptop**, au lieu d’un seul layout qui se déforme.

**Prochain pas documentaire** : figer **deux captures** (ou exports figés) comme références officielles — **référence grand desktop** et **référence desktop compact / laptop** — puis en déduire les **derniers réglages normatifs** (header, grille) dans le CDCF **§3.18** et la présente spec.

**Points à surveiller en itération**

1. **Header laptop** — **Société** reste la plus vulnérable à la compression ; les coquilles approchent leur limite ; le bloc central peut encore se comporter très « desktop ». Pistes : formaliser un **2 + 2** (deux paires de coquilles) ou des **largeurs plus strictement calibrées** par palier.
2. **Prolongements bas** — à partir de quel seuil la ligne **Détail Trésorerie** + **Alertes & signaux** reste sur **une** ligne ou doit **empiler** / se réorganiser (à trancher et documenter).
3. **Tuiles C en laptop** — quand moins de tuiles sont visibles d’un coup, veiller à ce que la lecture ne se réduise pas à un « haut de grille A+B » **sans** narration de contexte pour la **classe C**.

---

## 9. Référentiel cockpit — 12 tuiles

La vue Pilotage repose sur un référentiel canonique de **12 tuiles**.

### 9.1 Classe A — Tuiles maîtresses

1. Trésorerie
2. Business
3. Flux net

### 9.2 Classe B — Tuiles intermédiaires

4. Paiements
5. BFR
6. Encours
7. Taxes
8. EBE

### 9.3 Classe C — Tuiles de contexte

9. Notes de crédit
10. Remboursements
11. Points de vente
12. Z de caisse

### 9.4 Rôle de lecture

* **Classe A** : lecture prioritaire du cockpit ;
* **Classe B** : explication, qualification, prolongement ;
* **Classe C** : contextualisation.

**CDCF** : liste canonique et primauté — **[`cdcf.md`](./cdcf.md) §3.6** ; hiérarchie visuelle — **§3.13**.

---

## 10. Hiérarchie de lecture cockpit

### 10.1 Ordre général

L’ordre de lecture attendu est :

1. bandeau / contexte ;
2. grille cockpit ;
3. identification des priorités ;
4. accès au détail ;
5. retour au cockpit.

### 10.2 Hiérarchie visuelle

La hiérarchie visuelle doit traduire explicitement la hiérarchie A / B / C.

### 10.3 Règle

Aucune carte de classe B ou C ne doit prendre visuellement le dessus sur les cartes de classe A, sauf état exceptionnel explicitement documenté.

---

## 11. Grammaire commune des tuiles

**CDCF** : grammaire fonctionnelle minimale d’une tuile — **[`cdcf.md`](./cdcf.md) §5**.

Toute tuile du cockpit doit comporter, au minimum :

1. un intitulé ;
2. une valeur principale ;
3. un contexte d’interprétation ;
4. un état de disponibilité ;
5. un signal de confiance ;
6. un accès au détail si applicable.

### 11.1 Règles générales

Une tuile :

* ne doit pas multiplier les valeurs dominantes ;
* ne doit pas se transformer en mini page de reporting ;
* doit préserver une lecture immédiate ;
* doit rester sincère sur la qualité de l’information.

### 11.2 Variabilité par classe

La grammaire commune s’applique à toutes les tuiles, mais son intensité varie selon la classe :

* **A** : plus forte présence ;
* **B** : présence intermédiaire ;
* **C** : présence plus légère.

---

## 12. Tuiles maîtresses

### 12.1 Rôle spécifique

Les tuiles maîtresses forment la colonne vertébrale de la lecture cockpit.

### 12.2 Référentiel

Les tuiles maîtresses sont :

* Trésorerie
* Business
* Flux net

### 12.3 Règle de cohérence

Ces trois tuiles doivent être alignées sur une même discipline de lecture :

* promesse claire ;
* hiérarchie interne stable ;
* niveau de preuve explicite ;
* accès au détail ;
* densité comparable.

### 12.4 Document de référence associé

Le détail d’exécution des trois cartes maîtresses est porté par **[`SPEC_CARTES_MAITRESSES_LINKY.md`](../web60/SPEC_CARTES_MAITRESSES_LINKY.md)** (sections **§5–§7** ; doctrine commune **§3–§4**). Tableau des renvois : **§2.5** ci-dessus.

---

## 13. États UX et disponibilité

**CDCF** : **[`cdcf.md`](./cdcf.md) §3.15** ; grammaire tuile **§5.7**. **Doctrine** : [`DOCTRINE_ETATS_UI_LINKY.md`](../web60/DOCTRINE_ETATS_UI_LINKY.md). **Spec cartes** : [`SPEC_CARTES_MAITRESSES_LINKY.md`](../web60/SPEC_CARTES_MAITRESSES_LINKY.md) **§4**.

La vue Pilotage et ses tuiles doivent gérer au minimum les états suivants :

* chargement ;
* vide ;
* partiel ;
* erreur ;
* nominal.

### 13.1 Principe

L’utilisateur ne doit jamais confondre :

* absence de donnée ;
* limite métier ;
* incident technique ;
* valeur nulle.

### 13.2 Règle de stabilité

Les changements d’état ne doivent pas casser la structure générale de lecture.

---

## 14. Doctrine de confiance

**CDCF** : **[`cdcf.md`](./cdcf.md) §3.16** ; signal de confiance au niveau tuile **§5.8**. **Doctrine** : [`DOCTRINE_ETATS_UI_LINKY.md`](../web60/DOCTRINE_ETATS_UI_LINKY.md).

### 14.1 Objet

La vue Pilotage doit rendre lisible le degré de confiance de l’information affichée.

### 14.2 Dimensions couvertes

Les signaux de confiance peuvent refléter :

* fraîcheur ;
* couverture ;
* disponibilité ;
* complétude ;
* niveau de consolidation.

### 14.3 Règle de sincérité

L’interface ne doit jamais suggérer un niveau de certitude supérieur à ce que les données permettent réellement.

### 14.4 Positionnement

Le signal de confiance doit être visible mais subordonné à la lecture métier principale.

---

## 15. Navigation cockpit → détail

**CDCF** : **[`cdcf.md`](./cdcf.md) §3.14** ; prolongements sous grille **§3.4.1**.

### 15.1 Principe

Chaque tuile ou bloc pertinent doit pouvoir constituer un point d’entrée vers une vue de détail dédiée.

### 15.2 Exigences

La navigation vers le détail doit :

* conserver le contexte global ;
* préserver la continuité de lecture ;
* rendre explicite la vue active ;
* offrir un retour simple vers le cockpit.

### 15.3 Règle produit

Le détail approfondit la lecture ; il ne doit pas rompre la compréhension acquise dans le cockpit.

---

## 16. Invariants UX

La vue Pilotage doit préserver :

* la rapidité de lecture ;
* la stabilité visuelle ;
* la hiérarchie des priorités ;
* la continuité cockpit / détail ;
* l’honnêteté sur la qualité de l’information.

Elle doit éviter :

* la surcharge ;
* les compositions ambiguës ;
* les signaux contradictoires ;
* la concurrence entre header et cartes maîtresses.

---

## 17. Hors périmètre de la présente spécification

La présente spécification fixe la **structure générale**, la **doctrine des régimes d’écran** (**§8.0**) et les règles cockpit communes. Elle **ne se substitue pas** aux normes et specs plus détaillées listées ci-dessous.

La présente spécification générale ne détaille pas :

* les spécifications instrument par instrument hors niveau général ;
* les vues détail spécialisées ;
* les contrats API détaillés ;
* les règles purement techniques d’implémentation ;
* le **détail normatif complet** des régimes **phone mobile** et **tablette / iPad** — la présente spec en rappelle le **positionnement général** (**§8.0**, **§8.3**) ; le **CDCF** (**§3.19**, **§3.20**) et les documents de cadrage / maquettes en portent l’exhaustivité opérationnelle.

Ces éléments relèvent de documents dérivés ou de sections normatives externes à la présente spec.

---

## 18. Principe directeur final

> **Le cockpit Pilotage Lynki doit être conçu comme une surface de lecture décisionnelle, hiérarchisée et sincère, où le contexte cadre la lecture, les cartes maîtresses portent la priorité, et les détails prolongent sans rompre.**
