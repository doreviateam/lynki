# Plan d'implémentation — Business Card v2

**Version :** 1.2  
**Date :** 2026-02-22  
**Référence :** ZeDocs/web29/SPEC_Business_Card_v2.md v2.1  
**Durée estimée :** 0,5–1 jour (2–3 h impl, 1–2 h tests, 1 h polish CSS, 30 min edge cases)  
**Stack :** Linky (Next.js / React)

---

## 1. Vue d'ensemble

| Sprint | Périmètre | Estimation | Livrable |
|--------|-----------|------------|----------|
| **Sprint unique** | Business Card v2 | 0,5–1 j | Blocs A, B, C conformes SPEC v2.1 |

**DoD :** Critères d'acceptation SPEC §11 validés. Aucune régression affichage existant. Aucun impact polling.

---

## 2. État actuel vs cible

| Élément | Actuel | Cible (SPEC v2.1) |
|---------|--------|-------------------|
| En-tête | Net (marge) | Marge brute + Taux de marge |
| Bloc ventes/achats | Ventes HT, Achats HT | Idem + Taux de marge (si ventes > 0) |
| Bloc AR | ArByPartnerSection (tableaux dépliables) | Bloc synthétique (3 lignes) + tableaux existants |
| Badge | Aucun | Marge sécurisée / Risque concentré / Marge partiellement exposée |
| freshness unknown | Non géré explicitement | Message « Données AR non exploitables » |
| multi-devise | Non affiché | « Factures non-EUR exclues (P0) » |

---

## 3. Tâches (ordre recommandé)

### Tâche 1 — Bloc A : Taux de marge

**Fichier :** `units/dorevia-linky/components/BusinessCard.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 1.1 | Calculer taux_marge | `taux_marge = ventes_ht > 0 ? (marge_brute / ventes_ht) : null` |
| 1.2 | Afficher "Taux de marge : Y %" | Si ventes > 0, après "Marge brute". Arrondi 1 décimale. |
| 1.3 | Cas taux négatif | Couleur neutre (`text-[var(--text)]` ou `text-[var(--text-secondary)]`), pas rouge auto |
| 1.4 | Cas ventes == 0 | Taux non affiché (déjà couvert par condition) |
| 1.5 | **Edge case arrondi** | Si `Math.abs(taux) < 0.05` → afficher « 0.0 % ». Évite `-0.0000003 %` (artefacts JS) |

**Critères :** Marge brute inchangée. Taux affiché si ventes > 0. Taux négatif visible, couleur neutre. Pas de micro-valeurs aberrantes.

---

### Tâche 2 — Bloc B : Section AR synthétique

**Fichier :** `units/dorevia-linky/components/BusinessCard.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 2.1 | Calculer overdue_concentration | `max(partner.overdue_amount) / totals.overdue_amount` avec gardes : (1) `if (!totals?.overdue_amount || totals.overdue_amount <= 0) return 0` ; (2) partners vide mais overdue_amount > 0 → concentration = 0 (ne pas crasher) |
| 2.2 | Calculer concentration AR (Z) | `Z = 100 * maxOverdue / totals.overdue_amount` (même garde) |
| 2.3 | Créer bloc synthétique | 3 lignes : Encours client, Dont en retard, Concentration AR (si Z > 0) |
| 2.4 | Positionnement | Bloc synthétique AVANT les tableaux dépliables (Encours, Clients à risque) |

**Critères :** Bloc synthétique visible si open_amount > 0 et freshness != unknown. Concentration AR masquée si overdue_amount == 0.

---

### Tâche 3 — Bloc B : Règles d'affichage (freshness, multi-devise)

**Fichier :** `units/dorevia-linky/components/BusinessCard.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 3.1 | freshness == unknown | **Bloc AR remplacé** par un message dans le **même espace** : « Données AR non exploitables pour cette période ». Cohérence spatiale, pas de message orphelin ailleurs dans la card. |
| 3.2 | open_amount == 0 | Bloc AR masqué (déjà le cas pour Clients à risque ; étendre à tout le bloc si pas d'encours) |
| 3.3 | meta.warnings multi_currency | Si `meta.warnings?.includes("multi_currency_ignored_p0")` → afficher « Factures non-EUR exclues (P0) ». **Edge case :** afficher même si `open_amount == 0` (toutes factures non-EUR exclues P0 → utilisateur doit comprendre pourquoi AR = 0) |
| 3.4 | freshness == snapshot | Badge conservé « Donnée snapshot » (existant) |

**Critères :** Message freshness unknown dans l'espace du bloc AR. Warning multi-devise visible même quand open_amount = 0.

---

### Tâche 4 — Bloc C : Badge signal de risque

**Fichier :** `units/dorevia-linky/components/BusinessCard.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 4.1 | Logique badge | Basée sur overdue_concentration (pas share_percent) |
| 4.2 | overdue_amount == 0 | Badge vert « Marge sécurisée » |
| 4.3 | overdue_amount > 0 ET concentration >= 50 % | Badge orange « Risque concentré » (utiliser `CONCENTRATION_THRESHOLD = 0.5`) |
| 4.4 | overdue_amount > 0 ET concentration < 50 % | Badge orange léger « Marge partiellement exposée » |
| 4.5 | **Positionnement (UX)** | Badge **juste après bloc synthétique**, AVANT les tableaux dépliables. Hiérarchie : Marge → Taux → Bloc synthétique AR → **Badge** → Tableaux détaillés. Sinon le badge devient secondaire visuellement. |
| 4.6 | **Règle critique** | Badge affiché **uniquement si bloc AR visible**. Si `open_amount == 0` → bloc masqué → **pas de badge**. Ne pas afficher « Marge sécurisée » orphelin. |

