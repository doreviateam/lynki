# Audit court — V1.4-2 `/flux-net`

**Date** : 24 mars 2026  
**Entrée** : `units/dorevia-linky/app/(cockpit)/flux-net/page.tsx` + chaîne réelle (`useDashboardData`, `GET /api/dashboard-metrics`, mode instruments éventuel).  
**Référence backlog** : [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md) (V1.4-2).

---

## 1. Surface actuelle

| Élément | État |
|--------|------|
| **TopBar** | Identique aux autres pages détail : titre générique *« Lynki Desktop Cockpit »* + score de confiance (pas de header métier + périmètre comme `/encours` V1.4-1). |
| **Fil d’Ariane** | Présent : Pilotage → *« Détail : Flux Net »*. Pas de **H1** dédié ni bloc « source / limites » structuré comme la passe 1 Encours. |
| **KPI principal** | Carte *« Flux net de trésorerie »* : `dashboardMetrics.cash` (`formatted`, `status_reason`, `ConfidenceScore`). Skeleton si `metricsLoading`. |
| **Encaissements / décaissements / net (détail)** | Bloc *« Mouvements de trésorerie »* : si `_details.cash` présent, grille 3 colonnes **Encaissements**, **Décaissements**, **Flux net** (`encaissements`, `decaissements`, `net`). Badge **PROXY DATA** en dur dans l’UI. |
| **Sans `_details.cash`** | Encadré pointillés : *« Décomposition non disponible pour cette période. »* |
| **Bloc « Lecture de la donnée »** | Texte **statique** : flux net = encaissements − décaissements, *« mouvements bancaires rapprochés »* ; encadré bleu *« Donnée proxy… »* ; message additionnel si pas de `details` et pas en chargement. |
| **Sans `cashKpi` exploitable** (après chargement) | État vide : *« Flux net non disponible »* + mention Vault. |
| **Chargement** | Skeletons sur KPI et sur le bloc mouvements. |
| **`metricsError`** | **Non utilisé** : pas d’écran d’erreur réseau ni bouton réessai (même écart qu’avant correction `/encours`). |
| **Période / société / tenant** | **Non affichés** sur la page (alors que le hook les porte). |
| **Graphique / série temporelle** | **Aucun** sur cette page (cohérent avec une passe 1 sobre). |

**Conclusion** : la page **n’est pas un simple placeholder** : elle affiche déjà **KPI cash + décomposition encaissements / décaissements / net** lorsque `_details.cash` est fourni. Elle reste en revanche une **coquille « pré-V1.4 »** : pas de périmètre explicite, pas d’erreur réseau, vocabulaire et badge **PROXY** à **recadrer** pour éviter toute promesse de *cash-flow comptable complet* ou de formulation non alignée sur la source réelle (voir §2).

---

## 2. Données tenues (chaîne réelle)

| Source | Rôle |
|--------|------|
| **`useDashboardData`** | Même fetch que le reste du cockpit : **`/api/dashboard-metrics`** par défaut, ou **`/api/instruments`** si `NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE=1` (adaptation `adaptInstrumentsToDashboard`). |
| **`GET /api/dashboard-metrics`** | Agrège notamment **paiements entrants / sortants** (totaux scellés / stricts selon la route) ; construit `_details.cash` : `{ encaissements: inTotal, decaissements: outTotal, net: cashNet, currency }` avec **`cashNet = inTotal - outTotal`** (commentaire route : aligné avec la vue détail Flux net). |
| **KPI `cash` (tuile)** | Valeur **`cash.value`** peut être **normalisée** (`cashValueNormalized`) : cas de **devise cash ≠ devise trésorerie**, ou **garde-fou** avec `payments_completeness` — voir `route.ts` (~L929–L943). **Conséquence honnête** : le **nombre affiché dans le KPI principal** peut **ne pas être strictement égal** au `net` du bloc détail dans certains cas de bord ; une passe 1 crédible doit **l’expliciter** ou **réconcilier l’affichage** sans mentir. |
| **Mode instruments** | `adaptInstrumentsToDashboard` fournit un **`cash`** KPI minimal **sans** peupler `_details.cash` → la page tombe vite en *« décomposition non disponible »* alors qu’un **flux net formaté** peut exister : état **partiel** à traiter explicitement. |

