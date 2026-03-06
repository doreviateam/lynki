# Rapport — Typographie et polices de caractères pour Dorevia Linky

**Date :** 15 février 2026  
**Objectif :** Recommandations didactiques pour harmoniser les visuels et améliorer l'expérience utilisateur  
**Public :** Décideurs et équipes produit peu familiers avec la typographie web  
**Spec normative :** [SPEC_TYPOGRAPHY_LINKY_v1.0.md](SPEC_TYPOGRAPHY_LINKY_v1.0.md) — choix Inter, tabular-nums, poids 400–700

---

## Table des matières

1. [Introduction — Pourquoi la typographie compte](#1-introduction)
2. [Notions de base — Vocabulaire et concepts](#2-notions-de-base)
3. [Contexte Dorevia Linky — Vos besoins spécifiques](#3-contexte-dorevia-linky)
4. [Polices recommandées — Détail par option](#4-polices-recommandées)
5. [Mise en œuvre — Comment appliquer les choix](#5-mise-en-œuvre)
6. [Synthèse et décision](#6-synthèse)

---

<a id="1-introduction"></a>
## 1. Introduction — Pourquoi la typographie compte

### 1.1 Qu'est-ce que la typographie ?

La **typographie** désigne l'art et la technique de composer du texte à partir de caractères imprimés ou numériques. En pratique, c'est le choix des polices, des tailles, des espacements et des couleurs pour rendre un texte lisible et agréable.

### 1.2 Impact sur l'expérience utilisateur

| Aspect | Effet d'une bonne typographie | Effet d'une typographie négligée |
|--------|-------------------------------|----------------------------------|
| **Lisibilité** | Lecture fluide, moins de fatigue oculaire | Texte difficile à déchiffrer, confusion |
| **Confiance** | Perception de sérieux et de professionnalisme | Impression d'amateurisme |
| **Hiérarchie** | Structure claire (titres, sous-titres, corps) | Tout se ressemble, perte de repères |
| **Données** | Chiffres alignés, tableaux compréhensibles | Montants décalés, erreurs de lecture |
| **Accessibilité** | Utilisateurs malvoyants ou dyslexiques mieux servis | Exclusion de certains utilisateurs |

### 1.3 Pourquoi ce rapport ?

Dorevia Linky affiche beaucoup de **données financières** (montants, tableaux, graphiques). La typographie doit :

- Rendre les chiffres **rapidement lisibles**
- Maintenir une **hiérarchie visuelle** claire
- S'aligner sur le **positionnement** (infrastructure financière, autorité, modernité maîtrisée)

---

<a id="2-notions-de-base"></a>
## 2. Notions de base — Vocabulaire et concepts

### 2.1 Police vs fonte vs famille

| Terme | Définition | Exemple |
|-------|------------|---------|
| **Famille de polices** | Ensemble de styles liés (Regular, Bold, Italic, etc.) | Source Sans 3 |
| **Police** | Une variante précise d'une famille | Source Sans 3 Bold |
| **Fonte** | Fichier technique (ex. .woff2) contenant les glyphes | SourceSans3-Bold.woff2 |

En pratique, on parle souvent de "police" pour désigner une famille entière.

### 2.2 Serif vs sans-serif

| Catégorie | Caractéristique | Usage typique |
|-----------|-----------------|---------------|
| **Serif** | Petits empattements aux extrémités des lettres (ex. Times New Roman) | Longs textes imprimés, éditorial |
| **Sans-serif** | Pas d'empattements, formes épurées | Écrans, interfaces, données |

Pour une application web comme Linky, on privilégie les **sans-serif** : meilleure lisibilité à l'écran, surtout pour les chiffres.

### 2.3 Graisses (ou poids)

La **graisse** indique l'épaisseur du trait :

| Nom technique | Valeur | Usage |
|---------------|--------|-------|
| Thin / Hairline | 100 | Très rare en UI |
| Light | 300 | Sous-titres légers |
| Regular | 400 | Corps de texte principal |
| Medium | 500 | Emphase légère |
| Semibold | 600 | Titres de cartes, labels |
| Bold | 700 | Titres principaux |
| ExtraBold | 800 | Peu utilisé |

Pour Linky : **Regular** pour le corps, **Semibold** ou **Bold** pour les titres.

### 2.4 Chiffres tabulaires vs proportionnels

| Type | Description | Quand l'utiliser |
|------|-------------|------------------|
| **Proportionnels** | Chaque chiffre a une largeur variable (le 1 est étroit, le 0 large) | Texte en ligne |
| **Tabulaires** | Tous les chiffres ont la même largeur | Tableaux, montants alignés, graphiques |

Pour les montants et tableaux, les **chiffres tabulaires** évitent les décalages quand on change de valeur (ex. 99 → 100).

### 2.5 Tailles et unités

| Unité | Valeur | Usage |
|-------|--------|-------|
| **px** | Pixel | Tailles fixes, logo |
| **rem** | Relatif à la taille de base du document (souvent 16px) | Corps de texte, accessibilité |
| **em** | Relatif au parent | Composants imbriqués |

Recommandation : **rem** pour le texte (1rem ≈ 16px par défaut). Minimum 14px (0.875rem) pour le corps.

### 2.6 Interlignage (line-height)

L'interlignage est l'espace entre deux lignes. Trop serré = difficile à lire ; trop large = gaspillage.

| Contexte | Valeur typique |
|----------|----------------|
| Corps de texte | 1.4 à 1.6 |
| Titres | 1.2 à 1.3 |
| Chiffres / tableaux | 1.2 à 1.4 |

### 2.7 Tracking (letter-spacing)

Espacement horizontal entre les lettres. Utile pour :
- **Uppercase** (DOREVIA) : +0.1em à +0.2em améliore la lisibilité
- **Corps de texte** : généralement 0

---

<a id="3-contexte-dorevia-linky"></a>
## 3. Contexte Dorevia Linky — Vos besoins spécifiques

### 3.1 Profil de l'application

| Caractéristique | Implication typographique |
|-----------------|---------------------------|
| **Cockpit financier** | Beaucoup de chiffres, tableaux, montants |
| **Audience experte** | DAF, experts-comptables, auditeurs — exigence de clarté |
| **Branding** | Modernité maîtrisée, autorité, pas "startup fun" |
| **Écosystème** | Vault, DLP, DIVA — cohérence visuelle souhaitable |
| **Plateformes** | Web (desktop, tablette, mobile) |

### 3.2 Critères de sélection

| Critère | Poids | Explication |
|---------|-------|-------------|
| **Lisibilité des chiffres** | Très élevé | Montants partout ; chiffres mal formés = erreurs de lecture |
| **Chiffres tabulaires** | Très élevé | Alignement des colonnes de montants |
| **Ton institutionnel** | Élevé | Pas de police "fun" ou décorative |
| **Performance** | Élevé | Chargement rapide, pas de flash de texte non stylé |
| **Accessibilité** | Élevé | Contraste, taille minimale, support dyslexie |
| **Cohérence logo** | Moyen | Logo DOREVIA Linky peut utiliser la même famille ou une proche |

### 3.3 Ce que vous utilisez aujourd'hui

D'après `globals.css` :

```css
font-family: system-ui, -apple-system, sans-serif;
```

C'est une **police système** : le navigateur utilise celle de l'OS (San Francisco sur macOS, Segoe UI sur Windows, Roboto sur Android). Pas de fichier à charger, donc excellente performance, mais rendu variable selon l'appareil.

---

<a id="4-polices-recommandées"></a>
## 4. Polices recommandées — Détail par option

### 4.1 Option A — Rester sur les polices système (référence)

**Stack :** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

| Avantage | Inconvénient |
|----------|--------------|
| Aucun téléchargement | Rendu différent selon OS |
| Performance maximale | Moins de contrôle sur la marque |
| Zéro coût, zéro maintenance | Pas d'identité typographique forte |

**Verdict :** Idéal si la priorité est simplicité et performance. Suffisant pour une V1.

---

### 4.2 Option B — Source Sans 3 (recommandation principale)

**Famille :** Source Sans 3 (Adobe, Open Font License)

| Critère | Détail |
|---------|--------|
| **Lisibilité** | Excellente à l'écran ; conçue pour le texte long |
| **Chiffres** | Tabular figures inclus (variable `tnum`) |
| **Ton** | Professionnel, sobre, pas "tech" |
| **Graisses** | 200 à 900 ; 6 à 12 variantes selon la version |
| **Licence** | OFL — gratuit, usage commercial autorisé |
| **Chargement** | Google Fonts, variable font possible |

**Usage typique :** Applications métier, portails institutionnels, données financières.

**Exemple d'implémentation :**
```css
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

body {
  font-family: "Source Sans 3", system-ui, sans-serif;
}
```

---

### 4.3 Option C — Inter

**Famille :** Inter (Rasmus Andersson, Open Font License)

| Critère | Détail |
|---------|--------|
| **Lisibilité** | Optimisée pour les écrans ; très lisible en petit |
| **Chiffres** | Tabular figures inclus |
| **Ton** | Moderne, technique, "produit SaaS" |
| **Graisses** | 100 à 900 (variable font) |
| **Licence** | OFL |
| **Popularité** | Très utilisée (Figma, Vercel, etc.) |

**Usage typique :** Interfaces techniques, dashboards, applications web modernes.

**Exemple d'implémentation :**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: "Inter", system-ui, sans-serif;
}
```

---

### 4.4 Option D — IBM Plex Sans

**Famille :** IBM Plex Sans (IBM, Open Font License)

| Critère | Détail |
|---------|--------|
| **Lisibilité** | Très bonne ; conçue pour IBM |
| **Ton** | Institutionnel, sérieux, "entreprise" |
| **Chiffres** | Tabular figures disponibles |
| **Graisses** | 100 à 700 |
| **Licence** | OFL |

**Usage typique :** Portails entreprises, logiciels métier, rapports.

**Exemple d'implémentation :**
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

body {
  font-family: "IBM Plex Sans", system-ui, sans-serif;
}
```

---

### 4.5 Option E — Geist (Vercel)

**Famille :** Geist (Vercel)

| Critère | Détail |
|---------|--------|
| **Lisibilité** | Excellente |
| **Ton** | Moderne, épuré |
| **Usage** | Next.js, Vercel, apps modernes |
| **Licence** | MIT |

**Note :** Plus "tech / startup" ; à considérer si vous voulez un positionnement très contemporain.

---

### 4.6 Tableau comparatif synthétique

| Police | Ton | Lisibilité | Chiffres tab. | Performance | Recommandation |
|--------|-----|------------|---------------|-------------|----------------|
| System-ui | Variable | Bonne | Selon OS | Excellente | Référence / fallback |
| Source Sans 3 | Institutionnel | Excellente | Oui | Bonne | **Recommandée** |
| Inter | Moderne/tech | Excellente | Oui | Bonne | Alternative |
| IBM Plex Sans | Entreprise | Très bonne | Oui | Bonne | Alternative institutionnelle |
| Geist | Moderne | Excellente | Oui | Bonne | Option "tech" |

---

<a id="5-mise-en-œuvre"></a>
## 5. Mise en œuvre — Comment appliquer les choix

### 5.1 Où définir la police ?

Dans Linky, le fichier clé est `app/globals.css` :

```css
body {
  font-family: system-ui, -apple-system, sans-serif;
}
```

On remplace par la police choisie + fallback :

```css
body {
  font-family: "Source Sans 3", system-ui, sans-serif;
}
```

### 5.2 Charger une police web (Google Fonts)

**Option 1 — Import CSS (simple) :**
```html
<!-- Dans layout.tsx ou _document -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Option 2 — next/font (Next.js, optimisé) :**
```tsx
// app/layout.tsx
import { Source_Sans_3 } from 'next/font/google'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={sourceSans.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### 5.3 Chiffres tabulaires pour les montants

Pour aligner les montants en colonnes :

```css
.amount, .tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

Ou en Tailwind : `tabular-nums`.

### 5.4 Hiérarchie typographique suggérée

| Élément | Police | Graisse | Taille (ex.) |
|---------|--------|---------|--------------|
| Titre de page | Source Sans 3 | 700 | 1.5rem (24px) |
| Titre de carte | Source Sans 3 | 600 | 1.125rem (18px) |
| Corps de texte | Source Sans 3 | 400 | 1rem (16px) |
| Labels / métadonnées | Source Sans 3 | 500 | 0.875rem (14px) |
| Chiffres / montants | Source Sans 3 | 600 | 1rem ou 1.125rem |

### 5.5 Cohérence avec le logo

Le logo utilise actuellement la police système. Deux approches :

1. **Garder la police système pour le logo** : le logo conserve son rendu actuel.
2. **Utiliser la même famille** : DOREVIA et Linky en Source Sans 3 (ou Inter, etc.) pour une cohérence totale.

La seconde option renforce l'identité visuelle mais implique de modifier le composant logo.

---

<a id="6-synthèse"></a>
## 6. Synthèse et décision

### 6.1 Recommandation finale

| Priorité | Police | Raison |
|----------|--------|--------|
| **1** | Source Sans 3 | Bon équilibre lisibilité / ton institutionnel ; chiffres tabulaires ; OFL |
| **2** | IBM Plex Sans | Ton très institutionnel ; adapté au monde finance / entreprise |
| **3** | Inter | Si vous souhaitez un positionnement plus "produit tech" |
| **4** | System-ui | Si vous restez en minimal (performance, simplicité) |

### 6.2 Plan d'action suggéré

| Étape | Action | Effort |
|-------|--------|--------|
| 1 | Tester Source Sans 3 en local (next/font ou Google Fonts) | 1–2 h |
| 2 | Appliquer `font-variant-numeric: tabular-nums` aux montants | 30 min |
| 3 | Vérifier la lisibilité sur cartes, tableaux, graphiques | 1 h |
| 4 | Décider si le logo utilise la même police | Optionnel |
| 5 | Documenter le choix dans une spec typographie | 30 min |

### 6.3 Références utiles

| Ressource | Lien / Contenu |
|-----------|----------------|
| Google Fonts | fonts.google.com |
| next/font | nextjs.org/docs/app/building-your-application/optimizing/fonts |
| Font-variant-numeric | developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric |
| Source Sans 3 | fonts.google.com/specimen/Source+Sans+3 |
| Inter | fonts.google.com/specimen/Inter |
| IBM Plex Sans | fonts.google.com/specimen/IBM+Plex+Sans |

---

**Fin du rapport**
