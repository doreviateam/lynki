# Plan d’implémentation front — Chrome adaptatif Linky v1.1 (consolidé)

**Date** : mars 2026  
**Référence** : `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.md` + `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.1.md`  
**Remplace** : `PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.0.md` pour l’exécution.

**Objectif** : plan exécutable avec décisions verrouillées, frozen remonté en Phase 1B, scrollRoot fixé à `window`, hook `useChromeLock(open)` (pas d’observer DOM), compact header minimal normatif, et Definition of Done UX par phase.

---

## Phase 0 — Décisions verrouillées (avant de coder)

À fixer noir sur blanc avant toute implémentation :

| Décision | Choix v1 | Note |
|----------|----------|------|
| **scrollRoot** | **`window`** | Pas d’abstraction conteneur ; scrolls internes de cards explicitement ignorés. |
| **chromePinned** | Portée **session** par défaut | Optionnel : localStorage si le produit le demande plus tard. |
| **Compact header** | **Version minimale normatif** (voir § ci-dessous) | Pas d’attente maquette complète ; Phase 2 débloquable. |
| **frozen** | **Activable par hook** `useChromeLock(open)` en priorité | `data-chrome-lock="true"` reste la convention documentaire sur les overlays. Pas d’observation DOM pour le comportement. |
| **Footer mobile drawer** | **Pas en Phase 2** | Phase 4 uniquement ; éviter l’éparpillement. |

### Compact header minimal (normatif)

Pour Phase 2, sans redesign bloquant :

- **Hauteur réduite**, **une seule ligne**.
- **Badge période conservé**.
- **Filtres secondaires masqués** (société, vue, etc. dans un menu ou repliés).
- **Pas de second niveau d’actions** dans le bandeau compact.

Objectif : valider le comportement tablette/mobile même sans maquette finale.

---

## 1. Vue d’ensemble

### 1.1 Existant à réutiliser

| Élément | Fichier | État actuel |
|--------|---------|-------------|
| Layout | `components/DashboardWithFilters.tsx` | `chromeVisible` (bool), timer 3 s, scroll top 100 px, mousemove zone 72 px. |
| Header | `components/ReportHeader.tsx` | Sticky, pas d’états expanded/compact. |
| Footer | `components/LinkyFooter.tsx` | Fixe, toujours visible. |
| Contexte | `app/context/ChartExpandedContext.tsx` | Pattern context + sessionStorage. |

### 1.2 Principes d’architecture

- **ChromeAdaptiveContext** : reste **sobre** ; il orchestre les états et appelle les helpers ; les **règles calculatoires** restent dans `chrome-device.ts` et `chrome-scroll.ts`.
- **Bandeau de réapparition** (desktop) : **extraire en composant dédié** (ex. `ChromeTriggerBar.tsx`) pour focus clavier, aria-label, hover, tests isolés.
- **frozen** : support **minimal dans le contexte dès Phase 1B** ; industrialisation via **`useChromeLock(open)`** en Phase 3 (pas d’observer DOM).

---

## 2. Architecture des modules

```
units/dorevia-linky/
├── app/
│   ├── context/
│   │   └── ChromeAdaptiveContext.tsx    — état chrome, frozen, chromePinned, revealChrome (orchestration)
│   ├── lib/
│   │   ├── chrome-constants.ts          — constantes (nearTopThresholdPx, cooldown, timers, breakpoints)
│   │   ├── chrome-device.ts             — useInteractionMode() (viewport + hover + pointer)
│   │   ├── chrome-scroll.ts             — scroll sur window : position, direction, delta, isNearTop
│   │   └── chrome-telemetry.ts          — Phase 5 ; inclure cause de révélation
│   └── ...
├── components/
│   ├── DashboardWithFilters.tsx         — consomme contexte, délègue logique
│   ├── ReportHeader.tsx                 — états expanded/compact (compact minimal Phase 2)
│   ├── LinkyFooter.tsx                  — safe areas ; mobile compact + drawer (Phase 4)
│   └── ChromeTriggerBar.tsx             — bandeau réapparition desktop (aria, focus, hover)
└── ...
```

