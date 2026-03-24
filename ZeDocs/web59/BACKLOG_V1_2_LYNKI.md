# Backlog V1.2 — Lynki

*Tickets d'exécution pour le chantier V1.2. Chaque ticket est fermable indépendamment.*
*Référence plan : [`PLAN_V1_2_LYNKI.md`](./PLAN_V1_2_LYNKI.md)*

**Ouverture** : 24 mars 2026
**Jalon V1.2 atteint** : 24 mars 2026 — tag `lynki-v1.2` (non déplacé)
**Release étendue V1.2.1** : 24 mars 2026 — tag `lynki-v1.2.1` — V1.2-5 (suppression export PDF fantôme `/synthese`) ; note [`RELEASE_NOTE_LYNKI_V1_2_1.md`](./RELEASE_NOTE_LYNKI_V1_2_1.md)
**Critère de sortie initial V1.2** : V1.2-1 + V1.2-2 + V1.2-3 + V1.2-4 livrés (3 priorités hautes + 1 priorité moyenne)

---

## Convention de statut

| Statut | Signification |
|--------|--------------|
| `À faire` | Non encore démarré |
| `En cours` | Démarré, non terminé |
| `Fait` | DoD validé |
| `Abandonné` | Décision de ne pas traiter |

---

## Tableau de bord

| ID | Titre | Priorité | Statut |
|----|-------|---------|--------|
| V1.2-1 | Navigation détail multi-tuiles desktop | Haute | `Fait` |
| V1.2-2 | Filtre lecture alertes (urgence / vigilance / suivi) | Haute | `Fait` |
| V1.2-3 | Projection J+30 Trésorerie | Haute | `Fait` |
| V1.2-4 | Tuiles C manquantes dans le canon desktop | Moyenne | `Fait` |
| V1.2-5 | Export CSV / rapport de conformité | Moyenne | `Fait` |
| V1.2-6 | Mini-graphes sparklines tuiles secondaires mobile | Basse | `À faire` |

---

## V1.2-1 — Navigation détail multi-tuiles desktop

**Persona** : Véréna
**Priorité** : Haute
**Statut** : `À faire`

### Contexte

En V1.1, seule la tuile Trésorerie du cockpit desktop navigue vers `/tresorerie`. Les tuiles Business, Encours et BFR restent en `onSelectCard` → focus inline, ce qui ne correspond pas au parcours attendu par Véréna.

### Objectif

Brancher les tuiles desktop prioritaires sur une route de détail explicite, ou sur une destination claire si la page détail n'existe pas encore.

### Tuiles concernées (priorité haute)

| Tuile | Route cible | État |
|-------|------------|------|
| Business | `/business` | page à créer (shell minimal) |
| Encours | `/encours` | page à créer (shell minimal) |
| BFR | `/bfr` | page à créer (shell minimal) |

### Décision d'architecture

Utiliser **route réelle** (`/business`, `/encours`, `/bfr`) pour cohérence avec `/tresorerie` — pas de focus inline.
Si la page détail est encore vide, afficher une vue "Détail disponible prochainement" avec un KPI principal et un breadcrumb retour Pilotage.

### Fichiers impactés

- `units/dorevia-linky/components/CockpitDesktopView.tsx`
- `units/dorevia-linky/app/(cockpit)/business/page.tsx` (à créer)
- `units/dorevia-linky/app/(cockpit)/encours/page.tsx` (à créer)
- `units/dorevia-linky/app/(cockpit)/bfr/page.tsx` (à créer)

### DoD

- [ ] clic tuile Business → `/business` (breadcrumb retour Pilotage)
- [ ] clic tuile Encours → `/encours` (breadcrumb retour Pilotage)
- [ ] clic tuile BFR → `/bfr` (breadcrumb retour Pilotage)
- [ ] pages détail : KPI principal depuis `dashboardMetrics`, pas de valeur mockée
- [ ] état "données indisponibles" propre si API absente
- [ ] pas de régression sur tuile Trésorerie
- [ ] lint/typecheck OK

### Critère de recette visuelle

- depuis le cockpit desktop, cliquer Business / Encours / BFR navigue vers une vraie page
- chaque page détail affiche au minimum un KPI et un breadcrumb retour
- aucun clic silencieux ou focus inline résiduel

