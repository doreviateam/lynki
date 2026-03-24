# Cahier des charges d’intégration front — Lynki V1

*Ce document complète le [handoff design V1](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md). Le **handoff design** dit ce qui fait foi côté design ; le **cahier des charges d’intégration** dit **quoi construire**, **dans quel ordre**, **avec quelles règles**, et **comment le valider**.*

---

## 1. Objet du document

Ce document a pour objet de cadrer l’intégration front de **Lynki V1** à partir :

* du **canon produit Lynki** ;
* du **handoff design V1** ;
* des écrans de référence **Canon V5** ;
* et des règles de lecture, d’états, de composants et de graphes désormais stabilisées.

Ce document ne remplace pas :

* le **design handoff** ;
* le **canon produit** ;
* ni les futurs tickets de développement.

Il sert à faire le pont entre :

* **produit** ;
* **design** ;
* **intégration front** ;
* **QA / recette**.

### 1.1 Fondations : existant et cible

L’intégration prescrite ici s’appuie **à parts égales** sur :

* l’**existant implémenté** — code applicatif réel (typiquement `units/dorevia-linky/`, composants, flux, contraintes techniques vécues) ;
* la **cible design et produit** — handoff V1, maquettes Canon V5, règles stabilisées dans les ZeDocs citées au § 4.

Ce cahier ne constitue pas un inventaire exhaustif du code : il fixe **quoi construire ou rapprocher**, **dans quel ordre**, **avec quelles règles**, et **comment valider** — en **rapprochant** la réalité actuelle de la cible sans présumer que tout est à refaire.

### 1.2 Statut du document

* **Version** : V1
* **Statut** : Référence officielle pour intégration front — **figé** (évolutions : lots, mapping données, tickets ; révision de fond lors d’un changement de périmètre majeur ou d’une nouvelle ligne canon design)
* **Auteur / responsable** : équipe produit Lynki (Dorevia)
* **Dernière mise à jour** : 23 mars 2026
* **Document parent** : [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md)
* **Fichier canonique** : `CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md` — abréviation courante : **CDC intégration front Lynki V1** (même sens qu’un éventuel `CDC_INTEGRATION_FRONT_LYNKI_V1.md`).

---

## 2. Finalité de l’intégration V1

L’objectif de l’intégration V1 n’est pas de couvrir immédiatement tout Lynki, mais de mettre en production un **premier socle cohérent, stable et démontrable**, permettant :

* de matérialiser le **cockpit Lynki** ;
* de respecter les usages différenciés de **Max**, **Véréna** et **Esther** ;
* de rendre visible la **qualité de la donnée** ;
* de poser les premiers **composants réutilisables** ;
* d’établir une base technique saine pour les itérations ultérieures.

---

## 3. Périmètre V1 à intégrer

Le périmètre V1 comprend les écrans et composants suivants.

### 3.1 Écrans de référence

1. **Pilotage mobile Max**
2. **Alertes / Signaux Max**
3. **Pilotage desktop Véréna**
4. **Synthèse comptable desktop Esther**
5. **Détail Trésorerie Véréna**

### 3.2 Composants transverses minimums

* tuiles maîtresses ;
* tuiles secondaires ;
* badges de statut ;
* bloc de confiance ;
* bloc d’alerte ;
* bloc insight ;
* filtres et sélecteurs ;
* tableaux analytiques ;
* graphes principaux ;
* états vides / partiels / indisponibles / chargement / placeholder.

### 3.3 Hors périmètre V1

Sauf décision explicite contraire, ne sont pas inclus dans cette V1 :

* l’intégration exhaustive de toutes les vues détail des 12 tuiles ;
* les exports fonctionnels finaux si non encore validés côté produit ;
* les interactions avancées non stabilisées dans le handoff ;
* les parcours non présents dans les écrans canoniques V5 ;
* les raffinements de design system non nécessaires à l’intégration initiale.

---

## 4. Références officielles

L’intégration V1 doit s’appuyer sur les références suivantes.

### 4.1 Références design

* `ZeDocs/web59/DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`
* `ZeDocs/web59/INVENTAIRE_STITCH_CAROLE_61.md`
* `ZeDocs/web59/stitch_carole_61/design_system_lynki_sp_cifications_handoff_v1.html`
* `ZeDocs/web59/stitch_carole_61/design_system_visuel_lynki_v0.html`

