# 📱 Comparaison Mobile — Stripe vs Dorevia-Vault (iPhone 12)

**Date :** 25 janvier 2026  
**Objectif :** Analyser les différences d'approche mobile et identifier les optimisations

---

## 🎯 Analyse comparative

### **Stripe (Référence)**

**Structure visible sur iPhone 12 :**
1. Header minimal : Logo + hamburger menu
2. Badge/Tagline : Absent (ou très discret)
3. Headline : 1 ligne principale
4. Description : 1 paragraphe concis
5. CTAs : 2 boutons côte à côte
6. Logos partenaires : 2 logos horizontaux

**Caractéristiques :**
- ✅ **Scroll minimal** : Tout l'essentiel visible sans scroll
- ✅ **Hiérarchie claire** : Headline → Description → Action
- ✅ **Espacement optimisé** : Pas de surcharge visuelle
- ✅ **CTAs accessibles** : Visibles immédiatement

---

### **Dorevia-Vault (Actuel)**

**Structure visible sur iPhone 12 :**
1. Header : Logo + hamburger menu ✅
2. Badge : "🇬🇵 🇫🇷 Infrastructure de vérité financière"
3. Headline : "Piloter votre trésorerie avec des chiffres incontestables."
4. Description : **3 paragraphes** (subtitle + description + quote)
5. Features : Liste de 6 items (avec toggle "Voir plus")
6. CTAs : 2 boutons (probablement empilés)

**Caractéristiques :**
- ⚠️ **Scroll nécessaire** : Plus de contenu que Stripe
- ⚠️ **3 paragraphes** : Plus dense que Stripe (1 paragraphe)
- ✅ **Badge informatif** : Ajoute du contexte
- ✅ **Quote** : Renforce le message

---

## 📊 Différences clés

| Élément | Stripe | Dorevia-Vault | Impact |
|---------|--------|---------------|--------|
| **Paragraphes** | 1 | 3 | ⚠️ Plus de scroll |
| **Badge** | Absent | Présent | ✅ Contexte ajouté |
| **Quote** | Absent | Présent | ✅ Renforce le message |
| **Features** | Absent | 6 items (toggle) | ✅ Détails disponibles |
| **CTAs** | Côte à côte | Probablement empilés | ⚠️ À vérifier |

---

## 💡 Recommandations d'optimisation

### **Option 1 : Réduire la densité textuelle (Approche Stripe)**

**Modifications :**
- Fusionner les 3 paragraphes en 1-2 paragraphes plus concis
- Réduire ou masquer la quote sur mobile (repliable)
- Garder le badge (contexte important)

**Avantages :**
- ✅ Scroll réduit
- ✅ Hiérarchie plus claire
- ✅ Aligné avec l'approche Stripe

**Inconvénients :**
- ⚠️ Perte potentielle d'information
- ⚠️ Quote moins visible

---

### **Option 2 : Replier la quote (Approche hybride)**

**Modifications :**
- Garder les 2 premiers paragraphes visibles
- Replier la quote sous "En savoir plus" ou similaire
- Garder le badge et les features

**Avantages :**
- ✅ Équilibre entre information et scroll
- ✅ Quote accessible mais non intrusive
- ✅ Moins de changement structurel

**Inconvénients :**
- ⚠️ Quote moins visible par défaut

---

### **Option 3 : Optimiser l'espacement (Approche conservative)**

**Modifications :**
- Réduire les marges/padding sur mobile
- Réduire la taille de police légèrement
- Garder tout le contenu mais plus compact

**Avantages :**
- ✅ Aucune perte d'information
- ✅ Changements mineurs

**Inconvénients :**
- ⚠️ Peut sembler dense
- ⚠️ Lisibilité potentiellement réduite

---

## 🎯 Recommandation : Option 2 (Hybride)

**Stratégie :**
1. **Garder** : Badge + Headline + 2 premiers paragraphes
2. **Replier** : Quote sous un bouton "En savoir plus" ou similaire
3. **Optimiser** : Espacement réduit sur mobile

**Implémentation :**
```html
<!-- Quote repliable sur mobile -->
<div class="hero-quote-mobile">
  <button class="hero-quote-toggle" aria-expanded="false">
    <span>En savoir plus</span>
    <span>▼</span>
  </button>
  <blockquote class="hero-quote-collapsed">
    Enfin une infrastructure de preuve qui rend vos chiffres incontestables.
  </blockquote>
</div>
```

**CSS :**
- Sur desktop : Quote toujours visible
- Sur mobile : Quote repliée par défaut, s'ouvre au clic

---

## 📐 Comparaison des hauteurs (estimées)

### Stripe
- Header : ~60px
- Headline : ~80px
- Description : ~60px
- CTAs : ~50px
- Logos : ~40px
- **Total : ~290px** (visible sans scroll)

### Dorevia-Vault (actuel)
- Header : ~60px
- Badge : ~40px
- Headline : ~100px
- 3 paragraphes : ~180px
- Quote : ~60px
- Features (3 visibles) : ~120px
- Toggle : ~40px
- CTAs : ~100px (empilés)
- **Total : ~700px** (scroll nécessaire)

### Dorevia-Vault (optimisé - Option 2)
- Header : ~60px
- Badge : ~40px
- Headline : ~100px
- 2 paragraphes : ~120px
- Quote repliée : ~40px
- Features (3 visibles) : ~120px
- Toggle : ~40px
- CTAs : ~100px
- **Total : ~620px** (réduction de ~80px)

---

## ✅ Actions recommandées

### Priorité 1 : Replier la quote sur mobile
- **Impact :** Réduction de ~60px de scroll
- **Complexité :** Faible (similaire au toggle features)
- **Bénéfice :** Hiérarchie plus claire

### Priorité 2 : Optimiser l'espacement
- **Impact :** Réduction de ~20-30px
- **Complexité :** Faible (CSS uniquement)
- **Bénéfice :** Contenu plus compact

### Priorité 3 : Vérifier les CTAs
- **Impact :** Accessibilité
- **Complexité :** Faible
- **Bénéfice :** CTAs plus visibles

---

## 🎨 Design patterns à adopter de Stripe

1. **CTAs côte à côte** : Si l'espace le permet (≥ 320px de largeur)
2. **Espacement généreux** : Mais optimisé pour mobile
3. **Hiérarchie claire** : Headline → Description → Action
4. **Contenu essentiel visible** : Sans scroll obligatoire

---

**Document créé le :** 25 janvier 2026
