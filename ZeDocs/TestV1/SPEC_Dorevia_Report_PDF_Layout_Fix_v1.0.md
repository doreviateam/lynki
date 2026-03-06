# SPEC — Dorevia Report PDF Layout Fix v1.0

**Document** : SPEC_Dorevia_Report_PDF_Layout_Fix_v1.0.md  
**Date de création** : 2026-01-05  
**Auteur** : Dorevia Team  
**Cible** : Odoo 18.0 (wkhtmltopdf 0.12.6.1 patched qt)  
**Statut** : Ready to implement  
**Priorité** : P0 (qualité impression / livrable client)  

---

## 1. Contexte

Sur plusieurs éditions PDF Odoo (Devis, Pro Forma, Facture), le rendu apparaît :

- contenu "tassé" à gauche
- grande zone blanche à droite
- sections "totaux" étroites (~50% de la page)

Le problème est reproductible sur différents documents et n'est **pas** spécifique à un seul rapport.

---

## 2. Diagnostic (prouvé)

### 2.1 Ce n'est pas `external_layout`
Les templates documents standards incluent déjà `web.external_layout` (ex : `sale.report_saleorder_document`).

👉 Le problème n'est donc pas l'absence de layout.

### 2.2 Cause racine : classes Bootstrap utilisées en PDF
Dans les templates, la zone des totaux est rendue avec des classes Bootstrap prévues pour HTML responsive, par exemple :

```xml
<div t-attf-class="#{'col-6' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto">
```

- En PDF (`report_type != 'html'`) → `col-6`
- `col-6` limite la largeur à ~50%
- `ms-auto` accentue l'effet d'alignement et laisse un grand blanc

👉 Pattern identique observé sur :
- **Devis** (`sale.report_saleorder_document`)
- **Pro forma** (`sale.report_saleorder_document` appelé via pro forma)
- **Facture** (`account.report_invoice_document`)

---

## 3. Objectif

Corriger la mise en page **PDF uniquement**, de façon **transversale** et **maintenable** :

- élargir la zone des totaux (et blocs associés) en PDF
- ne pas impacter la vue HTML (preview / email / web)
- corriger au minimum :
  - Devis / Commande (Sale)
  - Facture (Account)
  - Pro forma (Sale)

---

## 4. Stratégie

Créer un module unique **transversal** :

**Nom module** : `dorevia_report_pdf_layout_fix`

Principe :
- Hériter des templates documents
- Modifier uniquement les classes appliquées **en PDF**
- Garder le rendu HTML inchangé

---

## 5. Périmètre

### 5.1 Inclus
- Fix PDF "totaux pleine largeur" sur :
  - `sale.report_saleorder_document` (Devis, Commandes, Pro Forma)
  - `account.report_invoice_document` (Factures)

### 5.2 Exclu
- Refonte complète du design
- CSS global lourd
- Paperformat / marges (sauf si requis plus tard)
- Autres rapports (bon de livraison, etc.) — possible extension en v1.1

---

## 6. Spécification technique

### 6.1 Arborescence module
```
dorevia_report_pdf_layout_fix/
├── __init__.py
├── __manifest__.py
├── README.md
├── CRITERE_VERITE.md
└── views/
    ├── sale_report_templates.xml
    └── account_report_templates.xml
```

### 6.2 Manifeste
```python
# -*- coding: utf-8 -*-
{
    "name": "Dorevia Report PDF Layout Fix",
    "version": "18.0.1.0.0",
    "category": "Reporting",
    "summary": "Fix mise en page PDF (Bootstrap col-*) pour Sale/Account",
    "description": """
        Module transversal pour corriger la mise en page PDF des rapports Odoo.
        
        Problème corrigé :
        - Les PDF de devis, commandes, pro forma et factures ont des totaux étroits (col-6 = 50%)
        - Grande zone blanche à droite
        - Contenu tassé à gauche
        
        Solution :
        - Modification des classes Bootstrap en PDF uniquement
        - col-6 → col-12 en PDF (pleine largeur)
        - HTML inchangé (col-sm-7 col-md-6 conservé)
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "depends": ["sale", "account"],
    "data": [
        "views/sale_report_templates.xml",
        "views/account_report_templates.xml",
    ],
    "installable": True,
    "application": False,
    "auto_install": False,
    "license": "LGPL-3",
}
```

