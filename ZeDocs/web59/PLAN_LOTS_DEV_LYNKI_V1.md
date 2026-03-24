# Plan de lots dev — Lynki V1

*Ce document opérationnalise le [cahier des charges d’intégration front V1](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md) (§ 6, § 17) et s’aligne sur le [handoff design V1](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md). Il définit le **chantier de build** ; il ne remplace ni les maquettes canoniques ni les tickets.*

---

## 1. Objet du document

Ce document organise le passage du **cahier des charges d’intégration front Lynki V1** vers l’exécution développement.

Il a pour objectif de définir :

* les **lots de développement** ;
* leur **ordre logique** ;
* leurs **dépendances** ;
* leurs **résultats attendus** ;
* leurs **critères de sortie** ;
* et les **règles de pilotage** associées.

Ce document ne remplace pas :

* le handoff design ;
* le cahier des charges d’intégration ;
* ni les tickets détaillés d’implémentation.

Il sert à structurer le **chantier de build**.

### 1.1 Alignement avec le cahier des charges

Les lots **1 à 5** du cahier (§ 6) correspondent aux **Lots 1 à 5** ci-dessous ; ce plan ajoute un **Lot 0** (cadrage) et un **Lot 6** (stabilisation / recette) qui prolonge le « Lot 5 » du cahier (stabilisation).

### 1.2 Statut du document

* **Version** : V1
* **Statut** : Référence opérationnelle pour le découpage dev — à tenir à jour avec l’avancement réel des sprints
* **Documents parents** : [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md), [`CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md`](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)
* **Dernière mise à jour** : 23 mars 2026

---

## 2. Principe de pilotage

Le développement Lynki V1 doit suivre une logique simple :

> **stabiliser les fondations, livrer le cockpit dirigeant, livrer le cockpit RAF, livrer la synthèse, puis consolider**

On cherche :

* une montée en valeur progressive ;
* une réutilisation maximale des composants ;
* une réduction du risque d’effet tunnel ;
* une base démontrable rapidement.

---

## 3. Ordre général des lots

### P0

1. **Lot 0 — Cadrage technique et préparation**
2. **Lot 1 — Fondations UI et composants de base**
3. **Lot 2 — Pilotage mobile Max**
4. **Lot 3 — Pilotage desktop Véréna**

### P1

5. **Lot 4 — Synthèse comptable Esther**
6. **Lot 5 — Détail Trésorerie**
7. **Lot 6 — Stabilisation, recette et alignement final**

---

## 4. Détail des lots

### Lot 0 — Cadrage technique et préparation

#### Objectif

Préparer l’équipe à intégrer sans ambiguïté.

#### Contenu

* lecture commune du handoff design V1 ;
* lecture commune du cahier des charges d’intégration ;
* repérage du code existant dans `units/dorevia-linky/` ;
* inventaire des écarts entre existant et cible ;
* définition des conventions de travail :

  * nommage ;
  * structure composants ;
  * gestion des états ;
  * stratégie responsive ;
  * stratégie graphes ;
* préparation de l’arborescence des composants et vues.

#### Livrables attendus

* inventaire d’écart existant ↔ cible ;
* proposition d’arborescence composants ;
* principes techniques validés ;
* backlog initial découpé.

#### Critère de sortie

Le lot est terminé quand l’équipe sait :

* où elle part ;
* où elle va ;
* ce qu’elle réutilise ;
* ce qu’elle doit créer ;
* et dans quel ordre.

#### Risques à surveiller

* sous-estimer l’existant ;
* partir en refonte inutile ;
* ne pas figer les conventions de composants.

---

### Lot 1 — Fondations UI et composants de base

#### Objectif

Construire le socle réutilisable qui servira à tous les écrans.

#### Contenu

* layout global ;
* surfaces / cartes / conteneurs ;
* hiérarchie typographique ;
* tuiles :

  * maîtresse
  * secondaire B
  * secondaire C
  * placeholder
