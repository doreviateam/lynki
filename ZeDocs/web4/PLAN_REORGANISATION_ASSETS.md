# 📦 Plan de Réorganisation des Assets

**Date** : 2026-01-19  
**Objectif** : Structurer les assets CSS/JS de manière cohérente  
**Statut** : Planification (à implémenter si nécessaire)

---

## 🎯 Objectif

Réorganiser les assets pour une structure claire et maintenable :
- Séparation vendor / base / components / sections
- Chargement optimisé
- Maintenance facilitée

---

## 📁 Structure proposée

### CSS
```
public/assets/css/
├── vendor/              # Frameworks externes
│   ├── bootstrap.min.css
│   ├── animate.css
│   └── lineicons.css
├── base/                # Styles globaux
│   └── ud-styles.css
├── components/          # Composants réutilisables
│   ├── whatsapp-button.css
│   └── status-cards.css
└── sections/           # Styles spécifiques par section
    ├── hero.css
    └── section-comment.css
```

### JS
```
public/assets/js/
├── vendor/              # Frameworks externes
│   ├── bootstrap.bundle.min.js
│   └── wow.min.js
├── core/                # Fonctions globales
│   └── main.js
├── components/          # Composants réutilisables
│   ├── whatsapp-button.js
│   ├── header-auto-hide.js
│   └── status-cards.js
└── sections/           # Scripts spécifiques par section
    ├── hero.js
    └── hero-analytics.js
```

---

## ⚠️ Impact de la réorganisation

### Avantages
- ✅ Structure claire et logique
- ✅ Maintenance facilitée
- ✅ Chargement optimisé possible

### Inconvénients
- ⚠️ Nécessite mise à jour de tous les `asset()` dans templates
- ⚠️ Risque de casser les liens si mal fait
- ⚠️ Nécessite tests complets

---

## 🔄 Alternative : Organisation logique sans déplacement

**Solution actuelle** : Organisation logique dans `layout.html.twig` et `home/index.html.twig` avec commentaires

**Avantages** :
- ✅ Pas de risque de casser les liens
- ✅ Structure claire via commentaires
- ✅ Facile à maintenir

**Décision** : **Garder structure actuelle** avec commentaires organisationnels

---

## 📝 Convention de nommage actuelle

### CSS
- `vendor-*.css` : Frameworks externes
- `*-styles.css` : Styles globaux
- `*-button.css`, `*-cards.css` : Composants
- `hero.css`, `section-*.css` : Sections

### JS
- `*.bundle.min.js` : Frameworks externes
- `main.js` : Core
- `*-button.js`, `*-cards.js`, `*-hide.js` : Composants
- `hero*.js` : Sections

---

## ✅ Conclusion

**Recommandation** : **Ne pas réorganiser physiquement** les fichiers pour l'instant.

**Raisons** :
1. Structure actuelle fonctionne
2. Commentaires organisationnels ajoutés dans templates
3. Risque de casser les liens
4. Gain limité vs effort

**Action** : Maintenir organisation logique via commentaires dans templates.

---

**Fin du document**
