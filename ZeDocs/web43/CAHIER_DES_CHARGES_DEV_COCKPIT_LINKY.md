# Cahier des charges détaillé — Développement Cockpit Linky

**Document technique pour l'équipe développement**

Version : 1.2  
Date : Mars 2026  
Référence code : `linky-cockpit-demo2.html`  
*Mise à jour v1.2 : Sprint 1 et 2 implémentés — voir RAPPORT_AVANCEMENT_COCKPIT_LINKY.md*

---

## 1. Contexte et état existant

### 1.1 Codebase actuelle

| Élément | Chemin | État |
|---------|--------|------|
| Application | `units/dorevia-linky/` | Next.js 14, React 18, Tailwind, Recharts |
| Layout | `app/layout.tsx` | ✅ IBM Plex Sans + Inter |
| Page cockpit | `app/cockpit/page.tsx` | ✅ Implémentée (Sprint 1+2) |
| Composants cockpit | `components/cockpit/` | ✅ 14 composants créés |
| Dashboard existant | `app/page.tsx` → `DashboardWithFilters` | Inchangé |
| API cockpit | `app/api/cockpit/cards/route.ts` | Existe, à connecter |
| API données | `dashboard-metrics`, `treasury`, `ar-by-partner`, etc. | À connecter (Sprint 3) |

### 1.2 Maquettes de référence

| Fichier | Usage |
|---------|-------|
| `ZeDocs/web43/linky-cockpit-demo2.html` | **Référence principale** — layout avancé complet |
| `ZeDocs/web43/linky-cockpit-demo.html` | Layout simple (fallback) |

### 1.3 Documents de référence

- `direction_artistique_linky.md` — Direction visuelle
- `LINKY_UI_DESIGN_SYSTEM_v1.0.md` — Tokens, composants
- `SPECIFICATION_REFONTE_COCKPIT_LINKY.md` — Spécification fonctionnelle

---

## 2. Configuration technique

### 2.1 Tailwind — Design tokens à ajouter

Fichier : `units/dorevia-linky/tailwind.config.js`

```javascript
// À ajouter dans theme.extend
colors: {
  // Palette Linky
  "linky-bg": "#0F1B2D",
  "linky-bg-secondary": "#14243A",
  "linky-surface": "#1A2E47",
  "linky-border": "#223B5B",
  "linky-text": "#E6EEF8",
  "linky-muted": "#9FB3C8",
  "linky-hover": "#1F3653",
  // Fonctionnelles
  "linky-success": "#22C55E",
  "linky-warning": "#F59E0B",
  "linky-danger": "#EF4444",
  "linky-info": "#3B82F6",
},
fontSize: {
  "linky-kpi": ["44px", { lineHeight: "1.2" }],
  "linky-title": ["16px", { lineHeight: "1.4" }],
  "linky-small": ["13px", { lineHeight: "1.4" }],
  "linky-label": ["12px", { lineHeight: "1.4" }],
},
spacing: {
  "linky-gap": "16px",
  "linky-gap-lg": "24px",
  "linky-padding": "16px",
  "linky-padding-lg": "24px",
},
borderRadius: {
  "linky-card": "12px",
  "linky-badge": "6px",
},
```

### 2.2 Police — IBM Plex Sans

Fichier : `app/layout.tsx`

```tsx
// Remplacer Inter par IBM Plex Sans
import { IBM_Plex_Sans } from "next/font/google";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ibm-plex",
});

// Dans <html> : className={ibmPlexSans.variable}
// Dans tailwind : fontFamily: { sans: ["var(--font-ibm-plex)", "system-ui"] }
```

### 2.3 CSS global — Variables (optionnel)

Fichier : `app/globals.css`

```css
:root {
  --linky-bg: #0F1B2D;
  --linky-bg-secondary: #14243A;
  --linky-surface: #1A2E47;
  --linky-border: #223B5B;
  --linky-text: #E6EEF8;
  --linky-muted: #9FB3C8;
  --linky-success: #22C55E;
  --linky-warning: #F59E0B;
  --linky-danger: #EF4444;
  --linky-info: #3B82F6;
}
```

