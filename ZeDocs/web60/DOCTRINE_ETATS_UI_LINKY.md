# Doctrine des états UI — Linky

**Fichier canonique :** `DOCTRINE_ETATS_UI_LINKY.md`
**Version :** 1.1.2 — mars 2026
**Lot :** Web60
**Référence de cadrage :** [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) **v1.1.19** (cadrage publié)
**Référence créa figée :** `ZeDocs/web59/stitch_carole_61`
**Statut :** doctrine publiée

---

## 1. Objet du document

Le présent document définit la doctrine officielle des **états UI** de Linky sur le régime **Pilotage**.

Son objectif est de transformer des badges ou signaux aujourd’hui parfois hétérogènes en un **langage produit unifié**, lisible, cohérent et directement exploitable en implémentation.

Cette doctrine répond à quatre besoins :

* clarifier ce que l’interface dit réellement sur une donnée ;
* éviter la prolifération de labels ad hoc ;
* rendre les cartes comparables entre elles ;
* faire primer la vérité produit sur l’effet décoratif.

---

## 2. Principe directeur

Un état UI n’est **jamais** un simple élément graphique.

Dans Linky, un état UI est une **prise de parole normative** du produit sur la qualité de lecture d’un instrument.

Autrement dit, tout état visible doit répondre explicitement à une question utile pour l’utilisateur :

* la donnée est-elle disponible ?
* la donnée est-elle fiable ?
* la donnée est-elle certifiée ou simplement exploitable ?
* la donnée est-elle complète ou partielle ?
* la donnée provient-elle d’un calcul direct ou d’un proxy ?
* la donnée est-elle fraîche ?
* l’absence de valeur est-elle normale ou problématique ?

Si un badge ne répond à aucune de ces questions, il n’a pas de raison d’exister.

---

## 3. Règles fondatrices

### 3.1 Un état = une information explicite

Chaque état doit porter une signification précise, stable et réutilisable.

Sont interdits :

* les badges purement décoratifs ;
* les formulations floues ;
* les états ambigus selon la carte ;
* les synonymes concurrents pour une même réalité.

### 3.2 Ne pas confondre les dimensions

Un état de **fiabilité** n’est pas un état de **fraîcheur**.
Un état de **certification** n’est pas un état de **disponibilité**.
Un état de **proxy** n’est pas un état d’**erreur**.

La doctrine distingue donc plusieurs dimensions indépendantes.

### 3.3 Peu d’états, mais solides

Le bon système n’est pas celui qui multiplie les badges, mais celui qui emploie un petit nombre d’états robustes, combinables et compréhensibles.

### 3.4 La vérité produit prime

Linky ne doit jamais sur-promettre.
Dès qu’une donnée est substitutive, partielle, approximative ou en attente, l’état doit le dire clairement.

### 3.5 Un instrument ne doit pas “parler trop fort”

Une carte ne doit pas afficher plusieurs badges concurrents de même niveau.
La règle générale est :

* **un état principal visible** ;
* éventuellement **un état secondaire discret** ;
* les autres informations vont dans le détail, le tooltip ou la microcopy.

---

## 4. Les 5 dimensions officielles d’état

Tout état visible dans Linky doit relever d’une des cinq dimensions suivantes.

### 4.1 Disponibilité

Répond à : **la donnée est-elle présente et affichable ?**

Exemples :

* disponible ;
* indisponible ;
* en attente ;
* vide utile.

### 4.2 Qualité de lecture

Répond à : **peut-on raisonnablement piloter avec cette donnée ?**

Exemples :

* fiable ;
* partiel ;
* à confirmer.

### 4.3 Nature de preuve

Répond à : **quel est le niveau de garantie ou d’ancrage probant ?**

Exemples :

* certifié ;
* prouvé / scellé ;
* non certifié.

### 4.4 Nature de calcul

Répond à : **la valeur est-elle directe ou substitutive ?**

Exemples :

* direct ;
* proxy ;
* estimé.

### 4.5 Fraîcheur / synchronisation

