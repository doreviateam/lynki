# SPEC — Module Odoo `dorevia_sale_reports` — Modèles d'impression commerciaux Dorevia (QWeb/PDF) v1.1

**Fichier** : `SPEC_Dorevia_Sale_Reports_Module_v1.1.md`  
**Date** : 2026-01-06  
**Cible** : Odoo 18 (CE/EE)  
**Scope** : Documents commerciaux *Sales* (Devis, Commande, Pro forma)  
**Statut** : Ready to implement / Ready to commit  
**Licence** : LGPL-3 (par défaut, cohérent addons Odoo)

---

## 1. Contexte

Dans certains environnements Odoo 18, les PDF des documents commerciaux présentent un rendu "étriqué" :
- bloc totaux en ~50% largeur
- grande zone blanche à droite
- lisibilité dégradée

Le diagnostic confirmé est un pattern **HTML-first** (Bootstrap grid) rendu **PDF-second** (wkhtmltopdf), notamment via l'usage de classes `col-6` / `ms-auto` appliquées en PDF.

Le rapport technique fourni par l'équipe Dorevia décrit l'historique des tentatives (héritage QWeb, CSS externe) et la solution retenue : **templates dédiés + styles inline**.

---

## 2. Objectifs

### 2.1 Objectif principal
Proposer des **modèles d'impression Dorevia** (distincts du standard) pour :
- Devis (Quotation)
- Commande (Sales Order)
- Facture Pro Forma (Pro Forma)

avec un rendu PDF fiable :
- totaux **pleine largeur** en PDF
- rendu HTML (preview) conservé autant que possible
- rollback simple (désinstallation)

### 2.2 Objectifs secondaires
- Doctriner une approche **maintenable** : pas de "patch core" agressif.
- Permettre le debug : comparaison **Standard vs Dorevia**.

---

## 3. Principes d'architecture (non négociables)

### 3.1 Ne pas remplacer le standard
Le module **n'a pas le droit** de supprimer, masquer ou remplacer automatiquement les reports standards Odoo.

✅ On **ajoute** des reports "Dorevia" dans le menu **Imprimer**.  
✅ Le standard reste disponible en fallback & comparaison.

**Raison** : éviter les conflits modules tiers, faciliter upgrades, conserver un point de référence.

### 3.2 PDF-first pour les zones sensibles
- En PDF : éviter de dépendre du responsive Bootstrap.
- Utiliser des *styles inline* ciblés, conditionnés sur `report_type != 'html'`.

### 3.3 Pas de dépendance "CSS externe" pour le PDF
Le module **ne doit pas** compter sur `static/src/css/*.css` appliqués via assets pour corriger le rendu PDF (wkhtmltopdf peut ne pas charger/appliquer correctement).
- ✅ Inline styles dans les templates
- ❌ `@media print` comme stratégie principale

---

## 4. Périmètre

### Inclus (v1.1)
- `sale.order` : Devis / Commande / Pro forma (reports dédiés)
- Template document Dorevia basé sur le standard `sale.report_saleorder_document` mais *forké* (nouveau template complet).

### Exclu (v1.1)
- Factures comptables `account.move` (à couvrir dans un module séparé : `dorevia_account_reports`, v1.0)
- Bons de livraison, avoirs, etc.

---

## 5. Structure du module

### 5.1 Arborescence
```
dorevia_sale_reports/
├── __init__.py
├── __manifest__.py
├── README.md
├── reports/
│   └── sale_reports.xml
└── views/
    └── sale_report_templates.xml
```

### 5.2 Nettoyage requis vs implémentation actuelle
Selon l'état actuel décrit dans le rapport :

