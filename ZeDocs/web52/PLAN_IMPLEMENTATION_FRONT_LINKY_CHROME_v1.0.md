# Plan d’implémentation front — Chrome adaptatif Linky (spec v1.1 + v1.1.1)

**Date** : mars 2026  
**Référence** : `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.md` + `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.1.md`

**Objectif** : traduire la spec produit en plan d’exécution composant par composant, avec ordre de réalisation et points de validation.

---

## 1. Vue d’ensemble

### 1.1 Existant à réutiliser / faire évoluer

| Élément | Fichier / zone | État actuel |
|--------|----------------|-------------|
| Layout principal | `components/DashboardWithFilters.tsx` | Header + main + footer ; logique `chromeVisible` (bool), timer 3 s, scroll top 100 px, mousemove zone 72 px. |
| Header | `components/ReportHeader.tsx` | Sticky, pas d’états expanded/compact. |
| Footer | `components/LinkyFooter.tsx` | Fixe, toujours visible. |
| Contexte partagé | `app/context/ChartExpandedContext.tsx` | Exemple de pattern context + sessionStorage. |

### 1.2 Livrables cibles

| Livrable | Description | Spec |
|----------|-------------|------|
| **Constantes centralisées** | `nearTopThresholdPx`, cooldown, timers, breakpoints, zone trigger. | § 6, v1.1.1 |
| **Détection mode d’interaction** | Viewport + `(hover: hover)` + `(pointer: fine)` → desktop immersif / tablette / mobile. | § 7bis |
| **Machine d’états chrome** | `expanded` \| `compact` \| `hidden` \| `frozen`. | § 7ter |
| **Scroll root officiel** | Un seul scrollRoot (window ou conteneur), scrolls internes ignorés. | § 7octies |
| **Hystérésis / cooldown** | Delta cumulé > 24 px, cooldown 300–500 ms après transition. | § 5.2, § 7nonies |
| **État initial / hydratation** | Header toujours `expanded` au premier rendu ; mode évalué après montage client. | § 7decies |
| **Préférence chromePinned** | Session par défaut ; optionnel localStorage. | § 7quater, § 7undecies |
| **Convention data-chrome-lock** | Overlays (menu, select, drawer, modal) marqués pour mettre le chrome en `frozen`. | § 7ter |
| **Télémétrie UX** | Réouvertures header, chromePinned, temps par état, drawer trust bar, frozen. | § 7duodecies |
| **Comportement par device** | Desktop : hidden ; tablette : compact ; mobile : expanded ↔ compact (pas de hidden). | § 4, § 7bis |
| **Safe areas mobile** | `env(safe-area-inset-*)` sur header sticky et footer. | § 7sexies |
| **Footer mobile** | Version condensée + drawer “confiance” au tap (optionnel Phase 2). | § 4.3 |

---

## 2. Architecture proposée

### 2.1 Nouveaux modules

```
units/dorevia-linky/
├── app/
│   ├── context/
│   │   ├── ChartExpandedContext.tsx     (existant)
│   │   └── ChromeAdaptiveContext.tsx    (nouveau) — état chrome + préférence + frozen
│   ├── lib/
│   │   ├── chrome-constants.ts          (nouveau) — constantes spec
│   │   ├── chrome-device.ts             (nouveau) — matchMedia viewport + hover + pointer
│   │   ├── chrome-scroll.ts             (nouveau) — scrollRoot, direction, delta, nearTop
│   │   └── chrome-telemetry.ts          (nouveau) — événements UX (optionnel Phase 1)
│   └── ...
├── components/
│   ├── DashboardWithFilters.tsx         (refactor) — consomme ChromeAdaptiveContext, délègue logique
│   ├── ReportHeader.tsx                 (évol) — accepte état expanded/compact, classes CSS
│   ├── LinkyFooter.tsx                  (évol) — safe areas, version mobile compacte + drawer (Phase 2)
│   └── ChromeTriggerBar.tsx             (existant inline) — bandeau réapparition desktop, aria + focus
└── ...
```

### 2.2 Flux de données

