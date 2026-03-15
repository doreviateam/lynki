env = env  # noqa: F821
p = env["res.partner"].search([], limit=15)
print("Partenaires (15):", [x.name for x in p])
pr = env["product.product"].search([], limit=10)
print("Produits (10):", [x.name for x in pr])
so = env["sale.order"].search([], limit=5)
print("Commandes:", [x.name for x in so])
