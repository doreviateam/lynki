# SPECIFICATION UI LINKY v3 — BUILD READY

**Document** : `SPEC_UI_LINKY_v3_BUILD_READY.md`  
**Version** : 1.1  
**Date** : 13 mars 2026  
**Produit** : Dorevia Linky  
**Référence** : `SPEC_UI_LINKY_v2_composant_par_composant.md` (v1.2 figée)

**Statut** : Spécification d’implémentation — tokens, variantes, états, structure React et règles Tailwind pour la refonte visuelle Linky v2.

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 13 mars 2026 | Version initiale build-ready |
| 1.1 | 13 mars 2026 | Contrat TypeScript tuiles, hauteurs min, tabular-nums, convention 0/—, helper variantes, motion, tableau récap CardId |

---

## 1. Objet

Ce document prolonge la spec UI/UX Linky v2 (vision, principes, architecture). Il fournit une couche **implémentation-ready** :

- **Tokens** : variables CSS et mapping Tailwind
- **Tailles et espacements** : valeurs numériques par composant
- **Variantes** : classes A/B/C, états (chargé, chargement, erreur, partiel)
- **Props d’état** : interface TypeScript attendue par composant
- **Grille responsive** : breakpoints et colonnes
- **Structure React** : composants, hiérarchie, props

Public cible : développeurs front, intégrateurs design system.

---

## 2. Design tokens

### 2.1 Tokens existants (globals.css)

À conserver tels quels pour la refonte. Base dark cockpit.

| Token | Valeur | Usage |
|-------|--------|--------|
| `--bg` | `#0F1B2D` | Fond principal |
| `--bg-secondary` | `#14243A` | Fond secondaire |
| `--surface` / `--card` | `#1A2E47` | Cartes, tuiles |
| `--border` | `#223B5B` | Bordures |
| `--text` | `#E6EEF8` | Texte principal |
| `--text-secondary` | `#9FB3C8` | Labels, métadonnées |
| `--hover` | `#1F3653` | Survol |
| `--accent` | `#3B82F6` | Focus, liens, accent |
| `--accent-soft` | `rgba(59,130,246,0.15)` | Fond accent discret |
| `--positive` | `#22C55E` | Valeur favorable, statut ok |
| `--warning` | `#F59E0B` | Vigilance, watch |
| `--negative` | `#EF4444` | Erreur système uniquement |
| `--shadow-card` | `0 4px 6px -1px rgb(0 0 0 / 0.2)` | Ombre carte |
| `--radius-xl` / `--radius-card` | `0.75rem` | Rayon carte/tuile |

### 2.2 Tokens à ajouter pour la hiérarchie A/B/C

| Token | Valeur | Usage |
|-------|--------|--------|
| `--tile-a-border` | `1.5px solid var(--accent)` | Contour tuile Classe A |
| `--tile-a-value-size` | `1.25rem` | Taille valeur tuile A (20px) |
| `--tile-b-value-size` | `1.125rem` | Taille valeur tuile B (18px) |
| `--tile-c-value-size` | `1rem` | Taille valeur tuile C (16px) |
| `--tile-a-padding` | `1.25rem` | Padding tuile A (p-5) |
| `--tile-b-padding` | `1rem` | Padding tuile B (p-4) |
| `--tile-c-padding` | `0.75rem` | Padding tuile C (p-3) |
| `--tile-a-min-h` | `148px` | Hauteur minimale tuile A |
| `--tile-b-min-h` | `132px` | Hauteur minimale tuile B |
| `--tile-c-min-h` | `116px` | Hauteur minimale tuile C |

### 2.3 Typographie numérique — tabular-nums

**Règle globale** : toute valeur KPI (tuiles, cartes détaillées, insight chiffré, barre de confiance si valeurs) doit utiliser `tabular-nums` pour un alignement visuel stable et une lecture précise.

- Tuiles KPI : `tabular-nums` sur l’élément valeur.
- Cartes détaillées : `tabular-nums` sur la zone valeur principale.
- Insight : idem si montants affichés.
- Trust bar : idem pour P95 ms, compteurs, etc.

### 2.4 Mapping Tailwind recommandé

Utiliser les variables CSS dans les classes pour garder une seule source de vérité.

