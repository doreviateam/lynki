# Recommandations Dorevia — Stylisation fiable des PDF Odoo (QWeb)

## Contexte
Les documents PDF Odoo (devis, factures, pro forma) sont rendus via **wkhtmltopdf**.
Ce moteur **ne supporte pas correctement Bootstrap Grid / Flexbox**.
Résultat : colonnes cassées, blancs à droite, alignements incohérents.

Objectif : obtenir des PDF **stables, prévisibles et professionnels**.

---

## Règles d'or (non négociables)

1. ❌ Ne pas utiliser Bootstrap Grid (`row`, `col-*`, `ms-auto`, `d-flex`) pour la structure PDF  
2. ✅ Utiliser des **tables HTML** pour toute mise en page horizontale  
3. ✅ Utiliser des **styles inline** pour largeurs, alignements, marges  
4. ✅ Garder Bootstrap uniquement pour :
   - Typographie (`fw-bold`, `small`)
   - Espacements simples (`mt-2`, `mb-1`)
5. ✅ Toujours encapsuler le document dans :
   - `web.html_container`
   - `web.external_layout`
   - un `<div class="page">`

---

## Structure minimale recommandée

```xml
<t t-call="web.html_container">
  <t t-call="web.external_layout">
    <div class="page">
      <!-- Contenu PDF -->
    </div>
  </t>
</t>
```

---

## Lignes de facturation / devis (structure fiable)

### À FAIRE (table HTML)

```xml
<table style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead>
    <tr>
      <th style="text-align:left;">Description</th>
      <th style="text-align:right; width:8%;">Quantité</th>
      <th style="text-align:right; width:12%;">Prix unitaire</th>
      <th style="text-align:right; width:12%;">Taxes</th>
      <th style="text-align:right; width:14%;">Montant</th>
    </tr>
  </thead>
  <tbody>
    <tr t-foreach="doc.invoice_line_ids" t-as="line">
      <td><span t-field="line.name"/></td>
      <td style="text-align:right;"><span t-field="line.quantity"/></td>
      <td style="text-align:right;"><span t-field="line.price_unit"/></td>
      <td style="text-align:right;"><span t-field="line.tax_ids"/></td>
      <td style="text-align:right;"><span t-field="line.price_subtotal"/></td>
    </tr>
  </tbody>
</table>
```

### À ÉVITER ABSOLUMENT

```xml
<div class="row">
  <div class="col-6">Description</div>
  <div class="col-2">Montant</div>
</div>
```

---

## Bloc Totaux (PDF-safe)

```xml
<table style="width:100%; margin-top:10px;">
  <tr>
    <td style="width:70%;"></td>
    <td style="width:30%;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td>Montant HT</td>
          <td style="text-align:right;"><span t-field="doc.amount_untaxed"/></td>
        </tr>
        <tr>
          <td>TVA</td>
          <td style="text-align:right;"><span t-field="doc.amount_tax"/></td>
        </tr>
        <tr>
          <td><strong>Total</strong></td>
          <td style="text-align:right;"><strong><span t-field="doc.amount_total"/></strong></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## Bonnes pratiques avancées

- Toujours tester :
  - PDF navigateur
  - PDF téléchargé
- Éviter les CSS externes pour la structure
- Préférer des largeurs fixes (%) plutôt que flexibles
- Considérer les PDF comme des **documents contractuels**, pas comme des pages web

---

## Philosophie Dorevia

> En PDF : **précision > modernité CSS**

La robustesse prime sur l'esthétique web.
Une table bien alignée vaut mieux qu'un layout cassé.

---

Version : v1.0  
Auteur : Dorevia Team