* badges et statuts ;
* filtres ;
* sélecteurs période / entité ;
* bloc de confiance de base ;
* bloc insight de base ;
* bloc alerte de base ;
* empty states ;
* loading states ;
* états de donnée :

  * fiable
  * partielle
  * proxy
  * à rapprocher
  * indisponible
  * anomalie
* composants graphiques de base :

  * sparkline
  * barres
  * double série
  * breakdown simple

#### Livrables attendus

* bibliothèque de composants V1 intégrable ;
* variantes principales prêtes ;
* première couche de tokens / styles utilitaires réellement utilisés ;
* documentation courte composant ↔ usage.

#### Critère de sortie

Le lot est terminé quand les lots suivants peuvent s’appuyer sur des composants déjà construits au lieu de recréer l’UI écran par écran.

#### Risques à surveiller

* faire un design system trop abstrait ;
* trop de composants avant d’avoir les écrans ;
* variations non arbitrées.

---

### Lot 2 — Pilotage mobile Max

#### Objectif

Livrer le premier cockpit mobile dirigeant bout en bout.

#### Contenu

* écran **Pilotage mobile Max** ;
* écran **Alertes / Signaux Max** ;
* navigation mobile associée ;
* intégration des 3 tuiles maîtresses ;
* intégration des tuiles secondaires utiles dans leur lecture mobile ;
* statut global de confiance ;
* bloc insight / priorité ;
* premiers comportements :

  * vide
  * partiel
  * indisponible
  * anomalie
  * à rapprocher

#### Dépend de

* Lot 0
* Lot 1

#### Livrables attendus

* parcours mobile Max démontrable ;
* lecture rapide cohérente ;
* premiers états de donnée visibles ;
* graphes mobiles cohérents.

#### Critère de sortie

Le lot est terminé quand un dirigeant peut :

* comprendre l’essentiel en quelques secondes ;
* distinguer le noyau de pilotage ;
* lire les alertes ;
* sentir la qualité de la donnée.

#### Risques à surveiller

* surcharge mobile ;
* perte de hiérarchie entre tuiles ;
* graphes trop denses ;
* alerte métier et alerte donnée mal distinguées.

---

### Lot 3 — Pilotage desktop Véréna

#### Objectif

Livrer le cockpit opérationnel desktop.

#### Contenu

* écran **Pilotage desktop Véréna** ;
* grille complète des 12 tuiles ;
* hiérarchie forte entre maîtresses et secondaires ;
* bloc de confiance transverse ;
* filtres / sélecteurs desktop ;
* lecture simultanée de plusieurs signaux ;
* composants graphiques desktop dans leur usage cockpit ;
* navigation vers le détail.

#### Dépend de

* Lot 0
* Lot 1
* de préférence Lot 2 terminé ou suffisamment avancé

#### Livrables attendus

* cockpit RAF démontrable ;
* 12 tuiles intégrées ;
* lecture simultanée crédible ;
* statuts de donnée visibles et cohérents ;
* articulation claire entre signal principal et signaux secondaires.

#### Critère de sortie

Le lot est terminé quand Véréna peut :

* piloter ;
* comparer ;
* repérer les tensions ;
* se sentir dans un cockpit, pas dans un simple dashboard.

#### Risques à surveiller

* densité excessive ;
* hiérarchie insuffisante ;
* lecture transverse de la confiance mal visible ;
* tuiles secondaires trop plates ou trop uniformes.

---

### Lot 4 — Synthèse comptable Esther

#### Objectif

Livrer la première vue de synthèse comptable structurée.

#### Contenu

* écran **Synthèse comptable Esther** ;
* résumé exécutif ;
* blocs de synthèse ;
* tableaux structurés ;
* blocs de confiance ;
* graphes de compréhension ;
* début de chaîne synthèse → justification → détail ;
* premiers points de restitution.

#### Dépend de