```css
/* Exemple extension globals.css */
.tile-kpi-a {
  border: var(--tile-a-border);
  padding: var(--tile-a-padding);
}
.tile-kpi-a .tile-value { font-size: var(--tile-a-value-size); }
```

En Tailwind inline (équivalent actuel) :

- Fond carte : `bg-[var(--card)]`
- Bordure : `border border-[var(--border)]`
- Texte : `text-[var(--text)]`, `text-[var(--text-secondary)]`
- Valeur positive : `text-[var(--positive)]`
- Valeur vigilance : `text-[var(--warning)]`
- Focus : `focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]`

### 2.5 Contrat TypeScript — tuiles KPI

Socle partagé pour éviter que chaque composant reconstruise sa propre logique. À centraliser (ex. `@/app/types/linky-tiles` ou module dédié).

```ts
type TilePriority = "A" | "B" | "C";
type TileStatus = "ready" | "loading" | "partial" | "unavailable" | "error" | "empty";
type ValueKind = "positive" | "warning" | "accent" | "neutral" | "placeholder";

// CardId = union des identifiants (treasury | treasury_position | business | …)
type CardId = string; // à aligner avec IconGrid.CardId

interface KpiTileViewModel {
  id: CardId;
  label: string;
  priority: TilePriority;
  status: TileStatus;
  valueKind: ValueKind;
  formattedValue: string;
  meta?: string;
  disabled?: boolean;
}
```

Le mapping `DashboardMetricsResponse` → `KpiTileViewModel` (ou dérivation par `CardId`) doit être fait une fois côté data, puis les composants consomment `KpiTileViewModel`.

---

## 3. Breakpoints et grille responsive

### 3.1 Breakpoints (alignés Tailwind)

| Nom | Min-width | Usage |
|-----|-----------|--------|
| `sm` | 640px | Grille 2→3 colonnes tuiles |
| `md` | 768px | Grille 3→4 colonnes, cartes détaillées |
| `lg` | 1024px | Laptop, grille 4 colonnes stable |
| `xl` | 1280px | Desktop large, référence |

### 3.2 Grille tuiles KPI (IconGrid)

| Breakpoint | Colonnes | Classe Tailwind |
|------------|----------|------------------|
| défaut | 2 | `grid-cols-2` |
| sm | 3 | `sm:grid-cols-3` |
| md et plus | 4 | `md:grid-cols-4` |

Container : `grid w-full gap-3` (ou `gap-4` si souhaité). Pas de `max-w` sur la grille elle-même ; le conteneur parent gère la largeur.

### 3.3 Marges horizontales page

- Mobile : `px-4` (1rem)
- md et plus : `px-6` ou `px-8`
- Max-width contenu optionnel : `max-w-7xl mx-auto`

---

## 4. Strate 1 — Barre de contexte (header)

### 4.1 Composant

`ReportHeader` (ou module header dédié dans le layout).

### 4.2 Structure cible

```
[ Logo DOREVIA Linky ] [ Baseline ] [ Badge tenant ] … [ Menu ]
```

### 4.3 Tokens / styles

- Hauteur : `h-14` ou `h-16` (56–64px), stable.
- Fond : `bg-[var(--bg-secondary)]` ou `bg-[var(--surface)]`.
- Bordure bas : `border-b border-[var(--border)]`.
- Padding horizontal : `px-4 md:px-6`.
- Logo : taille fixe, ex. `h-8` ou `h-9`.
- Baseline : `text-xs` ou `text-sm text-[var(--text-secondary)]`.
- Badge tenant : `rounded-md px-2.5 py-1 text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)]`.

### 4.4 Props utiles

- `tenantId`, `currentApp`, `onAppChange` (si bascule Linky/Odoo).
- Pas de props d’état spécifiques pour le header (toujours “contexte chargé”).

### 4.5 Comportement

- Sticky : `sticky top-0 z-40` si page longue.
- Ne pas faire varier la hauteur entre vues.

---

## 5. Strate 2 — Barre de pilotage (filtres)

### 5.1 Composant

Intégrée dans `ReportHeader` (sélecteurs entité, période, année, badge preuves).

### 5.2 Éléments

