# DESIGN SYSTEM PRODUIT — LYNKI

## V0 — Canon produit

## 1. Objet du document

Ce document formalise le **design system produit** de Lynki.

Il ne décrit pas d’abord :

* une palette,
* une police,
* un style graphique,
* un système de tokens.

Il décrit d’abord :

* la **logique de lecture** ;
* la **hiérarchie métier** ;
* les **niveaux d’interface** ;
* les **états de donnée** ;
* les **règles de sens** ;
* la manière dont Lynki doit être compris, utilisé et perçu.

Autrement dit :

> **Le design system visuel viendra ensuite.
> Le design system produit commence ici.**

---

## 2. Positionnement de Lynki

Lynki est un **cockpit de pilotage financier** et de **contrôle de gestion**.

Lynki n’est pas :

* un simple dashboard de KPI ;
* un outil BI générique ;
* un ERP comptable classique ;
* une interface décorative de reporting.

Lynki est conçu pour :

* **voir vite** ;
* **piloter** ;
* **comprendre** ;
* **expliquer** ;
* **agir sur des données perçues comme fiables**.

La valeur de Lynki ne repose pas uniquement sur les chiffres affichés, mais sur le fait que ces chiffres soient :

* lisibles ;
* hiérarchisés ;
* gouvernables ;
* contextualisés ;
* et **fiables ou explicitement qualifiés comme tels**.

---

## 3. Promesse centrale

La promesse de Lynki peut se résumer ainsi :

> **Je vois.
> Je comprends.
> Je peux décider.**

Cette promesse doit être perceptible dans chaque écran, chaque tuile, chaque état, chaque transition entre synthèse et détail.

---

## 4. Personas canoniques

## 4.1 Max — CEO / Dirigeant

**Usage principal** : mobile-first
**Finalité** : arbitrage et décision managériale
**Besoin dominant** : lecture rapide des signaux essentiels
**Question implicite** :

> “Qu’est-ce que je dois savoir maintenant ?”

### Règle produit

Pour Max, Lynki doit :

* aller vite ;
* réduire la charge mentale ;
* mettre en avant les signaux majeurs ;
* éviter la densité inutile ;
* permettre une lecture exploitable en quelques secondes.

---

## 4.2 Véréna — RAF

**Usage principal** : desktop pilotage
**Finalité** : suivi opérationnel et engagement financier quotidien
**Besoin dominant** : contrôle, structure, vigilance, arbitrage
**Question implicite** :

> “Qu’est-ce que je dois suivre et traiter aujourd’hui ?”

### Règle produit

Pour Véréna, Lynki doit :

* être plus dense que pour Max ;
* offrir une lecture structurée ;
* rendre visibles les écarts, risques, échéances et tensions ;
* permettre des passages rapides entre signal et détail.

---

## 4.3 Esther — CDG / contrôle de gestion

**Usage principal** : desktop synthèse / analyse / restitution
**Finalité** : compréhension, explication, préparation de rapports
**Besoin dominant** : structure comptable, justification, restitution
**Question implicite** :

> “Comment la situation se lit-elle, se justifie-t-elle et se restitue-t-elle ?”

### Règle produit

Pour Esther, Lynki doit :

* permettre une lecture posée ;
* être analytiquement solide ;
* relier synthèse, structure comptable et détail ;
* soutenir une production de rapport ou de restitution.

---

## 4.4 Traduction canonique

> **Max voit vite.
> Véréna pilote.
> Esther explique.**

Cette phrase est une règle produit, pas seulement une formule marketing.

---

## 5. Les deux régimes de lecture

## 5.1 Pilotage

Le mode **Pilotage** répond à la question :

> **“Que dois-je voir maintenant pour surveiller, arbitrer ou décider ?”**

### Caractéristiques produit

* lecture rapide ;
* hiérarchie forte ;
* logique card/tile ;
* orientation signal ;
* accès rapide au détail ;
* tension temporelle plus courte ;
* décision et vigilance.

### Verbe central

**Agir**

---

