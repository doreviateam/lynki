# Rapport de Sprint 17 — Lynki

**Fichier canonique :** `RAPPORT_SPRINT_17_LYNKI.md`  
**Version :** 1.5 — mars 2026  
**Plan :** [PLAN_SPRINT_17_LYNKI.md](PLAN_SPRINT_17_LYNKI.md) v1.3  
**Tickets :** [EXECUTION_TICKETS_SPRINT_17_LYNKI.md](EXECUTION_TICKETS_SPRINT_17_LYNKI.md) v1.3  
**Contrat métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2.1 *(inchangé en S17)*  
**Sprint précédent :** [RAPPORT_SPRINT_16_LYNKI.md](RAPPORT_SPRINT_16_LYNKI.md) v1.0  

---

## 1. Résumé exécutif

Le Sprint 17 **poursuit l’objectif « lecture expliquée »** de la Synthèse comptable : **deux graphiques utiles** (évolution + répartition) adossés aux **rubriques compte de résultat** déjà exposées, un **bloc preuve / intégrité V1**, et un **bloc Diva renforcé** (sources, périmètre, horodatage, mode dégradé sans trou UI), le tout **sans refonte design system** et en **respectant la hiérarchie Sprint 15–16** (bloc confiance → KPI → lecture expliquée → détail).

**Gate D — Synthèse expliquée visuellement :** **close complète** sur le **critère graphiques** (line + donut livrés avec fiches §3.5 documentées §4 ci-dessous) ; critères Diva, preuve, polish et non-régression S16 **OK** sous réserve de **recette MOA** sur libellés et pertinence métier des séries.

---

## 2. Tickets livrés

| # | Titre | Statut |
|---|-------|--------|
| T93 | Line chart Synthèse (évolution CdR par mois) | Livré |
| T94 | Donut Synthèse (répartition rubriques CdR) | Livré |
| T95 | Bloc Diva renforcé + dégradé honnête | Livré |
| T96 | Bloc preuve / intégrité V1 | Livré |
| T97 | Polish intermédiaire (intégration section, grille, pas de DS global) | Livré |
| T98 | Clôture, Gate D, rapport, backlog | Livré (présent document) |

---

## 3. Gate D — Synthèse expliquée visuellement

### 3.1 Critère graphiques — **close complète**

**Formulation canonique** ([plan §4](PLAN_SPRINT_17_LYNKI.md)) : *deux graphiques livrés proprement, chacun avec fiche §3.5 validée* ⇒ Gate **close complètement** sur le critère graphiques.

| Graphique | Statut | Fiche §3.5 (résumé) |
|-----------|--------|---------------------|
| **Line (T93)** | **Livré** | **Nom métier :** évolution du résultat (somme des montants des rubriques du compte de résultat par mois calendaire). **Source :** `GET /api/accounting/income-statement/rubrics` (une requête par mois dans la période filtrée). **Période / filtres :** `date_debut` / `date_fin` du mois, `tenant`, `company_ids` comme le reste de la Synthèse. **Interprétation autorisée :** « Ce graphique montre la somme des rubriques CdR pour chaque mois inclus dans la période (indicatif, pas norme comptable). » **Limites :** données `complete` / `stub` héritées du Vault ; badge **Partiel** si un mois est incomplet ou en erreur HTTP. |
| **Donut (T94)** | **Livré** | **Nom métier :** répartition des rubriques CdR (poids des principales rubriques). **Source :** `GET /api/accounting/income-statement/rubrics` sur la **période complète**. **Interprétation :** parts basées sur **\|montant\|** pour la lisibilité ; légende textuelle avec **montant signé**. **Limites :** top 5 + **Autres** ; catégorisation « Autres » = rubriques hors top 5 par magnitude. |

**Conclusion (critère graphiques) :** **Close complète** — les deux graphiques sont livrés avec séries et sources explicites, sans chart décoratif.

### 3.2 Autres critères Gate D

