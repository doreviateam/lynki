# Backlog d’exécution Scrum — Chrome adaptatif Linky

**Date** : mars 2026  
**Répertoire** : ZeDocs/web53  
**Référence** : `PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.1.md`

**Objectif** : transformer le plan en backlog exécutable avec tickets par phase et Definition of Done par ticket. Base de suivi d’avancement et de recette.

**Statut implémentation** : **TERMINÉ** (mars 2026) — Phases 0 à 5 livrées et déployées (laplatine2026, o19). Rapport détaillé → `RAPPORT_IMPLEMENTATION_CHROME_ADAPTATIF_v1.0.md`.

---

## Légende

- **ID** : identifiant court pour suivi (ex. Jira, GitHub Issues).
- **DoD** : Definition of Done — critères à valider avant de considérer le ticket terminé.
- **Phase** : 0, 1A, 1B, 2, 3, 4, 5.

---

## Phase 0 — Décisions verrouillées

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **C0-1** | Valider décisions Phase 0 | Lire et valider avec l’équipe : scrollRoot = window, chromePinned = session, compact minimal normatif, frozen via useChromeLock, footer drawer en Phase 4 uniquement. | [x] Décisions actées et documentées dans le plan. |

---

## Phase 1A — Socle technique

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **C1A-1** | Créer chrome-constants.ts | Fichier `app/lib/chrome-constants.ts` avec : nearTopThresholdPx = 100, cooldown 400 ms, CHROME_HIDE_AFTER_MS 4500, CHROME_TRIGGER_ZONE_PX 72, delta scroll min 24, breakpoints 768 / 1280. | [x] Constantes exportées et utilisées par au moins un module. |
| **C1A-2** | Verrouiller scrollRoot = window | Documenter dans le code (chrome-scroll.ts + commentaires layout) que le scroll observé est uniquement `window` ; aucun listener sur scrolls internes de cards. | [x] Un seul point de lecture du scroll (window) ; doc lisible. |
| **C1A-3** | Créer chrome-scroll.ts | Helpers : position (window), direction, delta cumulé, isNearTop(position ≤ nearTopThresholdPx). | [x] Fonctions testables ou utilisées par le contexte. |
| **C1A-4** | Machine d’états chrome | Type `ChromeState = 'expanded' | 'compact' | 'hidden' | 'frozen'`. Remplacer booléen chromeVisible par état dérivé. Exposer **isChromeVisible** et **isChromeCollapsed** (voir plan § 1.3). | [x] Contexte ou hook expose state + dérivés ; plus de chromeVisible booléen. |
| **C1A-5** | État initial expanded | Au premier rendu, état = expanded ; pas de transition vers hidden/compact avant montage client (useEffect). | [x] Aucun flash visible au chargement. |
| **C1A-6** | Hystérésis + cooldown | Réapparition si direction = haut, delta > 24 px, position ≤ nearTopThresholdPx ; cooldown 400 ms après toute transition. | [x] Aucune oscillation sur micro-scroll ; aucune réapparition parasite en lecture longue. |
| **C1A-7** | DoD UX Phase 1A | Valider : pas de flash, pas d’oscillation, pas de réapparition parasite, comportement identique sur 2 vues cockpit. | [x] Les 4 critères DoD Phase 1A cochés. |

---

## Phase 1B — Verrouillage minimal de frozen

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **C1B-1** | setFrozen dans le contexte | Exposer setFrozen(true | false). Si frozen === true, aucun timer de masquage/contraction. | [x] Test manuel setFrozen(true) → header ne bouge pas. |
| **C1B-2** | DoD Phase 1B | Si frozen = true (manuel ou 1 overlay), header ne se masque pas ; à frozen = false, comportement reprend. | [x] Les 2 critères DoD Phase 1B cochés. |

---

## Phase 2 — Mode d’interaction

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **C2-1** | useInteractionMode() | Fichier `app/lib/chrome-device.ts` : retourne 'desktop' | 'tablet' | 'mobile'. Desktop immersif uniquement si largeur ≥ 1280 ET (hover: hover) ET (pointer: fine). **Fallback** : avant résolution client, mode conservateur = non-immersif (voir plan § 1.4). | [x] iPad Pro 1366 px → 'tablet'. Mode par défaut avant résolution = non-immersif. |
| **C2-2** | Brancher mode dans le contexte | Desktop → expanded → hidden ; tablette/mobile → expanded → compact. Mobile : jamais hidden. | [x] Comportement cohérent par device. |
| **C2-3** | Compact header minimal | ReportHeader accepte état compact : hauteur réduite, une ligne, badge période, filtres secondaires masqués, pas de second niveau. | [x] Visuel compact conforme au normatif ; pas de blocage maquette. |
| **C2-4** | Hover uniquement desktop | Réapparition par hover uniquement sur desktop ; tablette/mobile : scroll top + tap bandeau uniquement. | [x] Hover n’a aucun effet sur tactile. |
| **C2-5** | Composant ChromeTriggerBar | Extraire bandeau réapparition : focusable, aria-label "Afficher le bandeau", onMouseEnter → revealChrome. | [x] Focus clavier OK ; aria-label présent. |
| **C2-6** | DoD Phase 2 | iPad Pro → tablette ; mobile jamais hidden ; hover sans effet tactile ; bandeau focus + aria. | [x] Les 4 critères DoD Phase 2 cochés. |

