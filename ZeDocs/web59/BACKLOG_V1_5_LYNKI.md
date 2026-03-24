# Backlog V1.5 — Lynki (convergence créa & consolidation visuelle)

*Tickets ciblés sur le **cycle V1.5** : rapprochement **créa cible ↔ implémentation**, cohérence visuelle, qualité d’usage et lisibilité produit — **sans** refonte globale implicite, **sans** backend nouveau sauf décision formelle, **sans** mélange avec chantiers ERP / Odoo historiques (voir [`PLAN_V1_5_LYNKI.md`](./PLAN_V1_5_LYNKI.md)).*

**Référence plan (cadrage publié)** : [`PLAN_V1_5_LYNKI.md`](./PLAN_V1_5_LYNKI.md) · **Jalon précédent** : tag **`lynki-v1.4`** · [`RELEASE_NOTE_LYNKI_V1_4.md`](./RELEASE_NOTE_LYNKI_V1_4.md)

**Ouverture** : 24 mars 2026 — **inventaire initial « Certain »** posé à partir des **sources canon** du dépôt ([`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md), [`INVENTAIRE_STITCH_CAROLE_61.md`](./INVENTAIRE_STITCH_CAROLE_61.md)).  
**Règle** : chaque ticket **nomme** un écart ou un lot **borné** ; pas de « polish » non priorisé ni de fourre-tout.

> **En l’absence de validation directe de la créa**, V1.5 ne traite d’abord que les **écarts visuels objectivables** et à **faible ambiguïté** (voir § **Arbitrage à partir de la créa figée** ci-dessous).

### Arbitrage à partir de la créa figée *(méthode « froide » — pas d’atelier synchrone requis)*

*La **créa sert de référence muette** : maquette / fichiers figés, écrans actuels, intention produit. On compare **ce qui est montré** à **ce qui est livré**, sans deviner des intentions au-delà de l’évidence visuelle.*

1. **Écarts objectivables seulement** pour démarrer — formulations du type : hiérarchie visuelle plus faible que la créa ; rythme / espacements / densité qui cassent la lecture ; composant fonctionnel mais moins « premium » ; grammaire non homogène avec le reste. Si l’écart repose sur une **interprétation** de designer, le noter en **interprétatif / à arbitrer**, pas en ticket immédiat.
2. **Deux catégories** dans l’inventaire : **écarts certains** (visibles, concrets, fermables sans présence créa) · **écarts interprétatifs** (plus tard ou avec prudence) — éviter les faux tickets design.
3. **Premier lot très sûr** sans créa en direct : fort impact visuel, faible ambiguïté, **faisable en front seul**, peu de débat conceptuel — ex. hiérarchie, espacements, alignements, chrome commun, densité des cards, cohérence headers / sections ; reporter ton, narration visuelle fine, sujets « intention ».
4. **Démarrage possible sans attendre** une personne : viser au début **3 écarts certains maximum**, puis **V1.5-1 à V1.5-3** sur cette base — V1.5 **sobre, objectivable, discipliné**.

### Persona « Esther » *(méthode interne)*

*Persona **CDG** (reporting consolidé), ancré sur les planches `stitch/synth_se_desktop_esther_canon_v5` : lire l’écran comme une **synthèse de conviction** — hiérarchie claire, **chaîne de confiance** (complétude / conformité), lien **chiffres → interprétation**. Utile pour **recette**, **ordre des blocs** et **copies**, sans obligation d’exposer le nom « Esther » dans l’UI.*

### Discipline d’arbitrage *(à respecter avant de remplir le backlog en masse)*

* Ne pas **surcharger** l’inventaire d’un coup (éviter une liste de 15 écarts non priorisés).
* Viser d’abord **3 à 6 écarts les plus structurants**, les ordonner, puis figer **V1.5-1 / V1.5-2 / V1.5-3** (et au-delà seulement si l’arbitrage le justifie).
* **Premier lot livrable** : viser **2 à 4 tickets maximum** ; les lots suivants après clôture ou validation du premier.

### Règle d’atelier *(5 points par écart retenu)*

*En atelier **synchrone** créa / produit **ou** en revue **asynchrone** sur la même base : pour **chaque** écart retenu, ne valider que ce qui suit — le backlog se remplit proprement sans dériver.*

1. **Où** est l’écart (zone, route, capture prod ou référence écran actuel si utile).
2. **En quoi** il est visible (symptôme concret à l’écran).
3. **Pourquoi** il compte (lisibilité, cohérence, usage, perception, etc.).
4. **Quel niveau de fidélité** à la créa est attendu (reproduction stricte, adaptation raisonnée, équivalent fonctionnel).
5. **Comment on saura qu’il est fermé** (aligné sur la **preuve de fin** du ticket).

---

## Convention de statut

| Statut | Signification |
|--------|--------------|
| `À faire` | Non démarré |
| `En cours` | En cours |
| `Fait` | DoD validé |
| `Abandonné` | Décision explicite |
| `Reporté` | Repoussé avec motif |

---

## Inventaire des écarts créa ↔ produit

*Références canon dans le dépôt : `ZeDocs/web59/stitch_carole_61/` — maquettes **`*_canon_v5`**, spécifications `design_system_*.html`, handoff [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md).*

**Critère d’entrée (ligne « Certain »)** : une ligne n’entre en **Certain** que si l’équipe peut **la montrer**, **la décrire factuellement**, et **dire comment constater sa fermeture**. Sinon → **Interprétatif** ou pas dans l’inventaire pour l’instant. *Premier pas recommandé : **au plus 3 lignes Certain**, puis figer **V1.5-1 à V1.5-3** et un **premier lot court et sûr**.*

**Catégorie** : **`Certain`** *(objectivable, fermable sans interprétation fragile)* · **`Interprétatif`** *(à arbitrer plus tard ou avec prudence — pas ticket immédiat du premier lot).*

**Impact** *(exemples de valeurs)* : lisibilité produit · cohérence visuelle · qualité d’usage · perception premium · dette UI *(une ou plusieurs, explicites)*.

**Risque / dépendance** *(exemples)* : front seul · arbitrage design requis · composant transverse · **bloqué** : référence créa manquante ou imprécise.

| # | Zone (écran) | Écart (résumé factuel) | Réf. créa / figma / doc | Catégorie | Impact | Risque / dépendance | Priorité (P1…) | Notes |
|---|--------------|------------------------|-------------------------|-----------|--------|---------------------|----------------|-------|
| 1 | Transverse (toute app) | **Typographie** : le canon Stitch / Fidelity impose **Inter** pour titres, corps et labels (`pilotage_desktop_v_r_na_canon_v5/code.html`, `stitch/lynki_sovereign/DESIGN.md`). Lynki charge **IBM Plex Sans en premier** dans `font-sans` (`app/layout.tsx`, `tailwind.config.js`, `globals.css` `body`). | `stitch/pilotage_desktop_v_r_na_canon_v5/code.html` ; `DESIGN.md` ; prod `units/dorevia-linky/` | **Certain** | Cohérence visuelle · lisibilité | front seul | P1 | Fermeture : stack typo **alignée** sur Inter-first **ou** décision produit documentée + mise à jour handoff. |
| 2 | Transverse (cards, chrome) | **Rayons** : le canon pilotage V5 définit des arrondis Tailwind étendus (**`DEFAULT` 0,125rem**, **`xl` 0,5rem**). Lynki utilise **`--radius-card: 0.75rem`** (12px) et `--radius-xl` identique dans `globals.css`. | `stitch/pilotage_desktop_v_r_na_canon_v5/code.html` (bloc `borderRadius`) ; `globals.css` | **Certain** | Cohérence visuelle · perception premium | front seul | P2 | Fermeture : tokens rayons **alignés** sur l’échelle canon **ou** tableau d’équivalence écrit + prod mise à jour. |
| 3 | Transverse (badges confiance, états) | **Vert « Fiable »** : le handoff V1 fixe la confiance **Fiable / confirmée** en **`#10B981`** ([`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md) §8). Lynki expose **`--confidence-fiable: #059669`** (`globals.css`), déjà proche du vert accent créa mais **hex différent**. | Handoff §8 ; `globals.css` | **Certain** | Cohérence visuelle · grammaire confiance | front seul | P2 | Fermeture : **`#10B981`** appliqué aux usages « Fiable » concernés **ou** exception produit notée + handoff ajusté. |
| 4 | Cockpit pilotage (desktop) | **Thème clair vs sombre** : la maquette canon V5 est en **`html.light`** avec fonds clairs (`#f8f9ff`, surfaces « container »). Lynki cockpit est en **thème sombre** (tokens `--bg` `#0F1B2D`, etc.). | `stitch/pilotage_desktop_v_r_na_canon_v5/screen.png` ; `globals.css` | **Interprétatif** | Perception premium · cohérence | arbitrage produit requis | — | Ne pas traiter en ticket V1.5 tant que la **décision** clair vs sombre n’est pas explicite ; risque de refonte implicite. |

---

## Ordre d’exécution *(figé — premier passage)*

*Numérotation et **priorité documentaire** inchangées* : elles servent la **traçabilité** (typo = le plus structurant côté « story » produit).

1. **V1.5-1 — Typographie** : impact global immédiat ; conditionne la « voix » visuelle de toute l’app.
2. **V1.5-2 — Rayons / tokens carte** : visible sur cockpit, détail, synthèse ; faible ambiguïté une fois l’échelle choisie.
3. **V1.5-3 — Couleur Fiable (confiance)** : alignement sémantique handoff ↔ prod ; vérifier les composants qui consomment `--confidence-fiable` / `linky-confidence-fiable`.

### Ordre d’implémentation recommandé *(code — même lot)*

* **En pratique** : traiter **V1.5-2 + V1.5-3 ensemble** en premier (tokens CSS, faible rayonnement, peu de surprises), puis **V1.5-1** (Inter-first : fort rayonnement — densité, troncatures, rythme).  
* **Passe visuelle** après 2+3 : cockpit + une page détail + `/synthese` ; recette plus attentive après 1 (titres, cards, tableaux, mobile/desktop).  
* **Clair / sombre** : reste **hors** de ce lot (ligne **Interprétatif** inventaire).

---

## Tableau de bord

| ID | Titre | Zone | Statut |
|----|-------|------|--------|
| **V1.5-1** | Typographie : Inter-first vs IBM Plex prioritaire | Transverse | `À faire` |
| **V1.5-2** | Rayons cartes / chrome : échelle canon V5 vs tokens Lynki | Transverse | `En cours` |
| **V1.5-3** | Confiance « Fiable » : `#10B981` handoff vs `#059669` prod | Transverse | `En cours` |

---

## Premier lot livrable *(figé — 3 tickets)*

*Cible : **V1.5-1 → V1.5-3** (écarts **Certain** uniquement).*

- [ ] **Périmètre** : `units/dorevia-linky` — typo globale, tokens CSS, classes Tailwind liées ; pas de changement de logique métier.
- [ ] **DoD** : critères de fin par ticket (§ Détail) ; **non-régression V1.4** (pages détail + synthèse + pilotage) ; pas de régression d’accessibilité contrastes non assumée.
- [ ] **Référence créa** : ligne **Canon V5** — chemins sous `ZeDocs/web59/stitch_carole_61/` + [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md).
- [ ] **Preuve de fin** : captures avant/après (pilotage + une page détail + synthèse si pertinent) + revue produit pour les trois tickets.

---

## Détail des tickets

### V1.5-1 — Typographie (Inter-first)

| | |
|--|--|
| **Où** | Toute l’app (`font-sans`, `body`). |
| **Visible** | Rendu des textes différent de la maquette Inter-only (métriques, sensation de « voix »). |
| **Pourquoi** | Cohérence avec la **créa canon** et les specs Fidelity / Stitch. |
| **Fidélité** | **Stricte** attendue par défaut : **Inter** comme police principale ; IBM Plex retiré ou réservé à un usage **explicitement** secondaire si arbitrage. |
| **Fermeture** | `tailwind.config.js` + `layout.tsx` + `globals.css` : ordre des polices aligné ; capture `/` + `/tresorerie` + `/synthese`. |
| **Fichiers indicatifs** | `units/dorevia-linky/app/layout.tsx`, `tailwind.config.js`, `app/globals.css` |

### V1.5-2 — Rayons (cartes / chrome)

| | |
|--|--|
| **Où** | Cartes, encarts, boutons selon usage des tokens `--radius-*`. |
| **Visible** | Coins plus ou moins arrondis que le canon V5 (comparaison `code.html` vs prod). |
| **Pourquoi** | Même « famille » de composants entre maquette et produit. |
| **Fidélité** | Reproduire l’**échelle** du canon (ou documenter équivalence 1:1 en rem). |
| **Fermeture** | Tokens mis à jour + captures cockpit / carte typique. |
| **Fichiers indicatifs** | `app/globals.css`, composants qui utilisent `rounded-*` / variables radius |

### V1.5-3 — Vert « Fiable » (confiance)

| | |
|--|--|
| **Où** | Badges / scores de confiance, légendes « Fiable ». |
| **Visible** | Teinte de vert différente de `#10B981` là où l’état « Fiable » s’applique. |
| **Pourquoi** | Alignement sur la **grammaire de confiance** handoff V1. |
| **Fidélité** | **`#10B981`** pour l’état Fiable **ou** mise à jour du handoff si exception. |
| **Fermeture** | Liste des usages + capture ; contraste WCAG non dégradé. |
| **Fichiers indicatifs** | `app/globals.css`, `ConfidenceScore`, tuiles cockpit |

### Preuve de fin *(chaque ticket — à cocher à la clôture)*

* Objectif : fermeture **vérifiable** et communicable (comité / créa / interne).

- [ ] **Capture avant / après** (ou équivalent objectif : maquette vs prod).
- [ ] **Route(s) / zone(s)** concernées, nommées explicitement.
- [ ] **Validation** : créa et/ou produit selon le périmètre du ticket ; **si pas de créa en direct** : validation **produit** et/ou **revue interne** suffisante pour les lots **objectivables** (aligné avec la § Arbitrage créa figée).
- [ ] **Non-régression V1.4** : grammaire pages détail / synthèse **OK** (aucune régression connue non assumée).

---

## Journal

| Date | Notes |
|------|-------|
| 24 mars 2026 | Ouverture du fichier — squelette ; inventaire et ordre **à compléter** après arbitrage. |
| 24 mars 2026 | Renforts : colonnes **Impact** et **Risque / dépendance** ; discipline 3–6 écarts / lot 2–4 tickets ; **preuve de fin** par ticket. |
| 24 mars 2026 | **Règle d’atelier** : 5 points par écart (où / visible / pourquoi / fidélité créa / critère de fermeture). |
| 24 mars 2026 | **Arbitrage sans créa en direct** : créa figée comme référence muette ; catégories **Certain / Interprétatif** ; premier lot conservateur ; règle noire sur blanc objectivable + faible ambiguïté. |
| 24 mars 2026 | **Critère d’entrée inventaire** : montrer + description factuelle + critère de fermeture pour toute ligne **Certain** ; ≤ 3 lignes puis V1.5-1…3 + premier lot. |
| 24 mars 2026 | **Inventaire initial** : 3 écarts **Certain** (typo, rayons, vert Fiable) + 1 **Interprétatif** (clair/sombre) ; ordre V1.5-1→3 ; premier lot = ces 3 tickets ; détail rédigé. |
| 24 mars 2026 | **Ordre code** documenté : implémentation **2+3 puis 1** ; tokens `--radius-card` / `--radius-xl` → `0.5rem` (canon V5 `xl`) ; `--confidence-fiable` → `#10B981` ; trésorerie SVG sur le token. **En cours** jusqu’à captures DoD + non-régression visuelle. |
| 24 mars 2026 | **Thème clair opt-in** : `html.light` + tokens dérivés des maquettes `stitch_carole_61` (canon V5) ; persistance `localStorage` `linky-theme` ; `tailwind` en `darkMode: "class"` ; toggle dans la TopBar (+ login, alertes mobile, admin DLP). L’inventaire **clair/sombre** reste partiellement **interprétatif** tant que le défaut produit / la recette globale ne sont pas figés. |
| 24 mars 2026 | **Alignement créa renforcé** : défaut navigateur = **clair** (Stitch) sauf `linky-theme=dark` ; cockpit desktop (bento, tuiles maîtresses, sparkline emerald, PROXY ambre, Business slate-900) calqué sur `pilotage_desktop_v_r_na_canon_v5` ; TopBar `h-16` / titre `text-lg font-bold`. |
| 24 mars 2026 | **Page `/tresorerie`** : structure `d_tail_tr_sorerie_v_r_na_canon_v5` — en-tête retour Pilotage + actions (Exporter désactivé, Actualiser primaire noir/blanc), grille 12 (KPI héro 8 + bloc contexte slate-900), graphique 9 + panneau Gouvernance 3, courbe SVG h-64 / stroke 3 / dégradé type maquette. |
| 24 mars 2026 | **Persona interne « Esther »** (CDG) : § dédié — méthode recette / copies / blocs ; pas de nom imposé en produit. |

---

*Backlog Lynki V1.5 — **brouillon vivant** : le plan fixe la doctrine ; ce fichier porte l’**exécution** (inventaire et tickets **amorcés** — à valider en revue produit puis implémenter).*
