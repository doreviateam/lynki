# EXECUTION_TICKETS_TACTILE_LINKY.md

**Version :** 0.2 — mars 2026  
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
| T-TB-001 | Recomposer le bandeau tablette | P0 | En cours (voir bis) |
| T-TB-001 bis | Raccord propre bandeau fusionné → première carte (tablette) | P0 | Fait (code — recette à confirmer) |
| T-TB-002 | Recalibrer les coquilles de contexte tablette | P0 | À faire |
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

### T-TB-002 — Recalibrer les coquilles de contexte tablette

**Objet**  
Mieux équilibrer le groupe de filtres dans le bandeau tablette.

**Constat**  
Certaines coquilles gardent encore une inertie desktop trop forte.

**À faire**

* recalibrer les largeurs mini / max de :

  * Tenant  
  * Société  
  * Période  
  * Année  
* réduire encore Tenant si nécessaire ;
* protéger Société contre une troncature trop agressive ;
* maintenir Année compacte et centrée ;
* harmoniser les inter-espaces.

**Résultat attendu**  
Le centre du bandeau paraît équilibré et non compressé.

**Critères de validation**

* aucune coquille ne domine à tort ;
* Société reste lisible ;
* le groupe central paraît stable à 768, ~900 et 1023 px.

**Priorité**  
P0

**Statut**  
À faire

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

---

## 9. Historique document

| Version | Date | Changement |
|---------|------|------------|
| 0.2 | mars 2026 | Journal §8 renseigné (bis + correctif API périodes) ; version document |
| 0.1 | mars 2026 | Brouillon pilotage — T-PH-001…006, T-TB-001…007, tableau synthèse, repères code / lab |
