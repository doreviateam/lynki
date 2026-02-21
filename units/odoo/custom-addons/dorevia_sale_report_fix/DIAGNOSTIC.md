# 🔍 Diagnostic : Identifier le rapport utilisé

## Méthode 1 : Via l'interface Odoo (Recommandé)

1. **Ouvrir un devis/commande** dans Odoo
2. **Cliquer sur "Imprimer"** (bouton en haut)
3. **Noter le nom exact** du rapport sélectionné dans le menu déroulant :
   - "Quotation / Order" → `sale.report_saleorder` ✅ (standard, avec external_layout)
   - "Devis en PDF" → peut être un rapport personnalisé
   - Autre nom → identifier le rapport exact

4. **Vérifier dans Paramètres → Technique → Rapports** :
   - Rechercher le nom du rapport
   - Noter le **Nom technique** (ex: `sale.report_saleorder`)
   - Cliquer sur **Vue QWeb** pour voir le template

## Méthode 2 : Via la base de données (si accessible)

```sql
SELECT 
    r.id,
    r.name,
    r.report_name,
    r.report_file,
    r.report_type,
    r.binding_type
FROM ir_actions_report r
WHERE r.model = 'sale.order'
ORDER BY r.name;
```

## Méthode 3 : Via le script Python (si configuré)

```bash
cd /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_report_fix/scripts
python3 diagnostic_rapport.py
```

> ⚠️ **Note** : Le script nécessite d'être configuré avec les bonnes credentials Odoo.

## Résultats attendus

### Rapport standard (avec external_layout) ✅
- **Nom** : "Quotation / Order"
- **Nom technique** : `sale.report_saleorder`
- **Template** : `sale.report_saleorder`
- **Contient** : `<t t-call="web.external_layout">`

### Rapport raw (sans external_layout) ❌
- **Nom** : "Devis en PDF" ou similaire
- **Nom technique** : `sale.report_saleorder_raw` ou personnalisé
- **Template** : peut ne pas utiliser `external_layout`

## Action selon le résultat

### Si le rapport standard est utilisé mais le layout n'apparaît pas

1. **Vérifier les modules installés** qui pourraient surcharger le template
2. **Vérifier le logo de la société** (Paramètres → Sociétés → Logo)
3. **Vérifier les paramètres système** (`web.base.url`)
4. **Installer le module `dorevia_sale_report_fix`** pour forcer le layout

### Si un rapport alternatif est utilisé

1. **Changer le rapport par défaut** dans Paramètres → Technique → Rapports
2. **Ou créer un héritage** pour ce rapport spécifique


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

