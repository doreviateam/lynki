# ✅ Corrections appliquées à la maquette

**Date :** 2026-01-22  
**Fichier :** `maquette_ref.html`

---

## ✅ Modifications appliquées avec succès

### 1. Navigation
- ✅ **Ligne 312** : Changé "Démo / Projet" → "Contact"

### 2. Section Positionnement
- ✅ **Lignes 358-361** : Ajout des messages clés complets
  - Message sur l'ERP et les événements
  - Message sur la "valeur probante" en gras
  - Message sur la promesse LNE 2026 / NF525 en gras
- ✅ **Ligne 364** : Ajout de `margin-top: 32px` au grid
- ✅ **Lignes 397-399** : CTA déplacé en dehors des cartes, centré après le grid

### 3. Section Conversation & CTA
- ✅ **Lignes 453-455** : Questions structurées sur des lignes séparées avec `<br>`

### 4. CSS
- ✅ **Lignes 211-217** : Ajout de la classe `.proof-hook` pour le message de preuve

---

## ⚠️ Modifications restantes à appliquer manuellement

### 1. Section Preuve - Message principal

**Ligne 408-410** : Remplacer :
```html
<p class="dv-lead">
  "Je ne te demande pas de me croire. Je te montre."
</p>
```

Par :
```html
<p class="proof-hook">
  "Je ne te demande pas de me croire.<br>Je te montre."
</p>
```

**Raison :** Utiliser la classe `proof-hook` pour mettre en avant le message principal avec le style défini (taille 20px, italique).

---

### 2. Section Conversation & CTA - Message de transparence

**Lignes 460-464** : Remplacer :
```html
<p style="margin:0;color:var(--dv-muted);">
  <strong>Je lis tous les messages.</strong><br/>
  Je m'en sers pour affiner le produit.<br/>
  <span style="color:var(--dv-faint);">Ce n'est pas un formulaire générique : c'est une invitation à co-construire.</span>
</p>
```

Par :
```html
<p style="margin:0 0 8px 0;color:var(--dv-muted);">
  <strong>Je lis tous les messages.</strong><br>
  Je m'en sers pour affiner le produit.
</p>
<p style="margin:0;color:var(--dv-faint);">
  Ce n'est pas un formulaire générique : c'est une invitation à co-construire.
</p>
```

**Raison :** Structurer le message de transparence en 2 paragraphes distincts pour plus de clarté.

---

## 📊 Résumé

**Modifications appliquées :** 5/7 (71%)  
**Modifications restantes :** 2/7 (29%)

Les modifications restantes sont mineures et peuvent être appliquées rapidement en éditant directement le fichier HTML.

---

**Fin du document**
