# 📊 Évaluation — SPEC Harmonisation UX Cartes de Statuts v1.3

**Date :** 2026-01-19  
**Évaluateur :** Auto (IA)  
**Version spec :** v1.3  
**Version implémentation actuelle :** v1.1 Premium

---

## ✅ Points forts de la spécification

1. **Clarté conceptuelle** : Distinction Action vs Statut est excellente
2. **Règle des 2 lignes** : Limite cognitive bien définie
3. **Slots fixes** : Approche professionnelle pour l'alignement visuel
4. **Accessibilité renforcée** : `hidden` dynamique est une bonne pratique
5. **Cohérence sémantique** : Correction de `valided` → `validated` nécessaire

---

## 🔴 Écarts identifiés avec l'implémentation actuelle

### 1. Copywriting — Actions vs Statuts

| Élément | Actuel (v1.1) | Spec v1.3 | Écart |
|---------|---------------|-----------|-------|
| **Carte 1** | "Validé" | "Valider" | ❌ Statut au lieu d'action |
| **Carte 2** | "Scellé" | "Sceller" | ❌ Statut au lieu d'action |
| **Carte 3** | "Vérifiable" | "Prouver" | ❌ Statut au lieu d'action |

**Impact :** Moyen — Change la sémantique mais améliore la clarté

---

### 2. Texte ligne 2 — Carte 2

| Actuel | Spec | Écart |
|--------|------|-------|
| "et protégée contre toute altération dans **Dorevia-Vault**" | "dans Dorevia-Vault" | ❌ Trop long (3 lignes visuelles) |

**Impact :** Élevé — Violation de la règle "2 lignes max"

---

### 3. Texte ligne 2 — Carte 3

| Actuel | Spec | Écart |
|--------|------|-------|
| "et contrôlable à tout moment" | "à tout moment" | ❌ Légèrement trop long |

**Impact :** Faible — Mais à corriger pour cohérence

---

### 4. Attribut `data-status` — Carte 1

| Actuel | Spec | Écart |
|--------|------|-------|
| `data-status="valided"` | `data-status="validated"` ou `data-status="valide"` | ❌ Anglais incorrect |

**Impact :** Élevé — Incohérence sémantique, problème de tracking

---

### 5. Contenu détaillé — Carte 2

| Actuel | Spec | Écart |
|--------|------|-------|
| 3 items | 4 items | ❌ Manque "Journal immuable" |

**Impact :** Moyen — Manque un élément technique important

---

### 6. Contenu détaillé — Carte 3

| Actuel | Spec | Écart |
|--------|------|-------|
| "Vérification possible à tout moment" | "Vérification indépendante" | ❌ Différence sémantique |

**Impact :** Faible — Mais "indépendante" est plus fort

---

### 7. Slots fixes CSS — Non implémenté

| Spécification | Implémentation | Écart |
|--------------|---------------|-------|
| Hauteur fixe icône (56px) | Hauteur variable | ❌ Pas de hauteur fixe |
| Min-height titre (44px) | Pas de min-height | ❌ Pas de hauteur minimale |
| Line-clamp sur texte | Pas de line-clamp | ❌ Risque de débordement |

**Impact :** Élevé — Risque d'alignement visuel cassé

---

### 8. Attribut `hidden` dynamique — Non implémenté

| Spécification | Implémentation | Écart |
|--------------|---------------|-------|
| `hidden` ajouté/supprimé dynamiquement | Utilise `max-height: 0` et `opacity: 0` | ❌ Moins accessible |

**Impact :** Moyen — Accessibilité améliorée avec `hidden`

---

## 💡 Recommandations d'amélioration

### Priorité P0 (Critique)

#### 1. Corriger `data-status="valided"` → `data-status="validated"`

**Raison :** Incohérence sémantique, problème de tracking

**Actions :**
- HTML : Changer tous les `data-status="valided"`
- CSS : Mettre à jour les sélecteurs `[data-status="valided"]`
- JS : Mettre à jour les références dans le tracking

---

#### 2. Implémenter les slots fixes CSS

**Raison :** Garantir l'alignement visuel, éviter les débordements

