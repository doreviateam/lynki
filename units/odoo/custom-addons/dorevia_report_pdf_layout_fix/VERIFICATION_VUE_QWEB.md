# 🔍 Vérification de la vue QWeb

## Étapes pour vérifier que la modification est appliquée

### 1. Activer le mode développeur
- **Paramètres** → **Activer le mode développeur**

### 2. Ouvrir la vue QWeb
- **Paramètres** → **Technique** → **Interface utilisateur** → **Vues QWeb**
- **Rechercher** : `sale.report_saleorder_document`
- **Ouvrir la vue**

### 3. Chercher la modification
- **Chercher** (`Ctrl+F`) : `col-12`
- **Vérifier** : La ligne doit contenir `col-12` pour les PDF

### 4. Résultat attendu
La ligne doit ressembler à :
```xml
<div t-attf-class="#{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto">
```

### 5. Si col-12 n'est pas présent
- Chercher `col-6` : Si trouvé, la modification n'est pas appliquée
- Vérifier les modules qui héritent cette vue avec une priorité ≥ 99

## Informations à fournir

1. **La vue contient-elle `col-12` ?** (Oui/Non)
2. **La vue contient-elle `col-6` ?** (Oui/Non)
3. **Quelle est la ligne exacte** pour le bloc des totaux ?

