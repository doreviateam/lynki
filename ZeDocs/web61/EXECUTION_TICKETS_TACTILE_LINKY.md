# EXECUTION_TICKETS_TACTILE_LINKY.md

**Version :** 0.9.4 — mars 2026  
**Statut :** brouillon de pilotage  
**Portée :** refonte tactile **Phone** + **Tablette / iPad** pour la vue **Pilotage**  
**Références :** [`cdcf.md`](./cdcf.md) §3.19–§3.20 · [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md) · [`CADRAGE_VERSION_MOBILE_LYNKI.md`](./CADRAGE_VERSION_MOBILE_LYNKI.md) · [`EXECUTION_TICKETS_WEB60_LINKY.md`](../web60/EXECUTION_TICKETS_WEB60_LINKY.md) (lab, Max / Véréna)

**Code principal :** `units/dorevia-linky/` — repères : `cockpit-layout.ts`, `DashboardWithFilters`, `CockpitMobileView`, `CockpitTabletView`, `ReportHeader` / `ReportHeaderContentBody` (`bandLayout`, `cockpitBandTablet`).

**Recette déploiement :** [lab.linky + laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026) · `./scripts/deploy-linky-lab.sh` sur l’hôte du lab · pied de page **UI** + hash.

---

## 0. Tableau synthèse — ID · Ticket · Priorité · Statut

| ID | Ticket | Priorité | Statut |
|----|--------|----------|--------|
| T-PH-001 | Simplifier le header mobile | P0 | En cours (voir bis) |
| T-PH-001 bis | Raccourcir et hiérarchiser le bandeau phone (lecture d’abord) | P0 | Fait (code — recette à confirmer) |
| T-PH-002 | Header phone aligné sur la grammaire iPad | P0 | En cours (recette §6) |
| T-PH-002 ter | Phone : **nav primaire = bottom nav** — burger **sans** Pilotage / Synthèse | P0 | Fait (code — recette) |
| T-PH-003 | Renforcer la carte Trésorerie sur phone | P0 | À faire |
| T-PH-004 | Recomposer la classe B sur phone | P1 | À faire |
| T-PH-005 | Reléguer proprement la classe C | P1 | À faire |
| T-PH-006 | Alléger navigation et footer mobile | P1 | Fait (code — recette à confirmer) |
| T-PH-007 | Reprioriser l’ordre de lecture mobile | P0 | À faire |
| T-TB-001 | Recomposer le bandeau tablette | P0 | En cours (architecture portée par bis / ter + Annexe A) |
| T-TB-001 bis | Raccord propre bandeau fusionné → première carte (tablette) | P0 | Fait (code — recette à confirmer) |
| T-TB-001 ter | Bandeau tablette deux rangées (marque · vue · filtres ; périmètre actif) | P0 | Réussi structurellement (code + Annexe A) — recette visuelle §5 cas |
| T-TB-002 | Micro-ajustement des coquilles filtres (largeurs mini / max) | P0 | Réussi côté code — **recette visuelle** (grille § T-TB-002) avant verdict final |
| T-TB-003 | Doctrine responsive Lynki (mobile / tablette / desktop) — chrome exclusifs | P0 | **Doctrine gelée** (recette produit) — ne pas rouvrir sans arbitrage |
| R-POL-Desktop | Polish visuel desktop (référence) — respirations, équilibre header / cartes / footer | P2 | À faire |
| R-POL-Laptop | Polish densité « desktop compact » — cartes, montants, confort header | P1 | À faire |
| R-POL-iPad | Polish présence tablette — occupation espace, moins « boîte centrée timide » | P1 | À faire |
| T-TB-004 | Ajuster la grille A tablette | P1 | À faire |
| T-TB-005 | Stabiliser la grille B tablette | P1 | À faire |
| T-TB-006 | Repositionner la classe C tablette | P2 | À faire |
| T-TB-007 | Recette tactile tablette | P1 | À faire |
| T-TB-008 | Stabiliser le bloc session tablette | P1 | À faire |

*Correspondance indicative avec l’ancien gréement numérique : T-PH-00x ≈ T-W61-TAC-10x, T-TB-00x ≈ T-W61-TAC-20x (voir fichier renvoi `EXECUTION_TICKETS_REFONTE_TACTILE_LINKY.md` si besoin).*

*Note numérotation : **T-PH-002** couvre désormais le **header phone** (grammaire iPad compactée) ; l’ancien contenu « ordre de lecture scroll » est **T-PH-007**.*

---

## 1. Objet

Le présent document organise les tickets d’exécution relatifs aux régimes tactiles de Lynki :

* **Phone**
* **Tablette / iPad**

Il vise à transformer les constats de recette en chantier structuré, sans mélanger :

* les problèmes de **priorisation mobile** ;
* les problèmes de **composition tablette**.

---

## 2. Doctrine de conduite

### 2.1 Phone

Le régime **phone** doit devenir une lecture :

* courte,
* priorisée,
* décisionnelle,
* centrée d’abord sur les tuiles **A**.

### 2.2 Tablette

Le régime **tablette / iPad** doit devenir un cockpit :

* tactile,
* compact,
* hiérarchisé,
* encore panoramique,
* sans effet « laptop tassé ».

### 2.3 Règle de conduite

Les chantiers **Phone** et **Tablette** doivent être exécutés séparément.  
Ils ne doivent pas être corrigés via une même série de micro-ajustements responsive.

### 2.4 Desktop

**Gel** du bandeau et de la grille **desktop** (≥ 1024, `bandLayout === "desktop"`) sauf régression bloquante.

### 2.5 Régimes exclusifs (T-TB-003)

Le découpage **mobile / tablette / desktop**, la matrice de visibilité (sidebar, burger, drawer, bottom nav, footers) et le **DoD** associé sont détaillés au ticket **§4 — T-TB-003** (doctrine responsive). T-TB-003 **complète** la règle §2.3 (Phone vs Tablette séparés) en imposant l’**exclusivité** des chromes par breakpoint.

### 2.6 Gel de la doctrine responsive (mars 2026)

**Constat recette produit :** les trois régimes sont **lisibles et distincts** (desktop = poste complet ; laptop = même logique desktop, plus tendu ; iPad = cockpit tablette sans sidebar, header dédié, footer compact).

**Règle :** ne **pas** rouvrir le débat architecture (breakpoints, sidebar, burger, bottom nav, matrice chrome) sans **décision produit explicite**. Les suites de travail sont des **tickets de polish séparés par régime** — voir **Annexe B — R-POL-***.

---

## 3. Tickets — Phone

### T-PH-001 — Simplifier le header mobile

**Objet**  
Réduire la sensation « interface d’abord » sur phone.

**Constat**  
Le header mobile reste trop chargé, trop haut, et concurrence la lecture métier.

**À faire**

* passer à un header en **deux niveaux maximum** ;
* niveau 1 : identité légère + vue active + action menu / session ;
* niveau 2 : résumé de contexte compact + point d’entrée unique vers modification ;
* supprimer l’exposition simultanée de plusieurs contrôles de contexte complets ;
* réduire la hauteur totale du header.

**Résultat attendu**

* Trésorerie remonte visuellement dans l’écran ;
* le header reste compréhensible sans écraser la lecture ;
* la logique mobile ne ressemble plus à un bandeau desktop miniaturisé.

**Critères de validation**

* la première carte maîtresse apparaît plus haut ;
* le contexte reste lisible ;
* aucun effet de surdensité perçue dans la zone haute.

**Priorité**  
P0

**Statut**  
En cours (complété partiellement par **T-PH-001 bis**)

---

### T-PH-001 bis — Raccourcir et hiérarchiser le bandeau phone (lecture d’abord)

**Objet**  
Passer d’un bandeau **propre** à un bandeau **directionnel** : Max doit voir d’abord une **situation**, pas un petit panneau de contrôle.

**Constat (recette)**  
Le phone reste un peu trop « administratif » en zone haute : bandeau encore un peu haut, contexte trop « texte système », actions ligne 1 un peu trop présentes.

**À faire**

