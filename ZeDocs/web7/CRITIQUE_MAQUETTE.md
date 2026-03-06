# 🔍 Critique de la maquette — Landing Page Dorevia-Vault v2.0

**Date :** 2026-01-22  
**Fichier analysé :** `maquette_ref.html`  
**Référence :** `SPEC_REFONTE_V2.0_COMPLETE.md`

---

## ✅ Points positifs

### 1. Structure générale

- ✅ **4 sections respectées** : Hero, Positionnement, Preuve, Conversation & CTA
- ✅ **Architecture cohérente** avec la spécification
- ✅ **Navigation claire** avec ancres vers les sections
- ✅ **Footer avec liens** vers pages secondaires (manifeste, pour-qui, etc.)

### 2. Design et UX

- ✅ **Design moderne** : fond sombre, gradients subtils, cartes avec transparence
- ✅ **Hiérarchie visuelle** : titres bien dimensionnés, espacements cohérents
- ✅ **Responsive** : media queries pour mobile/tablet
- ✅ **Accessibilité** : aria-labels présents, structure sémantique

### 3. Sections individuelles

- ✅ **Section Positionnement** : Structure en 2 cartes (avant/après) avec flux visuel
- ✅ **Section Preuve** : Grid avec visuel + liste, CTA bien positionné
- ✅ **Section Conversation & CTA** : Centré, message de transparence présent, 2 CTAs hiérarchisés

---

## ⚠️ Points à améliorer

### 1. Section Positionnement

#### Problème : Structure différente de la SPEC

**SPEC attendue :**
- Titre + message clé + promesse + CTA discret

**Maquette actuelle :**
- Titre + lead + 2 cartes (avant/après) + CTA dans la carte

**Recommandation :**
- Simplifier la structure pour correspondre à la SPEC
- Garder le message clé et la promesse en texte principal
- Le CTA "Voir la démo" doit être discret (bouton secondaire), pas dans une carte

#### Problème : CTA dans la carte au lieu d'être discret

**Ligne 380 :** Le CTA est dans la carte "Ce que fait Dorevia-Vault"

**Recommandation :**
- Déplacer le CTA en dehors des cartes, après le grid
- Style : bouton secondaire discret
- Texte : "Voir la démo" (ancre vers `#demo`)

---

### 2. Section Preuve

#### Problème : Message principal manquant

**SPEC attendue :**
```
"Je ne te demande pas de me croire.
Je te montre."
```

**Maquette actuelle :**
- Le message est dans le `dv-lead` (ligne 393) mais pas assez mis en avant

**Recommandation :**
- Ajouter une classe `.proof-hook` pour mettre en valeur ce message
- Style : plus grand, peut-être en italique ou avec une typographie spéciale
- Position : juste après le titre, avant le grid

#### Problème : Structure du CTA

**Ligne 423 :** Le CTA est dans la carte, ce qui est correct
**Ligne 424 :** Le microcopy est bien présent

**✅ OK** : Cette structure est acceptable

---

### 3. Section Conversation & CTA

#### Problème : Message d'accroche trop court

**SPEC attendue :**
```
Vous avez une douleur métier ?
Un contexte particulier ?
Un ERP spécifique ?
```

**Maquette actuelle (ligne 437) :**
- Tout sur une seule ligne, moins impactant

**Recommandation :**
- Mettre chaque question sur une ligne séparée avec `<br/>`
- Augmenter légèrement la taille de police pour l'impact

#### Problème : Message de transparence

**✅ OK** : Le message est présent (lignes 441-446) mais pourrait être mieux structuré

**Recommandation :**
- Séparer les deux parties du message :
  1. "Je lis tous les messages. Je m'en sers pour affiner le produit."
  2. "Ce n'est pas un formulaire générique : c'est une invitation à co-construire."
- Utiliser des paragraphes séparés pour plus de clarté

#### ✅ OK : Les 2 CTAs sont bien hiérarchisés (primaire/secondaire)

---

### 4. Navigation

#### Problème : Lien "Démo / Projet" peu clair

**Ligne 312 :** `<a href="#conversation-cta">Démo / Projet</a>`

**Recommandation :**
- Utiliser un libellé plus clair : "Contact" ou "Démo & Contact"
- Ou simplement "Contact" car c'est la section finale

#### ✅ OK : Lien vers manifeste présent

---

### 5. CSS et styles

