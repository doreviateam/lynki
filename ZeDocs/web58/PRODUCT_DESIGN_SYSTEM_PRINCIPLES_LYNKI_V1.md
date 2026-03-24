# Product Design System Principles — Lynki

## V1 opérationnelle

## 1. Rôle du document

Ce document fixe les **principes produit non négociables** qui doivent guider la formalisation visuelle de Lynki.

Il ne décrit pas le style final en détail.
Il décrit ce que le design doit **faire comprendre**, **faire sentir** et **rendre utilisable**.

---

## 2. Ce qu’est Lynki

Lynki est un **cockpit de pilotage financier** et de **contrôle de gestion**.

Lynki n’est pas :

* un dashboard générique de KPI ;
* un outil BI standard ;
* un ERP comptable habillé ;
* une interface décorative.

Lynki est un produit conçu pour :

* **voir vite** ;
* **piloter** ;
* **comprendre** ;
* **expliquer** ;
* **décider sur des données qualifiées**.

### Promesse centrale

> **Je vois.
> Je comprends.
> Je peux décider.**

---

## 3. Personas canoniques

### Max — CEO / Dirigeant

* **Support prioritaire** : mobile
* **Attente** : lecture immédiate, signaux essentiels, arbitrage rapide
* **Règle** : Max doit pouvoir comprendre l’essentiel en quelques secondes

### Véréna — RAF

* **Support prioritaire** : desktop pilotage
* **Attente** : suivi structuré, vigilance, arbitrage opérationnel
* **Règle** : Véréna doit pouvoir piloter, comparer, investiguer rapidement

### Esther — CDG / Contrôle de gestion

* **Support prioritaire** : desktop synthèse / analyse
* **Attente** : lecture comptable structurée, justification, restitution
* **Règle** : Esther doit pouvoir expliquer, relier, restituer

### Formule canonique

> **Max voit vite.
> Véréna pilote.
> Esther explique.**

---

## 4. Les deux régimes de lecture

### Pilotage

**Question directrice** :

> Que dois-je voir maintenant pour surveiller, arbitrer ou décider ?

**Doit exprimer** :

* vitesse ;
* signal ;
* hiérarchie forte ;
* accès au détail ;
* tension décisionnelle.

**Verbe central** : **agir**

### Synthèse comptable

**Question directrice** :

> Comment la situation se lit-elle de manière structurée, intelligible et restituable ?

**Doit exprimer** :

* structure ;
* profondeur ;
* justification ;
* lecture comptable ;
* restitution.

**Verbe central** : **comprendre**

### Règle

Le **Pilotage** aide à **agir**.
La **Synthèse comptable** aide à **comprendre et restituer**.

Les deux doivent être :

* clairement distincts ;
* visuellement cohérents entre eux ;
* perçus comme appartenant au même produit.

---

## 5. Hiérarchie canonique des éléments d’interface

### 5.1 Tuiles maîtresses

Exemples :

* Trésorerie
* Business
* Flux net

**Rôle** :

* capter l’attention ;
* structurer la lecture du cockpit ;
* porter les signaux majeurs.

**Règle** :
Une tuile maîtresse doit être identifiable immédiatement.

### 5.2 Tuiles secondaires

Exemples :

* Paiements
* BFR
* Encours
* Taxes
* EBE
* Notes de crédit
* Remboursements
* Points de vente
* Z de caisse

**Rôle** :

* enrichir le cockpit ;
* préciser les tensions ;
* ouvrir vers le détail.

**Règle** :
Une tuile secondaire doit être utile et lisible, sans concurrencer une tuile maîtresse.

### 5.3 Blocs de synthèse

Exemples :

* Résumé exécutif
* Compte de résultat
* Bilan
* Créances / dettes / échéances
* Qualité et confiance
* Notes d’explication

**Rôle** :

* structurer la compréhension ;
* relier synthèse et justification ;
* préparer la restitution.

### 5.4 Vue détail

**Rôle** :

* approfondir un signal ;
* contextualiser un indicateur ;
* conserver le lien avec le cockpit.

**Règle** :
Une vue détail reste une vue métier, pas une vue technique.

### 5.5 Bloc de confiance

**Rôle** :

* rendre lisible la qualité de la donnée ;
* différencier Lynki d’un dashboard classique.

### 5.6 Bloc alerte

**Rôle** :

* signaler ;
* prioriser ;
* orienter vers l’action.

### 5.7 Bloc insight

**Rôle** :

* condenser ;
* interpréter ;
* guider la lecture.

**Règle** :
L’insight accompagne la preuve ; il ne la remplace jamais.

---

## 6. Périmètre exact des 12 tuiles Pilotage

Le Pilotage comporte **exactement 12 tuiles** :

1. Trésorerie
2. Business
3. Flux net
4. Paiements
5. BFR
6. Encours
7. Taxes
8. EBE
9. Notes de crédit
10. Remboursements
11. Points de vente
12. Z de caisse

### Hiérarchie

**Tuiles maîtresses** :

