# SPEC — HERO Dorevia‑Vault — « Valider · Sceller · Prouver » + Détails au survol (v1.8)
**Date** : 2026-01-18  
**Statut** : ✅ **Implémenté**  
**Auteur** : Dorevia Team  
**Scope** : Bloc HERO uniquement (header + hero full viewport + schéma 3 cartes)  
**Base** : Implémentation v1.7 (CSS externalisé `hero.css`, JS `hero.js`, analytics `hero-analytics.js`, tests E2E)

---

## 1) Objectif

Améliorer le **storytelling produit** et l'**impact visuel** du schéma 3 cartes en adoptant la signature :

> **Valider · Sceller · Prouver**

…tout en ajoutant une interaction **« détails au survol »** (desktop) et **« détails au tap »** (mobile) :

- **Vue par défaut** : cartes **courtes, très lisibles**, orientées métier.
- **Au survol / focus** : révéler **le détail** (liste d'événements / éléments de preuve) sans surcharger le hero.

---

## 2) Résultat attendu (UX)

### Desktop (≥ 992px)
- Les 3 cartes sont visibles en permanence.
- Au **survol** d'une carte (ou focus clavier), un panneau « détails » apparaît **dans la carte** :
  - animation légère (opacity + translateY)
  - pas de reflow brutal (hauteur gérée / overlay contrôlé)
- La **carte 3 (Prouver)** reste visuellement plus « forte » (légèrement mise en avant).

### Mobile / Tablette (≤ 991px)
- Pas de hover fiable → interaction au **tap** :
  - tap sur une carte = toggle détail
  - un seul détail ouvert à la fois (option recommandé)
- Les cartes peuvent s'empiler, le détail se déplie **sous** la carte (ou dedans, en accordéon).

### Accessibilité
- Le détail doit être accessible au clavier (focus).
- `aria-expanded`, `aria-controls`, `role="button"` si nécessaire.
- Support `prefers-reduced-motion`.

---

## 3) Contenu éditorial validé

### H1 (inchangé / validé)
**La preuve que vos factures sont conformes.**

### Sous-titre
Pour les entreprises qui veulent prouver leurs opérations financières.

### Description courte (1 seule phrase)
Dorevia‑Vault sécurise vos factures en temps réel depuis votre ERP et génère une preuve vérifiable.

### Ligne signature (nouvelle)
**Valider · Sceller · Prouver**

### Ligne event‑based (compact)
Événements : validation · paiement · réconciliation · écriture comptable

---

## 4) Spécification des 3 cartes (vue par défaut + détail)

> Principe : **Titre ultra court + sous‑titre** (default)  
> **Détail** = 2–3 lignes max, très concrètes.

### Carte 1 — VALIDER
**Default**
- Titre : **Valider**
- Sous‑titre : Événements financiers
- Micro‑ligne : Depuis votre ERP

**Détail (au survol/tap)**
- Facture validée
- Paiement reçu
- Écriture comptable postée

### Carte 2 — SCELLER
**Default**
- Titre : **Sceller**
- Sous‑titre : Dorevia‑Vault
- Micro‑ligne : Capture événementielle

**Détail**
- Empreinte (hash) calculée
- Horodatage enregistré
- Journal immuable mis à jour

### Carte 3 — PROUVER
**Default**
- Titre : **Prouver**
- Sous‑titre : Preuve exploitable
- Micro‑ligne : Vérifiable à tout moment

**Détail**
- Preuve vérifiable (hash + date)
- Statut : Vérifiable
- Utilisable en cas de contrôle

---

## 5) Implémentation

### Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `templates/home/index.html.twig` | Contenu éditorial + structure cartes v1.8 |
| `public/assets/css/hero.css` | Styles détails au survol/tap (lignes 430-500) |
| `public/assets/js/hero.js` | Toggle mobile + accessibilité (lignes 156-200) |
| `tests/e2e/hero.cy.js` | Tests v1.8 (lignes 147-220) |

### Références code

**Template** : `units/sylius/templates/home/index.html.twig`
- **Lignes 56-70** : Contenu éditorial v1.8 (sous-titre, description, signature VSP, event-based)
- **Lignes 96-150** : Structure des 3 cartes avec boutons et détails

**CSS** : `units/sylius/public/assets/css/hero.css`
- **Lignes 430-500** : Styles pour `.schema-card-summary`, `.schema-card-detail`, hover/focus, mobile toggle

**JavaScript** : `units/sylius/public/assets/js/hero.js`
- **Lignes 156-200** : Fonction `initSchemaCardToggle()` avec détection touch, toggle, accessibilité clavier

**Tests** : `units/sylius/tests/e2e/hero.cy.js`
- **Lignes 147-220** : Tests desktop hover, mobile tap, accessibilité, contenu v1.8

---

## 6) Definition of Done (DoD)

- [x] Signature « Valider · Sceller · Prouver » affichée dans le hero (texte)
- [x] Cartes VSP en version compacte
- [x] Détail au hover desktop / focus clavier
- [x] Détail au tap mobile (toggle)
- [x] `prefers-reduced-motion` OK
- [x] Tests E2E mis à jour

---

## 7) Notes produit

- Le **résumé** doit rester **non-tech**.
- Le **détail** peut contenir des termes (hash, horodatage) sans polluer la première lecture.
- Option phase suivante : remplacer les emojis par SVG (pack cohérent).

---

**Fin — SPEC v1.8**
