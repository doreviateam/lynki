# Feedback UX — Tableau de bord Dorevia Linky v1.0

Document de synthèse des retours utilisateur et plan d’amélioration.

## Points forts identifiés
- Design moderne avec dark mode bien exécuté
- Structure en grille claire et organisée
- Code couleur pour les tendances (vert/rouge)
- Icônes pertinentes par métrique
- Hiérarchie globale compréhensible

---

## Suggestions d’amélioration

### 1. Lisibilité & contraste
- Texte gris sur fond sombre parfois peu lisible (ex. « Synthèse en préparation… »)
- **Action** : augmenter l’opacité des textes secondaires ou gris plus clair (#8B92A8 → appliqué via `--text-secondary`)

### 2. Hiérarchie visuelle
- Les 12 cartes ont le même poids visuel → différencier la **taille** des KPIs prioritaires (Trésorerie, Business, Flux net)
- **Action** : système A/B/C déjà en place (tuiles maîtresses / secondaires) ; s’assurer que les tailles de valeur (--tile-a-value-size, etc.) sont bien appliquées dans la grille

### 3. Cohérence des couleurs
- Charte sémantique à respecter :
  - Bleu = informations neutres
  - Vert = positif/croissance
  - Rouge = négatif/alerte
  - Orange = important/attention

### 4. Espacement & alignement
- Montants à aligner **à droite** (standard financier)
- **Action** : alignement à droite des chiffres dans la grille et les cartes

### 5. Section « INSIGHT PRINCIPAL »
- Remplacer « Synthèse en préparation… » par un loader animé ou skeleton
- Afficher un dernier insight disponible en attendant

### 6. Accessibilité
- Tooltips explicatifs pour chaque indicateur (BFR, ENCOURS, EBE…) — **déjà en place** (icône « i » + `tile-help`)
- Ajouter icônes +/− pour les tendances en plus des couleurs

### 7. Interactions
- Hover sur les cartes (léger soulèvement, opacité) — **partiellement en place** (hover border/bg)
- Cartes cliquables pour le détail — **en place**

### 8. Footer / barre inférieure
- Barre « Source: Vault - Preuves scellées… » peu lisible
- Déplacer infos techniques dans un menu paramètres ou réduire la taille

### 9. Responsive
- Empilement vertical mobile (3→2→1 colonne) — **en place** (grille 2/3/4 colonnes selon breakpoints)
- Tester sur différentes tailles d’écran

### 10. Micro-copywriting
- « La Platine » → « Cockpit La Platine » ou tooltip
- « Z DE CAISSE » avec « — » → expliquer l’absence de donnée

---

## Priorités rapides (implémentées en v1)

| # | Priorité | Statut |
|---|----------|--------|
| 1 | Uniformiser l’alignement des chiffres à droite | ✅ |
| 2 | Améliorer le contraste des textes secondaires | ✅ |
| 3 | Tooltips explicatifs (BFR, ENCOURS, EBE…) | ✅ (renforcé avec title sur libellé) |
| 4 | Hiérarchie de taille cartes importantes / secondaires | ✅ (utilisation valueSize A/B/C dans grille) |

---

## Backlog ultérieur
- Loader/skeleton section Insight principal
- Icônes +/− pour tendances
- Ajustement footer (lisibilité, menu paramètres)
- Micro-copy « Cockpit La Platine », explication Z de caisse