---

## 3. Composants à implémenter

### 3.1 Structure des composants

```
components/
├── cockpit/
│   ├── CockpitLayout.tsx      # Container principal
│   ├── CockpitHeader.tsx      # Header contexte
│   ├── InsightCard.tsx        # Bloc insight
│   ├── KpiGrid.tsx            # Grille 4 KPI
│   ├── KpiCard.tsx            # Carte KPI individuelle
│   ├── ProofWidget.tsx        # Couverture probante (radial)
│   ├── SectionGrid.tsx        # Layout 2 colonnes
│   ├── ChartCard.tsx          # Carte avec graphique
│   ├── TableCard.tsx          # Carte avec table
│   ├── AlertCard.tsx          # Carte alertes
│   ├── Badge.tsx              # Badge (success, warning, danger, info)
│   ├── SkeletonCard.tsx       # Skeleton réutilisable (kpi, chart, table, proof)
│   └── CockpitSkeleton.tsx    # Skeleton complet page cockpit
```

### 3.2 CockpitLayout

**Rôle :** Container principal, structure de page.

**Structure HTML (référence demo2) :**

```tsx
<main className="max-w-[1200px] mx-auto px-6 py-6 bg-linky-bg text-linky-text">
  <CockpitHeader {...} />
  <InsightCard {...} />
  <KpiGrid items={...} />
  <ProofWidget {...} />
  <SectionGrid>
    <ChartCard title="Flux économiques" ... />
    <TableCard title="Exposition clients" ... />
  </SectionGrid>
  <SectionGrid>
    <ChartCard title="Position trésorerie" ... />
    <AlertCard title="Alertes financières" ... />
  </SectionGrid>
</main>
```

**Classes Tailwind :** `max-w-[1200px] mx-auto px-6 py-6 bg-linky-bg text-linky-text font-sans`

---

### 3.3 CockpitHeader

**Props :**

```ts
interface CockpitHeaderProps {
  tenantName: string;
  period: string;           // "Mars 2026"
  fluxBadge?: "validé" | "partiel" | "à vérifier";
  sourceBadge?: string;     // "Vault", "Odoo + POS", etc.
}
```

**Structure (référence demo2 lignes 318-330) :**

```tsx
<header className="flex justify-between items-center mb-6">
  <div className="text-xl font-semibold tracking-wide">
    Linky — Cockpit financier
  </div>
  <div className="flex gap-2.5 flex-wrap text-sm text-linky-muted">
    <span>{tenantName} • {period}</span>
    <Badge variant="success">{fluxBadge}</Badge>
    <Badge variant="info">{sourceBadge}</Badge>
  </div>
</header>
```

---

### 3.4 Badge

**Props :**

```ts
type BadgeVariant = "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}
```

**Styles (référence demo2 lignes 46-71) :**

| Variant | Background | Color |
|---------|------------|-------|
| success | `rgba(34,197,94,0.15)` | `#22C55E` |
| warning | `rgba(245,158,11,0.15)` | `#F59E0B` |
| danger | `rgba(239,68,68,0.15)` | `#EF4444` |
| info | `rgba(59,130,246,0.15)` | `#3B82F6` |

**Classes :** `px-2 py-1 rounded-linky-badge text-xs font-semibold`

---

### 3.5 InsightCard

**Props :**

```ts
interface InsightCardProps {
  text: string;
  badge?: { label: string; variant: BadgeVariant };
  borderVariant?: "warning" | "success" | "danger";  // défaut: warning
}
```

**Structure (référence demo2 lignes 334-342) :**

```tsx
<section className="bg-linky-bg-secondary border border-linky-border border-l-4 border-l-linky-warning rounded-lg p-4 mb-6">
  <strong>Insight</strong>
  <br />
  {text}
  {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
</section>
```

**Classes :** `bg-linky-bg-secondary border border-linky-border border-l-4 border-l-linky-warning rounded-lg p-4 mb-6`

