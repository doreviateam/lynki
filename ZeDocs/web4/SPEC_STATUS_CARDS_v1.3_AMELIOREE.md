# 📘 SPEC — Harmonisation UX Cartes de Statuts Dorevia-Vault v1.3 (Améliorée)

**Version :** v1.3 Améliorée  
**Date :** 2026-01-19  
**Auteur :** David Baron + IA  
**Projet :** Landing Page Dorevia-Vault  
**Statut :** ✅ Prête pour implémentation

---

## 🎯 Objectif

Harmoniser l'expérience utilisateur des cartes de statuts afin de :

- Clarifier la différence **Action vs Statut**
- Réduire la charge cognitive
- Garantir une **lecture rapide** en état fermé
- Réserver le détail **uniquement au clic**
- Uniformiser la mise en page
- Conserver un rendu premium

---

## 1. Principe Produit

### Règle fondatrice

- **Titre = Action**
- **Texte = Promesse**
- **Détails = Technique** (au clic uniquement)

| Action (Titre) | Statut (Promesse) |
|---------------|-------------------|
| Valider | Votre facture est confirmée |
| Sceller | Votre facture est figée |
| Prouver | Une preuve est disponible |

---

## 2. Copywriting verrouillé

### État fermé (visible par défaut)

**Carte 1**
- Titre : **Valider**
- Ligne 1 : Votre facture est confirmée
- Ligne 2 : depuis votre ERP

**Carte 2**
- Titre : **Sceller**
- Ligne 1 : Votre facture est figée
- Ligne 2 : dans Dorevia-Vault

**Carte 3**
- Titre : **Prouver**
- Ligne 1 : Une preuve est disponible
- Ligne 2 : à tout moment

👉 **Règle stricte :** Maximum **2 lignes visibles** (subtitle + kicker combinés)  
👉 **Chaque ligne** ne doit pas dépasser **1 ligne de texte** (utilisation de `-webkit-line-clamp: 1`)  
👉 Aucun terme technique ici

---

## 3. Contenu détaillé (au clic)

### Carte 1 — Valider
- Facture validée dans l'ERP
- Paiement reçu
- Écriture comptable postée

### Carte 2 — Sceller
- Capture événementielle
- Empreinte cryptographique (hash)
- Horodatage certifié
- Journal immuable

### Carte 3 — Prouver
- Preuve exploitable
- Vérification indépendante
- Utilisable en cas de contrôle

---

## 4. Cohérence sémantique

### Correction obligatoire

❌ `data-status="valided"`  
✅ `data-status="validated"` (recommandé pour cohérence code & tracking)  
ou  
✅ `data-status="valide"` (si francisation requise)

**Recommandation :** Utiliser `data-status="validated"` pour cohérence avec le reste du codebase et le tracking analytics.

Même convention partout :
- HTML
- CSS
- JS
- Tracking

---

## 5. Règles UI — Slots fixes

### Structure visuelle

```
┌─────────────────────────┐
│  [Badge]        [Close] │  ← Z-index 2-3 (position absolue)
│                         │
│      [Icône]            │  ← Slot A (56px fixe)
│                         │
│      [Titre]            │  ← Slot B (min 44px)
│                         │
│   [Subtitle ligne 1]    │  ← Slot C.1 (min 28px, line-clamp: 1)
│   [Kicker ligne 2]      │  ← Slot C.2 (min 28px, line-clamp: 1)
│                         │
│  ─────────────────────  │  ← Séparateur (visible si ouvert)
│                         │
│  [Détails techniques]   │  ← Slot D (hidden si fermé)
└─────────────────────────┘
```

### CSS recommandé

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

### Règles par slot

| Slot | Rôle | Règle |
|------|------|-------|
| A | Icône | Hauteur fixe 56px |
| B | Titre | Hauteur minimale 44px |
| C.1 | Subtitle | 1 ligne max (line-clamp: 1) |
| C.2 | Kicker | 1 ligne max (line-clamp: 1) |
| D | Détails | Visible seulement si ouvert |

---

## 6. États visuels

| État | Apparence | Comportement |
|------|-----------|--------------|
| **Fermé** | Fond gradient subtil, ombre légère (0 4px 12px rgba(0,0,0,0.06)) | Clic = ouverture |
| **Hover (fermé)** | Élévation +6px, ombre renforcée (0 12px 32px), scale 1.01 | Badge rotate 5deg, icône scale 1.1 |
| **Ouvert** | Ombre forte (0 16px 48px), élévation -4px | Détails visibles, bouton fermer affiché |
| **Autres cartes (une ouverte)** | Opacité 0.5, scale 0.98 | Atténuation visuelle |

