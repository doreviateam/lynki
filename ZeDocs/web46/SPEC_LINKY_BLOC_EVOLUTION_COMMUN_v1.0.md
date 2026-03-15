# SPEC — Bloc Évolution commun des cards Linky

**Document :** SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0  
**Date :** 14 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Spécification détaillée  
**Références :**
- `SPEC_LINKY_CHARTE_COMMUNE_CARDS_v2.0.md`
- `PLAN_IMPLEMENTATION_CHARTE_CARDS_LINKY_v1.0.md`

---

## 1. Objet

Définir la règle produit et UI selon laquelle le **bloc Évolution** est un **élément structurel obligatoire** de toute card instrument Linky en production.

Cette spécification précise :
- le rôle du bloc Évolution ;
- son positionnement dans la card ;
- sa structure UI commune ;
- ses états normalisés ;
- les contrôles autorisés ;
- les règles de données ;
- les exceptions admises ;
- les implications d’implémentation pour les instruments existants.

---

## 2. Décision produit

### 2.1 Règle principale

Le **bloc Évolution** doit être présent sur **toutes les cards instrument Linky**.

Il devient un composant structurel de famille au même titre que :
- le **header commun** ;
- le **footer contextuel commun** ;
- le **contour commun** ;
- le **système de badges communs**.

### 2.2 Conséquence

La structure canonique d’une card instrument devient :

1. **Header**
2. **Synthèse métier**
3. **Bloc Évolution**
4. **Footer contextuel**

### 2.3 Principe de cohérence

L’absence de données historiques ne justifie **pas** la suppression du bloc Évolution.  
Elle justifie uniquement un **état vide standardisé** du bloc.

---

## 3. Objectif UX

Le bloc Évolution remplit quatre fonctions produit :

### 3.1 Donner une profondeur temporelle

Une card Linky ne doit pas seulement dire **où en est l’instrument maintenant**, mais aussi **comment il évolue sur la période**.

### 3.2 Uniformiser la lecture verticale des cards

L’utilisateur doit retrouver un rythme commun d’une card à l’autre :
- synthèse actuelle ;
- évolution temporelle ;
- contexte de lecture.

### 3.3 Renforcer la perception de cockpit

Le cockpit Linky ne doit pas apparaître comme une juxtaposition de résumés statiques.  
Le bloc Évolution inscrit chaque instrument dans une logique de pilotage continu.

### 3.4 Préparer les comparaisons inter-instruments

Même si chaque instrument a sa propre métrique, la présence systématique du bloc Évolution crée une base mentale commune pour comparer :
- tendance ;
- volatilité ;
- stabilité ;
- accélération / dégradation.

---

## 4. Positionnement dans la card

### 4.1 Emplacement obligatoire

Le bloc Évolution appartient au **body** de la card.

Il est placé :
- **après** la synthèse métier principale ;
- **avant** le footer contextuel.

### 4.2 Interdictions

Le bloc Évolution ne doit jamais :
- être déplacé dans le footer ;
- être traité comme une action secondaire flottante ;
- être remplacé par un simple lien texte en footer ;
- être supprimé parce qu’aucune donnée historique n’est encore branchée.

---

## 5. Structure UI commune du bloc Évolution

### 5.1 Composition minimale

Le bloc Évolution comprend, dans cet ordre :

1. **Ligne d’entrée du bloc**
   - libellé : `Évolution`
   - chevron ou indicateur d’expansion
   - action de bascule si le bloc est repliable

2. **Zone de contenu du bloc**
   - graphique, tableau de tendance, barres, ou état vide standardisé

3. **Texte de lecture optionnel**
   - courte phrase interprétative si pertinente

### 5.2 Ligne d’entrée standard

La ligne d’entrée doit utiliser un libellé stable :
- **`Évolution`**

Actions autorisées à droite :
- `Afficher`
- `Réduire`

Aucune autre formulation ne doit être introduite sans documentation.

### 5.3 Mode replié / déplié

Le bloc peut être :
- **replié** par défaut pour les cards compactes ;
- **déplié** par défaut pour certaines cards à forte valeur analytique, si cela est documenté.

La règle recommandée est :
- cards compactes → replié par défaut ;
- cards analytiques / cockpit → déplié si la lecture temporelle est essentielle.

---

## 6. États normalisés du bloc Évolution

Le bloc Évolution doit toujours exister visuellement, mais peut prendre plusieurs états.

### 6.1 État A — Disponible

Le bloc affiche une évolution exploitable :
- courbe ;
- barres ;
- aires ;
- série simple ou multi-séries ;
- légende si plusieurs séries.

Exemples :
- taxes collectées vs déductibles ;
- trésorerie validée sur la période ;
- encours total / échus ;
- flux entrants vs sortants ;
- marge / EBE sur période.

### 6.2 État B — Disponible mais partiel

Le bloc est présent avec données incomplètes, proxy ou partielles.