* Trésorerie
* Business
* Flux net

**Tuiles secondaires B** :

* Paiements
* BFR
* Encours
* Taxes
* EBE

**Tuiles secondaires C** :

* Notes de crédit
* Remboursements
* Points de vente
* Z de caisse

### Règle

Le design peut proposer une mise en scène de cette hiérarchie, mais **ne doit pas modifier ce périmètre**.

---

## 7. Temps et lecture

Lynki manipule plusieurs natures de temps. Elles doivent être explicites.

### À date

Exemples :

* Trésorerie
* BFR
* Encours

**Règle** :
Doit être perçu comme un état actuel.

### Sur période

Exemples :

* Business
* Flux net
* Taxes
* EBE
* Notes de crédit
* Remboursements

**Règle** :
La période doit être clairement visible.

### Projection

Exemple :

* solde projeté

**Règle** :
Une projection doit toujours être distinguée d’une donnée constatée.

### Historique / évolution

**Règle** :
L’évolution complète la lecture ; elle n’est pas toujours le signal principal.

---

## 8. États canoniques de la donnée

Tout composant Lynki doit pouvoir exprimer, si nécessaire, l’un de ces états :

### Fiable / confirmée

Lecture utilisable avec confiance.

### Partielle

Lecture possible, mais périmètre incomplet.

### Estimée / proxy

Lecture utile, mais approximative ou substitutive.

### À rapprocher

Lecture conditionnelle, flux non totalement réconcilié.

### Indisponible

Lecture impossible ou non exploitable.

### Anomalie détectée

Lecture possible, mais nécessitant investigation.

### Règle générale

La qualité de la donnée est une **couche transverse du produit**, pas un simple détail UX.

---

## 9. États d’interface minimums

Le système visuel devra formaliser au minimum :

* normal
* alerte
* critique
* chargement
* donnée partielle
* donnée indisponible
* placeholder produit

Exemple de placeholder produit :

* Z de caisse

---

## 10. Composants métier à formaliser

Le design system visuel devra au minimum couvrir :

* tuiles maîtresses ;
* tuiles secondaires ;
* blocs de synthèse ;
* vues détail ;
* badges ;
* statuts ;
* filtres ;
* sélecteurs de période ;
* sélecteurs d’entité ;
* tableaux ;
* mini-graphes ;
* graphes analytiques ;
* alertes ;
* insights ;
* empty states ;
* loading states ;
* états partiels / indisponibles / anomalie.

---

## 11. Règles device / persona

### Max

Le mobile n’est pas un desktop réduit.
C’est une lecture managériale spécifique :

* rapide ;
* synthétique ;
* hiérarchisée ;
* orientée décision.

### Véréna

Le desktop pilotage est le cockpit opérationnel :

* plus dense ;
* plus comparatif ;
* plus navigable ;
* plus orienté arbitrage.

### Esther

Le desktop synthèse est l’espace de :

* compréhension ;
* justification ;
* restitution ;
* drill-down.

---

## 12. Identité attendue de Lynki

Lynki doit être perçu comme :

* sérieux ;
* fiable ;
* lisible ;
* maîtrisé ;
* dense sans être confus ;
* premium sans être luxueux ;
* moderne sans être gadget ;
* financier sans être austère ;
* distinctif sans être expérimental.

Lynki ne doit pas devenir :

* un dashboard startup générique ;
* un ERP gris ;
* une vitrine fintech décorative ;
* une interface froide ou désincarnée.

---

## 13. Implications visuelles attendues

Le futur système visuel devra rendre perceptible que :

* les **tuiles maîtresses** dominent clairement la lecture ;
* les **tuiles secondaires** complètent sans brouiller ;
* le **Pilotage** privilégie le scan, le signal et l’arbitrage ;
* la **Synthèse comptable** privilégie la structure, la justification et la restitution ;
* la **qualité de la donnée** est visible, mais sans alourdir toute l’interface ;
* la profondeur entre synthèse, détail et confiance reste cohérente dans tout le produit.

---

## 14. Règle finale pour la conception visuelle

La designeuse peut proposer :

* des hiérarchies ;
* des layouts ;
* des regroupements ;
* des composants ;
* des règles visuelles ;
* des transitions entre mobile et desktop.

Elle ne doit pas altérer :

* les 3 personas ;
* les deux régimes de lecture ;
* la hiérarchie maîtresse / secondaire ;
* le périmètre des 12 tuiles ;
* le rôle central des états de donnée ;
* la nature de Lynki comme cockpit financier fiable.

---

## 15. Conclusion

> **Lynki n’est pas seulement un produit qui montre des chiffres.
> C’est un produit qui organise la confiance, la lecture et la décision.**

Le système visuel devra traduire :

* la hiérarchie du pilotage ;
* la profondeur comptable ;
* la confiance dans la donnée ;
* la diversité des usages ;
* la singularité du produit.

---

## Document lié

* **Canon produit détaillé (V0)** : [`DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md`](./DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md) — approfondissement des mêmes notions.
