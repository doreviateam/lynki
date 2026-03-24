# Mapping front ↔ données — Lynki V1

*Ce document complète le [CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md) et le [PLAN_LOTS_DEV_LYNKI_V1.md](./PLAN_LOTS_DEV_LYNKI_V1.md). Il ne décrit pas la hiérarchie design : il décrit **avec quelles données** les écrans et composants doivent être alimentés, **quelle est leur nature**, **quels états elles peuvent prendre**, et **quel comportement d’intégration** est attendu.*

---

## 1. Objet du document

Ce document a pour objet de raccorder, pour **Lynki V1** :

* les **écrans canoniques** ;
* les **composants front** ;
* les **sources de données** ;
* les **agrégats** ;
* les **natures temporelles** ;
* les **états de donnée** ;
* les **règles de comportement** en cas de partiel, indisponible, proxy ou anomalie.

Il sert de pont entre :

* le **design handoff** ;
* le **cahier des charges d’intégration front** ;
* l’**implémentation existante** dans `units/dorevia-linky/` ;
* et les **sources de données** issues du backend / agrégats / Vault / APIs déjà exposées.

### 1.2 Ce que ce document n’est pas

Ce document n’est pas :

* un **contrat d’API exhaustif** ;
* une **documentation backend** ;
* une **liste complète des endpoints** ;
* un **ticketing détaillé** ;
* ni une **recette fonctionnelle** exécutable telle quelle.

Il **prépare** ces étapes sans s’y substituer.

---

## 2. Statut du document

* **Version** : V1
* **Statut** : référence de **structure** de mapping front ↔ données pour le périmètre Lynki V1 — aligné sur le triptyque handoff / CDC / plan de lots
* **Auteur / responsable** : équipe produit Lynki (Dorevia)
* **Dernière mise à jour** : 23 mars 2026
* **Documents parents** :

  * [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md)
  * [`CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md`](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)
  * [`PLAN_LOTS_DEV_LYNKI_V1.md`](./PLAN_LOTS_DEV_LYNKI_V1.md)
  * [`CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md)
  * [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)
  * [`ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md)

---

## 3. Principe de lecture du mapping

Ce document doit permettre de répondre, pour chaque écran ou composant majeur, aux questions suivantes :

1. **Quelle donnée alimente ce composant ?**
2. **Quelle est sa nature temporelle ?**

   * à date
   * sur période
   * projection
3. **Quel niveau de confiance peut-elle avoir ?**

   * fiable / confirmée
   * partielle
   * estimée / proxy
   * à rapprocher
   * indisponible
   * anomalie
4. **Quel comportement front faut-il adopter en cas d’absence ou de dégradation ?**
5. **Quel type de graphe est autorisé ou pertinent avec cette donnée ?**

---

## 4. Règles générales de mapping

### 4.1 Une donnée n’est jamais « juste une valeur »

Toute donnée intégrée doit être qualifiée au minimum par :

* son **domaine métier** ;
* sa **nature temporelle** ;
* sa **source** ;
* son **état de confiance** ;
* son **comportement de fallback**.

### 4.2 Le front n’invente pas la vérité métier

Le front peut :

* qualifier ;
* signaler ;
* contextualiser ;
* afficher un état ;
* dégrader proprement.

Le front ne doit pas :

* inventer un calcul métier sans validation produit ;
* masquer un état partiel ;
* faire passer une donnée proxy pour une donnée confirmée.

### 4.3 Une absence de donnée est un état, pas un crash

Toute absence ou indisponibilité doit produire :

* un état lisible ;
* un message compréhensible ;
* une structure d’écran stable ;
* et si pertinent une action de repli ou de relance.

### 4.4 La qualité de donnée est transverse

Les états de donnée doivent pouvoir être portés au minimum par :

* tuiles ;
* tableaux ;
* graphes ;
* bloc de confiance ;
* alertes.

### 4.5 Priorité de branchement (V1)

Quand toutes les données ne sont pas disponibles en même temps, les branchements doivent **d’abord** sécuriser :

1. les **tuiles maîtresses** ;
2. les **états de confiance** (bloc et badges associés) ;
3. les **graphes essentiels** au service du KPI ou du signal principal ;
4. les **tuiles secondaires** (B puis C) ;
5. les **blocs de synthèse avancés** ou enrichissements.