- **ChromeAdaptiveContext** fournit : `chromeState`, `interactionMode`, `chromePinned`, `setChromePinned`, `setFrozen`, `revealChrome`, et (optionnel) `scrollRootRef`.
- **DashboardWithFilters** : enveloppe le cockpit avec `ChromeAdaptiveProvider` ; utilise le contexte pour afficher header/footer et appliquer les classes (maxHeight, transform, pt-main).
- **ReportHeader** : reçoit `chromeState` (ou dérive l’affichage du contexte) pour appliquer variante expanded/compact.
- **data-chrome-lock** : tout overlay (menu, select, modal, drawer) porte l’attribut ; un hook ou un effet observe le DOM ou un registre pour mettre `frozen` à true quand un tel nœud est “ouvert”.

---

## 3. Plan par phase

### Phase 1 — Fondations (spec + robustesse minimale)

Objectif : poser les constantes, le scroll root, l’état initial et la machine d’états sans encore différencier desktop/tablette/mobile.

| # | Tâche | Fichiers | Spec | Validation |
|---|-------|----------|------|------------|
| 1.1 | Créer `app/lib/chrome-constants.ts` avec toutes les constantes (nearTopThresholdPx = 100, cooldown 300–500 ms, CHROME_HIDE_AFTER_MS 4500, CHROME_TRIGGER_ZONE_PX 72, delta scroll min 24, breakpoints 768/1280). | `chrome-constants.ts` | § 6, v1.1.1 | Export utilisé par le reste du code. |
| 1.2 | Documenter le **scrollRoot** : décision “scrollRoot = window” (ou conteneur unique du layout) ; s’assurer qu’aucun listener de scroll ne soit attaché aux scrolls internes de cards. | Commentaires / doc dans `chrome-scroll.ts` ou `DashboardWithFilters` | § 7octies | Un seul endroit où on lit scrollTop/scrollY. |
| 1.3 | Créer `app/lib/chrome-scroll.ts` : helper(s) pour lire la position du scrollRoot (window), direction, delta cumulé, et “isNearTop” (position ≤ nearTopThresholdPx). | `chrome-scroll.ts` | § 5.2, § 7octies | Réutilisable par le contexte. |
| 1.4 | Introduire la **machine d’états** : type `ChromeState = 'expanded' | 'compact' | 'hidden' | 'frozen'`. Remplacer le booléen `chromeVisible` par un état dérivé (ex. “visible” = expanded ou compact, “hidden” = hidden). | `ChromeAdaptiveContext` (nouveau) ou refactor dans `DashboardWithFilters` | § 7ter | Transitions desktop : expanded → hidden ; tablette/mobile : expanded → compact (Phase 2). |
| 1.5 | **État initial** : au premier rendu, état = `expanded` ; pas de passage à hidden/compact avant le premier “mount” client (useEffect). | Provider ou layout | § 7decies | Pas de flash au chargement. |
| 1.6 | **Hystérésis** : réapparition seulement si direction = haut, delta cumulé > 24 px, et position ≤ nearTopThresholdPx ; après toute transition du chrome, appliquer un cooldown (ex. 400 ms) avant de permettre une nouvelle transition. | Contexte ou hook dédié | § 7nonies | Pas d’accordéon sur micro-scrolls. |

**Livrable Phase 1** : constantes, scroll root documenté et utilisé, état initial expanded, machine d’états en place, hystérésis + cooldown opérationnels sur le comportement actuel (desktop).

---

### Phase 2 — Mode d’interaction (desktop / tablette / mobile)

Objectif : différencier les comportements selon viewport + hover + pointer.

| # | Tâche | Fichiers | Spec | Validation |
|---|-------|----------|------|------------|
| 2.1 | Créer `app/lib/chrome-device.ts` : `useInteractionMode()` qui combine largeur viewport (1280 / 768), `matchMedia('(hover: hover)')`, `matchMedia('(pointer: fine)')` et retourne `'desktop' | 'tablet' | 'mobile'`. Desktop immersif uniquement si largeur ≥ 1280 ET hover ET pointer fine. | `chrome-device.ts` | § 7bis | iPad Pro 1366 px → tablette, pas desktop. |
| 2.2 | Brancher le mode dans le contexte : selon `interactionMode`, appliquer expanded → hidden (desktop) ou expanded → compact (tablette/mobile). Sur mobile, ne jamais passer en hidden. | `ChromeAdaptiveContext` | § 4, § 7bis | Comportement cohérent par device. |
| 2.3 | **ReportHeader** : accepter une prop ou un style “compact” (hauteur réduite, moins de lignes, badge période conservé). À défaut de design compact dédié, garder le même header pour Phase 2 et ne faire que hidden sur desktop. | `ReportHeader.tsx` | § 4.2, § 4.3 | Tablette/mobile : contraction visuelle (ou identique à aujourd’hui en attente maquette). |
| 2.4 | Désactiver la réapparition par **hover** sur tablette/mobile (seulement scroll top + tap bandeau). | Contexte / listeners | § 5.3 | Pas de dépendance au hover hors desktop. |

