#!/usr/bin/env python3
"""
Crée des données de test pour o19 : clients, produits, commandes, factures.
Équivalent aux données de démo Odoo — exécuté automatiquement par reinstall_o19.sh
"""
env = env  # noqa: F821

country_fr = env.ref("base.fr")
Partner = env["res.partner"]
Product = env["product.product"]
SaleOrder = env["sale.order"]

# Clients (France, sans taxe pour éviter erreur position fiscale)
CLIENTS = [
    "Azure Interior",
    "Deco Addict",
    "Gemini Furniture",
    "LightsUp",
    "Wood Corner",
]
created = 0
for name in CLIENTS:
    if not Partner.search([("name", "=", name), ("is_company", "=", True)], limit=1):
        Partner.create({
            "name": name,
            "is_company": True,
            "customer_rank": 1,
            "country_id": country_fr.id,
        })
        created += 1
clients = Partner.search([("name", "in", CLIENTS), ("is_company", "=", True)])
if created:
    print("Clients créés : %d" % created)

# Produits (sans taxe)
PRODUITS = [
    ("Bureau personnalisable", 299.0),
    ("Chaise de conférence", 199.0),
    ("Grande armoire", 450.0),
    ("Organisateur de bureau", 49.0),
    ("Sous-main", 19.0),
]
for name, price in PRODUITS:
    if not Product.search([("name", "=", name)], limit=1):
        Product.create({
            "name": name,
            "type": "consu",
            "list_price": price,
            "sale_ok": True,
            "taxes_id": False,
        })
products = Product.search([("sale_ok", "=", True)], limit=10)
print("Produits : %d" % len(products))

# Commandes de vente + factures
orders_created = 0
for i, client in enumerate(clients[:4]):
    if SaleOrder.search([("partner_id", "=", client.id)], limit=1):
        continue
    lines = []
    for p in products[: (2 + (i % 3))]:
        lines.append((0, 0, {"product_id": p.id, "product_uom_qty": 1 + (i % 2), "price_unit": p.list_price}))
    if not lines:
        continue
    order = SaleOrder.create({"partner_id": client.id, "order_line": lines})
    order.action_confirm()
    if order.invoice_status == "to invoice":
        inv = order._create_invoices()
        inv.action_post()
    orders_created += 1

env.cr.commit()
print("Commandes créées : %d" % orders_created)
print("Données de test prêtes.")
