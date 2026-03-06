# SPEC — Dorevia Sale Proforma Report Fix v1.0

**Document** : SPEC_Dorevia_Sale_Proforma_Report_Fix_v1.0.md  
**Date de création** : 2026-01-05  
**Auteur** : Dorevia Team  
**Cible** : Odoo 18.0 (Docker), base `odoo_db_lab_core`  
**Statut** : Ready to implement  
**Priorité** : P0 (bloquant qualité PDF / impression)

---

## 1. Contexte et problème

### 1.1 Symptôme observé

Les PDF générés pour la **Facture pro forma** (rapport "PRO-FORMA Invoice") présentent :
- Contenu **tassé à gauche** du document
- Grande **zone blanche** à droite
- Rendu "minimal", sans la structure standard attendue
- Absence d'en-tête et de pied de page standard Odoo

### 1.2 Diagnostic établi

Analyse du template QWeb `sale.report_saleorder_pro_forma` :
- ✅ Appelle `web.html_container` (structure de base)
- ❌ **N'appelle pas `web.external_layout`** (layout standard manquant)
- ✅ Appelle directement `sale.report_saleorder_document` dans une boucle `foreach`

**Structure actuelle** :
```xml
<template id="report_saleorder_pro_forma">
    <t t-call="web.html_container">
        <t t-set="is_pro_forma" t-value="True"/>
        <t t-set="docs" t-value="docs.with_context(proforma=True)"/>
        <t t-foreach="docs" t-as="doc">
            <t t-call="sale.report_saleorder_document" t-lang="doc.partner_id.lang"/>
        </t>
    </t>
</template>
```

### 1.3 Cause racine

**Critère de vérité (non négociable)** : Le layout société est appliqué **SI ET SEULEMENT SI** la vue QWeb finale contient :
```xml
<t t-call="web.external_layout">
```

Sans `web.external_layout`, le rendu PDF n'utilise pas le **layout "report" standard Odoo** (structure `.page`, marges, assets typiques), ce qui provoque un rendu "shrink-to-fit" sous `wkhtmltopdf`.

### 1.4 Contraintes techniques

- **Odoo** : Version 18.0
- **wkhtmltopdf** : 0.12.6.1 (with patched qt)
- **Correctif minimal** : Non intrusif, héritage QWeb uniquement
- **Compatibilité** : Doit fonctionner avec les autres modules dorevia_* installés

---

## 2. Objectifs

### 2.1 Objectif principal

Forcer la présence de `<t t-call="web.external_layout">` dans le flux du rapport QWeb `sale.report_saleorder_pro_forma`, garantissant ainsi :
- Application du layout standard Odoo (en-tête, pied de page)
- Utilisation correcte de la largeur de page
- Rendu PDF professionnel et cohérent

### 2.2 Objectifs secondaires

- Maintenir la compatibilité avec les traductions (`t-lang="doc.partner_id.lang"`)
- Préserver le contexte pro forma (`is_pro_forma`, `proforma=True`)
- Respecter la structure existante (boucle `foreach`)

### 2.3 Non-objectifs

- Ne pas modifier les factures comptables (`account.move`)
- Ne pas refondre les templates standards de vente
- Ne pas modifier `wkhtmltopdf` ou les paramètres de conversion PDF
- Ne pas toucher aux formats de papier (`paperformat`)

---

## 3. Périmètre

### 3.1 Inclus

- Module Odoo dédié `dorevia_sale_proforma_report_fix`
- Surcharge QWeb ciblée du template `sale.report_saleorder_pro_forma`
- Documentation technique et utilisateur
- Tests de validation

### 3.2 Exclu

- Modifications CSS globales
- Modifications des formats de papier (`paperformat`)
- Modifications de `wkhtmltopdf`
- Modifications des autres rapports de vente
- Modifications des factures comptables

---

## 4. Spécification technique

### 4.1 Nom du module

`dorevia_sale_proforma_report_fix`

### 4.2 Dépendances

```python
'depends': [
    'base',
    'sale',
]
```

### 4.3 Structure du module

```
dorevia_sale_proforma_report_fix/
├── __init__.py
├── __manifest__.py
├── README.md
├── CRITERE_VERITE.md
└── views/
    └── sale_proforma_report_templates.xml
```

### 4.4 Manifeste (`__manifest__.py`)

