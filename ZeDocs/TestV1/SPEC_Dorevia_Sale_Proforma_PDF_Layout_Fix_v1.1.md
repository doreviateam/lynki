# SPEC — Dorevia Sale Proforma PDF Layout Fix v1.1

**Document** : SPEC_Dorevia_Sale_Proforma_PDF_Layout_Fix_v1.1.md  
**Date de création** : 2026-01-05  
**Auteur** : Dorevia Team  
**Cible** : Odoo 18.0 (Docker)  
**Rapport concerné** : `sale.report_saleorder_pro_forma` / `sale.report_saleorder_document`  
**Statut** : Validé terrain  
**Priorité** : P0 (qualité impression / client)

---

## 1. Contexte

Lors de la génération des **factures pro forma PDF** dans Odoo, le rendu apparaît :

- tassé à gauche  
- avec une large zone blanche à droite  
- malgré la présence de `web.external_layout`

Ce problème a déjà été observé sur des projets antérieurs (ex. BDS).

---

## 2. Diagnostic réel (prouvé)

### 2.1 External layout
Le template `sale.report_saleorder_document` **utilise déjà** :

```xml
<t t-call="web.external_layout">
```

👉 Le problème **ne vient donc pas** d'un layout manquant.

---

### 2.2 Cause racine identifiée
Dans le template standard Odoo :

```xml
<div t-attf-class="#{'col-6' if report_type != 'html' else 'col-sm-7 col-md-6'} ms-auto">
```

- En PDF (`report_type != 'html'`) → `col-6`
- Le bloc des **totaux** occupe seulement **50 % de la largeur**
- Résultat : impression visuellement "étriquée" à gauche

---

## 3. Objectif

Corriger la **largeur du bloc des totaux** en PDF pour les **factures pro forma**, sans impacter :

- les devis
- les commandes
- les vues HTML

---

## 4. Principe de correction

- La pro forma définit déjà `is_pro_forma = True`
- On exploite ce flag pour corriger **uniquement ce contexte**
- Le bloc passe de `col-6` à `col-12` en PDF **uniquement pour les pro forma**

---

## 5. Périmètre

### 5.1 Inclus
- Surcharge QWeb ciblée
- Module dédié, rollbackable

### 5.2 Exclus
- Modification globale du layout Odoo
- CSS global
- Autres rapports (devis / facture comptable)

---

## 6. Spécification technique

### 6.1 Nom du module
`dorevia_sale_proforma_report_fix`

### 6.2 Dépendances
- `sale`

### 6.3 Fichiers
```
dorevia_sale_proforma_report_fix/
├── __init__.py
├── __manifest__.py
├── README.md
├── CRITERE_VERITE.md
└── views/
    └── sale_proforma_report_templates.xml
```

---

## 7. Surcharge QWeb (FIX RÉEL)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

    <!-- Fix PDF Pro Forma : bloc totaux trop étroit (col-6) -->
    <template id="sale_report_saleorder_document_proforma_totals_fullwidth"
              inherit_id="sale.report_saleorder_document"
              priority="99">

        <xpath expr="//div[@name='total']/div[@t-attf-class]" position="attributes">
            <attribute name="t-attf-class">
                #{'col-12' if (report_type != 'html' and is_pro_forma)
                  else ('col-6' if report_type != 'html' else 'col-sm-7 col-md-6')} ms-auto
            </attribute>
        </xpath>

    </template>

</odoo>
```

---

## 8. Critère de vérité (validation)

Le correctif est considéré **valide** si :

- ✅ le PDF pro forma utilise toute la largeur
- ✅ le bloc des totaux est aligné correctement
- ✅ aucune régression n'est constatée sur :
  - devis
  - commandes
  - vues HTML

---

## 9. Plan de tests

### TC1 — Pro forma PDF
- Générer une facture pro forma
- Vérifier largeur pleine page
- Vérifier alignement des totaux

### TC2 — Devis PDF
- Générer un devis
- Vérifier rendu inchangé

### TC3 — Vue HTML
- Prévisualisation HTML
- Vérifier classes Bootstrap inchangées

---

## 10. Déploiement

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo odoo -c /etc/odoo/odoo.conf -u dorevia_sale_proforma_report_fix --stop-after-init
docker compose restart odoo
```

---

## 11. Rollback

- Désinstaller le module
- Redémarrer Odoo
- Régénérer une pro forma

---

## 12. Capitalisation Dorevia

Ce document constitue une **référence interne Dorevia** :

- diagnostic reproductible
- pattern réutilisable
- évite les faux diagnostics `wkhtmltopdf` / `external_layout`

---

## 13. Historique des versions

### v1.0 (2026-01-05)
- Diagnostic initial : problème d'`external_layout` manquant
- Solution : envelopper `sale.report_saleorder_document` dans `external_layout`

### v1.1 (2026-01-05)
- Diagnostic corrigé : `external_layout` est déjà présent
- Cause réelle : largeur du bloc des totaux (`col-6` au lieu de `col-12`)
- Solution : modifier la classe CSS conditionnellement pour les pro forma PDF

---

**Fin de document**

