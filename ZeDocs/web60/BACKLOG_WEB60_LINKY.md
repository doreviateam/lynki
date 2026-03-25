# Backlog Web60 — Linky UI

**Fichier canonique :** `BACKLOG_WEB60_LINKY.md`  
**Version :** 1.1.9 — mars 2026  
**Lot :** Web60  
**Références de cadrage :** [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) **v1.1.20**, [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) **v1.1.2**, [`SPEC_CARTES_MAITRESSES_LINKY.md`](./SPEC_CARTES_MAITRESSES_LINKY.md) **v1.1.17** · **Recette :** [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.1.16** · **Exécution :** [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1.18** (passes, **T-W60-xxx**, **R60** ; **lab public** = vérité recette + **UI hash** ; **§13** = journal, **§13.1** = gabarit **T-W60-001** ; **§4.2** = clôture **W60-005** ; **§5** Passe 2 P0 **W60-101**–**W60-103** **Fait** ; **§14** trio Passe 1) · **Déploiement prioritaire :** [lab + laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026)  
**Référence créa figée :** `ZeDocs/web59/stitch_carole_61`  
**Statut :** backlog ouvert

---

## 1. Objet du document

Le présent document constitue le backlog opérationnel du lot **Web60** pour la stabilisation UI de Linky en régime **Pilotage**.

Il a pour fonction de transformer le cadrage, la doctrine d’états et la spécification des cartes maîtresses en une séquence de travail exécutable, arbitrable et traçable.

Le backlog ne sert pas uniquement à lister des tâches. Il sert aussi à :

* qualifier les écarts ;
* prioriser les sujets ;
* relier chaque action à une logique produit ;
* expliciter l’impact sur les personas ;
* distinguer ce qui relève d’un écart certain, d’un arbitrage interprétatif ou d’une différence assumée.

La **séquence de fermeture par blocs** (passes, tickets **T-W60-xxx** en miroir des **W60-xxx**) est détaillée dans [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1**.

---

## 2. Règles de lecture du backlog

### 2.1 Catégories d’écart

Chaque item du backlog doit relever d’une des catégories suivantes :

* **Certain** : écart objectivable entre la référence créa, la doctrine ou la spec et l’implémentation ;
* **Interprétatif** : sujet nécessitant un arbitrage produit, UX ou hiérarchique ;
* **Assumé** : différence volontaire, explicitement conservée ;
* **Dette de stabilisation** : sujet non bloquant à court terme, mais nécessaire pour consolider la qualité du cockpit.

### 2.2 Priorités

Les priorités utilisées dans Web60 sont :

* **P0** : bloque la lecture produit ou contredit une règle structurante ;
* **P1** : important pour la fermeture des cartes maîtresses ;
* **P2** : utile pour l’harmonisation ou la cohérence générale ;
* **P3** : amélioration complémentaire non bloquante.

### 2.3 Statuts d’avancement

Les statuts utilisés sont :

* **À faire** ;
* **À arbitrer** ;
* **En cours** ;
* **Fait** ;
* **Assumé** ;
* **Reporté**.

### 2.4 Personas impactées

Chaque item doit préciser la ou les personas principalement impactées :

* **Max** : lisibilité immédiate, compréhension directionnelle ;
* **Véréna** : robustesse de pilotage, confiance opérationnelle ;
* **Esther** : cohérence méthodologique, continuité analytique.

### 2.5 Axes de rattachement

Pour garder le backlog pilotable, chaque item est rattaché à un axe :

* **A — Grammaire produit globale** ;
* **B — Doctrine des états** ;
* **C — Cartes maîtresses** ;
* **D — Cartes de second rang** ;
* **E — Recette et fermeture**.

---

## 3. Format attendu d’un item

Chaque item de backlog doit être formulé avec les champs suivants :

* **ID** ;
* **Zone** ;
* **Titre court** ;
* **Catégorie** ;
* **Axe** ;
* **Priorité** ;
* **Persona(s) impactée(s)** ;
* **Constat** ;
* **Décision / sortie attendue** ;
* **Statut**.

### 3.1 Artefact cible (optionnel — évolution)

Lorsque le backlog sera plus mobile (nombreux items **Fait** / arbitrages multiples), il pourra être utile d’ajouter par item un champ léger **Artefact cible** (ou *Référence de sortie*) : il indique *où* la décision se matérialise, sans remplacer la décision elle-même.

Valeurs typiques :

* **UI cockpit** — surface Pilotage grille / cartes ;
* **Chrome global** — barre haute, trust bar, signaux transverses ;
* **Détail** — vues approfondies accessibles depuis une carte ;
* **Spec / doc** — mise à jour d’une pièce `ZeDocs/web60` si la sortie est normative ;
* **Recette** — preuve attendue dans [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.1+** (protocole, **R60-xxx**).

Ce champ n’est **pas obligatoire** en v1.0.x ; on peut le renseigner au fil de l’eau ou sur les items les plus transverses.

---

## 4. Ordre d’exécution recommandé

L’ordre d’exécution recommandé pour Web60 est le suivant :

1. sujets P0 de doctrine d’état et de cartes maîtresses ;
2. fermeture de Trésorerie ;
3. fermeture de Business ;
4. fermeture de Flux net ;
5. harmonisation des états globaux et du chrome ;
6. second rang ;
7. recette globale et arbitrages restants.

Ce backlog privilégie la fermeture de blocs plutôt que l’amélioration diffuse.

---

## 5. Backlog prioritaire — Global / doctrine / chrome

| ID | Zone | Titre court | Catégorie | Axe | Priorité | Persona(s) | Statut |
|----|------|-------------|-----------|-----|----------|-------------|--------|
| W60-001 | Global | Normaliser le lexique d’état visible | Certain | B | P0 | Max, Véréna, Esther | Fait |
| W60-002 | Global | Supprimer les synonymes concurrents d’état | Certain | B | P0 | Max, Véréna, Esther | À faire |
| W60-003 | Global | Distinguer clairement état principal, secondaire et global | Certain | B | P0 | Max, Véréna, Esther | À faire |
| W60-004 | Chrome | Répartir correctement les états entre cartes et système global | Interprétatif | A | P1 | Max, Véréna | À arbitrer |
| W60-005 | Chrome | Clarifier la coexistence des preuves/scellés entre barre haute et trust bar | Certain | A | P1 | Max, Véréna, Esther | Fait |
| W60-006 | Global | Définir un mapping centralisé des états UI | Dette de stabilisation | B | P1 | Véréna, Esther | À faire |
| W60-007 | Global | Fixer l’ordre de précédence visuelle des états | Dette de stabilisation | B | P1 | Max, Véréna | À faire |
| W60-008 | Global | Stabiliser le ton coloriel des états de vigilance | Interprétatif | B | P2 | Max, Véréna | À arbitrer |
| W60-009 | Global | Réduire le sur-badging des signaux positifs | Certain | B | P1 | Max, Véréna | À faire |
| W60-010 | Chrome | Rendre la barre haute plus explicite sur l’arrêté / fraîcheur | Interprétatif | A | P2 | Max, Véréna, Esther | À arbitrer |

### 5.1 Détail des items prioritaires globaux

#### W60-001 — Normaliser le lexique d’état visible

* **Constat :** plusieurs labels ou formulations d’état peuvent encore diverger entre cartes et chrome.
* **Décision / sortie attendue :** appliquer strictement le lexique de [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) sur le cockpit Pilotage.
* **Statut :** **Fait** (mars 2026) — lab `laplatine2026`, desktop Véréna + mobile Max ; journal [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **§13**.

#### W60-003 — Distinguer clairement état principal, secondaire et global

* **Constat :** certains signaux restent visuellement proches alors qu’ils ne portent pas le même niveau sémantique.
* **Décision / sortie attendue :** rendre explicite en UI la hiérarchie entre état de lecture, état complémentaire et signal système global.
* **Statut :** À faire.

#### W60-005 — Clarification des preuves (vue vs cumulées)

* **Constat :** la coexistence de plusieurs compteurs ou marqueurs de preuve peut créer une ambiguïté de lecture.
* **Décision / sortie attendue :** distinguer clairement ce qui relève d’un indicateur global de confiance, d’un volume de preuves et d’un statut technique système.
* **Statut :** **Fait** — 25/03/2026.

Clarification microcopy du système de confiance :

* badge cockpit = **preuves de la vue** ;
* footer = **preuves cumulées**.

Aucun changement backend ni agrégat.  
Le ticket traite uniquement la lisibilité sémantique et l’alignement des libellés / tooltips. Détail d’implémentation : [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **§4.2**.

---

## 6. Backlog prioritaire — Trésorerie

| ID | Zone | Titre court | Catégorie | Axe | Priorité | Persona(s) | Statut |
|----|------|-------------|-----------|-----|----------|-------------|--------|
| W60-101 | Trésorerie | Réaffirmer la dominance visuelle de Trésorerie | Certain | C | P0 | Max, Véréna | Fait |
| W60-102 | Trésorerie | Remplacer le badge unique « Synchro OK » comme lecture principale | Certain | C | P0 | Max, Véréna, Esther | Fait |
| W60-103 | Trésorerie | Introduire un état principal de qualité cohérent | Certain | C | P0 | Max, Véréna | Fait |
| W60-104 | Trésorerie | Décider si « Synchro OK » reste visible en secondaire | Interprétatif | C | P1 | Véréna | À arbitrer |
| W60-105 | Trésorerie | Enrichir légèrement la matière visuelle sans nuire au chiffre | Interprétatif | C | P1 | Max | À arbitrer |
| W60-106 | Trésorerie | Stabiliser la structure du clic vers le détail | Dette de stabilisation | C | P1 | Véréna, Esther | À faire |
| W60-107 | Trésorerie | Spécifier les états dégradés : partiel / attente / indisponible | Certain | C | P1 | Véréna, Esther | À faire |
| W60-108 | Trésorerie | Vérifier la lecture instantanée pour Max | Dette de stabilisation | E | P1 | Max | À faire |

### 6.1 Détail des items Trésorerie

#### W60-101 — Réaffirmer la dominance visuelle de Trésorerie *(densification maîtresse)*

* **Constat :** Trésorerie doit redevenir la première lecture incontestable du cockpit ; la carte doit **parler comme un instrument** (solde, qualité / gouvernance, sous-lectures métier), pas seulement occuper la place A.
* **Décision / sortie attendue :** densification **W60-101** — intention produit, périmètre, critères de réussite, implémentation et validation : voir la **fiche canonique** [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **§5.1** *(priorité suivi ticket P1 dans la fiche ; priorité backlog tableau §6 = P0)*.
* **Statut :** Fait — densification **§5.1** / **§5.1.1** ; finition contour / honnêteté **Partiel** portée par **W60-103** / **§5.3.1** ([`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md)).

#### W60-102 — Remplacer le badge unique « Synchro OK » comme lecture principale

* **Constat :** « Synchro OK » relève d’abord de la fraîcheur et ne peut suffire à qualifier l’instrument.
* **Décision / sortie attendue :** faire porter la lecture principale par un état de qualité, typiquement **Fiable** si les conditions sont remplies.
* **Statut :** Fait — badge **Fiable** quand `treasury.status === ok` ; [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **§5.2**.

#### W60-103 — Introduire un état principal de qualité cohérent

* **Constat :** les statuts API de la carte Trésorerie doivent se traduire en **doctrine d’état** unique et lisible ([spec §5.4](./SPEC_CARTES_MAITRESSES_LINKY.md)), sans mélanger fraîcheur et qualité.
* **Décision / sortie attendue :** mapping centralisé **Fiable** / **Partiel** / **En attente** / **Indisponible** selon `treasury.status` — voir [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **§5.3** ; **contour fin** et absence de vert trompeur en **Partiel** — **§5.3.1** / doctrine **§5.4.7**.
* **Statut :** Fait — `treasuryCockpitPrimaryBadge` + `cockpit-master-card-outline` ; déploiement lab **`LINKY_UI_BUILD_REF=1fd8df08`** ; **R60-004** **OK** ; détail [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **§5.3** / **§13**.

#### W60-105 — Enrichir légèrement la matière visuelle sans nuire au chiffre

* **Constat :** Trésorerie doit porter une présence premium et gouvernante sans tomber dans un fond vide ou trop illustratif.
* **Décision / sortie attendue :** ajuster la matière de fond pour renforcer stabilité et sérieux, sans créer de faux graphe ni compétition avec le montant.
* **Statut :** À arbitrer.

---

## 7. Backlog prioritaire — Business

| ID | Zone | Titre court | Catégorie | Axe | Priorité | Persona(s) | Statut |
|----|------|-------------|-----------|-----|----------|-------------|--------|
| W60-201 | Business | Enrichir la carte actuellement trop vide | Certain | C | P0 | Max, Véréna | À faire |
| W60-202 | Business | Réintroduire un état principal de lecture si nécessaire | Certain | C | P1 | Véréna, Esther | À faire |
| W60-203 | Business | Repositionner « Certifié » en état secondaire | Certain | C | P0 | Véréna, Esther | À faire |
| W60-204 | Business | Décider du repère contextuel court le plus utile | Interprétatif | C | P1 | Max, Véréna | À arbitrer |
| W60-205 | Business | Éviter que la carte paraisse décorativement vide | Certain | C | P1 | Max | À faire |
| W60-206 | Business | Fixer la logique détail cohérente avec l’activité | Dette de stabilisation | C | P1 | Véréna, Esther | À faire |
| W60-207 | Business | Spécifier les états partiel / à confirmer / indisponible | Certain | C | P1 | Véréna, Esther | À faire |
| W60-208 | Business | Vérifier la lecture « activité » pour Max | Dette de stabilisation | E | P1 | Max | À faire |

### 7.1 Détail des items Business

#### W60-201 — Enrichir la carte actuellement trop vide

* **Constat :** la carte Business porte un bon montant mais reste insuffisamment habitée visuellement.
* **Décision / sortie attendue :** introduire une matière ou un repère secondaire utile, cohérent avec l’idée d’activité économique, sans surcharger la carte.
* **Statut :** À faire.

#### W60-203 — Repositionner « Certifié » en état secondaire

* **Constat :** « Certifié » ne doit pas remplacer la qualité de lecture principale de Business.
* **Décision / sortie attendue :** conserver éventuellement « Certifié » comme signal secondaire distinctif, mais redonner à la carte une lecture d’état plus équilibrée.
* **Statut :** À faire.

#### W60-204 — Décider du repère contextuel court le plus utile

* **Constat :** Business a probablement besoin d’un repère court de type période / variation / MTD, mais la bonne formulation reste à trancher.
* **Décision / sortie attendue :** choisir un repère utile, stable et non redondant avec les filtres globaux du cockpit.
* **Statut :** À arbitrer.

---

## 8. Backlog prioritaire — Flux net

| ID | Zone | Titre court | Catégorie | Axe | Priorité | Persona(s) | Statut |
|----|------|-------------|-----------|-----|----------|-------------|--------|
| W60-301 | Flux net | Converger de « Proxy data » vers « Proxy » | Certain | C | P0 | Max, Véréna, Esther | À faire |
| W60-302 | Flux net | Réduire la dominance visuelle du badge proxy | Certain | C | P0 | Max | À faire |
| W60-303 | Flux net | Conserver l’honnêteté méthodologique sans dramatiser | Interprétatif | C | P1 | Véréna, Esther | À arbitrer |
| W60-304 | Flux net | Spécifier les cas futur « Fiable » vs actuel « Proxy » | Dette de stabilisation | C | P1 | Véréna, Esther | À faire |
| W60-305 | Flux net | Éviter la confusion entre signe du flux et ton d’état | Certain | C | P1 | Max, Esther | À faire |
| W60-306 | Flux net | Structurer le détail autour de la méthode de calcul | Dette de stabilisation | C | P1 | Véréna, Esther | À faire |
| W60-307 | Flux net | Spécifier partiel / indisponible | Certain | C | P1 | Véréna, Esther | À faire |
| W60-308 | Flux net | Vérifier que Max comprend « Proxy » sans friction | Interprétatif | E | P2 | Max | À arbitrer |

### 8.1 Détail des items Flux net

#### W60-301 — Converger de « Proxy data » vers « Proxy »

* **Constat :** « Proxy data » est plus lourd, moins élégant et moins conforme à la doctrine.
* **Décision / sortie attendue :** utiliser le libellé **Proxy** comme formulation canonique visible.
* **Statut :** À faire.

#### W60-302 — Réduire la dominance visuelle du badge proxy

* **Constat :** le badge de vigilance attire parfois presque plus l’œil que la valeur elle-même.
* **Décision / sortie attendue :** conserver la vérité produit tout en réduisant la compétition visuelle entre badge et montant principal.
* **Statut :** À faire.

#### W60-305 — Éviter la confusion entre signe du flux et ton d’état

* **Constat :** la couleur ou l’intensité d’état ne doit pas être interprétée comme un jugement sur la valeur positive ou négative du flux.
* **Décision / sortie attendue :** séparer clairement la sémantique « proxy / vigilance méthodologique » de la lecture mathématique du montant.
* **Statut :** À faire.

---

## 9. Backlog prioritaire — Second rang et cohérence d’ensemble

| ID | Zone | Titre court | Catégorie | Axe | Priorité | Persona(s) | Statut |
|----|------|-------------|-----------|-----|----------|-------------|--------|
| W60-401 | Second rang | Renforcer la hiérarchie B vs C | Certain | D | P1 | Max, Véréna | À faire |
| W60-402 | Second rang | Sortir du couple ambigu « — » + « Fiable » | Certain | D | P0 | Max, Véréna, Esther | À faire |
| W60-403 | Second rang | Définir les cas de « vide utile » | Dette de stabilisation | D | P1 | Véréna, Esther | À faire |
| W60-404 | Second rang | Réduire les badges inutiles sur cartes évidentes | Certain | D | P2 | Max | À faire |
| W60-405 | Ensemble cockpit | Stabiliser la lecture A / B / C en un coup d’œil | Interprétatif | A | P1 | Max | À arbitrer |
| W60-406 | Ensemble cockpit | Vérifier la continuité vers Synthèse comptable | Dette de stabilisation | A | P2 | Esther | À faire |

### 9.1 Détail des items second rang

#### W60-402 — Sortir du couple ambigu « — » + « Fiable »

* **Constat :** ce couple crée une ambiguïté forte entre absence de donnée, zéro métier et lecture saine.
* **Décision / sortie attendue :** basculer vers **Indisponible**, **Vide utile** ou autre qualification explicite selon le cas réel.
* **Statut :** À faire.

#### W60-405 — Stabiliser la lecture A / B / C en un coup d’œil

* **Constat :** la hiérarchie générale progresse, mais la distinction entre rangs n’est pas encore totalement évidente.
* **Décision / sortie attendue :** ajuster densité, contraste, tailles et sobriété pour rendre la hiérarchie immédiatement perceptible, surtout pour Max.
* **Statut :** À arbitrer.

---

## 10. Backlog de recette et de fermeture

| ID | Zone | Titre court | Catégorie | Axe | Priorité | Persona(s) | Statut |
|----|------|-------------|-----------|-----|----------|-------------|--------|
| W60-501 | Recette | Construire la mini-recette par persona | Dette de stabilisation | E | P1 | Max, Véréna, Esther | À faire |
| W60-502 | Recette | Vérifier la lisibilité instantanée à distance | Dette de stabilisation | E | P1 | Max | À faire |
| W60-503 | Recette | Vérifier la cohérence cockpit → détail | Dette de stabilisation | E | P1 | Véréna, Esther | À faire |
| W60-504 | Recette | Vérifier l’absence de conflit entre états positifs et états de vigilance | Dette de stabilisation | E | P1 | Max, Véréna | À faire |
| W60-505 | Recette | Documenter les arbitrages assumés de Web60 | Dette de stabilisation | E | P2 | Véréna, Esther | À faire |
| W60-506 | Recette | Préparer une passe « version montrable » | Dette de stabilisation | E | P1 | Max, Véréna, Esther | À faire |

---

## 11. Liste courte des sujets P0

Les sujets **P0** à traiter en premier dans Web60 sont les suivants :

1. **W60-001** — normaliser le lexique d’état visible — **Fait** (mars 2026, voir EXECUTION §13) ;
2. **W60-003** — distinguer clairement état principal / secondaire / global ;
3. **W60-101** — réaffirmer la dominance visuelle de Trésorerie ;
4. **W60-102** — remplacer le badge unique « Synchro OK » comme lecture principale de Trésorerie ;
5. **W60-103** — introduire un état principal de qualité cohérent sur Trésorerie ;
6. **W60-201** — enrichir Business actuellement trop vide ;
7. **W60-203** — repositionner « Certifié » en état secondaire sur Business ;
8. **W60-301** — converger de « Proxy data » vers « Proxy » ;
9. **W60-302** — réduire la dominance visuelle du badge proxy ;
10. **W60-402** — sortir du couple ambigu « — » + **Fiable**.

---

## 12. Journal de pilotage du lot

### 12.1 Principe

Le présent backlog a vocation à être mis à jour à mesure que les décisions sont prises.

Chaque item important doit, lorsque pertinent, évoluer avec :

* son statut ;
* la décision retenue ;
* la référence documentaire ou UI associée ;
* le cas de recette correspondant.

### 12.2 Règle d’usage

Ne pas multiplier les items si une décision peut fermer proprement un sujet.  
Le backlog doit rester un outil de fermeture produit, pas une inflation de tickets microscopiques.

### 12.3 Entrées datées

| Date | Entrée |
|------|--------|
| 25 mars 2026 | Publication **backlog v1.0** : schéma d’items **W60-xxx**, priorités P0–P3, axes A–E, catégories d’écart élargies ; remplace la granularité provisoire **WEB60-1 … WEB60-8**. |
| 25 mars 2026 | **v1.0.1** : §3.1 champ optionnel **Artefact cible** ; publication [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.0** comme cadre de validation. |
| 25 mars 2026 | **v1.0.2** : référence explicite à la recette **v1.1** dans l’en-tête ; consolidation transversale des cinq pièces (versions / statuts). |
| 25 mars 2026 | **v1.0.3** : [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.0** ; en-tête aligné plan **v1.1.5**, recette **v1.1.1**. |
| 25 mars 2026 | **v1.0.4** : **EXECUTION v1.1** — 5 passes, **T-W60-001…406** + **T-W60-501…506** ; premier bloc **Passe 1 — États visibles**. |
| 25 mars 2026 | **v1.0.5** : **Build / deploy prioritaire** — [lab.linky + tenant laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026) (en-tête + docs alignés). |
| 25 mars 2026 | **v1.0.6** : **EXECUTION v1.1.2** — régimes d’usage, raccord **R60** §10, DoD persona/viewport. |
| 25 mars 2026 | **v1.0.7** : **EXECUTION v1.1.3** — **Passe 1 ouverte** ; **§14** PR ultra **T-W60-001 → 003**. |
| 25 mars 2026 | **v1.0.8** : **EXECUTION v1.1.4** — **§13.1** brouillon clôture **T-W60-001** après lab (**R60-001…003**) ; **W60-001** reste **À faire** jusqu’à preuve lab. |
| 25 mars 2026 | **v1.0.9** : **EXECUTION v1.1.5** — règle **§13** (journal réel) vs **§13.1** (gabarit / procédure) ; pas de saisie « vivante » dans le gabarit. |
| 25 mars 2026 | **v1.1.0** : **W60-001** / **T-W60-001** **Fait** ; **EXECUTION v1.1.7** ; première ligne **§13** (lab, R60-001/002, Véréna + Max) ; suite Passe 1 : **T-W60-002**. |
| 25 mars 2026 | **v1.1.1** : **W60-005** / **T-W60-005** **Fait** (microcopy preuves vue vs cumulées) ; **EXECUTION v1.1.9** ; **§4.2** ; journal **§13**. |
| 25 mars 2026 | **v1.1.2** : **W60-101** / **T-W60-101** **En cours** (densification structurelle Trésorerie) ; **EXECUTION v1.1.10** ; **§5.1**. |
| 25 mars 2026 | **v1.1.3** : **§5.1** = fiche produit **W60-101** intégrale (statut **À faire**) ; **EXECUTION v1.1.11** ; **W60-101** / **T-W60-101** réalignés **À faire**. |
| 25 mars 2026 | **v1.1.4** : **EXECUTION v1.1.13** + **RECETTE v1.1.11** — lab public vs deploy local, preuve **UI** + hash ; commande **`./scripts/deploy-linky-lab.sh`** sur **l’hôte du lab**. |
| 25 mars 2026 | **v1.1.5** : **EXECUTION v1.1.14** + **RECETTE v1.1.12** — **`deploy-linky-lab.sh`** rebuild **linky_generic** (URL **lab.linky**) **et** **linky_lab_laplatine2026** ; spec **v1.1.13**. |
| 25 mars 2026 | **v1.1.6** : **EXECUTION v1.1.15** — **W60-101** / **W60-102** **En cours** (densification + badge **Fiable**) ; **§5.1.1** / **§5.2**. |
| 25 mars 2026 | **v1.1.7** : **EXECUTION v1.1.16** — **W60-103** / **T-W60-103** **En cours** ; **§5.3** `treasuryCockpitPrimaryBadge`. |
| 25 mars 2026 | **v1.1.8** : **EXECUTION v1.1.17** — **§5.3.1** contour cockpit ; **W60-101** / **W60-102** **Fait** ; **W60-103** **En cours** (preuve **lab**) ; doctrine **v1.1.2**. |
| 25 mars 2026 | **v1.1.9** : **EXECUTION v1.1.18** — **W60-103** / **T-W60-103** **Fait** ; **§13** ; **R60-004** **OK** ; recette **v1.1.16**, plan **v1.1.20**, spec **v1.1.17**. |

---

## 13. Formule de cap

> **Le backlog Web60 ne sert pas à embellir Linky par touches dispersées : il sert à fermer méthodiquement un cockpit Pilotage cohérent, lisible et montrable.**

---

## Historique des versions

| Version | Contenu |
|---------|---------|
| **1.0** | Backlog opérationnel publié : items **W60-001** à **W60-506**, règles §2, ordre d’exécution §4, liste P0 §11. |
| **1.0.1** | §3.1 **Artefact cible** (optionnel) ; renvoi à la recette **v1.0**. |
| **1.0.2** | Référence **Recette v1.1** en en-tête ; alignement avec consolidation dossier. |
| **1.0.3** | Référence **Guide exécution v1.0** ; plan **v1.1.5** ; recette **v1.1.1**. |
| **1.0.4** | **EXECUTION v1.1** (passes, **T-W60-xxx**) ; plan **v1.1.6** ; recette **v1.1.3**. |
| **1.0.5** | Référence **déploiement prioritaire lab / laplatine2026** ; plan **v1.1.7**. |
| **1.0.6** | **EXECUTION v1.1.2** ; plan **v1.1.8** ; recette **v1.1.5**. |
| **1.0.7** | **EXECUTION v1.1.3** ; trio Passe 1 documenté ; plan **v1.1.9** ; recette **v1.1.6** ; spec **v1.1.7**. |
| **1.0.8** | **EXECUTION v1.1.4** ; **§13.1** post-lab **T-W60-001** ; plan **v1.1.10** ; recette **v1.1.7** ; spec **v1.1.8** ; **W60-001** inchangé (**À faire**) jusqu’à preuve lab. |
| **1.0.9** | **EXECUTION v1.1.5** ; distinction **§13** / **§13.1** (journal vs gabarit) ; plan **v1.1.11** ; recette **v1.1.8** ; spec **v1.1.9**. |
| **1.1.0** | **W60-001** **Fait** ; **EXECUTION v1.1.7** ; journal **§13** alimenté (clôture lexique Pilotage) ; **§12.3** entrée datée. |
| **1.1.1** | **W60-005** / **T-W60-005** **Fait** ; **EXECUTION v1.1.9** ; **§4.2** (détail implémentation) ; journal **§13**. |
| **1.1.2** | **W60-101** / **T-W60-101** **En cours** ; **EXECUTION v1.1.10** ; **§5.1** (cap densification Trésorerie). |
| **1.1.3** | **§5.1** fiche **W60-101** (texte produit complet) ; **T-W60-101** / **W60-101** **À faire** ; **EXECUTION v1.1.11**. |
| **1.1.4** | **EXECUTION v1.1.13** / **RECETTE v1.1.11** : vérité recette = URL lab public ; deploy sur l’hôte ; **UI hash**. |
| **1.1.5** | **EXECUTION v1.1.14** / **RECETTE v1.1.12** : **`deploy-linky-lab.sh`** rebuild **linky_generic** (lab.linky) + **linky_lab_laplatine2026** ; spec **v1.1.13**. |
| **1.1.6** | **EXECUTION v1.1.15** : **W60-101** / **W60-102** **En cours** ; **§5.1.1** / **§5.2**. |
| **1.1.7** | **EXECUTION v1.1.16** : **W60-103** **En cours** ; **§5.3** mapping qualité Trésorerie. |
| **1.1.8** | **EXECUTION v1.1.17** : **§5.3.1** ; **W60-101** / **W60-102** **Fait** ; **W60-103** **En cours** ; doctrine **v1.1.2**, spec **v1.1.16**, recette **v1.1.15**, plan **v1.1.19**. |
| **1.1.9** | **EXECUTION v1.1.18** : **W60-103** **Fait** ; **R60-004** ; **§13** ; spec **v1.1.17**, recette **v1.1.16**, plan **v1.1.20**. |

---

**Fin du document**
