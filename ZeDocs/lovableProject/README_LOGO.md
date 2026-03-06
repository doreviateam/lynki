# Logo Lov'Arbitre

## 📍 Emplacement

Le logo doit être placé dans :
```
units/sylius/public/assets/images/lovarbitre-logo.png
```

## 📐 Spécifications

- **Format** : PNG (avec transparence si possible)
- **Taille recommandée** : 200x200px minimum (pour qualité)
- **Contenu** : Logo avec cartons jaune/rouge, cœur et main (selon la description dans le code)

## 🔗 Utilisation

Le logo est référencé dans :
- `units/sylius/templates/lovable/lovarbitre.html.twig` (header, hero, footer)
- Utilise `{{ asset('assets/images/lovarbitre-logo.png') }}` pour le chemin

## ⚠️ Note

Si le logo n'est pas encore disponible, vous pouvez :
1. Créer un placeholder temporaire
2. Utiliser un service comme placeholder.com pour tester
3. Le remplacer une fois le logo final disponible
