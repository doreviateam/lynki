# Plan d’implémentation Scrum — Bloc Évolution (3 cards Trésorerie, BFR, Encours)

**Document :** PLAN_IMPLEMENTATION_SCRUM_BLOC_EVOLUTION_3_CARDS_v1.1  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Backlog de référence (plan verrouillé avant exécution)  
**Références :**
- [SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md](./SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md) (v1.1.1 — spec normative)
- [Grille_Cadrage_Bloc_Evolution.md](./Grille_Cadrage_Bloc_Evolution.md)
- [ADR-0010_v1.1_ACCEPTEE.md](./ADR-0010_v1.1_ACCEPTEE.md) — Architecture Phase 3 acceptée (Epic E0)
- [PLAN_IMPLEMENTATION_BLOC_EVOLUTION_COMMUN_v1.0.md](../web46/PLAN_IMPLEMENTATION_BLOC_EVOLUTION_COMMUN_v1.0.md) (phases UI)
- [PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md](../web46/PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md) (phases data)

---

## Sommaire

1. [Contexte et état des lieux](#1-contexte-et-état-des-lieux)
2. [Périmètre Scrum](#2-périmètre-scrum)
3. [Vocabulaire data (verrouillé)](#3-vocabulaire-data-verrouillé)
4. [Epics et User Stories](#4-epics-et-user-stories)
5. [Backlog ordonné et Sprints suggérés](#5-backlog-ordonné-et-sprints-suggérés)
6. [Dépendances et risques](#6-dépendances-et-risques)
7. [Definition of Done globale](#7-definition-of-done-globale)

---

## Convention d’implémentation v1 (journalier vs mensuel)

**Règle d’architecture — Vault source exclusive :**  
Toutes les données métier affichées par Linky (cockpit, cards, blocs Évolution) proviennent **exclusivement du Vault**. Les séries Phase 3 (Trésorerie, Encours, BFR) doivent être lues soit depuis le Vault en direct, soit depuis des tables de snapshots **alimentées par des jobs qui s’appuient sur le Vault**. Aucune autre source (BDD Linky, autre service métier) pour les montants ou agrégats affichés. Exceptions documentées : DVIG (santé uniquement), DLP (domaine énergie, hors cockpit financier). Référence : spec consolidée §2.0.

---

**Décision explicite :** La spec normative (SPEC_CONSOLIDEE v1.1.1) cible une **historisation journalière** et une agrégation jour / semaine / mois. Pour la **première implémentation Phase 3**, l’équipe est autorisée à livrer une **historisation mensuelle** pour Trésorerie, Encours et BFR, afin de réduire la complexité (volume, jobs, recette). Cette limitation v1 doit être **visible** : (1) dans le **contrat API** (ex. `granularity: "month"` renvoyé, ou documenté dans l’endpoint) ; (2) dans la **recette** (cas testés sur granularité mois). Une évolution vers du **journalier** pourra être traitée en v2 si le besoin métier le justifie. On évite ainsi toute ambiguïté entre « cible normative » et « concession v1 livrable ».

---

## 1. Contexte et état des lieux

### 1.1 Ce qui est déjà livré (hors scope de ce backlog)

| Élément | Statut | Référence |
| --- | --- | --- |
| Décision produit « Bloc Évolution obligatoire » | Actée | Plan bloc commun P0 |
| Composant `InstrumentCardEvolutionBlock` | Livré (états available / partial / empty / error / loading / coming_soon) | Plan bloc commun P1 |
| Bloc Évolution sur Trésorerie, Encours, BFR, EBE | Présent (state="empty" pour T/E/BFR ; EBE en available si série) | Plan bloc commun P2 |
| Alignement Paiements (titre « Évolution ») | Plan P3 | Plan bloc commun P3 |
| Route `/api/ebe-evolution` + EBE en available | Livré | Plan data Phase 1 |
| Spec consolidée 3 cards (v1.1.1) | Rédigée (formules, partial, scope, payload) | ZeDocs/web47 |

### 1.2 Ce que ce plan Scrum couvre

- **Harmonisation** des messages vides et critères `partial` sur les 3 cards (alignement spec v1.1.1).
- **Phase 3 data** : historisation (snapshots) + endpoints série + branchement front pour **Trésorerie**, **Encours**, **BFR**.
- **Recette et conformité** : grille de conformité (critère 11), vérification DoD spec consolidée.
- **Optionnel** : migration des 6 cards déjà conformes (Flux net, Taxes, etc.) vers `InstrumentCardEvolutionBlock` (harmonisation technique).

---

## 2. Périmètre Scrum

### 2.1 Epics

| Epic | Objectif | Priorité |
| --- | --- | --- |
| **E0** | Arbitrage architecture Phase 3 (snapshots) | Bloquant |
| **E1** | Harmonisation messages et partial (spec v1.1.1) | Haute |
| **E2** | Historisation et série Trésorerie (Phase 3) | Haute |
| **E3** | Historisation et série Encours (Phase 3) | Haute |
| **E4** | Historisation et série BFR (Phase 3) | Haute |
| **E5** | Recette et grille de conformité 3 cards | Haute |
| **E6** | Migration 6 cards vers InstrumentCardEvolutionBlock | Basse (optionnel) |

### 2.2 Ordre de dépendance

- **E0** doit être livré en premier (décision + ADR) ; sans E0, E2/E3/E4 restent bloqués.
- **E1** peut être traité en parallèle ou juste après E0 (indépendant des données).
- **E2, E3, E4** dépendent de **E0**. E2 (Trésorerie) en premier ; E3 puis E4 (BFR réutilise AR/AP).
- **E5** partiel après E1, complété après E2–E4.
- **E6** en fin de backlog (optionnel).

---

## 3. Vocabulaire data (verrouillé)

Pour éviter les flottements entre spec, plan et implémentation, le vocabulaire suivant est **figé** pour ce backlog.

| Contexte | Terme | Usage |
| --- | --- | --- |
| **Tables de snapshots** | **`as_of_date`** | Date de référence du snapshot (YYYY-MM-DD). Un enregistrement = un point de série pour une date donnée. |
| **Tables** | `period_start` / `period_end` | Uniquement si on expose une période agrégée (ex. mois) ; sinon privilégier `as_of_date` seul. Éviter le champ **`period`** seul (trop ambigu). |
| **Endpoints série** | **`date_start`** / **`date_end`** | Paramètres de requête pour la plage demandée (alias possibles : date_debut, date_fin pour compatibilité existante). |
| **Endpoints** | **`granularity`** | Valeur renvoyée et/ou en query : `day` \| `week` \| `month`. En v1, la granularité livrée peut être `month` uniquement (convention v1). |
| **Réponse API** | `points[].date` | Date du point (dernier jour de la période si agrégation, ou as_of_date du snapshot). |

---

## 4. Epics et User Stories

### Epic E0 — Arbitrage architecture Phase 3 (snapshots)

**Objectif :** Acter les décisions bloquantes pour E2, E3, E4 afin que l’équipe sache où et comment implémenter les snapshots et les jobs. Cet epic est un **item backlog à part entière** (pas un « prérequis fantôme ») : livrable = ADR ou fiche architecture + décisions listées ci-dessous.

| ID | User Story | Critères d’acceptation | Tâches techniques |
| --- | --- | --- | --- |
| **E0-US1** | En tant qu’équipe, nous disposons d’un ADR (ou fiche architecture) Phase 3 snapshots acté et piloté. | 1. **Emplacement des tables** : décidé (Vault, BDD dédiée, autre) et documenté. 2. **Responsabilité des jobs** : qui héberge et exécute les jobs de snapshotting (cron, scheduler Vault, orchestration), fréquence (v1 = mensuelle actée). 3. **Contrat d’exposition** : comment les séries sont exposées (endpoint Vault vs API Linky, format réponse aligné spec §11). 4. **Convention de date** : dernier jour calendaire de la période vs dernier jour ouvré — décision documentée et reflétée dans l’API. 5. **Choix v1** : granularité **mensuelle** actée. 6. **Source des données** : les jobs de snapshotting et les endpoints de série **s’appuient exclusivement sur le Vault** (ou sur des tables alimentées par le Vault) ; aucune source métier hors Vault (spec §2.0). | 1. Rédiger ADR ou fiche architecture. 2. Inscrire explicitement la règle « Vault = source exclusive » et le tracé des données (Vault → jobs → tables → endpoints → Linky). 3. Revue et validation. 4. Communiquer aux devs. |

**Estimation Epic E0 :** 0,5–1 j (atelier + rédaction + validation). **Bloquant pour S2.**

---

### Exigence transverse — Idempotence des jobs de snapshotting

Tout job Phase 3 (E2, E3, E4) doit respecter :

- **Relancer un job ne doit pas dupliquer les snapshots.** Comportement attendu : UPSERT ou « insert or replace » sur la clé naturelle.
- **Un snapshot est unique** par `(tenant, company_id, as_of_date)` pour une famille de métrique donnée (trésorerie, AR, AP / BFR). Pas de doublon si le job est exécuté deux fois pour la même date.

Cette règle doit être vérifiée en recette (ex. lancer le job deux fois, vérifier un seul enregistrement par clé).

---

### Epic E1 — Harmonisation messages et partial (spec v1.1.1)

**Objectif :** Aligner les 3 cards Trésorerie, BFR, Encours sur la spec consolidée (messages vides, constante COVERAGE_PARTIAL_THRESHOLD, critères partial sur points affichés).

| ID | User Story | Critères d’acceptation | Tâches techniques |
| --- | --- | --- | --- |
| **E1-US1** | En tant qu’utilisateur, je vois un message d’état vide cohérent sur les 3 cards quand aucune évolution n’est disponible. | 1. Message empty = « Historique insuffisant pour afficher une évolution sur la période. » sur Trésorerie, BFR, Encours. 2. `emptyMessage` passé à `InstrumentCardEvolutionBlock` depuis chaque card (ou défaut global dans le composant). 3. Aucun libellé divergent (ex. « Aucune donnée… ») sans décision produit. | 1. Définir la constante ou le libellé dans un seul endroit (config ou composant). 2. TresoreriePositionCard : passer `emptyMessage` conforme. 3. WorkingCapitalCard : idem. 4. EncoursCard : idem. 5. Vérifier CardChartSection défaut si besoin. |
| **E1-US2** | En tant que dev, je peux m’appuyer sur une constante nommée pour le seuil de couverture partielle Trésorerie. | 1. Constante `COVERAGE_PARTIAL_THRESHOLD` (valeur 0.95) documentée ou implémentée (config / env). 2. Utilisée pour déterminer l’état `partial` de la card Trésorerie lorsque les séries seront branchées (préparation). | 1. Ajouter constante (ex. dans un module config Linky ou dans la card). 2. Documenter dans le code la référence à la spec §9.4. |
| **E1-US3** | En tant qu’utilisateur, l’état `partial` reflète la qualité des données effectivement affichées à l’écran. | 1. Le calcul du state `partial` est effectué sur les **points agrégés** renvoyés par l’endpoint (points effectivement affichés), et non sur l’ensemble des snapshots bruts. 2. Comportement **testé** : un cas avec série brute incomplète mais agrégation affichée complète ne doit pas passer en `partial` ; un cas avec au moins un point affiché incomplet (ex. secondaire manquante) doit passer en `partial`. | 1. Implémenter ou documenter la règle (backend ou front) : partial = évalué sur les points de la réponse API (déjà agrégés). 2. Ajouter un test (unit ou intégration) ou scénario de recette : série avec 1 point secondaire manquant sur 3 points affichés → partial ; série avec tous les points complets → available. |

**Estimation Epic E1 :** 1–2 j (petit ensemble de tâches, peu de risque).

---

### Epic E2 — Historisation et série Trésorerie (Phase 3)

**Objectif :** Exposer une série temporelle « trésorerie validée » (cash_validated, cash_erp, coverage_ratio) et faire passer la card Trésorerie en état available (ou partial) avec courbe de niveau.

**Prérequis :** Epic E0 livré (ADR Phase 3 acté).

| ID | User Story | Critères d’acceptation | Tâches techniques |
| --- | --- | --- | --- |
| **E2-US1** | En tant qu’équipe, nous avons une table de snapshots trésorerie et un job de snapshotting idempotent. | 1. Table (ex. `treasury_snapshots`) avec colonnes : tenant, company_id, **as_of_date** (YYYY-MM-DD, date de référence), validated_balance, erp_balance, reconciled, unreconciled, currency, created_at. Clé unique (tenant, company_id, as_of_date). 2. Job planifié (v1 = mensuel, ex. 1er du mois pour le mois précédent) qui appelle la logique treasury actuelle et **UPSERT** (idempotent) un enregistrement par (tenant, company_id, as_of_date). 3. Au moins une exécution réussie ; relance du job sans doublon vérifiée. | 1. Créer migration / modèle (Vault ou BDD selon E0). 2. Implémenter job avec UPSERT. 3. Tester exécution manuelle + idempotence. |
| **E2-US2** | En tant qu’API consumer, je peux récupérer une série trésorerie (cash_validated + secondaires) sur une période. | 1. Endpoint GET avec query **tenant**, **company_id**, **date_start**, **date_end** (ou date_debut/date_fin), **granularity**. 2. Réponse conforme au contrat spec §11 : metric, granularity, currency, scope, points[] (date, value, secondary). 3. Formules coverage_ratio selon spec §5.1. 4. Règle d’agrégation : last value par période si granularity week/month. 5. En v1, granularity livrée = `month` (convention v1) ; à documenter dans la réponse ou la doc API. | 1. Implémenter route ou handler. 2. Lire table snapshots (as_of_date), appliquer agrégation si besoin. 3. Déterminer state global sur **points affichés** (§9.4). 4. Documenter date_convention si applicable. |
| **E2-US3** | En tant qu’utilisateur, je vois la courbe d’évolution de la trésorerie validée sur la card Trésorerie quand des données existent. | 1. TresoreriePositionCard (ou wrapper) appelle l’endpoint série ; si ≥ 2 points et state available/partial, affiche le graphique (courbe de niveau). 2. Ligne principale = cash_validated ; ligne secondaire discrète = cash_erp si disponible. 3. State empty si &lt; 2 points ou série vide ; state partial si coverage &lt; COVERAGE_PARTIAL_THRESHOLD ou cash_erp absent sur un point affiché. 4. Message empty conforme spec. | 1. Ajouter fetch série dans le container (polling ou page load). 2. Passer série + state à TresoreriePositionCard. 3. Rendre InstrumentCardEvolutionBlock avec state dérivé et children = graphique (réutiliser ou créer courbe simple). 4. Gérer loading / error avec onRetry. |

**Estimation Epic E2 :** 4–6 j (modèle + job + endpoint + intégration front + recette).

---

### Epic E3 — Historisation et série Encours (Phase 3)

**Objectif :** Série receivables_overdue (et secondaires) ; card Encours en available avec courbe de risque.

| ID | User Story | Critères d’acceptation | Tâches techniques |
| --- | --- | --- | --- |
| **E3-US1** | En tant qu’équipe, nous avons une table de snapshots AR et un job de snapshotting idempotent. | 1. Table (ex. `ar_snapshots`) : tenant, company_id, **as_of_date** (YYYY-MM-DD), open_amount, overdue_amount, open_count_invoices, overdue_count_invoices, created_at. Clé unique (tenant, company_id, as_of_date). 2. Job mensuel (as_of_date = dernier jour du mois selon E0) appelant ar-by-partner et **UPSERT** des totaux. 3. Au moins une exécution réussie ; idempotence vérifiée. | 1. Créer migration / modèle. 2. Implémenter job avec UPSERT. 3. Tester + idempotence. |
| **E3-US2** | En tant qu’API consumer, je peux récupérer une série encours (receivables_overdue + secondaires). | 1. Endpoint GET avec query **tenant**, **company_id**, **date_start**, **date_end**, **granularity**. 2. Réponse : points avec value = receivables_overdue, secondary selon §5.3. 3. Agrégation last value si granularity week/month. 4. En v1, granularity = `month` (convention v1). | 1. Implémenter route / handler. 2. Lire ar_snapshots (as_of_date), calculer ratios. 3. State sur points affichés (§9.4). |
| **E3-US3** | En tant qu’utilisateur, je vois la courbe d’évolution des créances échues sur la card Encours. | 1. EncoursCard consomme l’endpoint ; si ≥ 2 points, affiche courbe de risque (principale = receivables_overdue). 2. Pas de top créanciers dans le bloc Évolution. 3. Messages empty/partial conformes. | 1. Fetch série dans le container. 2. Passer série + state à EncoursCard. 3. Graphique + InstrumentCardEvolutionBlock. |

**Estimation Epic E3 :** 3–5 j. Dépendance possible sur E2 si même stack (tables/jobs dans le même service).

---

### Epic E4 — Historisation et série BFR (Phase 3)

**Objectif :** Série bfr_net (et AR/AP, ar_overdue_ratio) ; card BFR en available avec courbe de tension.

| ID | User Story | Critères d’acceptation | Tâches techniques |
| --- | --- | --- | --- |
| **E4-US1** | En tant qu’équipe, nous avons les snapshots AR et AP (ou une table BFR) et un job idempotent. | 1. Tables ar_snapshots (E3) et ap_snapshots avec **as_of_date**, ou table unique working_capital_snapshots ; clé unique (tenant, company_id, as_of_date). 2. Job(s) mensuel(les) avec **UPSERT**. 3. Au moins une exécution réussie ; idempotence vérifiée. | 1. Réutiliser ar_snapshots ; créer ap_snapshots ou table BFR. 2. Job(s) avec UPSERT. 3. Tester + idempotence. |
| **E4-US2** | En tant qu’API consumer, je peux récupérer une série BFR (bfr_net + secondaires). | 1. Endpoint GET avec query **tenant**, **company_id**, **date_start**, **date_end**, **granularity**. 2. Réponse : points avec value = bfr_net, secondary = ar_total, ap_total, ar_overdue_ratio. 3. Mention périmètre (stock hors périmètre) si partial. 4. Agrégation last value ; v1 granularity = `month`. | 1. Implémenter route. 2. Lire snapshots (as_of_date), dériver bfr_net. 3. partial_reason si stock_out_of_scope. |
| **E4-US3** | En tant qu’utilisateur, je vois la courbe d’évolution du BFR net sur la card BFR. | 1. WorkingCapitalCard consomme l’endpoint ; si ≥ 2 points, affiche courbe de tension. 2. Mention « Stock non intégré » si partial. 3. Messages conformes. | 1. Fetch série. 2. Graphique + state. |

**Estimation Epic E4 :** 3–5 j. Réutilise AR (et éventuellement ap_snapshots) ; peut être mené en parallèle ou juste après E3.

---

### Epic E5 — Recette et grille de conformité 3 cards

**Objectif :** Vérifier que les 3 cards (Trésorerie, BFR, Encours) respectent la spec consolidée et la grille de conformité (critère 11).

| ID | User Story | Critères d’acceptation | Tâches techniques |
| --- | --- | --- | --- |
| **E5-US1** | En tant que QA / produit, je dispose d’une grille de recette consolidée pour les 3 cards. | 1. Grille (spec §10.2) remplie pour Trésorerie, BFR, Encours. 2. Pour chaque card : bloc présent, libellé « Évolution », métrique principale, type de courbe, granularité, états, message vide. 3. Cas **empty**, **available**, **partial**, **error** documentés. 4. **Fixtures ou snapshots de test** permettent de reproduire ces 4 états pour les 3 cards sans dépendre uniquement de la data réelle (ex. mock endpoint, jeu de données seed, ou env de test). | 1. Utiliser la grille spec §10.2. 2. Créer ou documenter des fixtures / jeux de données pour empty, available, partial, error. 3. Exécuter les scénarios et documenter les résultats. |
| **E5-US2** | En tant que produit, je sais que les DoD spec consolidée sont vérifiées. | 1. DoD §10.1 vérifiées pour chaque card dès que l’endpoint série est branché. 2. Règle d’apparition (≥ 2 points) respectée. 3. **Tests minimaux** : (a) test endpoint (réponse conforme, state cohérent) ; (b) test mapping état (réponse → state available/partial/empty) ; (c) test rendu (empty, partial, available affichés correctement). 4. Pas de régression sur EBE, Paiements. | 1. Checklist DoD. 2. Tests endpoint + mapping état + rendu. 3. Recette manuelle ou e2e. |

**Estimation Epic E5 :** 0,5–1 j (recette continue ; peut être répartie après E1, puis après E2–E4).

---

### Epic E6 — Migration 6 cards vers InstrumentCardEvolutionBlock (optionnel)

**Objectif :** Remplacer l’usage direct de `CardChartSection` par `InstrumentCardEvolutionBlock` sur Flux net, Taxes, Business, Notes de crédit, Remboursements, Points de vente.

| ID | User Story | Critères d’acceptation | Tâches techniques |
| --- | --- | --- | --- |
| **E6-US1** | En tant que dev, toutes les cards avec bloc Évolution utilisent InstrumentCardEvolutionBlock. | 1. FluxCashCard, TaxesCard, BusinessCard, CreditNotesCard, RefundsCard, PosShopsView : le bloc Évolution est rendu via InstrumentCardEvolutionBlock (même si en interne CardChartSection reste utilisée). 2. Libellé « Évolution » unifié. 3. Aucune régression visuelle ou fonctionnelle. | 1. Par card : remplacer CardChartSection par InstrumentCardEvolutionBlock avec les props adaptées (state, storageKey, children). 2. Recette visuelle. |

**Estimation Epic E6 :** 1–2 j. Priorité basse ; peut être traitée après E2–E5.

---

## 5. Backlog ordonné et Sprints suggérés

### 5.1 Ordre recommandé (liste de priorité)

1. **E0** — Arbitrage architecture Phase 3 (ADR acté, bloquant).
2. **E1** — Harmonisation messages et partial.
3. **E5-US1 partiel** — Recette structure + messages (état empty sur 3 cards).
4. **E2** — Trésorerie (série + front).
5. **E3** — Encours.
6. **E4** — BFR.
7. **E5 complet** — Grille de conformité + fixtures + tests minimaux (endpoint, mapping état, rendu empty/partial/available).
8. **E6** — Migration 6 cards (optionnel).

### 5.2 Sprints suggérés (format 2 semaines)

| Sprint | Objectif | User Stories | Estimation |
| --- | --- | --- | --- |
| **S0 / début S1** | Arbitrage architecture | **E0-US1** | ~0,5–1 j |
| **S1** | Conformité spec v1.1.1 + recette empty | E1-US1, E1-US2, E1-US3, E5-US1 (partiel : empty) | ~2 j |
| **S2** | Trésorerie Phase 3 (data + front) | E2-US1, E2-US2, E2-US3, E5-US2 (Trésorerie) | ~5 j |
| **S3** | Encours Phase 3 | E3-US1, E3-US2, E3-US3 | ~4 j |
| **S4** | BFR Phase 3 + recette consolidée | E4-US1, E4-US2, E4-US3, E5 complet (fixtures, tests min.) | ~5 j |
| **S5** (optionnel) | Harmonisation technique | E6-US1 | ~1–2 j |

Les estimations sont indicatives ; à ajuster selon vélocité et taille d’équipe. **E0 doit être livré avant S2** (idéalement en S0 ou tout début S1). Les estimations E2–E4 supposent l’architecture déjà décidée (E0 livré) ; sinon prévoir un buffer.

### 5.3 Story points (optionnel)

Si l’équipe utilise les story points (ex. échelle 1–5) :

| Epic / US | Suggestion (SP) |
| --- | --- |
| **E0 (ensemble)** | **1** |
| E1 (ensemble) | 2 |
| E2-US1 | 3 |
| E2-US2 | 3 |
| E2-US3 | 2 |
| E3 (ensemble) | 5 |
| E4 (ensemble) | 5 |
| E5 (ensemble) | 2 |
| E6-US1 | 2 |

---

## 6. Dépendances et risques

| Dépendance | Impact | Mitigation |
| --- | --- | --- |
| **E0 (arbitrage architecture Phase 3)** | E2, E3, E4 bloqués sans E0 livré. | E0 est un **item backlog** (E0-US1) avec livrable = ADR ou fiche architecture ; à planifier en S0 ou début S1. |
| **Vault / BDD** | Endpoints série et jobs dépendent du choix (Vault vs BDD dédiée). | Plan data §4.1 : décision à prendre dès le lancement Phase 3. |
| **Granularité journalière spec vs mensuelle v1** | Spec normative = journalier ; livrable v1 = mensuel. | **Convention v1** (en tête de document) : mensuel autorisé en v1 ; visible dans l’API et la recette. Pas d’ambiguïté : c’est une concession v1, pas la cible long terme. |
| **Régression EBE** | Changements sur composant ou états ne doivent pas casser EBE. | Recette EBE à chaque livraison touchant InstrumentCardEvolutionBlock ou les routes évolution. |

---

## 7. Definition of Done globale

Un sprint ou une epic est considéré(e) **done** lorsque :

- [ ] Les critères d’acceptation de chaque US livrée sont vérifiés.
- [ ] Le code est revu (si process en place) et mergé sur la branche cible.
- [ ] Aucune régression sur les 3 cards (Trésorerie, BFR, Encours) et sur EBE / Paiements (recette smoke).
- [ ] La spec consolidée (v1.1.1) est respectée pour les éléments implémentés (formules, états, messages, scope, vocabulaire data).
- [ ] **Tests minimaux** : pour les US data/front, au moins un test endpoint (réponse conforme, state cohérent), un test de mapping état (réponse → available/partial/empty), et un test de rendu (états empty, partial, available affichés correctement). Les **fixtures ou jeux de données de test** permettant de reproduire empty, available, partial et error pour les 3 cards sont documentés ou implémentés (E5).
- [ ] **Jobs de snapshotting** : idempotence vérifiée (relance sans doublon).
- [ ] **Source des données** : toutes les données affichées sur les 3 cards (et les séries Évolution) proviennent **exclusivement du Vault** ou de stockages alimentés par le Vault (spec §2.0) ; aucun autre service ou BDD comme source métier.
- [ ] Les mises à jour éventuelles de la grille de conformité ou de la doc (ZeDocs) sont faites.

---

*Plan d’implémentation Scrum — Bloc Évolution 3 cards — v1.1 — 13 mars 2026*
