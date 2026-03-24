# Rapport d’implémentation — Chrome adaptatif Linky

**Date** : mars 2026  
**Répertoire** : ZeDocs/web53  
**Références** : `PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.1.md`, `BACKLOG_SCRUM_CHROME_ADAPTATIF_v1.0.md`, `SPEC_UX_LINKY_INSTRUMENT_ADAPTATIF_v1.1.md` (+ v1.1.1)

**Statut** : Implémentation terminée (Phases 0 à 5). Déployée sur laplatine2026 et o19.

---

## 1. Synthèse

Le **chrome adaptatif** du cockpit Linky a été implémenté selon le plan v1.1 : header et footer s’adaptent au mode d’interaction (desktop / tablette / mobile), avec masquage automatique sur desktop, header compact sur tablette/mobile, verrouillage lors des overlays (menu, selects), option « Garder le bandeau visible », safe areas, drawer footer mobile et télémétrie avec cause de révélation.

**Livrables** : 6 phases (0 à 5), 5 fichiers créés, 4 composants modifiés, déploiement sur deux environnements.

---

## 2. Périmètre livré

| Phase | Intitulé | Livrable |
|-------|----------|----------|
| **0** | Décisions verrouillées | scrollRoot = window, chromePinned = session, compact minimal normatif, frozen via useChromeLock, footer drawer Phase 4. |
| **1A** | Socle technique | Constantes, scroll sur window, machine d’états (expanded/compact/hidden/frozen), état initial expanded, hystérésis + cooldown 400 ms. Dans l’implémentation, `frozen` est traité comme un **état prioritaire** suspendant temporairement les transitions automatiques du chrome. |
| **1B** | Frozen minimal | setFrozen(true|false) dans le contexte ; aucun timer de masquage quand frozen. |
| **2** | Mode d’interaction | useInteractionMode() (desktop/tablet/mobile), desktop→hidden / tablette-mobile→compact, header compact minimal, ChromeTriggerBar, hover uniquement desktop. |
| **3** | Industrialisation UX | useChromeLock(open), data-chrome-lock sur overlays, menu + selects qui verrouillent, chromePinned (session), UI « Garder le bandeau visible ». |
| **4** | Mobile propre | Safe areas (header/footer/drawer), clavier mobile (freeze quand input/select focus), footer compact + drawer « Confiance système », prefers-reduced-motion. |
| **5** | Télémétrie UX | chrome-telemetry.ts (cause de révélation, time_in_state, chrome_pinned_toggle, trust_drawer_open, frozen_enter), branchements dans contexte et composants. |

---

## 3. Fichiers créés

| Fichier | Phase | Description |
|---------|-------|-------------|
| `units/dorevia-linky/app/lib/chrome-constants.ts` | 1A | NEAR_TOP_THRESHOLD_PX (100), CHROME_TRANSITION_COOLDOWN_MS (400), CHROME_HIDE_AFTER_MS (4500), CHROME_TRIGGER_ZONE_PX (72), CHROME_SCROLL_REVEAL_MIN_DELTA_PX (24), breakpoints 768 / 1280. |
| `units/dorevia-linky/app/lib/chrome-scroll.ts` | 1A | getScrollTop(), isNearTop(), shouldRevealChrome() ; scrollRoot = window uniquement (documenté). |
| `units/dorevia-linky/app/context/ChromeAdaptiveContext.tsx` | 1A–5 | Machine d’états, setFrozen, chromePinned, revealChrome(cause?), useChromeLock, useInteractionMode, listeners scroll/hover, reduced-motion, clavier mobile, time_in_state. |
| `units/dorevia-linky/app/lib/chrome-device.ts` | 2 | useInteractionMode() → 'desktop' \| 'tablet' \| 'mobile' (viewport + hover + pointer fine) ; fallback tablet avant résolution client. |
| `units/dorevia-linky/app/lib/chrome-telemetry.ts` | 5 | Types et événements : chrome_reveal (cause), chrome_pinned_toggle, chrome_time_in_state, chrome_trust_drawer_open, chrome_frozen_enter ; buffer + setChromeTelemetryCallback(). |
| `units/dorevia-linky/components/ChromeTriggerBar.tsx` | 2 | Bandeau réapparition (header hidden) : focusable, aria-label, onMouseEnter (desktop), onClick/onKeyDown → revealChrome. |

---

## 4. Fichiers modifiés

| Fichier | Modifications principales |
|---------|--------------------------|
| `components/DashboardWithFilters.tsx` | ChromeAdaptiveProvider en racine ; consommation du contexte (chromeState, interactionMode, revealChrome) ; passage chromeCompact + onExpandChrome au header ; ChromeTriggerBar avec revealChrome("tap_trigger") ; wrapper header avec motion-reduce:duration-0. |
| `components/ReportHeader.tsx` | Props chromeCompact, onExpandChrome ; useChromeAdaptive, useChromeLock(menuOpen \|\| selectFocused) ; onFocus/onBlur sur tous les selects (société, période, année) ; data-chrome-lock sur overlay et nav ; section « Affichage » avec « Garder le bandeau visible » (mobile + desktop) ; mode compact (une ligne, badge période + intégrité, tap pour développer) ; paddingTop: env(safe-area-inset-top). |
| `components/LinkyFooter.tsx` | paddingBottom: env(safe-area-inset-bottom) ; useChromeLock(drawerOpen) ; état drawerOpen ; mobile : une ligne compacte + bouton ouvrant le drawer « Confiance système » ; drawer avec data-chrome-lock, recordTrustDrawerOpen() à l’ouverture. |
| `app/api/dashboard-metrics/route.ts` | (Préexistant pour Phase 0) sealed_count_total pour le footer. |

