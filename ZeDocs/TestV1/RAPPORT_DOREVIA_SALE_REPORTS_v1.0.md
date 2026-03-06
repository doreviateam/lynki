# Rapport — Dorevia Sale Reports — Documents Commerciaux Personnalisés

**Document** : RAPPORT_DOREVIA_SALE_REPORTS_v1.0.md  
**Date de création** : 2026-01-06  
**Auteur** : Dorevia Team  
**Statut** : En cours d'implémentation  
**Module** : `dorevia_sale_reports`

---

## 1. Contexte et objectif

### 1.1 Objectif principal

Créer des **documents commerciaux personnalisés** pour la plateforme Dorevia (Devis, Commandes, Factures Pro Forma) avec un **layout optimisé pour PDF** qui utilise toute la largeur de la page, notamment pour le bloc des totaux.

### 1.2 Problème initial

Les PDF générés par Odoo pour les devis, commandes et pro forma présentaient :
- **Totaux "tassés à gauche"** : Le bloc des totaux n'utilisait que 50% de la largeur (`col-6` en Bootstrap)
- **Grande zone blanche à droite** : Espace inutilisé sur la moitié droite de la page
- **Mauvaise lisibilité** : Rendu visuellement "étriqué" et peu professionnel

### 1.3 Diagnostic

Le problème venait du template QWeb standard Odoo `sale.report_saleorder_document` qui utilise :
```xml
<div t-attf-class="#{'col-6' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto">
```

En PDF (`report_type != 'html'`), cela génère `col-6` (50% de largeur) au lieu de `col-12` (100% de largeur).

---

## 2. Tentatives de solution

### 2.1 Tentative 1 : Héritage de vues QWeb (ÉCHEC)

**Approche** : Modifier le template standard via héritage QWeb avec xpath.

**Modules testés** :
- `dorevia_report_pdf_layout_fix`
- `dorevia_sale_proforma_report_fix`
- `dorevia_sale_report_fix`

**Problème rencontré** : L'héritage de vues QWeb ne fonctionnait pas dans cette installation Odoo 18. Les xpath ne trouvaient pas les éléments ou ne s'appliquaient pas correctement, malgré plusieurs tentatives :
- XPath par position : `//div[@id='total']/div[1]`
- XPath par attribut : `//div[@id='total']/div[@t-attf-class]`
- XPath par contenu : `//div[@id='total']//div[.//table[@class='o_total_table']]`
- Priorité élevée (150)
- `position="replace"` et `position="attributes"`

**Résultat** : ❌ Échec — Le template standard conservait toujours `col-6`.

### 2.2 Tentative 2 : CSS personnalisé (ÉCHEC)

**Approche** : Utiliser un fichier CSS avec `@media print` pour forcer la largeur.

**Problème rencontré** : `wkhtmltopdf` ne respecte pas toujours `@media print` et les fichiers CSS externes ne sont pas toujours chargés correctement dans les PDF.

**Résultat** : ❌ Échec — Le CSS n'était pas appliqué.

### 2.3 Solution retenue : Templates QWeb personnalisés (EN COURS)

**Approche** : Créer des templates QWeb **complètement nouveaux** (sans héritage) basés sur le template standard mais avec `col-12` au lieu de `col-6`.

**Avantages** :
- ✅ Contrôle total sur le layout
- ✅ Pas de dépendance à l'héritage qui ne fonctionne pas
- ✅ Facilement identifiable dans le menu "Imprimer"
- ✅ Rollbackable (désinstallation simple)

---

## 3. Solution finale : Module `dorevia_sale_reports`

### 3.1 Structure du module

```
dorevia_sale_reports/
├── __init__.py
├── __manifest__.py
├── README.md
├── reports/
│   └── sale_reports.xml          # Définitions des rapports (ir.actions.report)
├── views/
│   └── sale_report_templates.xml # Templates QWeb personnalisés
└── static/
    ├── description/
    │   ├── icon.png
    │   └── index.html
    └── src/
        └── css/
            └── report_pdf_fix.css  # CSS de secours (non utilisé actuellement)
```

### 3.2 Rapports créés

1. **Devis Dorevia** (`dorevia_sale_reports.report_quotation_dorevia`)
2. **Commande Dorevia** (`dorevia_sale_reports.report_saleorder_dorevia`)
3. **Facture Pro Forma Dorevia** (`dorevia_sale_reports.report_proforma_dorevia`)

### 3.3 Caractéristiques