---

## 7. Gestion de l'accordéon

Règles :

- Une seule carte ouverte
- Clic sur une autre = fermeture automatique
- Bouton fermer visible uniquement ouvert
- Animation fluide (200ms ouverture, 150ms fermeture)

---

## 8. Accessibilité

Obligatoire :

- `aria-expanded` (true/false)
- `aria-controls` (ID du détail)
- `role="region"` (sur le détail)
- **Ajout dynamique de `hidden`** sur les contenus fermés

### Gestion de `hidden` avec transitions

> **Note technique :**  
> L'attribut `hidden` doit être appliqué **après** la transition CSS pour éviter les conflits.

```javascript
// Dans la fonction closeCard
detail.addEventListener('transitionend', function(e) {
    if (e.propertyName === 'max-height' && !card.classList.contains('is-open')) {
        detail.setAttribute('hidden', true);
    }
});

// Dans la fonction openCard
detail.removeAttribute('hidden');
```

### HTML initial

```html
<div class="status-card-detail" 
     id="status-detail-validated" 
     role="region" 
     aria-label="Détails du statut Validé"
     hidden>
```

---

## 9. Animations — Détails techniques

| Animation | Durée | Easing | Propriétés |
|-----------|-------|--------|------------|
| **Ouverture** | 200ms | `ease-out` | `max-height`, `opacity`, `padding` |
| **Fermeture** | 150ms | `ease-in` | `max-height`, `opacity`, `padding` |
| **Hover** | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform`, `box-shadow` |
| **Badge hover** | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform` (scale 1.1 + rotate 5deg) |
| **Icône hover** | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform` (scale 1.1) |

**Note :** Toutes les animations doivent respecter `prefers-reduced-motion: reduce`

```css
@media (prefers-reduced-motion: reduce) {
    .status-card,
    .status-card-detail,
    .status-card-close,
    .status-card-icon,
    .status-card-badge {
        transition: none;
    }
}
```

---

## 10. UX attendue

### Fermé
- Lecture en 3 secondes
- Message business clair
- Aucun jargon
- Alignement visuel parfait

### Ouvert
- Détails techniques
- Preuve de sérieux
- Rassure DAF / dirigeant

---

## 11. Tests de validation

### Test 1 : Lecture rapide
- [ ] Temps de compréhension < 5 secondes
- [ ] Message mémorisé après 1 lecture
- [ ] Aucun jargon technique visible en fermé

### Test 2 : Alignement visuel
- [ ] Toutes les cartes ont la même hauteur en fermé
- [ ] Les icônes sont alignées horizontalement
- [ ] Les titres sont alignés horizontalement
- [ ] Les textes ne débordent pas (line-clamp fonctionne)

### Test 3 : Accessibilité
- [ ] Navigation clavier complète (TAB, ENTER, SPACE)
- [ ] Lecteur d'écran annonce correctement les états
- [ ] Focus visible sur tous les éléments interactifs
- [ ] `hidden` présent quand fermé, absent quand ouvert

### Test 4 : Responsive
- [ ] Desktop (>1024px) : 3 colonnes alignées
- [ ] Tablet (768-1023px) : 2 colonnes, pas de débordement
- [ ] Mobile (<768px) : 1 colonne, texte lisible
- [ ] Slots restent alignés sur tous les breakpoints

---

## 12. Cas limites

### Texte trop long
Si le contenu dépasse 2 lignes :
- Utiliser `text-overflow: ellipsis`
- Tronquer avec `...`
- **Ne jamais** laisser déborder

### Contenu détaillé trop long
Si plus de 5 items :
- Limiter à 5 items maximum
- Utiliser un scroll interne si nécessaire
- **Ne jamais** dépasser la hauteur max de la carte (500px)

### Mobile très petit (<375px)
- Réduire les paddings à 1rem
- Réduire la taille des icônes à 2rem
- Badge à 24px au lieu de 28px

---

## 13. Performance

### Optimisations CSS
- Utiliser `will-change` sur les éléments animés (optionnel)
- Éviter les `reflow` en utilisant `transform` plutôt que `top/left`
- Utiliser `opacity` pour les transitions de visibilité

### Optimisations JS
- Debounce les événements si nécessaire (non requis actuellement)
- Utiliser `requestAnimationFrame` pour les animations complexes (non requis actuellement)
- Éviter les `querySelector` répétés (déjà optimisé)

---

## 14. Responsive — Breakpoints

| Breakpoint | Colonnes | Gap | Padding summary | Padding detail |
|------------|----------|-----|-----------------|----------------|
| Desktop (>1024px) | 3 | 2rem | 2.5rem 2rem | 0 2rem 2rem |
| Tablet (768-1023px) | 2 | 1.5rem | 2rem 1.5rem | 0 1.5rem 1.5rem |
| Mobile (<768px) | 1 | 1.25rem | 2rem 1.5rem | 0 1.5rem 1.5rem |
| Très petit (<375px) | 1 | 1rem | 1.5rem 1rem | 0 1rem 1rem |

---

## 15. KPI de réussite

- Temps de compréhension < 5 secondes
- Scroll non nécessaire
- Aucun abandon interaction
- Message mémorisé après 1 lecture
- Alignement visuel parfait sur tous les breakpoints

---

## 16. Glossaire

| Terme | Définition |
|-------|------------|
| **Slot** | Zone visuelle fixe avec dimensions définies |
| **Line-clamp** | Propriété CSS limitant le nombre de lignes affichées |
| **Hidden** | Attribut HTML masquant un élément des lecteurs d'écran |
| **Accordéon exclusif** | Un seul élément ouvert à la fois |
| **Progressive disclosure** | Principe UX : montrer peu, révéler à la demande |

---

## 17. Checklist finale

### Copywriting
- [ ] Titres changés : "Valider", "Sceller", "Prouver"
- [ ] Ligne 2 — Carte 2 : "dans Dorevia-Vault"
- [ ] Ligne 2 — Carte 3 : "à tout moment"
- [ ] Maximum 2 lignes visibles (subtitle + kicker)

### Technique
- [ ] `data-status="valided"` → `data-status="validated"`
- [ ] Slots fixes CSS implémentés (hauteurs minimales)
- [ ] Line-clamp sur subtitle et kicker
- [ ] `hidden` dynamique ajouté dans JS
- [ ] Contenu détaillé — Carte 2 : 4 items (ajouter "Journal immuable")
- [ ] Contenu détaillé — Carte 3 : "Vérification indépendante"

### Accessibilité
- [ ] `aria-expanded` présent et mis à jour
- [ ] `aria-controls` présent
- [ ] `role="region"` présent
- [ ] `hidden` ajouté/supprimé dynamiquement
- [ ] Navigation clavier complète

### Responsive
- [ ] Desktop : 3 colonnes alignées
- [ ] Tablet : 2 colonnes, pas de débordement
- [ ] Mobile : 1 colonne, texte lisible
- [ ] Slots alignés sur tous les breakpoints

### Design
- [ ] États visuels implémentés (fermé, hover, ouvert, autres)
- [ ] Animations fluides (durées et easing corrects)
- [ ] Respect de `prefers-reduced-motion`
- [ ] Ombres et gradients premium

---

## 📋 Priorités d'implémentation

### Phase 1 — Corrections critiques (P0)
1. Corriger `data-status="valided"` → `data-status="validated"`
2. Implémenter les slots fixes CSS
3. Corriger le texte ligne 2 — Carte 2

**Temps estimé :** 30 minutes  
**Impact :** Élevé — Résout les problèmes critiques

### Phase 2 — Améliorations importantes (P1)
4. Changer les titres : Actions au lieu de Statuts
5. Ajouter `hidden` dynamique
6. Compléter le contenu détaillé — Carte 2

**Temps estimé :** 45 minutes  
**Impact :** Moyen — Améliore significativement l'UX

### Phase 3 — Ajustements finaux (P2)
7. Ajuster le texte ligne 2 — Carte 3
8. Mettre à jour le contenu détaillé — Carte 3

**Temps estimé :** 15 minutes  
**Impact :** Faible — Polish final

---

## ✅ Conclusion

Cette spécification v1.3 améliorée est :

✔️ **Implémentable sans ambiguïté** — Tous les détails techniques sont précisés  
✔️ **Testable** — Checklist complète de validation  
✔️ **Maintenable** — Structure claire, glossaire inclus  
✔️ **Professionnelle** — Respecte les meilleures pratiques UX/UI

**Prête pour implémentation immédiate.**

---

**Fin de la spécification**