Répond à : **la donnée est-elle à jour et correctement synchronisée ?**

Exemples :

* à jour ;
* synchro OK ;
* en retard ;
* arrêté à telle date.

---

## 5. Hiérarchie des états dans l’interface

Toutes les dimensions n’ont pas le même poids visuel.

### 5.1 Niveau 1 — État principal de carte

C’est l’état qui aide immédiatement à interpréter la valeur affichée.

Exemples admissibles :

* **Fiable** ;
* **Partiel** ;
* **En attente** ;
* **Indisponible** ;
* **Proxy**.

Une carte ne doit pas afficher plus d’un état principal au même niveau de prominence.

### 5.2 Niveau 2 — État secondaire

C’est un complément utile mais non dominant.

Exemples :

* **Certifié** ;
* **Synchro OK** ;
* **Arrêté à 10:39** ;
* **Scellé**.

### 5.3 Niveau 3 — État de système global

Ces états relèvent du chrome global, pas de chaque carte.

Exemples :

* taux global de fiabilité ;
* nombre de preuves scellées ;
* sources connectées ;
* état de synchronisation global.

### 5.4 Langage visuel des cartes principales *(cockpit Pilotage)*

#### 5.4.1 Synthèse normative *(Web60 — décisions courtes)*

* **Dominance** d’une carte maîtresse = **taille**, **position**, **hiérarchie typographique**, **densité maîtrisée** — pas un liseré coloré agressif ni un signal qui surjoue la confiance.
* **Contour fin** (ou équivalent sobre) = **niveau principal de fiabilité** de la lecture — pas la « priorité métier » de l’instrument.
* **État principal** = **badge** + microcopy (+ indicateur mesuré si utile) ; le ton visuel de la carte ne doit pas être **plus confiant** que les données.
* **Sous-lectures** : **2 à 3** max, **métier**, **stables**, utiles au cockpit — pas un extrait de page détail.
* Ordre de lecture cible : **chiffre** → **nature du chiffre** → **état principal** → **sous-lectures** → **accès détail**.
* **Rouge** : réservé aux **erreurs techniques / chargement / incident explicite** — jamais comme code de « mauvaise perf » métier.
* **Trésorerie** : **pas de contour vert discret** tant que l’état principal est **Partiel** (ou qu’une part significative reste **non rapprochée** / réserve principale active). *Importance forte ≠ lecture entièrement validée.*

#### 5.4.2 Principe général

Les **cartes principales** sont les instruments cardinaux du cockpit : lecture **immédiate**, **hiérarchisée** et **honnête**, sans se substituer au détail.

Elles expriment, dans cet ordre :

1. le **chiffre principal** ;
2. la **nature exacte** de ce chiffre ;
3. l’**état principal de fiabilité** de la lecture ;
4. **deux à trois** sous-lectures métier utiles ;
5. une **entrée claire** vers le détail.

#### 5.4.3 Règle de dominance

La dominance est portée par la **place dans la grille**, le **poids du montant**, la **lisibilité du bloc**, une matière sobre. Elle ne doit **pas** reposer sur un **liseré supérieur** ou une **surcharge chromatique** qui ferait office de « preuve » visuelle.

#### 5.4.4 Cadre visuel et règle colorielle du contour

Les cartes principales privilégient un **encadré fin** : structure la carte, affirme la présence, reste sobre. Ce contour traduit l’**état principal de fiabilité** (pas l’importance relative de l’instrument dans le business).

| Ton du contour | Usage |
|----------------|--------|
| **Vert discret** | Lecture **fiable**, **complète**, **suffisamment rapprochée / fermée**, sans réserve principale active. |
| **Neutre / bleu gris** | Lecture **exploitable** mais **partielle**, **en cours de rapprochement**, ou réserve **non bloquante**. |
| **Ambre discret** | **Proxy**, **estimé**, **à confirmer**, ou fragilité **méthodologique** assumée. |
| **Gris** | **Indisponible**, **non alimenté**, **en attente**, hors périmètre. |
| **Rouge** | **Erreur système**, **échec de chargement**, incident **technique** explicite — pas un signal métier négatif. |