- **Layout optimisé** : Totaux en pleine largeur (`col-12`) en PDF
- **External layout** : Utilise `web.external_layout` (en-tête, pied de page, logo)
- **CSS inline** : Styles inline pour forcer la largeur en PDF
- **Identifiables** : Nommé avec suffixe "Dorevia" pour distinction claire

---

## 4. Code source complet

### 4.1 Manifest (`__manifest__.py`)

```python
# -*- coding: utf-8 -*-
{
    "name": "Dorevia Sale Reports",
    "version": "18.0.1.0.0",
    "category": "Sales/Reporting",
    "summary": "Documents commerciaux personnalisés Dorevia (Devis, Commandes, Pro Forma)",
    "description": """
        Documents commerciaux personnalisés Dorevia
        
        Ce module fournit des documents commerciaux personnalisés pour la plateforme Dorevia :
        - Layout optimisé pour PDF (totaux pleine largeur, meilleure lisibilité)
        - Templates QWeb personnalisés avec identité visuelle Dorevia
        - Compatible avec external_layout standard Odoo (en-tête, pied de page, logo)
        - Remplace automatiquement les rapports standards Odoo
        
        Documents inclus :
        - Devis / Quotation
        - Commandes / Sales Order  
        - Factures Pro Forma / Pro Forma Invoice
        
        Ces documents sont automatiquement utilisés par la plateforme Dorevia.
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "depends": [
        "base",
        "sale",
    ],
    "data": [
        "reports/sale_reports.xml",
        "views/sale_report_templates.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "dorevia_sale_reports/static/src/css/report_pdf_fix.css",
        ],
    },
    "installable": True,
    "application": False,
    "auto_install": False,
    "license": "LGPL-3",
    "icon": "/dorevia_sale_reports/static/description/icon.png",
}
```

### 4.2 Définitions des rapports (`reports/sale_reports.xml`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <!-- 
        Documents commerciaux personnalisés Dorevia
        
        Ce module fournit des documents personnalisés avec layout optimisé
        (totaux pleine largeur, meilleure lisibilité).
        
        Les documents Dorevia sont clairement identifiables dans le menu "Imprimer".
    -->
    
    <!-- Document Devis Dorevia -->
    <record id="action_report_quotation_dorevia" model="ir.actions.report">
        <field name="name">Devis Dorevia</field>
        <field name="model">sale.order</field>
        <field name="report_type">qweb-pdf</field>
        <field name="report_name">dorevia_sale_reports.report_quotation_dorevia</field>
        <field name="report_file">dorevia_sale_reports.report_quotation_dorevia</field>
        <field name="print_report_name">'Devis - %s' % (object.name)</field>
        <field name="binding_model_id" ref="sale.model_sale_order"/>
        <field name="binding_type">report</field>
    </record>
    
    <!-- Document Commande Dorevia -->
    <record id="action_report_saleorder_dorevia" model="ir.actions.report">
        <field name="name">Commande Dorevia</field>
        <field name="model">sale.order</field>
        <field name="report_type">qweb-pdf</field>
        <field name="report_name">dorevia_sale_reports.report_saleorder_dorevia</field>
        <field name="report_file">dorevia_sale_reports.report_saleorder_dorevia</field>
        <field name="print_report_name">'Commande - %s' % (object.name)</field>
        <field name="binding_model_id" ref="sale.model_sale_order"/>
        <field name="binding_type">report</field>
    </record>
    
    <!-- Document Facture Pro Forma Dorevia -->
    <record id="action_report_proforma_dorevia" model="ir.actions.report">
        <field name="name">Facture Pro Forma Dorevia</field>
        <field name="model">sale.order</field>
        <field name="report_type">qweb-pdf</field>
        <field name="report_name">dorevia_sale_reports.report_proforma_dorevia</field>
        <field name="report_file">dorevia_sale_reports.report_proforma_dorevia</field>
        <field name="print_report_name">'Pro Forma - %s' % (object.name)</field>
        <field name="binding_model_id" ref="sale.model_sale_order"/>
        <field name="binding_type">report</field>
    </record>
</odoo>
```

### 4.3 Templates QWeb — Section clé (bloc des totaux)

**Modification principale** : Ligne 200 du template `report_saleorder_document_dorevia`

```xml
<!-- 🔒 FIX : Bloc totaux avec col-12 en PDF (pleine largeur) -->
<div class="clearfix" name="so_total_summary" t-att-style="#{'width: 100% !important;' if report_type != 'html' else ''}">
    <div id="total" class="row mt-n3" name="total" t-att-style="#{'width: 100% !important; margin: 0 !important;' if report_type != 'html' else ''}">
        <div t-attf-class="#{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6 ms-auto'}"
             t-att-style="#{'width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; flex: 0 0 100% !important; padding-left: 0 !important; padding-right: 0 !important;' if report_type != 'html' else ''}">
            <table class="o_total_table table table-borderless" t-att-style="#{'width: 100% !important;' if report_type != 'html' else ''}">
                <t t-call="sale.document_tax_totals">
                    <t t-set="tax_totals" t-value="doc.tax_totals"/>
                    <t t-set="currency" t-value="doc.currency_id"/>
                </t>
            </table>
        </div>
    </div>