---

### 3.6 KpiCard

**Props :**

```ts
interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: {
    text: string;
    variant?: "success" | "danger" | "neutral";
  };
  subtitle?: string;
}
```

**Structure (référence demo2 lignes 346-369) :**

```tsx
<div className="bg-linky-surface border border-linky-border rounded-linky-card p-4 transition-colors duration-150 hover:bg-linky-hover">
  <div className="text-linky-small text-linky-muted">{title}</div>
  <div className="text-[44px] font-semibold">{value}</div>
  {delta && (
    <div className={cn(
      "text-linky-small mt-1",
      delta.variant === "success" && "text-linky-success",
      delta.variant === "danger" && "text-linky-danger"
    )}>
      {delta.text}
    </div>
  )}
</div>
```

---

### 3.7 KpiGrid

**Props :** `items: KpiCardProps[]` (max 4)

**Structure :** `grid grid-cols-4 gap-4 mb-6` (responsive : `md:grid-cols-2`, `sm:grid-cols-1`)

---

### 3.8 ProofWidget (Couverture probante)

**Props :**

```ts
interface ProofSource {
  name: string;
  status: "Validé" | "Sync" | "Partiel" | "Confirmé";
  variant: "success" | "warning";
}

interface ProofWidgetProps {
  percentage: number;  // 0-100
  sources: ProofSource[];
}
```

**Structure (référence demo2 lignes 373-423) :**

- Jauge radiale SVG : cercle r=70, circumference=440, stroke-dashoffset = 440 * (1 - percentage/100)
- Valeur centrée : `position: absolute`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`
- Sources : liste flex colonne, chaque ligne `flex justify-between`

**SVG radial (formule) :**

```ts
const circumference = 2 * Math.PI * 70; // ≈ 440
const offset = circumference * (1 - percentage / 100);
// stroke-dasharray={circumference} stroke-dashoffset={offset}
```

**Classes proof-body :** `flex flex-row items-center gap-8` (mobile : `flex-col`)

---

### 3.9 SectionGrid

**Props :** `children: React.ReactNode` (2 enfants)

**Structure :** `grid grid-cols-2 gap-4 mb-8 pb-6 border-b border-linky-border last:border-b-0 last:pb-0 last:mb-0`

---

### 3.10 ChartCard

**Props :**

```ts
interface ChartCardProps {
  title: string;
  status?: string;   // "Flux positifs sur 3 périodes"
  chartType: "bar" | "line";
  data: { label: string; value: number; variant?: "success" | "warning" }[];
}
```

**Structure :** Carte avec `h3`, `chart-status` (text-linky-small), zone chart avec `border-t border-linky-border pt-3`

**Graphique :** Utiliser Recharts `BarChart`. Couleurs : `#22C55E` (success), `#F59E0B` (warning).

---

### 3.11 TableCard (Exposition clients)

**Props :**

```ts
interface TableRow {
  partner: string;
  encours: number;
  retard: number;
  retardVariant: "warning" | "danger";
  preuve: string;
  preuveValidated?: boolean;  // pour style success
}

interface TableCardProps {
  title: string;
  status?: string;
  rows: TableRow[];
}
```

**Colonnes :** Partenaire | Encours | Retard | Preuve

**Styles table :** `w-full`, `th: text-left text-linky-small font-medium text-linky-muted`, `td: py-2.5 border-b border-linky-border`, `td:nth-child(2), td:nth-child(3): text-right`, `tr:hover:bg-linky-bg-secondary`, `transition-colors duration-150`

---

### 3.12 AlertCard

**Props :**

```ts
interface AlertItem {
  text: string;
  badge: { label: string; variant: BadgeVariant };
}

interface AlertCardProps {
  title: string;
  status?: string;
  alerts: AlertItem[];
}
```

**Structure :** Carte avec `h3`, `chart-status`, liste de `.alert` : `flex justify-between items-center py-2.5 border-b border-linky-border last:border-b-0`

---

## 4. Contrats de données (API)