- Sélecteur entité : `select` ou combobox, `h-9` ou `h-10`, `border border-[var(--border)] rounded-lg bg-[var(--card)]`.
- Sélecteur période : idem hauteur et style.
- Sélecteur année : idem.
- Badge preuves : `IntegrityBadge`, style “confiance” (pas filtre).

### 5.3 Règles

- Même hauteur pour tous les contrôles : `h-9` ou `h-10`.
- Alignement vertical : `items-center gap-3` ou `gap-4`.
- Focus : `focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]`.

### 5.4 Props

- `period`, `onPeriodChange`, `availableYears`, `monthsWithDataByYear`.
- `selectedCompanyId`, `onCompanyChange`, `companies`, `companiesLoading`.
- `sealedCount`, `sealedCountComplete`, `onRefreshMetrics`, `showIntegrityBadge`.

---

## 6. Strate 3 — Grille KPI (tuiles)

### 6.1 Composant

`IconGrid` — grille de tuiles cliquables.

### 6.2 Données d’entrée

- `metrics: DashboardMetricsResponse | null` (ou équivalent par `CardId`).
- `metricsLoading: boolean`.
- `onSelect: (cardId: CardId) => void`.

### 6.3 Mapping CardId → Classe visuelle (A/B/C)

| CardId | Classe | Rôle |
|--------|--------|------|
| `treasury` | A | Solde validé |
| `business` | A | CA ventes |
| `cash` | A | Flux net |
| `treasury_position` | B | Paiements à rapprocher |
| `working_capital` | B | BFR |
| `encours` | B | Encours |
| `taxes` | B | TVA |
| `ebitda` | B | EBE |
| `credit_notes` | C | Notes de crédit |
| `refunds` | C | Remboursements |
| `pos_shops` | C | Points de vente |
| `pos_z` | C | Z de caisse |

### 6.4 Variantes de tuile (A, B, C)

À implémenter en différenciant :

- **Classe A**  
  - Bordure : `border-[1.5px] border-[var(--accent)]` ou token `--tile-a-border`.  
  - Hauteur min : `min-h-[148px]` ou `min-h-[var(--tile-a-min-h)]`.  
  - Valeur : `text-lg font-bold tabular-nums`.  
  - Padding : `p-5` (`--tile-a-padding`).  
  - Placement : privilégier lignes 1–2 (ordre dans `GRID_ITEMS`).  
  - **Classes Tailwind exemple** : `border-[1.5px] border-[var(--accent)] p-5 min-h-[148px]` + valeur en `text-lg font-bold tabular-nums`.

- **Classe B**  
  - Bordure : `border border-[var(--border)]`.  
  - Hauteur min : `min-h-[132px]` ou `min-h-[var(--tile-b-min-h)]`.  
  - Valeur : `text-base font-bold tabular-nums`.  
  - Padding : `p-4`.  
  - **Classes Tailwind exemple** : `border border-[var(--border)] p-4 min-h-[132px]` + valeur en `text-base font-bold tabular-nums`.

- **Classe C**  
  - Bordure : `border border-[var(--border)]`.  
  - Hauteur min : `min-h-[116px]` ou `min-h-[var(--tile-c-min-h)]`.  
  - Valeur : `text-sm font-semibold tabular-nums`.  
  - Padding : `p-3`.  
  - **Classes Tailwind exemple** : `border border-[var(--border)] p-3 min-h-[116px]` + valeur en `text-sm font-semibold tabular-nums`.

### 6.4bis Helper central de variantes (recommandé)

Centraliser la logique des classes dans une fonction ou un schéma **class-variance-authority (cva)** pour éviter la dispersion des règles (priorité, état, valueKind, focus, hover, disabled).

Exemple de signature :

```ts
getTileClasses(priority: TilePriority, status: TileStatus, valueKind: ValueKind): string
```

Ou avec `cva` :

```ts
const tileVariants = cva("...", {
  variants: {
    priority: { A: "...", B: "...", C: "..." },
    status: { ready: "...", loading: "...", partial: "...", ... },
    valueKind: { positive: "...", accent: "...", neutral: "...", ... },
  },
  defaultVariants: { priority: "B", status: "ready", valueKind: "neutral" },
});
```

Les règles à factoriser : bordure, padding, min-height, taille valeur, couleur valeur, état loading (pulse/opacity), focus, hover, disabled.