**Livrable Phase 2** : mode d’interaction déterminé ; desktop = disparition ; tablette/mobile = contraction ou persistance ; hover utilisé uniquement sur desktop.

---

### Phase 3 — Frozen et préférence utilisateur

Objectif : état frozen (data-chrome-lock) et option “garder le bandeau visible”.

| # | Tâche | Fichiers | Spec | Validation |
|---|-------|----------|------|------------|
| 3.1 | **Frozen** : exposer dans le contexte `setFrozen(true | false)` ou un registre “lock”. Quand un overlay avec `data-chrome-lock="true"` est ouvert (menu, select, modal, drawer), appeler setFrozen(true) ; à la fermeture, setFrozen(false). | `ChromeAdaptiveContext`, composants qui ouvrent overlay | § 7ter | Timers suspendus quand filtre/menu ouvert. |
| 3.2 | Marquer les overlays existants : ReportHeader (menu), selects période/société, éventuels modals/drawers, avec `data-chrome-lock="true"`. Ou fournir un hook `useChromeLock(open: boolean)`. | ReportHeader, DashboardWithFilters, etc. | § 7ter | Une seule convention. |
| 3.3 | **chromePinned** : état dans le contexte ; par défaut **session** (useState ou ref qui ne persiste pas). Optionnel : clé localStorage pour persistance. Si chromePinned = true, pas de passage à hidden ni compact automatique. | `ChromeAdaptiveContext` | § 7quater, § 7undecies | Démo / formation : header reste visible. |
| 3.4 | UI pour activer/désactiver “Garder le bandeau visible” (ex. dans le menu header ou paramètres). | ReportHeader ou menu | § 7quater | Utilisateur peut épingler. |

**Livrable Phase 3** : frozen opérationnel via data-chrome-lock (ou hook) ; chromePinned en session (et optionnel localStorage) ; UI d’épingle si souhaité.

---

### Phase 4 — Safe areas, footer mobile, accessibilité

Objectif : mobile confortable et accessible.

| # | Tâche | Fichiers | Spec | Validation |
|---|-------|----------|------|------------|
| 4.1 | **Safe areas** : header sticky et footer appliquent `padding-top: env(safe-area-inset-top)` et `padding-bottom: env(safe-area-inset-bottom)` (ou équivalent). | ReportHeader, LinkyFooter, CSS | § 7sexies | Pas de recouvrement encoche / barre iPhone. |
| 4.2 | **Clavier mobile** : quand un input/select a le focus sur mobile, suspendre les transitions du chrome (ex. considérer comme “frozen” ou flag dédié). | Contexte ou hook focus | § 7sexies | Pas de saut pendant la saisie. |
| 4.3 | **Footer mobile** : version une ligne compacte (“Vault ✓ 1307 \| Odoo ✓ \| POS ✓”) ; au tap, ouvrir un drawer/panneau “confiance système”. | `LinkyFooter.tsx` | § 4.3 | Mobile : footer condensé + détail au tap. |
| 4.4 | **Zone de réapparition** (desktop, header masqué) : focusable au clavier, aria-label “Afficher le bandeau”. | Bandeau trigger (ex. ChromeTriggerBar) | § 7 | Navigation clavier OK. |
| 4.5 | **prefers-reduced-motion** : si activé, désactiver ou réduire auto-hide / transitions (optionnel Phase 1). | Contexte ou CSS | § 7 | Accessibilité mouvement. |

**Livrable Phase 4** : safe areas, clavier mobile géré, footer mobile compact + drawer, bandeau focusable, reduced-motion si implémenté.

---

### Phase 5 — Télémétrie UX (optionnel)

Objectif : mesurer l’usage pour ajuster timers et comportements.

