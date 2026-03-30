# Tickets d’exécution — Écran détail Trésorerie

**Sprint :** Trésorerie v1.0  
**Référence produit :** [`SPEC_DETAIL_TRESO.md`](./SPEC_DETAIL_TRESO.md) v1.0  
**User stories :** [`USER_STORIES_DETAIL_TRESO.md`](./USER_STORIES_DETAIL_TRESO.md)  
**Date :** 30 mars 2026  
**Nombre de tickets :** 8  
**Charge estimée :** ~68 points

**Note d’implémentation :** Les chemins d’API (`GET /api/treasury/...`) sont **indicatifs**. Au développement, les conventions du code Lynki existant (`units/dorevia-linky`, handlers `app/api/...`, agrégats déjà exposés pour le cockpit) priment ; adapter les routes et payloads sans rompre la cohérence avec la tuile.

---

## Baseline — Cible vs Existant vs Ticket

Tableau de référence pour le cadrage de sprint (état du code Lynki au moment de la rédaction : `units/dorevia-linky`).

| Domaine | Cible produit / technique | Existant | Ticket principal |
|---------|---------------------------|----------|-------------------|
| Route écran | Écran détail Trésorerie structuré et cohérent avec la spec | Route `/tresorerie` déjà présente | **T-TR-DETAIL-001** (pas de ticket « route seule » ; le refactor global passe par **007–008**) |
| Source de données | Modèle détail aligné tuile ↔ détail | `dashboard-metrics` + `TreasuryDetail` existent | **T-TR-DETAIL-001** |
| Bandeau A | Solde validé + badge + couverture + montant à rapprocher + écart à confirmer, mêmes définitions que la tuile | Bandeau existant mais pas encore aligné sur la tuile | **T-TR-DETAIL-001** |
| Bloc B Décomposition | Comptes / journaux / instruments + poids + couverture | Absent | **T-TR-DETAIL-002** |
| Bloc C Rapprochement | Synthèse + aging + liste des éléments non rapprochés | Présent partiellement dans l’écran actuel, non structuré comme bloc cible | **T-TR-DETAIL-003** |
| Bloc D Écart à confirmer | Bloc dédié ERP vs position validée + qualification + explication | Données disponibles mais bloc produit absent | **T-TR-DETAIL-004** |
| Bloc E Évolution | Trésorerie + couverture + montant à rapprocher + vélocité | Courbe de solde partielle déjà présente | **T-TR-DETAIL-005** |
| Bloc F Vigilances | 3 niveaux + actions prioritaires | Gouvernance partielle, pas de bloc cible | **T-TR-DETAIL-006** |
| Responsive | Ordre et adaptation guidés par usage | Responsive partiel, non aligné avec la doctrine cible | **T-TR-DETAIL-007** |
| Intégration globale | 6 blocs cohérents entre eux et avec la tuile | Écran partiel existant, cohérence non garantie partout | **T-TR-DETAIL-008** |
| Vocabulaire | Libellés métier homogènes tuile ↔ détail | Partiellement aligné | **001** / **003** / **004** / **006** / **008** |
| États | À confirmer / Partiel / Fiable cohérents partout | Partiellement aligné selon zones | **001** / **008** |
| Endpoints | `/api/treasury/*` dédiés si retenus | Réalité actuelle plutôt `dashboard-metrics` + `treasury-evolution` | À arbitrer dans **001–005** |

### Lecture de la baseline

**Déjà présent**

* route détail Trésorerie ;
* agrégats backend utiles ;
* une partie de l’écran ;
* une partie de l’évolution ;
* la tuile cockpit comme référence sémantique ;
* états de chargement / erreur.

**Pas encore au niveau cible**

* découpage explicite en blocs A→F ;
* bandeau totalement aligné avec la tuile ;
* décomposition métier ;
* écart à confirmer comme bloc autonome ;
* vigilances / actions structurées ;
* responsive conforme à la doctrine ;
* cohérence complète inter-blocs.

### Conclusion de sprint

Le sprint Détail Trésorerie doit être lu comme :

1. **réalignement produit** ;
2. **refactor d’écran** ;
3. **complétion fonctionnelle** ;

et non comme une simple finition de l’existant.

### Formulation courte (ready to paste)