### 6.5 États d’une tuile

- **Charge / normal** : valeur + couleur sémantique (`valueKind`).
- **Chargement** : `metricsLoading && !metric` → skeleton ou `animate-pulse opacity-60`, `aria-busy="true"`.
- **Partiel / indisponible** : valeur `—`, `text-[var(--text-secondary)]`.
- **Erreur** : pas de rouge sur la valeur ; gérer en message global ou tooltip.

Couleur de valeur : `valueKind` → `positive` (vert), `accent` (bleu), `neutral` (texte), `placeholder` (secondaire). Rouge réservé aux erreurs système (hors tuile).

### 6.6 Structure HTML/JSX d’une tuile

```tsx
<button
  type="button"
  onClick={() => onSelect(id)}
  className={[
    "group flex flex-col items-center justify-center gap-2 rounded-xl ...",
    tileClassByPriority[id], // A, B ou C
  ].join(" ")}
  aria-label={`Ouvrir ${label}`}
>
  <div className="icône avec bordure statut (ok/watch/neutral)" />
  <span className="label uppercase text-xs text-[var(--text-secondary)]">{label}</span>
  <span className={["valeur tabular-nums", valueColorClass]} aria-busy={...}>{formatted}</span>
</button>
```

### 6.7 Accessibilité

- `role="navigation"` sur la grille, `aria-label="Grille des indicateurs KPI"`.
- Chaque tuile : `aria-label="Ouvrir {label}"`.
- Focus visible : déjà défini globalement (`:focus-visible`).

---

## 7. Cartes détaillées (vue focalisée)

### 7.1 Principe

Une tuile ouvre **une seule** carte détaillée. Pas de carte visible en vue cockpit.

### 7.2 Mapping tuile → composant carte

| Tuile (CardId) | Composant carte |
|----------------|------------------|
| `treasury` | `TresoreriePositionCard` / `TresoreriePositionCardWithPolling` |
| `treasury_position` | `TreasuryCardWithPolling` |
| `business` | `BusinessCard` / `BusinessCardWithPolling` |
| `cash` | `FluxCashCard` / `FluxCashCardWithPolling` |
| `working_capital` | `WorkingCapitalCard` / `WorkingCapitalCardWithPolling` |
| `encours` | `EncoursCard` / `EncoursCardWithPolling` |
| `taxes` | `TaxesCard` / `TaxesCardWithPolling` |
| `ebitda` | `EbeCard` / `EbeCardWithPolling` |
| `credit_notes` | `CreditNotesCard` / `CreditNotesCardWithPolling` |
| `refunds` | `RefundsCard` / `RefundsCardWithPolling` |
| `pos_shops` | `PosShopsView` |
| `pos_z` | `PosComingSoonView` |

### 7.3 Structure commune d’une carte (zones §6.4 v2)

- Zone 1 : Badge icône (optionnel en tête).
- Zone 2 : Libellé KPI.
- Zone 3 : Valeur principale (typographie dominante).
- Zone 4 : Sous-info (vs N-1 si dispo, fraîcheur, source).
- Zone 5 : État de données (disponible / incomplet / non alimenté).

Styles communs :

- Conteneur : `rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)] p-6`.
- Valeur : `text-2xl` ou `text-3xl font-bold tabular-nums text-[var(--text)]`.
- Libellé : `text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]`.

### 7.4 Retour cockpit

Bouton “← Retour au cockpit” en haut de la vue focalisée : `text-sm text-[var(--accent)] hover:underline`, ou bouton ghost avec icône.

---

## 8. Strate 4 — Zone d’analyse et d’action

### 8.1 Panneau Insight (DivaFlashBlock)

**Composant** : `DivaFlashBlock`.

**Props** : `tenantId`, `companyId`, `period`, `dashboardMetrics?`, `focusCardId?`, `embedded?`.

**Structure cible** :

- Zone 1 : Titre (ex. “Insight principal”) — `text-sm font-semibold text-[var(--text-secondary)]`.
- Zone 2 : Message principal (1–2 phrases max en cockpit). `text-base text-[var(--text)]`.
- Zone 3 : Écart clé (optionnel). `text-sm text-[var(--text-secondary)]`.
- Zone 4 : Données utilisées (pliable). Style discret.
- Zone 5 : Bouton Rafraîchir. Même style que les contrôles (bordure, focus).

