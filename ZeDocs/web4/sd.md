# 📄 SPEC FINALE — HERO Dorevia-Vault v1.7

**Version** : v1.7  
**Date** : 2026-01-18  
**Statut** : ✅ **Implémenté**  
**Fichier cible** : `units/sylius/templates/home/index.html.twig`  
**Fichiers associés** : `public/assets/css/hero.css`, `public/assets/js/hero.js`  
**Périmètre** : Header + HERO uniquement (au-dessus de la fold)  
**Page** : `/accueil`

---

## 🎯 Objectifs

### Objectifs UX
- Compréhension en **< 5 secondes**
- **Impact visuel** (SaaS premium / B2B confiance)
- CTA clair (démo) + parcours "comment ça marche"
- Mise en scène **plein écran** : **Header + Hero = 100vh**

### Objectifs produit (sans bullshit)
- Pas de "programme pilote / early adopter"
- Pas de "certifié / NF525 / opposable" dans le hero
- Positionnement : **preuve**, **event-based**, **instantanéité**

Le **menu + hero doivent occuper 100% de la hauteur du viewport**.

---

## 🧱 Structure générale

### HTML logique

```html
<body>
  <header id="main-header">
    Menu
  </header>
  <section id="hero">
    Hero
  </section>
</body>
```

### Règle principale

**Hauteur (header + hero) = 100vh**

`hero-height = 100vh - header-height`

---

## ✍️ Contenu éditorial (version validée)

### 1️⃣ Badge crédibilité

```
🇫🇷 Infrastructure souveraine
```

**Règles**
- Format pilule
- Discret
- Placé au-dessus du titre
- **Sans "Programme pilote"** (selon spec v1.6)

---

### 2️⃣ Nom produit

```
Dorevia-Vault
```

**Règles**
- Visible mais secondaire
- Ne doit pas voler la vedette au H1

---

### 3️⃣ Headline (H1)

```
La preuve que vos factures sont conformes.
```

**Règles**
- 1 à 2 lignes max desktop
- Mot-clé mis en valeur (accent couleur sur "conformes")
- H1 dominant visuellement

---

### 4️⃣ Sous-titre

```
Pour les entreprises qui veulent prouver leurs opérations financières, instantanément.
```

**Règles**
- Ton humain
- Pas marketing
- Pas jargon
- Focus sur **instantanéité** (différenciation)

---

### 5️⃣ Description

```
Dorevia-Vault sécurise vos factures en temps réel depuis votre ERP
et génère instantanément une preuve vérifiable.
```

**Règles**
- Max 3 lignes
- Orienté bénéfice
- Mots clés : **en temps réel**, **instantanément**
- Focus sur l'instantanéité

### 5bis. Phrase event-based (différenciation)

```
À chaque étape clé de votre cycle financier, une preuve est générée automatiquement :
validation · paiement · réconciliation · écriture comptable
```

**Règles**
- Max 2 lignes sur desktop
- Montre le caractère **event-based**
- Liste les étapes clés

---

### 6️⃣ CTA

**CTA principal**
```
👉 Demander une démo
```

**CTA secondaire**
```
Voir comment ça marche
```

**Micro-réassurance**
```
Démonstration personnalisée · Sans engagement
```

**Règles**
- **Sans "programme pilote"** (selon spec v1.6)
- **Sans "early adopter"** (selon spec v1.6)
- Focus sur la démonstration

**Règles**
- CTA principal en bouton plein
- CTA secondaire en outline
- Micro-réassurance discrète sous les CTA
- CTA visible sans scroll

---

## 🎨 Visuel — Schéma 3 cartes numérotées

**Objectif** : compréhension immédiate du fonctionnement.

### Principe

- Suppression totale des flèches
- Numérotation visible sur chaque carte : 1 · 2 · 3

### Carte 1 : ERP
- **Numéro** : 1 (badge haut-gauche)
- **Titre** : ERP (ex: Odoo)
- **Description** : Facture émise
- **Icône** : 📊

### Carte 2 : Dorevia-Vault
- **Numéro** : 2 (badge haut-gauche)
- **Titre** : Dorevia-Vault
- **Description** : Capture & scellement
- **Icône** : 🔒