#### 5.4.5 Règle d’état principal et de sous-lectures

L’état principal est porté par le **badge** (`Fiable`, `Partiel`, `Proxy`, `Indisponible`, `En attente`, etc.), la **microcopy** et, si besoin, un **indicateur chiffré** (ex. couverture %). Les sous-lectures enrichissent sans **redonder** le badge : elles **objectivent** (mesure, chantier restant, écart de référentiel).

#### 5.4.6 Règle spécifique — Trésorerie

**Règle canonique.** Tant que l’état principal est **Partiel** (ou qu’une part significative des écritures reste **non rapprochée** / réserve structurante), la carte **ne porte pas** un contour **vert** de type « tout est validé ». La **centralité** de la tuile n’emporte pas une **promesse de confiance** excessive.

**Traduction visuelle (cible).**

| Situation | Contour | Badge | Notes |
|-----------|---------|-------|--------|
| Lecture **complète / fiable / rapprochée** | Vert discret | **Fiable** (ou équivalent) | Couverture et sous-lectures **cohérentes** avec cet état. |
| Lecture **partielle** | Neutre / bleu gris | **Partiel** | Conserver couverture, **Écart ERP − Vault**, **Volume à rapprocher** si pertinents. |
| **Proxy / à confirmer** | Ambre discret | **Proxy** ou **À confirmer** | Microcopy ou tooltip sur la **réserve** méthodologique. |
| **Indisponible / attente** | Gris | **Indisponible** ou **En attente** | — |

**Doctrine sémantique.** Sur Trésorerie, distinguer sans les confondre :

* **chiffre principal** = niveau de trésorerie lu ;
* **état** = synthèse (**Partiel**, **Fiable**, …) ;
* **mesure de confiance** = ex. **Couverture probante** ;
* **chantier restant** = ex. **Volume à rapprocher** ;
* **écart de référentiel** = ex. **Écart ERP − Vault**.

> **Formulation canonique courte.** Le contour d’une carte principale reflète la **fiabilité** de la lecture affichée, pas la **priorité métier** de l’instrument ni une confiance que la carte ne peut pas encore tenir. Une **Trésorerie partielle** ou encore en **rapprochement** ne porte **pas** de contour vert.

#### 5.4.7 Référence implémentation *(cockpit desktop)*

* Module : `units/dorevia-linky/app/lib/cockpit/cockpit-master-card-outline.ts` — `treasuryMasterCardOutlineClass`, `metricConfidenceOutlineClass`, `treasuryWalletIconSurfaceClass`.  
* Cartes maîtresses : `CockpitDesktopView.tsx` (Trésorerie, Business, Flux net) — **pas de liseré haut** ; **contour fin** = état principal / confiance métrique.

---

## 6. Lexique officiel autorisé

Le lexique ci-dessous constitue la base autorisée des états visibles dans Linky.
Tout nouvel état doit être justifié par un manque réel de ce lexique.

### 6.1 Disponibilité

#### Disponible

La donnée nécessaire est présente et la carte peut être lue normalement.
En pratique, cet état n’a pas vocation à être affiché comme badge ; c’est l’état par défaut.

#### En attente

La donnée est attendue, mais pas encore disponible dans des conditions normales de lecture.
Exemples : synchronisation en cours, source pas encore reçue, calcul pas encore terminé.

#### Indisponible

La donnée ne peut pas être fournie. L’absence n’est pas interprétable comme un zéro.

#### Vide utile

L’absence de valeur est informative et non anormale.
Exemple : aucun remboursement sur la période.

**Bornes d’usage (opérationnel) :**

