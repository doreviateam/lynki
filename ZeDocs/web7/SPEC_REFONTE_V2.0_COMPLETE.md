# 📘 Spécification Complète — Refonte Landing Page Dorevia-Vault v2.0

**Version :** v2.0  
**Date :** 2026-01-22  
**Statut :** Spécification complète et validée  
**Cible :** CFO / dirigeants / early adopters / investisseurs  
**Objectif :** Déclencher des conversations qualifiées

---

## 📋 Table des matières

1. [Contexte et objectifs](#contexte-et-objectifs)
2. [Architecture et structure](#architecture-et-structure)
3. [Détails des sections](#détails-des-sections)
4. [Règles UX/UI](#règles-uxui)
5. [Contenus et messages](#contenus-et-messages)
6. [Préconisations techniques](#préconisations-techniques)
7. [Plan d'implémentation](#plan-dimplémentation)
8. [Risques et mitigations](#risques-et-mitigations)
9. [Métriques de succès](#métriques-de-succès)

---

## 🎯 Contexte et objectifs

### Problème identifié

Le site actuel (v3.0) n'est **pas efficace** car :

1. **Trop de sections** (7 sections + sous-sections)
2. **Message dilué** : trop d'informations, pas de focus
3. **Funnel confus** : pas de progression claire
4. **CTAs multiples** : perte de focus sur l'action principale
5. **Contenu trop dense** : sections "Pour qui", "Cas d'usage", "Conformité" surchargent la home

### Vision nouvelle (v2.0)

> **"Le site n'est pas un catalogue produit. C'est une porte d'entrée dans l'aventure."**

**Funnel cible :**
```
Curiosité → Compréhension → Preuve → Conversation → Conversion
```

**Note :** Le manifeste est une page dédiée (`/manifeste`), pas une section de la landing page.

**Principe :** 1 section = 1 idée = 1 CTA max (exception : section Conversation & CTA avec 2 CTAs)

### Objectifs globaux

Le site doit :

1. ✅ Donner envie de continuer (curiosité)
2. ✅ Faire comprendre notre rôle unique
3. ✅ Prouver que le produit existe
4. ✅ Ouvrir la conversation
5. ✅ Générer des opportunités (conversion)

---

## 🧱 Architecture et structure

### Structure actuelle (v3.0) → Structure cible (v2.0)

| Actuel (v3.0) | Cible (v2.0) | Action |
|---------------|--------------|--------|
| 1. Hero (figé) ✅ | 1. Hero (figé) ✅ | **CONSERVÉ** |
| 2. Défis (4 cartes) ❌ | 2. Positionnement | **NOUVEAU** |
| 3. Solution (3 cartes) ❌ | 3. Preuve | **NOUVEAU** |
| 4. Pour qui (4 personas) ❌ | 4. Conversation & CTA | **FUSIONNÉ** |
| 5. Cas d'usage (4 cartes) ❌ | | |
| 6. Conformité (6 cartes) ❌ | | |
| 7. CTA Final ✅ | | |

**Note :** Le manifeste devient une page dédiée (`/manifeste`), accessible depuis le menu ou via un lien dans le footer.

### Architecture finale

```
┌─────────────────────────────────────┐
│ 1. HERO (figé)                     │
│    Rôle : Curiosité                │
│    CTA : Aucun (scroll naturel)    │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. POSITIONNEMENT                   │
│    Rôle : Compréhension              │
│    CTA : "Voir la démo" (discret)   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. PREUVE                           │
│    Rôle : Preuve                     │
│    CTA : "Voir la démo" (principal) │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. CONVERSATION & CTA                │
│    Rôle : Conversation + Conversion   │
│    CTAs : "Démo" + "Projet"          │
└─────────────────────────────────────┘
```

**Note :** Le manifeste est accessible via :
- Menu principal : lien vers `/manifeste`
- Footer : lien vers `/manifeste`

### Éléments à déplacer

Ces sections **ne sont plus sur la home** mais deviennent des **pages secondaires** :

- **"Pour qui"** → `/pour-qui` (nouvelle page)
- **"Cas d'usage"** → `/cas-usage` (nouvelle page) ou blog
- **"Conformité"** → `/conformite` (nouvelle page) ou ressources
- **"Défis"** → Supprimé (message déjà dans le Hero)
- **"Solution" actuelle** → Remplacée par "Positionnement"
- **"Manifeste"** → `/manifeste` (page dédiée, accessible depuis menu/footer)

---

## 📝 Détails des sections

### Section 1 : Hero (figé)

**Statut :** ✅ Conservé tel quel  
**Rôle :** Curiosité  
**Objectif :** "Je comprends le problème et j'ai envie de scroller."

**Action :** Aucune modification

---

### Section 2 : Positionnement

**ID HTML :** `#positionnement`  
**Classe CSS :** `.dv-section.dv-position`  
**Rôle :** Compréhension  
**Objectif :** Clarifier notre rôle unique, éviter toute confusion produit

#### Titre

```
L'ERP est votre matière première.
Nous la transformons en vérité.
```

#### Message clé

1. Votre ERP (Odoo, etc.) produit en continu des factures, paiements et écritures comptables
2. Aujourd'hui, ces données ne sont pas **nativement probantes**
3. Dorevia-Vault transforme ces événements en preuves financières exploitables, conformes aux exigences **LNE 2026 / NF525**

#### Promesse

```
Dorevia-Vault transforme vos événements ERP
en preuves financières exploitables,
conformes aux exigences LNE 2026 / NF525.
```

#### Cartes "Positionnement"

**Carte 1 : "ERP + événements"**
- Titre court et direct
- Contenu : Votre ERP enregistre l'activité, mais la valeur probante n'est pas garantie au moment où l'information est créée.

**Carte 2 : "Preuve automatisée"**
- Titre court et direct
- Contenu :
```
Capture automatique des événements,
horodatage et empreinte cryptographique.
Les données deviennent fiables, traçables
et juridiquement opposables.
```

**Note :** Titres de cartes courts et directs pour un ton B2B professionnel.

#### CTA

- **Texte :** "Voir la démo"
- **Style :** Discret (lien ou bouton secondaire)
- **Lien :** `#demo` (ancre vers section Preuve)

#### Structure HTML recommandée

```html
<section id="positionnement" class="dv-section dv-position">
  <div class="container">
    <header>
      <h2>
        L'ERP est votre matière première.<br>
        Nous la transformons en vérité.
      </h2>
    </header>

    <div class="position-content">
      <p>
        Votre ERP (Odoo, etc.) produit en continu<br>
        des factures, paiements et écritures comptables.
      </p>

      <p>
        Aujourd'hui, ces données ne sont pas
        <strong>nativement probantes</strong>.
      </p>

      <p>
        Dorevia-Vault transforme ces événements
        en <strong>preuves financières exploitables</strong>,
        conformes aux exigences <strong>LNE 2026 / NF525</strong>.
      </p>
    </div>

    <div class="position-cta">
      <a href="#demo" class="dv-btn dv-btn--secondary">
        Voir la démo
      </a>
    </div>
  </div>
</section>
```

#### Recommandations visuelles

- Ajouter une métaphore visuelle (schéma ERP → Vault)
- Renforcer la notion de "transformation"
- Utiliser des visuels pour illustrer le flux

---

### Section 3 : Preuve

**ID HTML :** `#demo` ou `#preuve`  
**Classe CSS :** `.dv-section.dv-proof`  
**Rôle :** Preuve  
**Objectif :** Prouver que le produit existe

#### Message principal (accroche)

```
Accédez à une démonstration réelle
sur une instance en production.
```

#### Titre

```
Voir plutôt que croire
```

#### Contenu à montrer

1. Instance Odoo réelle
2. Flux de production
3. Collecte automatique
4. Preuves horodatées et vérifiables

**Note :** Liste sans emojis pour un ton plus professionnel.

#### Message complémentaire

```
L'interface Dorevia-Vault arrive ensuite
pour exploiter ces preuves :
tableaux de bord, pilotage, vérification.
```

#### CTA principal

- **Texte :** "Voir la démo"
- **Style :** Bouton primaire
- **Lien :** `/demo` (page démo interactive)

#### Microcopy

```
Instance réelle • 30 minutes • Sans engagement
```

#### Structure HTML recommandée

```html
<section id="demo" class="dv-section dv-proof">
  <div class="container">
    <header>
      <h2>Voir plutôt que croire</h2>
      <p class="proof-hook">
        Accédez à une démonstration réelle<br>
        sur une instance en production.
      </p>
    </header>

    <div class="proof-visual">
      <!-- Option A : Capture d'écran Odoo -->
      <img src="/assets/demo/odoo-instance.png" 
           alt="Instance Odoo réelle" />
      
      <!-- Option B : Schéma du flux -->
      <div class="proof-flow">
        <div class="flow-step">Odoo</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">DVIG</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">Vault</div>
      </div>
    </div>

    <div class="proof-features">
      <ul>
        <li>Instance Odoo réelle</li>
        <li>Flux de production</li>
        <li>Collecte automatique</li>
        <li>Preuves horodatées et vérifiables</li>
      </ul>
    </div>

    <div class="proof-description">
      <p>
        L'interface Dorevia-Vault arrive ensuite
        pour exploiter ces preuves :
        tableaux de bord, pilotage, vérification.
      </p>
    </div>

    <div class="proof-cta">
      <a href="/demo" class="dv-btn dv-btn--primary">
        Voir la démo
      </a>
      <small>Instance réelle • Pas un fake • 30 minutes</small>
    </div>
  </div>
</section>
```

#### Assets nécessaires (CRITIQUE)

**À préparer AVANT l'implémentation :**

1. ✅ Captures d'écran instance Odoo (si disponible)
2. ✅ Schéma du flux Odoo → DVIG → Vault (SVG ou image)
3. ✅ Lien vers démo interactive (si disponible)
4. ✅ Aperçu UI Vault (capture d'écran)

**Fallback si assets non disponibles :**
- Schéma SVG du flux (à créer)
- Liste structurée avec icônes
- Lien vers démo interactive

---

### Section 4 : Conversation & CTA

**ID HTML :** `#conversation-cta`  
**Classe CSS :** `.dv-section.dv-conversation-cta`  
**Rôle :** Conversation + Conversion  
**Objectif :** Ouvrir la conversation ET générer des conversions

#### Titre principal

```
Échangeons sur votre contexte
```

#### Message d'accroche (optionnel)

```
ERP • Process • Volumétrie • Contraintes
```

#### Message de transparence

```
Chaque demande est analysée pour qualifier votre environnement
et valider l'adéquation produit.

Réponse rapide. Pas de spam.
```

#### CTAs (2 options hiérarchisées)

1. **CTA primaire :** "Voir la démo"
   - Style : Bouton primaire
   - Lien : `/demo`
   - Objectif : Conversion directe

2. **CTA secondaire :** "Présenter votre projet"
   - Style : Bouton secondaire
   - Lien : `/contact`
   - Objectif : Conversation, qualification
   
   **Note :** "Présenter" est plus formel que "Parler" pour un ton B2B.

#### Microcopy

```
30 minutes • sans engagement
```

#### Structure HTML recommandée

```html
<section id="conversation-cta" class="dv-section dv-conversation-cta">
  <div class="container text-center">
      <header>
        <h2>Échangeons sur votre contexte</h2>
        <p class="dv-hook">
          ERP • Process • Volumétrie • Contraintes
        </p>
      </header>

      <div class="conversation-transparency">
        <p class="transparency-message">
          Chaque demande est analysée pour qualifier votre environnement<br>
          et valider l'adéquation produit.
        </p>
        <p class="transparency-note">
          Réponse rapide. Pas de spam.
        </p>
      </div>

      <div class="cta-actions">
        <a href="/demo" class="dv-btn dv-btn--primary">
          Voir la démo
        </a>
        <a href="/contact" class="dv-btn dv-btn--secondary">
          Présenter votre projet
        </a>
      </div>

    <div class="cta-microcopy">
      <small>30 minutes • sans engagement</small>
    </div>
  </div>
</section>
```

#### Recommandations

- **Hiérarchiser les CTAs** (primaire pour démo, secondaire pour conversation)
- **Centrer le contenu** pour l'impact
- **Combiner les messages** : conversion ET co-construction
- **Message de transparence** pour différencier du contact générique

**Note :** Le manifeste est une page dédiée (`/manifeste`), accessible depuis le menu principal ou le footer. Il n'est pas une section de la landing page.

---

## 🎨 Règles UX/UI

### Principes généraux

- ✅ **1 section = 1 idée**
- ✅ **1 CTA max par section** (sauf section Conversation & CTA qui en a 2)
- ✅ **Respiration visuelle** : espacements généreux
- ✅ **Pas de pavés de texte** : paragraphes courts
- ✅ **Pas de jargon technique** : langage accessible
- ✅ **Toujours parler au "vous"** : ton direct et personnel

### Structure des sections

**Header :**
- Titre clair et percutant
- Pas d'intro longue

**Contenu :**
- Message court et direct
- Visuels si nécessaire
- Pas de liste exhaustive

**Footer :**
- CTA unique et clair (sauf CTA Final)
- Microcopy si nécessaire

### Typographie

- **Titres :** Impactants, phrases courtes
- **Paragraphes :** Maximum 3-4 lignes
- **Mots clés :** En gras pour l'impact
- **Microcopy :** Petite taille, discret

### Espacements

- **Entre sections :** Espacement généreux (minimum 80px)
- **Dans sections :** Respiration entre éléments (minimum 40px)
- **Mobile :** Réduire de 30-40%

### Responsive

- **Desktop :** Largeur max 1200px, centré
- **Tablet :** Adaptation fluide
- **Mobile :** Stack vertical, espacements réduits

---

## 📄 Contenus et messages

### Messages clés par section

| Section | Message clé | Objectif |
|---------|-------------|----------|
| Hero | (figé) | Curiosité |
| Positionnement | "L'ERP est la matière première" | Compréhension |
| Preuve | "Voir plutôt que croire" | Preuve |
| Conversation & CTA | "Échangeons sur votre contexte" | Conversation + Conversion |

**Note :** Le manifeste est une page dédiée (`/manifeste`), accessible depuis le menu ou le footer.

### Ton et style

- **Ton :** Direct, personnel, transparent
- **Style :** Phrases courtes, impactantes
- **Vocabulaire :** Accessible, pas de jargon
- **Personne :** "Vous" (tutoiement si approprié selon contexte)

### Cohérence avec le manifeste

La SPEC v2.0 traduit fidèlement la vision du manifeste :

- ✅ "L'ERP est la matière brute" → "L'ERP est la matière première"
- ✅ "Preuves exploitables" → "Preuves financières exploitables"
- ✅ "LNE 2026 / NF525" → Mentionné
- ✅ "Infrastructure pour 10 ans" → "Infrastructure de vérité financière pour les 10 prochaines années"

---

## 🔧 Préconisations techniques

### Structure HTML

- **Sections :** Utiliser `<section>` avec ID et classes
- **Conteneurs :** Utiliser `.container` pour la largeur max
- **Sémantique :** Respecter HTML5 sémantique
- **Accessibilité :** ARIA labels si nécessaire

### Classes CSS

**Nomenclature :**
- `.dv-section` : Classe de base pour toutes les sections
- `.dv-position` : Section Positionnement
- `.dv-proof` : Section Preuve
- `.dv-conversation-cta` : Section Conversation & CTA

**Note :** Le manifeste est une page dédiée (`/manifeste`), pas une section de la landing page.

**Boutons :**
- `.dv-btn` : Classe de base
- `.dv-btn--primary` : Bouton primaire
- `.dv-btn--secondary` : Bouton secondaire
- `.dv-link` : Lien discret

### Navigation

**Menu principal :**
- Supprimer liens vers sections supprimées
- Ajouter liens vers nouvelles pages secondaires :
  - `/pour-qui`
  - `/cas-usage`
  - `/conformite`
  - `/manifeste`
- Garder ancres vers sections home :
  - `#positionnement`
  - `#preuve` (ou `#demo`)
  - `#conversation-cta`
- Ajouter lien vers page manifeste :
  - `/manifeste` (page dédiée, accessible depuis menu/footer)

### Pages secondaires à créer

1. **`/pour-qui`** : Extraire contenu section "Pour qui"
2. **`/cas-usage`** : Extraire contenu section "Cas d'usage"
3. **`/conformite`** : Extraire contenu section "Conformité"
4. **`/manifeste`** : Version complète du manifeste

### Assets nécessaires

**Section Preuve (CRITIQUE) :**
- [ ] Captures d'écran instance Odoo
- [ ] Schéma du flux Odoo → DVIG → Vault (SVG)
- [ ] Lien vers démo interactive
- [ ] Aperçu UI Vault

**Section Positionnement (recommandé) :**
- [ ] Métaphore visuelle (schéma ERP → Vault)
- [ ] Illustration de la transformation

### Performance

- **Images :** Optimiser (WebP, lazy loading)
- **CSS :** Minifier en production
- **JS :** Minifier en production
- **Fonts :** Précharger si nécessaire

---

## 📋 Plan d'implémentation

### Phase 0 : Préparation assets (CRITIQUE)

**Durée :** 1-2 jours  
**Avant tout :**

1. **Assets section "Preuve"**
   - [ ] Captures instance Odoo
   - [ ] Schéma flux (SVG ou image)
   - [ ] Lien démo interactive
   - [ ] Aperçu UI Vault

2. **Page Manifeste**
   - [ ] Créer page `/manifeste` avec contenu complet
   - [ ] Ajouter lien dans menu principal
   - [ ] Ajouter lien dans footer

3. **Contenu section "Conversation"**
   - [ ] Message de transparence renforcé
   - [ ] Différenciation visuelle définie

---

### Phase 1 : Préparation (1 jour)

1. **Créer pages secondaires**
   - [ ] `/pour-qui` (extrait section actuelle)
   - [ ] `/cas-usage` (extrait section actuelle)
   - [ ] `/conformite` (extrait section actuelle)
   - [ ] `/manifeste` (version complète)

2. **Valider contenus**
   - [ ] Section "Positionnement" (longueur)
   - [ ] Section "Preuve" (assets)
   - [ ] Section "Conversation" (message)
   - [ ] Page "Manifeste" (contenu complet)

---

### Phase 2 : Refonte template (2-3 jours)

1. **Supprimer sections obsolètes**
   - [ ] Section "Défis"
   - [ ] Section "Solution" actuelle
   - [ ] Section "Pour qui"
   - [ ] Section "Cas d'usage"
   - [ ] Section "Conformité"

2. **Créer nouvelles sections**
   - [ ] Section "Positionnement" (avec métaphore visuelle)
   - [ ] Section "Preuve" (avec assets)
   - [ ] Section "Conversation & CTA" (fusionnée, 2 CTAs hiérarchisés, message de transparence)

**Note :** Le manifeste est une page dédiée (`/manifeste`), créée en Phase 1.

3. **Ajuster le Hero**
   - [ ] Vérifier qu'il reste conforme
   - [ ] Aucune modification si figé

---

### Phase 3 : CSS et styles (1-2 jours)

1. **Créer styles nouvelles sections**
   - [ ] `.dv-position` (avec support métaphore)
   - [ ] `.dv-proof` (avec support assets visuels)
   - [ ] `.dv-conversation-cta` (centré, hiérarchisé, avec message de transparence)

**Note :** Les styles pour la page `/manifeste` seront créés séparément.

2. **Nettoyer styles obsolètes**
   - [ ] Supprimer styles sections supprimées
   - [ ] Optimiser espacements
   - [ ] Responsive

---

### Phase 4 : Navigation (0.5 jour)

1. **Mettre à jour menu**
   - [ ] Supprimer liens sections supprimées
   - [ ] Ajouter liens pages secondaires :
     - `/pour-qui`
     - `/cas-usage`
     - `/conformite`
     - `/manifeste`
   - [ ] Garder ancres vers sections home :
     - `#positionnement`
     - `#preuve` (ou `#demo`)
     - `#conversation-cta`

2. **Mettre à jour footer**
   - [ ] Ajouter lien vers `/manifeste`

---

### Phase 5 : Tests (1 jour)

1. **Tests fonctionnels**
   - [ ] Navigation
   - [ ] CTAs
   - [ ] Responsive
   - [ ] Performance

2. **Tests UX**
   - [ ] Compréhension sections
   - [ ] Hiérarchie des CTAs dans section Conversation & CTA
   - [ ] Clarté section Preuve
   - [ ] Accessibilité page Manifeste depuis menu/footer

---

## ⚠️ Risques et mitigations

### Risque 1 : Section "Preuve" sans assets

**Impact :** ⚠️ ÉLEVÉ  
**Probabilité :** ⚠️ MOYENNE

**Mitigation :**
1. Préparer les assets AVANT l'implémentation (Phase 0)
2. Créer un schéma SVG du flux (fallback)
3. Lien vers démo interactive si disponible
4. Version minimale acceptable : liste + CTA

---

### Risque 2 : Confusion entre les deux CTAs

**Impact :** ⚠️ MOYEN  
**Probabilité :** ⚠️ MOYENNE

**Mitigation :**
1. Hiérarchiser visuellement (bouton primaire vs secondaire)
2. Renforcer le message de transparence pour le CTA "Parler de votre projet"
3. Positionner clairement : "Démo" (conversion) vs "Projet" (co-construction)
4. Tester la compréhension avec utilisateurs

---

### Risque 3 : Perte de trafic SEO

**Impact :** ⚠️ MOYEN  
**Probabilité :** ⚠️ FAIBLE

**Mitigation :**
1. Déplacer (pas supprimer) vers pages secondaires
2. Créer sitemap clair
3. Liens internes depuis la home
4. Redirections si nécessaire

---

### Risque 4 : Site trop court

**Impact :** ⚠️ FAIBLE  
**Probabilité :** ⚠️ FAIBLE

**Mitigation :**
1. Qualité > Quantité
2. Focus sur le funnel
3. Pages secondaires pour le détail

---

## 📊 Métriques de succès

### KPIs à suivre

1. **Scroll après Hero**
   - Objectif : > 60% des visiteurs scrollent
   - Mesure : Google Analytics, événements scroll

2. **Clic sur "Voir la démo"**
   - Objectif : > 5% des visiteurs
   - Mesure : Événements clics sur CTAs démo

3. **Messages entrants**
   - Objectif : > 2% des visiteurs
   - Mesure : Formulaires de contact soumis

4. **RDV qualifiés**
   - Objectif : > 1% des visiteurs
   - Mesure : Conversions vers démo/contact

### A/B Testing recommandé

- Titre section "Positionnement"
- Message section "Preuve"
- Hiérarchie des CTAs dans section "Conversation & CTA"
- Positionnement lien vers manifeste (menu vs footer)

---

## ✅ Checklist de validation

### Contenu

- [ ] Section "Positionnement" : Message clair, métaphore installée
- [ ] Section "Preuve" : Assets prêts, impact visuel fort
- [ ] Section "Conversation & CTA" : 2 CTAs hiérarchisés, message de transparence clair
- [ ] Page "Manifeste" : Contenu complet, accessible depuis menu/footer

### Technique

- [ ] Pages secondaires créées
- [ ] Navigation mise à jour
- [ ] Styles créés et nettoyés
- [ ] Responsive fonctionnel
- [ ] Performance optimisée

### UX

- [ ] Funnel progressif et clair
- [ ] 1 idée par section respectée
- [ ] 1 CTA max par section respecté (sauf section Conversation & CTA qui en a 2)
- [ ] Respiration visuelle
- [ ] Pas de pavés de texte

---

## 🏁 Résultat attendu

La landing doit donner l'impression :

> **"Ils construisent quelque chose d'important.  
> Je veux en faire partie."**

**Caractéristiques :**
- ✅ Court et focalisé (4 sections vs 7+)
- ✅ Funnel clair (Curiosité → Conversion)
- ✅ Message unique par section
- ✅ CTAs ciblés (2 CTAs dans la dernière section)
- ✅ Respiration visuelle
- ✅ Manifeste accessible via page dédiée (`/manifeste`)

---

## 📚 Références

- **Analyse stratégique :** `ANALYSE_REFONTE_STRATEGIQUE.md`
- **Analyse experte :** `ANALYSE_EXPERT_REFONTE_V2.0.md`
- **Manifeste :** `manifest.md`
- **Préconisations HTML :** `preco.html.md`
- **SPEC initiale :** `spec.md`

---

**Fin de la spécification complète**
