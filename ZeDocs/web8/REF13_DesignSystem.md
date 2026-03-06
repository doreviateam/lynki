# 🎨 Design System Light — Dorevia‑Vault

**Version :** 1.0
**Date :** 24 janvier 2026
**Statut :** Référence UX & UI officielle (Light) — **FINAL**
**Portée :** Landing, UI Dorevia, documents PDF, supports commerciaux

---

## 🎯 Objectif du Design System

Ce design system définit une **grammaire visuelle minimale, stable et crédible** pour Dorevia‑Vault.

Il a pour objectifs de :

* garantir une **cohérence visuelle durable**,
* renforcer la **crédibilité CFO / conformité / audit**,
* accélérer l’implémentation sans dette UX,
* éviter toute dérive marketing ou décorative.

> ⚖️ *Light par choix, strict par nécessité.*

---

## 1️⃣ Fondations visuelles (Tokens)

### 🎨 Palette de couleurs

| Rôle             | Variable   | Valeur                  | Usage                 |
| ---------------- | ---------- | ----------------------- | --------------------- |
| Fond principal   | `--bg`     | `#0b1220`               | Fond global, autorité |
| Panneaux         | `--panel`  | `#0f1a2e`               | Zones secondaires     |
| Cartes           | `--card`   | `#111f38`               | Conteneurs            |
| Texte principal  | `--text`   | `#e9eefc`               | Titres, contenu clé   |
| Texte secondaire | `--muted`  | `#b7c2df`               | Paragraphes           |
| Texte tertiaire  | `--muted2` | `#91a0c8`               | Aide, légendes        |
| Accent preuve    | `--btn`    | `#10b981`               | CTA, validation       |
| Séparateurs      | `--line`   | `rgba(255,255,255,.10)` | Bordures              |

**Règles non négociables :**

* Une seule couleur d’accent par écran.
* Le vert est **réservé à la preuve, à l’action ou à la validation**.

---

### 🔤 Typographie

* **Famille unique :** `system-ui` (sérieux, natif, durable)

| Niveau  | Variable | Usage               |
| ------- | -------- | ------------------- |
| Hero    | `--h1`   | Promesse centrale   |
| Section | `--h2`   | Titres structurants |
| Bloc    | `--h3`   | Sous-titres         |
| Texte   | `--p`    | Lecture continue    |

**Règles :**

* Jamais plus de **3 niveaux typographiques visibles** par écran.
* Pas d’effets décoratifs (italique décoratif, uppercase massif, etc.).

---

### 📐 Rythme & respiration

| Élément         | Valeur    | Intention             |
| --------------- | --------- | --------------------- |
| Largeur max     | `1120px`  | Lisibilité CFO        |
| Padding section | `100px 0` | Respiration Pennylane |
| Inter‑bloc      | `16–22px` | Lecture calme         |

> 🧘‍♂️ *Le vide est un outil de clarté, pas un manque.*

---

## 2️⃣ Composants fondamentaux

### 🔘 Boutons

**Bouton primaire**

* Action principale
* Vert preuve
* 1 maximum par écran

**Bouton secondaire**

* Action humaine / exploratoire
* Fond neutre, jamais dominant

> ❗ Interdit : 2 boutons primaires côte à côte

---

### 🧱 Carte (`.card`)

Usage :

* Encapsuler une idée
* Séparer sans enfermer

Caractéristiques :

* Bordure légère
* Fond translucide
* Ombre douce

---

### 🏷 Badge conformité

Usage strictement réservé à :

* conformité
* certification
* preuve réglementaire

> ⚠️ Jamais utilisé comme élément décoratif.

---

### ✅ Proof point

Structure :

* Verbe fort
* Explication courte

Exemple :

> **Immuable.** Horodatage et scellage cryptographique.

---

## 3️⃣ Règles UX non négociables

Ces règles priment sur toute décision esthétique.

* 1 promesse principale par section
* 1 CTA primaire maximum par écran
* Aucun visuel sans fonction explicative
* Aucune animation gratuite
* Aucun jargon marketing flou

> 🧭 *Si un élément ne sert pas la preuve, il n’existe pas.*

---

## 4️⃣ Usage & extensions

### Landing

* Structure Hero + 3 sections
* Visuels SVG explicatifs
* Lecture non linéaire possible

### UI Dorevia

* Lecture seule clairement visible
* Hiérarchie de données simple

### Documents & PDF

* Même palette
* Même typographie
* Même ton factuel

---

## 🏁 Principe directeur

> **Dorevia-Vault ne cherche pas seulement à séduire.**
> **Il cherche avant tout à être cru.**

---

**Statut :** Design System Light validé — Référence officielle Dorevia‑Vault