Obligations :
- affichage de l’évolution quand même ;
- badge ou note explicite si la lecture est partielle ;
- pas de suppression du bloc.

Exemples :
- EBE proxy ;
- trésorerie partiellement validée ;
- paiements avec couverture incomplète.

### 6.3 État C — Vide standardisé

Le bloc est présent mais aucune donnée historique exploitable n’est encore disponible.

Le rendu doit afficher un état vide propre, par exemple :
- `Aucune donnée d’évolution disponible pour la période.`
- `Historique insuffisant pour afficher une tendance.`

Il peut être accompagné d’un sous-texte court :
- `La card reste pilotable sur l’état courant.`

### 6.4 État D — À venir / module non branché

Cas transitoire admis uniquement si la fonctionnalité d’évolution n’est pas encore branchée pour l’instrument.

Le bloc doit exister avec un message explicite, par exemple :
- `Bloc Évolution à venir.`
- `L’historique sera disponible dans une prochaine version.`

Cet état doit être considéré comme **temporaire** et non comme un rendu cible.

### 6.5 État E — Erreur

Le bloc existe mais l’historique n’a pas pu être chargé.

Rendu recommandé :
- message d’erreur court ;
- possibilité de réessai dans le **body du bloc uniquement** si nécessaire ;
- aucune action d’erreur dans le header ou le footer de la card.

Exemple :
- `Impossible de charger l’évolution pour le moment.`

### 6.6 État F — Chargement

Le bloc est visible avec un état de chargement local :
- skeleton ;
- placeholder de graphique ;
- texte court de chargement.

---

## 7. Règles de représentation visuelle

### 7.1 Le bloc Évolution appartient à la même charte visuelle que la card

Le bloc ne doit pas introduire une sous-interface autonome qui casserait la silhouette de la card.

Il doit respecter :
- les mêmes couleurs de fond ;
- les mêmes séparateurs ;
- la même densité de texte ;
- la même hiérarchie typographique.

### 7.2 Le graphique n’est pas obligatoire, la structure oui

La présence d’un **graphe** n’est pas l’exigence principale.  
La présence d’un **bloc Évolution identifiable et normé** l’est.

### 7.3 Pas de surcharge gadget

Sont interdits par défaut :
- animations décoratives ;
- cartouches flottants sans rôle clair ;
- effets visuels distinctifs propres à une seule card ;
- styles de mini-dashboard isolés qui cassent la famille commune.

---

## 8. Contrôles autorisés dans le bloc Évolution

### 8.1 Contrôles permis

Dans le contenu du bloc, les contrôles suivants sont autorisés :
- granularité temporelle : `Semaine`, `Mois`, `Trimestre` ;
- mode d’affichage : `Montants`, `%`, éventuellement `Répartition %` ;
- type de vue : courbe, barres, aires, si cela a un sens métier.

### 8.2 Contrôles interdits sans justification

Ne pas ajouter localement :
- filtres exotiques propres à une seule card ;
- toggles purement esthétiques ;
- switchs dont la logique n’est pas documentée en charte ou spec instrument.

### 8.3 Règle de lisibilité

Les contrôles doivent rester secondaires.  
Le bloc Évolution doit d’abord être lisible comme **lecture de tendance**, puis comme zone de paramétrage léger.

---

## 9. Texte de lecture du bloc

### 9.1 Rôle

Le texte de lecture synthétise la tendance affichée.

### 9.2 Caractère optionnel

Il est recommandé, mais non obligatoire, surtout pour les cards où la lecture du graphe n’est pas immédiatement triviale.

### 9.3 Exemples

- `Lecture : tendance hebdomadaire.`
- `Lecture : hausse des encaissements sur les 4 dernières semaines.`
- `Lecture : volatilité élevée sur la période.`
- `Lecture : couverture probante stable mais partielle.`

### 9.4 Contrainte

Le texte de lecture doit rester court, descriptif, non marketing, et ne pas dupliquer le footer.

---

## 10. Typologie des instruments et attentes minimales

### 10.1 Trésorerie

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution de la trésorerie validée ;
- ou comparaison trésorerie Vault / ERP ;
- ou évolution de la couverture probante si la courbe de trésorerie n’est pas encore prête.

L’absence actuelle du bloc Évolution sur Trésorerie est **non conforme** à cette spec cible.

### 10.2 Flux net

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution des encaissements ;
- évolution des décaissements ;
- évolution du flux net ;
- granularité semaine / mois si disponible.

### 10.3 Taxes

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- taxes collectées vs déductibles ;
- vue montant / % ;
- lecture de tendance.

### 10.4 Encours

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution des créances ouvertes ;
- évolution des échus ;
- évolution du taux d’échéance dépassée ;
- éventuellement top créanciers mouvants sur période.

### 10.5 Business

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution marge ;
- évolution ventes / achats ;
- éventuellement évolution concentration / exposition si historiquée.

