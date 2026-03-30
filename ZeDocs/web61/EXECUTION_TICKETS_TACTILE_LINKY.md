# EXECUTION_TICKETS_TACTILE_LINKY.md

**Version :** 0.7 — mars 2026  
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
| T-PH-002 | Reprioriser l’ordre de lecture mobile | P0 | À faire |
| T-PH-003 | Renforcer la carte Trésorerie sur phone | P0 | À faire |
| T-PH-004 | Recomposer la classe B sur phone | P1 | À faire |
| T-PH-005 | Reléguer proprement la classe C | P1 | À faire |
| T-PH-006 | Alléger navigation et footer mobile | P1 | À faire |
| T-TB-001 | Recomposer le bandeau tablette | P0 | En cours (architecture portée par bis / ter + Annexe A) |
| T-TB-001 bis | Raccord propre bandeau fusionné → première carte (tablette) | P0 | Fait (code — recette à confirmer) |
| T-TB-001 ter | Bandeau tablette deux rangées (marque · vue · filtres ; périmètre actif) | P0 | Réussi structurellement (code + Annexe A) — recette visuelle §5 cas |
| T-TB-002 | Micro-ajustement des coquilles filtres (largeurs mini / max) | P0 | Réussi côté code — **recette visuelle** (grille § T-TB-002) avant verdict final |
| T-TB-003 | Stabiliser le bloc session tablette | P1 | À faire |
| T-TB-004 | Ajuster la grille A tablette | P1 | À faire |
| T-TB-005 | Stabiliser la grille B tablette | P1 | À faire |
| T-TB-006 | Repositionner la classe C tablette | P2 | À faire |
| T-TB-007 | Recette tactile tablette | P1 | À faire |

*Correspondance indicative avec l’ancien gréement numérique : T-PH-00x ≈ T-W61-TAC-10x, T-TB-00x ≈ T-W61-TAC-20x (voir fichier renvoi `EXECUTION_TICKETS_REFONTE_TACTILE_LINKY.md` si besoin).*

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

### T-PH-002 — Reprioriser l’ordre de lecture mobile

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

**À faire**

* conserver une bottom nav simple ;
* limiter les entrées visibles au strict utile ;
* alléger fortement le footer technique ;
* repousser les informations système secondaires hors de la zone de lecture principale.

**Résultat attendu**  
Le bas d’écran reste utile mais discret.

**Critères de validation**

* la navigation reste claire ;
* le footer ne remonte pas dans la hiérarchie de lecture ;
* les métadonnées système ne parasitent pas le cockpit.

**Priorité**  
P1

**Statut**  
À faire

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

### T-TB-003 — Stabiliser le bloc session tablette

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
* T-PH-002  
* T-PH-003  

### Phase 2 — Phone secondaire

* T-PH-004  
* T-PH-005  
* T-PH-006  

### Phase 3 — Tablette, bandeau d’abord

* T-TB-001  
* T-TB-002  
* T-TB-003  

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

---

## 9. Historique document

| Version | Date | Changement |
|---------|------|------------|
| 0.7 | mars 2026 | **T-TB-002** verdict réussi côté code ; grille recette 6 cas ; verdict final header iPad après captures |
| 0.6 | mars 2026 | **T-TB-002** : min-width coquilles, palier 900px, marque &lt;860px, scroll + rangée 2 |
| 0.5 | mars 2026 | Verdict **T-TB-001 ter** structurellement réussi ; **5 cas** recette prioritaire ; **T-TB-002** repositionné micro-ajustement |
| 0.4 | mars 2026 | **Annexe A** — plage 768–1023, `nowrap` rangée 1, scroll filtres, priorité largeurs, troncature, hauteurs cibles ; **T-TB-002** renvoi Annexe A |
| 0.3 | mars 2026 | **T-TB-001 ter** — norme header iPad deux rangées + journal |
| 0.2 | mars 2026 | Journal §8 renseigné (bis + correctif API périodes) ; version document |
| 0.1 | mars 2026 | Brouillon pilotage — T-PH-001…006, T-TB-001…007, tableau synthèse, repères code / lab |
