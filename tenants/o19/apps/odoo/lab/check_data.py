env = env  # noqa: F821
partners = env["res.partner"].search([("is_company", "=", True), ("name", "!=", "My Company")], limit=20)
print("Partenaires:", [p.name for p in partners])
products = env["product.product"].search([("sale_ok", "=", True)], limit=15)
print("Produits:", [p.name for p in products])
orders = env["sale.order"].search([], limit=10)
print("Commandes:", [o.name for o in orders])
invoices = env["account.move"].search([("move_type", "=", "out_invoice")], limit=10)
print("Factures:", [i.name for i in invoices])
