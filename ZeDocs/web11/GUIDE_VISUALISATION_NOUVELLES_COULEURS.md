# Guide de visualisation des nouvelles couleurs — Blog Dorevia-Vault

## 🎨 Changements appliqués

### 1. **Fond de page**
- **Avant** : Blanc pur (`#ffffff`)
- **Après** : `#F8F8F9` (gris très clair, presque blanc)
- **Où voir** : Fond général de la page blog

### 2. **Texte principal**
- **Avant** : `#0f172a` (noir très foncé)
- **Après** : `#1A2B4C` (bleu marine foncé)
- **Où voir** : Tous les titres et textes principaux

### 3. **Badges de catégories (couleurs pastel)**
- **Conformité & réglementation** : `#BFCDEB` (lavande)
- **ERP & Odoo CE** : `#A7E2D8` (teal/mint)
- **Trésorerie & pilotage** : `#FDEAA8` (jaune doux)
- **Preuve & audit** : `#FDD2D5` (rose/peach)
- **Architecture & sécurité** : `#BFCDEB` (lavande)

### 4. **Cards d'articles**
- Fond blanc pur sur fond `#F8F8F9` pour créer de la profondeur

---

## 🔍 Comment vérifier que les changements sont appliqués

### Méthode 1 : Vider le cache du navigateur
1. **Chrome/Edge** : `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
2. **Firefox** : `Ctrl + F5` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
3. **Safari** : `Cmd + Option + E` puis recharger

### Méthode 2 : Navigation privée
Ouvrir la page en navigation privée/incognito pour voir les changements sans cache

### Méthode 3 : Vérifier dans les DevTools
1. Ouvrir les DevTools (F12)
2. Onglet "Network"
3. Cocher "Disable cache"
4. Recharger la page (F5)

---

## ✅ Éléments à vérifier

1. **Fond de page** : Doit être `#F8F8F9` (gris très clair) au lieu de blanc pur
2. **Texte** : Doit être `#1A2B4C` (bleu marine) au lieu de noir
3. **Badges catégories** : Doivent avoir les couleurs pastel selon la catégorie
4. **Cards** : Fond blanc pur qui ressort sur le fond `#F8F8F9`

---

## 🐛 Si les changements ne sont toujours pas visibles

1. Vérifier l'URL : Être sur `/blog` (pas sur une autre page)
2. Vérifier la console (F12) : Pas d'erreurs CSS
3. Vérifier le CSS chargé : Dans DevTools > Network, vérifier que `blog-v2.css?v=20260125-1700` est chargé
4. Forcer le rechargement : `Ctrl + Shift + Delete` > Vider le cache > Recharger

---

## 📝 Fichiers modifiés

- `/opt/dorevia-plateform/units/sylius/public/assets/css/blog-v2.css` : Variables CSS mises à jour
- `/opt/dorevia-plateform/units/sylius/templates/blog/index.html.twig` : Badges de catégories avec couleurs pastel
- `/opt/dorevia-plateform/units/sylius/templates/blog/show.html.twig` : Badges de catégories avec couleurs pastel

Les changements sont bien présents dans les fichiers. Le problème vient probablement du cache du navigateur.