## 5.2 Synthèse comptable

Le mode **Synthèse comptable** répond à la question :

> **“Comment la situation financière se lit-elle de manière structurée, intelligible et restituable ?”**

### Caractéristiques produit

* lecture plus posée ;
* structure explicative ;
* tableaux et rubriques ;
* chaîne de lecture comptable ;
* capacité de restitution ;
* profondeur analytique.

### Verbe central

**Comprendre**

---

## 5.3 Règle fondamentale

Le **Pilotage** aide à **agir**.
La **Synthèse comptable** aide à **comprendre et restituer**.

Ces deux régimes doivent être :

* clairement distincts ;
* visuellement parents ;
* fonctionnellement cohérents ;
* jamais confondus.

---

## 6. Niveaux d’interface canoniques

Lynki repose sur plusieurs **niveaux d’interface**.
Ils ne doivent pas être designés comme des variantes esthétiques, mais comme des **unités de lecture métier distinctes**.

## 6.1 Tuile maîtresse

### Rôle

Mettre en avant un indicateur central du cockpit.

### Exemples

* Trésorerie
* Business
* Flux net

### Fonction produit

* capter immédiatement l’attention ;
* porter le signal principal ;
* structurer la lecture de la vue ;
* servir d’ancre décisionnelle.

### Règle

Une tuile maîtresse doit être identifiable en moins de 2 secondes.

---

## 6.2 Tuile secondaire

### Rôle

Compléter le cockpit avec un domaine métier important mais non central dans la hiérarchie primaire.

### Exemples

* Paiements
* BFR
* Encours
* Taxes
* EBE
* Notes de crédit
* Remboursements
* Points de vente
* Z de caisse

### Fonction produit

* enrichir la lecture globale ;
* préciser les tensions ;
* ouvrir vers des détails actionnables ;
* compléter les tuiles maîtresses sans les concurrencer.

### Règle

Une tuile secondaire doit être claire, utile, mais moins dominante qu’une tuile maîtresse.

---

## 6.3 Bloc de synthèse

### Rôle

Structurer une lecture analytique ou comptable.

### Exemples

* Résumé exécutif
* Compte de résultat synthétique
* Bilan
* Balances âgées
* Qualité et confiance
* Notes d’explication

### Fonction produit

* organiser la lecture d’ensemble ;
* expliciter les masses ;
* faire le pont entre vision et justification.

---

## 6.4 Vue détail

### Rôle

Approfondir un domaine métier à partir d’un signal ou d’une tuile.

### Fonction produit

* montrer le détail utile ;
* contextualiser le KPI principal ;
* proposer un outillage de lecture plus riche ;
* conserver le fil avec le cockpit.

### Règle

Une vue détail n’est pas un écran “technique”.
C’est une **lecture métier approfondie**.

---

## 6.5 Bloc de confiance

### Rôle

Exprimer la qualité, la fraîcheur et la fiabilité de la donnée.

### Fonction produit

* indiquer si la donnée est fiable, partielle, estimée ou indisponible ;
* rendre visible la confiance sans rendre l’interface anxiogène ;
* différencier Lynki d’un dashboard générique.

### Règle

La confiance n’est pas un bonus UX.
C’est une **composante de l’identité produit**.

---

## 6.6 Bloc alerte

### Rôle

Faire émerger les situations nécessitant une attention ou une action.

### Fonction produit

* signaler ;
* prioriser ;
* orienter vers l’investigation ;
* soutenir l’arbitrage.

### Règle

Une alerte doit guider l’action, pas produire de panique.

---

## 6.7 Bloc insight

### Rôle

Formuler une lecture synthétique, assistée ou narrative, à partir des signaux ou de la synthèse.

### Fonction produit

* condenser ;
* interpréter ;
* orienter la lecture ;
* aider à la restitution.

### Règle

Un insight ne remplace jamais le chiffre ni la preuve.
Il les accompagne.

---

## 7. Hiérarchie fonctionnelle des 12 tuiles Pilotage