> L’écran détail Trésorerie existe déjà sous une forme partielle, adossée aux agrégats cockpit. La cible décrite par `SPEC_DETAIL_TRESO.md` n’est toutefois pas encore implémentée sous la forme de six blocs cohérents A→F. Le backlog `T-TR-DETAIL-*` doit donc être lu comme un chantier de réalignement produit, de refactor d’écran et de complétion fonctionnelle.

*(Une grille **Must / Should / Could** peut compléter cette baseline en planification de sprint.)*

---

## Pilotage du chantier — ligne de conduite

**Nature du travail :** **réalignement produit + refactor + complétion**, pas une simple retouche UI.

### Go immédiat (sans attendre)

* **T-TR-DETAIL-001** — bandeau aligné sur la tuile ;
* **socle de page** — structure des blocs A→F (emplacements, titres, ordre desktop) ;
* **première passe responsive de structure** — ordre et empilement cohérents avec la doctrine (complété plus tard par **007**).

C’est le bon « quick win » : ça réduit tout de suite les contradictions **tuile ↔ détail**.

### Points à cadrer très tôt (sinon risque de refaire une façade)

* flag **`NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE=1`** (comportement dégradé si `_details.treasury` absent) ;
* **source de données du Bloc B** (décomposition) ;
* **source détaillée du Bloc C** (liste / aging au-delà de l’agrégat actuel) ;
* **logique minimale du Bloc F** (règles, source alertes, CTA).

### Ordre d’exécution recommandé (révisé)

**Sprint d’ouverture**

1. **T-TR-DETAIL-001** — bandeau aligné sur la tuile ;
2. **socle layout / ordre des blocs** (extrait partiel de **007** : grille, zones, pas le polish final) ;
3. **T-TR-DETAIL-004** — écart à confirmer ;
4. **T-TR-DETAIL-003** — rapprochement bancaire, dans la mesure où l’API / Vault le permet déjà (V1 partielle acceptable).

**Ensuite**

5. **T-TR-DETAIL-002** — décomposition, **une fois la source cadrée** ;
6. **T-TR-DETAIL-006** — vigilances, **V1 simple** si besoin ;
7. **T-TR-DETAIL-005** — évolution enrichie ;
8. **T-TR-DETAIL-007** — responsive final ;
9. **T-TR-DETAIL-008** — intégration + recette (porte de sortie).

*Remarque :* l’ordre numérique des IDs (**002** avant **003** dans la doc initiale) n’impose pas l’ordre métier ; celui-ci reflète **valeur / risque / dépendance données**.

### Règles de sécurité

**1. Bandeau = même logique que la tuile**

* même agrégat (`dashboard-metrics` / modèle cockpit) ;
* même statut carte (`treasury.status`) et mêmes libellés (`treasury-cockpit-tile`, `UI_STATE_LABELS`) ;
* mêmes conventions **absolu** (bandeau / tuile) vs **signé** (détail Bloc D).

Éviter une logique parallèle (ex. score de confiance générique à la place du badge métier) sans décision produit documentée. Alignement doctrine états tuile : ticket **`EXECUTION_TICKET_T-TR-001.md`** (T-TR-001).

**2. V1 honnête pour B, C et F**

Mieux vaut un **Bloc B** réduit mais juste, un **Bloc C** partiel mais cohérent, un **Bloc F** simple mais utile — plutôt qu’une fausse complétude à refondre ensuite.

### Verdict opérationnel

> **Go pour l’implémentation.** **001** démarre tout de suite ; **003 / 004** suivent vite ; **002 / 006 / 005** dépendent davantage de la donnée ; **008** reste la vraie porte de sortie.

### Premier sprint exécutable — scope figé (mini-lot)

| Lot | Contenu | Objectif |
|-----|---------|----------|
| **001** | Bandeau aligné tuile | Cohérence tuile ↔ détail, base de vérité unique |
| **Structure** | Layout blocs A→F + ordre desktop | Refactor sans tout recoller deux fois |
| **004** | Écart à confirmer (bloc dédié) | Valeur métier forte, données souvent déjà dans `TreasuryDetail` |
| **003** | Rapprochement **partiel** si la donnée suit | Valeur sans attendre la spec complète |