**scrollRoot** : partout où on lit le scroll, utiliser **uniquement `window`** (ou `document.documentElement`). Aucun listener sur les scrolls internes de cards/panels.

---

## 3. Plan par phase (séquencement recommandé)

### Phase 1A — Socle technique

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 1A.1 | Créer `chrome-constants.ts` : nearTopThresholdPx = 100, cooldown 300–500 ms (ex. 400), CHROME_HIDE_AFTER_MS 4500, CHROME_TRIGGER_ZONE_PX 72, delta scroll min 24, breakpoints 768 / 1280. | `app/lib/chrome-constants.ts` | § 6, v1.1.1 |
| 1A.2 | **Verrouiller scrollRoot = window** : documenter dans le code et dans `chrome-scroll.ts` que le scroll observé est uniquement `window` ; aucun listener sur scrolls internes. | `chrome-scroll.ts`, commentaires | § 7octies |
| 1A.3 | Créer `chrome-scroll.ts` : helpers pour position (window), direction, delta cumulé, isNearTop(position ≤ nearTopThresholdPx). | `app/lib/chrome-scroll.ts` | § 5.2, § 7octies |
| 1A.4 | Introduire la **machine d’états** : type `ChromeState = 'expanded' | 'compact' | 'hidden' | 'frozen'`. Remplacer le booléen `chromeVisible` par état dérivé. | `ChromeAdaptiveContext.tsx` | § 7ter |
| 1A.5 | **État initial** : au premier rendu, état = `expanded` ; pas de transition vers hidden/compact avant montage client (useEffect). | Provider / layout | § 7decies |
| 1A.6 | **Hystérésis + cooldown** : réapparition si direction = haut, delta > 24 px, position ≤ nearTopThresholdPx ; cooldown (ex. 400 ms) après toute transition avant nouvelle transition. | Contexte ou hook | § 7nonies |

**DoD Phase 1A (Definition of Done — UX)**  
- [ ] Aucun flash visible au chargement.  
- [ ] Aucune oscillation sur micro-scroll.  
- [ ] Aucune réapparition parasite en lecture longue (grande card).  
- [ ] Comportement identique sur au moins deux vues cockpit représentatives.

---

### Phase 1B — Verrouillage minimal de `frozen`

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 1B.1 | Exposer dans le contexte **`setFrozen(true | false)`** (ou registre de lock). Quand `frozen === true`, **aucun timer** de masquage ou de contraction ne s’exécute. | `ChromeAdaptiveContext.tsx` | § 7ter |
| 1B.2 | Ne pas encore brancher tous les overlays ; possibilité de tester en forçant `setFrozen(true)` manuellement ou depuis un seul composant (ex. menu header). | — | — |

**DoD Phase 1B**  
- [ ] Si frozen = true (test manuel ou via un overlay), le header ne se masque pas et ne se contracte pas.  
- [ ] À la fermeture (frozen = false), le comportement reprend normalement.

---

### Phase 2 — Mode d’interaction (desktop / tablette / mobile)

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 2.1 | Créer `chrome-device.ts` : **`useInteractionMode()`** → `'desktop' | 'tablet' | 'mobile'` (largeur 1280/768 + `(hover: hover)` + `(pointer: fine)`). Desktop immersif uniquement si largeur ≥ 1280 **ET** hover **ET** pointer fine. | `app/lib/chrome-device.ts` | § 7bis |
| 2.2 | Brancher le mode dans le contexte : desktop → expanded → hidden ; tablette/mobile → expanded → compact. **Mobile : jamais hidden.** | `ChromeAdaptiveContext.tsx` | § 4, § 7bis |
| 2.3 | **Compact header minimal** : ReportHeader accepte état `compact` ; affichage normatif (hauteur réduite, une ligne, badge période, filtres secondaires masqués, pas de second niveau). | `ReportHeader.tsx` | § 4.2, § 4.3 |
| 2.4 | Réapparition par **hover** uniquement sur desktop ; sur tablette/mobile, seulement scroll top + tap bandeau. | Contexte / listeners | § 5.3 |
| 2.5 | **Extraire le bandeau de réapparition** en composant **`ChromeTriggerBar`** (desktop, header masqué) : focusable, aria-label “Afficher le bandeau”, onMouseEnter → revealChrome. | `components/ChromeTriggerBar.tsx` | § 7 |