```python
# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Sale Proforma Report Fix',
    'version': '1.0.0',
    'category': 'Sales',
    'summary': 'Correction du external_layout pour les factures pro forma',
    'description': """
        Module pour corriger le problème d'external_layout dans les rapports PDF
        des factures pro forma.
        
        Problème corrigé :
        - Les PDF de factures pro forma n'utilisaient pas le external_layout
        - Le layout standard Odoo (en-tête, pied de page) n'était pas appliqué
        - Contenu tassé à gauche avec zone blanche à droite
        
        Solution :
        - Héritage du template de rapport sale.report_saleorder_pro_forma
        - Forçage de l'utilisation de web.external_layout
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'base',
        'sale',
    ],
    'data': [
        'views/sale_proforma_report_templates.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
```

### 4.5 Surcharge QWeb (`views/sale_proforma_report_templates.xml`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <!-- 
        🔒 CRITÈRE DE VÉRITÉ (non négociable) :
        Le layout société est appliqué SI ET SEULEMENT SI la vue QWeb finale contient :
        <t t-call="web.external_layout">
        
        Solution : On modifie report_saleorder_pro_forma pour envelopper l'appel à 
        sale.report_saleorder_document dans external_layout.
        Cela garantit que external_layout est TOUJOURS présent.
    -->
    
    <!-- 
        Solution : On modifie report_saleorder_pro_forma pour envelopper l'appel à 
        sale.report_saleorder_document dans external_layout.
        Priorité 99 pour s'assurer que cette modification s'applique après les autres.
    -->
    <template id="report_saleorder_pro_forma" inherit_id="sale.report_saleorder_pro_forma" priority="99">
        <!-- 
            On remplace l'appel à sale.report_saleorder_document pour l'envelopper
            dans external_layout. On utilise un xpath précis qui correspond exactement
            à l'élément dans le template standard.
        -->
        <xpath expr="//t[@t-call='sale.report_saleorder_document']" position="replace">
            <t t-call="web.external_layout">
                <t t-call="sale.report_saleorder_document" t-lang="doc.partner_id.lang"/>
            </t>
        </xpath>
    </template>
