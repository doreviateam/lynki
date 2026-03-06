# 📘 SPEC — Section "Défis" (Amendée)
**Projet :** Landing Page Dorevia-Vault  
**Version :** v1.1 (Amendée)  
**Date :** 21/01/2026  
**Statut :** Prêt à implémenter  
**Auteur :** Équipe produit Dorevia-Vault + Amendements IA  

---

## 🎯 Objectif

Faire prendre conscience au visiteur que :

- le problème **n'est pas son outil**
- le problème est **le délai et la fragilité** entre :
  - l'événement réel  
  - et l'information fiable

Créer une **tension émotionnelle** avant de présenter Dorevia-Vault comme solution.

---

## 🧠 Intention UX

Après cette section, l'utilisateur doit penser :

> *"Oui… c'est exactement ce que je vis."*

On cherche :
- identification  
- empathie  
- prise de conscience  

---

## 📝 Amendements proposés

### 1. Structure améliorée

**Changement :** Ajouter un message d'introduction fort avant les sous-sections pour créer l'empathie immédiate.

**Raison :** Le message développé doit être visible en premier pour créer l'identification avant de détailler les problèmes.

### 2. Layout optimisé

**Changement :** Sur desktop, utiliser un layout en 2 colonnes :
- **Gauche :** Message développé (texte principal)
- **Droite :** Illustration visuelle ou métaphore (optionnel, peut être remplacé par un bloc explicatif)

**Raison :** Meilleure lisibilité et impact visuel. Le texte à gauche est plus naturel pour la lecture.

### 3. Sous-sections consolidées

**Changement :** Fusionner "Les chiffres sont ajustés après coup" avec "Excel bricolés" car ils sont liés.

**Résultat :** 3 sous-sections au lieu de 4 :
1. **Chiffres en retard** (gardé tel quel)
2. **Excel bricolés** (fusionné avec ajustements)
3. **Stress des contrôles** (gardé tel quel)

### 4. Citations visuelles

**Changement :** Rendre les citations plus visuelles avec un style de blockquote distinctif.

**Raison :** Augmenter l'impact émotionnel des citations.

### 5. CTA amélioré

**Changement :** Le CTA doit être plus actionnable et visible.

**Texte proposé :** "Voir comment Dorevia-Vault supprime ces problèmes" → "Découvrir la solution" (plus court, plus direct)

---

## 🧱 Structure finale (amendée)

### 1. En-tête de section

**Kicker :** (optionnel, peut être supprimé pour plus de sobriété)  
**Titre H2 :** "Pourquoi vos chiffres ne sont pas fiables aujourd'hui"  
**Sous-titre :** (optionnel, peut être intégré dans le message développé)

---

### 2. Message développé (Layout 2 colonnes sur desktop)

**Colonne gauche (60-65%) :**

```
Vous avez des outils.
Vous avez des équipes.
Pourtant, vous doutez encore de vos chiffres.

Le problème n'est pas votre ERP.
Ce n'est pas votre comptable.
C'est le délai et la fragilité entre ce qui se passe réellement
et ce que vous voyez dans vos tableaux de bord.
```

**Colonne droite (35-40%) :**

Option A : Illustration visuelle (timeline, graphique de délai)  
Option B : Bloc explicatif avec métaphore  
Option C : Statistique clé (ex: "68% des dirigeants doutent de leurs chiffres")

---

### 3. Sous-sections (3 cartes)

#### 1️⃣ Chiffres en retard

**Titre :** "Vous pilotez avec du retard"  
**Description :** Clôtures mensuelles à J+15, J+30, parfois J+45. Vous prenez des décisions **sur le passé**.  
**Citation :** *"Vous pilotez en regardant dans le rétroviseur."*  
**Métrique :** 15–45 jours / délai moyen de disponibilité

---

#### 2️⃣ Excel bricolés

**Titre :** "Excel est au cœur des processus"  
**Description :** Exports manuels, versions multiples, corrections à la main. Une seule personne détient la "vérité".  
**Citation :** *"Le moindre départ devient un risque."*  
**Métrique :** 73% / des PME utilisent encore Excel

---

#### 3️⃣ Stress des contrôles

**Titre :** "Les justificatifs restent difficiles à produire"  
**Description :** Impossible de produire une preuve immédiate. Temps perdu à justifier, expliquer, reconstruire.  
**Citation :** *"Vous subissez au lieu d'anticiper."*  
**Métrique :** +10 Md€ / de redressements par an

---

### 4. Call To Action