* Lot 0
* Lot 1
* idéalement Lot 3, pour cohérence transverse

#### Livrables attendus

* vue de synthèse exploitable ;
* tableaux lisibles ;
* blocs comptables structurés ;
* cohérence claire avec le canon Esther.

#### Critère de sortie

Le lot est terminé quand Esther peut :

* lire ;
* comprendre ;
* justifier ;
* se projeter dans une restitution.

#### Risques à surveiller

* faire un dashboard « desktop premium » au lieu d’une synthèse ;
* tableaux peu lisibles ;
* graphes trop décoratifs ;
* articulation faible avec la confiance dans la donnée.

---

### Lot 5 — Détail Trésorerie

#### Objectif

Livrer la première vue détail métier canonique.

#### Contenu

* écran **Détail Trésorerie** ;
* KPI principal ;
* graphe de détail ;
* tableau ou détail contextuel ;
* bloc de rapprochement / confiance ;
* logique de retour au cockpit ;
* gestion des états métier spécifiques :

  * à rapprocher
  * partiel
  * anomalie
  * indisponible

#### Dépend de

* Lot 1
* Lot 3
* partiellement Lot 4 si la navigation croisée doit être harmonisée

#### Livrables attendus

* première vraie page détail métier ;
* chaîne cockpit → détail fonctionnelle ;
* articulation claire entre chiffre, graphe, tableau et état de donnée.

#### Critère de sortie

Le lot est terminé quand la page détail est perçue comme un approfondissement métier lisible et non comme une vue technique brute.

#### Risques à surveiller

* trop de densité ;
* détail peu hiérarchisé ;
* graphes qui prennent le dessus ;
* confiance pas assez visible.

---

### Lot 6 — Stabilisation, recette et alignement final

#### Objectif

Consolider tout le socle V1 et sortir une version intégrée propre.

#### Contenu

* alignement cross-screen ;
* alignement cross-device ;
* stabilisation des composants réutilisés ;
* correction des incohérences d’états ;
* harmonisation des graphes ;
* recette fonctionnelle et visuelle ;
* nettoyage technique ;
* arbitrage final sur les points ouverts.

#### Dépend de

* tous les lots précédents

#### Livrables attendus

* V1 cohérente ;
* dette technique mineure identifiée ;
* liste des écarts résiduels ;
* base prête pour démonstration / usage interne / prolongement.

#### Critère de sortie

Le lot est terminé quand :

* les écrans sont cohérents entre eux ;
* les composants sont stabilisés ;
* la recette produit/design/dev est passée ;
* les écarts restants sont tracés et assumés.

#### Risques à surveiller

* laisser trop d’incohérences « pour plus tard » ;
* refondre au lieu de stabiliser ;
* ouvrir un V2 implicite avant d’avoir clos la V1.

---

## 5. Dépendances entre lots

### Dépendances fortes

* **Lot 1** dépend du **Lot 0**
* **Lot 2** dépend du **Lot 1**
* **Lot 3** dépend du **Lot 1**
* **Lot 4** dépend du **Lot 1**
* **Lot 5** dépend du **Lot 3**
* **Lot 6** dépend de tous les autres

### Dépendances de cohérence

* Lot 3 et Lot 4 doivent rester alignés sur :

  * les statuts ;
  * les badges ;
  * les graphes ;
  * les règles de confiance ;
  * les composants de base.

---

## 6. Règles de priorisation

### P0

À livrer en premier cycle :

* Lot 0
* Lot 1
* Lot 2
* Lot 3

### P1

À livrer dans le prolongement immédiat :

* Lot 4
* Lot 5

### P2

Réservé à la suite éventuelle :

* enrichissements ;
* détails supplémentaires ;
* extensions de synthèse ;
* raffinement supplémentaire du design system.

### Lot 1 (Fondations UI) — dépendance transverse