## 7.1 Tuiles maîtresses

* **Trésorerie**
* **Business**
* **Flux net**

### Règle

Ce sont les trois piliers de lecture immédiate du cockpit.

---

## 7.2 Tuiles secondaires — niveau B

* **Paiements**
* **BFR**
* **Encours**
* **Taxes**
* **EBE**

### Règle

Ces tuiles enrichissent la lecture opérationnelle et structurent le pilotage financier.

---

## 7.3 Tuiles secondaires — niveau C

* **Notes de crédit**
* **Remboursements**
* **Points de vente**
* **Z de caisse**

### Règle

Ces tuiles complètent le périmètre produit sans prendre le dessus sur le noyau de pilotage.

---

## 8. Sémantique temporelle canonique

Lynki manipule plusieurs natures de temps.
Elles ne doivent jamais être mélangées visuellement ou sémantiquement sans clarification.

## 8.1 À date

Indique une position instantanée ou un stock observé au moment de la lecture.

### Exemples

* Trésorerie
* BFR
* Encours

### Règle

Le libellé, le contexte ou la mise en scène doivent faire sentir qu’on parle d’un **état actuel**, pas d’un flux de période.

---

## 8.2 Sur période

Indique une lecture sur l’intervalle sélectionné.

### Exemples

* Business
* Flux net
* Taxes
* EBE
* Notes de crédit
* Remboursements

### Règle

La période doit être clairement portée par l’interface.

---

## 8.3 Projection

Indique une lecture anticipée ou estimative.

### Exemples

* solde projeté
* prévision courte

### Règle

Une projection doit toujours être explicitement distinguée d’une donnée constatée.

---

## 8.4 Historique / évolution

Indique une comparaison temporelle ou une série d’évolution.

### Règle

L’évolution est un contexte de lecture, pas toujours le KPI principal.

---

## 9. États canoniques de la donnée

C’est un bloc central du design system produit Lynki.

## 9.1 Fiable / confirmée

### Signification

La donnée est suffisamment complète, cohérente ou rapprochée pour être lue avec confiance.

### Effet produit

Lecture rassurante, utilisable pour arbitrer.

---

## 9.2 Partielle

### Signification

La donnée existe mais le périmètre est incomplet.

### Effet produit

Lecture possible, avec prudence.

---

## 9.3 Estimée / proxy

### Signification

La donnée affichée n’est pas la donnée réelle cible, mais un calcul d’approximation ou un substitut.

### Effet produit

Lecture utile, mais explicitement non définitive.

---

## 9.4 À rapprocher

### Signification

La donnée ou le flux n’est pas encore totalement réconcilié.

### Effet produit

Lecture conditionnelle.

---

## 9.5 Indisponible

### Signification

La donnée ne peut pas être lue de manière exploitable.

### Effet produit

Le produit doit l’assumer clairement sans dégrader toute l’expérience.

---

## 9.6 Anomalie détectée

### Signification

La donnée est disponible mais présente un signal problématique ou incohérent.

### Effet produit

Nécessité d’investigation.

---

## 9.7 Règle de langage

Tout composant Lynki doit pouvoir, si nécessaire, exprimer l’un de ces états.

---

## 10. États d’interface canoniques

## 10.1 Normal

La lecture se fait sans friction.

## 10.2 Alerte

Une vigilance est requise.

## 10.3 Critique

La situation mérite une action prioritaire.

## 10.4 Chargement

Le produit doit signaler que la lecture arrive.

## 10.5 Donnée partielle

Le produit doit préserver la lisibilité tout en qualifiant la limite.

## 10.6 Donnée indisponible

Le produit doit éviter l’effet “cassé” et rester intelligible.

## 10.7 Placeholder produit

Utilisé pour un emplacement prévu mais non encore pleinement activé.

### Exemple

Z de caisse.

---

## 11. Composants métier canoniques

Le design system visuel devra formaliser au minimum ces familles.

## 11.1 Tuiles

* maîtresses
* secondaires
* états normaux / alertes / critiques / partiels / indisponibles

