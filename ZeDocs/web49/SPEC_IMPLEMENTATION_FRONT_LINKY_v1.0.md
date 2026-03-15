# Spec d'implémentation front — Repositionnement Linky (v1.0)

**Référence copy :** MICROCOPY_REPO_READY_LINKY_v1.2  
**Document :** SPEC_IMPLEMENTATION_FRONT_LINKY_v1.0  
**Date :** 14 mars 2026  
**Objectif :** Implémentation front concrète, composant par composant : ordre des blocs, ids, variantes responsive, mise en forme.

---

## 1. Ordre des blocs (page d'accueil)

Ordre **obligatoire** à l'écran. Ne pas surcharger : pas de Cibles ni Crédibilité sauf si besoin visuel avéré.

| Ordre | Bloc | Composant | Id section (ancre) |
|-------|------|-----------|--------------------|
| 1 | Hero | `Hero` | `linky-en-action` *(à ajouter)* |
| 2 | Bandeau réassurance | `ReassuranceStrip` | — |
| 3 | Tension / problème | `ProblemSection` | — |
| 4 | Promesse produit | `PromiseSection` *(nouveau)* | — |
| 5 | Bénéfices métier | `BenefitsSection` | `benefices` |
| 6 | Différenciation | `DifferentiationSection` *(nouveau)* | — |
| 7 | Comment ça marche | `HowItWorks` | `comment-ca-marche` |
| 8 | CTA final | `VoyezDoreviaSection` | `voyez-dorevia` |

**Fichier cible :** `units/dorevia-suite/src/app/page.tsx`

---

## 2. Ancres à exposer

| Id | Où | Usage |
|----|-----|--------|
| `linky-en-action` | Hero : wrapper du bloc « Aperçu cockpit » (mockup) | CTA « Voir Linky en action », lien nav. **À créer.** |
| `benefices` | BenefitsSection (section ou premier conteneur) | Lien « Découvrir les cas d'usage » (option B). **Vérifier présence.** |
| `comment-ca-marche` | HowItWorks (section) | Lien nav « Comment ça marche ». Déjà présent. |
| `voyez-dorevia` | VoyezDoreviaSection (section) | Optionnel, pour cohérence. Déjà présent. |

**Règle :** Tout lien interne (nav, CTA) doit cibler une de ces ancres. `#linky-en-action` = premier endroit où l'utilisateur **voit** Linky (visuel).

---

## 3. Composant par composant

### 3.1 Navbar

- **Fichier :** `src/components/blocks/navbar.tsx`
- **Modifs :**
  - `NAV_LINKS` : remplacer "Voyez Dorevia en action" par **"Voir Linky en action"**, `href`: `/#linky-en-action`.
  - CTA principal : "Demander une démo" → `/contact`.
- **Responsive :** Menu mobile avec les mêmes libellés ; CTA court "Démo" acceptable sur petit écran.

---

### 3.2 Hero

- **Fichier :** `src/components/blocks/hero.tsx`
- **Ids :** Ajouter `id="linky-en-action"` sur le **wrapper du bloc aperçu cockpit** (la div qui contient la carte "Dorevia · Linky" / grille de métriques), pas sur tout le hero. Ainsi le scroll "Voir Linky en action" amène directement sur le visuel.
- **Structure recommandée :**
  - Ajouter un **eyebrow** au-dessus du H1 : "Dorevia Linky" (petit label, style discret).
  - H1, sous-titre, texte d'appui, 2 CTAs selon MICROCOPY §2.
  - Puis le bloc mockup avec `id="linky-en-action"` et `className="scroll-mt-24"` (ou équivalent) pour que la navbar ne masque pas le titre du bloc au scroll.
- **CTAs :** Principal "Demander une démo" → `/contact`. Secondaire "Voir Linky en action" → `/#linky-en-action`.
- **Typo :** H1 avec apostrophe typographique : **L'assistant** (U+2019).

---

### 3.3 ReassuranceStrip

- **Fichier :** `src/components/blocks/reassurance-strip.tsx`
- **Contenu :**
  - **Desktop (≥ md) :** Marge · Trésorerie · BFR · Encours clients · Retards · Concentrations (6 items, séparateur ·).
  - **Mobile (< md) :** Marge · Trésorerie · BFR · Risque client (4 items).
- **Implémentation :** Deux listes ou deux chaînes ; afficher l'une ou l'autre via classes responsive (ex. `hidden md:flex` / `flex md:hidden`) ou un hook `useMediaQuery`. Pas de changement de copy au runtime si possible, pour éviter flash.

---

### 3.4 ProblemSection

- **Fichier :** `src/components/blocks/problem-section.tsx`
- **Modifs :** Titre H2, paragraphe, 4 points (liste ou cartes) selon MICROCOPY §4. Pas d'id requis pour les liens.
- **Layout :** Conserver ou adapter la grille 3 colonnes pour les 4 points (ex. 2x2 sur mobile, 4 colonnes desktop).

---

### 3.5 PromiseSection (nouveau)

- **Fichier à créer :** `src/components/blocks/promise-section.tsx`
- **Contenu :** H2 "Linky transforme des données dispersées en lecture financière claire." + paragraphe (Pas un dashboard…) + liste à puces (lire plus vite, hiérarchiser, sécuriser, piloter). Voir MICROCOPY §5.
- **Style :** S’aligner sur le ton visuel des autres sections (fond, espacement). Pas d’id nécessaire.

---

### 3.6 BenefitsSection