Équilibre visé : **valeur rapide + risque maîtrisé**. Élargir **003** ou enchaîner **002 / 006 / 005** après arbitrage des sources et retour du sprint d’ouverture.

**Recette manuelle** (checklist à cocher sur `/tresorerie`) : [`RECETTE_MANUELLE_DETAIL_TRESO.md`](./RECETTE_MANUELLE_DETAIL_TRESO.md).

---

# T-TR-DETAIL-001 — Bandeau de synthèse

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | US-TRESO-DETAIL-A |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §7 |
| **Priorité** | P1 (bloquant) |
| **Points** | 5 |
| **Assigné à** | Frontend + Backend |
| **Statut** | Prêt |

---

## Description

Développer le **bandeau de synthèse** (Bloc A) qui affiche la lecture de référence de la trésorerie en continuité avec la tuile cockpit.

---

## Tâches techniques

### Frontend

- [ ] Créer composant `TreasuryHeader` (ou nom aligné sur le design system)
- [ ] Intégrer affichage du **solde validé** (montant dominant)
- [ ] Intégrer badge d’état (`À confirmer` / `Partiel` / `Fiable`)
- [ ] Intégrer les 3 indicateurs (couverture, à rapprocher, écart)
- [ ] Implémenter barre de couverture probante compacte
- [ ] Afficher périmètre (tenant / société / période / année)
- [ ] Afficher date/heure d’arrêté + statut synchro
- [ ] Styling responsive (desktop / tablette / mobile)

### Backend

- [ ] Exposer les données du bandeau (endpoint dédié ou agrégation page — à trancher avec l’archi existante)
- [ ] Retourner solde validé (même calcul que tuile)
- [ ] Retourner état principal (logique cohérente avec tuile)
- [ ] Retourner couverture probante (%)
- [ ] Retourner montant à rapprocher (valeur absolue)
- [ ] Retourner écart à confirmer (valeur absolue)
- [ ] Retourner métadonnées (périmètre, date arrêté, synchro)

### Tests

- [ ] Tests unitaires composant bandeau
- [ ] Tests d’intégration API / chargement données
- [ ] Tests de cohérence avec tuile cockpit

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Rendu** | Conforme maquettes validées |
| **Performance** | Chargement cible raisonnable (ex. &lt; 500 ms côté client une fois données reçues) |
| **Cohérence** | Mêmes valeurs que tuile cockpit |
| **Accessibilité** | Objectif RGAA niveau AA |
| **Responsive** | Desktop 1920px · tablette 768px · mobile 375px |

---

## Dépendances

- [ ] `SPEC_TUILE_TRESO.md` validée (cohérence indicateurs)
- [ ] Maquettes Bloc A validées
- [ ] API / agrégats Treasury disponibles

---

## Notes

* **Règle critique :** les 5 indicateurs doivent avoir **exactement la même définition** que dans la tuile cockpit.
* **Écart à confirmer :** affiché en valeur absolue dans le bandeau (le signe vit dans le Bloc D).
* **Ordre des colonnes :** couverture → à rapprocher → écart (même ordre que tuile).

---

# T-TR-DETAIL-002 — Décomposition de la trésorerie

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | US-TRESO-DETAIL-B |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §8 |
| **Priorité** | P1 (bloquant) |
| **Points** | 8 |
| **Assigné à** | Frontend + Backend |
| **Statut** | Prêt |

---

## Description

Développer le **bloc décomposition** qui ventile le solde validé par compte / journal / instrument avec poids et couverture.

---

## Tâches techniques

### Frontend

- [ ] Créer composant `TreasuryDecomposition`
- [ ] Créer tableau ou liste des comptes avec colonnes : nom compte/journal, solde retenu, couverture probante (%), contribution au solde (%)
- [ ] Implémenter tri par défaut (contribution décroissante)
- [ ] Implémenter filtres (tous / dégradés / par catégorie)
- [ ] Afficher catégorie (Banques / Espèces / Autres)
- [ ] Option : afficher dernier relevé / synchro / opérations ouvertes
- [ ] Styling responsive (tableau desktop → liste mobile)

### Backend

- [ ] Exposer liste des lignes de décomposition
- [ ] Retourner pour chaque ligne : identifiants, nom, catégorie, solde retenu, couverture probante, contribution (%), champs optionnels (dernier relevé, synchro, opérations ouvertes)
- [ ] Calculer contribution = (solde compte / solde total) × 100
- [ ] Implémenter filtres (catégorie, statut couverture)
- [ ] Implémenter tri (solde, couverture, contribution)

