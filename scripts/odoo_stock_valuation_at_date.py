# Script à exécuter dans odoo shell -d laplatine2026 --no-http
# Vérifie la valorisation stock au 14/03/2026 (même logique que dorevia_vault_connector)
from datetime import date
company = env['res.company'].browse(1)
as_of_date = date(2026, 3, 14)
if 'stock.valuation.layer' in env:
    SVL = env['stock.valuation.layer'].sudo()
    as_of_end = as_of_date.strftime('%Y-%m-%d') + ' 23:59:59'
    domain = [
        ('stock_move_id.company_id', '=', company.id),
        ('create_date', '<=', as_of_end),
    ]
    layers = SVL.search(domain)
    total = sum(layers.mapped('value'))
    print('VALORISATION_14_03_2026=', total)
else:
    print('MODULE_STOCK_ABSENT')
