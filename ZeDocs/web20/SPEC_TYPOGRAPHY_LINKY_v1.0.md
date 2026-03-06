# SPEC_TYPOGRAPHY_LINKY_v1.0

**Produit :** Dorevia Linky
**Date :** 15 février 2026
**Statut :** Spécification officielle — Typographie système
**Orientation :** Modernité maîtrisée / cockpit financier
**Stack cible :** Next.js + Tailwind

---

# 0. Philosophie

La typographie de Linky doit :

* Éliminer toute rupture cognitive
* Garantir une lecture rapide des données financières
* Maintenir une hiérarchie visuelle stricte
* Soutenir le positionnement "infrastructure financière"
* Être stable, dense et maîtrisée

Linky n’est pas un site marketing.
C’est un instrument de pilotage.

---

# 1. Police officielle

## 1.1 Famille unique

**Police officielle : Inter (variable font)**

Licence : Open Font License
Usage commercial : autorisé
Chargement recommandé : `next/font/google`

---

## 1.2 Fallback stack

```css
font-family: "Inter", system-ui, -apple-system, sans-serif;
```

---

# 2. Poids autorisés

Seulement 4 graisses sont autorisées :

| Weight | Usage                   |
| ------ | ----------------------- |
| 400    | Corps de texte          |
| 500    | Labels / contexte       |
| 600    | Titres cartes / valeurs |
| 700    | Titres majeurs (rare)   |

Interdits :

* 300
* 800+
* Mélanges excessifs

Maximum 3 poids visibles par écran.

---

# 3. Système hiérarchique

## 3.1 Niveau 0 — Logo

Défini dans SPEC_LOGO_DOREVIA_LINKY_v1.0
Tracking spécifique autorisé.

---

## 3.2 Niveau 1 — Titres principaux

Exemples :

* Trésorerie
* Flux POS
* Notes de crédit

Spécifications :

* Weight 600
* Taille : 1.125rem – 1.25rem
* Letter-spacing : -0.01em
* Line-height : 1.3

---

## 3.3 Niveau 2 — Titres de cartes

* Weight 600
* Taille : 1rem – 1.125rem
* Letter-spacing : -0.005em
* Line-height : 1.3

---

## 3.4 Niveau 3 — Labels / métadonnées

Exemples :

* Exercice à date

* Partenaire

* Statut

* Weight 500

* Taille : 0.875rem

* Uppercase autorisé

* Tracking max : +0.05em

---

## 3.5 Niveau 4 — Corps de texte

* Weight 400
* Taille : 1rem
* Line-height : 1.5
* Tracking : 0

---

# 4. Chiffres & montants (CRITIQUE)

Toutes les valeurs financières doivent utiliser :

```css
font-variant-numeric: tabular-nums;
```

Ou en Tailwind :

```
tabular-nums
```

Règles :

* Weight 600
* Alignement droite dans les tableaux
* Aucun espacement variable
* Pas de police différente pour les chiffres

Sans cela :
→ rupture cognitive
→ sensation amateur

---

# 5. Densité verticale

| Élément  | Line-height |
| -------- | ----------- |
| Titres   | 1.2 – 1.3   |
| Chiffres | 1.2         |
| Corps    | 1.5         |
| Labels   | 1.3         |

Trop d’air = dashboard marketing
Trop dense = ERP legacy

Linky = densité maîtrisée.

---

# 6. Tailles standardisées

Base HTML : 16px

Échelle officielle :

| Usage           | Taille          |
| --------------- | --------------- |
| XL KPI          | 1.5rem (24px)   |
| Titre principal | 1.25rem (20px)  |
| Titre carte     | 1.125rem (18px) |
| Corps           | 1rem (16px)     |
| Label           | 0.875rem (14px) |
| Micro           | 0.75rem (12px)  |

Aucune taille arbitraire autorisée.

---

# 7. Majuscules & cohérence

Autorisé :

* Logo
* Labels contextuels courts

Interdit :

* Paragraphes en ALL CAPS
* Mélange incohérent Title Case / uppercase
* Variation aléatoire de casse

---

# 8. Tracking autorisé

| Usage            | Tracking          |
| ---------------- | ----------------- |
| Logo             | spécifique        |
| Labels uppercase | +0.03em à +0.05em |
| Titres           | -0.01em           |
| Corps            | 0                 |

---

# 9. Performance

Utiliser :

```tsx
import { Inter } from 'next/font/google'
```

Options recommandées :

* subsets: ['latin']
* display: 'swap'
* variable: '--font-inter'

Éviter les imports CSS externes si possible.

---

# 10. Cohérence globale

Cette typographie doit être identique pour :

* Linky
* Vault (UI)
* DLP
* DIVA (UI lecture seule)

Objectif :
→ Écosystème unifié.

---

# 11. Interdictions

❌ Mélange de plusieurs familles
❌ Police fantaisie
❌ Serif dans l’interface
❌ Poids extrêmes
❌ Espacements incohérents

---

# 12. Intention finale

La typographie Linky doit transmettre :

* Autorité
* Clarté
* Densité maîtrisée
* Contrôle
* Sérénité

Elle doit être invisible.
Si on la remarque, c’est qu’elle est mal utilisée.

---

**SPEC_TYPOGRAPHY_LINKY_v1.0 officiellement verrouillée.**
