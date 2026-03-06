# Décision Produit — Simplification V1

## Suspension du chantier « Confirmation Bancaire Stricte »

**Date :** 2026-02-25  
**Statut :** Décision actée  
**Auteur :** Dorevia — Direction Produit

---

## 1. Contexte

Le chantier « Confirmation bancaire stricte des événements financiers » (v1.3) a été spécifié, implémenté et validé techniquement sur les Sprints 0 à 5.

Il visait à permettre au Vault de calculer un indicateur de type :

> *« Quel volume de mes paiements est confirmé par la banque ? »*

L'architecture est opérationnelle et documentée.

---

## 2. Décision

Afin de concentrer les efforts sur l'avancement produit et la clarté du positionnement en phase actuelle, il est décidé :

**De suspendre l'exploitation fonctionnelle de la confirmation bancaire dans la V1.**

La confirmation bancaire ne sera pas mise en avant dans l'interface Linky ni intégrée comme indicateur central dans la proposition de valeur actuelle.

---

## 3. Motivation

Cette décision repose sur trois constats :

| Constat | Description |
|---------|-------------|
| **Priorité à l'avancement** | Simplifier la trajectoire produit pour accélérer la mise en marché |
| **Clarté du positionnement** | Recentrer Dorevia sur le pilotage opérationnel et la fiabilité des données ERP |
| **Non criticité immédiate** | La confirmation bancaire constitue une couche d'ancrage externe pertinente mais non indispensable pour la V1 |

---

## 4. Périmètre impacté

- **Suppression** de l'indicateur « Confirmé par la banque » dans Linky
- **Suspension** de l'exploitation des deltas de confirmation dans l'API Treasury
- **Maintien** du fonctionnement standard basé sur les données ERP
- **Aucune régression fonctionnelle** n'est introduite

---

## 5. Architecture

L'infrastructure technique développée (migrations, deltas, handlers) **n'est pas supprimée**.

Elle est conservée comme **capacité latente**.

Cette approche permet :

- une réactivation ultérieure sans refonte,
- une évolution possible vers une version V2 ou un module avancé.

---

## 6. Positionnement produit V1

Dorevia V1 est désormais positionné comme :

> Une infrastructure de pilotage opérationnel basée sur des données ERP fiables, consolidées et exploitables en temps réel.

La couche de confirmation bancaire pourra être réintroduite ultérieurement si la maturité marché ou la stratégie produit le justifie.

---

## 7. Prochaines étapes

1. Stabilisation UI et UX sans indicateur de confirmation
2. Concentration sur la lisibilité du cockpit et la valeur opérationnelle immédiate
3. Avancement des chantiers prioritaires

---

*Décision assumée. Capacité conservée. Avancement priorisé.*