**DoD Phase 2**  
- [ ] iPad Pro (largeur type 1366 px) → mode **tablette**, jamais desktop immersif.  
- [ ] Mobile → header **jamais** en hidden.  
- [ ] Hover n’a **aucun effet** sur tactile (tablette/mobile).  
- [ ] Bandeau réapparition : focus clavier OK, aria-label présent.

---

### Phase 3 — Industrialisation UX (frozen + chromePinned)

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 3.1 | Créer le hook **`useChromeLock(open: boolean)`** : quand `open === true`, appeler `setFrozen(true)` ; quand `open === false`, `setFrozen(false)`. Les composants qui ouvrent un overlay (menu, select, modal, drawer) utilisent ce hook. | `ChromeAdaptiveContext` ou module dédié | § 7ter |
| 3.2 | Marquer les overlays avec **`data-chrome-lock="true"`** (convention documentaire) et brancher **`useChromeLock`** dans ReportHeader (menu), selects période/société, modals/drawers existants. | ReportHeader, DashboardWithFilters, etc. | § 7ter |
| 3.3 | **chromePinned** : état dans le contexte ; portée **session** par défaut. Si `chromePinned === true`, pas de passage à hidden ni compact automatique. | `ChromeAdaptiveContext.tsx` | § 7quater, § 7undecies |
| 3.4 | UI “Garder le bandeau visible” (menu header ou paramètres) pour activer/désactiver chromePinned. | ReportHeader ou menu | § 7quater |

**DoD Phase 3**  
- [ ] Ouverture d’un select ou du menu header → header ne se masque pas / ne se contracte pas.  
- [ ] Activer “Garder le bandeau” → plus de masquage ni contraction automatique pour la session.

---

### Phase 4 — Mobile propre (safe areas, footer, accessibilité)

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 4.1 | **Safe areas** : header sticky et footer avec `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`. | ReportHeader, LinkyFooter, CSS | § 7sexies |
| 4.2 | **Clavier mobile** : quand un input/select a le focus sur mobile, suspendre les transitions du chrome (frozen ou flag dédié). | Contexte ou hook | § 7sexies |
| 4.3 | **Footer mobile** : une ligne compacte ; au tap, ouvrir drawer/panneau “confiance système”. | `LinkyFooter.tsx` | § 4.3 |
| 4.4 | **prefers-reduced-motion** : désactiver ou réduire auto-hide / transitions si activé. | Contexte ou CSS | § 7 |

**DoD Phase 4**  
- [ ] Sur iPhone (ou simulateur), pas de recouvrement encoche / barre d’accueil.  
- [ ] Saisie dans un champ sur mobile : pas de saut du header/footer.  
- [ ] Footer mobile : ligne compacte + ouverture drawer au tap.

---

### Phase 5 — Télémétrie UX (optionnel)

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 5.1 | Créer `chrome-telemetry.ts` : événements **avec cause de révélation** quand le header réapparaît : `hover` \| `scroll_up` \| `focus` \| `tap_trigger` \| `manual_pin`. Plus : header_reveal_manual, chrome_pinned_toggle, time_in_state, trust_drawer_open, frozen_enter. | `app/lib/chrome-telemetry.ts` | § 7duodecies |
| 5.2 | Brancher les appels dans le contexte et les composants (révélation avec cause, changement d’état, drawer, setFrozen). | Contexte, ChromeTriggerBar, LinkyFooter | § 7duodecies |

