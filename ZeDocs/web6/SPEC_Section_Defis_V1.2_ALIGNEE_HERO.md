# 📘 SPEC — Section Défis / Problème — Dorevia-Vault
## Version alignée sur l'organisation du Hero

**Version :** v1.2 (Amendée, alignée Hero)  
**Date :** 2026-01-21  
**Cible :** CFO / RAF / Dirigeant financier  
**Statut :** Spécification amendée, prête à implémenter  
**Auteur :** Équipe produit Dorevia-Vault + Amendements IA  

---

## 🎯 Objectif

Créer une section UX qui :
1. Provoque l'identification immédiate (*« c'est moi »*)
2. Explique clairement la cause du problème
3. Génère le besoin d'une solution

**Structure alignée sur le Hero** :
- **Header centré** : Titre uniquement
- **Contenu principal** : Layout 2 colonnes (texte/visuel)
- **Footer centré** : CTA principal + optionnel secondaire

---

## 🧱 Organisation UX (alignée Hero)

### 🧭 Principes d'organisation

**Alignement avec le Hero** :
- ✅ Header minimal (titre uniquement, pas d'intro)
- ✅ Contenu principal en 2 colonnes (texte à gauche, visuel à droite)
- ✅ Footer centré avec CTA
- ✅ 100vh sans scroll sur desktop
- ✅ Espacements optimisés

### 🧩 Structure visuelle (desktop)

```
┌─────────────────────────────────────────────────┐
│  [Header Centré]                                │
│  - Titre H2 uniquement                          │
├─────────────────────────────────────────────────┤
│  [Contenu Principal - 2 colonnes]               │
│  ┌──────────────────┬──────────────────┐       │
│  │ Colonne Gauche   │ Colonne Droite   │       │
│  │ (60-65%)         │ (35-40%)         │       │
│  │                  │                  │       │
│  │ - Message intro  │ - Statistique    │       │
│  │ - Message core   │   visuelle OU    │       │
│  │                  │   Quote visuelle │       │
│  │ - 4 cartes       │                  │       │
│  │   (grid 2×2)     │                  │       │
│  └──────────────────┴──────────────────┘       │
├─────────────────────────────────────────────────┤
│  [Footer Centré]                                │
│  - CTA principal (bouton)                       │
│  - CTA secondaire optionnel (lien texte)        │
└─────────────────────────────────────────────────┘
```

### 📱 Structure mobile

- Header centré (titre uniquement)
- Message développé empilé (intro puis core)
- Statistique/Quote en dessous
- 4 cartes en colonne (1 par 1)
- Footer centré avec CTA

---

## 🧱 TITRE DE SECTION

**Pourquoi vos chiffres ne sont pas fiables aujourd'hui**

**Pas d'intro, pas de quote dans le header.** (Aligné Hero)

---

## 🧱 CONTENU PRINCIPAL (2 colonnes)

### Colonne gauche (60-65%)

#### Message intro (3 lignes)

```
Vous avez des outils.
Vous avez des équipes.
Pourtant, vous doutez encore de vos chiffres.
```

#### Message core (4-5 lignes)

```
Le problème n'est pas votre ERP.
Ce n'est pas votre comptable.
C'est le délai et la fragilité entre ce qui se passe réellement
et ce que vous voyez dans vos tableaux de bord.
```

**Note** : Le message core intègre la "cause racine" (délai et fragilité) et l'impact est présent dans les cartes.

#### 4 cartes en grid

**Grid desktop** : 2×2 ou 4×1 selon espace disponible  
**Grid tablette** : 2×2  
**Grid mobile** : 1×4 (empilées)

---

### Colonne droite (35-40%)

**Option A : Statistique visuelle** (recommandée)

```
┌─────────────────┐
│      68%        │
│                 │
│ des dirigeants  │
│ doutent de leurs│
│    chiffres     │
└─────────────────┘
```

**Option B : Quote visuelle**

```
┌─────────────────┐
│ "Quand les      │
│  chiffres sont  │
│  faux,          │
│  c'est vous     │
│  qu'on regarde."│
└─────────────────┘
```

---

## 🧱 GROUPE 1 — CE QUE VOUS VIVEZ (4 cartes)

### CARTE 1 — Retard

**Titre :** "Vous pilotez avec du retard"  
**Description :** Clôtures mensuelles à J+15, J+30, parfois J+45. Vous prenez des décisions **sur le passé**.  
**Citation :** *"Vous pilotez en regardant dans le rétroviseur."*  
**Statistique :** **15–45 jours** — Délai moyen de disponibilité

---

### CARTE 2 — Excel

**Titre :** "Excel est au cœur des processus"  
**Description :** Exports manuels. Versions multiples. Corrections à la main. Dépendance à une personne clé.  
**Citation :** *"Le moindre départ devient un risque."*  
**Statistique :** **73%** — des PME utilisent encore Excel

---

### CARTE 3 — Ajustements

**Titre :** "Les chiffres sont ajustés après coup"  
**Description :** Recalculs. Corrections manuelles. La confiance s'effondre.  
**Citation :** *"Vous doutez de vos propres chiffres."*  
**Statistique :** **68%** — des dirigeants doutent de leurs chiffres

---

### CARTE 4 — Justificatifs

**Titre :** "Les justificatifs restent difficiles à produire"  
**Description :** Impossible de fournir une preuve immédiate. Temps perdu à expliquer, reconstruire, justifier.  
**Citation :** *"Vous subissez au lieu d'anticiper."*  
**Statistique :** **+10 Md€** — de redressements par an

**Note** : Chaque carte intègre implicitement l'impact/coût (pas besoin de bloc séparé).

---

## 🎯 TRANSITION VERS LA SOLUTION (Footer)

**Texte de transition** (optionnel, 2-3 lignes max) :

```
La bonne nouvelle ?
Ce problème n'est pas une fatalité.
```

**CTA principal** (bouton) :
```
"Découvrir la solution"
```

**CTA secondaire** (optionnel, lien texte) :
```
"Parler à un expert (15 min)"
```

---

## 🎨 Règles UI (alignées Hero)

### Layout Desktop

- **Header** : Centré, largeur max 900px, margin-bottom 1rem
- **Contenu principal** : Grid 2 colonnes (1.6fr / 1fr), gap 2-3rem
- **Cartes** : Grid 2×2 ou 4×1, gap 10-12px
- **Footer** : Centré, largeur max 600px, margin-top 0.75rem

### Layout Mobile

- **Header** : Centré, pleine largeur
- **Contenu principal** : Empilé (message puis visuel)
- **Cartes** : 1 colonne, gap 12px
- **Footer** : Centré, pleine largeur

### Espacements (optimisés 100vh)

**Desktop** :
- Section padding : `1.5rem 0`
- Header margin-bottom : `1rem`
- Message margin-bottom : `1rem`
- Grid margin-bottom : `0.75rem`
- Footer margin-top : `0.5rem`

**MacBook (hauteur < 900px)** :
- Section padding : `1rem 0`
- Tous les espacements réduits de 25-30%

### Typographie (alignée Hero)

- **H2** : `clamp(24px, 2.5vw, 32px)` (desktop)
- **Message intro** : `1rem` (desktop), `0.95rem` (mobile)
- **Message core** : `0.95rem` (desktop), `0.9rem` (mobile)
- **Titres cartes** : `0.95rem` (desktop), `0.9rem` (mobile)
- **Quotes** : `0.85rem` (desktop), `0.8rem` (mobile)
- **Stats** : `1rem` (desktop), `0.9rem` (mobile)

### Comportements (micro-UX)

- **Cartes** : Hover léger (ombre / translation subtile)
- **CTA** : Un seul CTA principal (bouton), CTA secondaire optionnel (lien texte)
- **Smooth scroll** : Vers `#solution` au clic sur CTA

---

## ✅ Contraintes (validées)

- ✅ Max 4 cartes (pas de réduction)
- ✅ Pas de jargon technique
- ✅ Pas de "nous"
- ✅ Toujours parler en "vous"
- ✅ Ton terrain, concret
- ✅ Aligné avec le Hero (structure, layout, espacements)
- ✅ 100vh sans scroll sur desktop

---

## 📌 KPI de réussite

- Scroll jusqu'à la section Solution
- Temps passé > 10s
- Taux de clic sur CTA > Hero CTA
- Tous les éléments visibles sans scroll (100vh)

---

## 🔄 Différences v1.1 → v1.2

| Élément | v1.1 | v1.2 (aligné Hero) |
|---------|------|---------------------|
| **Header** | Titre + Intro + Quote | Titre uniquement |
| **Layout** | Vertical uniquement | 2 colonnes (texte/visuel) |
| **Blocs** | 5 blocs séparés | 3 blocs (Header, Contenu, Footer) |
| **Cause racine** | Bloc séparé | Intégré dans message core |
| **Impact CFO** | Bloc séparé | Intégré dans cartes |
| **CTAs** | Transition + CTA | Footer centré (comme Hero) |
| **100vh** | Non optimisé | Optimisé (comme Hero) |

---

## 🏁 Résumé

- ✅ Structure alignée Hero (Header → Contenu → Footer)
- ✅ Layout 2 colonnes cohérent
- ✅ 4 cartes conservées (pilier UX)
- ✅ Cause et impact intégrés (pas de blocs séparés)
- ✅ 100vh optimisé sans scroll
- ✅ Persona CFO respecté
- ✅ Ton factuel et crédible

---

**Fin de document**