#### Problème : Classes CSS non conformes à la SPEC

**SPEC attendue :**
- `.dv-position` : Section Positionnement
- `.dv-proof` : Section Preuve
- `.dv-conversation-cta` : Section Conversation & CTA

**Maquette actuelle :**
- ✅ `.dv-position` : OK
- ✅ `.dv-proof` : OK
- ✅ `.dv-conversation-cta` : OK

**✅ OK** : Les classes CSS sont conformes

#### Problème : Espacements

**Ligne 23 :** `--dv-section-pad: 88px;`

**Recommandation :**
- Vérifier que les espacements correspondent aux recommandations de la SPEC (minimum 80px entre sections)
- ✅ OK : 88px est supérieur à 80px

---

### 6. Contenu et messages

#### Problème : Section Positionnement - Message clé incomplet

**SPEC attendue :**
1. Vous avez déjà un ERP (Odoo, etc.)
2. Il génère des événements en continu : factures, paiements, écritures
3. Mais rien ne garantit leur **valeur probante**

**Maquette actuelle (lignes 352-354) :**
- Le message est présent mais condensé dans le lead
- La notion de "valeur probante" n'est pas assez mise en avant

**Recommandation :**
- Renforcer le message sur la "valeur probante" (en gras)
- Ajouter un paragraphe séparé pour cette notion clé

#### Problème : Section Positionnement - Promesse LNE 2026 / NF525

**SPEC attendue :**
```
Dorevia-Vault transforme vos événements ERP
en preuves financières exploitables,
conformes LNE 2026 / NF525.
```

**Maquette actuelle (ligne 376) :**
- La mention est présente mais dans la carte "Ce que fait Dorevia-Vault"
- Pas assez mise en avant

**Recommandation :**
- Ajouter cette promesse dans le texte principal (après le lead)
- Mettre "LNE 2026 / NF525" en gras pour l'impact

---

### 7. Hero

#### ⚠️ Note : Hero est un placeholder

**Ligne 319-344 :** Le Hero est un placeholder

**Recommandation :**
- Remplacer par le Hero actuel (figé selon la SPEC)
- Conserver la structure actuelle si elle correspond au Hero existant

---

## 📋 Checklist de conformité avec la SPEC

### Structure

- [x] 4 sections au total (Hero compris)
- [x] Hero (figé/placeholder)
- [x] Section Positionnement
- [x] Section Preuve
- [x] Section Conversation & CTA
- [x] Footer avec liens

### Contenu

- [x] Titre Positionnement conforme
- [~] Message clé Positionnement (présent mais à renforcer)
- [~] Promesse LNE 2026 / NF525 (présente mais à mettre en avant)
- [x] Message Preuve présent
- [x] Message Conversation & CTA présent
- [x] Message de transparence présent

### CTAs

- [~] CTA Positionnement (présent mais à déplacer)
- [x] CTA Preuve (correct)
- [x] 2 CTAs Conversation & CTA (corrects)

### Navigation

- [x] Ancres vers sections
- [x] Lien vers manifeste
- [~] Libellé "Démo / Projet" (à améliorer)

### CSS

- [x] Classes conformes
- [x] Responsive présent
- [x] Espacements cohérents

---

## 🔧 Corrections recommandées (par priorité)

### Priorité 1 : Structure Section Positionnement

**Action :**
1. Simplifier la structure (retirer les 2 cartes ou les rendre optionnelles)
2. Ajouter le message clé complet avec "valeur probante" en gras
3. Ajouter la promesse LNE 2026 / NF525 dans le texte principal
4. Déplacer le CTA "Voir la démo" en dehors des cartes, après le grid

**Code suggéré :**
```html
<section id="positionnement" class="dv-section dv-position">
  <div class="container">
    <header>
      <h2>L'ERP est votre matière première.<br>Nous la transformons en vérité.</h2>
      <p class="dv-lead">
        Vous avez déjà un ERP (Odoo, etc.). Il génère des événements en continu :
        factures, paiements, écritures.
      </p>
      <p>
        Mais rien ne garantit leur <strong>valeur probante</strong>.
      </p>
      <p>
        Dorevia-Vault transforme vos événements ERP
        en <strong>preuves financières exploitables</strong>,
        conformes <strong>LNE 2026 / NF525</strong>.
      </p>
    </header>

    <!-- Optionnel : garder les cartes pour illustration visuelle -->
    <div class="dv-grid">
      <!-- cartes existantes -->
    </div>

    <!-- CTA déplacé ici -->
    <div style="margin-top: 28px; text-align: center;">
      <a href="#demo" class="dv-btn dv-btn--secondary">Voir la démo</a>
    </div>
  </div>
</section>
```