### Tests

- [ ] Tests unitaires composant
- [ ] Tests de calcul de contribution
- [ ] Tests de cohérence : somme des soldes = solde validé

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Cohérence** | Σ soldes comptes = solde validé (Bloc A) |
| **Tri par défaut** | Contribution décroissante |
| **Performance** | &lt; 1 s pour ordre de grandeur 50 comptes |
| **Responsive** | Tableau desktop → liste mobile |
| **Accessibilité** | Navigation clavier + lecteur d’écran |

---

## Dépendances

- [ ] T-TR-DETAIL-001 (bandeau) — cohérence solde total
- [ ] Maquettes Bloc B validées
- [ ] Données comptes disponibles côté API

---

## Notes

* **Règle métier :** un compte fortement pondéré (&gt; 50 %) mais peu couvert (&lt; 70 %) doit être visuellement identifiable.
* **Option V1 :** si trop complexe, afficher seulement les 5 premiers comptes + « Voir tous ».

---

# T-TR-DETAIL-003 — Rapprochement bancaire

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | US-TRESO-DETAIL-C |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §9 |
| **Priorité** | P1 (bloquant) |
| **Points** | 13 |
| **Assigné à** | Frontend + Backend |
| **Statut** | Prêt |

---

## Description

Développer le **bloc rapprochement** qui explique la masse restant à traiter, l’ancienneté et les éléments non rapprochés.

---

## Tâches techniques

### Frontend

- [ ] Créer composant `TreasuryReconciliation`
- [ ] Afficher synthèse haute : montant à rapprocher, nombre d’opérations ouvertes, part non couverte (%)
- [ ] Afficher répartition par ancienneté (ex. 0–7 j / 8–30 j / &gt; 30 j)
- [ ] Créer tableau des éléments non rapprochés : date, libellé, compte, montant, ancienneté, statut
- [ ] Implémenter filtres (compte, ancienneté, montant)
- [ ] Implémenter tri (montant décroissant, ancienneté)
- [ ] CTA « Voir toutes les opérations »
- [ ] Styling responsive

### Backend

- [ ] Exposer synthèse : montant à rapprocher (cohérent Bloc A), nombre d’opérations ouvertes, part non couverte (%)
- [ ] Retourner aging (buckets configurables)
- [ ] Retourner liste d’opérations non rapprochées (paginée)
- [ ] Implémenter filtres API (compte, ancienneté, montant min)
- [ ] Implémenter pagination (ex. 50 éléments par page)

### Tests

- [ ] Tests unitaires composant
- [ ] Tests de cohérence montant à rapprocher (Bloc A)
- [ ] Tests de performance sur gros volume (1000+ opérations)

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Cohérence** | Montant à rapprocher = Bloc A (identique) |
| **Synthèse avant détail** | Aging visible avant le tableau |
| **Performance** | &lt; 2 s pour scénario 1000 opérations (objectif à ajuster selon infra) |
| **Pagination** | Navigation par pages fonctionnelle |
| **Filtres** | Au moins 3 filtres utiles |

---

## Dépendances

- [ ] T-TR-DETAIL-001 (bandeau) — cohérence montant
- [ ] Maquettes Bloc C validées
- [ ] API / source rapprochement disponible

---

## Notes

* **Règle critique :** ce bloc explique pourquoi l’état est `Partiel` ou `À confirmer`.
* **Aging :** les bornes (0–7 j, 8–30 j, &gt; 30 j) doivent être configurables.
* **Option V1 :** limiter à 10 éléments dans le tableau + « Voir plus ».

---

# T-TR-DETAIL-004 — Écart à confirmer

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | US-TRESO-DETAIL-D |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §10 |
| **Priorité** | P2 (important) |
| **Points** | 8 |
| **Assigné à** | Frontend + Backend |
| **Statut** | Prêt |

---

## Description

Développer le **bloc écart** qui explique le décalage entre solde ERP et position validée.

---

## Tâches techniques

### Frontend

