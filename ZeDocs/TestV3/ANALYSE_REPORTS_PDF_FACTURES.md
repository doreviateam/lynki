# 📊 Analyse — Reports PDF et Fonctionnalité "Envoyer" pour Factures

**Date** : 2026-01-12  
**Analyse** : Code source Odoo — Factures (`account.move`)

---

## 1️⃣ Quels reports PDF sont utilisés sur les factures ?

### Report Principal Identifié

**`account.report_invoice_document`**

C'est le report PDF standard d'Odoo pour les factures (`account.move`).

### Preuves dans le Code

#### Module `dorevia_report_pdf_layout_fix`

**Fichier** : `units/odoo/custom-addons/dorevia_report_pdf_layout_fix/views/account_report_templates.xml`

```xml
<template id="account_report_totals_pdf_fullwidth"
          inherit_id="account.report_invoice_document"
          priority="99">
    <!-- Correction du layout PDF pour les factures -->
</template>
```

**Documentation** : `units/odoo/custom-addons/dorevia_report_pdf_layout_fix/README.md`

> **Rapports corrigés** :
> - ✅ Factures (`account.report_invoice_document`)

### Autres Reports Potentiels

D'après l'analyse du module `dorevia_sale_reports`, il existe aussi des reports personnalisés pour les **devis et commandes** (`sale.order`), mais **pas de report personnalisé spécifique pour les factures**.

Les factures utilisent donc le report standard d'Odoo : **`account.report_invoice_document`**.

---

## 2️⃣ Quand on clique "Envoyer", est-ce qu'un attachment PDF est créé ?

### Fonctionnalité "Envoyer" dans Odoo

Le bouton **"Envoyer"** sur une facture appelle la méthode **`action_invoice_sent()`** qui ouvre le wizard **`account.move.send.wizard`**.

### Comportement Standard d'Odoo

**D'après l'analyse du code Odoo standard et des modules OCA** :

1. **`action_invoice_sent()`** ouvre le wizard `account.move.send.wizard`
2. Le wizard permet de :
   - Choisir le mode d'envoi (email, etc.)
   - Sélectionner le report PDF à joindre
   - Prévisualiser le message

3. **Lors de l'envoi** (`action_send_and_print()`), Odoo :
   - Génère le PDF du report sélectionné
   - **Crée un attachment** (`ir.attachment`) avec le PDF
   - Joint l'attachment à l'email envoyé
   - Stocke l'attachment lié à la facture (`res_model='account.move'`, `res_id=<invoice_id>`)

### Preuves dans le Code

#### Module `account_invoice_auto_send_by_email`

**Fichier** : `sources/oca/account-invoicing/account_invoice_auto_send_by_email/models/account_move.py`

```python
def _execute_invoice_sent_wizard(self, options=None):
    self.ensure_one()
    # ...
    res = self.action_invoice_sent()  # Ouvre le wizard
    wiz = self.env["account.move.send.wizard"].create(...)
    return wiz.action_send_and_print()  # Génère PDF et envoie
```

#### Module `account_invoice_facturx`

**Fichier** : `sources/oca/edi/account_invoice_facturx/models/account_move.py`

```python
def regular_pdf_invoice_to_facturx_invoice(self, pdf_bytesio):
    # Génère un PDF avec XML Factur-X intégré
    # Ce PDF est ensuite utilisé comme attachment
```

### Conclusion

**OUI**, lorsqu'on clique sur "Envoyer" et qu'on envoie la facture :

1. ✅ **Un PDF est généré** à partir du report `account.report_invoice_document`
2. ✅ **Un attachment est créé** (`ir.attachment`) avec ce PDF
3. ✅ **L'attachment est lié à la facture** (`res_model='account.move'`, `res_id=<invoice_id>`)
4. ✅ **L'attachment est joint à l'email** envoyé au client

### Où Trouver l'Attachment

L'attachment est stocké dans la table `ir_attachment` avec :
- `res_model = 'account.move'`
- `res_id = <ID de la facture>`
- `name = <Nom du fichier PDF, ex: "Facture - FAC/2026/00011.pdf">`
- `type = 'binary'`
- `mimetype = 'application/pdf'`

---

## 📋 Résumé

### Question 1 : Quels reports PDF sont utilisés sur les factures ?

**Réponse** : **`account.report_invoice_document`** (report standard Odoo)

- Report principal et unique pour les factures
- Personnalisé par le module `dorevia_report_pdf_layout_fix` pour corriger le layout

### Question 2 : Quand on clique "Envoyer", est-ce qu'un attachment PDF est créé ?

**Réponse** : **OUI** ✅

- Un PDF est généré à partir du report `account.report_invoice_document`
- Un attachment (`ir.attachment`) est créé avec ce PDF
- L'attachment est lié à la facture (`res_model='account.move'`, `res_id=<invoice_id>`)
- L'attachment est joint à l'email envoyé au client

---

## 🔍 Vérification dans la Base de Données

Pour vérifier les attachments d'une facture :

```sql
SELECT 
    id,
    name,
    res_model,
    res_id,
    mimetype,
    file_size,
    create_date
FROM ir_attachment
WHERE res_model = 'account.move'
  AND res_id = <ID_FACTURE>
ORDER BY create_date DESC;
```

---

**Date** : 2026-01-12  
**Statut** : ✅ **ANALYSE COMPLÉTÉE**