---

### Priorité 2 : Message Preuve

**Action :**
1. Ajouter une classe `.proof-hook` pour le message "Je ne te demande pas de me croire..."
2. Style : plus grand, impactant

**Code suggéré :**
```html
<header>
  <h2>Voir plutôt que croire</h2>
  <p class="proof-hook" style="font-size: 20px; font-style: italic; color: var(--dv-text); margin: 16px 0 28px 0;">
    "Je ne te demande pas de me croire.<br>Je te montre."
  </p>
</header>
```

---

### Priorité 3 : Section Conversation & CTA

**Action :**
1. Mettre chaque question sur une ligne séparée
2. Structurer le message de transparence en 2 paragraphes

**Code suggéré :**
```html
<header>
  <h2>Prêt à passer aux chiffres prouvés ?</h2>
  <p class="dv-hook">
    Vous avez une douleur métier ?<br>
    Un contexte particulier ?<br>
    Un ERP spécifique ?
  </p>
</header>

<div class="dv-transparency">
  <p style="margin:0 0 8px 0;color:var(--dv-muted);">
    <strong>Je lis tous les messages.</strong><br>
    Je m'en sers pour affiner le produit.
  </p>
  <p style="margin:0;color:var(--dv-faint);">
    Ce n'est pas un formulaire générique : c'est une invitation à co-construire.
  </p>
</div>
```

---

### Priorité 4 : Navigation

**Action :**
1. Changer "Démo / Projet" en "Contact" ou "Démo & Contact"

**Code suggéré :**
```html
<a href="#conversation-cta">Contact</a>
```

---

## 🎨 Améliorations visuelles suggérées

### 1. Typographie

- Ajouter une hiérarchie plus marquée pour les messages clés
- Utiliser le gras pour "valeur probante", "LNE 2026 / NF525"
- Augmenter la taille du message "Je ne te demande pas de me croire..."

### 2. Espacements

- Vérifier que les espacements entre sections sont cohérents (88px OK)
- Ajouter plus d'espace après le message de transparence (avant les CTAs)

### 3. Couleurs

- ✅ OK : Palette cohérente avec fond sombre
- Suggestion : Utiliser une couleur d'accent pour les CTAs primaires (actuellement blanc)

---

## ✅ Points forts à conserver

1. **Design moderne et cohérent** : Fond sombre, gradients subtils, cartes transparentes
2. **Structure responsive** : Media queries bien implémentées
3. **Accessibilité** : aria-labels présents
4. **Section Preuve** : Structure visuelle claire avec grid
5. **Section Conversation & CTA** : Centré, message de transparence présent
6. **Footer** : Liens vers pages secondaires présents

---

## 📊 Score de conformité

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Structure (4 sections) | ✅ 100% | Parfait |
| Contenu Positionnement | ⚠️ 70% | Structure à simplifier, messages à renforcer |
| Contenu Preuve | ⚠️ 85% | Message principal à mettre en avant |
| Contenu Conversation & CTA | ⚠️ 80% | Questions à structurer, transparence à améliorer |
| CTAs | ⚠️ 90% | CTA Positionnement à déplacer |
| Navigation | ⚠️ 85% | Libellé à améliorer |
| CSS/Design | ✅ 95% | Très bon, quelques ajustements mineurs |
| Responsive | ✅ 100% | Parfait |

**Score global :** ⚠️ **87%** — Bonne base, quelques ajustements nécessaires

---

## 🎯 Conclusion

La maquette est **globalement conforme** à la spécification avec quelques ajustements à apporter :

1. ✅ **Structure** : 4 sections respectées
2. ⚠️ **Section Positionnement** : Simplifier et renforcer les messages clés
3. ⚠️ **Section Preuve** : Mettre en avant le message principal
4. ⚠️ **Section Conversation & CTA** : Structurer les questions et le message de transparence
5. ⚠️ **Navigation** : Améliorer le libellé

**Prochaine étape :** Appliquer les corrections de Priorité 1 et 2, puis réviser.

---

**Fin de la critique**