### 10.6 EBE

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution marge brute / EBE ;
- badge proxy si nécessaire ;
- indication claire si certaines composantes manquent.

### 10.7 BFR

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution du BFR ;
- évolution AR / AP ;
- éventuellement évolution du taux échus clients.

### 10.8 Paiements

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- couverture probante dans le temps ;
- rapproché / à rapprocher ;
- niveau de complétude.

### 10.9 Notes de crédit

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution du volume / montant des avoirs ;
- client / fournisseur si pertinent.

### 10.10 Remboursements

Le bloc Évolution est **obligatoire**.

Attendus minimaux :
- évolution des remboursements ;
- ventilation client / fournisseur si disponible.

### 10.11 Points de vente

Le bloc Évolution est **obligatoire** dès qu’une série temporelle existe.

À défaut : état vide standardisé.

Attendus minimaux :
- sessions remontées ;
- sessions scellées ;
- CA ou tickets si disponibles.

### 10.12 Z de caisse

Le bloc Évolution peut être absent **tant que le module n’est pas disponible**.

Dès que le module devient actif, il rejoint la règle commune.

---

## 11. Exceptions admises

Les seules exceptions admises à l’obligation de présence du bloc Évolution sont :

1. **placeholder de module non disponible** ;
2. **variante “bientôt disponible” explicitement documentée** ;
3. **écran transitoire de migration** documenté et borné dans le temps.

Ces exceptions doivent être explicites et temporaires.  
Aucune card instrument active en production ne doit rester durablement sans bloc Évolution.

---

## 12. Impacts sur la charte commune des cards

La charte commune doit intégrer une nouvelle règle non négociable :

> **Bloc Évolution obligatoire sur toute card instrument en production, sauf exception explicitement documentée.**

### 12.1 Conséquence sur la structure canonique

La structure canonique d’une card devient officiellement :

- Header commun
- Synthèse métier
- Bloc Évolution commun
- Footer contextuel

### 12.2 Conséquence sur les variantes

- **Variante A (compacte)** : bloc Évolution repliable par défaut
- **Variante B (analytique dense)** : bloc Évolution visible ou facilement dépliable
- **Variante C (état vide)** : bloc Évolution présent sous forme vide standardisée
- **Variante D (placeholder / bientôt disponible)** : exception tolérée temporairement

---

## 13. Impacts sur le plan d’implémentation

Le plan d’implémentation doit être mis à jour avec une exigence transversale :

### 13.1 Nouvelle règle transverse

Toute migration de card sur le chrome commun doit aussi vérifier la présence d’un bloc Évolution.

### 13.2 Nouveau critère de conformité

Ajouter dans la grille de conformité :

11. **Bloc Évolution présent, lisible et conforme à l’état réel des données**.

### 13.3 Nouveau critère de DoD

Pour chaque card migrée :
- bloc Évolution présent ;
- état du bloc documenté (disponible, partiel, vide, à venir, erreur, chargement) ;
- aucune suppression du bloc pour absence de données historiques.

---

## 14. Règles d’implémentation recommandées

### 14.1 Composant dédié recommandé

Créer ou normaliser un composant du type :
- `InstrumentCardEvolutionBlock`

Props suggérées :
- `title?: string` (par défaut `Évolution`)
- `defaultExpanded?: boolean`
- `state: 'available' | 'partial' | 'empty' | 'coming_soon' | 'error' | 'loading'`
- `controls?: ReactNode`
- `chart?: ReactNode`
- `reading?: ReactNode`
- `emptyMessage?: string`
- `errorMessage?: string`

### 14.2 Responsabilités du composant

Le composant doit centraliser :
- la ligne d’entrée du bloc ;
- le chevron ;
- le libellé `Afficher / Réduire` ;
- les espacements ;
- les états vides / erreur / chargement ;
- la structure générale du bloc.

### 14.3 Ce qui reste spécifique à chaque instrument

Chaque card garde la responsabilité de :
- choisir les séries ;
- définir les libellés métier ;
- fournir les contrôles pertinents ;
- fournir le graphique ou l’état vide.

---

## 15. Définition of Done — Spec cible

Une card Linky est conforme à cette spec si :

1. elle contient un bloc `Évolution` ;
2. le bloc est placé dans le body ;
3. le bloc n’est ni remplacé ni simulé par le footer ;
4. son état est cohérent avec les données réellement disponibles ;
5. son rendu respecte la charte commune de la card ;
6. son absence éventuelle est explicitement documentée comme exception temporaire.

---

## 16. Décision recommandée

Décision produit recommandée à acter :

> **Le bloc Évolution devient obligatoire sur toutes les cards Linky en production.**
> 
> Toute card sans bloc Évolution est considérée comme incomplète du point de vue de la structure cockpit, même si sa synthèse métier est correcte.

---

*Fin du document — SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0*