**Règle cockpit** : pas plus de deux phrases en vue cockpit (phrase principale + phrase d’écart).

**Styles** : Bloc avec `border border-[var(--border)] rounded-xl bg-[var(--card)] p-4` ou `p-5`. Hiérarchie nette entre message principal et métadonnées.

### 8.2 Module Decisions actives

**Composant** : `DecisionsBlock`.

**États à prévoir** : vide, saisie en cours, enregistrement, liste peuplée, erreur.

**Structure** : Titre + compteur, statut du module, champ saisie, aide contextuelle, liste des décisions (à venir).

Styles : même famille que les cartes (bordure, fond, rayon).

### 8.3 Bouton Rafraîchir

- Taille : `h-9` ou `h-10`, cohérent avec la barre de pilotage.
- État loading : spinner ou `aria-busy`, désactivation du bouton pendant le refresh.

---

## 9. Strate 5 — Barre de confiance (footer)

### 9.1 Composant

`LinkyFooter`.

### 9.2 Contenu

- Source : Vault
- Preuves scellées : nombre
- UX P95 : valeur ms
- Sources : Odoo, POS (statut)
- Version : 1.0.0

### 9.3 Styles

- Conteneur : `border-t border-[var(--border)] bg-[var(--bg-secondary)] py-3 px-4 md:px-6`.
- Texte : `text-xs text-[var(--text-secondary)]`.
- Séparateurs : `gap-4` ou séparateur vertical discret.
- Mise en scène : plus de lisibilité et séparation des items que le footer actuel (objectif P1).

### 9.4 Props

- `tenantId`, `primarySource?`, `sealedCountTotal?` (pour cohérence avec le badge header).

---

## 10. États globaux et squelettes

### 10.1 États de page

- **Chargement initial** : skeleton de la grille (même nombre de tuiles, même géométrie).
- **Rafraîchissement** : garder les valeurs, indicateur discret (ex. spinner header ou badge).
- **Partiel** : afficher les données disponibles, pas de blocage.
- **Erreur source** : message contextualisé, pas uniquement rouge ; proposer “Réessayer” si pertinent.

### 10.2 Skeleton tuile

- Même `rounded-xl`, même padding que la tuile cible.
- Fond : `bg-[var(--surface)]` ou `animate-pulse bg-[var(--border)]/30`.
- Pas de faux contenu texte (pour accessibilité et clarté).

### 10.3 États KPI (résumé)

| État | Affichage |
|------|-----------|
| Charge / normal | Valeur + couleur sémantique |
| Chargement | Skeleton ou pulse, aria-busy |
| Partiel | Valeur partielle + indication si besoin |
| Indisponible | “—” + text secondaire |
| Erreur | Gestion hors tuile (message global) |
| Vide mais valide | “0” ou “—” selon métier |

### 10.4 Convention zéros et tirets (règle métier unique)

Pour éviter les ambiguïtés d’implémentation :

| Affichage | Signification | Usage |
|-----------|----------------|--------|
| `0,00 €` | Donnée disponible, valeur nulle | Montant calculé = 0 |
| `—` (tiret cadratin) | Donnée non disponible / non calculable | Source absente, indicateur désactivé, hors périmètre |
| À éviter en UI finale | Libellés génériques type “Contenu temporaire” | Remplacer par “—” + tooltip ou libellé métier (“En attente d’alimentation”, etc.) |

Règle : une valeur affichée est soit un **nombre formaté** (dont 0), soit **—**. Pas de libellé flou à la place du nombre.

---

## 11. Motion et transitions

Règles courtes pour garder le ton Linky (sobre, précis, pas flashy) :

- **Hover tuile** : transition 120–160 ms (ex. `transition-all duration-150`). Pas d’animation décorative.
- **Focus ring** : apparition immédiate (pas de délai).
- **Refresh / skeleton** : pas d’animations décoratives ; pulse ou skeleton géométrique uniquement.
- **Pas de motion flashy** : pas de bounce, scale exagéré ni animation de type “celebration” sur les tuiles KPI (réserver aux micro-interactions très ciblées si besoin).

