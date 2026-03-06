# Plan d'implémentation — Card 1/9 TRÉSORERIE (MVP Phase 1)

**Date :** 2026-03-03  
**Version :** v1.2  
**Référence :** `SPEC_CARD_TRESO.md`  
**Statut :** P0 validé + gestion NO_DATA  
**Durée estimée :** 1–2 jours

------------------------------------------------------------------------

## 1. Vue d'ensemble

| Phase | Tâche | Fichiers | Estimation |
|-------|-------|----------|------------|
| 1 | Créer le composant TresoreriePositionCard | 1 nouveau | 2–3 h |
| 2 | Créer le wrapper WithPolling | 1 nouveau | 30 min |
| 3 | Intégrer dans DashboardWithFilters | 1 modifié | 1 h |
| 4 | Tests manuels et ajustements | — | 1–2 h |

**Aucune modification backend** (Vault, `/api/treasury`).

------------------------------------------------------------------------

## 2. Règles critiques (v1.2)

### 2.1 État NO_DATA

Un état neutre distingue "0 € réel" de "Aucune donnée disponible".

**NO_DATA si :** `validated_balance`, `unvalidated_exposure` et `reconciliation_rate` sont tous null ou 0. ERP n'entre pas dans le calcul.

**Priorité des états :**
1. **NO_DATA** — Texte "Aucune donnée disponible" + valeurs `—`
2. **Tension** → `rate != null && rate < 70` — Badge "Validation partielle"
3. **Vigilance** → `flags.large_delta` OU (70 ≤ rate < 90) — "Écart à analyser"
4. **Normal** — Affichage neutre

**NO_DATA prime toujours.** Pas de badge tension si absence de données.

### 2.2 Gestion des valeurs null

| Valeur | Comportement |
|--------|--------------|
| `reconciliation_rate == null` | Afficher `— %` + tooltip "Taux indisponible" |
| `generated_at == null` | Afficher "Dernière mise à jour : —" |
| `erp_balance == null` | Masquer ligne ERP + mention calme : "Solde comptable : non configuré" |
| NO_DATA | Afficher `—` au lieu de `0,00 €` |

### 2.3 Multi-société

Si `companyId === null` :
- Ne **pas** inclure `company_id` dans l'URL (éviter param vide)
- Tester l'agrégation multi-société
- Si agrégation incorrecte → afficher : "Sélectionnez une société pour afficher la position"

### 2.4 Snapshot "à date"

La carte affiche une position **au présent**. Toujours afficher :
> "Au {date}" ou "Dernière mise à jour : {date}"

La carte ignore la logique flux/période.

### 2.5 Focus & Navigation

**Option B actée :**
- La carte Trésorerie (Position) est toujours visible en haut
- Pas de focus dédié
- La tuile IconGrid "Paiements" reste liée à la carte Process

### 2.6 Décision stratégique

Cette carte est une **ancre émotionnelle** du cockpit. Elle ne doit jamais créer d'alarme artificielle.

> *Position d'abord, explication ensuite.*

------------------------------------------------------------------------

## 3. Phase 1 — Composant TresoreriePositionCard

### 3.1 Fichier à créer

`units/dorevia-linky/components/TresoreriePositionCard.tsx`

### 3.2 Structure du composant

```tsx
"use client";

interface TresoreriePositionCardProps {
  tenantId: string;
  companyId: string | null;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
}
```

### 3.3 Données à consommer