Dans tout **tableau de suivi** (outil de gestion, board, fichier partagé), faire **systématiquement** apparaître le **Lot 1** comme brique visible : sans fondations stables, les lots 2 à 5 restent fragiles. C’est cohérent avec la [matrice de priorité § 18 du cahier des charges](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md) (« Fondations UI (Lot 1) » en P0).

| Élément | Rôle |
|---------|------|
| Lot 0 | Cadrage et conventions |
| **Lot 1** | **Socle UI réutilisable — prérequis des lots d’écran** |
| Lots 2–5 | Écrans et parcours |
| Lot 6 | Stabilisation globale |

---

## 7. Rythme de pilotage recommandé

### Pour chaque lot

Prévoir :

1. cadrage
2. implémentation
3. revue produit / design
4. ajustements
5. recette
6. validation de sortie

### Règle

Un lot ne doit pas être considéré comme terminé uniquement parce que « ça ressemble à la maquette ».

Il doit être validé aussi sur :

* la hiérarchie de lecture ;
* les états ;
* la qualité de la donnée ;
* la cohérence produit ;
* le comportement responsive.

---

## 8. Critères globaux de réussite du plan V1

Le plan V1 sera considéré comme réussi si, à l’issue des lots :

* Max dispose d’un cockpit mobile crédible ;
* Véréna dispose d’un cockpit desktop pilotable ;
* Esther dispose d’une première synthèse comptable crédible ;
* la vue Détail Trésorerie établit la profondeur métier ;
* les composants principaux sont réutilisables ;
* la confiance dans la donnée est lisible ;
* les graphes sont utiles et non décoratifs ;
* l’équipe peut prolonger Lynki sans repartir du chaos.

---

## 9. Documents à produire en sortie ou en parallèle

Ce plan de lots doit être accompagné ou prolongé par :

* le [**mapping front ↔ données**](./MAPPING_FRONT_DONNEES_LYNKI_V1.md) ;
* les **tickets d’implémentation** (candidats : [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)) ;
* la [**checklist de recette**](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md) ;
* un [**template de ticket**](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md) pour l’import propre du backlog ;
* un [**annexe endpoints / champs**](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md) pour lever les `TBD` ;
* un éventuel **journal d’écarts** entre cible design et réalité intégrée ;
* une liste des **points reportés en V2**.

---

## 10. Formule finale

> Le but de ce plan n’est pas de tout faire tout de suite, mais de construire Lynki V1 dans un ordre qui préserve à la fois la cohérence produit, la lisibilité du design et la solidité de l’intégration.

---

## 11. Suite logique

La suite la plus utile après ce plan est le [**mapping front ↔ données**](./MAPPING_FRONT_DONNEES_LYNKI_V1.md) : c’est souvent là que les documents de cadrage rencontrent les contraintes réelles des APIs et agrégats — **écrans, composants, états** raccordés à la **réalité des données**. Les tickets d’implémentation devront référencer lot, écran canon et états (cf. [cahier des charges § 17](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)).

---

## 12. Suivi opérationnel des lots (couche projet — optionnel)

Ce document reste **stratégique** : il ne contient pas, par défaut, un état d’avancement par lot. Dès que le pilotage réel démarre, l’équipe peut ajouter une **couche de suivi** (même fichier en annexe, ou outil externe) avec, **pour chaque lot** :

| Champ | Exemple de valeurs |
|-------|-------------------|
| **Statut** | non démarré / en cours / à recetter / validé |
| **Responsable** | nom ou rôle |
| **Sprint cible** (ou fenêtre) | identifiant sprint ou dates |

Ces champs ne sont **pas obligatoires** tant que le chantier n’est pas lancé ; ils constituent la **prochaine couche naturelle** pour industrialiser le pilotage sans alourdir la V1 figée du plan.

---

*Plan de lots dev V1 — Lynki. À ajuster selon la vélocité d’équipe et les arbitrages produit. Documents associés : [`MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md), [`CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md), [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md).*