| # | Tâche | Fichiers | Spec | Validation |
|---|-------|----------|------|------------|
| 5.1 | Créer `app/lib/chrome-telemetry.ts` : fonctions ou hook pour envoyer (ou buffer) les événements : header_reveal_manual, chrome_pinned_toggle, time_in_state (expanded/compact/hidden), trust_drawer_open (mobile), frozen_enter (overlay ouvert). | `chrome-telemetry.ts` | § 7duodecies | Événements émis aux bons endroits. |
| 5.2 | Brancher les appels dans le contexte et les composants (révélation manuelle, changement d’état, ouverture drawer, setFrozen). | Contexte, LinkyFooter, etc. | § 7duodecies | Données exploitables. |

**Livrable Phase 5** : pipeline télémétrie minimal prêt (sans forcément envoyer à un backend dans un premier temps).

---

## 4. Ordre d’exécution recommandé

1. **Phase 1** (fondations) — sans elle, le reste est fragile.
2. **Phase 2** (mode d’interaction) — nécessaire pour respecter “desktop : disparition ; tablette : contraction ; mobile : persistance”.
3. **Phase 3** (frozen + chromePinned) — évite les mauvaises surprises (masquage pendant sélection, besoin démo).
4. **Phase 4** (safe areas, footer mobile, a11y) — améliore fortement la perception sur mobile et l’accessibilité.
5. **Phase 5** (télémétrie) — en parallèle ou après, selon priorité produit.

---

## 5. Fichiers à créer / modifier (résumé)

| Fichier | Action |
|---------|--------|
| `app/lib/chrome-constants.ts` | Créer |
| `app/lib/chrome-device.ts` | Créer |
| `app/lib/chrome-scroll.ts` | Créer |
| `app/lib/chrome-telemetry.ts` | Créer (Phase 5) |
| `app/context/ChromeAdaptiveContext.tsx` | Créer |
| `components/DashboardWithFilters.tsx` | Refactor : consommer contexte, scrollRoot unique, constantes, cooldown, état initial expanded. |
| `components/ReportHeader.tsx` | Évoluer : état expanded/compact si design prêt ; data-chrome-lock sur menu/overlays. |
| `components/LinkyFooter.tsx` | Évoluer : safe areas ; version mobile compacte + drawer (Phase 4). |
| Bandeau réapparition (desktop) | Extraire en composant si besoin ; aria-label + focus clavier. |
| Overlays (menu, select, modal) | Ajouter `data-chrome-lock="true"` ou utiliser `useChromeLock`. |

---

## 6. Tests et recette

- **Desktop** : header disparaît après 4,5 s ; réapparition au scroll near top (delta > 24 px), hover zone haute, focus bandeau ; pas de réapparition en scrollant dans une grande card.
- **Tablette (ou desktop sans hover)** : pas de disparition complète ; contraction après 5 s ; pas de réapparition au hover.
- **Mobile** : pas de disparition ; expanded ↔ compact au scroll ; footer compact + drawer au tap ; safe areas visibles.
- **Frozen** : ouvrir un select ou un menu → le header ne se masque pas / ne se contracte pas.
- **chromePinned** : activer “Garder le bandeau” → plus de masquage ni contraction automatique.
- **Hydratation** : pas de flash au premier chargement ; état expanded au départ.
- **Cooldown** : micro-scrolls ne provoquent pas d’accordéon.

---

## 7. Références spec

- Comportement par device : spec v1.1 § 4, § 8.
- Règles de scroll : spec v1.1 § 5 ; v1.1.1 § 7nonies.
- Mode d’entrée : spec v1.1 § 7bis.
- Machine d’états : spec v1.1 § 7ter.
- Scroll root : spec v1.1.1 § 7octies.
- État initial : spec v1.1.1 § 7decies.
- chromePinned : spec v1.1 § 7quater, v1.1.1 § 7undecies.
- Télémétrie : spec v1.1.1 § 7duodecies.
- Constantes : spec v1.1 § 6, v1.1.1 (nearTopThresholdPx, cooldown).

---

**Version** : 1.0  
**Statut** : Remplacé par **v1.1** pour l’exécution. Voir `PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.1.md` (décisions verrouillées, Phase 0, 1A/1B, frozen minimal, scrollRoot = window, useChromeLock, compact minimal, DoD par phase, télémétrie avec cause de révélation).