1. Réduire encore la hauteur utile du header (padding vertical minimal, lignes serrées sans tassement illisible).
2. Renforcer l’ancrage **Pilotage** (taille / graisse / respiration) pour qu’il porte la séquence de lecture.
3. Transformer la ligne de contexte en **résumé lisible** (corps lisible au phone, pas micro-texte seul).
4. Questionner la **priorité** de chaque contrôle en ligne 1 (thème, sync, menu, badge…) : ne garder au premier plan que l’indispensable ; le reste peut descendre dans le menu ou un geste secondaire.
5. Rapprocher visuellement la **première carte maîtresse** du bloc utile sous le bandeau (padding du `main`, gaps colonne).

**Implémentation déjà en place (repères code)**

* `ReportHeaderContentBody.tsx` — bloc `pilotagePhoneCompact` : `pt-0.5`, titre `Pilotage` en `text-xl`, ligne contexte `text-sm font-medium`, actions `h-7`, thème `scale-90`, badge intégrité réduit.
* `DashboardWithFilters.tsx` — `cockpitPhonePilotage` : `main` avec `pt-0.5` lorsque chrome visible et bandeau compact phone.
* `CockpitMobileView.tsx` : `main` sans padding-top supplémentaire, espacement colonne / cartes resserré (`gap-3` selon dernier lot).

**Critères de validation**

* La question « Est-ce que Max voit d’abord une situation ? » tend vers **oui** ; le panneau de contrôle se sent secondaire.
* La première tuile **A** entre dans le champ visuel plus tôt qu’avant, sans régression d’accessibilité (zones tactile, contrastes).

**Priorité**  
P0

**Statut**  
Fait (code — mars 2026) · à **valider** en recette lab.

---

### T-PH-002 — Header phone aligné sur la grammaire iPad

**Fichier canonique — norme détaillée** : [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md) **§7.7** · **Annexe B** (header phone).  
**Ticket** `T-PH-002` · **Priorité** P0 · **Statut** En cours (**recette §6** avant clôture) · **Références** présent document, T-TB-001 ter, T-TB-002, **T-TB-003** (doctrine responsive) · **Complément** **`T-PH-002 ter`** (burger phone **≠** nav primaire) · **Code** : `ReportHeaderContentBody.tsx` — `pilotagePhoneCompact` + tiroir **`linky-tactile-nav-drawer`**, panneau Filtres ; **`DashboardWithFilters`** — résumé ligne 2 court.

#### 1. Objectif

Revoir le header phone pour l’aligner sur la **même famille visuelle et fonctionnelle** que le header iPad.

**Principe directeur**

> le header phone doit être une **version compactée** du header iPad,  
> et **non** un système distinct.

Le header phone doit continuer à exprimer : la **marque Lynki**, la **vue active**, le **niveau minimal de confiance**, le **contexte actif**, l’accès à la **navigation**, l’accès au **contexte métier**.

#### 2. Périmètre

**Inclus**

* définition du header phone cible ;
* alignement de la grammaire visuelle avec le header iPad ;
* compaction du chrome pour **`W < 768px`** ;
* conservation de **`Pilotage`** comme repère principal ;
* conservation du **burger** comme accès aux **outils et session** (phone : **pas** la navigation primaire — voir **T-PH-002 ter**) ;
* conservation d’un **badge compact** de preuves de la vue ;
* conservation d’un **repère d’entité active** ;
* **deuxième ligne** compacte de contexte métier ;
* ouverture des **filtres détaillés** via panneau / sheet si nécessaire ;
* recette sur les **largeurs phone** de référence.

**Exclus**

* refonte du **drawer** phone complet hors ajustements nécessaires au header ;
* refonte **large** du **footer** hors **T-PH-006** (bandeau métadonnées masqué phone, voir ticket) ;
* refonte de la **bottom navigation** ;
* évolution **backend** ;
* changement de **wording métier** des cartes.

#### 3. Règles

##### 3.1 Doctrine générale

Le header phone appartient à la **même famille** que le header tablette : marque, vue active, preuves, entité active, navigation, contexte métier — avec **compaction** et **priorisation** plus strictes.

##### 3.2 Structure générale — deux lignes maximum

**Ligne 1 — chrome principal** — ordre : `Marque compacte | Vue active | Spacer | Preuves | Entité active | Burger`.

**Ligne 2 — contexte métier** — admis : **résumé compact** du contexte **ou** rangée de chips / filtres scrollables. **Par défaut produit :** résumé + **édition détaillée via panneau / sheet**.

##### 3.3 Priorité d’information (si manque de place)

1. `Pilotage`  
2. burger  
3. preuves de la vue  
4. entité active minimale  
5. marque Lynki  
6. filtres détaillés visibles en permanence (à éviter)

**Conséquences** : `Pilotage` et burger **jamais** masqués ; preuves **si possible** ; marque **compactable** ; contexte détaillé **résumé**.

##### 3.4 Ligne 1 — détail

* **Marque** : pastille `DL` toujours ; `Lynki` si largeur ; **pas** de « Cockpit financier » sur phone ; bloc cliquable (accueil cockpit).  
* **Vue active** : `Pilotage` — toujours visible, **nowrap**, plus forte que la marque.  
* **Preuves** : badge compact (nombre ± mot court) ; pas de phrase type « preuves de la vue » ; détail en **tooltip / panneau**.  
* **Entité** : avatar ; libellé court si place ; **min** = avatar seul.  
* **Burger** : toujours visible, à droite, entrée drawer.  
* **Cloche** : **masquée par défaut** sur phone ; uniquement si largeur confortable **sans** sacrifier Pilotage / burger / preuves.

##### 3.5 Ligne 2 — contexte métier

**Variante recommandée** : une ligne, texte secondaire, **truncate** autorisé, tap → filtres (Tenant, Société, Période, Année).

**Variante secondaire** : chips scrollables — seulement si lisible ; sinon éviter.

##### 3.6 Filtres détaillés phone

Pas d’obligation d’exposition permanente dans le header ; accès via **ligne 2**, **drawer** ou **sheet** ; tactile, espacements suffisants, fermeture simple, cohérence avec sélecteurs tablette.

##### 3.7 Drawer tactile — tablette vs phone

* **Tablette** : tiroir **complet** — Pilotage, Synthèse comptable, Lexique, Aide, Thème, Déconnexion (overlay, pleine hauteur, scroll, fermeture accessible).
* **Phone — `T-PH-002 ter`** : la **navigation primaire** est la **bottom nav** (Pilotage, Synthèse). Le tiroir **ne duplique pas** ces entrées : il ne porte que **Outils** (Lexique, Aide) et **Session** (thème, déconnexion) ; en-tête du panneau **« Plus »** ; `aria-label` **« Outils et session »**.

#### 4. Implémentation

**Plage** : `W < 768px`.

**Structure cible (noms indicatifs)** : `MobileHeader` (ligne 1 + ligne 2) articulé avec **`MobileFilterSheet`** ; aujourd’hui porté par la branche **`pilotagePhoneCompact`** dans `ReportHeaderContentBody` (pas de refactor forcé en fichiers séparés tant que la norme **Annexe B** est respectée).

**CSS / structure — ligne 1** : `flex`, `items-center`, `gap` contrôlé, `min-w-0`, **`flex-nowrap`**. **Ligne 2** : `min-w-0`, `truncate`, hauteur compacte, texte secondaire. **Blocs** : marque / vue / preuves / burger **`shrink-0`** ; vue **`whitespace-nowrap`** ; entité **`min-w-0`** + truncate sur libellé. **Variante chips** : `overflow-x-auto`, `scrollbar-width: thin`, `-webkit-overflow-scrolling: touch`, `overscroll-x-contain`.

**Breakpoints internes** (alignés **SPEC Annexe B**) :

| Palier | Largeur | Indications |
|--------|---------|--------------|
| Phone serré | `< 390px` | `DL` seul ; preuves ultra compactes ; avatar seul ; ligne 2 courte |
| Phone standard | `390px ≤ W < 480px` | `DL` + Lynki si possible ; résumé synthétique |
| Phone confortable | `480px ≤ W < 768px` | `DL` + Lynki ; preuves plus lisibles ; avatar + libellé ; ligne 2 plus descriptive |

#### 5. DoD