### 4.2 Références produit

* `ZeDocs/web58/DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md`
* `ZeDocs/web58/PRODUCT_DESIGN_SYSTEM_PRINCIPLES_LYNKI_V1.md`
* `ZeDocs/web58/SQUELETTE_BRIEF_DESIGN_FRONT_END_LYNKI.md`

### 4.3 Références canoniques écrans

Chemins relatifs à la racine du dépôt ; chaque dossier contient aussi `screen.png` pour revue rapide.

* `ZeDocs/web59/stitch_carole_61/stitch/pilotage_mobile_max_canon_v5/code.html`
* `ZeDocs/web59/stitch_carole_61/stitch/alertes_signaux_max_canon_v5/code.html`
* `ZeDocs/web59/stitch_carole_61/stitch/pilotage_desktop_v_r_na_canon_v5/code.html`
* `ZeDocs/web59/stitch_carole_61/stitch/synth_se_desktop_esther_canon_v5/code.html`
* `ZeDocs/web59/stitch_carole_61/stitch/d_tail_tr_sorerie_v_r_na_canon_v5/code.html`

### 4.4 Référence code applicatif (point de départ)

* `units/dorevia-linky/` — application front Lynki telle qu’implémentée au moment de l’intégration V1 (inventaire d’écart et rapprochement avec ce cahier).

### 4.5 Principe de rapprochement

L’intégration V1 ne part pas d’une page blanche.
Elle consiste à **rapprocher** l’existant applicatif `units/dorevia-linky/` de la cible définie par :

* le [handoff design V1](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md) ;
* les écrans canoniques V5 (`stitch/*_canon_v5/`) ;
* le canon produit Lynki (`ZeDocs/web58`).

---

## 5. Principes non négociables à respecter

### 5.1 Personas

* **Max voit vite**
* **Véréna pilote**
* **Esther explique**

### 5.2 Régimes de lecture

* le **Pilotage** aide à **agir** ;
* la **Synthèse comptable** aide à **comprendre et restituer**.

### 5.3 Hiérarchie des tuiles

**Tuiles maîtresses**

* Trésorerie
* Business
* Flux net

**Tuiles secondaires B**

* Paiements
* BFR
* Encours
* Taxes
* EBE

**Tuiles secondaires C**

* Notes de crédit
* Remboursements
* Points de vente
* Z de caisse

### 5.4 Confiance dans la donnée

La qualité de la donnée est une **couche transverse** du produit.
Elle ne doit jamais être traitée comme un simple badge décoratif.

---

## 6. Architecture de lots recommandée

L’intégration V1 doit être découpée en lots pour limiter les risques et favoriser une montée en cohérence.

### Lot 1 — Fondations UI

**Résultat attendu** : composants de base intégrables et réutilisables (tokens, layout, tuiles et états minimaux utilisables par les lots suivants).

Objectif :
poser les fondations techniques et visuelles communes.

Inclut :

* layout global ;
* typographie ;
* surfaces ;
* espacement ;
* tuiles de base ;
* badges ;
* statuts ;
* filtres ;
* composants de graphes de base ;
* états d’interface minimums.

### Lot 2 — Pilotage mobile Max

**Résultat attendu** : cockpit mobile dirigeant intégrable bout en bout (parcours, navigation, états principaux).

Objectif :
livrer le premier cockpit mobile dirigeant.

Inclut :

* écran Pilotage mobile ;
* écran Alertes / Signaux ;
* navigation mobile associée ;
* états principaux.

### Lot 3 — Pilotage desktop Véréna

**Résultat attendu** : cockpit desktop RAF avec les 12 tuiles hiérarchisées, lecture simultanée et confiance transverse — intégrable et démontrable.

Objectif :
livrer le cockpit opérationnel desktop.

Inclut :

* vue desktop pilotage ;
* hiérarchie complète des 12 tuiles ;
* lecture simultanée ;
* bloc de confiance transverse.

### Lot 4 — Synthèse et détail Esther / Véréna

**Résultat attendu** : synthèse comptable structurée + détail Trésorerie, avec articulation synthèse → détail opérationnelle.

Objectif :
livrer le premier espace de synthèse structurée et une première vue détail métier.

Inclut :

* Synthèse comptable desktop ;
* Détail Trésorerie ;
* articulation synthèse → détail.

### Lot 5 — Stabilisation / recette

