# Runbook Incident Odoo - OwlError `stock.picking.invoice_ids`

## Contexte

- Instance: `odoo.lab.laplatine2026.doreviateam.com`
- Point de déclenchement observé: fiche vente (ex. `/odoo/sales/50`)

## Symptome

- Popup erreur Odoo / Owl:
  - `UncaughtPromiseError > OwlError`
  - `Caused by: Error: "stock.picking"."invoice_ids" field is undefined.`

## Cause racine

- Des modules OCA historiques de lien facture/livraison etaient encore installes:
  - `stock_picking_invoice_link`
  - `sale_stock_picking_invoice_link`
  - `purchase_stock_picking_invoice_link`
  - `stock_picking_invoicing`
- Dans cet environnement, ces modules etaient incoherents (etat installe/non installable), et des vues `stock.picking` actives referenciaient encore `invoice_ids`.
- Au rendu de vue, Owl echoue car le champ `invoice_ids` n'est pas defini sur `stock.picking`.

## Resolution appliquee

1. Verification de la bonne stack compose:
   - projet attendu: `dorevia_odoo_lab_laplatine2026`
2. Identification des vues cassantes en base (`ir_ui_view`, `stock.picking`, `invoice_ids`).
3. Desinstallation des modules obsoletes/incoherents.
4. Redemarrage Odoo.
5. Verification finale: plus aucune vue `stock.picking` avec `invoice_ids`.

## Commandes

### 1) Verifier la bonne stack

```bash
env -u COMPOSE_FILE docker compose \
  -f /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab/docker-compose.yml \
  -p dorevia_odoo_lab_laplatine2026 ps
```

### 2) Diagnostiquer les vues cassantes

```bash
env -u COMPOSE_FILE docker compose \
  -f /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab/docker-compose.yml \
  -p dorevia_odoo_lab_laplatine2026 exec -T odoo bash -lc "
odoo shell -c /etc/odoo/odoo.conf -d laplatine2026 --no-http <<'PY'
cr=env.cr
cr.execute(\"\"\"
SELECT v.id, v.name, v.active, v.model, imd.module, imd.name
FROM ir_ui_view v
LEFT JOIN ir_model_data imd ON (imd.model='ir.ui.view' AND imd.res_id=v.id)
WHERE v.model='stock.picking' AND v.arch_db::text ILIKE '%invoice_ids%'
ORDER BY v.id
\"\"\")
print(cr.fetchall())
PY"
```

### 3) Desinstaller les modules causes

```bash
env -u COMPOSE_FILE docker compose \
  -f /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab/docker-compose.yml \
  -p dorevia_odoo_lab_laplatine2026 exec -T odoo bash -lc "
odoo shell -c /etc/odoo/odoo.conf -d laplatine2026 --no-http <<'PY'
mods = env['ir.module.module'].sudo().search([('name','in',[
    'stock_picking_invoicing',
    'stock_picking_invoice_link',
    'sale_stock_picking_invoice_link',
    'purchase_stock_picking_invoice_link',
])])
print('before=', [(m.name, m.state) for m in mods])
mods.button_immediate_uninstall()
mods2 = env['ir.module.module'].sudo().search([('name','in',[
    'stock_picking_invoicing',
    'stock_picking_invoice_link',
    'sale_stock_picking_invoice_link',
    'purchase_stock_picking_invoice_link',
])])
print('after=', [(m.name, m.state) for m in mods2])
PY"
```

### 4) Redemarrer Odoo

```bash
env -u COMPOSE_FILE docker compose \
  -f /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab/docker-compose.yml \
  -p dorevia_odoo_lab_laplatine2026 restart odoo
```

### 5) Verification post-correctif

```bash
env -u COMPOSE_FILE docker compose \
  -f /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab/docker-compose.yml \
  -p dorevia_odoo_lab_laplatine2026 exec -T odoo bash -lc "
odoo shell -c /etc/odoo/odoo.conf -d laplatine2026 --no-http <<'PY'
cr=env.cr
cr.execute(\"\"\"
SELECT count(*)
FROM ir_ui_view
WHERE model='stock.picking' AND arch_db::text ILIKE '%invoice_ids%'
\"\"\")
print('count=', cr.fetchone()[0])
PY"
```

## Critere de succes

- Les 4 modules `stock_picking_*` cibles sont en etat `uninstalled`.
- La requete de verification retourne `count=0`.
- La fiche vente et ses vues liees (livraison) s'ouvrent sans OwlError.
