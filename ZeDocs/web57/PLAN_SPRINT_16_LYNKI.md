# Plan Sprint 16 — Lynki

**Fichier canonique :** `PLAN_SPRINT_16_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Tickets d'exécution :** [EXECUTION_TICKETS_SPRINT_16_LYNKI.md](EXECUTION_TICKETS_SPRINT_16_LYNKI.md) v1.0  
**Rapport :** [RAPPORT_SPRINT_16_LYNKI.md](RAPPORT_SPRINT_16_LYNKI.md) v1.0  
**Révision 1.1 :** coexistence KPI / bloc rapprochement (Sprint 15), breadcrumb = état réel de navigation, Gate D — absence de chart non pénalisante si série métier non claire.  
**Révision 1.0 :** Gate D préfigurée, objectif A détaillé (hypothèses KPI), objectif C renommé, risque KPI marketing/pauvreté métier.  
**Sprint précédent :** [RAPPORT_SPRINT_15_LYNKI.md](RAPPORT_SPRINT_15_LYNKI.md) v1.1  
**Contrat métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2  

**En une phrase :** Sprint 16 = **première mise en forme forte de la Synthèse, sans trahir la discipline métier** — lecture haute + arbitrage minimal requis, pas de refonte CSS prématurée.  
**Formulation alternative :** *hiérarchiser la Synthèse avant de l’embellir.*

---

## 1. Intention

Après le Sprint 15 (confiance des flux visible en Synthèse, cohérence Pilotage × Synthèse, rétention FactsPack), le Sprint 16 vise à :

1. **Donner une lecture haute** de la Synthèse (grammaire proche de la vision « poste de lecture comptable »), **sans réouvrir** un gros chantier de données : KPI cards + breadcrumb de drill-down.

**Coexistence avec le bloc « État du rapprochement bancaire » (Sprint 15) :** les **4 cartes KPI complètent** la lecture haute ; elles **ne remplacent pas** le bloc de confiance des flux, qui demeure **l’entrée métier de confiance** de la vue Synthèse. Le placement et la hiérarchie visuelle doivent éviter d’**écraser** ce bloc (ordre : confiance → indicateurs de synthèse → restitutions détaillées), sauf arbitrage MOA explicite.
2. **Verrouiller le sens métier** avec la MOA (Esther) **avant** d’investir massivement en design system : au minimum §4.1 du contrat (taux, états, seuils de prudence) et premiers arbitrages sur la **hiérarchie des 4 blocs** structurants (Bilan, CdR, Tiers, GL).
3. **Ne pas** lancer le chantier **Design system V2 / dark theme / glassmorphism** en Sprint 16 — réservé à un sprint ultérieur (cf. §7), pour limiter la non-régression visuelle tant que le sens n’est pas figé.

**Principe directeur :** *ne pas faire monter la forme plus vite que le sens métier.*

---

## 2. Objectifs (périmètre Sprint 16)

| # | Objectif | Critère de succès |
|---|----------|-------------------|
| A | **4 cartes KPI** en tête de zone Synthèse (ou équivalent lisible) | Chiffres cohérents avec les agrégations existantes (Vault), périmètre filtré (société / période), pas de double logique métier parallèle ; chaque carte a un intitulé, une définition courte et une source d’agrégation validés (voir hypothèses ci-dessous). |
| B | **Breadcrumb** (ou fil d’Ariane) sur le parcours drill-down (ex. Synthèse → Balance → Grand livre) | Le breadcrumb **reflète un état réel de navigation** (drill-down existant, URL / état applicatif) et **non** une simple décoration de contexte. Navigation compréhensible et synchronisée avec ce que l’utilisateur voit et peut faire. |
| C | **Arbitrage métier minimal requis pour la lecture haute** | §4.1 enrichi ou annoté (source canonique du %, états, seuils) ; arbitrages MOA explicites sur l’ordre de lecture des blocs et sur le contenu des 4 cartes — ce n’est pas du « bonus documentaire », c’est une condition de livraison crédible. |
| D | *(Optionnel)* **Un premier graphique** | Un seul chart si la série et la sémantique métier sont déjà évidentes ; sinon report explicite en Sprint 17. |

### 2.1 Hypothèses de contenu des 4 cartes (à confirmer MOA)

Même si le détail reste à arbitrer en atelier, le sprint doit viser **au moins une hypothèse de contenu par carte** pour éviter le flou en implémentation :

| Carte | Hypothèse de contenu (cible de discussion) |
|-------|-------------------------------------------|
| **Bilan** | Total actif ou indicateur patrimonial clé (selon restitution disponible et périmètre). |
| **Compte de résultat** | Chiffre d’affaires ou résultat (selon arbitrage MOA / données déjà exposées). |
| **Tiers** | Nombre de tiers actifs pertinents ou encours clé (clients / fournisseurs selon périmètre). |
| **Grand livre** | Nombre d’écritures / transactions sur la période (ou métrique équivalente déjà traçable). |

Ces libellés et métriques sont **indicatifs** : l’atelier peut les ajuster, mais le sprint ne part pas sans cible.

---

## 3. Gate D — Close (périmètre Sprint 16)

**Gate D | Lecture haute Synthèse**

| Critère | Attendu |
|---------|---------|
| KPI cards | Visibles, cohérentes avec les agrégations et le périmètre filtré. |
| Breadcrumb | Drill-down fonctionnel et aligné avec la navigation réelle. |
| Contrat / sens métier | §4.1 enrichi ou annoté avec arbitrages MOA **minimaux** (pas obligatoirement gel complet, mais pas vide). |
| Charts | Aucun chart « décoratif » livré sans validation métier explicite (libellé + série + usage). |
| Chart absent en S16 | **L’absence de chart en Sprint 16 n’est pas un échec** si aucune série métier n’est jugée suffisamment claire pour être livrée sans ambiguïté — report explicite en Sprint 17 préférable à un graphique décoratif. |

La clôture du sprint (rapport, recette) doit expliciter le statut de cette Gate D.

---

## 4. Hors périmètre (explicitement)

- Design system V2, dark theme poussé, glassmorphism, refonte typographique globale → **Sprint 18+** (ou sprint dédié « polish »).
- Line chart + donut + composition chartée complète → **Sprint 17** (priorité après stabilisation §4.1).
- Personnalisation avancée par tenant des rubriques, simulation, moteur prescriptif.

---

## 5. Dépendances

- Données déjà exposées : APIs comptables existantes, `/api/treasury`, agrégations Vault.
- **Prérequis humain :** créneau atelier avec Esther (ou délégation MOA) pour §4.1, contenu des cartes KPI et ordre de lecture des blocs.

---

## 6. Risques

| Risque | Mitigation |
|--------|------------|
| Chart « décoratif » sans sens | Ne livrer un chart en S16 que si la série et le libellé sont validés ; sinon ticket reporté. |
| KPI faux sentiment de précision | Afficher périmètre, état partiel / réf. d’agrégation comme aujourd’hui. |
| **KPI cards trop « marketing » ou trop pauvres métier** | **Avant implémentation :** pour chaque carte, valider intitulé, définition courte en une phrase, et source d’agrégation (réutiliser les routes / agrégats existants). |
| Grosse refonte CSS parallèle | Interdire le chantier DS lourd en S16 dans le plan d’exécution. |

---

## 7. Suite logique (Sprint 17–18 — indicative)

| Sprint | Focus |
|--------|--------|
| **17** | Charts (line, donut), hiérarchie de lecture renforcée de la Synthèse, placement de l’insight, polish intermédiaire. |
| **18** | Design system V2, thème sombre si retenu, finitions responsive et « produit mature ». |

**Détail Sprint 17 (gel doc) :** [PLAN_SPRINT_17_LYNKI.md](PLAN_SPRINT_17_LYNKI.md) v1.3 · [EXECUTION_TICKETS_SPRINT_17_LYNKI.md](EXECUTION_TICKETS_SPRINT_17_LYNKI.md) v1.3 (T93–T98) · [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) v1.0.

*Cette séquence repousse le sprint le plus sensible (variables globales, contrastes, cards) après stabilisation métier.*

---

## 8. Tickets (placeholder — à découper en T88+)

**Suite logique documentaire :** rédiger **`EXECUTION_TICKETS_SPRINT_16_LYNKI.md`** (tickets T88+) à partir de ce plan.

À formaliser dans `EXECUTION_TICKETS_SPRINT_16_LYNKI.md` :

- Txx — KPI cards Synthèse (sources, états, responsive, validation intitulé/définition/source par carte).
- Txx — Breadcrumb drill-down (accessibilité, URL).
- Txx — Atelier MOA + mise à jour contrat (§4.1, hypothèses cartes, ordre des blocs).
- Txx — *(optionnel)* Premier chart + tests / recette (uniquement si validation métier).
- Txx — Clôture sprint, rapport, non-régression, **statut Gate D**.

---

## 9. Historique des versions

| Version | Date | Changement |
|---------|------|------------|
| 0.1 | 2026-03 | Création : intention S16 (KPI + breadcrumb + atelier Esther), hors périmètre DS lourd, enchaînement 17–18. |
| 1.0 | 2026-03 | Gate D « Lecture haute Synthèse » ; hypothèses de contenu des 4 cartes ; objectif C renommé ; risque KPI marketing / pauvreté métier ; phrase-clé et tickets alignés. |
| 1.1 | 2026-03 | Bloc rapprochement S15 vs KPI S16 (coexistence) ; breadcrumb = état réel de navigation ; Gate D — absence de chart non pénalisante ; lien explicite vers tickets T88+ ; formulation « hiérarchiser avant d’embellir ». |

---

*Document aligné sur l’échange produit post–Sprint 15 : le moteur est là ; il s’agit de la mise en forme d’un poste de lecture comptable moderne, avec le sens métier devant la cosmétique.*