* **Vide utile** est surtout pertinent pour des **flux ou événements ponctuels** (remboursements, notes de crédit, mouvements rares) où « zéro activité » est une information ;
* sur une **carte maîtresse**, ne l’employer qu’avec **prudence** et lorsque le produit veut explicitement dire « rien à signaler » sans ambiguïté avec une panne ;
* lorsque la valeur **`0,00 €`** suffit à porter seule le sens métier, **on peut ne pas afficher de badge** — éviter le sur-badgage des cartes de second rang ;
* ne pas utiliser **Vide utile** comme substitut à **Indisponible** quand l’utilisateur ne peut pas lire l’instrument.

### 6.2 Qualité de lecture

#### Fiable

La donnée est exploitable pour le pilotage dans le périmètre affiché.
C’est l’état positif par défaut quand aucun doute significatif n’altère la lecture.

#### Partiel

La donnée existe mais n’est pas complète ou couvre imparfaitement le périmètre attendu.

#### À confirmer

La donnée est lisible, mais son niveau de robustesse ou de réconciliation ne permet pas encore une confiance pleine.

### 6.3 Nature de preuve

#### Certifié

La donnée ou l’instrument est rattaché à un niveau de garantie probante supérieur au simple affichage opérationnel.

#### Scellé

L’élément renvoie explicitement à l’existence d’une preuve scellée ou d’un ancrage Vault.

### 6.4 Nature de calcul

#### Proxy

La valeur repose sur une approximation structurée, un substitut, ou une reconstruction acceptable mais non native.

#### Estimé

La valeur est calculée à partir d’une hypothèse ou d’un mécanisme d’estimation plus fragile qu’un proxy métier stable.

### 6.5 Fraîcheur / synchronisation

#### Synchro OK

La chaîne de mise à jour attendue est opérationnelle au moment de la lecture.

#### En retard

La donnée ou la chaîne de synchronisation n’est pas à jour au regard de l’attendu produit.

#### Arrêté à …

État temporel de référence du cockpit ou du périmètre de lecture.
Cet état relève d’abord du chrome global, pas des cartes individuelles.

---

## 7. États interdits ou fortement déconseillés

Sont interdits ou à éviter :

* **OK** seul, sans objet explicite ;
* **Valide** si le sens n’est pas strictement défini ;
* **Bon** / **Mauvais** ;
* **Normal** ;
* **Healthy** ou anglicismes non nécessaires ;
* plusieurs synonymes pour la même réalité (`Fiable`, `Solide`, `Sûr`, etc.) ;
* l’usage de **—** seul pour signaler un état métier ambigu.

Le tiret `—` n’est acceptable qu’en représentation visuelle d’absence de valeur, à condition que l’état associé explicite cette absence.

---

## 8. Matrice de sens

### 8.1 Fiable

**Sens :** la donnée est exploitable pour piloter.
**À utiliser quand :** l’utilisateur peut raisonnablement prendre la valeur au sérieux.
**À ne pas utiliser quand :** la donnée est proxy, partielle, en attente ou indisponible sans précision.

### 8.2 Certifié

**Sens :** l’instrument ou la donnée bénéficie d’un niveau probant supérieur.
**À utiliser quand :** la règle produit de certification est objectivement remplie.
**À ne pas utiliser quand :** il s’agit seulement d’une donnée disponible ou fraîche.

### 8.3 Proxy

**Sens :** la valeur est substitutive mais assumée.
**À utiliser quand :** le produit veut dire la vérité sur une approximation.
**À ne pas utiliser quand :** la valeur est simplement calculée normalement.

### 8.4 Synchro OK

**Sens :** le flux de mise à jour attendu fonctionne.
**À utiliser quand :** un vrai mécanisme de synchronisation est concerné.
**À ne pas utiliser quand :** on veut juste exprimer que la valeur est “bonne”.

### 8.5 En attente

**Sens :** la donnée devrait arriver mais n’est pas encore consommable.
**À utiliser quand :** la situation est transitoire.
**À ne pas utiliser quand :** il n’existe pas de donnée par conception.

### 8.6 Indisponible

**Sens :** la donnée ne peut pas être fournie.
**À utiliser quand :** l’utilisateur doit comprendre qu’aucune lecture n’est possible.
**À ne pas utiliser quand :** la vraie situation est un zéro métier ou un vide utile.