### 4.1 Endpoints existants à utiliser

| Endpoint | Usage |
|----------|-------|
| `GET /api/dashboard-metrics` | KPI trésorerie, marge, etc. |
| `GET /api/treasury` | Position trésorerie |
| `GET /api/ar-by-partner` | Exposition clients (encours, retard) |
| `GET /api/tenant` | Infos tenant |
| `GET /api/vault-health` | Couverture probante, sources |

### 4.2 Données à exposer (à définir avec backend)

| Bloc | Données requises |
|------|------------------|
| Header | tenant_name, period, flux_status, sources |
| Insight | Texte généré (règle métier), badge |
| KPI | treasury, margin, ar_total, delay_pct + deltas |
| Proof | percentage, sources[] |
| Flux | Séries ventes/achats par période |
| Exposition | partners[], encours, retard, preuve |
| Alertes | alerts[] |

---

### 4.3 Type CockpitData — Objet global

Unifier toutes les données du cockpit dans un seul type pour simplifier l'intégration :

```ts
type BadgeVariant = "success" | "warning" | "danger" | "info";

interface CockpitData {
  header: {
    tenantName: string;
    period: string;
    fluxStatus: "validé" | "partiel" | "à vérifier";
    source: string;
  };

  insight: {
    text: string;
    badge?: { label: string; variant: BadgeVariant };
  };

  kpis: KpiCardProps[];

  proof: ProofWidgetProps;

  flux: ChartCardProps;

  treasury: ChartCardProps;

  exposure: TableCardProps;

  alerts: AlertCardProps;
}
```

**Usage :** La page charge `CockpitData` une fois, puis injecte les props dans chaque composant.

---

### 4.4 Data Loader — Chargement centralisé

Éviter les appels API dispersés dans chaque composant. Centraliser dans une fonction :

```ts
async function loadCockpitData(
  tenantId: string,
  companyId: string | null,
  period: { from: string; to: string }
): Promise<CockpitData> {
  // Appels parallèles aux APIs
  const [metrics, treasury, ar, vaultHealth, ...] = await Promise.all([
    fetch(`/api/dashboard-metrics?...`),
    fetch(`/api/treasury?...`),
    fetch(`/api/ar-by-partner?...`),
    fetch(`/api/vault-health?...`),
    // ...
  ]);

  return {
    header: { ... },
    insight: { ... },
    kpis: [ ... ],
    proof: { ... },
    flux: { ... },
    treasury: { ... },
    exposure: { ... },
    alerts: [ ... ],
  };
}
```

**Usage dans la page :**

```tsx
// app/cockpit/page.tsx ou DashboardWithFilters
const [data, setData] = useState<CockpitData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  loadCockpitData(tenantId, companyId, period)
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, [tenantId, companyId, period]);

if (loading) return <CockpitSkeleton />;
if (error) return <CockpitError onRetry={...} />;
if (!data) return null;

return (
  <CockpitLayout>
    <CockpitHeader {...data.header} />
    <InsightCard {...data.insight} />
    <KpiGrid items={data.kpis} />
    <ProofWidget {...data.proof} />
    <SectionGrid>
      <ChartCard {...data.flux} />
      <TableCard {...data.exposure} />
    </SectionGrid>
    <SectionGrid>
      <ChartCard {...data.treasury} />
      <AlertCard {...data.alerts} />
    </SectionGrid>
  </CockpitLayout>
);
```

---

## 5. États et comportements

### 5.1 Loading — Composant SkeletonCard

Créer un composant réutilisable au lieu de divs inline :

```tsx
// components/cockpit/SkeletonCard.tsx

interface SkeletonCardProps {
  variant?: "kpi" | "chart" | "table" | "proof";
}

export function SkeletonCard({ variant = "kpi" }: SkeletonCardProps) {
  const heights = {
    kpi: "h-24",
    chart: "h-64",
    table: "h-48",
    proof: "h-40",
  };

  return (
    <div
      className={`bg-linky-bg-secondary animate-pulse rounded-linky-card ${heights[variant]}`}
      aria-hidden
    />
  );
}
```