---

## 5. Décisions techniques

- **scrollRoot** : uniquement `window` ; pas de listener sur les scrolls internes des cards.
- **revealChrome(cause?)** : paramètre optionnel pour la télémétrie (scroll_up, hover, tap_trigger).
- **time_in_state** : enregistré dans un useEffect sur chromeState (transition) avec prevStateRef et stateEnteredAtRef.
- **ChromeStateForTelemetry** : type dupliqué dans chrome-telemetry pour éviter l’import circulaire avec le contexte.
- **prefers-reduced-motion** : ref dans le contexte ; si activé, pas de scheduleHide ni de timer dans revealChrome ; motion-reduce:duration-0 sur le wrapper du header.
- **Clavier mobile** : en mode mobile, focusin/focusout sur document ; si l’élément focalisé est input/select/textarea → setFrozen(true), sinon (après setTimeout) setFrozen(false).
- **frozen** : état prioritaire ; quand `frozen === true`, aucun timer de masquage ou de contraction ne s’exécute (overlays ouverts, saisie mobile). Les transitions automatiques reprennent à la levée du verrou.

---

## 6. Comportement par device

| Device | Header | Révélation | Footer |
|--------|--------|------------|--------|
| **Desktop** (≥1280 px, hover, pointer fine) | expanded → hidden après 4,5 s | scroll top, hover zone 72 px, tap bandeau (ChromeTriggerBar) | Barre complète (desktop) |
| **Tablette** (ex. iPad Pro 1366 px) | expanded → compact | scroll top, tap bandeau compact | Barre complète |
| **Mobile** (<768 px) | expanded → compact (jamais hidden) | scroll top, tap bandeau compact | Une ligne compacte ; tap → drawer « Confiance système » |

Overlays (menu, selects) : useChromeLock(open) → header ne se masque pas. chromePinned = true → plus de masquage ni compact automatique pour la session.

---

## 7. Télémétrie

- **Buffer** : 200 événements max ; `getChromeTelemetryEvents()`, `clearChromeTelemetryEvents()`.
- **Callback** : `setChromeTelemetryCallback(fn)` pour envoyer chaque événement (ex. vers API).
- **Causes de révélation** : hover, scroll_up, tap_trigger (focus et manual_pin définis dans les types, utilisés selon besoin).
- **Événements** : chrome_reveal, chrome_pinned_toggle, chrome_time_in_state, chrome_trust_drawer_open, chrome_frozen_enter.

---

## 8. Déploiement

- **Script** : `./scripts/build_deploy_vault_laplatine_o19.sh`
- **Environnements** : laplatine2026, o19 (conteneurs Linky recréés avec l’image incluant le chrome adaptatif).
- **Image** : dorevia/linky:bfr-complet-2026-03-15 (tag dérivé de la date du build).

---

## 8bis. Écarts et arbitrages

- **Compact header** livré en version minimale normative (hauteur réduite, une ligne, badge période), sans redesign complet.
- **chromePinned** limité à la session (localStorage non implémenté).
- **Télémétrie** prête côté front (buffer + callback) ; envoi vers API non branché par défaut.
- **Persistance** (localStorage pour pin, etc.) reportée en évolution ultérieure.

---

## 9. Definition of Done — récapitulatif

| Phase | DoD | Statut |
|-------|-----|--------|
| 1A | Pas de flash, pas d’oscillation, pas de réapparition parasite, 2 vues cockpit | [x] |
| 1B | frozen = true → header stable ; frozen = false → reprise | [x] |
| 2 | iPad tablette, mobile jamais hidden, hover sans effet tactile, bandeau focus + aria | [x] |
| 3 | Select/menu ouvert → header stable ; « Garder le bandeau » → plus de masquage session | [x] |
| 4 | Safe areas, saisie mobile sans saut, footer compact + drawer | [x] |
| 5 | Cause de révélation associée ; données exploitables | [x] |

---

## 10. Recette et suites possibles

- **Matrice recette** (plan § 8) : valider sur Desktop souris, iPad Pro/Safari, iPhone/Safari, Android/Chrome, Desktop tactile si dispo.
- **Télémétrie** : brancher `setChromeTelemetryCallback()` sur l’API ou l’analytics pour exploiter les causes de révélation et les durées par état.
- **Évolutions** : persistance de chromePinned en localStorage (optionnel), ajustement des timers à partir des données télémétriques.
- **Multi-tenant** : évolution future du header et du périmètre de navigation pour supporter un fonctionnement **multi-tenant** (contexte, branding, périmètre par tenant). Vision détaillée → `NOTE_CHROME_MULTI_TENANT_v1.0.md`.

---

## 11. Conclusion

Le chrome adaptatif Linky est désormais en place sur les environnements laplatine2026 et o19, avec un comportement cohérent par device, un verrouillage UX lors des overlays, une accessibilité renforcée sur mobile, et une base télémétrique exploitable pour ajustements futurs.

Le périmètre livré correspond au plan v1.1 consolidé. Les prochaines évolutions porteront prioritairement sur la recette multi-device finale, l’exploitation de la télémétrie, et à terme l’adaptation du header à un contexte multi-tenant.

---

**Version** : 1.0  
**Répertoire** : ZeDocs/web53  
**Documents liés** : BACKLOG_SCRUM_CHROME_ADAPTATIF_v1.0.md (tous tickets cochés), PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.1.md (DoD cochés), NOTE_CHROME_MULTI_TENANT_v1.0.md (vision multi-tenant).