- **Fichier :** `src/components/blocks/benefits-section.tsx`
- **Id :** `id="benefices"` sur la `<section>` (ou premier conteneur). Ajouter `scroll-mt-24` pour le scroll avec navbar fixe.
- **Modifs :** Titre H2, 4 cartes (Marge, Trésorerie, **BFR et encours**, Risque client) avec descriptions MICROCOPY §6. Remplacer l’intro actuelle par une courte phrase optionnelle.
- **Ligne sous les cartes :** Optionnel — "Données fiables · Lecture structurée · Pilotage actionnable".

---

### 3.7 DifferentiationSection (nouveau)

- **Fichier à créer :** `src/components/blocks/differentiation-section.tsx`
- **Contenu :** H2 "Voir des chiffres ne suffit pas. Il faut pouvoir les lire." + paragraphe Linky (3 puces) + baseline "Moins de lecture brute. Plus de pilotage." MICROCOPY §7.
- **Style :** Bloc court, dense. Fond possiblement légèrement différencié (muted) pour rythme.

---

### 3.8 HowItWorks

- **Fichier :** `src/components/blocks/how-it-works.tsx`
- **Id :** `id="comment-ca-marche"` sur la section + `scroll-mt-24`.
- **Modifs :** Titre H2, intro, 3 étapes (Connecter, Fiabiliser, Piloter) avec descriptions MICROCOPY §8. Conserver le bloc DIVA en dessous. Phrase de preuve discrète sous les 3 cartes.

---

### 3.9 VoyezDoreviaSection (CTA final)

- **Fichier :** `src/components/blocks/voyez-dorevia-section.tsx`
- **Id :** `id="voyez-dorevia"` sur la section (déjà présent).
- **Modifs :** Titre H2, sous-titre, 2 ou 3 cartes selon option A/B MICROCOPY §11. Si option B : premier lien "Voir Linky en action" → `/#linky-en-action`. Réassurance sous les CTAs : "Démonstration sur cas réel ou simulé, selon votre contexte."

---

## 4. Mise en forme et UX

### 4.1 Typographie

- **Apostrophe française :** Utiliser l’apostrophe courbe (U+2019) dans tous les textes affichés : L'assistant, d'appui, l'ERP, etc. En React/JSX, soit utiliser le caractère dans la string, soit une constante `APOSTROPHE = '\u2019'` pour cohérence.
- **H1 / H2 :** Hiérarchie claire ; H1 unique (hero). Tailles et weights selon charte existante.

### 4.2 Visibilité « Linky »

- Hero : eyebrow + H1 + texte d’appui.
- Bénéfices : titre "Ce que **Linky** vous aide à voir".
- How it works : étape 3 "**Linky** restitue…" + phrase de preuve.
- CTA final : titre "Voyez ce que **Linky** peut changer" + sous-titre "Dorevia Linky".
- Nav : "Voir **Linky** en action".

### 4.3 Responsive

- ReassuranceStrip : 6 items desktop / 4 items mobile (voir §3.3).
- Hero : titre et CTAs empilés sur mobile, mockup pleine largeur.
- Grilles (bénéfices, how it works, CTA) : 1 col mobile, 2–3 cols tablette/desktop selon maquette.

### 4.4 Scroll et ancres

- Toutes les sections ciblées par un lien (linky-en-action, benefices, comment-ca-marche) doivent avoir `scroll-mt-*` (ex. `scroll-mt-24`) pour compenser la navbar fixe et éviter que le titre soit masqué.

---

## 5. Checklist d’implémentation

- [ ] Navbar : "Voir Linky en action" + `/#linky-en-action`
- [ ] Hero : eyebrow, H1 (L'assistant…), sous-titre, texte d’appui, 2 CTAs ; `id="linky-en-action"` sur le bloc mockup ; scroll-mt
- [ ] ReassuranceStrip : 6 items desktop / 4 items mobile
- [ ] ProblemSection : nouveau titre, paragraphe, 4 points
- [ ] Créer PromiseSection et l’insérer après ProblemSection
- [ ] BenefitsSection : id="benefices", titre, 4 cartes (BFR et encours), scroll-mt
- [ ] Créer DifferentiationSection et l’insérer après BenefitsSection
- [ ] HowItWorks : nouveau titre, intro, 3 étapes (texte étape 2), phrase de preuve, scroll-mt
- [ ] VoyezDoreviaSection : titre, sous-titre, liens (Voir Linky en action → #linky-en-action), réassurance
- [ ] page.tsx : ordre des blocs = Hero, ReassuranceStrip, ProblemSection, PromiseSection, BenefitsSection, DifferentiationSection, HowItWorks, VoyezDoreviaSection
- [ ] Apostrophe typographique (U+2019) partout
- [ ] SEO : title, meta description (layout ou page)

---

## 6. Fichiers impactés (résumé)

| Fichier | Action |
|---------|--------|
| `src/app/page.tsx` | Ordre des blocs, import PromiseSection, DifferentiationSection |
| `src/components/blocks/navbar.tsx` | Libellés, href linky-en-action |
| `src/components/blocks/hero.tsx` | Copy complète, eyebrow, id linky-en-action |
| `src/components/blocks/reassurance-strip.tsx` | 2 variantes desktop/mobile |
| `src/components/blocks/problem-section.tsx` | Copy §4 |
| `src/components/blocks/promise-section.tsx` | **Créer** |
| `src/components/blocks/benefits-section.tsx` | id benefices, copy §6, 4 cartes |
| `src/components/blocks/differentiation-section.tsx` | **Créer** |
| `src/components/blocks/how-it-works.tsx` | Copy §8, 3 étapes |
| `src/components/blocks/voyez-dorevia-section.tsx` | Copy §11, liens |
| `src/app/layout.tsx` (ou page) | Title, meta description |

---

*Spec front v1.0 — à utiliser avec MICROCOPY_REPO_READY_LINKY_v1.2. Copy = référence unique ; la présente spec ne modifie pas les textes, elle fixe structure, ids et comportement.*