## 11.2 Badges

Pour :

* statuts ;
* qualité de donnée ;
* priorités ;
* états métier.

## 11.3 Filtres et sélecteurs

* période
* entité / société
* vue
* éventuellement périmètre d’analyse

## 11.4 Tableaux

* lecture de synthèse ;
* lecture analytique ;
* balances âgées ;
* rubriques comptables ;
* détails de partenaires.

## 11.5 Graphes

* évolution ;
* dual series ;
* répartition ;
* breakdown ;
* complément de lecture, pas décor.

## 11.6 Alertes

* synthétiques ;
* priorisées ;
* actionnables.

## 11.7 Insights

* pilotage ;
* synthèse ;
* aide à la lecture ;
* jamais substitut à la preuve.

## 11.8 States

* loading
* empty
* partiel
* indisponible
* anomalie
* placeholder

---

## 12. Règles device / persona

## 12.1 Max → mobile-first

### Priorités

* vitesse ;
* synthèse ;
* hiérarchie forte ;
* action immédiate.

### Règle

Le mobile pour Max ne doit pas être une version réduite du desktop ; c’est une lecture managériale spécifique.

---

## 12.2 Véréna → desktop pilotage

### Priorités

* densité maîtrisée ;
* lecture simultanée ;
* arbitrage opérationnel ;
* navigation rapide vers le détail.

### Règle

Le desktop Véréna est le vrai cockpit opérationnel.

---

## 12.3 Esther → desktop synthèse

### Priorités

* structure ;
* justification ;
* restitution ;
* drill-down.

### Règle

Le desktop Esther doit soutenir la lecture comptable et la préparation de rapport.

---

## 13. Règles d’identité Lynki

Lynki doit toujours être perçu comme :

* sérieux ;
* fiable ;
* lisible ;
* maîtrisé ;
* dense sans être confus ;
* premium sans être luxueux ;
* moderne sans être gadget ;
* financier sans être austère ;
* distinctif sans devenir expérimental.

### Ce que Lynki ne doit pas devenir

* un “dashboard startup” générique ;
* un ERP gris et illisible ;
* une vitrine fintech décorative ;
* une interface trop froide ou désincarnée.

---

## 14. Règles de navigation et de profondeur

## 14.1 Lecture en trois niveaux

Chaque domaine Lynki doit idéalement permettre :

1. une lecture immédiate ;
2. une lecture métier ;
3. une lecture détaillée.

---

## 14.2 Chaîne canonique

### Pilotage

tuile → détail → action / compréhension

### Synthèse

résumé → rubriques / tableaux → grand livre / écriture

---

## 14.3 Règle de cohérence

On ne doit jamais se perdre entre cockpit, synthèse et détail.
Chaque profondeur doit sembler appartenir au même produit.

---

## 15. Règles de conception pour la designeuse

La designeuse peut proposer :

* des regroupements ;
* des hiérarchies ;
* des solutions de layout ;
* des règles visuelles ;
* des composants ;
* des transitions entre mobile et desktop.

Mais elle ne doit pas altérer :

* les 3 personas ;
* les deux régimes de lecture ;
* la hiérarchie maîtresse / secondaire ;
* le périmètre réel des 12 tuiles ;
* le rôle central des états de donnée ;
* la nature de Lynki comme cockpit financier fiable.

---

## 16. Conclusion canonique

Le design system produit Lynki repose sur une idée simple :

> **Lynki n’est pas seulement un produit qui montre des chiffres.
> C’est un produit qui organise la confiance, la lecture et la décision.**

Le système visuel devra donc traduire :

* la hiérarchie du pilotage ;
* la profondeur comptable ;
* la confiance dans la donnée ;
* la diversité des usages ;
* et la singularité du produit.

---

## Annexe opérationnelle (V1)

Version courte et directive pour la designeuse : [**Product Design System Principles — Lynki (V1)**](./PRODUCT_DESIGN_SYSTEM_PRINCIPLES_LYNKI_V1.md).
