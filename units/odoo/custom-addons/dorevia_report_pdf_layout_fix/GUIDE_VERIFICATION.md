# 📋 Guide de vérification - Vue QWeb

## Étapes à suivre (d'après votre capture d'écran)

### 1. Ouvrir la vue `sale.report_saleorder_document`
- Dans la liste des vues, **cliquez sur** `report_saleorder_document` (première ligne)
- Ou **double-cliquez** sur la ligne

### 2. Vérifier la modification
- Une fois la vue ouverte, **chercher** (`Ctrl+F`) : `col-12`
- **Vérifier** : La ligne doit contenir `col-12` pour les PDF

### 3. Résultat attendu
La ligne doit ressembler à :
```xml
<div t-attf-class="#{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto">
```

### 4. Si col-12 n'est pas présent
- Chercher `col-6` : Si trouvé, la modification n'est pas appliquée
- Vérifier que le module `dorevia_report_pdf_layout_fix` est bien installé
- Vérifier les vues héritées (comme `sale_management.report_saleorder_document_inherit_sale...`)

## Informations à me fournir

1. **La vue contient-elle `col-12` ?** (Oui/Non)
2. **La vue contient-elle `col-6` ?** (Oui/Non)
3. **Quelle est la ligne exacte** pour le bloc des totaux (chercher `name="total"`) ?