**Résultat attendu** : socle V1 stabilisé — composants et graphes alignés, recette multi-écrans passée, dettes techniques mineures tracées.

Objectif :
consolider les composants, états, graphes et cohérence multi-écrans.

---

## 7. Spécification d’intégration par écran

---

## 7.1 Pilotage mobile Max

### Persona principal

Max

### Régime

Pilotage

### Finalité

Permettre à un dirigeant de comprendre en quelques secondes l’état global et les signaux prioritaires.

### Structure attendue

* header synthétique ;
* statut global de confiance ;
* 3 tuiles maîtresses visibles en priorité ;
* tuiles secondaires compactes ;
* bloc insight / priorité ;
* navigation mobile si prévue.

### Composants minimums

* tuile maîtresse ;
* tuile secondaire ;
* badge de statut ;
* mini-graphe ;
* bloc insight ;
* états de confiance.

### États à gérer

* normal ;
* alerte ;
* partiel ;
* indisponible ;
* anomalie ;
* à rapprocher ;
* placeholder si applicable.

### Point critique d’intégration

La hiérarchie entre **noyau de pilotage** et **informations secondaires** ne doit jamais être cassée.

### Référence design

`pilotage_mobile_max_canon_v5`

---

## 7.2 Alertes / Signaux Max

### Persona principal

Max

### Régime

Pilotage / arbitrage

### Finalité

Permettre de distinguer rapidement :

* urgence ;
* vigilance ;
* suivi ;
* anomalie de donnée ;
* signal métier.

### Structure attendue

* header ;
* cartes ou lignes d’alertes hiérarchisées ;
* niveau de criticité ;
* action implicite ou explicite ;
* éventuel bloc de recommandation.

### Composants minimums

* bloc alerte ;
* badges de criticité ;
* statuts de confiance si pertinents ;
* CTA ou lien vers détail.

### États à gérer

* normal ;
* vigilance ;
* critique ;
* anomalie ;
* absence d’alerte ;
* données partielles.

### Point critique d’intégration

La différence entre **alerte métier** et **anomalie de donnée** doit rester lisible.

### Référence design

`alertes_signaux_max_canon_v5`

---

## 7.3 Pilotage desktop Véréna

### Persona principal

Véréna

### Régime

Pilotage desktop

### Finalité

Permettre à un RAF de piloter sur écran large avec lecture simultanée des tensions majeures.

### Structure attendue

* header enrichi ;
* statut global / confiance ;
* grille des 12 tuiles ;
* distinction visuelle forte entre maîtresses et secondaires ;
* zone de synthèse / insight éventuelle ;
* navigation vers le détail.

### Composants minimums

* tuiles maîtresses ;
* tuiles secondaires B et C ;
* bloc de confiance ;
* graphes de tuiles ;
* badges / statuts ;
* filtres.

### États à gérer

* normal ;
* alerte ;
* critique ;
* partiel ;
* indisponible ;
* placeholder.

### Point critique d’intégration

Il ne faut pas transformer cette vue en simple « dashboard desktop bien rangé » ; elle doit rester un **cockpit opérationnel**.

### Référence design

`pilotage_desktop_v_r_na_canon_v5`

---

## 7.4 Synthèse comptable Esther

### Persona principal

Esther

### Régime

Synthèse comptable

### Finalité

Permettre une lecture structurée, justifiable et restituable de la situation financière.

### Structure attendue

* header synthèse ;
* résumé exécutif ;
* blocs de synthèse ;
* tableaux ;
* blocs de confiance ;
* graphes de compréhension ;
* point d’entrée vers le détail.

### Composants minimums

* bloc de synthèse ;
* tableaux comptables ;
* cartes KPI de synthèse ;
* graphes de structure ;
* bloc de confiance ;
* bloc de restitution / insight si prévu.

### États à gérer

* normal ;
* partiel ;
* indisponible ;
* anomalie ;
* placeholder si bloc non branché.

### Point critique d’intégration

La vue doit rester une **lecture comptable structurée**, pas redevenir un dashboard enrichi.

### Référence design

`synth_se_desktop_esther_canon_v5`

---

## 7.5 Détail Trésorerie

### Persona principal

Véréna

### Régime

Détail métier

### Finalité

Approfondir la lecture trésorerie avec contexte, graphe, rapprochement et éléments d’action.

### Structure attendue

