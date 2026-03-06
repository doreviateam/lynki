# Plan d'implémentation — Points de vente (Responsable Région) v1.1

**Version :** 1.1  
**Date :** 2026-02-22  
**Statut :** Implémenté (voir COMPTE_RENDU_Pos_Responsable_Region_v1.1_2026-02-22.md)  
**Référence :** ZeDocs/web29/SPEC_Pos_Responsable_Région_v1.0.md v1.1  
**Durée estimée :** 0,5–1 jour (2–3 h impl, 1 h tests, 30 min polish)  
**Stack :** Linky (Next.js / React)

---

## 1. Vue d'ensemble

| Sprint | Périmètre | Estimation | Livrable |
|--------|-----------|------------|----------|
| **Sprint unique** | POS Responsable Région Phase 1 | 0,5–1 j | Card conforme SPEC v1.1 |

**DoD :** Critères d'acceptation SPEC §10 validés. Aucune régression affichage existant. API pos-sessions inchangée.

---

## 2. État actuel vs cible

| Élément | Actuel | Cible (SPEC v1.1) |
|---------|--------|-------------------|
| En-tête | Titre + volume € | Titre + **badge verdict** (pas de volume en tête) |
| Ordre contenu | Volume → synthèse → détail | **Badge verdict** → synthèse → volume → détail |
| Bloc synthétique | X magasins • Y sessions • Z sécurisées • N en attente | Idem + verdict en amont |
| Verdict | Bordure verte si shops > 0 | OK / WARNING selon `unsealed_sessions` |
| unsealed_sessions | `pending` seulement | `pending` + `failed` + `missing` |
| Période | Héritée du header global (YTD, etc.) | **Today** par défaut pour cette card |
| Détail magasin | Volume en premier, sessions en dépliable | Sessions en clair (X sessions, ✔ Y sécurisées, ⚠ N non scellées), volume secondaire |

---

## 3. Tâches (ordre recommandé)

### Tâche 1 — Période = today

**Fichiers :** `PosShopsView.tsx`, `DashboardWithFilters.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 1.1 | Période today pour pos_shops | Quand `viewMode === "pos_shops"`, passer `period = { from: today, to: today }` à PosShopsView |
| 1.2 | Helper today | `const today = new Date().toISOString().slice(0, 10)` ou via `getPeriodFromKeyAndYear` si "today" existe |
| 1.3 | Alternative | Ou : PosShopsView accepte `forceToday?: boolean` et calcule `date_debut`/`date_fin` en interne si true |

**Recommandation :** `DashboardWithFilters` passe `period={ from: today, to: today }` quand `viewMode === "pos_shops"`. Simple, pas de prop supplémentaire.

**Critères :** Fetch pos-sessions utilise la date du jour quand la vue Points de vente est affichée.

---

### Tâche 2 — Calcul `unsealed_sessions` (pending + failed + missing)

**Fichier :** `units/dorevia-linky/components/PosShopsView.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 2.1 | Étendre agrégation | `aggregateByShop` et totaux : compter `pending` + `failed` + `missing` comme non scellées |
| 2.2 | API actuelle | `pending_sessions` côté API = sessions pending uniquement. Calculer `unsealed = total_sessions - sealed_sessions` côté client |
| 2.3 | Ou détailler | Parcourir `items[]`, compter ceux avec `vault_status ∈ {pending, failed, missing}` |

**Implémentation :**
```ts
const unsealedSessions = (data?.items ?? []).filter(
  (i) => i.vault_status !== "sealed"
).length;
// Ou : unsealedSessions = Math.max(0, totalSessions - totalSealed)
```
La deuxième formule est équivalente si l'API ne renvoie que sealed | pending (sans failed/missing dans les items). Vérifier le backend : si `total_sessions` inclut failed/missing, alors `unsealed = total - sealed`.

**Audit-proof :** Toujours utiliser `Math.max(0, totalSessions - totalSealed)` pour éviter un edge case négatif si l'API renvoie des données incohérentes.

**Critères :** `unsealed_sessions` inclut pending, failed, missing. Pas de session "orpheline" (ni sealed ni unsealed).

---

### Tâche 3 — Badge verdict global

**Fichier :** `units/dorevia-linky/components/PosShopsView.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 3.1 | Helper ou inline | `const verdict = unsealedSessions > 0 ? "WARNING" : "OK"` |
| 3.2 | Badge OK | "🟢 Région opérationnelle" — styles : `bg-[var(--positive)]/15 text-[var(--positive)]` ou pill `rounded-full` |
| 3.3 | Badge WARNING | "🟠 Session à sécuriser" — styles : `bg-amber-500/12 text-amber-700 dark:text-amber-300` ou `bg-orange-500/10 text-orange-600` |
| 3.4 | Positionnement | Badge **en tête** de la card, avant le bloc synthétique (SPEC §6) |

**Critères :** Verdict visible sans scroller. WARNING si ≥1 session non scellée. OK sinon.

---

### Tâche 4 — Hiérarchie visuelle (ordre contenu)

**Fichier :** `units/dorevia-linky/components/PosShopsView.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 4.1 | Ordre nouveau | 1. Badge verdict 2. Bloc synthétique 3. Volume régional (optionnel, secondaire) 4. Liste magasins |
| 4.2 | Retirer volume en-tête | Le volume total € ne doit pas être en tête (SPEC : volume secondaire). Le déplacer après le bloc synthétique ou le garder en bas de la synthèse |
| 4.3 | Bordure card | Remplacer `border-l-[var(--positive)]` conditionnel par `border-l` selon verdict : OK → vert, WARNING → orange |