**Styles suggérés :**
- Vert : `bg-[var(--positive)]/15 text-[var(--positive)]` ou équivalent palette Linky
- Orange : `bg-orange-500/15 text-orange-600 dark:text-orange-400`
- Orange léger : `bg-orange-500/10 text-orange-600/80`

**Critères :** Badge cohérent avec overdue_concentration. Pas d'utilisation de share_percent.

---

### Tâche 5 — Helper `computeARRisk` + composant `RiskBadge` (recommandé)

**Objectif :** Éviter 8 conditions inline. Logique testable. Découplage UI / métier.

**Signature complète (défensive) :**

```ts
type RiskLevel = "none" | "secured" | "concentrated" | "partial";

function computeARRisk(arData?: ArByPartnerResponse): {
  overdueConcentration: number;
  riskLevel: RiskLevel;
}
```

| Sous-tâche | Action |
|------------|--------|
| 5.1 | `riskLevel = "none"` si arData absent, freshness unknown, ou open_amount == 0. UI décide : `if (riskLevel === "none") return null;` |
| 5.2 | Constante `CONCENTRATION_THRESHOLD = 0.5` (pas de magic number) pour seuil concentré / partiel |
| 5.3 | Créer composant `RiskBadge level={riskLevel}` pour affichage conditionnel |
| 5.4 | Utiliser : `const { overdueConcentration, riskLevel } = computeARRisk(arData)` puis `<RiskBadge level={riskLevel} />` |

**Logique métier finale (validée) :**

```
Si pas de data           → none    ← en premier, avant toute logique badge
Si open_amount == 0      → none    ← zéro badge orphelin par construction
Si overdue_amount == 0   → secured
Sinon :
  concentration >= threshold → concentrated
  sinon                      → partial
```

*Important :* Les cas `none` doivent être traités **en tête** dans computeARRisk, avant toute branche badge. Garantit qu'aucun badge orphelin ne puisse s'afficher.

Simple. Stable. Testable. Audit-proof.

**Rationale :** `"none"` évite de coupler logique UI et logique métier. Helper centralise la logique.

---

### Tâche 6 — Tests manuels et régression

| Vérification | Scénario |
|--------------|----------|
| Marge positive, taux positif | Vérifier affichage |
| Marge négative, taux négatif | Couleur neutre, pas rouge |
| Ventes = 0 | Taux non affiché |
| open_amount = 0 | Bloc AR masqué |
| freshness = unknown | Message « Données AR non exploitables » |
| freshness = snapshot | Badge « Donnée snapshot » |
| overdue_amount = 0 | Badge « Marge sécurisée », pas de ligne Concentration AR |
| overdue concentré (1 partenaire > 50 %) | Badge « Risque concentré » |
| overdue dispersé | Badge « Marge partiellement exposée » |
| meta.warnings multi_currency | « Factures non-EUR exclues (P0) » |
| multi_currency + open_amount = 0 | Warning affiché malgré bloc vide (toutes factures exclues) |
| Badge orphelin | open_amount = 0 → bloc masqué → pas de badge |
| **partners vide, overdue > 0** | Ne pas crasher. concentration = 0. Badge « Marge partiellement exposée » (dispersé). |
| Polling | Comportement inchangé (BusinessCardWithPolling) |

---

## 4. Fichiers impactés

| Fichier | Modifications |
|---------|---------------|
| `units/dorevia-linky/components/BusinessCard.tsx` | Blocs A, B, C |
| `units/dorevia-linky/app/types/aggregations.ts` | Vérifier si `meta.warnings` typé (ArByPartnerMeta) |

---

## 5. Performance

Aucun risque majeur. Point d'attention :

- **Concentration AR** : encapsuler le calcul dans `useMemo`. Dépendances fines (évite recalc si `partners` recréé par polling sans changement de montants) :
  ```ts
  const { overdueConcentration, riskLevel } = useMemo(
    () => computeARRisk(arData),
    [
      totals?.overdue_amount,
      partners?.map((p) => p.overdue_amount).join("|"),
    ]
  );
  ```
  *Rationale :* Nouvelle référence `partners` à chaque poll → sans join, recalc systématique. Avec join, recalc uniquement si montants modifiés. Micro-polish propre si polling fréquent.

  *Note évolution :* Si logique future basée sur `open_amount` (et pas seulement `overdue_amount`), inclure aussi ces valeurs dans la clé de dépendance (ex. `totals?.open_amount`, `partners?.map(p => p.open_amount).join("|")`).

---

## 6. Dépendances

- Aucune modification backend (Vault, dashboard-metrics, ar-by-partner).
- Données `ar_by_partner` déjà fournies par `BusinessCardWithPolling` (fetch `/api/ar-by-partner`).
- `partners[].overdue_amount` déjà présent dans la réponse agrégation.

---

## 7. Estimation détaillée

| Phase | Durée | Détail |
|-------|-------|--------|
| Implémentation | 2–3 h | Blocs A, B, C + helper computeARRisk |
| Tests manuels | 1–2 h | Scénarios plan §3 Tâche 6 |
| Polish CSS | 1 h | Badges, couleurs, hiérarchie visuelle |
| Edge cases | 30 min | Guards, arrondis, multi-devise, freshness |

**Total :** 0,5–1 jour développeur.

---

## 8. Références

- SPEC : `ZeDocs/web29/SPEC_Business_Card_v2.md` v2.1
- Avis expert : `ZeDocs/web29/AVIS_EXPERT_SPEC_Business_Card_v2.md`
- Compte rendu AR : `ZeDocs/web28/COMPTE_RENDU_AR_BY_PARTNER_Sprint1_2026-02-22.md`
- Agrégation AR : `ZeDocs/web28/SPEC_Vault_UI_Aggregations_AR_by_Partner_v1.0.1.md`

---

*Fin du document*