- [ ] Créer composant `TreasuryGap`
- [ ] Afficher écart à confirmer (valeur absolue)
- [ ] Afficher comparaison : solde ERP, position validée, écart signé (+/−)
- [ ] Afficher qualification si disponible (transitoire / à investiguer — libellés produit)
- [ ] Afficher principaux postes explicatifs (liste)
- [ ] Afficher ancienneté / tendance si disponible
- [ ] CTA « Voir le détail du calcul »
- [ ] Styling responsive

### Backend

- [ ] Exposer : écart à confirmer (absolu, cohérent Bloc A), solde ERP, position validée, écart signé (direction), qualification optionnelle, postes explicatifs, ancienneté optionnelle
- [ ] Documenter la convention de signe dans le code (alignée §10)

### Tests

- [ ] Tests unitaires composant
- [ ] Tests de calcul d’écart
- [ ] Tests de cohérence valeur absolue (Bloc A)

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Cohérence** | Écart absolu = Bloc A (identique) |
| **Signe** | Écart signé visible dans le détail |
| **Vocabulaire** | Pas de titre principal du type « Écart ERP − Vault » |
| **Qualification** | Affichée si disponible, sinon masquée |
| **Explications** | Au moins 1 poste explicatif si écart &gt; 0 |

---

## Dépendances

- [ ] T-TR-DETAIL-001 (bandeau) — cohérence écart
- [ ] Maquettes Bloc D validées
- [ ] Données écarts disponibles

---

## Notes

* **Règle critique :** le titre reste **Écart à confirmer** (pas de jargon technique en premier niveau).
* **Convention de signe :** documenter clairement (position − ERP ou ERP − position).
* **Qualification :** peut être absente en V1 si la logique métier n’est pas prête.

---

# T-TR-DETAIL-005 — Évolution de la trésorerie

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | US-TRESO-DETAIL-E |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §11 |
| **Priorité** | P2 (important) |
| **Points** | 13 |
| **Assigné à** | Frontend + Backend |
| **Statut** | Prêt |

---

## Description

Développer le **bloc évolution** qui montre la trajectoire de la trésorerie et de sa qualité de lecture.

---

## Tâches techniques

### Frontend

- [ ] Créer composant `TreasuryEvolution`
- [ ] Choisir bibliothèque de graphiques (Chart.js, D3, Recharts, etc.) alignée stack Lynki
- [ ] Courbe ou série : position validée sur la période
- [ ] Série couverture probante (points ou courbe selon maquette)
- [ ] Série montant à rapprocher
- [ ] Pastille ou ligne : vélocité du rapprochement
- [ ] Sélecteur de fenêtre (J-7 / J-30 / période complète, etc.)
- [ ] Marqueurs de rupture si disponibles
- [ ] Styling responsive (graphiques adaptatifs)

### Backend

- [ ] Exposer séries temporelles paramétrées par période (ex. 7d, 30d, full)
- [ ] Retourner séries : trésorerie, couverture, montant à rapprocher
- [ ] Calculer vélocité (variation sur fenêtre courte, ex. 7 jours)
- [ ] Détection de ruptures (optionnel)

### Tests

- [ ] Tests unitaires composant
- [ ] Tests de rendu graphique
- [ ] Tests de performance chargement séries

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Graphiques** | Lisibles, hiérarchisés (pas galerie) |
| **Performance** | Chargement séries acceptable (objectif &lt; 2 s à calibrer) |
| **Responsive** | Graphiques ou résumés adaptés mobile |
| **Fenêtres** | Au moins 3 fenêtres ou équivalent |
| **Vélocité** | Affichée clairement (points ou €) |

---

## Dépendances

- [ ] T-TR-DETAIL-001 (bandeau) — point d’arrivée = situation actuelle
- [ ] Maquettes Bloc E validées
- [ ] Bibliothèque graphique choisie
- [ ] Données historiques disponibles

---

## Notes

* **Règle UX :** éviter la « galerie de graphiques » — hiérarchie §11 (trésorerie → couverture → rapprochement → vélocité).
* **Vélocité :** peut être calculée côté client si les séries brutes sont fournies.
* **Option V1 :** si trop complexe, trésorerie + couverture uniquement.

---

# T-TR-DETAIL-006 — Vigilances et actions

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | US-TRESO-DETAIL-F |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §12 |
| **Priorité** | P1 (bloquant) |
| **Points** | 8 |
| **Assigné à** | Frontend + Backend |
| **Statut** | Prêt |