**Fonctionnel** : même **famille** que header iPad ; `Pilotage` et burger **toujours** visibles ; preuves **compactes** ; entité **identifiable** ; ligne 2 **lisible** ; accès filtres ; drawer accessible.

**Visuel** : pas de **3e ligne** accidentelle ; badge preuves **sobre** ; entité **non dominante** ; pas de cloche **au prix d’une surcharge** ; pas d’apparence « header générique ».

**Technique** : branche phone **distincte** de la tablette ; compaction **explicite** ; pas de wrap implicite ; paliers **serré / standard / confortable** stables.

#### 6. Recette

**Breakpoints** : 360×800, 375×812, 390×844, 430×932, 480×932.

**Cas obligatoires** : ligne 1 (Pilotage, burger, preuves, marque, entité) ; ligne 2 (résumé **court** société · année, ouverture filtres) ; drawer **phone** sans liens Pilotage / Synthèse ; drawer **tablette** inchangé ; compaction ; **non-régression** : bascule Synthèse via **bottom nav**, session complète dans le tiroir phone.

#### 7. Résultat attendu

À l’issue de **T-PH-002** : header phone = **version compactée** du header iPad ; famille chrome **cohérente** phone ↔ tablette ; contexte métier **visible sans surcharge**.

#### 8. Journal — formulation courte

> T-PH-002 aligne le header phone sur la grammaire du header iPad en conservant marque, vue active, preuves, entité active et burger, avec une compaction plus forte et une seconde ligne de contexte métier synthétique, afin d’éviter un header mobile divergent du régime tablette.

---

### T-PH-002 ter — Phone : navigation primaire = bottom nav (burger sans Pilotage / Synthèse)

**Priorité** P0 · **Statut** Fait (code — recette à confirmer) · **Références** [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md) **§7.7**, **Annexe B.11** · **Code** `ReportHeaderContentBody.tsx`, `DashboardWithFilters.tsx`

#### 1. Régle produit

Sur **phone**, **Pilotage** et **Synthèse** sont assurés **uniquement** par la **barre de navigation basse**. Le **burger** ouvre un tiroir **« Plus »** limité à **outils** (Lexique, Aide) et **session** (thème, déconnexion) — **pas** de duplication des entrées de la bottom nav.

#### 2. Périmètre

* **Inclus** : adaptation du tiroir tactile quand `pilotagePhoneCompact` ; `aria-label` cohérents ; ligne 2 header : résumé **société · année** (détail période dans le panneau Filtres).
* **Exclus** : modification du tiroir **tablette** (section Dashboard inchangée).

#### 3. DoD

* Aucun lien **Pilotage** / **Synthèse** dans le tiroir **phone**.
* Bottom nav inchangée pour la navigation entre vues.
* Session (thème, déconnexion) toujours accessible depuis le tiroir phone.

#### 4. Journal — formulation courte

> T-PH-002 ter évite la double navigation phone en réservant Pilotage et Synthèse à la bottom nav et en réduisant le burger à outils et session.

---

### T-PH-007 — Reprioriser l’ordre de lecture mobile

**Objet**  
Faire entrer immédiatement l’utilisateur dans la lecture métier.

**Constat**  
Le parcours mobile ne met pas encore assez vite l’accent sur la séquence A → alertes → B → C.

**À faire**

* réduire l’espace entre le header et la première carte ;
* alléger ou supprimer les blocs d’introduction non indispensables ;
* imposer l’ordre mobile :

  1. Trésorerie  
  2. Business  
  3. Flux net  
  4. Alertes & signaux  
  5. Classe B  
  6. Classe C  

**Résultat attendu**  
Le phone donne d’abord une lecture de situation, puis une lecture d’approfondissement.

**Critères de validation**

* sans scroller, la lecture prioritaire est claire ;
* les cartes A dominent la première impression ;
* les alertes apparaissent avant les blocs secondaires.

**Priorité**  
P0

**Statut**  
À faire

*Ancien **T-PH-002** — renuméroté lors de l’introduction du ticket header phone (**T-PH-002**).*

---

### T-PH-003 — Renforcer la carte Trésorerie sur phone

**Objet**  
Consolider la dominance de la tuile maîtresse Trésorerie en régime mobile.

**Constat**  
La carte est bonne, mais sa hiérarchie peut encore être durcie.

**À faire**

* renforcer la séquence :

  * intitulé,
  * montant,
  * confiance / état,
  * couverture,
  * 1 à 2 signaux secondaires maximum ;
* réduire le bruit visuel dans le bas de carte ;
* vérifier la lisibilité du badge partiel / fiable ;
* maintenir un point d’entrée clair vers le détail.

**Résultat attendu**  
La carte Trésorerie se lit en quelques secondes, sans friction.

**Critères de validation**

* le montant domine réellement ;
* les informations secondaires ne parasitent pas la lecture ;
* la qualité de lecture reste sincère.

**Priorité**  
P0

**Statut**  
À faire

---

### T-PH-004 — Recomposer la classe B sur phone

**Objet**  
Éviter l’effet « mini grille desktop » sur les cartes intermédiaires.

**Constat**  
La classe B garde encore une logique trop proche d’une réduction desktop.

**À faire**

* tester grille 2 colonnes versus empilement partiel ;
* conserver B lisible mais clairement secondaire ;
* réduire la densité typographique si nécessaire ;
* homogénéiser la structure des cartes.

**Résultat attendu**  
Les cartes B prolongent la lecture des A sans entrer en concurrence.

**Critères de validation**

* la classe B reste lisible ;
* aucune carte B ne concurrence une carte A ;
* le rendu ne paraît pas tassé.

**Priorité**  
P1

**Statut**  
À faire

---

### T-PH-005 — Reléguer proprement la classe C

**Objet**  
Transformer la classe C en vraie couche de contexte secondaire.

**Constat**  
La classe C ne doit pas perturber la première lecture sur téléphone.

**À faire**

* regrouper C dans un bloc secondaire explicite ;
* utiliser un intitulé clair de type :

  * Contexte  
  * Autres indicateurs  
* replier ce bloc par défaut si nécessaire ;
* alléger encore le poids visuel des cartes C.

**Résultat attendu**  
La classe C reste présente sans perturber la lecture initiale.

**Critères de validation**

* C est accessible mais non prioritaire ;
* la lecture initiale reste dominée par A puis alertes ;
* aucun bruit visuel inutile en haut de parcours.

**Priorité**  
P1

**Statut**  
À faire

---

### T-PH-006 — Alléger navigation et footer mobile

**Objet**  
Maintenir les éléments système sans concurrencer le contenu principal.

**Constat**  
Le phone doit rester centré sur la lecture et non sur le système.

**Réalisé (mars 2026)**

* **`LinkyFooter`** : masqué sur **phone** (`< sm` / `hidden sm:block`) — plus de bandeau « Dorevia-Vault · … cumulées · Toucher pour détails » au-dessus de la bottom nav ; drawer **Confiance système** mobile supprimé avec ce bandeau.
* **`main`** : padding bas réduit sur phone (`max-sm:pb-[calc(5rem+env(safe-area-inset-bottom))]`) car l’empilement footer + bottom nav n’existe plus sur mobile.
* **Header phone** : badge `IntegrityBadge` en **`countLabelMode="compact"`** — libellé **« N preuves »** (vue) + rafraîchissement ; **§** SPEC Annexe B.6.3.

**À suivre (hors périmètre immédiat)**

* limiter les entrées visibles au strict utile si la bottom nav s’enrichit ;
* métadonnées système sur un écran secondaire si besoin produit.

**Résultat attendu**  
Le bas d’écran reste utile mais discret.

**Critères de validation**

* la navigation reste claire ;
* le footer ne remonte pas dans la hiérarchie de lecture ;
* les métadonnées système ne parasitent pas le cockpit.

**Priorité**  
P1

**Statut**  
Fait (code — mars 2026) · **recette** à confirmer sur lab.

---

## 4. Tickets — Tablette / iPad

### T-TB-001 — Recomposer le bandeau tablette

**Objet**  
Donner au bandeau tablette une vraie tenue propre au régime tactile intermédiaire.