**Structure cible :**
```
[En-tête : icône + "Points de vente"]
[Badge verdict]                    ← nouveau, en premier
X magasins actifs • Y sessions remontées • Z sécurisées • N en attente (si > 0)
[Volume total €]                    ← secondaire, plus petit ou intégré à la synthèse
[Liste magasins avec détail]
```

**Critères :** Verdict avant tout. Intégrité avant volume.

---

### Tâche 5 — Bloc détail par magasin (ordre et libellés)

**Fichier :** `units/dorevia-linky/components/PosShopsView.tsx`

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 5.1 | Ordre par magasin | Nom → volume € → X sessions → ✔ Y sécurisées → ⚠ N non scellées (si > 0) |
| 5.2 | unsealed par shop | `shop.unsealed = shop.total_sessions - shop.sealed_sessions` (inclut pending, failed, missing) |
| 5.3 | Libellé anomalie | "⚠ N non scellée(s)" au lieu de "N en attente" si on veut couvrir failed/missing |
| 5.4 | Cas nominal | Afficher "✔ X sécurisées" sans ligne warning si unsealed = 0 |
| 5.5 | Cas anomalie | Afficher "⚠ 1 non scellée" (ou "N non scellées") en style warning |

**aggregateByShop à étendre :**
```ts
unsealed_sessions: Math.max(0, total_sessions - sealed_sessions)  // pending+failed+missing ; évite négatif si API incohérente
```

**Critères :** Détail par magasin conforme SPEC §7. Pas de "session manquante" métier.

---

### Tâche 5bis — Micro-optimisations UX (post-implémentation)

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 5bis.1 | Volume avec label | « Volume total : » avant le montant régional |
| 5bis.2 | Badge design system | Pill `rounded-full px-2.5 py-1`, sans emoji (texte seul) |
| 5bis.3 | Invalid Date | `formatSessionTime()` — garde undefined/null/NaN, affiche « — » si date invalide |
| 5bis.4 | Tickets comptés | Dans détail magasin : « X ticket(s) compté(s) » |
| 5bis.5 | Panier moyen | Dans détail magasin : « Panier moyen : XX,XX € » (total_sales / total_sessions) |

---

### Tâche 6 — Edge cases et cas vides

| Sous-tâche | Action | Détail |
|------------|--------|--------|
| 6.1 | 0 magasins | Verdict OK (rien à sécuriser). Message "Aucun point de vente pour la période". |
| 6.2 | 0 sessions remontées | Verdict OK (0 unsealed). Bloc synthétique : "0 magasins actifs, 0 sessions remontées" |
| 6.3 | items vide mais total_sessions > 0 | Incohérence API rare ; traiter en défense : unsealed = total - sealed |

**Critères :** Aucun crash. Comportement cohérent pour tous les cas.

---

## 4. Fichiers impactés

| Fichier | Modifications |
|---------|---------------|
| `units/dorevia-linky/components/PosShopsView.tsx` | Verdict, hiérarchie, unsealed, détail magasin |
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | Passer period=today quand viewMode === "pos_shops" |

---

## 5. Dépendances

- Aucune modification backend. API `GET /ui/aggregations/pos-sessions` inchangée.
- Champs utilisés : `total_sessions`, `sealed_sessions`, `pending_sessions`, `items[]`. Le champ `pending_sessions` côté API peut ne pas inclure failed/missing ; dans ce cas, `unsealed = total_sessions - sealed_sessions` est la formule correcte (car tout ce qui n'est pas sealed est unsealed).

---

## 6. Tests manuels

| Scénario | Attendu |
|----------|---------|
| Toutes sessions scellées | Badge OK, "Région opérationnelle" |
| ≥1 session pending | Badge WARNING, "Session à sécuriser" |
| ≥1 session failed/missing | Badge WARNING |
| 0 magasins | Badge OK, message vide |
| 0 sessions | Badge OK, synthèse "0 sessions remontées" |
| Période | Fetch avec date du jour quand vue pos_shops |
| Ordre visuel | Verdict → synthèse → volume → détail |
| Détail magasin nominal | ✔ X sécurisées, pas de warning |
| Détail magasin anomalie | ⚠ N non scellées |
| Tickets comptés | Affiché dans détail dépliable |
| Panier moyen | Affiché si sessions > 0 |
| Dates invalides | formatSessionTime → « — » (pas d'Invalid Date) |

---

## 7. Estimation détaillée

| Phase | Durée | Détail |
|-------|-------|--------|
| Implémentation | 2–3 h | Tâches 1 à 5 |
| Tests manuels | 1 h | Scénarios §6 |
| Polish CSS | 30 min | Badges, couleurs, hiérarchie |

**Total :** 0,5–1 jour développeur.

---

## 8. Références

- SPEC : `ZeDocs/web29/SPEC_Pos_Responsable_Région_v1.0.md` v1.1
- Avis expert : `ZeDocs/web29/AVIS_EXPERT_SPEC_Pos_Responsable_Région_v1.0.md`
- Compte rendu : `ZeDocs/web29/COMPTE_RENDU_Pos_Responsable_Region_v1.1_2026-02-22.md`
- API sessions : `ZeDocs/web18/sessions.md`
- Structure POS : `ZeDocs/web20/SPEC_POS_STRUCTURE_LINKY_v1.0.md`

---

*Fin du document*
