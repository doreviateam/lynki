# 📱 Analyse — Contenus repliables sur mobile

**Date :** 25 janvier 2026  
**Objectif :** Identifier les contenus qui pourraient être repliés (accordéon) sur mobile pour améliorer l'expérience utilisateur

---

## 🎯 Sections analysées

### 1. **HERO SECTION** (Lignes 24-73)

#### 1.1 Description complète (`hero-description`)
**Contenu actuel :**
- Paragraphe de description (2 phrases)
- Quote (`hero-quote`)

**Recommandation :** ⚠️ **Ne pas replier**
- **Raison :** Contenu essentiel pour la compréhension immédiate
- **Alternative :** Réduire légèrement la taille de police sur mobile

#### 1.2 Liste des features (`hero-features`)
**Contenu actuel :**
- 6 items de features (liste verticale)

**Recommandation :** ✅ **Replier partiellement**
- **Afficher :** 3 premiers items par défaut
- **Replier :** 3 derniers items sous "Voir plus de features"
- **Bénéfice :** Réduit la hauteur du hero, garde l'essentiel visible

---

### 2. **SECTION FONCTIONNEMENT** (Lignes 75-107)

#### 2.1 Grille 2 colonnes (desktop) → Accordéon (mobile)
**Contenu actuel :**
- 3 cartes à gauche : "Capture à la source", "Scellage probant", Illustration
- 1 grande carte à droite : "Interface de consultation"

**Recommandation :** ✅ **Replier en accordéon**
- **Structure :**
  ```
  [▶] Capture à la source
  [▶] Scellage probant
  [▶] Interface de consultation
  ```
- **Bénéfice :** Évite le scroll vertical excessif, permet de se concentrer sur un élément à la fois
- **UX :** Chaque carte s'ouvre au clic, les autres se ferment automatiquement

#### 2.2 Illustration process (carte 3)
**Recommandation :** ⚠️ **Optionnel**
- Peut être masquée sur mobile si elle n'apporte pas de valeur immédiate
- Ou affichée en plus petit format

---

### 3. **SECTION CONFORMITÉ** (Lignes 109-133)

#### 3.1 Grille 3 colonnes (desktop) → Accordéon (mobile)
**Contenu actuel :**
- 3 cartes : "Souveraineté", "Conformité", "Badge LNE"

**Recommandation :** ✅ **Replier en accordéon**
- **Structure :**
  ```
  [▶] 🇫🇷 Souveraineté
  [▶] 🛡️ Conformité
  [▶] Badge LNE 2026
  ```
- **Bénéfice :** Meilleure lisibilité, focus sur un point à la fois
- **UX :** Accordéon simple (un seul élément ouvert à la fois)

---

### 4. **SECTION CONTACT** (Lignes 135-171)

#### 4.1 Points de garantie (lignes 143-150)
**Contenu actuel :**
- 2 points : "Réponse garantie sous 24h", "Diagnostic sans engagement"

**Recommandation :** ⚠️ **Ne pas replier**
- **Raison :** Contenu court et rassurant, doit rester visible
- **Alternative :** Réduire l'espacement entre les points

#### 4.2 Formulaire de contact
**Recommandation :** ⚠️ **Ne pas replier**
- **Raison :** CTA principal, doit rester accessible immédiatement

---

## 📊 Recommandations prioritaires

### ✅ **Priorité 1 : Liste des features du hero**
**Impact :** ⭐⭐⭐ (Élevé)  
**Complexité :** ⭐ (Faible)  
**Bénéfice :** Réduit la hauteur du hero, améliore le premier scroll

**Implémentation :**
- Afficher 3 premiers items
- Bouton "Voir plus" / "Voir moins"
- Animation douce d'expansion

---

### ✅ **Priorité 2 : Section Fonctionnement (accordéon)**
**Impact :** ⭐⭐⭐ (Élevé)  
**Complexité :** ⭐⭐ (Moyenne)  
**Bénéfice :** Améliore la navigation, réduit le scroll

**Implémentation :**
- Transformer la grille 2 colonnes en accordéon vertical
- Chaque carte devient un item d'accordéon
- Animation d'ouverture/fermeture

---

### ✅ **Priorité 3 : Section Conformité (accordéon)**
**Impact :** ⭐⭐ (Moyen)  
**Complexité :** ⭐⭐ (Moyenne)  
**Bénéfice :** Meilleure lisibilité des 3 points

**Implémentation :**
- Transformer la grille 3 colonnes en accordéon vertical
- Accordéon simple (un seul ouvert)

---

## 🎨 Design des accordéons

### Style proposé
```css
.v2-accordion-item {
  border-bottom: 1px solid var(--line);
  padding: 20px 0;
}

.v2-accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
}

.v2-accordion-icon {
  transition: transform 0.3s ease;
}

.v2-accordion-item.active .v2-accordion-icon {
  transform: rotate(180deg);
}

.v2-accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.v2-accordion-item.active .v2-accordion-content {
  max-height: 1000px;
  padding-top: 16px;
}
```

---

## 📱 Breakpoints

**Mobile :** `< 768px`  
**Desktop :** `≥ 768px`

**Règle :** Les accordéons sont actifs uniquement sur mobile. Sur desktop, affichage normal (grille).

---

## ✅ Checklist d'implémentation

- [ ] **Hero features** : Système "Voir plus / Voir moins"
- [ ] **Section Fonctionnement** : Accordéon pour les 3-4 cartes
- [ ] **Section Conformité** : Accordéon pour les 3 cartes
- [ ] **CSS responsive** : Accordéons uniquement sur mobile
- [ ] **JavaScript** : Gestion ouverture/fermeture
- [ ] **Animations** : Transitions douces
- [ ] **Accessibilité** : ARIA attributes (aria-expanded, aria-controls)

---

## 🚫 Contenus à NE PAS replier

1. **Titre principal (H1)** : Doit rester visible
2. **Sous-titre hero** : Essentiel pour la compréhension
3. **Boutons CTA** : Doivent rester accessibles
4. **Formulaire de contact** : CTA principal
5. **Points de garantie** : Rassurants, doivent rester visibles

---

**Document créé le :** 25 janvier 2026
