# SPEC — DOREVIA Linky "Icon Status Badge" v1.0

**Date :** 2026-02-20
**Périmètre :** Cartes KPI du cockpit Linky
**Type :** UI + logique de statut déterministe
**Objectif :** Fournir un verdict visuel immédiat par carte KPI
via un badge de statut intégré à l'icône.
**Principe :** Règles déterministes. Pas d'IA. Pas d'ambiguïté.
Lisibilité dirigeant / DAF.

------------------------------------------------------------------------

## 1. OBJECTIF

Cette spécification définit le système de statut déterministe affiché
directement sur les icônes des cartes KPI dans le cockpit DOREVIA Linky.

L'objectif est de permettre à un décideur de comprendre la santé
structurelle de l'entreprise **en moins de 2 secondes**.

Le badge n'est pas décoratif. C'est un mécanisme de gouvernance.

------------------------------------------------------------------------

## 2. MODÈLE DE STATUT

Chaque carte KPI expose deux champs supplémentaires :

- `status ∈ { neutral, ok, watch, alert }`
- `status_reason` (chaîne explicative courte, en français)

### 2.1 Sémantique des statuts

| Statut    | Couleur         | Hex       | Signification                                    |
|-----------|-----------------|-----------|--------------------------------------------------|
| `neutral` | Bleu            | `#60a5fa` | Pas de jugement / Non applicable / Donnée absente |
| `ok`      | Vert            | `#22c55e` | Structurellement conforme                         |
| `watch`   | **Orange**      | `#f97316` | Seuil franchi / Gouvernance non conforme          |
| `alert`   | **Rouge**       | `#ef4444` | **Réservé v1** — Continuité d'exploitation menacée |

> **Principe directeur (amendement post-implémentation) :**
> - Orange (`watch`) = tous les dépassements de seuil en v1
> - Rouge (`alert`) = réservé pour risques systémiques :
>   trésorerie nette négative, incohérence comptable détectée,
>   écart POS majeur, ratio remboursement > 10 %
>
> Aucune règle n'émet `alert` en v1.

### 2.2 Exclusivité

Un seul statut par carte. La priorité de résolution suit l'ordre :
`alert > watch > ok > neutral`. La première règle vérifiée l'emporte.

------------------------------------------------------------------------

## 3. SPÉCIFICATION UX

### 3.1 Rendu visuel — Encadrement de l'icône