Cette priorité guide l’implémentation et les arbitrages quand le back ou les agrégats arrivent par vagues.

---

## 5. Nomenclature de mapping

Pour chaque écran ou composant, on documente :

* **source primaire**
* **source secondaire** (si applicable)
* **agrégat / domaine métier**
* **nature temporelle**
* **granularité**
* **états de donnée possibles**
* **comportement en absence / erreur**
* **graphe autorisé**
* **dépendances**
* **point d’attention intégration**

---

## 6. États de donnée de référence

### Fiable / confirmée

La donnée est exploitable avec confiance.

### Partielle

La donnée est exploitable, mais le périmètre est incomplet.

### Estimée / proxy

La donnée est utile, mais substitutive ou approximative.

### À rapprocher

La donnée dépend d’un rapprochement non totalement abouti.

### Indisponible

La donnée ne peut pas être lue utilement.

### Anomalie

La donnée est présente, mais signale une incohérence ou un risque.

---

## 7. Mapping par écran canonique

### 7.1 Pilotage mobile Max

#### Finalité

Donner à Max une lecture mobile très rapide de l’état global et des signaux prioritaires.

#### Sources principales

* agrégats cockpit / dashboard ;
* tuiles maîtresses :

  * Trésorerie
  * Business
  * Flux net
* tuiles secondaires affichées en lecture compacte ;
* bloc insight / priorité.

#### Nature temporelle

Mixte :

* **à date** pour certaines tuiles ;
* **sur période** pour d’autres ;
* possibilité de **projection** si le produit l’active plus tard.

#### Mapping des domaines majeurs

##### Trésorerie

* **nature** : à date
* **source métier** : position de trésorerie / rapprochement / cohérence ERP
* **états probables** :

  * fiable
  * à rapprocher
  * partielle
  * indisponible
  * anomalie
* **graphe autorisé** :

  * sparkline
  * évolution courte
* **point d’attention** :
  ne pas faire passer une position partielle ou non rapprochée pour une position pleinement fiable

##### Business

* **nature** : sur période
* **source métier** : activité ventes / achats
* **états probables** :

  * fiable
  * partielle
  * proxy si agrégat incomplet
  * indisponible
* **graphe autorisé** :

  * barres
  * double série
  * sparkline
* **point d’attention** :
  la période doit être explicite

##### Flux net

* **nature** : sur période
* **source métier** : encaissements – décaissements
* **états probables** :

  * fiable
  * partielle
  * à rapprocher
  * indisponible
* **graphe autorisé** :

  * double série
  * courbe courte
* **point d’attention** :
  bien distinguer flux période vs trésorerie à date

#### États d’interface minimums

* loading
* normal
* partiel
* indisponible
* anomalie
* placeholder si une tuile ne peut pas être alimentée

#### Comportement attendu

* le header et la structure globale restent stables même si une ou plusieurs tuiles sont dégradées ;
* les tuiles maîtresses gardent leur priorité visuelle ;
* la confiance de la donnée doit être visible au premier niveau.

---

### 7.2 Alertes / Signaux Max

#### Finalité

Permettre à Max de prioriser immédiatement les signaux qui demandent une vigilance ou une décision.

#### Sources principales

* alertes métier issues des agrégats ;
* alertes de qualité de donnée ;
* alertes de rapprochement ;
* alertes de tension financière ou comptable.

#### Nature temporelle

Principalement :

* instantanée ;
* sur période récente ;
* parfois mixte si une alerte résume une dérive.

#### Types de signaux à distinguer

* **alerte métier**
* **alerte de donnée**
* **vigilance**
* **suivi**
* **anomalie critique**

#### États probables

* normal / aucun signal majeur
* vigilance
* critique
* anomalie de donnée
* partiel
* indisponible

#### Graphes autorisés

* très limités ;
* éventuellement mini indicateurs ou signaux contextuels ;
* pas de graphe décoratif.

#### Comportement attendu

* si les alertes ne sont pas disponibles, afficher un état lisible ;
* distinguer clairement une alerte métier d’une anomalie de qualité de donnée ;
* garder une lecture d’arbitrage et non une liste confuse d’événements.

---

### 7.3 Pilotage desktop Véréna

#### Finalité