**Constat**  
Le bandeau tablette est fonctionnel, mais évoque encore trop un laptop tassé.

**À faire**

* choisir explicitement une composition tablette :

  * soit **2 + 2** pour les filtres,
  * soit une autre organisation clairement assumée ;
* stabiliser le rapport titre / filtres / session ;
* éviter tout retour à la ligne subi ;
* réduire l’impression de desktop comprimé.

**Résultat attendu**  
Le bandeau paraît composé, tactile et crédible.

**Critères de validation**

* le bandeau n’évoque plus un layout « qui tient comme il peut » ;
* la lecture gauche / centre / droite reste nette ;
* la session ne casse pas le rythme du bloc.

**Priorité**  
P0

**Statut**  
En cours (le raccord grille est traité par **T-TB-001 bis** ; composition « noble » du bandeau reste ouverte)

---

### T-TB-001 bis — Raccord propre bandeau fusionné → première carte (tablette)

**Objet**  
Sur tablette, avec bandeau **fusionné**, supprimer l’impression que la première carte **remonte sous** ou **mord** la zone du haut : tenir la **couture** entre la réserve du header et le début de la grille cockpit.

**Constat (recette)**  
Le header fusionné existe, mais le passage vers la grille n’est pas encore « tenu » : overlap apparent ou respiration insuffisante sous le bandeau fixe.

**À vérifier / corriger dans le code**

* hauteur du **spacer** synchronisée avec le shell mesuré (`ResizeObserver`) ;
* **hauteur réservée** (`cockpitMergedShellPx`, secours `cockpitMergedShellFallbackPx`) cohérente avec le bandeau réel ;
* **padding-top** du contenu (`<main>`) en régime tablette + `cockpitMergedHeader` ;
* risque d’**overlap** entre header fixe (`position: fixed` / sticky selon implémentation) et le haut de la première carte ;
* interactions avec **max-height**, **scroll**, **shell** cockpit si le bandeau change de hauteur (filtres, lignes conditionnelles).

**Implémentation déjà en place (repères code)**

* `DashboardWithFilters.tsx` : si `cockpitMergedHeader && cockpitLayoutMode === "tablet"`, **surcroît** `tabletRibbonGapPx` (actuellement **14 px**) ajouté à la hauteur mesurée du shell pour la réserve scroll ; `main` en **pt-3 md:pt-4** pour la tablette fusionnée (vs **pt-1 md:pt-2** desktop fusionné).

**Critères de validation**

* Aucune sensation nette de **recouvrement** carte / bandeau.
* Le premier bloc de grille respire **au même rythme** que la tablette (pas « collé » ni « trou » brutal).
* Resize / ouverture contextuelle du bandeau ne casse pas le raccord (pas de saut visible permanent).

**Priorité**  
P0

**Statut**  
Fait (code — mars 2026) · à **valider** en recette lab ; affiner `tabletRibbonGapPx` / `pt-*` si la capture montre encore une couture serrée.

---

### T-TB-001 ter — Bandeau tablette deux rangées (marque · vue · filtres ; périmètre actif)

**Objet**  
Lorsque la **sidebar desktop** n’assure plus l’ancrage marque, le bandeau tablette / iPad doit être un **header autonome** : plus de grille « desktop cassée » ni wrap implicite qui mélange titre, filtres et session.

**Rangée 1 (fixe)** — de gauche à droite : **bloc marque** (logo « DL » + nom produit + sous-texte *Cockpit financier* discret dès `sm`) ; **vue active** *Pilotage* ; **filtres** groupés (Tenant, Société, Période, Année) + badge confiance si activé ; **actions** utilitaires (cloche). Pas de session sur cette rangée.

**Rangée 2 (fixe, volontaire)** — **périmètre actif** uniquement : initiale / avatar, libellé entité (ex. La Platine), badge identifiant tenant (ex. `laplatine2026`). Compact, sans rivaliser avec les filtres.

**Formulation produit**

> En mode iPad, le header Lynki adopte une structure tablette dédiée sur deux rangées.  
> La première rangée affiche la marque Lynki, la vue active, les filtres de contexte et les actions utilitaires.  
> La seconde rangée affiche uniquement l’identité du périmètre actif.  
> Cette composition remplace tout wrapping implicite du header desktop et garantit à la fois ancrage produit, lisibilité de la vue et stabilité du contexte.

**Règles UX synthétiques**

1. La marque (logo + nom) est visible dès que la sidebar ne porte plus seule le produit.  
2. *Pilotage* reste plus important visuellement que la ligne périmètre.  
3. Les quatre filtres restent groupés (`flex-nowrap` + défilement horizontal si tension).  
4. La seconde ligne est un choix de composition, pas un repli du wrap.  
5. Hauteur globale compacte ; une troisième ligne optionnelle peut accueillir le libellé métier de période (pastilles clôture) sous forme de bandeau discret.

**Implémentation (repères code)**

* `ReportHeaderContentBody.tsx` — branche `cockpitBandTablet` : `Link` accueil (`navHrefWithTenant`), bloc marque aligné **Sidebar** ; `h1` *Pilotage* ; `cockpitCaroleFilterCenter` en `flex-1 min-w-0` ; notifications seules en fin de rangée 1 ; rangée 2 avec initiale + `tenantDisplayLabel` + badge `tenantId`.  
* Filtres : conteneur `cockpitCaroleFilterCenter` en `flex-nowrap` + scroll horizontal pour éviter l’éclatement.

**Priorité**  
P0

**Verdict produit (mars 2026)**  
**T-TB-001 ter** peut être considéré comme **structurellement réussi** : architecture cockpit, **Annexe A** comme contrat technique opposable, ajustements de code ciblés (sans bricolage lourd). Il ne manque plus que la **recette visuelle sous contrainte** (pas de nouveau chantier d’architecture).

**Recette prioritaire — 5 cas à valider avant de clore définitivement**

1. **Nom de société long** (sélecteur + troncature / `title`).  
2. **`tenantDisplayLabel` long** (rangée 2, ellipsis + survol).  
3. **iPad portrait à 768 px** (largeur minimale tablette).  
4. **Zone ~900–950 px** (souvent la plus piégeuse).  
5. **Zoom navigateur** à **110 %** et **125 %** (lisibilité sans casse du bandeau).

**Statut**  
Code livré + norme **Annexe A** · **recette** : passer les 5 cas ci-dessus sur lab / device réel.

#### Annexe A (norme technique) — Plage tablette, breakpoints, troncature et scroll filtres

**Portée** — Régime **tablette / iPad** du bandeau pilotage fusionné : largeur viewport **`768 px ≤ W < 1024 px`** (aligné sur `getCockpitLayoutMode` : seuil bas = `CHROME_BREAKPOINT_MOBILE_PX` **768**, seuil haut = `COCKPIT_LAYOUT_DESKTOP_MIN_PX` **1024**). Hors de cette plage, les règles ci-dessous ne s’appliquent pas telles quelles (phone &lt; 768, desktop ≥ 1024).

**Norme de composition (à respecter)**

> En plage tablette, la **rangée 1 ne wrap jamais**.  
> Le **groupe filtres** absorbe la contrainte horizontale par **défilement contrôlé** (`overflow-x: auto`, scroll tactile discret).  
> Les libellés **société** (sélecteur) et **tenant** (rangée 2) sont **tronqués** (`truncate` / `ellipsis`) avant toute recomposition verticale du bandeau.