---

## 7. Patch QWeb — Sale (Devis / Pro Forma)

### 7.1 Cible
Template : `sale.report_saleorder_document`  
Zone : `div[@name='total']` → enfant `div` avec `t-attf-class`

### 7.2 Règle
- En PDF : `col-12 ms-auto`
- En HTML : conserver `col-sm-7 col-md-6 ms-auto`

### 7.3 Implémentation
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
  <template id="sale_report_totals_pdf_fullwidth"
            inherit_id="sale.report_saleorder_document"
            priority="99">
    <xpath expr="//div[@name='total']/div[@t-attf-class]" position="attributes">
      <attribute name="t-attf-class">
        #{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto
      </attribute>
    </xpath>
  </template>
</odoo>
```

---

## 8. Patch QWeb — Account (Factures)

### 8.1 Cible
Template : `account.report_invoice_document`  
Zone : bloc des totaux (pattern similaire `row` + `col-6 ms-auto`)

### 8.2 Implémentation
> Remarque : l'xpath exact dépend de la structure du template, mais l'intention est identique : cibler le `div` de totaux portant `t-attf-class` ou `class` avec `col-6` en PDF et le passer en `col-12` en PDF.

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
  <template id="account_report_totals_pdf_fullwidth"
            inherit_id="account.report_invoice_document"
            priority="99">
    <!-- Cibler le div des totaux par son attribut t-attf-class -->
    <xpath expr="//div[@name='total']/div[@t-attf-class]" position="attributes">
      <attribute name="t-attf-class">
        #{'col-12' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto
      </attribute>
    </xpath>
  </template>
</odoo>
```

✅ Après implémentation, valider l'xpath sur la base réelle (commande psql / inspection arch).

---

## 9. Critères d'acceptation

Le correctif est accepté si :

- ✅ Devis PDF : table + totaux ne sont plus "étriqués"
- ✅ Pro forma PDF : idem
- ✅ Facture PDF : idem
- ✅ Vue HTML : **inchangée**
- ✅ Aucune régression multi-pages (sauts de page corrects)

---

## 10. Plan de tests

### TC1 — Devis (PDF)
- Créer un devis avec lignes + taxes
- Export PDF
- Vérifier largeur, lisibilité, totaux

### TC2 — Pro forma (PDF)
- Générer pro forma depuis devis/commande
- Export PDF
- Vérifier identique

### TC3 — Facture (PDF)
- Créer facture client avec taxes
- Export PDF
- Vérifier largeur, totaux

### TC4 — HTML Preview
- Ouvrir aperçu HTML
- Vérifier rendu identique (col-sm-7 col-md-6 conservé)

### TC5 — Non-régression
- Vérifier que les autres rapports ne sont pas affectés
- Vérifier que les vues HTML restent inchangées

---

## 11. Déploiement

1. **Copier le module** dans `/opt/dorevia-plateform/units/odoo/custom-addons/`
2. **Redémarrer Odoo** :
   ```bash
   cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
   docker compose restart odoo
   ```
3. **Mettre à jour la liste des apps** dans Odoo
4. **Installer le module** :
   - Apps → Rechercher "Dorevia Report PDF Layout Fix"
   - Cliquer sur "Installer"

**Upgrade CLI (optionnel mais recommandé en CI)** :
```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo odoo -c /etc/odoo/odoo.conf -u dorevia_report_pdf_layout_fix --stop-after-init
docker compose restart odoo
```

---

## 12. Rollback

- **Désinstaller** `dorevia_report_pdf_layout_fix`
- **Redémarrer Odoo**
- **Régénérer les PDFs**

---

## 13. Notes / Extensions (v1.1)

- Étendre aux bons de livraison / autres rapports
- Introduire une "classe utilitaire PDF" (CSS dédiée report) si besoin
- Harmoniser avec Paperformat si un client exige des marges spécifiques

---

## 14. Relation avec les autres modules

### Module `dorevia_sale_proforma_report_fix`
- **Statut** : Peut être remplacé par ce module transversal
- **Action recommandée** : Désinstaller `dorevia_sale_proforma_report_fix` après installation de `dorevia_report_pdf_layout_fix`
- **Raison** : Ce module corrige le même problème de manière plus complète et transversale

---

**Fin de document**