Permettre à Véréna de piloter sur desktop avec lecture simultanée de plusieurs tensions.

#### Sources principales

* grille des 12 tuiles ;
* bloc de confiance transverse ;
* éventuels filtres période / entité ;
* état global de cohérence.

#### Nature temporelle

Mixte selon les tuiles :

* **à date**
* **sur période**
* éventuellement **projection**
* éventuellement **historique**

#### Mapping des tuiles

##### Tuiles maîtresses

###### Trésorerie

* à date
* position actuelle
* rapprochement / cohérence
* états :

  * fiable
  * à rapprocher
  * partielle
  * indisponible
  * anomalie

###### Business

* sur période
* ventes / achats / activité
* états :

  * fiable
  * partielle
  * proxy
  * indisponible

###### Flux net

* sur période
* entrées / sorties
* états :

  * fiable
  * partielle
  * à rapprocher
  * indisponible

##### Tuiles secondaires B

###### Paiements

* sur période
* paiements et rapprochement
* états :

  * fiable
  * à rapprocher
  * partielle
  * indisponible

###### BFR

* à date
* stock + créances – dettes selon périmètre
* états :

  * fiable
  * partielle
  * proxy
  * indisponible

###### Encours

* à date
* créances ouvertes / retard
* états :

  * fiable
  * partielle
  * anomalie
  * indisponible

###### Taxes

* sur période
* TVA / fiscalité activité
* états :

  * fiable
  * partielle
  * indisponible

###### EBE

* sur période
* EBE réel ou proxy
* états :

  * fiable
  * proxy
  * partielle
  * indisponible

##### Tuiles secondaires C

###### Notes de crédit

* sur période
* ajustements / avoirs
* états :

  * fiable
  * partielle
  * indisponible

###### Remboursements

* sur période
* remboursements constatés
* états :

  * fiable
  * partielle
  * indisponible

###### Points de vente

* sur période ou journée selon périmètre
* activité POS
* états :

  * fiable
  * partielle
  * anomalie
  * indisponible

###### Z de caisse

* placeholder produit V1
* états :

  * placeholder
  * indisponible

#### Graphes autorisés

* sparkline
* double série
* barres
* breakdown simple
* aging si une tuile le justifie
* pas de variété excessive

#### Comportement attendu

* toutes les tuiles ne sont pas obligatoirement alimentées au même niveau de qualité ;
* la couche de confiance doit être distribuée dans l’écran ;
* la structure desktop reste stable même si certaines tuiles sont dégradées.

---

### 7.4 Synthèse comptable Esther

#### Finalité

Permettre une lecture structurée, justifiable et restituable.

#### Sources principales

* résumé exécutif ;
* blocs de synthèse ;
* tableaux comptables ;
* blocs de confiance ;
* graphes de compréhension ;
* entrée vers détail.

#### Nature temporelle

Principalement :

* sur période ;
* parfois à date pour certaines masses ;
* historique si comparaison ;
* éventuellement projection plus tard.

#### Domaines de données attendus

* résumé global ;
* compte de résultat synthétique ;
* bilan / structure patrimoniale ;
* créances / dettes / échéances ;
* qualité de donnée / confiance ;
* notes / commentaire / restitution.

#### États probables

* fiable
* partielle
* proxy
* indisponible
* anomalie

#### Graphes autorisés

* breakdown / répartition
* aging
* waterfall / variation si retenu plus tard
* courbe d’évolution si utile à la comparaison
* pas de graphe qui remplace le tableau

#### Comportement attendu

* la vue doit rester exploitable même avec certains blocs partiels ;
* un tableau peut être disponible alors qu’un graphe associé ne l’est pas ;
* les états de confiance doivent pouvoir être portés au niveau bloc.

#### Point d’attention

Cette vue doit rester une synthèse comptable, pas un dashboard réarrangé.

---

### 7.5 Détail Trésorerie

#### Finalité

Approfondir la lecture Trésorerie avec contexte, évolution, rapprochement et compréhension métier.

#### Sources principales

* KPI principal trésorerie ;
* évolution ;
* bloc de rapprochement ;
* tableau ou détail contextuel ;
* navigation retour cockpit.

#### Nature temporelle

Mixte :

* à date pour la position ;
* historique / évolution pour le contexte ;
* éventuelle projection selon produit.