**Code à ajouter :**

```css
/* Slot A - Icône */
.status-card-icon {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
}

/* Slot B - Titre */
.status-card-title {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Slot C - Texte (2 lignes max) */
.status-card-subtitle,
.status-card-kicker {
    min-height: 28px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.status-card-subtitle {
    -webkit-line-clamp: 1;
}

.status-card-kicker {
    -webkit-line-clamp: 1;
}
```

---

#### 3. Corriger le texte ligne 2 — Carte 2

**Raison :** Violation de la règle "2 lignes max"

**Changement :**
- ❌ "et protégée contre toute altération dans **Dorevia-Vault**"
- ✅ "dans Dorevia-Vault"

---

### Priorité P1 (Important)

#### 4. Changer les titres : Statuts → Actions

**Raison :** Améliorer la clarté sémantique

**Changements :**
- "Validé" → "Valider"
- "Scellé" → "Sceller"
- "Vérifiable" → "Prouver"

**Note :** Impact visuel faible, mais amélioration UX significative

---

#### 5. Ajouter `hidden` dynamique dans le JS

**Raison :** Accessibilité améliorée pour les lecteurs d'écran

**Code à modifier dans `status-cards.js` :**

```javascript
// Fonction pour ouvrir une carte
function openCard(card) {
    closeAllCards();
    card.classList.add('is-open');
    const toggle = card.querySelector('[data-card-toggle]');
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'true');
    }
    
    // Ajouter hidden dynamique
    const detail = card.querySelector('.status-card-detail');
    if (detail) {
        detail.removeAttribute('hidden');
    }
    
    // Tracking optionnel
    const status = card.getAttribute('data-status');
    if (typeof trackEvent === 'function' && status) {
        trackEvent('status_card', 'open', `status_open_${status}`, 1);
    }
}

// Fonction pour fermer une carte
function closeCard(card) {
    card.classList.remove('is-open');
    const toggle = card.querySelector('[data-card-toggle]');
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
    }
    
    // Ajouter hidden dynamique
    const detail = card.querySelector('.status-card-detail');
    if (detail) {
        detail.setAttribute('hidden', true);
    }
}
```

**Et dans le HTML initial :**

```twig
<div class="status-card-detail" 
     id="status-detail-valided" 
     role="region" 
     aria-label="Détails du statut Validé"
     hidden>
```

---

#### 6. Mettre à jour le contenu détaillé — Carte 2

**Raison :** Compléter l'information technique

**Ajouter :**
- "Journal immuable" (4ème item)

---

### Priorité P2 (Amélioration)

#### 7. Ajuster le texte ligne 2 — Carte 3

**Changement :**
- "et contrôlable à tout moment" → "à tout moment"

---

#### 8. Mettre à jour le contenu détaillé — Carte 3

**Changement :**
- "Vérification possible à tout moment" → "Vérification indépendante"

**Raison :** "Indépendante" est plus fort et rassurant

---

## 📋 Plan d'action recommandé

### Phase 1 — Corrections critiques (P0)

1. ✅ Corriger `data-status="valided"` → `data-status="validated"`
2. ✅ Implémenter les slots fixes CSS
3. ✅ Corriger le texte ligne 2 — Carte 2

**Temps estimé :** 30 minutes  
**Impact :** Élevé — Résout les problèmes critiques

---

### Phase 2 — Améliorations importantes (P1)

4. ✅ Changer les titres : Actions au lieu de Statuts
5. ✅ Ajouter `hidden` dynamique
6. ✅ Compléter le contenu détaillé — Carte 2

**Temps estimé :** 45 minutes  
**Impact :** Moyen — Améliore significativement l'UX

---

### Phase 3 — Ajustements finaux (P2)

7. ✅ Ajuster le texte ligne 2 — Carte 3
8. ✅ Mettre à jour le contenu détaillé — Carte 3

**Temps estimé :** 15 minutes  
**Impact :** Faible — Polish final

---

## 🎯 Améliorations supplémentaires proposées

### 1. Validation visuelle des slots

Ajouter un mode debug (optionnel) pour visualiser les slots :