### 8.7 Vide utile

**Sens :** rien à signaler, et cette absence a du sens.
**À utiliser quand :** l’absence de flux ou de valeur est informative.
**Exemple :** remboursement = 0 sur la période.
**Précision :** voir **§6.1 — Vide utile** (bornes d’usage, cartes maîtresses, `0,00 €` sans badge).

---

## 9. Règles de combinaison

### 9.1 Combinaisons autorisées

Exemples légitimes :

* **Fiable** + **Certifié** ;
* **Fiable** + **Synchro OK** ;
* **Proxy** + **À confirmer** ;
* **Vide utile** + valeur `0,00 €` ;
* `—` + **Indisponible**.

### 9.2 Combinaisons à éviter

* **Fiable** + **Proxy** au même niveau sans explication ;
* **Certifié** + **Partiel** sans préciser la portée ;
* `—` + **Fiable** si l’absence n’est pas explicitée ;
* **Synchro OK** + **En retard** ;
* plusieurs badges verts positifs sans hiérarchie.

### 9.3 Règle de dominance

Lorsqu’une carte combine plusieurs réalités, l’état visible principal doit refléter **la limite la plus structurante pour l’interprétation**.

Exemples :

* si la donnée est disponible mais partielle, l’état principal devient **Partiel** ;
* si la donnée est proxy mais exploitable, l’état principal peut devenir **Proxy** avec **Fiable** relégué ou supprimé ;
* si la donnée est absente mais normale, on préfère **Vide utile** à **Indisponible**.

### 9.4 Ordre de précédence des états visibles (état principal)

Quand plusieurs réalités coexistent sur une même carte, l’**état principal** affiché doit suivre l’ordre de **précédence** ci-dessous (du plus structurant au moins prioritaire pour l’interprétation). Cela complète la **règle de dominance** (§9.3) avec une règle **explicite** utilisable au codage.

1. **Indisponible** / **En attente** — aucune lecture fiable ou situation transitoire bloquante ;
2. **Partiel** / **Proxy** / **À confirmer** — donnée présente mais limitée, substitutive ou à consolider ;
3. **Fiable** — lecture pilotable dans le périmètre affiché ;
4. **Certifié** / **Synchro OK** — en **secondaire** (niveau 2), sauf cas produit documenté où l’un d’eux devient le message dominant ;
5. **Arrêté à…**, **preuves**, **sources** — en **niveau global** (chrome / trust bar), pas comme substitut d’un état principal de carte.

En cas de doute entre deux niveaux du même rang (ex. **Partiel** vs **Proxy**), prévaloir l’état qui décrit la **limite la plus contraignante** pour la décision.

---

## 10. Doctrine de placement

### 10.1 Badge principal de carte

Position : zone basse ou angle secondaire selon la grammaire de la carte, mais toujours à un emplacement stable dans une même famille.

Rôle : qualifier la lecture principale.

Exemples :

* **Fiable** ;
* **Proxy** ;
* **Partiel** ;
* **En attente**.

### 10.2 Badge secondaire de carte

Position : plus discrète, généralement opposée au badge principal ou associée à un coin de carte.

Rôle : donner une information complémentaire non dominante.

Exemples :

* **Certifié** ;
* **Synchro OK**.

### 10.3 État global de cockpit

Position : barre haute, barre de pilotage ou trust bar.

Rôle : exprimer l’état du système de lecture, pas celui d’une seule carte.

Exemples :

* **100,0 % Fiable** ;
* **Arrêté 25 mars 2026 à 10:39** ;
* nombre de preuves scellées.

---

## 11. Doctrine de couleur

La couleur doit renforcer le sens, jamais le remplacer.

### 11.1 Vert

Réservé aux états positifs ou rassurants clairement définis :

* **Fiable** ;
* **Certifié** ;
* **Synchro OK** ;
* éventuellement **Scellé** si la grammaire globale l’assume.

### 11.2 Orange / ambre

Réservé aux états de vigilance :