---

## Description

Développer le **bloc vigilances** qui hiérarchise les alertes et propose des actions prioritaires.

---

## Tâches techniques

### Frontend

- [ ] Créer composant `TreasuryAlerts` (ou équivalent)
- [ ] Afficher 3 niveaux : critique / bloquant · important / à surveiller · information / amélioration (codes couleur design system, pas obligatoirement emoji)
- [ ] Limiter à 3–5 vigilances visibles d’emblée
- [ ] Afficher actions prioritaires (CTA) avec libellés métier
- [ ] Liens vers écrans de traitement
- [ ] Bouton « Voir toutes les vigilances » si plus de 5
- [ ] Styling responsive

### Backend

- [ ] Exposer vigilances hiérarchisées (niveau, titre, description, compte, montant, ancienneté selon cas)
- [ ] Exposer actions prioritaires (libellé, route ou URL, priorité)
- [ ] Limiter par défaut (ex. 5 vigilances + 3 actions)

### Tests

- [ ] Tests unitaires composant
- [ ] Tests de hiérarchisation
- [ ] Tests de navigation vers actions

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Hiérarchie** | 3 niveaux distincts visuellement |
| **Limite** | Max 5 vigilances + 3 actions visibles en tête |
| **Cohérence** | Vigilances alignées avec blocs A, C, D, E |
| **Navigation** | CTA fonctionnels |
| **Responsive** | Liste adaptée mobile |

---

## Dépendances

- [ ] T-TR-DETAIL-001 à 005 — cohérence avec les autres blocs
- [ ] Maquettes Bloc F validées
- [ ] Source vigilances / règles métier
- [ ] Routes écrans de traitement existantes ou planifiées

---

## Notes

* **Règle critique :** ne pas devenir un « mur d’alertes » — priorisation stricte §12.
* **Cohérence :** une vigilance ne doit pas contredire l’état affiché (ex. pas de critique incohérente avec **Fiable** sans explication).
* **Actions :** pointer vers des écrans réels ou des placeholders documentés.

---

# T-TR-DETAIL-007 — Adaptation responsive

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | US-TRESO-DETAIL-RESPONSIVE |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §11.18, §19, `WIREFRAME_DETAIL_TRESO.md` (tactile) |
| **Priorité** | P1 (bloquant) |
| **Points** | 8 |
| **Assigné à** | Frontend |
| **Statut** | Prêt |

---

## Description

Assurer l’adaptation responsive de l’écran détail Trésorerie sur desktop, tablette et mobile.

---

## Tâches techniques

### Frontend

- [ ] Définir breakpoints (ex. desktop ≥ 1280px, tablette 768–1279px, mobile &lt; 768px — à aligner design system Lynki)
- [ ] Layout desktop : 6 blocs, composition multi-colonnes selon maquette
- [ ] Layout tablette : vertical simplifié, synthèse forte
- [ ] Layout mobile — ordre priorisé :
  1. Bandeau (A)
  2. Vigilances (F)
  3. Rapprochement (C)
  4. Écart (D)
  5. Décomposition (B)
  6. Évolution (E)
- [ ] Adapter tableaux → listes sur mobile
- [ ] Adapter graphiques → résumés sur mobile si besoin
- [ ] Tests sur appareils réels (iOS, Android)
- [ ] Optimiser performance mobile (lazy loading, chargement différé Bloc E)

### Tests

- [ ] Tests responsive sur les breakpoints retenus
- [ ] Tests sur appareils réels (minimum représentatif)
- [ ] Lighthouse ou équivalent sur mobile

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Desktop** | 6 blocs visibles, composition maquette |
| **Tablette** | Vertical, synthèse lisible |
| **Mobile** | Ordre priorisé respecté |
| **Performance** | Score perf mobile défini avec l’équipe (ex. Lighthouse ≥ 80 si pertinent) |
| **Accessibilité** | Zones tactiles suffisantes |

---

## Dépendances

- [ ] T-TR-DETAIL-001 à 006 — composants disponibles
- [ ] Maquettes responsive validées
- [ ] Design system responsive Lynki

---

## Notes