#### États probables

* fiable
* à rapprocher
* partielle
* indisponible
* anomalie

#### Graphes autorisés

* courbe d’évolution
* sparkline de contexte
* barres si utile
* pas de graphe gratuit

#### Comportement attendu

* si le KPI est disponible mais le détail de rapprochement partiel, l’écran doit rester lisible ;
* la confiance de la donnée doit apparaître clairement ;
* la page doit rester une vue métier, pas technique.

---

## 8. Mapping par composant canonique

### 8.1 Tuile maîtresse

#### Sources possibles

* KPI principal
* variation
* mini-contexte
* statut de confiance

#### États obligatoires

* normal
* alerte
* partiel
* indisponible
* anomalie
* à rapprocher si pertinent

#### Graphes autorisés

* sparkline
* courbe courte
* barres compactes

#### Règle

Le KPI domine toujours le graphe.

---

### 8.2 Tuile secondaire

#### Sources possibles

* KPI secondaire
* statut
* variation courte
* contexte minimal

#### États obligatoires

* normal
* partiel
* indisponible
* alerte
* placeholder si nécessaire

#### Graphes autorisés

* mini-barres
* sparkline simple
* aucun si non pertinent

#### Règle

Une tuile secondaire n’existe pas pour faire joli ; elle doit porter une information utile.

---

### 8.3 Bloc de confiance

#### Sources possibles

* qualité de donnée
* rapprochement
* complétude
* fraîcheur
* anomalies détectées

#### États obligatoires

* fiable
* partielle
* à rapprocher
* indisponible
* anomalie

#### Règle

Le bloc de confiance ne doit jamais être dissocié du sens métier affiché.

---

### 8.4 Bloc d’alerte

#### Sources possibles

* alertes métier
* anomalies de donnée
* signaux de vigilance

#### États obligatoires

* normal
* vigilance
* critique
* partiel
* indisponible

#### Règle

Une alerte doit guider l’action, pas produire du bruit.

---

### 8.5 Tableau analytique

#### Sources possibles

* lignes détaillées
* agrégats
* balances
* partenaires
* échéances

#### États obligatoires

* normal
* partiel
* vide
* indisponible
* anomalie si ligne problématique

#### Règle

Le tableau reste lisible même en présence de cases vides ou d’informations partielles.

---

### 8.6 Graphe analytique

#### Sources possibles

* séries temporelles
* répartitions
* dual series
* échéanciers

#### États obligatoires

* normal
* partiel
* indisponible
* proxy
* à rapprocher si cohérent avec la donnée

#### Règle

Le graphe doit toujours expliciter ou soutenir une lecture, jamais l’obscurcir.

---

## 9. Données à confirmer dans l’annexe de mapping détaillé

Cette V1 fixe la structure.
L’annexe **endpoints / champs** V1 est posée dans [`ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md) (niveaux Confirmé / Probable / À confirmer). Elle devra être **complétée** après audit code / API pour préciser écran par écran :

* endpoints exacts ;
* objets de réponse ;
* champs requis ;
* fallback si champ absent ;
* stratégie de polling ou refresh ;
* liens entre agrégats et composants ;
* priorités de branchement.

---

## 10. Points d’attention pour le passage en tickets

Les tickets devront toujours mentionner :

* le **lot dev** concerné ;
* l’**écran canon** concerné ;
* le **composant canonique** concerné ;
* les **états de donnée** à couvrir ;
* les **états d’interface** à couvrir ;
* le **type de graphe** si applicable ;
* la **source de donnée visée** si déjà connue.

Modèle de **découpage ticketisable** : [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md).

---

## 11. Formule finale

> Le mapping front ↔ données ne sert pas seulement à brancher des écrans ; il sert à préserver, dans l’intégration, la logique même de Lynki : une lecture hiérarchisée, qualifiée et gouvernable des données financières.

---

> La présente **V1** fixe la **structure** de mapping. La [**checklist de recette détaillée Lynki V1**](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md) et l’[**annexe endpoints / champs**](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md) complètent la chaîne : validation, puis **branchement technique** honnête.

*Document V1 — structure de mapping. Endpoints : [`ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md) ; tickets : [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md) ; recette : [`CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md) ; critères de synthèse : [cahier des charges § 14](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md).*