**CockpitSkeleton :** Composition pour l'état loading complet :

```tsx
// components/cockpit/CockpitSkeleton.tsx

export function CockpitSkeleton() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
      <div className="flex justify-between h-10 animate-pulse bg-linky-bg-secondary rounded" />
      <div className="h-20 animate-pulse bg-linky-bg-secondary rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} variant="kpi" />
        ))}
      </div>
      <SkeletonCard variant="proof" />
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard variant="chart" />
        <SkeletonCard variant="table" />
      </div>
    </main>
  );
}
```

### 5.2 Erreur

Message + bouton retry. Style : `text-linky-danger`, `border border-linky-danger`.

### 5.3 Vide

Message : "Aucune donnée disponible". Style : `text-linky-muted text-center py-8`.

### 5.4 Focus (accessibilité)

```css
*:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
```

---

## 6. Responsive

| Breakpoint | Comportement |
|------------|--------------|
| ≥ 900px | KpiGrid 4 cols, SectionGrid 2 cols |
| 600–900px | KpiGrid 2 cols, SectionGrid 1 col |
| < 600px | KpiGrid 1 col, ProofWidget empilé, padding 16px |

**Classes Tailwind :** `grid-cols-4 md:grid-cols-2 sm:grid-cols-1`, `lg:flex-row flex-col` (proof-body)

---

## 7. Plan d'implémentation

### Phase 1 — Fondations (J1)

- [ ] Mise à jour `tailwind.config.js` (tokens Linky)
- [ ] Mise à jour `layout.tsx` (IBM Plex Sans)
- [ ] Création composant `Badge`
- [ ] Création composant `KpiCard`
- [ ] Création composant `KpiGrid`
- [ ] Création composant `SkeletonCard` et `CockpitSkeleton`

### Phase 2 — Layout (J2)

- [ ] Création `CockpitLayout`
- [ ] Création `CockpitHeader`
- [ ] Création `InsightCard`
- [ ] Création `ProofWidget`
- [ ] Création `SectionGrid`

### Phase 3 — Contenu (J3)

- [ ] Création `loadCockpitData()` et type `CockpitData`
- [ ] Création `ChartCard` (Recharts)
- [ ] Création `TableCard`
- [ ] Création `AlertCard`
- [ ] Intégration page cockpit avec Data Loader
- [ ] Connexion APIs (données mock puis réelles)

### Phase 4 — Finalisation (J4)

- [ ] États loading / erreur / vide
- [ ] Responsive complet
- [ ] Accessibilité (focus, sémantique)
- [ ] Tests

---

## 8. Checklist conformité Design System

- [ ] Palette exacte (#0F1B2D, #14243A, #1A2E47, etc.)
- [ ] IBM Plex Sans
- [ ] KPI 44px, semibold
- [ ] Cards : border-radius 12px, padding 16px
- [ ] Badges : padding 4px 8px, border-radius 6px
- [ ] Transitions 150ms ease-out
- [ ] Hover card : #1F3653
- [ ] Table hover : #14243A
- [ ] Proof radial : stroke-dasharray 440, formule offset

---

## 9. Référence code maquette (extraits)

### 9.1 ProofWidget — calcul stroke-dashoffset

```ts
// Pour 78% : offset = 440 * (1 - 0.78) = 96.8 ≈ 96
const circumference = 440;
const offset = Math.round(circumference * (1 - percentage / 100));
```

### 9.2 Structure HTML complète (demo2)

Voir `ZeDocs/web43/linky-cockpit-demo2.html` lignes 314-536.

---

---

## 10. Évaluation qualité (référence CTO)

| Critère | Note |
|---------|------|
| Architecture front | 9/10 |
| Lisibilité dev | 9/10 |
| Cohérence produit | 9/10 |
| Intégration API | 8/10 |
| Maintenabilité | 8/10 |
| **Score global** | **8.8/10** |

---

*Cahier des charges — Développement Cockpit Linky v1.1*