* **Proxy** ;
* **Partiel** ;
* **À confirmer** ;
* **En retard**.

### 11.3 Gris / désaturé

Réservé aux états neutres ou d’absence :

* **Indisponible** ;
* **En attente** ;
* **Vide utile**.

### 11.4 Rouge

À réserver aux erreurs système réelles ou ruptures de lecture.
Le rouge n’a pas vocation à qualifier une performance métier ou une valeur financière négative.

---

## 12. Doctrine de microcopy

### 12.1 Les états doivent être courts

Un badge doit rester court, stable, mémorisable.
Cible générale : 1 à 3 mots.

### 12.2 La précision va dans l’aide contextuelle

Si le sens nécessite une nuance, elle doit aller dans :

* tooltip ;
* texte secondaire ;
* détail de carte ;
* documentation produit.

### 12.3 Formulations recommandées

À privilégier :

* **Fiable** ;
* **Certifié** ;
* **Proxy** ;
* **Partiel** ;
* **En attente** ;
* **Indisponible** ;
* **Synchro OK** ;
* **Arrêté à 10:39**.

À éviter :

* **Donnée fiable et synchronisée** ;
* **Approximation de calcul** ;
* **Pas encore disponible actuellement**.

---

## 13. Application aux cas visibles actuels

### 13.1 Carte Trésorerie

Lecture actuelle observée : valeur maîtresse + **Synchro OK**.

Doctrine recommandée :

* l’état principal de lecture doit rester lié à la **qualité** de la donnée ;
* **Synchro OK** ne doit pas suffire à lui seul à qualifier l’instrument ;
* si la donnée est pleinement exploitable, l’état principal attendu est **Fiable** ;
* **Synchro OK** peut subsister en état secondaire discret si la synchronisation constitue un message produit important.

### 13.2 Carte Business

Lecture actuelle observée : valeur + **Certifié**.

Doctrine recommandée :

* **Certifié** peut être maintenu comme état secondaire ou distinctif si la règle produit est solide ;
* la carte ne doit pas donner l’impression qu’“être certifié” remplace l’état de lecture principal ;
* si Business est directement pilotable, la qualité de lecture doit rester claire.

### 13.3 Carte Flux net

Lecture actuelle observée : badge **Proxy data** très visible.

Doctrine recommandée :

* conserver l’honnêteté sur le caractère **Proxy** ;
* simplifier le libellé vers **Proxy** plutôt que **Proxy data** ;
* traiter **Proxy** comme état principal de vigilance, avec une intensité visuelle maîtrisée ;
* éviter qu’il prenne plus de place visuelle que la valeur elle-même.

### 13.4 Carte Z de caisse

Lecture actuelle observée : valeur `—` avec badge **Fiable**.

Doctrine recommandée :

* `—` ne doit jamais être laissé seul sans interprétation métier claire ;
* si la donnée n’existe pas sur le périmètre, utiliser **Indisponible** ;
* si aucune Z de caisse n’est attendue ou présente, préférer un **vide utile** explicitement assumé ;
* éviter le couple `—` + **Fiable** sans précision.

### 13.5 Cartes avec `0,00 €`

Doctrine recommandée :

* `0,00 €` est une valeur métier valide ;
* le badge ne doit pas laisser croire à une panne ;
* si l’absence de flux est informative, employer **Vide utile** ou laisser la valeur seule selon le contexte ;
* ne pas forcer **Fiable** partout par réflexe si cela n’apporte rien à la lecture.

---

## 14. Règles par type de carte

### 14.1 Cartes maîtresses

Les cartes maîtresses peuvent afficher :

* 1 état principal ;
* 1 état secondaire éventuel ;
* 1 repère temporel ou système si nécessaire.

Elles ne doivent pas devenir des panneaux de badges.

### 14.2 Cartes de second rang

Les cartes de second rang doivent privilégier la sobriété.
Dans la plupart des cas :

* soit aucun badge si la lecture est évidente ;
* soit un seul badge de qualité ;
* soit un état de vigilance si nécessaire.

