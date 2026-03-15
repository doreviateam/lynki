# Rapport technique — Implémentation transformation visuelle Linky (style Fygr)

**Document de revue technique**

Version : 1.0  
Date : 13 mars 2026  
Statut : Livrable pour revue équipe tech

---

## 1. Contexte et objectif

### 1.1 Objectif

Transformer visuellement l’interface **Dorevia Linky** (ui.lab.o19.doreviateam.com) pour l’aligner sur une esthétique fintech professionnelle, inspirée de [Fygr](https://www.fygr.io/), en réutilisant le Design System du cockpit existant.

### 1.2 Contrainte principale

> **Transformation visuelle uniquement — aucune régression fonctionnelle.**

- Tous les blocs, filtres, cartes, tableaux, graphiques et actions sont conservés.
- Les comportements (navigation, drill-down, accordéons, onglets) restent inchangés.
- La logique métier (calculs, statuts, badges) n’est pas modifiée.
- Seuls les styles (couleurs, typographie, espacements, bordures) et le layout (aligné aux wireframes) ont été adaptés.

### 1.3 Références

| Document | Rôle |
|----------|------|
| `ZeDocs/web43/SPEC_LINKY_VISUEL_FYGR_v1.0.md` | Spécification MOA v1.3 |
| `ZeDocs/web43/WIREFRAME_LINKY_FYGR_v1.html` | Wireframe vue d’ensemble |
| `ZeDocs/web43/WIREFRAME_LINKY_BUSINESS_CARD_v1.html` | Wireframe carte Business |

---

## 2. Vue d’ensemble des changements

### 2.1 Fichiers modifiés

| Fichier | Type de modification |
|---------|----------------------|
| `app/globals.css` | Nouvelle palette cockpit dark, tokens CSS |
| `app/layout.tsx` | Fond `--bg` sur body |
| `tailwind.config.js` | Extension `fontFamily.mono` (IBM Plex) |
| `components/ReportHeader.tsx` | Fond header, selects, menu dropdown |
| `components/LinkyFooter.tsx` | Fond footer |
| `components/IconGrid.tsx` | Tuiles KPI, hover, typographie |
| `components/DashboardWithFilters.tsx` | Layout grille, espacements |
| `components/BusinessCard.tsx` | Radius, suppression classes `dark:` |
| `components/IntegrityBadge.tsx` | Nettoyage `dark:` |
| `components/PosShopsView.tsx` | Nettoyage `dark:` (amber) |

### 2.2 Fichiers non modifiés

Les composants suivants continuent d’utiliser les variables CSS existantes (`--card`, `--border`, `--text`, etc.) sans modification de leur structure :

- `TreasuryCardWithPolling`, `FluxCashCard`, `TaxesCard`, `CreditNotesCard`, `RefundsCard`
- `TresoreriePositionCard`, `PaymentsCard`, `DivaFlashBlock`, `SyncInProgress`
- `IntegrityBadge` (logique inchangée, uniquement nettoyage CSS)

---

## 3. Design System — Tokens CSS

### 3.1 Nouvelle palette (`globals.css`)

```css
:root {
  /* Palette dark — tokens cockpit */
  --bg:              #0F1B2D;   /* Fond principal */
  --bg-secondary:    #14243A;   /* Header, footer */
  --surface:         #1A2E47;   /* Surfaces (cartes, selects) */
  --border:          #223B5B;   /* Bordures */
  --text:            #E6EEF8;   /* Texte principal */
  --text-secondary:  #9FB3C8;   /* Texte secondaire */
  --muted:           #9FB3C8;   /* Alias */
  --hover:           #1F3653;   /* État hover */

  /* Alias compatibilité */
  --card:            #1A2E47;   /* = surface */
  --accent:          #3B82F6;
  --accent-soft:     rgba(59, 130, 246, 0.15);
  --shadow-card:     0 4px 6px -1px rgb(0 0 0 / 0.2);

  /* Sémantique */
  --positive:        #22C55E;
  --negative:        #EF4444;
  --warning:         #F59E0B;
  --status-ok:       #22C55E;
  --status-watch:    #F59E0B;
  --status-alert:    #EF4444;
  /* ... */
}
```

### 3.2 Stratégie de compatibilité

- `--card` est un alias de `--surface` : les composants existants (`bg-[var(--card)]`) restent valides.
- Les tokens sémantiques (`--positive`, `--negative`, `--warning`) sont conservés pour les statuts.
- Le mode clair (`prefers-color-scheme: light`) a été supprimé : l’interface est désormais **toujours en dark mode**.

### 3.3 Typographie

```css
body {
  font-family: var(--font-ibm-plex), var(--font-inter), system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
}
```

- **IBM Plex Sans** : police principale (déjà chargée dans `layout.tsx`).
- **Inter** : fallback.
- Les montants financiers utilisent `tabular-nums` pour un alignement vertical cohérent.

---

## 4. Détail des modifications par fichier

### 4.1 `app/globals.css`

**Avant :** Palette light/dark avec `prefers-color-scheme`.

**Après :**
- Palette cockpit dark unique.
- Nouveaux tokens : `--bg`, `--bg-secondary`, `--surface`, `--hover`.
- `--radius-card: 0.75rem` (12px, aligné wireframe).
- Suppression du bloc `@media (prefers-color-scheme: dark)`.
- Conservation des animations (`dorevia-celebration-pulse`) et du focus visible.

### 4.2 `app/layout.tsx`

**Modification :**
```tsx
<body className="min-h-screen font-sans antialiased" style={{ background: "var(--bg)" }}>
```

- Le fond `--bg` est appliqué explicitement pour garantir le rendu dark même si le navigateur applique un thème par défaut.

### 4.3 `components/ReportHeader.tsx`

**Modifications :**

| Élément | Avant | Après |
|--------|-------|-------|
| Header | `bg-[var(--card)]/95` + `dark:bg-[#0F172A]/95` | `bg-[var(--bg-secondary)]/95` |
| Logo "DOREVIA" | `text-[#64748b] dark:text-[#94A3B8]` | `text-[var(--text-secondary)]` |
| Logo "Linky" | `text-[#0f172a] dark:text-[#FFFFFF]` | `text-[var(--text)]` |
| Menu dropdown | `bg-[var(--card)]` | `bg-[var(--surface)]` |
| Selects (société, période, année) | `bg-[var(--card)]` | `bg-[var(--surface)]` |

- Suppression de toutes les classes `dark:` (thème unique).
- Comportement et structure du header inchangés (filtres, menu hamburger, badge intégrité).

### 4.4 `components/LinkyFooter.tsx`

**Modification :**
```tsx
// Avant
className="... bg-[var(--card)]/95 ..."

// Après
className="... bg-[var(--bg-secondary)]/95 ..."
```

### 4.5 `components/IconGrid.tsx`

**Modifications principales :**

1. **Grille :**
   - `gap-4` → `gap-3`
   - Ajout de `w-full` pour occuper toute la largeur.

2. **Tuile KPI (bouton) :**
   - `p-6` → `p-5`
   - `transition-colors` → `transition-all duration-150`
   - Hover : `hover:bg-[var(--accent-soft)]/20` → `hover:bg-[var(--hover)] hover:shadow-lg hover:border-[var(--accent)]/60`
   - Ajout de `group` pour les effets enfants.

3. **Icône :**
   - `h-16 w-16` → `h-14 w-14`
   - `Icon h-10 w-10` → `Icon h-8 w-8`
   - Ajout : `transition-transform duration-150 group-hover:scale-105`

4. **Label :**
   - `text-sm font-semibold text-[var(--text)]` → `text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]`

5. **Valeur KPI :**
   - `text-sm` → `text-base font-bold tabular-nums leading-tight`
   - Hiérarchie visuelle renforcée (valeur plus proéminente que le label).

6. **Focus :**
   - `focus:ring-offset-[var(--bg)]` conservé pour l’accessibilité.

### 4.6 `components/DashboardWithFilters.tsx`

**Modifications :**

- Zone grille : `pt-6` → `pt-4`, `mb-6` → `mb-5`
- Conteneur TresoreriePositionCard : suppression de `max-w-4xl` pour permettre une largeur pleine
- Conteneur IconGrid : `flex items-start justify-center` → `w-full` (grille centrée par le grid parent)

### 4.7 `components/BusinessCard.tsx`

**Modifications :**

- `CARD_BASE` : `rounded-[var(--radius-xl)]` → `rounded-[var(--radius-card)]` (alignement avec le wireframe)
- Remplacement de `text-amber-600 dark:text-amber-400` par `text-amber-400` (suppression de la variante light)

### 4.8 Nettoyage des classes `dark:`

- **IntegrityBadge.tsx** : `dark:hover:bg-white/10` → `hover:bg-white/10`
- **PosShopsView.tsx** : `text-amber-600 dark:text-amber-400` → `text-amber-400`

---

## 5. Architecture et flux de données

### 5.1 Flux inchangé

- **DashboardWithFilters** : état global (tenant, société, période, viewMode, focusedCardId), fetch `dashboard-metrics`, affichage conditionnel des cartes.
- **IconGrid** : reçoit `metrics` en prop ou fetch local si absent, `onSelect` pour navigation vers la carte détaillée.
- **ReportHeader** : filtres société/période, menu Comptabilité/POS, badge intégrité.
- **LinkyFooter** : fetch `/api/platform/status` et `/api/ux-metrics`, affichage des indicateurs.

### 5.2 Variables d’environnement

Aucune nouvelle variable. Les variables existantes (`VAULT_URL`, `DVIG_URL`, `TENANT_ID`, etc.) restent inchangées.

---

## 6. Accessibilité et performance

### 6.1 Accessibilité

- `*:focus-visible` : outline 2px bleu conservé (globals.css).
- `focus:ring-2 focus:ring-[var(--accent)]` sur les tuiles IconGrid.
- `aria-label`, `aria-busy`, `role="navigation"` conservés.
- Contraste : palette dark avec `--text` (#E6EEF8) sur `--bg` (#0F1B2D) conforme aux recommandations.

### 6.2 Performance

- Aucun nouveau bundle ou dépendance.
- Animations limitées (`transition-all duration-150`, `group-hover:scale-105`) avec `prefers-reduced-motion` déjà géré pour `dorevia-celebration-pulse`.

---

## 7. Build et déploiement

### 7.1 Build

```bash
docker build -t dorevia/linky:cockpit-2026-03-13 -f units/dorevia-linky/Dockerfile units/dorevia-linky/
```

- Build Next.js standard, sans erreur TypeScript (`tsc --noEmit`).

### 7.2 Déploiement o19

```yaml
# tenants/o19/apps/ui/lab/docker-compose.yml
services:
  linky:
    image: dorevia/linky:cockpit-2026-03-13
```

- Container `linky_lab_o19` redémarré avec `docker compose up -d --force-recreate`.
- URL de vérification : https://ui.lab.o19.doreviateam.com/

---

## 8. Points d’attention pour la revue

### 8.1 À vérifier

1. **Rendu cross-browser** : Safari, Firefox, Chrome (palette dark, variables CSS).
2. **Responsive** : grille 2/3/4 colonnes (mobile/tablet/desktop), header/footer compacts.
3. **Contraste** : badges statut (ok/watch/alert) sur fond `--surface`.
4. **Selects** : option `background` et `color` des `<select>` selon le navigateur (certains appliquent des styles par défaut).

### 8.2 Évolutions possibles

- Utiliser `--surface` partout à la place de `--card` pour plus de cohérence sémantique.
- Extraire les constantes `STATUS_COLORS` et `STATUS_BG` d’IconGrid vers un module partagé ou des tokens CSS.
- Ajouter des tests visuels (Playwright, Chromatic) pour détecter les régressions visuelles.

---

## 9. Résumé

| Critère | Statut |
|---------|--------|
| Transformation visuelle alignée spec Fygr | ✅ |
| Palette cockpit dark appliquée | ✅ |
| Typographie IBM Plex Sans | ✅ |
| Grille KPI (IconGrid) mise à jour | ✅ |
| Header / Footer cohérents | ✅ |
| Pas de régression fonctionnelle | ✅ |
| Build Docker réussi | ✅ |
| Déploiement o19 opérationnel | ✅ |

---

*Document généré pour la revue technique de l’équipe. Pour toute question, se référer à la spec `SPEC_LINKY_VISUEL_FYGR_v1.0.md` et aux wireframes dans `ZeDocs/web43/`.*