| Question | Réponse |
|----------|---------|
| **KPI flux net** | **Oui** : métrique `dashboardMetrics.cash`. |
| **Encaissements / décaissements séparés** | **Oui** si `_details.cash` présent (réponse dashboard-metrics complète). |
| **Série / tendance** | **Non** sur cette page ; pas dans `_details.cash` tel quel. Un graphique serait un **autre fetch** (ex. `treasury-evolution`) ou évolution dédiée — **hors scope** passe 1 sans décision explicite. |
| **Proxy / limites** | La route encode déjà des **garde-fous** (scellé, cohérence trésorerie, complétude paiements). Le texte actuel parle de *« rapproché »* / *proxy* : à **vérifier** contre les intitulés métier réels des agrégations **payments-in / payments-out** pour ne pas **sur-interpréter**. |

---

## 3. Segmentation honnête possible (passe 1)

| Bloc | Faisabilité |
|------|-------------|
| **Flux net** | KPI `cash` +, en cohérence, **`net`** issu de `_details.cash` quand disponible ; **note** si écart KPI vs détail possible (§2). |
| **Encaissements** | ` _details.cash.encaissements`. |
| **Décaissements** | `_details.cash.decaissements`. |
| **Lecture pilotage vs compta exhaustive** | **Recommandé** : paragraphe court **sans** promettre un **tableau de flux de trésorerie IFRS** ni une **image complète** des mouvements hors périmètre scellé. |
| **Sous-analytique** (catégories, nature des flux, TVA mélangée, etc.) | **Non** sans champs supplémentaires ou API dédiée — **hors première passe crédible** implicite. |

---

## 4. Écart à la structure cible (passe 1 recommandée)

| Bloc cible | Écart |
|------------|--------|
| **Fil d’Ariane + titre** | Fil présent ; manque **titre page** clair + **phrase source / limites** (comme `/encours`). |
| **Ligne de périmètre** | **Absent** : période, société, tenant. |
| **Erreur explicite** | **`metricsError`** non branché ; pas de **`handleRefreshMetrics`**. |
| **États homogènes** | Chargement / vide partiels ; manque **indisponible réseau**, **partiel** structuré (KPI sans `_details`, mode instruments), alignement possible avec une **grammaire cockpit** (comme `cockpitEncoursStates`, nommé pour flux). |
| **Trio flux net / encaissements / décaissements** | **Déjà là** sous forme d’une grille 3 colonnes dans un seul grand bloc ; la cible peut **scinder en KPI principal + 2 cartes secondaires** pour la lisibilité **sans changer la donnée**. |
| **Note limites / warnings** | Texte statique + badge **PROXY DATA** ; à remplacer par une **formulation produit** calibrée (et **warnings** si un jour exposés côté API — aujourd’hui pas de `meta` dédié sur `cash` dans `CardDetails`). |

---

## 5. Verdict — première version crédible (sans faux signal ni backend implicite)

> **On peut livrer une passe 1 crédible en réutilisant uniquement `dashboard-metrics` + `useDashboardData` : périmètre en tête, erreur réseau, états loading / vide / partiel / indisponible, KPI flux net + deux cartes encaissements / décaissements (ou équivalent visuel strictement fidèle aux champs), et un encadré « lecture pilotage » qui évite toute équivalence implicite avec un cash-flow comptable exhaustif. Traiter explicitement l’écart possible KPI `cash.value` vs `_details.cash.net` et le cas mode instruments sans `_details`.**

**Hors scope tacite passe 1** : graphique d’évolution, drill-down par compte, ou promesse analytique fine **sans** nouvelle donnée ou endpoint **décisionné**.

---

*Audit rédigé pour figer le cadrage V1.4-2 et implémenter dans la foulée une première salve alignée sur `/encours`.*

---

## 6. Implémentation passe 1 (24/03/2026)

Livrée dans le dépôt : `app/(cockpit)/flux-net/page.tsx` + `components/cockpit-detail/cockpitFluxNetStates.tsx` (voir journal [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md) § V1.4-2). Le badge **PROXY DATA** et le texte fixe « mouvements bancaires rapprochés » de l’ancienne page sont retirés au profit d’une formulation **pilotage / non-IFRS** et des états partiels décrits au §5.