| Sujet | Règle |
|--------|--------|
| Rangée 1 | Toujours **`flex-nowrap`** : marque, titre *Pilotage*, groupe filtres, cloche sur une seule ligne logique. |
| Marque + *Pilotage* | **Interdiction de wrap** sur le bloc marque et sur le titre *Pilotage* (`whitespace-nowrap` / largeurs plafonnées côté marque). |
| Groupe filtres | Conteneur **`min-w-0 flex-1`** + **`overflow-x-auto`** + scrollbar fine (`scrollbar-width: thin`) ; pas d’éclatement vertical des coquilles pour « gagner » de la place. |
| Priorité de largeur cible (si tension) | **Société** &gt; **Période** &gt; **Tenant** &gt; **Année** — c’est-à-dire : protéger d’abord la lisibilité du nom de société, puis la clé de période, puis réduire Tenant, garder Année la plus compacte. |
| **Min-width implémentés (T-TB-002)** | **768–899 px** : Tenant **120px**, Société **180px**, Période **140px**, Année **84px**. **≥ 900 px** (toujours &lt; 1024) : **132 / 200 / 152 / 88 px**. Coquilles en **`shrink-0`** ; groupe filtres en **`w-max`** dans le scroll parent. Sous-texte marque masqué sous **860 px** (`min-[860px]:block`). |
| Troncature | **Société** : `select` / coquille avec `truncate` + `title` sur la valeur affichée si besoin. **Rangée 2** : `tenantDisplayLabel` en `flex-1 min-w-0 truncate` + **`title`** reprenant le libellé complet pour survol / accessibilité. **Badge** `tenantId` : `truncate` dans un `max-width` pour ne pas pousser la ligne. |
| Scroll horizontal | Doit rester **discret** (scrollbar fine, pas de piste lourde) ; le utilisateur doit pouvoir faire défiler au doigt sans casser l’impression « cockpit ». Recette : portrait iPad, zoom navigateur 100 % et 125 %. |
| Hauteur cible | **Rangée 1** ≈ **48–56 px** utiles (hors bordures carte) ; **rangée 2** ≈ **36–44 px** ; **bande période comptable** (si présente) **une ligne** (~24–28 px padding compris) — elle ne doit pas **doubler** la hauteur perçue du header ; si trop haute, réduire typo / padding plutôt que wrap. |

**Recette express**

* Nom de société long (dummy) + `tenantDisplayLabel` verbeux : vérifier ellipsis et tooltips.  
* 768, ~900, 1023 px ; iPad portrait ; zoom navigateur.  
* Vérifier que le scroll filtres n’empiète pas sur la marque ni sur *Pilotage*.

**Repères code** — `ReportHeaderContentBody.tsx` (`cockpitBandTablet`), `cockpit-layout.ts`, `DashboardWithFilters.tsx` (réserve scroll / `main`).

---

### T-TB-002 — Micro-ajustement des coquilles de contexte tablette

**Objet**  
Affiner **uniquement** les **largeurs mini / max** et l’harmonie visuelle des coquilles (Tenant, Société, Période, Année) **après** recette sur les **5 cas** du **T-TB-001 ter**.  
Ce ticket **n’est plus un chantier d’architecture** : la grammaire du header et l’**Annexe A** sont verrouillées ; il s’agit de **polish** mesuré selon les retours visuels.

**Constat**  
Certaines coquilles peuvent encore paraître légèrement « desktop » sur certaines largeurs.

**Suite (après livraison code)**  
Passer la **grille de validation recette** ci-dessous ; n’utiliser les **ajustements possibles** qu’en fonction des captures / retours visuels.

**Résultat attendu**  
Le groupe filtres paraît équilibré sur **768–1023 px**, sans rouvrir la structure du bandeau.

**Priorité**  
P0

**Statut**  
**Réussi côté code** (mars 2026) : calibration livrée sans remise en cause du header ; **scroll horizontal porté par le parent de rangée 1** (pas de multiplication de micro-zones scrollables).

**Implémentation** — `ReportHeaderContentBody.tsx` : `min-width` par coquille + palier `min-[900px]:` ; groupe filtres `w-max` + coquilles `shrink-0` ; scroll parent `overflow-y-hidden` + `pb-1` ; rangée 2 badge `max-w-[120px]` + `title` sur `tenantId`.

**Verdict produit**  
**T-TB-002** reste un ticket de **calibration**, pas une remise en cause de l’architecture. La prochaine étape est uniquement la **recette visuelle** sur lab / appareil.

**Grille de validation recette (header iPad / tablette)**

| # | Cas | Attendu |
|---|-----|---------|
| 1 | **768 portrait** | Marque visible, *Pilotage* visible, filtres utilisables via **scroll horizontal** sans casse de rangée |
| 2 | **900 px** | Réapparition propre de la **respiration** (gaps, largeurs palier 900) et des **min-width** confortables |
| 3 | **1023 px** | Pas d’effet « bâtard » avant le basculement **desktop** (≥ 1024) |
| 4 | **Zoom 110 % / 125 %** | Pas de **3e ligne** parasite dans le bandeau |
| 5 | **Libellés longs** (société, `tenantDisplayLabel`, `tenantId`) | Troncature propre, **cloche** non écrasée |
| 6 | **Scroll tactile / trackpad** | Fluide, discret, compréhensible (on peut faire défiler les filtres) |

**Ajustements possibles — uniquement si la recette l’impose**

* `max-width` de la coquille **Société**  
* seuil d’affichage du sous-texte **Cockpit financier** (actuellement `min-[860px]`)  
* `gap` au palier **900 px**  
* largeur max du **badge** tenant  
* confort perçu du **scroll** (inertie / friction)

**Verdict final** — Après captures **768 / 900 / 1023** (+ grille ci-dessus) : soit **« header iPad validé »**, soit **« 2 micro-retouches restantes »** (sans rouvrir l’architecture).

---

### T-TB-003 — Doctrine responsive Lynki (mobile / tablette / desktop)

**Fichier canonique** — présent document · **Ticket** `T-TB-003` · **Priorité** P0 · **Statut** À faire · **Dépendances** T-TB-001 ter, T-TB-002 · **Références** [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md), Annexe A (§4 de ce fichier), doctrine UI Lynki · recoupement [`TICKET_RESPONSIVE_REGIMES_LYNKI.md`](./TICKET_RESPONSIVE_REGIMES_LYNKI.md)

#### 1. Objectif

Stabiliser définitivement le responsive Lynki en supprimant les **régimes hybrides** de chrome et de navigation.

Le ticket vise à figer **trois régimes exclusifs** :

* mobile  
* tablette  
* desktop  

afin d’éviter les cohabitations ambiguës entre sidebar desktop, burger, drawer, bottom navigation, header tablette, header desktop, footer compact et footer desktop.

**Principe directeur**

> un breakpoint = un régime principal de navigation et de chrome  
> un seul système de navigation primaire actif à la fois

#### 2. Périmètre

**Inclus**

* définition des breakpoints de régime ;
* activation **exclusive** des chromes mobile / tablette / desktop ;
* **suppression** de la sidebar visible sous **1024 px** ;
* **suppression** du burger et de la bottom navigation à partir de **1024 px** ;
* stabilisation du header tablette ;
* stabilisation du drawer tablette **complet** ;
* stabilisation de la bottom navigation tablette ;
* maintien / ajout d’un **footer compact** tablette ;
* maintien du **footer desktop** en régime desktop ;
* recette portrait / paysage et seuil de bascule desktop.

**Exclus**

* refonte visuelle desktop ;
* refonte fonctionnelle des cards cockpit ;
* évolution backend ;
* changement de wording métier des KPI ;
* ajout de nouvelles vues métier hors Pilotage / Synthèse.

#### 3. Règles

##### 3.1 Régimes responsive

**Mobile — `W < 768px`**

* pas de sidebar visible ;
* header mobile dédié ;
* burger autorisé ;
* bottom navigation autorisée ;
* footer compact ou réduit ;
* layout mobile.

**Tablette — `768px <= W < 1024px`**

* pas de sidebar visible ;
* header tablette dédié ;
* burger **obligatoire** ;
* drawer complet reprenant la sidebar desktop ;
* bottom navigation autorisée ;
* footer compact tablette ;
* aucun chrome desktop visible en permanence.

**Desktop — `W >= 1024px`**

* sidebar visible ;
* header desktop ;
* footer desktop ;
* pas de burger ;
* pas de bottom navigation ;
* pas de drawer tablette.

##### 3.2 Règle d’or

Les éléments suivants ne doivent **jamais** coexister dans un même régime :

* sidebar visible + burger ;
* sidebar visible + bottom navigation ;
* header tablette + sidebar desktop ;
* footer desktop + bottom navigation tablette ;
* burger + drawer incomplet.

**Formulation normative**

> à un instant donné, un seul système de navigation primaire est actif pour un viewport donné