### 14.3 Écrans détail

Les écrans détail peuvent expliciter davantage :

* complétude ;
* couverture ;
* nature de preuve ;
* chronologie de synchro ;
* motifs d’indisponibilité.

Le détail est le bon lieu pour déplier la complexité que la carte résume.

---

## 15. Règles d’implémentation

### 15.1 Chaque état doit avoir un identifiant produit stable

Le rendu visuel ne doit pas être l’unique définition.
Chaque état doit être adossé à une clé stable de type :

* `reliable`
* `certified`
* `proxy`
* `partial`
* `pending`
* `unavailable`
* `sealed`
* `sync_ok`
* `stale`
* `empty_useful`

### 15.2 Les composants ne décident pas seuls du sens

Un composant d’affichage ne doit pas inventer localement la sémantique.
La logique produit doit produire un état normalisé, puis le composant le rend.

### 15.3 Centraliser le mapping

Le mapping entre :

* état produit ;
* label ;
* ton visuel ;
* icône éventuelle ;
* niveau de prominence

… doit être centralisé.

### 15.4 Tooltips et aides contextuelles

Un état qui porte une nuance importante doit pouvoir être expliqué par un tooltip ou une aide courte.

Exemple :

* **Proxy** → “Valeur calculée à partir d’un substitut métier en attendant la donnée directe.”

### 15.5 Transitions d’état attendues

Linky est un produit **vivant** (synchronisation, polling, données partielles, recalculs). Les transitions suivantes sont **typiques et admises** entre clés produit (cf. §15.1) :

* `pending` → `reliable` — donnée arrivée et lecture pilotable ;
* `pending` → `unavailable` — échec ou absence définitive sur le périmètre ;
* `proxy` → `reliable` — donnée directe disponible, le substitut n’est plus nécessaire ;
* `partial` → `reliable` — complétude atteinte ;
* `reliable` → `stale` — la fraîcheur ou la synchro ne tient plus l’engagement de lecture (cf. dimension §4.5).

**Règle normative :** une transition doit toujours aller vers un état **plus explicite** pour l’utilisateur (qui sait mieux *comment lire* la donnée), **jamais** vers un état **plus flou** (ex. ne pas repasser de `proxy` à `reliable` sans que la nature du calcul ait réellement changé).

Les transitions inverses (`reliable` → `pending`, etc.) ne sont autorisées que si la **réalité produit** change (re-sync, changement de périmètre, source perdue), pas pour « masquer » une dégradation.

---

## 16. Règles de recette

Une recette d’état UI doit vérifier au minimum :

* l’état affiché correspond bien à la réalité produit ;
* deux cartes comparables n’emploient pas des labels différents pour la même situation ;
* un badge positif ne masque pas une limitation plus structurante ;
* une absence de valeur est correctement interprétée ;
* la hiérarchie visuelle entre badge principal, badge secondaire et état global est respectée.

---

## 17. Décisions normatives immédiates pour Web60

À l’ouverture de Web60, les décisions suivantes sont retenues :

1. **Proxy data** doit converger vers **Proxy** ;
2. `—` ne doit plus être laissé sans qualification explicite ;
3. **Fiable** ne doit pas être utilisé comme badge réflexe universel ;
4. **Synchro OK** relève d’abord de la fraîcheur, pas de la qualité intrinsèque ;
5. **Certifié** ne doit pas remplacer un état principal de lecture quand celui-ci est nécessaire ;
6. les cartes maîtresses ont droit à une combinatoire plus riche que les cartes de second rang ;
7. la barre haute et la trust bar doivent porter la majorité des états globaux du système.

---

## 18. Suite documentaire attendue

Cette doctrine a vocation à être relayée par :