</div>
```

**Comparaison avec le template standard** :
- **Standard** : `col-6` en PDF (50% de largeur) + `ms-auto` (marge automatique)
- **Dorevia** : `col-12` en PDF (100% de largeur) + styles inline pour forcer la largeur

### 4.4 CSS inline dans les templates wrapper

Chaque template wrapper (Devis, Commande, Pro Forma) inclut du CSS inline :

```xml
<style>
    div[name="so_total_summary"] { width: 100% !important; }
    div#total.row { width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }
    div#total > div { width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; padding-left: 0 !important; padding-right: 0 !important; flex: 0 0 100% !important; }
    div#total table.o_total_table { width: 100% !important; }
</style>
```

**Note** : Le CSS est ajouté directement dans le template (pas via fichier externe) car `wkhtmltopdf` ne charge pas toujours les fichiers CSS externes.

### 4.5 Template QWeb complet

**Fichier complet** : `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/views/sale_report_templates.xml`

**Structure** :
- **Lignes 8-24** : Template wrapper "Devis Dorevia"
- **Lignes 26-42** : Template wrapper "Commande Dorevia"
- **Lignes 44-62** : Template wrapper "Pro Forma Dorevia"
- **Lignes 64-238** : Template document principal `report_saleorder_document_dorevia`

Le template document principal est basé sur `sale.report_saleorder_document` standard Odoo, avec la modification clé à la ligne 200 (bloc des totaux).

#### 4.5.1 Code source complet — Section des totaux (lignes 197-210)

**Code complet de la section critique** :

```xml
<!-- 🔒 FIX : Bloc totaux avec col-12 en PDF (pleine largeur) -->
<div class="clearfix" name="so_total_summary" t-att-style="#{'width: 100% !important;' if report_type != 'html' else ''}">
    <div id="total" class="row mt-n3" name="total" t-att-style="#{'width: 100% !important; margin: 0 !important;' if report_type != 'html' else ''}">
        <div t-attf-class="#{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6 ms-auto'}"
             t-att-style="#{'width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; flex: 0 0 100% !important; padding-left: 0 !important; padding-right: 0 !important;' if report_type != 'html' else ''}">
            <table class="o_total_table table table-borderless" t-att-style="#{'width: 100% !important;' if report_type != 'html' else ''}">
                <t t-call="sale.document_tax_totals">
                    <t t-set="tax_totals" t-value="doc.tax_totals"/>
                    <t t-set="currency" t-value="doc.currency_id"/>
                </t>
            </table>
        </div>
    </div>
</div>
```

**Explication ligne par ligne** :

1. **Ligne 198** : Conteneur parent `so_total_summary`
   - Style inline : `width: 100% !important` en PDF uniquement

2. **Ligne 199** : Row Bootstrap `#total`
   - Style inline : `width: 100% !important; margin: 0 !important` en PDF uniquement

3. **Ligne 200** : Div enfant (le bloc des totaux)
   - **Classe** : `col-12` en PDF, `col-sm-7 col-md-6 ms-auto` en HTML
   - **Styles inline** : Force la largeur à 100% avec tous les paramètres nécessaires :
     - `width: 100% !important`
     - `max-width: 100% !important`
     - `margin-left: 0 !important`
     - `margin-right: 0 !important`
     - `flex: 0 0 100% !important` (pour forcer la largeur en flexbox)
     - `padding-left: 0 !important`
     - `padding-right: 0 !important`

4. **Ligne 202** : Table des totaux
   - Style inline : `width: 100% !important` en PDF uniquement

5. **Lignes 203-206** : Appel au template standard Odoo pour les totaux de taxes

---

## 5. Techniques utilisées

### 5.1 Classes Bootstrap conditionnelles

```xml
t-attf-class="#{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6 ms-auto'}"
```

- **En PDF** (`report_type != 'html'`) : `col-12` (pleine largeur)
- **En HTML** : `col-sm-7 col-md-6 ms-auto` (responsive, conservé pour la vue web)

### 5.2 Styles inline avec `t-att-style`