**DoD Phase 5**  
- [ ] Chaque révélation du header est associée à une cause (hover, scroll_up, focus, tap_trigger, manual_pin).  
- [ ] Données exploitables pour ajuster timers et comportements.

---

## 4. Ordre d’exécution recommandé

1. **Phase 0** — Lire et valider les décisions verrouillées.  
2. **Phase 1A** — Socle technique (constantes, scrollRoot = window, chrome-scroll, état initial, machine d’états, hystérésis + cooldown).  
3. **Phase 1B** — Support minimal de `frozen` dans le contexte.  
4. **Phase 2** — Mode d’interaction, compact minimal, bandeau extrait.  
5. **Phase 3** — `useChromeLock(open)`, marquage overlays, chromePinned, UI d’épingle.  
6. **Phase 4** — Safe areas, clavier mobile, footer mobile + drawer, reduced-motion.  
7. **Phase 5** — Télémétrie (si le temps le permet), avec cause de révélation.

---

## 5. Fichiers à créer / modifier (résumé)

| Fichier | Action |
|---------|--------|
| `app/lib/chrome-constants.ts` | Créer (Phase 1A) |
| `app/lib/chrome-scroll.ts` | Créer (Phase 1A) ; scrollRoot = window uniquement |
| `app/context/ChromeAdaptiveContext.tsx` | Créer (Phase 1A/1B) ; rester sobre, orchestration |
| `app/lib/chrome-device.ts` | Créer (Phase 2) |
| `app/lib/chrome-telemetry.ts` | Créer (Phase 5) ; inclure cause de révélation |
| `components/ChromeTriggerBar.tsx` | Créer (Phase 2) ; bandeau réapparition, aria + focus |
| `components/DashboardWithFilters.tsx` | Refactor : contexte, constantes, pas de scroll interne |
| `components/ReportHeader.tsx` | Évoluer : états expanded/compact (compact minimal) ; useChromeLock sur menu (Phase 3) |
| `components/LinkyFooter.tsx` | Évoluer : safe areas (Phase 4) ; mobile compact + drawer (Phase 4) |
| Overlays (menu, select, modal, drawer) | `useChromeLock(open)` + `data-chrome-lock="true"` (Phase 3) |

---

## 6. Récap des choix de pilotage (v1.1)

- **scrollRoot = window** : verrouillé ; pas d’abstraction.  
- **frozen** : support minimal en Phase 1B ; industrialisation via **`useChromeLock(open)`** en Phase 3 (pas d’observer DOM).  
- **data-chrome-lock="true"** : convention documentaire sur les overlays ; le comportement repose sur le hook.  
- **Compact header** : version **minimale normatif** en Phase 2 (hauteur réduite, une ligne, badge période, pas de second niveau).  
- **chromePinned** : portée **session** par défaut.  
- **Footer mobile drawer** : Phase 4 uniquement.  
- **ChromeAdaptiveContext** : léger ; règles dans chrome-device et chrome-scroll.  
- **Télémétrie** : inclure **cause de révélation** (hover, scroll_up, focus, tap_trigger, manual_pin).

---

## 7. Références spec

- Spec produit : `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.md`  
- Addendum technique : `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.1.md`  
- Comportement par device : spec v1.1 § 4, § 8.  
- Scroll root : spec v1.1.1 § 7octies.  
- Machine d’états / frozen : spec v1.1 § 7ter.  
- État initial : spec v1.1.1 § 7decies.  
- Hystérésis / cooldown : spec v1.1.1 § 7nonies.  
- chromePinned : spec v1.1 § 7quater, v1.1.1 § 7undecies.  
- Télémétrie : spec v1.1.1 § 7duodecies.

---

**Version** : 1.1  
**Statut** : Plan consolidé, prêt pour exécution ; décisions verrouillées, DoD par phase, frozen et scrollRoot clarifiés.
