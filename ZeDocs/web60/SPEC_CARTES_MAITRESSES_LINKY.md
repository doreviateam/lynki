# Spécification des cartes maîtresses — Linky

**Fichier canonique :** `SPEC_CARTES_MAITRESSES_LINKY.md`
**Version :** 1.1.16 — mars 2026  
**Lot :** Web60  
**Références de cadrage :** [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) **v1.1.19**, [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) **v1.1.2** · **Backlog :** [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) **v1.1.8** · **Recette :** [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.1.15** · **Exécution :** [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1.17** · **Lab :** [laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026)
**Référence créa figée :** `ZeDocs/web59/stitch_carole_61`
**Périmètre :** régime **Pilotage** — cartes **Trésorerie**, **Business**, **Flux net**
**Statut :** spécification publiée

---

## 1. Objet du document

Le présent document spécifie la grammaire produit, visuelle et comportementale des trois **cartes maîtresses** du cockpit Linky en régime **Pilotage** :

* **Trésorerie** ;
* **Business** ;
* **Flux net**.

Ces trois cartes portent l’essentiel de la promesse produit visible de Linky. Elles doivent donc être traitées comme des **instruments de pilotage majeurs**, distincts des cartes de second rang.

Leur rôle n’est pas seulement d’exposer une valeur, mais de rendre immédiatement lisible :

* une lecture financière prioritaire ;
* un niveau de confiance ;
* une nature de calcul ou de preuve ;
* une orientation naturelle vers le détail.

---

## 2. Rôle des cartes maîtresses dans le cockpit

### 2.1 Statut UI

Les cartes maîtresses constituent le premier niveau de lecture du cockpit.

Elles doivent :

* capter l’attention en premier ;
* être lisibles en quelques secondes ;
* donner une sensation de sérieux et de maîtrise ;
* installer la crédibilité de Linky comme outil de pilotage.

### 2.2 Rôle produit

Chaque carte maîtresse répond à une question centrale différente :

* **Trésorerie** : combien de cash validé est réellement disponible à date ?
* **Business** : quel volume d’activité économique est observé sur la période ?
* **Flux net** : quel est le solde net des entrées et sorties sur la période ?

### 2.3 Lecture par persona

La spécification des cartes maîtresses doit être lue à travers les trois personas de référence Linky.

#### Max

Max est le dirigeant ou décideur qui cherche une lecture très rapide, orientée décision.

Pour Max, les cartes maîtresses doivent :

* livrer un signal compréhensible en quelques secondes ;
* rendre immédiatement lisible la situation du moment ;
* éviter toute ambiguïté sur la confiance à accorder à la valeur ;
* permettre une lecture efficace sans devoir ouvrir le détail.

#### Véréna

Véréna est la persona RAF / finance qui utilise le cockpit comme outil de pilotage quotidien.

Pour Véréna, les cartes maîtresses doivent :

* être robustes dans leur sémantique ;
* exposer un niveau de confiance clair ;
* préparer naturellement l’entrée dans le détail ;
* articuler correctement lecture immédiate et contrôle plus fin.

#### Esther

Esther est la persona contrôle de gestion / lecture analytique.

Même si le régime **Pilotage** n’est pas son point d’entrée exclusif, les cartes maîtresses doivent rester compatibles avec sa logique de lecture :

* cohérence de définitions ;
* absence d’ambiguïté méthodologique ;
* continuité vers la **Synthèse comptable** et les vues détail ;
* stabilité sémantique suffisante pour permettre l’analyse et la restitution.

### 2.4 Différence avec les cartes de second rang

Les cartes maîtresses ont droit à :

* une surface plus grande ;
* une matière visuelle plus riche ;
* une combinatoire d’état légèrement plus expressive ;
* une priorité de recette plus élevée ;
* une exigence plus forte de cohérence et de finition.

Elles ne doivent toutefois pas devenir illustratives ou décoratives.

---

## 3. Doctrine commune aux trois cartes

### 3.1 Structure minimale commune

Chaque carte maîtresse doit suivre une structure stable en quatre couches :

1. **identité d’instrument**
   label de carte, éventuellement icône ou repère visuel secondaire ;

2. **lecture principale**
   valeur maîtresse, immédiatement dominante ;

3. **lecture secondaire utile**
   repère contextuel court : tendance, période, nature du calcul, certification, synchronisation ;

4. **signal d’état**
   état principal ou secondaire selon la doctrine des états.

### 3.2 Hiérarchie visuelle commune

La hiérarchie attendue est la suivante :

* le **montant** domine très clairement ;
* le **nom de l’instrument** installe la lecture mais reste secondaire ;
* l’**état principal** doit être visible sans dominer la valeur ;
* l’**état secondaire** reste discret ;
* la matière visuelle de fond ne doit jamais concurrencer le chiffre.

### 3.3 Grammaire de surface

Les trois cartes doivent être reconnaissables comme une même famille, tout en restant distinctes.

Elles partagent :

* même logique de rayon, padding et chrome ;
* même rythme typographique ;
* même structure générale ;
* même discipline sur les badges ;
* même niveau d’exigence de contraste et de respiration.

Elles se distinguent par :

* leur tonalité de fond ;
* leur matière interne ;
* leur type de signal secondaire ;
* leur statut d’état principal.

### 3.4 Limites de complexité

Une carte maîtresse ne doit jamais afficher simultanément :

* plus d’un état principal ;
* plus d’un état secondaire ;
* plus d’un repère contextuel court ;
* plus d’une zone de matière visuelle significative.

La carte doit rester immédiatement décodable.

---

## 4. Règles communes d’état

### 4.1 Règle générale

Les cartes maîtresses appliquent strictement la doctrine [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md).

Par défaut :

* l’**état principal** porte la limite la plus structurante pour l’interprétation ;
* l’**état secondaire** exprime un complément utile de preuve ou de fraîcheur ;
* les états globaux restent au niveau du cockpit, pas de la carte.

### 4.2 États principaux admissibles

États principaux admissibles sur les cartes maîtresses :

* **Fiable** ;
* **Partiel** ;
* **Proxy** ;
* **En attente** ;
* **Indisponible**.

### 4.3 États secondaires admissibles

États secondaires admissibles sur les cartes maîtresses :

* **Certifié** ;
* **Synchro OK** ;
* **Scellé** si la règle produit est explicitement définie ;
* repère temporel court si besoin exceptionnel.

### 4.4 Règle de sobriété

Une carte maîtresse n’a pas vocation à accumuler les signaux verts rassurants.
Dès que deux badges positifs semblent redondants, un seul doit subsister visiblement.

---

## 5. Carte Trésorerie

### 5.1 Rôle produit

La carte **Trésorerie** est l’instrument cardinal du cockpit.
Elle exprime la lecture de cash la plus structurante à date.

Elle doit répondre à la question :

> **combien de trésorerie validée est réellement lisible à la date d’arrêté affichée ?**

### 5.2 Priorité visuelle

Parmi les trois cartes maîtresses, **Trésorerie** est la plus dominante.

Attendus :

* carte perçue comme la première entrée du cockpit ;
* valeur immédiatement saillante ;
* sensation de stabilité et de confiance ;
* présence visuelle forte mais non agressive.

### 5.3 Composition recommandée

La carte doit contenir :

* label **TRÉSORERIE** ;
* montant principal ;
* éventuel repère visuel distinctif discret ;
* état principal de lecture ;
* état secondaire de fraîcheur uniquement si utile ;
* matière visuelle de fond sobre, structurante, non illustrative.

### 5.4 Doctrine d’état

#### État principal cible

Par défaut, l’état principal cible de Trésorerie est :

* **Fiable** si la lecture est pleinement exploitable ;
* **Partiel** si le périmètre n’est pas complètement couvert ;
* **En attente** si la donnée n’est pas encore stabilisée ;
* **Indisponible** si aucune lecture n’est possible.

#### État secondaire admissible

**Synchro OK** peut être utilisé comme état secondaire si la chaîne de mise à jour constitue un signal utile.

Cependant :

* **Synchro OK** ne remplace pas l’état principal ;
* si la carte n’a qu’un seul badge visible, il doit porter la qualité de lecture avant la fraîcheur.

### 5.5 Microcopy

À privilégier :

* **Fiable** ;
* **Partiel** ;
* **En attente** ;
* **Indisponible** ;
* **Synchro OK** en secondaire si nécessaire.

À éviter :

* badge unique **Synchro OK** sans état de qualité ;
* badge de confirmation redondant ;
* microcopy trop technique sur la carte.

### 5.6 Matière visuelle

La matière visuelle de Trésorerie doit renforcer l’idée de stabilité et de gouvernance.

Attendus :

* fond suffisamment vivant pour éviter l’aplat vide ;
* composantes graphiques sobres, géométriques, maîtrisées ;
* aucun effet qui évoque un chart complet ou une visualisation trompeuse ;
* le chiffre reste l’objet dominant.

### 5.7 États à spécifier en implémentation

Cas minimum à couvrir :

* trésorerie fiable + synchro OK ;
* trésorerie fiable sans synchro explicite ;
* trésorerie partielle ;
* trésorerie en attente ;
* trésorerie indisponible ;
* trésorerie avec détail accessible mais état global dégradé.

### 5.8 Action attendue au clic

Le clic sur Trésorerie doit ouvrir un détail immédiatement cohérent avec la promesse de la carte :

* solde lisible ;
* gouvernance de lecture ;
* éléments de rapprochement / couverture ;
* historique ou évolution si disponible.

---

## 6. Carte Business

### 6.1 Rôle produit

La carte **Business** exprime le volume d’activité économique observé sur la période affichée.
Elle ne doit pas être confondue avec la trésorerie ni avec le flux net.

Elle répond à la question :

> **quel niveau d’activité business a été généré sur la période sélectionnée ?**

### 6.2 Priorité visuelle

Business occupe le deuxième niveau de dominance parmi les cartes maîtresses.
Elle doit être forte, mais un peu moins “institutionnelle” que Trésorerie.

Attendus :

* carte immédiatement lisible ;
* perception d’énergie économique ;
* présence graphique plus tendue ou dynamique que Trésorerie ;
* sobriété maintenue.

### 6.3 Composition recommandée

La carte doit contenir :

* label **BUSINESS** ;
* montant principal ;
* repère contextuel court de période ou de variation si disponible ;
* état principal de lecture si nécessaire ;
* état secondaire probant le cas échéant ;
* matière visuelle plus habitée que l’état actuel trop vide.

### 6.4 Doctrine d’état

#### État principal cible

Par défaut :

* **Fiable** si la lecture business est directement exploitable ;
* **Partiel** si le périmètre n’est pas complet ;
* **À confirmer** si une incertitude métier significative demeure ;
* **Indisponible** si la lecture ne peut pas être produite.

#### État secondaire admissible

**Certifié** peut être utilisé comme état secondaire distinctif, à condition que la règle produit soit objectivement satisfaite.

Cependant :

* **Certifié** ne remplace pas l’état principal de lecture ;
* si Business est fiable et certifié, la hiérarchie visuelle doit rester claire ;
* si la certification n’apporte pas de différence immédiatement utile, elle peut être reléguée au détail.

### 6.5 Microcopy

À privilégier :

* **Fiable** ;
* **Partiel** ;
* **À confirmer** ;
* **Certifié** en secondaire ;
* repère contextuel court du type **MTD** si utile et stable.

À éviter :

* une carte sans matière visuelle ni repère secondaire utile ;
* un badge **Certifié** surdimensionné qui remplace la lecture ;
* plusieurs signaux positifs simultanés sans hiérarchie.

### 6.6 Matière visuelle

Business supporte une matière légèrement plus expressive que Trésorerie, mais toujours abstraite.

Attendus :

* sensation d’activité ou de tension économique ;
* fond plus vivant que l’aplat actuel ;
* pas de faux graphe ;
* pas de surcharge de contraste.

### 6.7 États à spécifier en implémentation

Cas minimum à couvrir :

* business fiable ;
* business fiable + certifié ;
* business partiel ;
* business à confirmer ;
* business indisponible.

### 6.8 Action attendue au clic

Le clic sur Business doit ouvrir un détail cohérent avec la promesse de la carte :

* lecture de volume d’activité ;
* découpage de période ;
* explication de la composition ;
* accès à l’évolution ou au détail des composantes si disponible.

---

## 7. Carte Flux net

### 7.1 Rôle produit

La carte **Flux net** exprime le solde net des encaissements et décaissements sur la période affichée.

Elle répond à la question :

> **sur la période lue, le système a-t-il globalement gagné ou perdu en flux nets ?**

### 7.2 Priorité visuelle

Flux net constitue la troisième carte maîtresse.
Elle doit rester forte, mais sa lecture est plus conditionnée par la nature de calcul et la clarté de son état.

### 7.3 Composition recommandée

La carte doit contenir :

* label **FLUX NET** ;
* montant principal ;
* état principal lisible immédiatement ;
* matière visuelle sobre ;
* éventuel repère de période si utile.

### 7.4 Doctrine d’état

#### État principal cible

Dans l’état actuel du produit, l’état principal cible de Flux net est très souvent :

* **Proxy** si la valeur reste issue d’un mécanisme substitutif assumé ;
* **Fiable** seulement si le calcul devient natif, stabilisé et pleinement pilotable ;
* **Partiel** si le périmètre est incomplet ;
* **Indisponible** si la valeur ne peut pas être produite.

#### Libellé

Le libellé visible doit converger vers :

* **Proxy**

et non :

* **Proxy data**.

#### Règle de prominence

L’état **Proxy** doit être visible sans dominer plus que le montant principal.
C’est un signal de vérité produit, pas un cri visuel.

### 7.5 Microcopy

À privilégier :

* **Proxy** ;
* **Fiable** si le régime évolue ;
* **Partiel** ;
* **Indisponible**.

À éviter :

* **Proxy data** ;
* formulations techniques longues ;
* signal ambre visuellement plus fort que le chiffre.

### 7.6 Matière visuelle

La carte Flux net doit rester plus retenue que Business.
Elle peut assumer une tonalité de vigilance maîtrisée, sans dramatisation.

Attendus :

* fond sobre ;
* badge de vigilance net mais non agressif ;
* pas d’association implicite entre couleur d’état et signe mathématique du montant.

### 7.7 États à spécifier en implémentation

Cas minimum à couvrir :

* flux net proxy ;
* flux net fiable ;
* flux net partiel ;
* flux net indisponible ;
* flux net avec valeur positive ou négative sans confusion sémantique.

### 7.8 Action attendue au clic

Le clic sur Flux net doit ouvrir un détail cohérent avec la promesse de la carte :

* encaissements ;
* décaissements ;
* solde net ;
* explication de la méthode de calcul ;
* explicitation du caractère proxy si présent.

---

## 8. Règles transverses de contenu

### 8.1 Format de valeur

Le montant principal doit :

* rester le point focal ;
* être lisible sans effort ;
* conserver une cohérence stricte de format entre les trois cartes ;
* éviter toute micro-variation de style non intentionnelle.

### 8.2 Signes

Les valeurs positives ou négatives doivent être exprimées clairement.
Le signe mathématique ne doit pas être remplacé par une couleur seule.

### 8.3 Labels d’instrument

Les labels **TRÉSORERIE**, **BUSINESS**, **FLUX NET** doivent rester :

* stables ;
* très courts ;
* identiques entre cockpit et détail autant que possible.

### 8.4 Repères contextuels

Les repères du type **MTD** ou équivalent sont autorisés s’ils :

* apportent une vraie aide de lecture ;
* restent courts ;
* n’entrent pas en concurrence avec l’état ;
* restent cohérents avec le filtre de période du cockpit.

---

## 9. Règles transverses de placement

### 9.1 Label d’instrument

Position stable en haut à gauche de la carte.

### 9.2 Montant principal

Position dominante dans la moitié supérieure, avec ancrage visuel stable d’une carte à l’autre.

### 9.3 État principal

Position stable, lisible, de préférence dans la zone basse de la carte ou à un emplacement constant dans la famille maîtresse.

### 9.4 État secondaire

Position opposée ou discrète, sans compétition avec l’état principal.

### 9.5 Matière visuelle

Toujours en arrière-plan ou en zone basse/latérale, sans entrer en collision avec le chiffre ni les badges.

---

## 10. Règles de couleur et de ton

### 10.1 Cohérence de famille

Les trois cartes doivent partager une parenté évidente, mais sans se confondre.

### 10.2 Trésorerie

Ton attendu : confiance, stabilité, gouvernance.

### 10.3 Business

Ton attendu : activité, volume, énergie économique maîtrisée.

### 10.4 Flux net

Ton attendu : lecture de solde et vigilance méthodologique si proxy.

### 10.5 États

La couleur de l’état suit la doctrine d’état et ne doit jamais servir à raconter seule la performance financière.

---

## 11. États vides, dégradés et indisponibles

### 11.1 État vide utile

Sur les cartes maîtresses, le **vide utile** doit être utilisé avec parcimonie.
Il est moins naturel ici que sur les cartes de second rang.

### 11.2 En attente

Une carte maîtresse en attente doit rester digne visuellement.
Elle ne doit pas ressembler à une panne graphique.

### 11.3 Indisponible

Une carte maîtresse indisponible doit expliciter clairement que l’absence de valeur n’est pas un zéro métier.

### 11.4 Partiel

Une carte partielle doit rester pilotable visuellement, tout en signalant sans ambiguïté la limite de lecture.

---

## 12. Contraintes d’implémentation

### 12.1 Modèle d’entrée recommandé

Chaque carte maîtresse devrait pouvoir recevoir une structure logique du type :

* `label`
* `value`
* `value_sign`
* `primary_state`
* `secondary_state`
* `context_hint`
* `visual_variant`
* `detail_href`

### 12.2 Centralisation

Les règles de rendu des états et de prominence ne doivent pas être codées différemment pour chaque carte sans raison.

### 12.3 Réutilisabilité

Les trois cartes doivent idéalement partager un socle commun de composant ou de contrat d’interface, avec variantes contrôlées.

### 12.4 Extensibilité

La spécification doit rester compatible avec :

* une amélioration future de la donnée ;
* la disparition de certains régimes proxy ;
* l’arrivée de nouveaux états secondaires mieux objectivés.

---

## 13. Règles de recette

La recette des cartes maîtresses doit vérifier au minimum :

* la hiérarchie visuelle entre les trois cartes ;
* la dominance claire de la valeur ;
* la bonne application de la doctrine d’état ;
* l’absence de badges redondants ;
* la cohérence du clic vers le détail ;
* la lisibilité à distance ;
* l’absence d’aplats visuellement trop vides ;
* la différence perceptible entre Trésorerie, Business et Flux net.

### 13.1 Recette par persona

La recette ne doit pas se limiter à une validation graphique générale ; elle doit aussi vérifier la lecture par persona.

#### Max

À vérifier :

* compréhension quasi immédiate des trois cartes ;
* absence de jargon bloquant ;
* hiérarchie visuelle immédiatement décodable ;
* capacité à repérer ce qui mérite attention sans ouvrir le détail.

#### Véréna

À vérifier :

* clarté de la qualité de lecture ;
* cohérence entre carte cockpit et détail ;
* absence d’ambiguïté sur les badges ;
* crédibilité opérationnelle de la promesse portée par chaque carte.

#### Esther

À vérifier :

* cohérence méthodologique minimale ;
* bonne continuité de sens avec les vues analytiques et de synthèse ;
* absence de raccourci visuel qui déformerait la lecture de gestion ;
* possibilité de rattacher la carte à une logique d’explication plus profonde.

---

## 14. Décisions normatives immédiates pour Web60

À l’ouverture de cette spécification, les décisions suivantes sont retenues :

1. **Trésorerie** doit redevenir la carte la plus clairement dominante du cockpit ;
2. **Business** doit être enrichie visuellement par rapport à son état actuel trop vide ;
3. **Flux net** doit converger vers le libellé **Proxy** si le régime proxy reste en vigueur ;
4. **Synchro OK** ne doit pas constituer seul la qualification principale de Trésorerie ;
5. **Certifié** ne doit pas constituer seul la qualification principale de Business ;
6. les trois cartes doivent partager une famille visuelle unifiée, avec personnalité propre ;
7. le détail de chaque carte doit être cohérent avec la promesse lue sur la carte cockpit.

---

## 15. Suite documentaire attendue

Cette spécification a vocation à être relayée par :

* [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) **v1.1.8** (items **W60-xxx**) ;
* [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.1.15** (protocole de validation publié) ;
* [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1.17** (passes, **lab public** / **UI hash**, **§13** journal / **§13.1** gabarit ; **§4.2** **W60-005** ; **§5.3** / **§5.3.1** **W60-103** ; **§14** trame **T-W60-002** ; lab **`laplatine2026`**).

Elle constitue la pièce de référence pour la fermeture produit des trois cartes maîtresses en Web60.

---

## 16. Formule de cap

> **Les cartes maîtresses de Linky ne montrent pas seulement trois chiffres importants : elles installent le régime de confiance du cockpit.**

---

## Historique des versions

| Version | Contenu |
|---------|---------|
| **1.0** | Spécification initiale publiée (T / B / F, états, implémentation, recette). |
| **1.1** | Ajout **§2.3 Lecture par persona** (Max, Véréna, Esther) et **§13.1 Recette par persona**. |
| **1.1.2** | En-tête : références **Plan v1.1.4**, **Backlog v1.0.2**, **Recette v1.1** ; §15 alignée. |
| **1.1.3** | Plan **v1.1.5**, backlog **v1.0.3**, recette **v1.1.1**, **EXECUTION_TICKETS v1.0** ; §15 alignée. |
| **1.1.4** | Plan **v1.1.6**, backlog **v1.0.4**, recette **v1.1.3**, **EXECUTION v1.1** ; §15 alignée. |
| **1.1.5** | Plan **v1.1.7**, backlog **v1.0.5**, lab **`laplatine2026`** en en-tête ; §15 alignée. |
| **1.1.6** | Plan **v1.1.8**, backlog **v1.0.6**, recette **v1.1.5**, **EXECUTION v1.1.2** ; §15 alignée. |
| **1.1.7** | Plan **v1.1.9**, backlog **v1.0.7**, **EXECUTION v1.1.3** ; §15 alignée. |
| **1.1.8** | Plan **v1.1.10**, backlog **v1.0.8**, recette **v1.1.7**, **EXECUTION v1.1.4** ; §15 alignée. |
| **1.1.9** | Plan **v1.1.11**, backlog **v1.0.9**, recette **v1.1.8**, **EXECUTION v1.1.5** (**§13** / **§13.1**) ; §15 alignée. |
| **1.1.10** | Backlog **v1.1.0**, **EXECUTION v1.1.7** ; **W60-001** / **T-W60-001** Fait ; renvois en-tête §15. |
| **1.1.11** | Backlog **v1.1.1**, **EXECUTION v1.1.9**, plan **v1.1.14**, recette **v1.1.10** ; **W60-005** Fait ; renvois en-tête et §15. |
| **1.1.12** | Plan **v1.1.15**, backlog **v1.1.4**, **EXECUTION v1.1.13**, recette **v1.1.11** ; lab public / deploy ; renvois en-tête et §15. |
| **1.1.13** | Plan **v1.1.16**, **EXECUTION v1.1.14**, recette **v1.1.12** ; **linky_generic** + **deploy-linky-lab** ; renvois en-tête et §15. |
| **1.1.14** | Plan **v1.1.17**, backlog **v1.1.6**, **EXECUTION v1.1.15**, recette **v1.1.13** ; Passe 2 **W60-101** / **W60-102** **En cours** ; renvois en-tête et §15. |
| **1.1.15** | Plan **v1.1.18**, backlog **v1.1.7**, **EXECUTION v1.1.16**, recette **v1.1.14** ; **W60-103** mapping qualité Trésorerie ; renvois en-tête et §15. |
| **1.1.16** | Plan **v1.1.19**, backlog **v1.1.8**, **EXECUTION v1.1.17**, recette **v1.1.15**, doctrine **v1.1.2** ; **§5.3.1** contour cockpit / **Partiel** sans vert trompeur ; renvois en-tête et §15. |

---

**Fin du document**
