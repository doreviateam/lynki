# Backlog V1.2 — Lynki

*Tickets d'exécution pour le chantier V1.2. Chaque ticket est fermable indépendamment.*
*Référence plan : [`PLAN_V1_2_LYNKI.md`](./PLAN_V1_2_LYNKI.md)*

**Ouverture** : 24 mars 2026

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
| V1.2-1 | Navigation détail multi-tuiles desktop | Haute | `À faire` |
| V1.2-2 | Filtre lecture alertes (urgence / vigilance / suivi) | Haute | `À faire` |
| V1.2-3 | Projection J+30 Trésorerie | Haute | `À faire` |
| V1.2-4 | Tuiles C manquantes dans le canon desktop | Moyenne | `À faire` |
| V1.2-5 | Export CSV / rapport de conformité | Moyenne | `À faire` |
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

### Contexte

La projection J+30 est mentionnée dans les tuiles Trésorerie (mobile et desktop) avec le label "aperçu V2". Elle reste donc non branchée. Deux options : la brancher sur une vraie donnée, ou la masquer proprement tant qu'elle n'est pas disponible.

### Décision à trancher avant implémentation

| Option | Condition | Action |
|--------|-----------|--------|
| A — Brancher | Un endpoint de projection existe ou peut être créé rapidement | Afficher la projection avec badge "Projection J+30" |
| B — Masquer | Aucun endpoint disponible | Supprimer le texte "aperçu V2" et laisser la zone vide ou absente |

**Règle absolue** : aucune valeur fictive ou hardcodée ne peut subsister.

### Fichiers impactés

- `units/dorevia-linky/components/CockpitMobileView.tsx`
- `units/dorevia-linky/components/CockpitDesktopView.tsx`
- `units/dorevia-linky/app/(cockpit)/tresorerie/page.tsx`

### DoD

- [ ] décision A ou B tranchée et documentée
- [ ] si option A : projection affichée avec source et qualification explicites
- [ ] si option B : label "aperçu V2" supprimé, zone proprement gérée
- [ ] aucune valeur fictive visible
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
**Statut** : `À faire`

### Contexte

Des boutons d'export sont présents sur `/tresorerie` et `/synthese` mais la logique de déclenchement est absente ou incomplète.

### Périmètre minimal recommandé

Commencer par 2 exports concrets et utiles :

1. **Export trésorerie** : tableau de rapprochement bancaire en CSV
2. **Export rubriques bilan/CdR** : déjà implémenté dans `AccountingSummaryView` — à vérifier et valider sur les boutons visibles

### DoD

- [ ] bouton "Export trésorerie" déclenche un fetch + blob download réel
- [ ] bouton "Export synthèse" cohérent avec les exports déjà présents dans les blocs comptables
- [ ] gestion d'erreur propre (Vault indisponible, timeout)
- [ ] pas de bouton fantôme ou silencieux résiduel
- [ ] lint/typecheck OK

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
| — | — | — |

---

*Backlog V1.2 Lynki — ouvert le 24 mars 2026.*
*Référence plan : [`PLAN_V1_2_LYNKI.md`](./PLAN_V1_2_LYNKI.md)*