* [`SPEC_CARTES_MAITRESSES_LINKY.md`](./SPEC_CARTES_MAITRESSES_LINKY.md) **v1.1.16** (spécification publiée) ;
* [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) **v1.1.8** (items **W60-xxx**) ;
* [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.1.15** (protocole de validation publié) ;
* [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1.17** (passes, **lab public** / **UI hash**, **§13** journal / **§13.1** gabarit **T-W60-001** ; **§4.2** **W60-005** ; **§5.3** / **§5.3.1** **W60-103** ; **§14** trame **T-W60-002** ; lab **`laplatine2026`**).

Elle constitue la norme de référence pour les futurs arbitrages d’états sur le cockpit **Pilotage**.

---

## 19. Formule de cap

> **Dans Linky, un état UI n’habille pas une donnée : il dit à l’utilisateur comment il peut la lire.**

---

## Annexe A — Mapping canonique (référence implémentation)

Table de **pont** entre clés produit, libellés UI, dimensions, niveau visuel, ton couleur et tooltip court. À maintenir alignée sur le code (mapping centralisé, §15.3).

| Clé produit | Label UI | Dimension | Niveau visuel usuel | Ton couleur (§11) | Tooltip court (ex.) | Exemples d’usage |
|-------------|----------|-----------|---------------------|-------------------|---------------------|------------------|
| `reliable` | Fiable | Qualité de lecture | Principal (1) | Vert | « Donnée exploitable pour piloter sur le périmètre affiché. » | Carte maîtresse OK |
| `certified` | Certifié | Nature de preuve | Secondaire (2) | Vert | « Niveau probant renforcé selon les règles produit. » | Business, scellement |
| `proxy` | Proxy | Nature de calcul | Principal (1) | Ambre | « Valeur substitutive ; approximation assumée. » | Flux net |
| `partial` | Partiel | Qualité de lecture | Principal (1) | Ambre | « Donnée incomplète sur le périmètre attendu. » | Agrégation partielle |
| `pending_confirm` | À confirmer | Qualité de lecture | Principal (1) | Ambre | « Lecture possible ; robustesse ou rapprochement à consolider. » | Réconciliation |
| `pending` | En attente | Disponibilité | Principal (1) | Gris / neutre | « Donnée attendue ; chargement ou synchro en cours. » | Premier chargement |
| `unavailable` | Indisponible | Disponibilité | Principal (1) | Gris / neutre | « Aucune lecture possible ; ce n’est pas un zéro métier. » | Source absente |
| `empty_useful` | Vide utile | Disponibilité | Principal ou secondaire selon cas | Gris / neutre | « Aucun flux sur la période ; absence informative. » | Rembours. nuls |
| `sealed` | Scellé | Nature de preuve | Secondaire (2) ou global | Vert (si grammaire unifiée) | « Preuve scellée ou ancrage probant. » | Lien Vault |
| `sync_ok` | Synchro OK | Fraîcheur / synchro | Secondaire (2) | Vert | « Chaîne de mise à jour opérationnelle. » | Trésorerie |
| `stale` | En retard | Fraîcheur / synchro | Principal (1) ou secondaire | Ambre | « Donnée ou synchro en retard vs l’attendu. » | Source en retard |

*Les lignes du mapping peuvent être étendues (`estimated`, etc.) sous réserve de justification lexicale (§6).*

---

## Historique des versions

| Version | Contenu |
|---------|---------|
| **1.0** | Doctrine initiale publiée (philosophie, dimensions, lexique, implémentation, cas réels §13). |
| **1.1** | Ajout **§9.4** (ordre de précédence), **§15.5** (transitions), **bornes §6.1 Vide utile**, **Annexe A** (mapping canonique), renvoi **§8.7** → §6.1. |
| **1.1.1** | **§5.4** — langage visuel des **cartes principales** : synthèse normative Web60, contour = fiabilité, règle **Trésorerie** (partiel ⇒ pas de vert), sémantique chiffre / état / mesure / chantier / écart. |
| **1.1.2** | **Figé / exécuté** : **encadré fin** des cartes maîtresses cockpit ; **le contour exprime la fiabilité** ; **Trésorerie partielle = pas de vert** (liseré haut supprimé, mapping `cockpit-master-card-outline`) ; **§5.4.7** référence code. |

---

**Fin du document**