##### 3.3 Header tablette

Le header tablette reste organisé en **deux lignes fixes**.

**Ligne 1 — chrome cockpit**

Ordre : `Marque | Séparateur | Vue active | Spacer | Cloche | Preuves de la vue | Entité active | Burger`

* marque Lynki ; vue active (`Pilotage` ou autre vue courante) ; cloche ; badge **compact** de preuves de la vue ; avatar + entité active ; burger.  
* ligne 1 en **nowrap** strict ; aucun wrap implicite ; pas de phrase longue dans le badge preuves ; burger visible **uniquement** sous 1024 px.

**Ligne 2 — filtres métier**

Ordre : `Tenant | Société | Période | Année | Spacer | Badge technique`

* ligne 2 homogène ; scroll horizontal autorisé si nécessaire ; filtres séparés des actions globales ; badge technique secondaire.

**Largeurs minimales**

* Tenant : 120 px, puis 132 px à partir de 900 px ;
* Société : 180 px, puis 200 px à partir de 900 px ;
* Période : 140 px, puis 152 px à partir de 900 px ;
* Année : 84 px, puis 88 px à partir de 900 px.

**Priorité métier** : `Société > Période > Tenant > Année` (aligné **Annexe A** / **T-TB-002**).

##### 3.4 Drawer tablette

Le drawer ouvert par le burger doit reprendre **l’intégralité** de la sidebar desktop.

**Contenu obligatoire**

* **Dashboard** — Pilotage ; Synthèse comptable ;
* **Outils** — Lexique ; Aide ;
* **Session** — Thème ; Déconnexion.

**Contraintes d’implémentation**

* panneau rendu au niveau viewport ;
* overlay plein écran ;
* panneau en `fixed` ;
* hauteur utile complète (`100dvh` ou équivalent robuste) ;
* body scrollable si nécessaire ;
* Déconnexion toujours accessible ;
* aucune ligne du cockpit ne doit concurrencer le drawer quand il est ouvert.

##### 3.5 Bottom navigation tablette

* navigation **primaire de vues**, distincte du footer ;
* contenu recommandé : Pilotage ; Synthèse ;
* visible **uniquement** sous 1024 px ; invisible à partir de 1024 px ;
* ne remplace ni le drawer ni le footer ;
* ne doit pas coexister avec une sidebar visible.

##### 3.6 Footer compact tablette

* métadonnées globales du cockpit : preuves cumulées, sources, version, UX ms si possible ;
* exemple : `1 309 preuves cumulées · UX 114 ms · Sources : Odoo / POS / Vault · v1.0` ;
* compact, discret, une ligne si possible ; visible sous 1024 px ; distinct de la bottom navigation.

##### 3.7 Desktop

À partir de 1024 px : sidebar desktop visible ; header desktop ; footer desktop ; burger masqué ; drawer tablette désactivé ; bottom navigation masquée. Aucun chrome tablette ne doit subsister à ce seuil.

#### 4. Implémentation

##### 4.1 Breakpoints de référence

```ts
export const MOBILE_MAX_PX = 767;
export const TABLET_MIN_PX = 768;
export const DESKTOP_MIN_PX = 1024;
export const TABLET_COMFORT_MIN_PX = 900;
```

```ts
const isMobile = width < 768;
const isTablet = width >= 768 && width < 1024;
const isDesktop = width >= 1024;
```

##### 4.2 Choix du régime au niveau layout

Le choix du régime doit être fait **une seule fois** au niveau du layout / chrome principal.

```tsx
const regime =
  isDesktop ? "desktop" :
  isTablet ? "tablet" :
  "mobile";
```

```tsx
return (
  <>
    {regime === "mobile" && <MobileChrome />}
    {regime === "tablet" && <TabletChrome />}
    {regime === "desktop" && <DesktopChrome />}
  </>
);
```

##### 4.3 Structure cible

**TabletChrome** — `TabletHeader` ; `main` ; `TabletFooterCompact` ; `TabletBottomNav` ; `TabletDrawer`.

**DesktopChrome** — `DesktopSidebar` ; `DesktopHeader` ; `main` ; `DesktopFooter`.

##### 4.4 Règles CSS / structure attendues

**Header tablette ligne 1** — `flex`, `items-center`, `gap-*`, `min-w-0`, `flex-nowrap`.

**Header tablette ligne 2** — `flex`, `items-center`, `gap-*`, `min-w-0`, `flex-nowrap`, `overflow-x-auto`, `overflow-y-hidden`, `scrollbar-width: thin`, `-webkit-overflow-scrolling: touch`, `overscroll-x-contain`.

**Drawer** — overlay `fixed inset-0` ; panel `fixed left-0 top-0 h-dvh` ; z-index supérieur au header, au contenu et aux cards.

**Bottom nav** — `fixed bottom-0 inset-x-0` ; visible uniquement sous 1024 px.

**Footer compact tablette** — dans le flux de contenu **ou** bandeau fixe calé au-dessus de la bottom nav ; **marge / offset / padding** suffisant pour ne pas être masqué par la navigation basse (voir implémentation courante `LinkyFooter` + `BottomNav`).

#### 5. DoD

Le ticket est considéré **terminé** si :

**DoD fonctionnelle**

* trois régimes exclusifs : mobile / tablette / desktop ;
* sous 1024 px, pas de sidebar visible ;
* à partir de 1024 px, burger et bottom navigation supprimés ;
* header tablette stable et lisible ;
* drawer tablette = toute la sidebar desktop ;
* Déconnexion accessible dans le drawer ;
* bottom navigation jamais avec sidebar visible ;
* footer compact tablette visible sous 1024 px ;
* footer desktop visible à partir de 1024 px.

**DoD visuelle**

* aucun écran hybride sidebar + burger / sidebar + bottom nav / header tablette + sidebar desktop / footer desktop + bottom nav tablette ;
* le drawer passe visuellement devant l’app ;
* preuves de la vue visibles dans le header tablette ;
* preuves cumulées visibles dans le footer compact tablette.

**DoD technique**

* logique de breakpoint centralisée ;
* composants de chrome distincts par régime (ou branches nettes) ;
* aucun hack local ne maintient une sidebar sous 1024 px ;
* aucun burger rendu à partir de 1024 px ;
* aucune bottom nav rendue à partir de 1024 px.

#### 6. Recette

##### 6.1 Breakpoints à tester

* **Mobile** — 390 × 844 ; 430 × 932 ;
* **Tablette portrait** — 768 × 1024 ; 820 × 1180 ; 834 × 1210 ; 900 × 1200 ;
* **Tablette paysage** — 1023 × 768 ;
* **Desktop** — 1024 × 768 ; 1280 × 800 ; 1440 × 900.

##### 6.2 Cas de recette obligatoires

* **A. Mobile** — pas de sidebar ; burger ; header mobile ; bottom nav si activée.  
* **B. Tablette portrait** — pas de sidebar ; burger ; header 2 lignes ; preuves de la vue ; drawer complet ; footer compact ; bottom nav si activée.  
* **C. Tablette paysage** — pas de sidebar tant que largeur &lt; 1024 ; burger ; bottom nav ; footer compact ; aucun élément desktop persistant.  
* **D. Seuil 1024** — disparition burger / bottom nav ; apparition sidebar + footer desktop ; plus de chrome tablette.  
* **E. Drawer** — overlay plein écran ; panel pleine hauteur ; Session complète ; Déconnexion ; fermeture correcte.  
* **F. Footer compact tablette** — visible ; non confondu avec bottom nav ; lisible ; pas masqué par la nav basse.

##### 6.3 Critères de non-régression

* badge preuves header tablette ; badge technique ; accès Synthèse tablette ; Déconnexion ; pas de duplication de la navigation primaire.

#### 7. Résultat attendu

À l’issue de T-TB-003 : plus de responsive hybride ; tablette assumée sous 1024 px ; desktop à partir de 1024 px ; navigation primaire univoque ; hiérarchie chrome lisible ; iPad cohérent portrait / paysage.

#### 8. Journal — formulation courte