- **À retirer** : `assets.web.assets_backend` + `static/src/css/report_pdf_fix.css` (ou laisser le fichier mais ne pas l'enregistrer)
- **À corriger** : wording "remplace automatiquement les rapports standards" → interdit

---

## 6. Manifest (`__manifest__.py`) — Spécification

### 6.1 Champs requis
- `depends`: `["sale", "web"]`
- `data`:
  - `reports/sale_reports.xml`
  - `views/sale_report_templates.xml`

### 6.2 Champs interdits / à éviter
- `assets.web.assets_backend` pour corriger du PDF
- Mention "remplace automatiquement les rapports standards"

### 6.3 Manifeste cible (proposé)
```python
# -*- coding: utf-8 -*-
{
    "name": "Dorevia Sale Reports",
    "version": "18.0.1.1.0",
    "category": "Sales/Reporting",
    "summary": "Modèles d'impression Dorevia (Devis, Commandes, Pro Forma) — PDF layout stable",
    "description": "Ajoute des rapports Dorevia (standard conservé) et stabilise le rendu PDF.",
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "depends": ["sale", "web"],
    "data": [
        "reports/sale_reports.xml",
        "views/sale_report_templates.xml",
    ],
    "installable": True,
    "application": False,
    "auto_install": False,
    "license": "LGPL-3",
}
```

---

## 7. Reports (`reports/sale_reports.xml`) — Spécification

### 7.1 Reports à créer
Trois `ir.actions.report` (binding type report sur `sale.order`) :

1. **Devis Dorevia**
   - report_name: `dorevia_sale_reports.report_quotation_dorevia`

2. **Commande Dorevia**
   - report_name: `dorevia_sale_reports.report_saleorder_dorevia`

3. **Pro Forma Dorevia**
   - report_name: `dorevia_sale_reports.report_proforma_dorevia`

### 7.2 Règles
- `binding_model_id`: `sale.model_sale_order`
- `binding_type`: `report`
- **Ne pas** désactiver les reports standards
- `print_report_name`: conseillé pour nommer le PDF

### 7.3 XML cible (exemple conforme)
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
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

---

## 8. Templates QWeb (`views/sale_report_templates.xml`) — Spécification

### 8.1 Templates "wrappers" (3 entrées)
Chaque report pointe sur un template wrapper dont le rôle est :
- initialiser le contexte (si besoin)
- appeler un template document commun Dorevia

Templates attendus :
- `dorevia_sale_reports.report_quotation_dorevia`
- `dorevia_sale_reports.report_saleorder_dorevia`
- `dorevia_sale_reports.report_proforma_dorevia`

### 8.2 Template document commun (fork du standard)
Template principal :
- `dorevia_sale_reports.report_saleorder_document_dorevia`

Ce template reprend l'ossature de `sale.report_saleorder_document` en version dédiée, mais corrige la section totaux pour le PDF.

### 8.3 Correction PDF — règle exacte
Dans la section totaux (similaire à `so_total_summary` / `#total`), appliquer :

- En PDF (`report_type != 'html'`) :
  - Structure simple sans Bootstrap
  - Styles inline forçant largeur `100%`, `max-width:100%`, marges/paddings neutralisés
- En HTML :
  - conserver `col-sm-7 col-md-6 ms-auto` (ou équivalent standard)

**Approche recommandée** : Séparation complète avec `t-if` / `t-else` pour PDF vs HTML.

### 8.4 CSS inline (optionnel)
Autorisé seulement si :
- limité à la zone totaux
- pas de dépendance externe
- si possible conditionné PDF-only

---

## 9. README — contenu minimal attendu

Le README doit expliquer :
- "Nous ajoutons des reports Dorevia, le standard reste disponible"
- "Pourquoi : wkhtmltopdf + bootstrap grid en PDF"
- Comment tester
- Comment rollback

---

## 10. Critères d'acceptation

### Fonctionnels
- Les boutons suivants apparaissent dans "Imprimer" sur `sale.order` :
  - Devis Dorevia
  - Commande Dorevia
  - Facture Pro Forma Dorevia
- Les reports standard Odoo restent disponibles

### Rendu
- En PDF : bloc totaux utilise toute la largeur (plus de "50% + blanc à droite")
- En HTML preview : rendu identique ou très proche du standard

### Maintenabilité
- Pas d'override agressif des reports standard
- Pas d'assets backend utilisés comme correctif PDF

---

## 11. Plan de tests

- **TC1** Devis Dorevia (PDF) : totaux pleine largeur
- **TC2** Commande Dorevia (PDF) : totaux pleine largeur
- **TC3** Pro Forma Dorevia (PDF) : totaux pleine largeur
- **TC4** Standard Odoo : toujours accessible, inchangé

---

## 12. Déploiement / Upgrade

- Copier module dans `custom-addons`
- Update Apps list
- Installer
- Upgrade (recommandé) :
```bash
odoo -d <db> -u dorevia_sale_reports --stop-after-init
```

Rollback : désinstaller le module.

---

## 13. Évolutions (v1.2+)

- `dorevia_account_reports` : modèles factures comptables `account.move` (PDF stable)
- "Charte print" Dorevia (mentions, conditions, baselines)
- Multi-clients : `dorevia_sale_reports_client_<slug>` (overlay léger)

---

**Fin de document**