* **Règle critique :** responsive guidé par l’usage, pas par simple empilement (cf. US responsive).
* **Mobile :** privilégier action (F) et synthèse (A).
* **Performance :** lazy loading du Bloc E sur mobile si nécessaire.

---

# T-TR-DETAIL-008 — Intégration globale et tests

| Métadonnée | Valeur |
|------------|--------|
| **US de référence** | Toutes US-TRESO-DETAIL-* |
| **SPEC** | `SPEC_DETAIL_TRESO.md` §17–§18 |
| **Priorité** | P1 (bloquant) |
| **Points** | 5 |
| **Assigné à** | QA + Dev (+ DevOps si release) |
| **Statut** | Prêt |

---

## Description

Assurer l’intégration globale des six blocs, les tests bout-en-bout et la recette finale.

---

## Tâches techniques

### Intégration

- [ ] Assembler les six blocs dans l’écran complet
- [ ] Vérifier cohérence des données entre blocs
- [ ] Vérifier cohérence avec tuile cockpit
- [ ] Tester navigation tuile → détail
- [ ] Tester navigation détail → écrans de traitement

### Tests QA

- [ ] Exécuter cas de recette §18 (lecture partielle, fiable, à confirmer, données incomplètes)
- [ ] Tests de cohérence inter-blocs
- [ ] Tests de performance globale
- [ ] Tests d’accessibilité (RGAA)
- [ ] Tests cross-navigateur (Chrome, Firefox, Safari, Edge)

### Documentation

- [ ] Documenter écarts d’implémentation par rapport à la spec
- [ ] Mettre à jour changelog / notes de release

---

## Critères de validation technique

| Critère | Attendu |
|---------|---------|
| **Cohérence** | Aucune contradiction majeure entre blocs |
| **Tuile → détail** | Navigation fluide, valeurs alignées |
| **Recette** | Cas §18 couverts |
| **Performance** | Temps de chargement global acceptable (cible à fixer avec l’équipe, ex. &lt; 3 s) |
| **Accessibilité** | Niveau AA visé |

---

## Dépendances

- [ ] T-TR-DETAIL-001 à 007 terminés
- [ ] Environnement de recette disponible
- [ ] Jeux de données variés (Partiel / Fiable / À confirmer)

---

## Notes

* **Gate :** clôture sprint détail Trésorerie soumise à validation de ce ticket.
* **Documentation :** tout écart vs `SPEC_DETAIL_TRESO.md` doit être traçable (ticket ou ADR court).
* **Release :** ce ticket conditionne la mise en production de la v1 écran détail.
* **Recette manuelle alignée V1 :** [`RECETTE_MANUELLE_DETAIL_TRESO.md`](./RECETTE_MANUELLE_DETAIL_TRESO.md) (§4–§10 + écarts connus §10).

---

# Vue synthétique des 8 tickets

| Ticket | Bloc | Priorité | Points | Statut |
|--------|------|----------|--------|--------|
| T-TR-DETAIL-001 | Bandeau (A) | P1 | 5 | Prêt |
| T-TR-DETAIL-002 | Décomposition (B) | P1 | 8 | Prêt |
| T-TR-DETAIL-003 | Rapprochement (C) | P1 | 13 | Prêt |
| T-TR-DETAIL-004 | Écart (D) | P2 | 8 | Prêt |
| T-TR-DETAIL-005 | Évolution (E) | P2 | 13 | Prêt |
| T-TR-DETAIL-006 | Vigilances (F) | P1 | 8 | Prêt |
| T-TR-DETAIL-007 | Responsive | P1 | 8 | Prêt |
| T-TR-DETAIL-008 | Intégration + tests | P1 | 5 | Prêt |
| **TOTAL** | — | — | **68** | — |

---

# Prochaines étapes

1. Valider les maquettes pour chaque bloc (UX/UI).
2. Exécuter le **premier sprint** selon la section **« Pilotage du chantier — ligne de conduite »** (mini-lot **001 + structure + 004 + 003 partiel**), puis l’**ordre d’exécution recommandé** pour la suite.
3. Cadrer tôt les points **flag metric engine**, **sources B / C / F** (même section).
4. Préparer l’environnement de recette avec jeux de données représentatifs.
5. Planifier la revue de fin de chantier après T-TR-DETAIL-008.