> T-TB-003 fixe la doctrine responsive Lynki en trois régimes exclusifs (mobile, tablette, desktop), supprime les états hybrides de chrome/navigation, impose la disparition de la sidebar sous 1024 px et la disparition du burger/bottom nav à partir de 1024 px, tout en stabilisant header tablette, drawer complet, footer compact tablette et bascule desktop propre.

**Priorité**  
P0

**Statut**  
**Doctrine gelée** (recette produit mars 2026) — le périmètre **architecture / chrome exclusif** est considéré **clos** ; les finitions visuelles relèvent des tickets **R-POL-Desktop**, **R-POL-Laptop**, **R-POL-iPad** (Annexe B).

---

### T-TB-008 — Stabiliser le bloc session tablette

**Objet**  
Faire du bloc session une vraie terminaison de bandeau.

**Constat**  
La session reste encore visuellement un peu rapportée.

**À faire**

* recalibrer avatar / nom / badge ;
* réduire la masse si nécessaire ;
* vérifier la cohérence avec la cloche ;
* éviter un bloc trop haut ou trop lourd.

**Résultat attendu**  
La zone droite termine naturellement le bandeau.

**Critères de validation**

* le bloc session est lisible ;
* il ne déséquilibre pas le bandeau ;
* il paraît tactile et non collé après coup.

**Priorité**  
P1

**Statut**  
À faire

*Ancien ticket T-TB-003 — renuméroté pour libérer T-TB-003 (doctrine responsive).*

---

### T-TB-004 — Ajuster la grille A tablette

**Objet**  
Rendre la classe A plus tablette-native.

**Constat**  
Les cartes A sont bonnes, mais peuvent encore gagner en justesse dans leur articulation.

**À faire**

* confirmer la structure cible :

  * Trésorerie pleine largeur  
  * Business / Flux net en dessous  
* ajuster padding, hauteur et respiration ;
* conserver une dominante plus souple qu’en laptop ;
* vérifier la lisibilité tactile.

**Résultat attendu**  
La tablette garde une vraie qualité cockpit sans effet d’écrasement.

**Critères de validation**

* les cartes A restent dominantes ;
* elles ne paraissent ni tassées ni excessivement denses ;
* la lecture reste naturelle au doigt.

**Priorité**  
P1

**Statut**  
À faire

---

### T-TB-005 — Stabiliser la grille B tablette

**Objet**  
Conserver une vraie couche intermédiaire lisible et stable.

**Constat**  
La classe B doit rester visible sans devenir un ensemble de blocs casés.

**À faire**

* valider la structure en 2 colonnes ;
* vérifier la hauteur et le rythme des cartes ;
* préserver le contraste A > B ;
* maintenir une composition tactile stable.

**Résultat attendu**  
La classe B joue son rôle d’explication / qualification sans brouiller le cockpit.

**Critères de validation**

* B est immédiatement lisible ;
* B reste clairement sous A ;
* la zone n’a pas d’effet de surcharge.

**Priorité**  
P1

**Statut**  
À faire

---

### T-TB-006 — Repositionner la classe C tablette

**Objet**  
Faire de la classe C une couche secondaire assumée.

**Constat**  
La classe C doit être plus présente que sur phone, mais moins forte que sur desktop.

**À faire**

* valider une position claire :

  * colonne secondaire,
  * ou bande basse dédiée ;
* homogénéiser les cartes C ;
* éviter l’effet « reste de cartes qu’on a casé ».

**Résultat attendu**  
La classe C contextualise sans casser la hiérarchie cockpit.

**Critères de validation**

* C est présente et lisible ;
* C reste inférieure à A et B ;
* l’ensemble conserve une lecture ordonnée.

**Priorité**  
P2

**Statut**  
À faire

---

### T-TB-007 — Recette tactile tablette

**Objet**  
Valider que la tablette se comporte comme un régime tactile, pas comme un desktop compressé.

**Constat**  
Le rendu visuel seul ne suffit pas ; il faut valider la manipulation tactile.

**À faire**

* vérifier les zones de tap ;
* contrôler l’absence de dépendance au hover ;
* tester portrait / paysage si utile ;
* vérifier la stabilité des états actifs ;
* comparer les captures tablette vs desktop.

**Résultat attendu**  
Le régime tablette est validé comme cockpit tactile compact.

**Critères de validation**

* les contrôles sont manipulables au doigt ;
* les états sont compréhensibles sans souris ;
* la tablette n’évoque ni laptop tassé ni phone agrandi.

**Priorité**  
P1

**Statut**  
À faire

---

## 5. Ordre recommandé d’exécution

### Phase 1 — Phone prioritaire

* T-PH-001  
* **T-PH-002** (header phone — grammaire iPad)  
* T-PH-007 (ordre de lecture vertical / grille A)  
* T-PH-003  

### Phase 2 — Phone secondaire

* T-PH-004  
* T-PH-005  
* T-PH-006  

### Phase 3 — Tablette, bandeau d’abord

* T-TB-001  
* T-TB-002  
* **T-TB-003** (doctrine responsive — chrome exclusifs ; après T-TB-001 ter / T-TB-002)  
* **T-TB-008** (bloc session tablette — ancien T-TB-003)

### Phase 4 — Tablette, cockpit ensuite

* T-TB-004  
* T-TB-005  
* T-TB-006  
* T-TB-007  

---

## 6. Critères de clôture

### 6.1 Phone — définition de fin

Le chantier phone est considéré comme satisfaisant si :

* la lecture métier précède clairement la gestion de l’interface ;
* Trésorerie / Business / Flux net dominent l’entrée en lecture ;
* les alertes sont remontées au bon niveau ;
* B et C sont nettement secondaires ;
* le contexte reste simple, accessible et non envahissant.

### 6.2 Tablette — définition de fin

Le chantier tablette est considéré comme satisfaisant si :

* le bandeau paraît composé ;
* la grille garde une vraie qualité cockpit ;
* la tablette n’évoque ni un laptop tassé ni un phone élargi ;
* la hiérarchie A / B / C reste évidente ;
* l’usage tactile est stable et crédible.

---

## 7. Formules de contrôle final

### Phone

> Est-ce que je vois la situation avant de gérer l’interface ?

### Tablette

> Est-ce que j’ai un cockpit tactile composé, ou un desktop qui tient tant bien que mal ?

---

## Annexe B — Backlog polish par régime (R-POL-*)

**Principe :** un ticket **par régime**, pas un ticket « responsive global ». Chaque item est un **micro-backlog produit** après gel de la doctrine (§2.6).

### R-POL-Desktop — référence, finitions légères

| Sujet | Action |
|--------|--------|
| Respiration verticale | Ajuster si besoin `padding` / `gap` entre header fusionné, grille A et footer |
| Équilibre chrome | Vérifier que footer desktop et header ne mangent pas disproportionnellement la zone cartes |
| Urgence | **Faible** — desktop est la **référence** ; ne toucher que sur constat mesuré |

### R-POL-Laptop — desktop compact (même régime, largeur tendue)

| Sujet | Action |
|--------|--------|
| Largeur utile | Vérifier **cartes maîtresses** et breakpoints internes quand la zone résiduelle (*viewport* − sidebar) se resserre |
| Gros montants | **Lisibilité** typo / line-height sur Trésorerie / Business en ~1280–1440 |
| Header | **Confort** du bandeau fusionné desktop quand la ligne filtres est tendue |
| Sidebar | Poids visuel **encore dominant** — polish **densité / contrastes** plutôt que changer le régime |
| Urgence | **Moyenne** — confort, pas architecture |

### R-POL-iPad — présence tablette (architecture OK, « habitabilité » écran)

| Sujet | Action |
|--------|--------|
| Occupation de l’espace | Réduire la sensation **« page dans une boîte »** : `max-w`, marges latérales `main`, breathing du contenu sur 768–1023 |
| Colonne maîtresse | Carte Trésorerie / stack A : un peu plus **assumer la largeur** disponible sans retrouver du desktop |
| Cohérence | Rester aligné **cockpit tactile** (T-TB-004 / T-TB-007 peuvent recouper) |
| Urgence | **Moyenne** — lecture produit : régime **juste**, rendu encore **un peu timide** |

**Synthèse une phrase par régime**