* KPI principal ;
* évolution ;
* bloc de confiance / rapprochement ;
* tableau ou détail contextuel ;
* logique de retour au cockpit.

### Composants minimums

* bloc KPI ;
* graphe de détail ;
* tableau ou liste ;
* bloc de confiance ;
* badges ;
* CTA éventuels.

### États à gérer

* normal ;
* à rapprocher ;
* partiel ;
* indisponible ;
* anomalie.

### Point critique d’intégration

La vue doit rester un **approfondissement métier lisible**, jamais une vue technique brute.

### Référence design

`d_tail_tr_sorerie_v_r_na_canon_v5`

---

## 8. États de donnée à intégrer

Chaque composant sensible doit pouvoir exprimer au moins l’un des états suivants.

### Fiable / confirmée

La donnée peut être utilisée avec confiance.

### Partielle

La lecture est possible, mais le périmètre est incomplet.

### Estimée / proxy

La donnée n’est pas définitive, mais peut aider à la lecture.

### À rapprocher

Le flux ou l’agrégat n’est pas encore totalement réconcilié.

### Indisponible

La donnée ne peut pas être affichée de façon exploitable.

### Anomalie

La donnée est présente mais appelle une investigation.

### Règle d’intégration

Ces états doivent exister au moins pour :

* tuiles ;
* tableaux ;
* graphes ;
* bloc de confiance ;
* alertes si pertinent.

---

## 9. États d’interface à intégrer

Le système doit gérer au minimum :

* normal ;
* chargement ;
* vide ;
* alerte ;
* critique ;
* donnée partielle ;
* donnée indisponible ;
* placeholder produit.

### Exemples

* Z de caisse : placeholder produit
* donnée non disponible mais structure connue : état indisponible
* chargement partiel d’une tuile : état partiel / loading contextualisé

---

## 10. Doctrine d’intégration des graphes

### Principe général

Les graphes Lynki ne sont pas décoratifs.
Ils servent la lecture métier.

### Types de graphes à intégrer en priorité

* sparkline ;
* double série ;
* barres ;
* breakdown / répartition ;
* aging / échéancier ;
* courbe d’évolution.

### Par usage

**Pilotage**

* signal ;
* tendance ;
* vigilance.

**Synthèse**

* structure ;
* compréhension ;
* restitution.

**Détail**

* investigation ;
* justification ;
* contexte.

### Règles d’intégration

* un graphe ne doit jamais concurrencer le KPI principal ;
* un graphe doit rester lisible en cas de donnée partielle ;
* un graphe doit pouvoir coexister avec des états :

  * proxy
  * à rapprocher
  * indisponible
  * anomalie

### À éviter

* surcharge graphique ;
* variété inutile de types ;
* sophistication décorative ;
* perte de lisibilité en mobile.

---

## 11. Règles responsive d’intégration

### Max

* mobile-first ;
* lecture très synthétique ;
* priorité aux signaux majeurs ;
* densité réduite ;
* parcours court.

### Véréna

* desktop pilotage ;
* lecture simultanée de plusieurs blocs ;
* densité plus forte ;
* accès rapide au détail.

### Esther

* desktop synthèse ;
* priorité aux tableaux, blocs structurés et restitution ;
* logique de profondeur plus analytique.

### Règle générale

Le mobile n’est pas un simple desktop compressé.
Le desktop n’est pas un mobile enrichi.
Chaque support doit respecter son rôle produit.

---

## 12. Composants canoniques à construire

### 12.1 Tuiles

* maîtresse
* secondaire B
* secondaire C
* placeholder

### 12.2 Blocs

* bloc de confiance
* bloc d’alerte
* bloc insight
* bloc de synthèse
* bloc détail

### 12.3 Composants transverses

* badge
* statut
* filtres
* sélecteurs période / entité
* tableaux
* graphes
* cartes KPI
* empty states
* loading states

### Directive d’intégration

Chaque composant doit être construit comme **réutilisable**, pas comme un one-shot par écran.

---

## 13. Dépendances produit / données à documenter ensuite