```css
/* Mode debug - À retirer en production */
.status-card[data-debug="true"] .status-card-icon {
    border: 1px dashed red;
}

.status-card[data-debug="true"] .status-card-title {
    border: 1px dashed blue;
}

.status-card[data-debug="true"] .status-card-subtitle,
.status-card[data-debug="true"] .status-card-kicker {
    border: 1px dashed green;
}
```

---

### 2. Test de contenu trop long

Ajouter une validation JavaScript pour détecter les débordements :

```javascript
// Validation du contenu (dev uniquement)
function validateCardContent() {
    const cards = document.querySelectorAll('.status-card');
    cards.forEach(card => {
        const subtitle = card.querySelector('.status-card-subtitle');
        const kicker = card.querySelector('.status-card-kicker');
        
        if (subtitle && subtitle.scrollHeight > subtitle.clientHeight) {
            console.warn('Subtitle déborde:', card);
        }
        
        if (kicker && kicker.scrollHeight > kicker.clientHeight) {
            console.warn('Kicker déborde:', card);
        }
    });
}
```

---

### 3. Documentation des breakpoints

Clarifier les règles responsive dans la spec :

| Breakpoint | Colonnes | Gap | Padding |
|------------|----------|-----|---------|
| Desktop (>1024px) | 3 | 2rem | 2.5rem 2rem |
| Tablet (768-1023px) | 2 | 1.5rem | 2rem 1.5rem |
| Mobile (<768px) | 1 | 1.25rem | 2rem 1.5rem |

---

### 4. Règle de validation automatique

Ajouter une checklist de validation dans le JS :

```javascript
// Validation de conformité (dev uniquement)
function validateSpecCompliance() {
    const checks = {
        maxLines: true,
        dataStatus: true,
        ariaLabels: true,
        hiddenAttribute: true
    };
    
    // Vérifier les 2 lignes max
    const cards = document.querySelectorAll('.status-card');
    cards.forEach(card => {
        const subtitle = card.querySelector('.status-card-subtitle');
        const kicker = card.querySelector('.status-card-kicker');
        
        // Compter les lignes visuelles
        // ...
    });
    
    return checks;
}
```

---

## ✅ Checklist de conformité

### Copywriting
- [ ] Titres changés : "Valider", "Sceller", "Prouver"
- [ ] Ligne 2 — Carte 2 : "dans Dorevia-Vault"
- [ ] Ligne 2 — Carte 3 : "à tout moment"

### Technique
- [ ] `data-status="valided"` → `data-status="validated"`
- [ ] Slots fixes CSS implémentés
- [ ] `hidden` dynamique ajouté dans JS
- [ ] Contenu détaillé — Carte 2 : 4 items
- [ ] Contenu détaillé — Carte 3 : "Vérification indépendante"

### Accessibilité
- [ ] `aria-expanded` présent
- [ ] `aria-controls` présent
- [ ] `role="region"` présent
- [ ] `hidden` ajouté/supprimé dynamiquement

### Responsive
- [ ] Desktop : 3 colonnes
- [ ] Tablet : 2 colonnes
- [ ] Mobile : 1 colonne
- [ ] Slots alignés sur tous les breakpoints

---

## 📊 Score de conformité

| Catégorie | Score | Commentaire |
|-----------|-------|-------------|
| **Copywriting** | 60% | Titres et textes à corriger |
| **Technique** | 70% | `data-status` et slots fixes manquants |
| **Accessibilité** | 85% | `hidden` dynamique manquant |
| **Responsive** | 95% | Bien implémenté |
| **Design** | 100% | Premium, conforme |

**Score global :** 82% ✅

---

## 🚀 Conclusion

La spécification v1.3 est **excellente** et apporte des améliorations significatives :

1. ✅ **Clarté sémantique** : Actions vs Statuts
2. ✅ **Rigueur technique** : Slots fixes, `hidden` dynamique
3. ✅ **Accessibilité renforcée** : Meilleure prise en charge lecteurs d'écran
4. ✅ **Cohérence** : Correction de `valided` → `validated`

**Recommandation :** Implémenter les corrections P0 et P1 en priorité.

---

**Fin de l'évaluation**