---

## Phase 3 — Industrialisation UX

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **C3-1** | Hook useChromeLock(open) | Quand open === true → setFrozen(true) ; open === false → setFrozen(false). Export depuis contexte ou module dédié. | [x] Hook utilisé par au moins un overlay (ex. menu header). |
| **C3-2** | Marquage overlays | data-chrome-lock="true" sur overlays ; useChromeLock branché dans ReportHeader (menu), selects période/société, modals/drawers. | [x] Ouverture select ou menu → header ne se masque pas. |
| **C3-3** | chromePinned (session) | État dans le contexte ; portée session. Si chromePinned === true, pas de hidden ni compact auto. | [x] Activer "Garder le bandeau" → plus de masquage/contraction en session. |
| **C3-4** | UI "Garder le bandeau visible" | Entrée dans menu header ou paramètres pour activer/désactiver chromePinned. | [x] Utilisateur peut épingler/désépingler. |
| **C3-5** | DoD Phase 3 | Select/menu ouvert → header stable ; "Garder le bandeau" → comportement désactivé en session. | [x] Les 2 critères DoD Phase 3 cochés. |

---

## Phase 4 — Mobile propre

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **C4-1** | Safe areas | Header sticky et footer : env(safe-area-inset-top), env(safe-area-inset-bottom). | [x] Sur iPhone (ou simulateur), pas de recouvrement encoche/barre. |
| **C4-2** | Clavier mobile | Quand input/select a le focus sur mobile, suspendre transitions chrome (frozen ou flag). | [x] Saisie dans un champ : pas de saut header/footer. |
| **C4-3** | Footer mobile compact + drawer | Une ligne compacte ; au tap, ouvrir drawer/panneau "confiance système". | [x] Ligne compacte visible ; drawer s’ouvre au tap. |
| **C4-4** | prefers-reduced-motion | Désactiver ou réduire auto-hide/transitions si préférence activée. | [x] Réglage OS "réduire les mouvements" pris en compte. |
| **C4-5** | DoD Phase 4 | Safe areas OK ; saisie mobile sans saut ; footer compact + drawer. | [x] Les 3 critères DoD Phase 4 cochés. |

---

## Phase 5 — Télémétrie UX (optionnel)

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **C5-1** | chrome-telemetry.ts | Événements avec **cause de révélation** : hover \| scroll_up \| focus \| tap_trigger \| manual_pin. Plus : header_reveal_manual, chrome_pinned_toggle, time_in_state, trust_drawer_open, frozen_enter. | [x] Chaque révélation a une cause ; événements émis aux bons endroits. |
| **C5-2** | Brancher télémétrie | Contexte, ChromeTriggerBar, LinkyFooter : appels aux fonctions/hook de télémétrie. | [x] Données exploitables (buffer ou envoi). |
| **C5-3** | DoD Phase 5 | Cause de révélation associée ; données exploitables. | [x] Les 2 critères DoD Phase 5 cochés. |

---

## Récapitulatif par phase

| Phase | Tickets | DoD phase |
|-------|---------|-----------|
| 0 | C0-1 | Décisions actées |
| 1A | C1A-1 à C1A-7 | 4 critères UX (flash, oscillation, réapparition parasite, 2 vues) |
| 1B | C1B-1, C1B-2 | frozen bloque timers ; reprise à false |
| 2 | C2-1 à C2-6 | iPad tablette, mobile pas hidden, hover tactile nul, bandeau a11y |
| 3 | C3-1 à C3-5 | overlay → header stable ; pin → session |
| 4 | C4-1 à C4-5 | safe areas, clavier, footer drawer |
| 5 | C5-1 à C5-3 | cause révélation, données exploitables |

---

## Matrice recette (rappel)

À valider en fin de phase / release : Desktop souris (Mac/Firefox ou Chrome), iPad Pro/Safari (tablette), iPhone/Safari (sticky + safe areas), Android/Chrome (mobile), Desktop tactile si dispo (pas de hover parasite). Détail dans le plan § 8.

---

**Version** : 1.0  
**Statut** : **Implémentation terminée** (mars 2026). Tous les tickets Phases 0 à 5 réalisés et déployés. DoD par ticket ; lien avec plan v1.1 et matrice recette. Rapport → `RAPPORT_IMPLEMENTATION_CHROME_ADAPTATIF_v1.0.md`.
