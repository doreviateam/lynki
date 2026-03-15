# Rapport d’implémentation — Bloc Évolution (3 cards Trésorerie, BFR, Encours)

**Document :** RAPPORT_IMPLEMENTATION_BLOC_EVOLUTION_3_CARDS_v1.0  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Rapport de livraison  
**Périmètre :** Cadrage, spécification, plan Scrum et première exécution (Epic E1)

---

## Sommaire

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Livrables documentaires](#2-livrables-documentaires)
3. [Règle d’architecture : Vault source exclusive](#3-règle-darchitecture-vault-source-exclusive)
4. [Implémentation réalisée (Epic E1)](#4-implémentation-réalisée-epic-e1)
5. [État d’avancement par epic](#5-état-davancement-par-epic)
6. [Prochaines étapes](#6-prochaines-étapes)
7. [Références et annexes](#7-références-et-annexes)

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le **bloc Évolution** est un élément structurel obligatoire de toute card instrument Linky (SPEC_LINKY_BLOC_EVOLUTION_COMMUN). Il répond à la question : *Comment l’indicateur se comporte-t-il dans le temps ?* Pour les cards **Trésorerie**, **BFR** et **Encours**, le bloc était présent mais en état **empty** (aucune série temporelle branchée). La cible produit est un triptyque cohérent : Trésorerie = courbe de niveau, BFR = courbe de tension, Encours = courbe de risque.

### 1.2 Objectifs du chantier

- **Cadrer** les métriques, la granularité et les rendus visuels pour les 3 cards (grille de cadrage).
- **Spécifier** de façon normative les formules, états, scope et contrat API (spec consolidée v1.1.1).
- **Planifier** l’exécution en mode Scrum (epics, user stories, backlog ordonné, convention v1).
- **Verrouiller** la règle d’architecture : toutes les données Linky proviennent exclusivement du Vault.
- **Implémenter** la première epic exécutable (E1 : harmonisation messages et partial) sans dépendance à l’arbitrage architecture Phase 3.

---

## 2. Livrables documentaires

### 2.1 Documents créés ou mis à jour (ZeDocs)

| Document | Version | Description |
| --- | --- | --- |
| **Grille_Cadrage_Bloc_Evolution.md** | — | Grille de cadrage produit : question métier, tableau de cadrage, règles communes, cadrage détaillé par card (Trésorerie, BFR, Encours), états d’affichage, formulations produit. Remise en forme (sommaire, structure, suppression redondances). Section « Avis d’expert » ajoutée (conformité à l’implémentation). |
| **SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md** | v1.1.1 | Spec normative : objet et périmètre, règles communes (§2.0 Vault source exclusive, snapshot, agrégation), scope des séries, mapping métriques grille ↔ Vault/Linky, **formules normatives** (coverage_ratio, bfr_net, overdue_ratio), exigences par card, états et messages, **critères du state partial** par card, DoD et recette, **contrat API cible** (exemple de payload). Verrouillages v1.1 et v1.1.1 : définition snapshot, formules, partial sur points affichés, convention de date, devise unique, COVERAGE_PARTIAL_THRESHOLD. |
| **PLAN_IMPLEMENTATION_SCRUM_BLOC_EVOLUTION_3_CARDS_v1.0.md** | v1.1 | Plan d’implémentation Scrum : convention v1 (mensuel autorisé), règle Vault source exclusive, epics E0 à E6, user stories avec critères d’acceptation et tâches, vocabulaire data verrouillé (as_of_date, date_start/date_end, granularity), **Epic E0** (ADR Phase 3) en item backlog, idempotence des jobs, fixtures et tests minimaux dans E5, DoD globale. Sprints suggérés (S0 → S5). |
| **ANALYSE_DONNEES_EVOLUTION_VAULT_LINKY.md** (web46) | — | Renforcement de la formulation « Vault = source exclusive » et précision sur les séries Phase 3 (tables alimentées par le Vault). |

### 2.2 Synthèse des décisions actées

- **Granularité v1** : historisation **mensuelle** autorisée pour la première livraison Phase 3 ; à documenter dans l’API et la recette. Cible normative long terme = journalier.
- **Partial** : évalué sur les **points effectivement affichés** (après agrégation), pas sur les snapshots bruts.
- **Seuil Trésorerie** : constante **COVERAGE_PARTIAL_THRESHOLD** = 0,95 (95 %).
- **Vocabulaire data** : as_of_date (tables), date_start / date_end (endpoints), granularity ; pas de champ `period` seul.
- **Vault** : source exclusive des données métier ; exceptions documentées (DVIG = santé, DLP = énergie).

---

## 3. Règle d’architecture : Vault source exclusive

### 3.1 Formulation

**Toutes les données métier affichées par Linky (cockpit, cards, blocs Évolution) proviennent exclusivement du Vault.**

- Données concernées : montants, soldes, séries temporelles, agrégats affichés sur les cards.
- Sources autorisées : (1) lecture directe Vault (`/ui/aggregations/*`, `/ui/system/*`), (2) données dérivées du Vault (ex. EBE = sales − purchases − payroll), (3) tables de snapshots alimentées par des jobs qui s’appuient sur le Vault.
- Exceptions documentées : **DVIG** (indicateur de santé/complétude uniquement), **DLP** (domaine énergie, hors cockpit financier).

### 3.2 Traces dans les documents

| Document | Section |
| --- | --- |
| Spec consolidée | §2.0 « Source exclusive des données : Vault » |
| Plan Scrum | Bloc en tête + E0-US1 (critère 6) + DoD globale |
| Grille de cadrage | Règle d’architecture (avant snapshots journaliers) |
| Analyse données (web46) | §1 « Vault = source exclusive » |

### 3.3 Implication pour la Phase 3

Les endpoints de série (Trésorerie, Encours, BFR) devront lire soit le Vault en direct, soit des tables alimentées par des jobs appelant le Vault. L’ADR (E0) doit acter le tracé : Vault → jobs → tables → endpoints → Linky.

---

## 4. Implémentation réalisée (Epic E1)

### 4.1 Périmètre

Epic **E1 — Harmonisation messages et partial (spec v1.1.1)** : alignement des 3 cards Trésorerie, BFR et Encours sur le message d’état vide standardisé, la constante de seuil de couverture partielle, et la documentation de la règle « partial sur points affichés ».

### 4.2 Fichiers créés

| Fichier | Rôle |
| --- | --- |
| **`units/dorevia-linky/app/lib/evolution-block-constants.ts`** | Constantes partagées du bloc Évolution : `EVOLUTION_EMPTY_MESSAGE` (message standardisé empty), `COVERAGE_PARTIAL_THRESHOLD` (0,95). JSDoc avec référence à la spec consolidée et rappel de la règle partial (points affichés). |

### 4.3 Fichiers modifiés

| Fichier | Modification |
| --- | --- |
| **`components/CardChartSection.tsx`** | Import de `EVOLUTION_EMPTY_MESSAGE`. Défaut pour l’état empty : `emptyMessage ?? EVOLUTION_EMPTY_MESSAGE` (remplace l’ancien libellé « Aucune donnée d’évolution… »). |
| **`components/TresoreriePositionCard.tsx`** | Import de `EVOLUTION_EMPTY_MESSAGE`. Passage de `emptyMessage={EVOLUTION_EMPTY_MESSAGE}` à `InstrumentCardEvolutionBlock`. |
| **`components/WorkingCapitalCard.tsx`** | Idem. |
| **`components/EncoursCard.tsx`** | Idem. |
| **`components/InstrumentCardEvolutionBlock.tsx`** | Ajout dans le JSDoc : « État partial (SPEC_CONSOLIDEE §9.4) : le state partial est évalué sur les points effectivement affichés (après agrégation), pas sur les snapshots bruts. » |

### 4.4 Détail des constantes

```ts
// evolution-block-constants.ts

/** Message standardisé pour l'état empty (spec §7.2, §9.2). */
export const EVOLUTION_EMPTY_MESSAGE =
  "Historique insuffisant pour afficher une évolution sur la période.";

/** Seuil couverture Trésorerie (spec §9.4). Valeur 0,95 = 95 %. */
export const COVERAGE_PARTIAL_THRESHOLD = 0.95;
```

### 4.5 Critères d’acceptation E1 (statut)

| Critère | Statut |
| --- | --- |
| E1-US1 : Message empty = « Historique insuffisant… » sur les 3 cards | ✅ Réalisé (constante + défaut CardChartSection + passage explicite sur les 3 cards). |
| E1-US2 : Constante COVERAGE_PARTIAL_THRESHOLD (0,95) documentée / implémentée | ✅ Réalisé (evolution-block-constants.ts). Prête pour usage lors du branchement série Trésorerie. |
| E1-US3 : Partial évalué sur les points affichés (doc ou logique) | ✅ Réalisé (commentaires dans InstrumentCardEvolutionBlock et evolution-block-constants.ts). Comportement testable dès que les séries seront branchées (E2). |

### 4.6 Vérifications effectuées

- **Linter** : aucune erreur sur les fichiers modifiés.
- **Build** : `npm run build` (dorevia-linky) terminé avec succès.

### 4.7 Non réalisé dans E1 (hors périmètre ou reporté)

- **Test automatisé** du comportement partial (série incomplète vs agrégation complète) : à ajouter lorsque l’endpoint série Trésorerie existera (E2).
- **Utilisation effective** de `COVERAGE_PARTIAL_THRESHOLD` dans la logique (décision partial) : prévue dans E2-US3 lors du branchement front de la série Trésorerie.

---

## 5. État d’avancement par epic

| Epic | Objectif | Statut | Commentaire |
| --- | --- | --- | --- |
| **E0** | Arbitrage architecture Phase 3 (ADR) | Non démarré | Bloquant pour E2/E3/E4. À planifier en priorité (S0 ou début S1). |
| **E1** | Harmonisation messages et partial | **Livré** | Constantes, message empty unifié, doc partial sur points affichés. |
| **E2** | Historisation et série Trésorerie | Non démarré | Dépend de E0. Table + job + endpoint + front. |
| **E3** | Historisation et série Encours | Non démarré | Dépend de E0. |
| **E4** | Historisation et série BFR | Non démarré | Dépend de E0, réutilise AR/AP. |
| **E5** | Recette et grille de conformité | Partiel possible | Recette « empty » sur les 3 cards réalisable ; fixtures et tests complets après E2–E4. |
| **E6** | Migration 6 cards vers InstrumentCardEvolutionBlock | Non démarré | Optionnel, fin de backlog. |

---

## 6. Prochaines étapes

1. **E0** : Rédiger et valider l’ADR Phase 3 (emplacement tables, responsabilité jobs, contrat d’exposition, convention de date, granularité v1, règle Vault source exclusive). Inscrire la référence à l’ADR dans le plan Scrum.
2. **E5 partiel** : Exécuter la recette « empty » sur Trésorerie, BFR, Encours (grille spec §10.2) et documenter les résultats.
3. **E2** : Une fois E0 acté, enchaîner sur Trésorerie (table snapshots, job idempotent, endpoint série, branchement front avec `COVERAGE_PARTIAL_THRESHOLD` pour le state partial).
4. **E3, E4** : Puis Encours et BFR selon le backlog.
5. **E5 complet** : Fixtures (empty / available / partial / error), tests minimaux (endpoint, mapping état, rendu), grille de conformité complète.

---

## 7. Références et annexes

### 7.1 Documents de référence (ZeDocs)

| Référence | Chemin |
| --- | --- |
| Grille de cadrage | `ZeDocs/web47/Grille_Cadrage_Bloc_Evolution.md` |
| Spec consolidée | `ZeDocs/web47/SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md` (v1.1.1) |
| Plan Scrum | `ZeDocs/web47/PLAN_IMPLEMENTATION_SCRUM_BLOC_EVOLUTION_3_CARDS_v1.0.md` (v1.1) |
| ADR Phase 3 (E0) | `ZeDocs/web47/ADR-0010_v1.1_ACCEPTEE.md` |
| Plan bloc commun (UI) | `ZeDocs/web46/PLAN_IMPLEMENTATION_BLOC_EVOLUTION_COMMUN_v1.0.md` |
| Plan data (Vault / Linky) | `ZeDocs/web46/PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md` |
| Analyse données | `ZeDocs/web46/ANALYSE_DONNEES_EVOLUTION_VAULT_LINKY.md` |

### 7.2 Fichiers code impactés (E1)

| Fichier | Type |
| --- | --- |
| `units/dorevia-linky/app/lib/evolution-block-constants.ts` | Création |
| `units/dorevia-linky/components/CardChartSection.tsx` | Modification |
| `units/dorevia-linky/components/InstrumentCardEvolutionBlock.tsx` | Modification |
| `units/dorevia-linky/components/TresoreriePositionCard.tsx` | Modification |
| `units/dorevia-linky/components/WorkingCapitalCard.tsx` | Modification |
| `units/dorevia-linky/components/EncoursCard.tsx` | Modification |

### 7.3 Glossaire

- **Snapshot** : enregistrement d’un agrégat métier à une date de référence (as_of_date), constituant un point de série pour le bloc Évolution.
- **State partial** : état du bloc lorsque les données sont exploitables mais incomplètes (ex. couverture &lt; seuil, secondaire manquante) ; évalué sur les points **affichés** (après agrégation).
- **Convention v1** : première livraison Phase 3 autorisée en granularité **mensuelle** ; à documenter dans l’API.

---

## 8. Build & Deploy

### 8.1 Build

- **npm** : `cd units/dorevia-linky && npm run build` — OK.
- **Docker** : image construite avec le tag `dorevia/linky:evolution-e1-2026-03-13`.

```bash
cd units/dorevia-linky
docker build -t dorevia/linky:evolution-e1-2026-03-13 .
```

### 8.2 Deploy

Le déploiement se fait par **tenant** via le `docker-compose` de l’UI (ex. `tenants/<tenant>/apps/ui/lab/docker-compose.yml` ou équivalent).

1. **Option A — image locale**  
   Dans le compose du tenant, mettre à jour le tag de l’image Linky vers `dorevia/linky:evolution-e1-2026-03-13`, puis :
   ```bash
   docker compose pull   # si l’image est sur un registry
   docker compose up -d
   ```

2. **Option B — registry**  
   Pousser l’image puis sur le serveur cible :
   ```bash
   docker push <registry>/dorevia/linky:evolution-e1-2026-03-13
   # Sur le serveur :
   cd tenants/<tenant>/apps/ui/...
   # Mettre à jour le tag dans docker-compose.yml
   docker compose pull && docker compose up -d
   ```

Aucune variable d’environnement ni migration supplémentaire n’est requise pour la livraison E1.

---

*Rapport d’implémentation — Bloc Évolution 3 cards — v1.0 — 13 mars 2026*