**Texte :** "Découvrir la solution"  
**Lien :** `#solution`  
**Style :** Bouton primary, aligné à droite ou centré selon le design

---

## 🎨 Règles UI (amendées)

### Layout Desktop

```
┌─────────────────────────────────────────────────┐
│  [Titre Section]                                │
│                                                  │
│  ┌──────────────────────┬──────────────────┐   │
│  │ Message développé    │ Illustration/    │   │
│  │ (60-65%)            │ Bloc explicatif  │   │
│  │                      │ (35-40%)        │   │
│  └──────────────────────┴──────────────────┘   │
│                                                  │
│  ┌──────────┬──────────┬──────────┐            │
│  │ Carte 1  │ Carte 2  │ Carte 3  │            │
│  └──────────┴──────────┴──────────┘            │
│                                                  │
│  [CTA]                                          │
└─────────────────────────────────────────────────┘
```

### Layout Mobile

- Empilé verticalement
- Message développé en premier
- Illustration/bloc en dessous
- Cartes empilées (1 colonne)
- CTA en bas

### Cartes

- Format carte avec ombre légère
- Icône en haut (légère, pas trop imposante)
- Titre en gras
- Description (2-3 lignes max)
- Citation en italique, style blockquote
- Métrique en bas (optionnel, peut être intégré dans la description)

---

## 🧩 Contraintes (validées)

- ✅ Max 3 sous-sections
- ✅ Pas de jargon technique
- ✅ Pas de "nous"
- ✅ Toujours parler en "vous"
- ✅ Ton terrain, concret
- ✅ Aligné avec le Hero

---

## 📌 KPI de réussite

- Scroll jusqu'à la section Solution
- Temps passé > 10s
- Taux de clic sur CTA > Hero CTA

---

## 🏁 Conclusion

Cette section doit :
- installer le **problème**
- créer un **besoin latent**
- rendre Dorevia-Vault **évident** comme suite logique

---

## 🔧 Implémentation technique

### Structure HTML proposée

```html
<section id="defis-pilotage" class="dv-section dv-defis">
  <div class="dv-container">
    
    <!-- En-tête -->
    <header class="dv-section__head">
      <h2 class="dv-title">Pourquoi vos chiffres ne sont pas fiables aujourd'hui</h2>
    </header>

    <!-- Message développé (2 colonnes) -->
    <div class="dv-message-block">
      <div class="dv-message-text">
        <p class="dv-message-intro">Vous avez des outils.<br>Vous avez des équipes.<br>Pourtant, vous doutez encore de vos chiffres.</p>
        <p class="dv-message-core">Le problème n'est pas votre ERP.<br>Ce n'est pas votre comptable.<br>C'est <strong>le délai et la fragilité</strong> entre ce qui se passe réellement<br>et ce que vous voyez dans vos tableaux de bord.</p>
      </div>
      <div class="dv-message-visual">
        <!-- Option: Illustration ou bloc explicatif -->
      </div>
    </div>

    <!-- 3 sous-sections -->
    <div class="dv-grid dv-grid--3">
      <!-- Carte 1: Chiffres en retard -->
      <!-- Carte 2: Excel bricolés -->
      <!-- Carte 3: Stress des contrôles -->
    </div>

    <!-- CTA -->
    <div class="dv-cta-block">
      <a href="#solution" class="dv-btn dv-btn--primary">Découvrir la solution</a>
    </div>

  </div>
</section>
```

### Classes CSS à créer

- `.dv-message-block` : Container flex pour 2 colonnes
- `.dv-message-text` : Colonne texte (60-65%)
- `.dv-message-visual` : Colonne visuelle (35-40%)
- `.dv-message-intro` : Paragraphe d'introduction
- `.dv-message-core` : Paragraphe principal avec strong
- `.dv-card-quote` : Style pour les citations
- `.dv-grid--3` : Grid 3 colonnes (au lieu de 4)
- `.dv-cta-block` : Container pour le CTA

---

## ✅ Checklist d'implémentation

- [ ] Créer la structure HTML avec message développé
- [ ] Implémenter le layout 2 colonnes (desktop)
- [ ] Réduire de 4 à 3 cartes
- [ ] Ajouter les citations avec style blockquote
- [ ] Adapter le CTA
- [ ] Tester responsive (mobile/tablette)
- [ ] Vérifier l'accessibilité
- [ ] Optimiser les performances

---

**Note :** Cette SPEC amendée respecte l'intention originale tout en améliorant l'UX et la lisibilité.