- **Encadrement coloré** du conteneur d'icône (64×64 px, `rounded-lg`)
- Bordure : `1.5px solid` de la couleur du statut
- Fond : teinte légère (12 % d'opacité) de la couleur du statut
- Pas d'animation, pas de pulsation
- Styles appliqués en **inline** (pas de classes Tailwind dynamiques)
  pour éviter le purging CSS lors du build Docker

Le conteneur d'icône dans `IconGrid.tsx` :

```
div.h-16.w-16.rounded-lg
  style: border 1.5px solid {STATUS_COLORS[status]}
  style: backgroundColor {STATUS_BG[status]}
```

### 3.2 Tooltip

Au survol, afficher `status_reason` :

| Statut    | Exemple de tooltip                               |
|-----------|--------------------------------------------------|
| `neutral` | "Donnée non disponible"                          |
| `ok`      | "Trésorerie validée à 92 %"                     |
| `watch`   | "Cash non validé (trésorerie à 65 %)"           |
| `alert`   | "Trésorerie validée à 0 % malgré cash > 0"      |

------------------------------------------------------------------------

## 4. RÈGLES DE STATUT DÉTERMINISTES (V1)

### 4.1 Trésorerie validée (KPI maître)

**Entrée :** `treasury_validated_pct`

| Condition                         | Statut    | Raison                                 |
|-----------------------------------|-----------|----------------------------------------|
| valeur nulle / absente            | `neutral` | "Donnée non disponible"               |
| `== 0 %`                         | `watch`   | "Trésorerie non validée (0 %)"        |
| `< 50 %`                         | `watch`   | "Trésorerie faiblement validée ({v} %)" |
| `≥ 50 %` et `< 80 %`            | `watch`   | "Trésorerie partiellement validée ({v} %)" |
| `≥ 80 %`                         | `ok`      | "Trésorerie validée à {v} %"          |

> Ce KPI gouverne la fiabilité structurelle. Plusieurs autres cartes
> en dépendent (cf. §4.2, §4.4, §5).

### 4.2 Cash

**Entrées :** `cash`, `treasury_validated_pct`

| Condition                                       | Statut    | Raison                                 |
|-------------------------------------------------|-----------|----------------------------------------|
| cash absent / nul                               | `neutral` | "Pas de donnée cash"                  |
| `cash == 0`                                     | `neutral` | "Pas d'activité cash"                 |
| trésorerie absente                              | `neutral` | "Trésorerie non disponible"           |
| `treasury_validated_pct < 50`                   | `watch`   | "Cash non validé (trésorerie insuffisante)" |
| `50 ≤ treasury_validated_pct < 80`              | `watch`   | "Cash partiellement validé"            |
| `treasury_validated_pct ≥ 80`                   | `ok`      | "Cash validé"                          |

> Le cash sans validation n'est pas fiable. Le statut reflète la
> confiance dans la donnée, pas son montant.

### 4.3 Business

**Entrées :** `business`, `totalCA` (= business + pos_shops)

| Condition                                       | Statut    | Raison                                 |
|-------------------------------------------------|-----------|----------------------------------------|
| business absent                                 | `neutral` | "Pas de donnée facturation"           |
| `business == 0` ET `totalCA > 0`                | `neutral` | "CA exclusivement POS"                |
| `business == 0` ET `totalCA == 0`               | `watch`   | "Aucune activité commerciale"          |
| `business > 0`                                  | `ok`      | "Facturation active"                   |

> V1 ne juge pas les tendances de performance.
> L'état `neutral` quand POS-only évite une fausse alerte sur les
> entreprises dont le CA provient exclusivement des points de vente
> (cas Sweet Manihot).

### 4.4 Taxes

**Entrées :** `taxes`, `treasury_validated_pct`

| Condition                                       | Statut    | Raison                                 |
|-------------------------------------------------|-----------|----------------------------------------|
| `taxes == 0` ou absent                          | `neutral` | "Pas de charge fiscale"                |
| `taxes > 0` ET `treasury_validated_pct < 80`    | `watch`   | "Poids fiscal à surveiller (tréso < 80 %)" |
| `taxes > 0` ET `treasury_validated_pct ≥ 80`    | `ok`      | "Charges fiscales couvertes"           |
| trésorerie absente                              | `neutral` | "Trésorerie non disponible"            |

### 4.5 Notes de crédit

**Entrée :** `credit_notes`

| Condition        | Statut    | Raison                                       |
|------------------|-----------|----------------------------------------------|
| `== 0` ou absent | `neutral` | "Aucune note de crédit"                      |
| `> 0`            | `watch`   | "Notes de crédit présentes ({v} €)"          |

> **Amendement v1 :** la spec originale mentionnait une alerte sur
> dépassement de seuil sans le définir. En v1, toute note de crédit
> non nulle mérite attention (`watch`). Un seuil ratio/CA pourra être
> ajouté en v1.1 quand les données historiques permettront de calibrer.

### 4.6 Remboursements

**Entrées :** `refunds`, `totalCA`

| Condition                     | Statut    | Raison                                      |
|-------------------------------|-----------|---------------------------------------------|
| `== 0` ou absent              | `neutral` | "Aucun remboursement"                       |
| `totalCA == 0` ET `refunds > 0` | `watch` | "Remboursements sans CA de référence"       |
| ratio < 2 % du CA            | `ok`      | "Remboursements marginaux ({ratio} %)"      |
| ratio ≥ 2 % et < 5 % du CA  | `watch`   | "Remboursements à surveiller ({ratio} %)"   |
| ratio ≥ 5 % du CA            | `watch`   | "Remboursements élevés ({ratio} % du CA)"   |

> **Amendement v1 :** la spec originale fixait l'alerte à 1 % du CA,
> ce qui est trop agressif pour le retail/POS (1–3 % est courant).
> Seuils relevés : ok < 2 %, watch 2–5 %, watch ≥ 5 %.
> Le niveau `alert` (rouge) pour ratio > 10 % sera activé ultérieurement.
> Formule : `ratio = abs(refunds) / totalCA × 100`.

### 4.7 Points de vente (POS)

**Entrées :** `total_sessions`, `pending_sessions`, `anomaly_sessions`,
`total_difference`

| Condition                                           | Statut    | Raison                                   |
|-----------------------------------------------------|-----------|------------------------------------------|
| `total_sessions == 0` ou absent                     | `neutral` | "Pas de session POS"                    |
| `anomaly_sessions > 0`                              | `watch`   | "{n} session(s) en anomalie"            |
| `pending_sessions > 0`                              | `watch`   | "{n} session(s) non scellée(s)"         |
| `abs(total_difference) > 1` (€)                     | `watch`   | "Écart de caisse : {v} €"              |
| sessions > 0 ET aucune condition ci-dessus           | `ok`      | "POS conforme ({n} sessions scellées)"  |

> **Amendement v1 :** ajout d'une tolérance de 1 € sur
> `total_difference` pour ignorer les écarts d'arrondi.
> Le POS représente l'intégrité d'exécution commerciale.

### 4.8 Z de caisse

**Entrée :** `pos_z`

| Condition          | Statut    | Raison                               |
|--------------------|-----------|--------------------------------------|
| null / absent      | `neutral` | "Z de caisse non renseigné"         |
| présent            | `neutral` | "Z de caisse présent (règles v1.1)" |

> **Amendement v1 :** la spec originale définissait des règles
> "coherent / incomplete / inconsistency" sans critères mesurables.
> En l'état, les données Z ne sont pas encore disponibles dans le
> pipeline (affichage "—" sur le dashboard). V1 se limite à `neutral`.
> Les règles de cohérence Z vs POS seront définies en v1.1 quand
> la donnée sera exploitable.

------------------------------------------------------------------------

## 5. RÈGLE DE COHÉRENCE GLOBALE

**Si `treasury_validated_pct == 0` :**

Aucune carte ne peut afficher `ok`, à l'exception du POS
(dont la conformité est indépendante de la validation trésorerie).

Toute carte qui serait `ok` est rétrogradée en `watch` avec la raison
suffixée de " (trésorerie non validée)".

> **Amendement v1 :** promue de "optionnelle v1.1" à **obligatoire v1**.
> Cette règle est triviale à implémenter (une boucle post-calcul) et
> critique pour éviter une fausse confiance visuelle. Coût : ~5 lignes.

------------------------------------------------------------------------

## 6. CONTRAT DE DONNÉES

### 6.1 Structure de réponse par carte

Extension de l'interface `KpiMetric` existante dans
`dashboard-metrics/route.ts` :

```typescript
export interface KpiMetric {
  value: number | null;
  formatted: string;
  valueKind: ValueKind;
  status: "neutral" | "ok" | "watch" | "alert";     // NOUVEAU
  status_reason: string;                              // NOUVEAU (FR)
}
```

### 6.2 Exemple JSON

```json
{
  "treasury_validated_pct": {
    "value": 0,
    "formatted": "0 %",
    "valueKind": "accent",
    "status": "alert",
    "status_reason": "Trésorerie validée à 0 %"
  },
  "cash": {
    "value": 1434786.21,
    "formatted": "+ 1 434 786,21 €",
    "valueKind": "positive",
    "status": "alert",
    "status_reason": "Cash non validé (1 434 786 € sans validation)"
  },
  "pos_shops": {
    "value": 4213.20,
    "formatted": "4 213,20 €",
    "valueKind": "accent",
    "status": "ok",
    "status_reason": "POS conforme (12 sessions scellées)"
  }
}
```

------------------------------------------------------------------------

## 7. ARCHITECTURE D'IMPLÉMENTATION

### 7.1 Côté serveur (Linky)

| Fichier | Modification |
|---------|-------------|
| `app/api/dashboard-metrics/route.ts` | Ajouter `computeCardStatus()` après le calcul des métriques. La fonction reçoit toutes les métriques + `_details` et retourne `status` + `status_reason` par carte. |
| `app/api/dashboard-metrics/route.ts` | Appliquer la règle de cohérence globale (§5) en post-traitement. |

**Pas de logique de statut dans le frontend.** La gouvernance doit
être calculée côté serveur pour garantir la cohérence entre le cockpit,
les exports, et les appels API DIVA.

### 7.2 Côté frontend (Linky)

| Fichier | Modification |
|---------|-------------|
| `components/IconGrid.tsx` | Ajouter un `<span>` pastille positionnée en absolu sur le conteneur d'icône (16×16 → `relative`). |
| `components/IconGrid.tsx` | Mapper `status` → classe CSS couleur. Ajouter `title={status_reason}` pour le tooltip. |
| `app/globals.css` | Ajouter les variables CSS `--status-ok`, `--status-watch`, `--status-alert`, `--status-neutral`. |

### 7.3 Intégration DIVA (v1.5)

Le badge se calcule indépendamment de DIVA (données brutes uniquement).
Depuis DIVA v1.5, les statuts sont **transmis à DIVA** et exploités :

- `models.Card` étendu avec `Status` + `StatusReason`
- Le runner capture `status`/`status_reason` depuis Linky
- `computeInsights` génère un insight `GOUVERNANCE — points d'attention`
- `buildUserPrompt` inclut `status` et `status_reason` par carte
- `systemPrompt` Rule 11 : Mistral priorise les cartes `watch`/`alert`
- Hash v3 : un changement de statut déclenche une régénération

L'IA et les badges visuels racontent la même histoire.

------------------------------------------------------------------------

## 8. TESTS (DEFINITION OF DONE)

### 8.1 Tests unitaires requis (serveur)

| Test | Assertion |
|------|-----------|
| Treasury seuils 0 / 49 / 50 / 79 / 80 / 100 | Statuts corrects aux bornes |
| Cash dépendant de treasury | `alert` si treasury=0 et cash>0 |
| Business POS-only | `neutral` si business=0 mais totalCA>0 |
| POS anomalie ou pending | `alert` si anomaly_sessions>0 |
| POS écart arrondi | `ok` si total_difference=0.50 (< 1 €) |
| POS Z null | `neutral` |
| Remboursements seuils | ok/watch/alert aux bornes 2 %/5 % |
| Cohérence globale | Aucun `ok` (sauf POS) si treasury=0 |

### 8.2 Tests visuels (frontend)

- Les 4 couleurs de badge sont visibles sur fond sombre
- Le tooltip s'affiche au survol avec la raison en français
- Le badge ne décale pas la mise en page de la grille

------------------------------------------------------------------------

## 9. INTENTION STRATÉGIQUE

Ce système transforme Linky de :

> Un tableau de bord financier

en :

> Un **tableau de santé structurelle**.

Le badge n'est pas décoratif. C'est un **signal de gouvernance**.

------------------------------------------------------------------------

## ANNEXE A — Registre des amendements

| Section | Spec originale | Amendement | Justification |
|---------|----------------|------------|---------------|
| §2.1 Sémantique | `watch` = jaune, `alert` = rouge (seuil franchi) | `watch` = **orange** (seuil franchi), `alert` = **rouge réservé** (continuité d'exploitation) | Hiérarchie sémantique : orange = gouvernance, rouge = risque systémique |
| §4.1 Trésorerie | `< 50 %` → `alert` | `< 80 %` → `watch` (unifié) | Trésorerie non validée = point d'attention, pas risque systémique |
| §4.2 Cash | `tPct == 0` → `alert` | `tPct < 50` → `watch` | Cash non validé est un point de gouvernance, pas une rupture |
| §4.4 Taxes | `tPct < 50` → `alert` | `tPct < 80` → `watch` (unifié) | Cohérent avec la hiérarchie trésorerie |
| §4.5 Notes de crédit | Alerte sur "threshold exceeded" (indéfini) | `watch` uniquement en v1 | Seuil non calibrable sans historique |
| §4.6 Remboursements | Alerte à 1 % du CA | ok < 2 %, watch 2–5 %, watch ≥ 5 % | 1 % trop agressif ; `alert` réservé pour > 10 % |
| §4.7 POS | `total_difference != 0` → `alert` | Tolérance 1 € + `watch` (pas `alert`) | Écarts d'arrondi + cohérence hiérarchie |
| §4.8 Z de caisse | Règles "coherent/incomplete" | `neutral` uniquement en v1 | Donnée non disponible dans le pipeline |
| §5 Cohérence globale | Optionnelle v1.1 | **Obligatoire v1** | Triviale, critique contre fausse confiance |
| §6 Contrat données | Champ JSON générique | Aligné sur `KpiMetric` existant | Compatibilité avec l'API en place |
| §7 Architecture | "Server-side recommended" | Emplacement exact spécifié | Traçabilité implémentation |
| UX Visuel | Pastille circulaire (badge dot) | **Encadrement coloré** de l'icône (bordure 1.5px + fond teinté) | Plus lisible, plus élégant, meilleure hiérarchie visuelle |

------------------------------------------------------------------------

# FIN DE SPEC v1.0 (FR, amendée)