| Critère | Statut | Forme cible vs minimale |
|---------|--------|-------------------------|
| Bloc Diva (T95) | OK | **Forme cible :** sources, périmètre, horodatage complet, hash faits en pied ; chargement / erreur / **no_data** avec bloc présent (§3.3.1). Actions : rafraîchir + téléchargement rapport lorsque l’insight est prêt. |
| Bloc preuve (T96) | OK — **minimum §3.4.1** | Cohérence BG ↔ CdR (`complete` + `data_source`), horodatage, statut de preuve ; **hash** : ligne explicite « non exposé » sur ces API (pas de badge certifié cosmétique). |
| Polish (T97) | OK | Section dédiée, grille `xl:grid-cols-2`, pas de refonte tokens / `globals.css` structurelle. |
| Non-régression S16 (plan §2.1) | OK (smoke build + ordre UI) | Ordre conservé : breadcrumb → bloc confiance → KPI → **nouvelle bande** (charts, preuve, Diva) → BG → rubriques… **Recette terrain** recommandée sur « premier dans l’ordre de lecture » pour le bloc confiance. |

### 3.3 Conclusion Gate D (sprint)

**Gate D (Sprint 17) — close** sur le périmètre doc/code réalisé : graphiques **complets**, Diva et preuve **conformes aux règles de prudence**, polish **borné**. La **recette MOA** peut affiner libellés ou arbitrer une autre série métier en Sprint 18+ **sans** remettre en cause la structure livrée.

---

## 4. Détail technique

### 4.1 Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `components/AccountingSummaryTrendChart.tsx` | **Nouveau** — line chart (T93), Recharts |
| `components/AccountingSummaryBreakdownChart.tsx` | **Nouveau** — donut (T94), Recharts |
| `components/AccountingSummaryProofBlock.tsx` | **Nouveau** — preuve V1 (T96) |
| `components/AccountingSummaryView.tsx` | Section « Lecture expliquée », ordre §3.6 (grille line \| donut), preuve, Diva avant BG |
| `components/AccountingInsightBlock.tsx` | T95 — dégradés, sources, horodatage, hash |

### 4.2 Co-placement (plan §3.6)

Les deux charts sont dans une **même section** avec grille responsive : **line à gauche / donut à droite** en `xl`, **pile** en mobile — pas deux blocs pleine largeur concurrents.

### 4.3 Dépendances

- **recharts** (déjà en `package.json`).
- Aucune nouvelle route API obligatoire : réutilisation des proxies comptables existants.

---

## 5. Builds et déploiement

- **Linky :** `npx next build` — **OK** (clôture code S17).
- **Image Docker :** `dorevia/linky:sprint17-2026-03-22` (build depuis `units/dorevia-linky/`).
- **Compose :** tag `sprint17-2026-03-22` dans les `docker-compose.yml` Linky des tenants **lab / stinger / generic** (`sarl-la-platine`, `laplatine2026`, `o19`, `linky-generic`) ; `docker compose up -d` exécuté pour recréer les conteneurs *(mars 2026)*.

---

## 6. Suite logique

1. **Recette MOA** sur la lisibilité des graphiques (série line = somme rubriques mensuelle ; donut = magnitude) et sur le bloc preuve.
2. **Sprint 18** — cohérence visuelle mature Synthèse, DS V2 local, maquette adaptée ([PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) v1.0, [EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1, [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) v0.3, annexe [`ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html`](ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html)).
3. **Contrat v0.3** / atelier Esther — hors périmètre S17.

---

## 7. Historique des versions

| Version | Date | Changement |
|---------|------|------------|
| 0.1 | 2026-03 | Squelette Gate D + T93–T98. |
| 1.0 | 2026-03 | Clôture sprint : livrables code, Gate D, fiches §3.5, backlog. |
| 1.1 | 2026-03 | Déploiement : image `sprint17-2026-03-22`, compose tenants, `compose up -d`. |
| 1.2 | 2026-03 | Suite logique §6 : lien explicite vers [PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) v0.1. |
| 1.3 | 2026-03 | Suite logique §6 : alignement gel S18 — plan v1.0, tickets exécution v1.0, REFERENCE_UI v0.1. |
| 1.4 | 2026-03 | Suite logique §6 : tickets S18 **v1.1**, REFERENCE_UI **v0.2** (matrice T99 §5.1). |
| 1.5 | 2026-03 | Suite logique §6 : REFERENCE_UI **v0.3**, annexe HTML maquette Synthèse versionnée. |

---

*Rapport Sprint 17 — mars 2026.*