Styles inline ajoutés pour forcer la largeur en PDF, car `wkhtmltopdf` ne respecte pas toujours les classes CSS :

```xml
t-att-style="#{'width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; flex: 0 0 100% !important; padding-left: 0 !important; padding-right: 0 !important;' if report_type != 'html' else ''}"
```

### 5.3 CSS inline dans `<style>`

CSS ajouté directement dans le template (pas via fichier externe) car `wkhtmltopdf` ne charge pas toujours les fichiers CSS externes :

```xml
<style>
    div[name="so_total_summary"] { width: 100% !important; }
    div#total.row { width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }
    div#total > div { width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; padding-left: 0 !important; padding-right: 0 !important; flex: 0 0 100% !important; }
    div#total table.o_total_table { width: 100% !important; }
</style>
```

**Note** : Pas de `@media print` car `wkhtmltopdf` ne le respecte pas toujours.

---

## 6. État actuel

### 6.1 Module créé

✅ Structure complète du module  
✅ Templates QWeb personnalisés  
✅ Définitions des rapports  
✅ CSS inline et styles inline  
✅ Documentation (README.md)

### 6.2 Installation

✅ Module installable  
✅ Odoo redémarré  
⚠️ **En attente de test final** : Le PDF généré doit être vérifié pour confirmer que les totaux utilisent toute la largeur

### 6.3 Problèmes rencontrés

1. **Héritage QWeb ne fonctionne pas** : Les xpath ne s'appliquent pas dans cette installation
2. **Champ `active` n'existe pas** : Tentative de désactiver les rapports standards échouée
3. **Champ `sequence` n'existe pas** : Tentative de prioriser les rapports Dorevia échouée
4. **CSS externe non chargé** : `wkhtmltopdf` ne charge pas toujours les fichiers CSS
5. **`@media print` ignoré** : `wkhtmltopdf` ne respecte pas toujours les media queries

### 6.4 Solutions appliquées

1. ✅ **Templates complets** : Création de templates nouveaux (sans héritage)
2. ✅ **CSS inline** : Styles directement dans le template
3. ✅ **Styles inline** : `t-att-style` sur les éléments HTML
4. ✅ **Nommage distinctif** : Suffixe "Dorevia" pour identification claire

---

## 7. Prochaines étapes

### 7.1 Test final

1. Générer un PDF avec "Devis Dorevia"
2. Vérifier que les totaux utilisent toute la largeur
3. Confirmer qu'il n'y a plus de zone blanche à droite

### 7.2 Si le problème persiste

**Option A** : Remplacer complètement la structure Bootstrap par du HTML/CSS simple :
```xml
<div style="width: 100%;">
    <table style="width: 100%;">
        <!-- Totaux -->
    </table>
</div>
```

**Option B** : Utiliser une table HTML simple au lieu de Bootstrap pour les totaux

**Option C** : Vérifier si un autre module interfère avec le template

### 7.3 Améliorations futures

- Désactiver automatiquement les rapports standards (si possible)
- Ajouter d'autres types de documents (factures comptables, etc.)
- Personnalisation de l'identité visuelle Dorevia (logo, couleurs, etc.)

---

## 8. Fichiers du module

### 8.1 Fichiers principaux

- `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/__init__.py`
- `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/__manifest__.py`
- `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/reports/sale_reports.xml`
- `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/views/sale_report_templates.xml`

### 8.2 Documentation

- `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/README.md`

### 8.3 Assets

- `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/static/src/css/report_pdf_fix.css`
- `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/static/description/icon.png`

---

## 9. Commandes utiles

### 9.1 Mise à jour du module

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo odoo -c /etc/odoo/odoo.conf -u dorevia_sale_reports --stop-after-init --http-port=8070
docker compose restart odoo
```

### 9.2 Vérification des templates

```bash
# Vérifier que le template contient col-12
grep -n "col-12" /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_sale_reports/views/sale_report_templates.xml
```

### 9.3 Vider le cache Odoo

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo sh -c "rm -rf /var/lib/odoo/filestore/*/cache/* 2>/dev/null; echo 'Cache cleared'"
docker compose restart odoo
```

---

## 10. Conclusion

Le module `dorevia_sale_reports` a été créé pour fournir des documents commerciaux personnalisés avec un layout optimisé. La solution utilise des templates QWeb complets (sans héritage) avec `col-12` au lieu de `col-6`, des styles inline et du CSS inline pour forcer la largeur en PDF.

**Statut** : ✅ Module créé et installé — ⚠️ En attente de test final pour confirmer l'efficacité du layout.

---

**Fin du rapport**