</odoo>
```

### 4.6 Priorité d'héritage

- **Priorité** : `99` (haute priorité, s'applique après les autres héritages)
- **Justification** : Garantit que notre modification s'applique même si d'autres modules modifient le template

---

## 5. Tests et validation

### 5.1 Critère de vérité

Le critère de vérité est respecté **SI ET SEULEMENT SI** la vue QWeb finale contient :
```xml
<t t-call="web.external_layout">
```

### 5.2 Cas de test

#### TC1 — Facture pro forma simple
**Prérequis** : Module installé, Odoo redémarré  
**Actions** :
1. Créer un devis avec au moins une ligne
2. Générer une facture pro forma
3. Imprimer → "PRO-FORMA Invoice"
4. Générer le PDF

**Résultats attendus** :
- ✅ Le PDF occupe toute la largeur de page
- ✅ Plus de zone blanche à droite
- ✅ En-tête avec logo et adresse de la société
- ✅ Pied de page avec informations de la société
- ✅ Contenu correctement formaté

#### TC2 — Facture pro forma multi-pages
**Prérequis** : Module installé, Odoo redémarré  
**Actions** :
1. Créer un devis avec de nombreuses lignes (dépassant une page)
2. Générer une facture pro forma
3. Imprimer → "PRO-FORMA Invoice"
4. Générer le PDF

**Résultats attendus** :
- ✅ Sauts de page corrects
- ✅ En-tête et pied de page présents sur toutes les pages
- ✅ Numérotation des pages correcte

#### TC3 — Facture pro forma avec langue partenaire
**Prérequis** : Module installé, Odoo redémarré, partenaire avec langue différente  
**Actions** :
1. Créer un devis avec un partenaire ayant une langue différente (ex: EN)
2. Générer une facture pro forma
3. Imprimer → "PRO-FORMA Invoice"
4. Générer le PDF

**Résultats attendus** :
- ✅ Traductions respectées (`t-lang="doc.partner_id.lang"`)
- ✅ Layout standard appliqué
- ✅ Contenu dans la langue du partenaire

#### TC4 — Vérification de la vue QWeb effective
**Prérequis** : Module installé, mode développeur activé  
**Actions** :
1. Paramètres → Technique → Interface utilisateur → Vues QWeb
2. Rechercher : `sale.report_saleorder_pro_forma`
3. Ouvrir la vue
4. Chercher (`Ctrl+F`) : `external_layout`

**Résultats attendus** :
- ✅ La ligne `<t t-call="web.external_layout">` est présente
- ✅ L'appel à `sale.report_saleorder_document` est enveloppé dans `external_layout`

### 5.3 Tests de non-régression

- ✅ Les autres rapports de vente (devis, commandes) ne sont pas affectés
- ✅ Les factures comptables (`account.move`) ne sont pas affectées
- ✅ Les autres modules dorevia_* continuent de fonctionner

---

## 6. Déploiement

### 6.1 Installation

1. **Copier le module** dans `/opt/dorevia-plateform/units/odoo/custom-addons/`
2. **Redémarrer Odoo** :
   ```bash
   cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
   docker compose restart odoo
   ```
3. **Mettre à jour la liste des apps** :
   - Apps → Mettre à jour la liste des applications
4. **Installer le module** :
   - Apps → Rechercher "Dorevia Sale Proforma Report Fix"
   - Cliquer sur "Installer"

### 6.2 Vérification post-installation

1. **Vérifier que le module est installé** : Apps → "Dorevia Sale Proforma Report Fix" → Statut "Installé"
2. **Tester la génération d'un PDF** : Créer une facture pro forma et générer le PDF
3. **Vérifier visuellement** : Le PDF doit avoir l'en-tête et le pied de page

### 6.3 Mise à jour

1. **Mettre à jour le module** :
   - Apps → "Dorevia Sale Proforma Report Fix" → "Mettre à jour"
2. **Redémarrer Odoo** (si nécessaire) :
   ```bash
   docker compose restart odoo
   ```

---

## 7. Rollback

### 7.1 Désinstallation

1. **Désinstaller le module** :
   - Apps → "Dorevia Sale Proforma Report Fix" → "Désinstaller"
2. **Redémarrer Odoo** :
   ```bash
   docker compose restart odoo
   ```

### 7.2 Conséquences du rollback

- Le template `sale.report_saleorder_pro_forma` revient à son état standard
- Les PDF de factures pro forma reviennent au rendu "minimal" (tassé à gauche)
- Aucun impact sur les autres fonctionnalités

---

## 8. Documentation

### 8.1 Documentation utilisateur

- **README.md** : Guide d'installation et d'utilisation
- **CRITERE_VERITE.md** : Explication du critère de vérité et méthodes de vérification

### 8.2 Documentation technique

- Commentaires dans le code XML
- Structure du module documentée
- Explication de la priorité d'héritage

---

## 9. Risques et limitations

### 9.1 Risques identifiés

- **Double layout** : Si `sale.report_saleorder_document` utilise déjà `external_layout`, cela créera un double layout (acceptable, le layout sera présent)
- **Interférence avec d'autres modules** : Si un autre module modifie `sale.report_saleorder_pro_forma` avec une priorité ≥ 99, il pourrait écraser notre modification

### 9.2 Limitations

- Le module corrige uniquement les factures pro forma
- Les autres rapports de vente ne sont pas affectés (par design)

### 9.3 Mitigation

- Priorité 99 pour garantir l'application de notre modification
- Tests de non-régression pour vérifier l'absence d'impact sur les autres fonctionnalités

---

## 10. Évolutions futures

### 10.1 Améliorations potentielles

- Fusion avec `dorevia_sale_report_fix` si les deux modules corrigent des problèmes similaires
- Support d'autres rapports si nécessaire

### 10.2 Maintenance

- Surveillance des mises à jour Odoo pour vérifier la compatibilité
- Vérification périodique que le critère de vérité est respecté

---

## 11. Références

- **Module similaire** : `dorevia_sale_report_fix` (correction pour devis/commandes)
- **Documentation Odoo** : [QWeb Templates](https://www.odoo.com/documentation/18.0/developer/reference/frontend/qweb.html)
- **Critère de vérité** : Voir `CRITERE_VERITE.md` dans le module

---

## 12. Approbation

- **Auteur** : Dorevia Team
- **Date** : 2026-01-05
- **Statut** : Ready to implement
- **Priorité** : P0 (bloquant qualité PDF / impression)

---

**Fin du document**