Cette section devra être enrichie écran par écran avec le mapping réel vers les sources de données. La structure V1 est posée dans [`MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md) ; l’annexe endpoints / champs reste à produire.

### À documenter dans la suite

* source des données ;
* nature temporelle :

  * à date
  * sur période
  * projection
* caractère :

  * confirmée
  * proxy
  * partielle
* comportement en erreur / absence de donnée ;
* fréquence de rafraîchissement si applicable ;
* dépendances entre écrans et agrégats.

### Note

Le présent document cadre l’intégration front.
Le détail complet des contrats de données pourra faire l’objet :

* soit d’une annexe ;
* soit d’un document complémentaire de mapping front/back (prolonger [`MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md) § 9 — voir [`ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md)).

---

## 14. Règles de recette

L’intégration sera considérée comme conforme si les points suivants sont validés.

### 14.1 Conformité écran

* la hiérarchie générale respecte la référence canonique ;
* la structure de lecture est respectée ;
* les personas sont bien servis.

### 14.2 Conformité composants

* les composants sont réutilisables ;
* les variantes principales existent ;
* les états minimums sont gérés.

### 14.3 Conformité donnée

* les états de donnée sont lisibles ;
* la confiance ne disparaît pas ;
* les cas partiels / indisponibles sont traités proprement.

### 14.4 Conformité graphes

* les graphes sont utiles ;
* ils restent lisibles ;
* ils respectent la doctrine de lecture.

### 14.5 Conformité responsive

* mobile Max fidèle à son rôle ;
* desktop Véréna fidèle à son rôle ;
* desktop Esther fidèle à son rôle.

---

## 15. Points ouverts à arbitrer pendant l’intégration

* alignement exact entre tokens UI et couleurs handoff ;
* traitement final du placeholder Z de caisse ;
* règles finales des exports visibles dans certaines maquettes ;
* comportement exact de certains graphes en état proxy / partiel ;
* renommage éventuel de certains chemins historiques.

### Règle

Un point ouvert ne doit jamais être arbitré implicitement par le dev seul : validation produit requise.

---

## 16. Gouvernance de décision

### Produit

Arbitre :

* le sens ;
* le périmètre ;
* la hiérarchie métier ;
* les états de donnée ;
* les points ouverts.

### Design

Référence sur :

* la lecture visuelle ;
* les variantes d’écran ;
* les composants canoniques ;
* la cohérence d’ensemble.

### Intégration / dev

Responsable :

* de la traduction technique ;
* de la réutilisabilité ;
* de la cohérence d’implémentation ;
* du respect des contraintes front.

### QA / recette

Vérifie :

* conformité au handoff ;
* lisibilité ;
* gestion des états ;
* cohérence cross-device.

---

## 17. Suite du document

Ce cahier des charges constitue la base du passage en développement.
Il devra être complété ensuite par :

* un [**plan de lots dev**](./PLAN_LOTS_DEV_LYNKI_V1.md) ;
* un [**mapping front ↔ données**](./MAPPING_FRONT_DONNEES_LYNKI_V1.md) ;
* des **tickets d’implémentation** ([`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)) ;
* et une [**checklist de recette détaillée**](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md).

Les **tickets d’implémentation** (voir candidats [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)) devront toujours référencer :

* l’**écran canon** concerné (dossier `*_canon_v5` ou identifiant équivalent) ;
* le ou les **composants canoniques** concernés (cf. § 12) ;
* le **lot d’intégration** (cf. § 6) ;
* les **états** à couvrir (donnée § 8, interface § 9).

Pour la méthode de lecture des sources design et la **règle d’arbitrage** en cas de divergence, se reporter au [handoff design V1](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md) (§ 13).

---

## 18. Matrice de priorité d’intégration (V1)

Priorité indicative pour le pilotage des sprints et le découpage — à affiner avec le [plan de lots dev](./PLAN_LOTS_DEV_LYNKI_V1.md).

| Élément | Priorité intégration |
|---------|----------------------|
| Fondations UI (Lot 1) | P0 |
| Pilotage mobile Max | P0 |
| Alertes / Signaux Max | P0 |
| Pilotage desktop Véréna | P0 |
| Synthèse Esther | P1 |
| Détail Trésorerie | P1 |

Sans **Fondations UI**, les lots suivants ne sont pas réellement posés : le Lot 1 précède logiquement les écrans listés en P0.

---

> La présente version V1 est considérée comme **suffisante pour lancer le premier cycle d’intégration front**, sous réserve des **points ouverts** explicitement listés au § 15.

*Document V1 — base canonique pour l’intégration front Lynki. À faire évoluer avec les lots et le mapping données.*