### Carte 3 : Preuve
- **Numéro** : 3 (badge haut-gauche)
- **Titre** : Preuve générée
- **Description** : Hash + horodatage
- **Statut** : Vérifiable (vert)
- **Icône** : ✅

**Présentation** : 3 cartes alignées horizontalement avec numérotation (1 · 2 · 3) - **sans flèches**

**Style** :
- Fond blanc (rgba(255, 255, 255, 0.96))
- Border radius 18px
- Ombre douce premium (box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12))
- Padding : 26px 22px
- Largeur fixe : 220px (desktop)
- Icône : 2.2rem
- Numéro dans un cercle premium en haut-gauche (fond rgba(255,255,255,0.85), bordure rgba(15,23,42,0.12))

**Règles**
- Cards avec arrondis + ombres légères
- Badge numéro : cercle 28px, haut-gauche, style premium
- Accessibilité : `aria-label="Schéma ERP vers preuve fiscale"` + `sr-only` pour chaque étape

---

## 🎨 Règles UX & Design

### Header (menu)

**Objectif visuel** :
- Fond clair (#e9efff)
- Bordure basse subtile (1px solid rgba(15, 23, 42, 0.08))
- Texte sombre (#0f172a)
- Bouton CTA bleu (#2f57d7)
- Séparation nette avec le hero

**Contraintes** :
- Header **fixe** (position: fixed)
- Hauteur dynamique (mobile / desktop)
- Z-index élevé (999)

### Hero plein écran

**Fond** :
- Couleur principale : `#2f57d7` (bleu uniforme)
- Pas de dégradé
- Pas d'image de fond

**Alignement** :
- Contenu centré verticalement
- Texte aligné à gauche
- Cards à droite

### Hiérarchie visuelle

- H1 = élément le plus visible
- Un seul accent couleur sur mot-clé (jaune/orange)
- Sous-titre plus petit
- Paragraphe discret
- CTA bien contrastés

### Layout & Responsive

**Desktop** :
- Layout 2 colonnes (contenu gauche, visuel droite)
- Contenu aligné à gauche
- Visuel aligné à droite
- Cards alignées horizontalement
- CTA visibles sans scroll
- Largeur max adaptative
- Centrage vertical (flexbox)
- Espace respirant

**Mobile** :
- Disposition verticale
- Texte centré
- CTA full width
- Lignes courtes
- Cards empilées verticalement
- Section = 100vh (centrage vertical)

### Plein écran (100vh)

**Règles** :
- Header hauteur fixe (calculée dynamiquement)
- Hero = `calc(100vh - header-height)`
- Aucun scroll visible à l'arrivée
- `height`, `min-height` et `max-height` utilisés pour forcer exactement 100vh
- `overflow: hidden` sur le hero

**Comportement** :
- Desktop : hero centré verticalement, tout visible sans scroll
- Mobile : hero occupe tout l'écran, scroll après hero

### Ton éditorial

✔️ Positif  
✔️ Sérieux  
✔️ Métier  
✔️ Pas alarmiste  
✔️ Pas bullshit  
✔️ Pas techno  
✔️ Assumer statut : sortie de lab / pilote

---

## 🚫 Contraintes

- ❌ Pas de logos clients
- ❌ Pas de chiffres marketing
- ❌ Pas de claim "certifié / NF525 / opposable"
- ✅ Assumer statut : sortie de lab / pilote
- ✅ Ton sobre, premium, sérieux
- ✅ Mobile-first

---

## 🚫 Interdits

- blockchain
- hash (dans le texte, OK dans le visuel)
- crypto
- norme ISO
- jargon fiscal
- peur / menace
- chiffres anxiogènes

---

## 🧪 Critères de validation

Le Hero est validé si :

☑ Menu + hero = 100vh  
☑ Aucun scroll visible au chargement  
☑ CTA visibles  
☑ Cards lisibles mobile  
☑ Aucun claim faux  
☑ Message compris en < 5s  
☑ On comprend en 5 secondes  
☑ On sait à quoi ça sert  
☑ On sait pour qui  
☑ On sait où cliquer  
☑ Un commerçant comprend  
☑ Aucun terme technique (sauf dans visuel)  

---

## 🎯 Règle d'or

> **Le hero ne vend pas.  
> Il éclaire.**

---

## ✅ Implémentation

**Date d'implémentation** : 18 janvier 2026  
**Fichiers** : 
- `units/sylius/templates/home/index.html.twig` (template nettoyé)
- `units/sylius/public/assets/css/hero.css` (styles externalisés)
- `units/sylius/public/assets/js/hero.js` (JavaScript propre)

### Modifications réalisées

✅ Layout 2 colonnes desktop (contenu gauche, visuel droite)  
✅ Contenu éditorial mis à jour selon spec v1.3  
✅ Badge avec "Programme pilote"  
✅ H1 : "La preuve que vos factures sont conformes."  
✅ Sous-titre : "Pour les dirigeants de TPE/PME qui veulent être en règle sans stress."  
✅ Description : "génère une preuve vérifiable"  
✅ CTA : "🚀 Rejoindre le programme pilote" (principal)  
✅ Micro-réassurance ajoutée  
✅ **Refactoring v1.7** : Styles externalisés dans `hero.css`  
✅ **Refactoring v1.7** : JavaScript externalisé dans `hero.js`  
✅ **Refactoring v1.7** : Suppression de tous les styles inline  
✅ **Refactoring v1.7** : Suppression de tous les `onclick` inline  
✅ **Refactoring v1.7** : Debounce sur resize (150ms)  
✅ **Refactoring v1.7** : Focus visible amélioré (outline jaune)  
✅ **Refactoring v1.7** : Respect de `prefers-reduced-motion`  
✅ **Refactoring v1.7** : ARIA labels ajoutés sur les CTA  
✅ **Refactoring v1.7** : Hover effects sur les cards  
✅ **Refactoring v1.7** : Loading state sur les CTA  
✅ Header clair (#e9efff) avec bordure basse et texte sombre  
✅ Header fixe (position: fixed)  
✅ Hero bleu uniforme (#2f57d7) - pas de dégradé  
✅ Badge : "🇫🇷 Infrastructure souveraine" (sans "Programme pilote")  
✅ Sous-titre : "Pour les entreprises qui veulent prouver leurs opérations financières, instantanément."  
✅ Description avec "en temps réel" et "instantanément"  
✅ Phrase event-based ajoutée (validation · paiement · réconciliation · écriture comptable)  
✅ CTA : "👉 Demander une démo" (sans "programme pilote")  
✅ Micro-réassurance : "Démonstration personnalisée · Sans engagement"  
✅ Schéma visuel 3 cartes avec numérotation (1 · 2 · 3) - sans flèches  
✅ Badge numéroté sur chaque carte (haut-gauche, style premium)  
✅ Cards avec border-radius 18px et ombre douce premium  
✅ Titre carte 3 : "Preuve générée"  
✅ Accessibilité : sr-only pour chaque étape  
✅ Menu + Hero = 100vh exactement (variable CSS --header-h)  
✅ Calcul dynamique de la hauteur du header via JavaScript  
✅ Hero ajusté automatiquement : `calc(100vh - var(--header-h))`  
✅ Centrage vertical et horizontal avec flexbox  
✅ Responsive mobile : CTA full width, texte centré, schéma vertical  
✅ Styles CSS ajoutés pour le responsive  
✅ Overflow visible (pas de coupure de contenu)  
✅ Safety pour petits écrans en hauteur  
✅ Aucun scroll visible au chargement

### Déploiement

**Dernière mise à jour** : 18 janvier 2026, 11:40  
**Cache vidé** : ✅ Oui  
**Services redémarrés** : ✅ php-fpm, nginx

**Commandes exécutées** :
```bash
cd /opt/dorevia-plateform/units/sylius
docker compose exec php-fpm php bin/console cache:clear --env=prod --no-debug
docker compose restart php-fpm nginx
```

---

## 📦 Bundle final intégré

**Badge** :  
🇫🇷 Infrastructure souveraine française · Programme pilote

**Produit** :  
Dorevia-Vault

**H1** :  
La preuve que vos factures sont conformes.

**Sous-titre** :  
Pour les dirigeants de TPE/PME qui veulent être en règle sans stress.

**Description** :  
Dorevia-Vault sécurise vos factures depuis votre ERP et génère une preuve vérifiable en cas de contrôle.

**CTA primaire** :  
🚀 Rejoindre le programme pilote

**CTA secondaire** :  
Voir comment ça marche

**Micro-réassurance** :  
Accès early · Démo + onboarding · Sans engagement

**Schéma** :  
1 · ERP (ex: Odoo) - Facture émise  
2 · Dorevia-Vault - Capture & scellement  
3 · Preuve générée - Hash + horodatage (Statut : Vérifiable)

---

## 📝 Changelog

### v1.7 (2026-01-18) - Refactoring technique
- ✅ **Styles externalisés** : Création de `hero.css` avec tous les styles
- ✅ **JavaScript externalisé** : Création de `hero.js` avec debounce et listeners propres
- ✅ **Template nettoyé** : Suppression de tous les styles inline
- ✅ **Sécurité** : Suppression de tous les `onclick` inline (protection XSS)
- ✅ **Performance** : Debounce sur resize (150ms)
- ✅ **Accessibilité** : Focus visible amélioré (outline jaune)
- ✅ **Accessibilité** : Respect de `prefers-reduced-motion`
- ✅ **Accessibilité** : ARIA labels descriptifs sur les CTA
- ✅ **UX** : Hover effects sur les cards (transform + shadow)
- ✅ **UX** : Loading state sur les CTA
- ✅ **Maintenabilité** : Code organisé et réutilisable

### v1.6 (2026-01-18) - SPEC FINALE
- ✅ Badge : "🇫🇷 Infrastructure souveraine" (sans "Programme pilote")
- ✅ Sous-titre : "Pour les entreprises qui veulent prouver leurs opérations financières, instantanément."
- ✅ Description avec "en temps réel" et "instantanément"
- ✅ Phrase event-based ajoutée (validation · paiement · réconciliation · écriture comptable)
- ✅ CTA : "👉 Demander une démo" (sans "programme pilote")
- ✅ Micro-réassurance : "Démonstration personnalisée · Sans engagement"
- ✅ Header fixe (position: fixed) avec bordure basse
- ✅ Cards premium avec ombre douce améliorée (0 10px 30px)
- ✅ Badges step avec style premium (fond rgba(255,255,255,0.85), bordure subtile)
- ✅ Variable CSS --header-h pour source unique de vérité
- ✅ Overflow visible (pas de coupure de contenu)
- ✅ Safety pour petits écrans en hauteur

### v1.4 (2026-01-18)
- ✅ Header clair (#e9efff) avec texte sombre
- ✅ Hero bleu uniforme (#2f57d7) - pas de dégradé
- ✅ Cards avec border-radius 18px et ombre douce améliorée
- ✅ Badges step avec style premium (fond #eef2ff, bordure #c7d2fe)

### v1.3 (2026-01-18)
- ✅ Sous-titre mis à jour : "Pour les dirigeants de TPE/PME..."
- ✅ Description mise à jour : "génère une preuve" (au lieu de "prépare")
- ✅ Menu + Hero = 100vh exactement (variable CSS)
- ✅ Aucun scroll visible au chargement

### v1.2 (2026-01-18)
- ✅ Remplacement des flèches par numérotation (1 · 2 · 3)
- ✅ Badge numéroté sur chaque carte (haut-gauche)
- ✅ Titre carte 3 : "Preuve générée" (au lieu de "Preuve vérifiable")
- ✅ Accessibilité : sr-only pour chaque étape
- ✅ CSS responsive adapté (suppression références flèches)

### v1.1 (2026-01-18)
- ✅ Layout 2 colonnes desktop
- ✅ Contenu éditorial mis à jour
- ✅ Schéma visuel 3 cartes
- ✅ Micro-réassurance

---

**Version** : 1.7  
**Statut** : ✅ **Implémenté et déployé**