Respect de `prefers-reduced-motion` : désactiver ou réduire les transitions si l’utilisateur le demande (déjà en place pour la célébration donut dans `globals.css`).

---

## 12. Accessibilité (rappel)

- Contraste : WCAG 2.1 AA (texte 4,5:1, composants 3:1).
- Focus : `:focus-visible` déjà en global ; ne pas supprimer.
- Sens : ne pas porter le sens par la couleur seule (label / wording / statut).
- ARIA : `aria-label` sur tuiles, boutons d’action, zones de chargement ; `aria-busy` pendant le chargement.
- Skeletons : géométrie réaliste, pas de faux contenu trompeur.

---

## 13. Récapitulatif des composants et props clés

| Composant | Props principales | Variantes / états |
|-----------|-------------------|-------------------|
| ReportHeader | tenantId, companies, period, onPeriodChange, sealedCount, … | — |
| IconGrid | tenantId, companyId, period, metrics, metricsLoading, onSelect | Tuiles A/B/C, valueKind, status |
| TresoreriePositionCard | id. cartes avec polling | loading, error, empty |
| DivaFlashBlock | tenantId, companyId, period, dashboardMetrics?, embedded? | ready, pending, failed |
| DecisionsBlock | (selon API) | vide, saisie, liste, erreur |
| LinkyFooter | tenantId, sealedCountTotal? | — |

---

## 14. Tableau de référence CardId / Label UI / Classe / Composant React

Une seule source de vérité pour éviter tout glissement entre nom UI, `CardId`, classe visuelle et composant.

| CardId | Label UI | Classe | Composant React |
|--------|----------|--------|-----------------|
| `treasury` | Trésorerie | A | `TresoreriePositionCard` / `TresoreriePositionCardWithPolling` |
| `treasury_position` | Paiements | B | `TreasuryCardWithPolling` |
| `business` | Business | A | `BusinessCard` / `BusinessCardWithPolling` |
| `cash` | Flux net | A | `FluxCashCard` / `FluxCashCardWithPolling` |
| `working_capital` | BFR | B | `WorkingCapitalCard` / `WorkingCapitalCardWithPolling` |
| `encours` | Encours | B | `EncoursCard` / `EncoursCardWithPolling` |
| `taxes` | Taxes | B | `TaxesCard` / `TaxesCardWithPolling` |
| `ebitda` | EBE | B | `EbeCard` / `EbeCardWithPolling` |
| `credit_notes` | Notes de crédit | C | `CreditNotesCard` / `CreditNotesCardWithPolling` |
| `refunds` | Remboursements | C | `RefundsCard` / `RefundsCardWithPolling` |
| `pos_shops` | Points de vente | C | `PosShopsView` |
| `pos_z` | Z de caisse | C | `PosComingSoonView` |

---

## 15. Ordre d’implémentation suggéré

1. **Tokens** : ajouter `--tile-a-*`, `--tile-b-*`, `--tile-c-*` (dont hauteurs min) dans `globals.css`.
2. **Contrat TypeScript** : introduire `KpiTileViewModel`, `TilePriority`, `TileStatus`, `ValueKind` et mapper une fois depuis `DashboardMetricsResponse`.
3. **Helper variantes** : implémenter `getTileClasses(priority, status, valueKind)` ou `cva` pour centraliser les classes tuiles.
4. **IconGrid** : appliquer variantes A/B/C (bordure, min-height, taille valeur, padding, `tabular-nums`).
5. **Convention 0 / —** : utiliser strictement `0,00 €` vs `—` selon la règle §10.4.
6. **Grille** : vérifier breakpoints et gap (déjà en place, à valider).
7. **Cartes détaillées** : uniformiser structure 5 zones sur 1–2 cartes pilotes, puis généraliser.
8. **DivaFlashBlock** : renforcer hiérarchie visuelle (titre, 2 phrases max).
9. **LinkyFooter** : mise en scène “barre de confiance” (P1).
10. **Skeletons** : géométrie et états de chargement.
11. **Motion** : limiter transitions à 120–160 ms, pas d’animation décorative sur tuiles.
12. **Accessibilité** : audit aria-label et focus.

---

**Fin du document.**  
Référence : SPEC_UI_LINKY_v2_composant_par_composant.md v1.2.