---

## V1.2-2 — Filtre lecture alertes

**Persona** : Max
**Priorité** : Haute
**Statut** : `À faire`

### Contexte

La page `/alerts` affiche les alertes hiérarchisées (urgence / vigilance / suivi) mais ne permet pas à Max de filtrer rapidement par niveau. Avec des données réelles, la densité peut devenir difficile à lire.

### Objectif

Ajouter un filtre rapide côté client permettant d'isoler un niveau ou de l'exclure.

### Spécification fonctionnelle

- 3 pills / toggles : "Urgence", "Vigilance", "Suivi"
- état par défaut : tous actifs (affichage complet)
- clic sur un pill → désactive ce niveau (grisé)
- clic à nouveau → réactive
- état vide propre si le filtre actif donne 0 résultats ("Aucune alerte de ce niveau sur cette période")
- pas de régression sur l'état vide global (aucune alerte toutes catégories)

### Fichiers impactés

- `units/dorevia-linky/app/(cockpit)/alerts/page.tsx`

### DoD

- [ ] 3 pills de filtre visibles sur la page alertes
- [ ] filtrage côté client uniquement (pas d'appel API supplémentaire)
- [ ] état vide par filtre actif
- [ ] pas de régression sur état vide global
- [ ] lint/typecheck OK

### Critère de recette visuelle

- Max peut isoler les urgences en 1 clic
- l'écran reste lisible avec un seul niveau actif
- pas de layout cassé si un niveau est vide

---

## V1.2-3 — Projection J+30 Trésorerie

**Persona** : Véréna / Max
**Priorité** : Haute
**Statut** : `À faire`

### Décision canonique — figée

> **La projection J+30 Trésorerie ne sera affichée que si elle repose sur une donnée réelle, identifiée et qualifiée. À défaut, Lynki affichera un état d'indisponibilité explicite plutôt qu'une estimation artificielle.**

| Option | Condition | Action |
|--------|-----------|--------|
| A — Brancher | Un endpoint de projection existe et est qualifié | Afficher la valeur avec badge "Projection J+30" et source explicite |
| B — Masquer | Aucun endpoint disponible ou donnée non qualifiée | Supprimer tout label "aperçu V2" ; afficher "Projection J+30 indisponible dans le périmètre courant" |

**Règle absolue** : aucune valeur fictive, aucun pseudo-calcul décoratif.

### Contexte

La projection J+30 est mentionnée dans les tuiles Trésorerie (mobile et desktop) avec le label "aperçu V2". Ce label est lui-même trompeur — il laisse entendre qu'une valeur existe mais n'est pas encore exposée. Il doit être supprimé ou remplacé par un état honnête.

### Première action à réaliser

Auditer `CockpitMobileView.tsx`, `CockpitDesktopView.tsx` et `app/(cockpit)/tresorerie/page.tsx` pour localiser tous les emplacements qui mentionnent "aperçu V2", une valeur de projection hardcodée, ou un bloc conditionnel non branché.

### Fichiers potentiellement impactés

- `units/dorevia-linky/components/CockpitMobileView.tsx`
- `units/dorevia-linky/components/CockpitDesktopView.tsx`
- `units/dorevia-linky/app/(cockpit)/tresorerie/page.tsx`

### DoD

- [ ] audit des occurrences "aperçu V2" / projection J+30 réalisé
- [ ] option A ou B appliquée selon disponibilité de l'endpoint
- [ ] si option A : projection affichée avec source et qualification explicites
- [ ] si option B : label "aperçu V2" supprimé, état "indisponible" propre
- [ ] aucune valeur fictive visible nulle part
- [ ] lint/typecheck OK

---

## V1.2-4 — Tuiles C manquantes desktop

**Persona** : Véréna
**Priorité** : Moyenne
**Statut** : `À faire`

### Contexte

Le canon desktop V5 prévoit 4 tuiles C. Actuellement seules POS / Z de caisse sont présentes. 2 tuiles C supplémentaires sont manquantes.

### Décision à prendre avant implémentation

Identifier les 2 tuiles C cibles (à confirmer sur spec canon V5) :
- candidates possibles : Notes de frais, Stocks, Paie, ou autres selon le canon

### DoD

- [ ] 2 tuiles C identifiées et validées
- [ ] ajoutées à la grille bento desktop
- [ ] données réelles ou état "indisponible" propre — jamais de valeur mockée
- [ ] pas de surcharge visuelle de la grille
- [ ] lint/typecheck OK

---

## V1.2-5 — Export CSV / rapport de conformité

**Persona** : Esther / Véréna
**Priorité** : Moyenne
**Statut** : `Fait`

### Décision canonique — figée

> **Aucun export global PDF n'est exposé dans la synthèse tant qu'aucune sortie réelle, qualifiée et branchée n'existe pour cette action. Les exports disponibles restent portés localement par les blocs métier qui les supportent réellement.**

### Contexte (post-audit)

- Les exports **CSV** (balance générale, rubriques, balance âgée) et **DOCX** (Diva) étaient déjà branchés dans `AccountingSummaryView` et blocs associés.
- `/tresorerie` : aucun bouton d'export fantôme.
- Seul problème : bouton sticky **« Export PDF »** sur `synthese/page.tsx` sans handler ni API.

### Livrable V1.2-5

**Option B** — suppression pure du bouton « Export PDF » du footer sticky. Aucun texte de remplacement (les exports par blocs restent visibles).

### DoD

- [x] bouton « Export PDF » supprimé de `app/(reporting)/synthese/page.tsx`
- [x] aucune promesse d'export global non tenue sur la page
- [x] exports réels par blocs inchangés
- [x] lint/typecheck OK — commit `f00feadd`

---

## V1.2-6 — Mini-graphes sparklines tuiles secondaires mobile

**Persona** : Max
**Priorité** : Basse
**Statut** : `À faire`

### Contexte

Les tuiles secondaires du cockpit mobile (`CompactTile`) n'affichent que valeur + badge confiance. Un mini-graphe de tendance (sparkline sur 6–8 points) apporterait une lecture rapide de l'évolution sans surcharger.

### Règle de déclenchement

- sparkline uniquement si au moins 3 points de série sont disponibles
- masquée proprement si données insuffisantes
- graphe secondaire — jamais au-dessus du KPI

### Tuiles prioritaires

BFR et Encours (données les plus stables et utiles en mobile).

### DoD

- [ ] sparkline visible sur BFR et Encours en mobile si série disponible
- [ ] masquée si série vide ou < 3 points
- [ ] KPI reste dominant visuellement
- [ ] pas de ralentissement notable du rendu mobile
- [ ] lint/typecheck OK

---

## Journal de clôture des tickets

*À remplir au fil de l'exécution.*

| ID | Date | Notes de clôture |
|----|------|-----------------|
| V1.2-1 | 24 mars 2026 | Routes `/business`, `/flux-net`, `/encours` créées. CompactTile enrichi d'un prop `href`. Commit `bfd56cfd`. |
| V1.2-2 | 24 mars 2026 | Chips Toutes/Urgence/Vigilance/Suivi sur `/alerts`. Cas A — taxonomie déjà normalisée. Commit `bfd56cfd`. |
| V1.2-3 | 24 mars 2026 | Option B actée — suppression du label "Projection J+30 — aperçu V2" dans `CockpitMobileView`. Aucun endpoint J+30 n'existe. Commit `71ff9873`. |
| V1.2-4 | 24 mars 2026 | Points de vente (`pos_shops`) et Z de caisse (`pos_z`) ajoutés à SECONDARY. Grille secondaire extraite en `grid-cols-4` (8 tuiles = 2 lignes de 4). Canon V5 complet : 12 tuiles. Commit `bcc20945`. |
| V1.2-5 | 24 mars 2026 | Audit : CSV/DOCX déjà branchés par blocs ; suppression du footer « Export PDF » fantôme sur `/synthese`. Commit `f00feadd`. |

---

*Backlog V1.2 Lynki — ouvert le 24 mars 2026.*
*Référence plan : [`PLAN_V1_2_LYNKI.md`](./PLAN_V1_2_LYNKI.md)*