- **Endpoint :** `GET /api/treasury?tenant={tenant}` + `&company_id={id}` uniquement si `companyId != null` (voir §2.3)
- **Champs utilisés :**
  - `position.erp_balance` → Solde comptable (ERP)
  - `position.validated_balance` → Position validée (Vault)
  - `reconciliation_rate` → Taux de rapprochement (en %, déjà formaté par l'API)
  - `currency` → devise
  - `flags.large_delta` → vigilance
  - `generated_at` → "Au {date}" / "Dernière mise à jour"

### 3.4 Fonction isNoData (v1.2)

```ts
function isNoData(d: TreasuryPositionData | null | undefined): boolean {
  if (!d) return true;
  const vb = d.position?.validated_balance ?? null;
  const uv = d.position?.unvalidated_exposure ?? null;
  const rate = d.reconciliation_rate ?? null;
  const vbEmpty = vb == null || vb === 0;
  const uvEmpty = uv == null || uv === 0;
  const rateEmpty = rate == null || rate === 0;
  return vbEmpty && uvEmpty && rateEmpty;
}
```

### 3.5 Règles d'affichage (SPEC §4 + v1.2)

**Priorité :** NO_DATA > Tension > Vigilance > Normal (voir §2.1).

| Cas | Condition | UI |
|-----|-----------|-----|
| NO_DATA | `isNoData(data)` | "Aucune donnée disponible" + valeurs `—` |
| Tension | `rate != null` et `rate < 70` | Badge "Validation partielle" |
| Vigilance | `flags?.large_delta` OU (70 ≤ rate < 90) | Badge "Écart à analyser" |
| Normal | sinon | Affichage neutre |

### 3.6 Mode dégradé (SPEC §7)

Si `position?.erp_balance == null` :
- Masquer la ligne "Solde comptable (ERP)"
- Afficher "Position validée (Vault)" et "Taux de rapprochement"
- Mention calme : "Solde comptable : non configuré"

### 3.7 Layout UX

- **Card pleine largeur** : `w-full` ou `max-w-full` (section parent gère)
- **Titre :** "TRÉSORERIE" (uppercase, bold)
- **Contenu :** 3 lignes principales
  1. 💰 Solde comptable (ERP) — `formatAmount(erp_balance)` — affichage dominant (gros chiffre)
  2. 🔐 Position validée (Vault) — `formatAmount(validated_balance)`
  3. 📊 Taux de rapprochement — `{Math.round(rate)} %`
- **Mention :** "Au {date}" ou "Dernière mise à jour : {date}" — extraire de `generated_at`
- **Tooltips :** selon SPEC §5

### 3.8 Utilitaires à réutiliser

- `formatAmount` depuis `@/app/lib/format`
- `IconTreasury` depuis `@/components/CardIcons`
- Styles : `CARD_BASE` (aligné sur TreasuryCardWithPolling)

### 3.9 Format date

```ts
function formatSnapshotDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
```

Affichage : "Au 03/03/2026" ou "Dernière mise à jour : 03/03/2026"

------------------------------------------------------------------------

## 4. Phase 2 — Wrapper WithPolling

### 4.1 Fichier à créer

`units/dorevia-linky/components/TresoreriePositionCardWithPolling.tsx`

### 4.2 Comportement

- **Polling :** 10 min (comme TreasuryCard) — `const POLL_INTERVAL_MS = 10 * 60 * 1000`
- **Bouton Rafraîchir :** discret, à côté du titre ou en bas de carte
- **Fetch :** `GET /api/treasury?tenant={tenant}` + `company_id` uniquement si `companyId != null` (voir §2.3)
- **États :** loading, error, data

### 4.3 Pattern

S'inspirer de `TreasuryCardWithPolling.tsx` :
- `useCallback` pour fetchData
- `useEffect` avec `setInterval` pour polling
- `useState` pour data, loading
- Bouton "Rafraîchir" déclenche `fetchData()` et réinitialise le timer

------------------------------------------------------------------------

## 5. Phase 3 — Intégration DashboardWithFilters

### 5.1 Fichier à modifier

`units/dorevia-linky/components/DashboardWithFilters.tsx`

### 5.2 Modifications

1. **Import :**
   ```ts
   import { TresoreriePositionCardWithPolling } from "@/components/TresoreriePositionCardWithPolling";
   ```

2. **Insertion :** Placer la carte **en première position** dans la section `<section className="space-y-6">`, avant `TreasuryCardWithPolling`.

3. **Visibilité :** Option B actée (§2.5) — carte toujours visible en tête, pas de focus dédié.

4. **Condition d'affichage :**
   ```tsx
   {!isPosView && (
     <TresoreriePositionCardWithPolling
       tenantId={tenantId}
       companyId={selectedCompanyId}
     />
   )}
   ```
   
   Afficher la carte Trésorerie (Position) dès que `!isPosView` (toutes les vues sauf POS). Elle est l'ancre fixe du cockpit (§2.6).

### 5.3 Ordre final des cartes

1. **TresoreriePositionCardWithPolling** (nouvelle)
2. TreasuryCardWithPolling (Paiements)
3. FluxCashCardWithPolling (Cash)
4. BusinessCardWithPolling
5. TaxesCardWithPolling
6. … (reste inchangé)

------------------------------------------------------------------------

## 6. Phase 4 — Détails techniques

### 6.1 Interface TypeScript (données API)

Réutiliser l'interface existante de `TreasuryCardWithPolling` ou extraire dans un type partagé :

```ts
interface TreasuryPositionData {
  position?: {
    erp_balance?: number | null;
    validated_balance?: number;
    unvalidated_exposure?: number | null;
  };
  reconciliation_rate?: number | null;
  currency?: string;
  flags?: { large_delta?: boolean; sign_mismatch?: boolean; structural_delta?: boolean };
  generated_at?: string | null;
}
```

### 6.2 Gestion reconciliation_rate

L'API peut retourner `reconciliation_rate` en pourcentage (ex. 94) ou en ratio (0.94). Vérifier dans `app/api/treasury/route.ts` : le mapping fait `rawRate <= 1 ? rawRate * 100 : rawRate`, donc le front reçoit déjà un pourcentage. Utiliser directement `Math.round(rate)` pour l'affichage.

### 6.3 Multi-société

Voir §2.3. Ne pas inclure `company_id` si `companyId === null`.

### 6.4 Accessibilité

- `aria-label` sur le bouton Rafraîchir
- Tooltips sur les 3 métriques (title ou attribut dédié)
- Contraste suffisant pour les badges vigilance/tension

------------------------------------------------------------------------

## 7. Checklist de validation

- [ ] Carte pleine largeur
- [ ] 3 métriques affichées (Solde ERP si dispo, Position Vault, Taux)
- [ ] Mention "Au {date}" visible
- [ ] NO_DATA correctement détecté
- [ ] Pas de badge tension si absence de données
- [ ] 0 € réel ≠ NO_DATA
- [ ] États prioritaires respectés (NO_DATA > Tension > Vigilance > Normal)
- [ ] Mode dégradé fonctionnel (mention "Solde comptable : non configuré")
- [ ] Bouton Rafraîchir opérationnel
- [ ] Polling 10 min actif
- [ ] Test tenant configuré (laplatine2026)
- [ ] Test tenant sans Odoo
- [ ] Aucune régression dashboard

------------------------------------------------------------------------

## 8. Fichiers impactés (résumé)

| Action | Fichier |
|--------|---------|
| Créer | `components/TresoreriePositionCard.tsx` |
| Créer | `components/TresoreriePositionCardWithPolling.tsx` |
| Modifier | `components/DashboardWithFilters.tsx` |

**Aucune modification :** `app/api/treasury/route.ts`, Vault, IconGrid, ReportHeader.

------------------------------------------------------------------------

------------------------------------------------------------------------

**Fin du document — Plan v1.2**