* **Desktop :** référence solide ; polish optionnel.  
* **Laptop :** même logique ; serrage général → polish **densité**.  
* **iPad :** régime **enfin distinct** ; polish **présence / respiration**.

---

## 8. Journal (implémentation / recette)

| Date | ID | Synthèse | Lab / hash |
|------|-----|----------|------------|
| 2026-03-29 | T-PH-001 bis, T-TB-001 bis | Bandeau phone compact (`pilotagePhoneCompact`), raccord tablette bandeau fusionné → grille (`tabletRibbonGapPx`, `pt` `main`), `CockpitTabletView` / `cockpit-layout.ts` | Déploiement `./scripts/deploy-linky-lab.sh` ; pied de page **UI** |
| 2026-03-29 | TECH (hors grille tickets) | Alignement auth **`/api/accounting/periods`** : exemption middleware, contrôle session + proxy Vault dans la route, **200** avec `periods: []` si absence de session (évite **401** console quand le cockpit `/` est chargé sans gate serveur aligné avec les autres APIs cockpit) | `middleware.ts`, `app/api/accounting/periods/route.ts` |
| 2026-03-29 | T-TB-001 ter | Header tablette **deux rangées** : marque DL + Lynki, *Pilotage*, filtres, cloche ; rangée 2 périmètre actif (initiale + libellé + badge tenant) | `ReportHeaderContentBody.tsx` (`cockpitBandTablet`) |
| 2026-03-29 | Annexe A | Norme **768–1023** : `nowrap` rangée 1, scroll filtres, priorité largeurs, troncatures, hauteurs cibles ; renfort code (`whitespace-nowrap` *Pilotage*, wrapper scroll, `title` libellé tenant) | `EXECUTION_TICKETS_TACTILE_LINKY.md` v0.4 |
| 2026-03-29 | T-TB-001 ter · verdict | Structurellement réussi ; **5 cas** recette prioritaire ; **T-TB-002** = micro-ajustement | `EXECUTION_TICKETS_TACTILE_LINKY.md` v0.5 |
| 2026-03-29 | T-TB-002 | Min-width filtres, `w-max` + `shrink-0`, tagline `min-[860px]`, scroll `overflow-y-hidden`, badge tenant `max-w-[120px]` | `ReportHeaderContentBody.tsx` |
| 2026-03-29 | T-TB-002 · verdict | **Réussi côté code** ; grille **recette visuelle** 6 cas ; ajustements futurs seulement si recette ; verdict final après captures 768 / 900 / 1023 | `EXECUTION_TICKETS_TACTILE_LINKY.md` v0.7 |
| 2026-03-30 | T-TB-003 | Intégration au document : **doctrine responsive** (mobile / tablette / desktop), chrome exclusifs, DoD / recette ; ancien « bloc session tablette » renuméroté **T-TB-008** | `EXECUTION_TICKETS_TACTILE_LINKY.md` v0.8 |
| 2026-03-30 | T-TB-003 | **Réédition détaillée** du ticket (§ 1–8, règles 3.x, implémentation 4.x, DoD, recette 6.x) alignée format exécution Lynki ; note footer compact : flux ou fixe au-dessus bottom nav | v0.8.1 |
| 2026-03-30 | T-TB-003 · impl | **bandLayout** piloté uniquement par `cockpitLayoutMode` (≥1024 → `desktop`, pas via `interactionMode`) — supprime hybrid sidebar + burger ; module `app/lib/cockpit/responsive-regime.ts` (constantes + `getResponsiveRegime` / `useResponsiveRegime`) | code |
| 2026-03-30 | T-TB-003 · impl | **`responsiveRegime`** dans `ChromeAdaptiveContext` ; `DashboardWithFilters` déduit `cockpitLayoutMode` depuis ce régime (un seul listener resize) ; `ReportHeader` ferme le menu au passage `bandLayout → desktop` | code |
| 2026-03-30 | T-TB-003 · recette | **Verdict produit :** 3 régimes lisibles (desktop / laptop même logique / iPad distinct) ; **gel doctrine** §2.6 ; backlog polish **R-POL-*** (Annexe B) | captures |
| 2026-03-30 | T-PH-002 | Ticket **header phone = grammaire iPad compactée** (§1–8) ; norme [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md) **Annexe B** ; ancien « ordre de lecture » renuméroté **T-PH-007** ; impl. existante `pilotagePhoneCompact` + périmètre (thème / sync) | `EXECUTION_TICKETS_TACTILE_LINKY.md` v0.9.1 ; `ReportHeaderContentBody.tsx` |
| 2026-03-30 | T-PH-002 · impl | **Burger phone** : fin du menu dropdown ; **même drawer** que l’iPad (`tactileNavigationDrawer`, `z-[120]`) ; `aria-controls` **`linky-tactile-nav-drawer`** ; paliers **`min-[480px]`** sur le bloc phone (cohé. Annexe B) | `ReportHeaderContentBody.tsx` |
| 2026-03-30 | **T-PH-002 ter** | **Phone** : tiroir **sans** Pilotage/Synthèse (bottom nav = nav primaire) ; titre **Plus** ; résumé **`Société · Année`** | `ReportHeaderContentBody.tsx`, `DashboardWithFilters.tsx`, SPEC **§7.7** / **Annexe B** |
| 2026-03-30 | **T-PH-006** | **Footer phone** : `LinkyFooter` masqué `< sm` ; badge header **« N preuves »** (`IntegrityBadge` compact) ; `DashboardWithFilters` padding bas phone ; SPEC **Annexe B.11** · cadrage **§11** | `LinkyFooter.tsx`, `ReportHeaderContentBody.tsx`, `IntegrityBadge.tsx`, `DashboardWithFilters.tsx` ; déploiement `./scripts/deploy-linky-lab.sh` |

---

## 9. Historique document

| Version | Date | Changement |
|---------|------|------------|
| 0.9.4 | mars 2026 | **T-PH-006** : footer métadonnées absent phone ; badge **N preuves** header ; SPEC / cadrage alignés |
| 0.9.3 | mars 2026 | **T-PH-002 ter** : nav primaire phone = bottom nav ; burger = outils + session uniquement |
| 0.9.2 | mars 2026 | **T-PH-002 · impl** : drawer tactile unifié phone / tablette (`linky-tactile-nav-drawer`) |
| 0.9.1 | mars 2026 | **T-PH-002** = header phone aligné iPad (ticket complet §3) ; **T-PH-007** = ordre de lecture vertical (ex-T-PH-002) ; Phase 1 ordre d’exécution ; journal |
| 0.9 | mars 2026 | **Gel doctrine** T-TB-003 §2.6 ; Annexe **R-POL-Desktop / Laptop / iPad** ; tableau synthèse ; statut T-TB-003 |
| 0.8.1 | mars 2026 | **T-TB-003** : corps du ticket réécrit en sections numérotées 1–8 (spec exploitable) |
| 0.8 | mars 2026 | **T-TB-003** = doctrine responsive Lynki (P0) ; **T-TB-008** = stabiliser bloc session (ex-T-TB-003) ; tableau synthèse + Phase 3 + journal |
| 0.7 | mars 2026 | **T-TB-002** verdict réussi côté code ; grille recette 6 cas ; verdict final header iPad après captures |
| 0.6 | mars 2026 | **T-TB-002** : min-width coquilles, palier 900px, marque &lt;860px, scroll + rangée 2 |
| 0.5 | mars 2026 | Verdict **T-TB-001 ter** structurellement réussi ; **5 cas** recette prioritaire ; **T-TB-002** repositionné micro-ajustement |
| 0.4 | mars 2026 | **Annexe A** — plage 768–1023, `nowrap` rangée 1, scroll filtres, priorité largeurs, troncature, hauteurs cibles ; **T-TB-002** renvoi Annexe A |
| 0.3 | mars 2026 | **T-TB-001 ter** — norme header iPad deux rangées + journal |
| 0.2 | mars 2026 | Journal §8 renseigné (bis + correctif API périodes) ; version document |
| 0.1 | mars 2026 | Brouillon pilotage — T-PH-001…006, T-TB-001…007, tableau synthèse, repères code / lab |
