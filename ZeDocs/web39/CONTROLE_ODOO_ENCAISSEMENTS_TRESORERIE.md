# Contrôle dans Odoo — Encaissements, décaissements, trésorerie

**Objectif :** Vérifier dans Odoo les montants affichés dans Linky (carte Cash, Trésorerie) pour le tenant o19.

**Périmètre aligné Linky :** même société, même période (ex. Exercice à date = 2026-01-01 → date du jour).

---

## 1. Encaissements (carte Cash Linky)

Dans Linky, les encaissements viennent actuellement du **Vault** (`/ui/aggregations/payments-in`). Pour comparer avec Odoo :

### Dans Odoo

1. **Menu** : Comptabilité → Paiements (ou **Comptabilité → Clients → Paiements** / recherche « Paiements »).
2. **Filtres à appliquer** :
   - **État** : Publié (ou Rapproché) — `state in ('posted', 'reconciled')`
   - **Société** : Ma Société (company correspondant à o19)
   - **Journal** : type **Banque** (`journal_id.type = 'bank'`)
   - **Type de paiement** : **Entrant** (`payment_type = 'inbound'`) = encaissements
   - **Date** : entre **2026-01-01** et **date du jour** (ou la date de fin de votre sélection « Exercice à date »)
3. **Montant à relever** : somme de la colonne **Montant** (ou exporter en CSV et sommer).
   - En base Odoo : `account.payment`, champ **`date`** (date du paiement), champ **`amount`**.
   - **Encaissements Odoo** = somme des `amount` des paiements **inbound** sur la période.

Ce total = ce que la carte Cash **devrait** afficher si elle était alimentée par Odoo.

---

## 2. Décaissements (carte Cash Linky)

Même principe que les encaissements :

- **Type de paiement** : **Sortant** (`payment_type = 'outbound'`).
- Filtres : état Publié, société, journal Banque, date sur la période.
- **Décaissements Odoo** = somme des `amount` des paiements **outbound** sur la période.

---

## 3. Trésorerie (solde comptable, position validée)

- **Solde comptable (ERP)** affiché dans Linky = solde des comptes bancaires (écritures **posted**) dans Odoo.  
  Côté code : somme des `balance` des `account.move.line` des comptes par défaut des journaux **type = bank**.
- Pour vérifier : **Comptabilité → Rapports → Grand livre** (ou **Relevé bancaire**) sur le(s) compte(s) bancaire(s), état **Publié**, à la date du jour. Le solde doit correspondre au « Solde comptable (ERP) » Linky.

**Couverture probante (0 %)** = part des flux (paiements) rapprochés avec un relevé bancaire dans Odoo. Vérifiable via **Comptabilité → Rapprochement bancaire** : montants « Rapprochés » vs « À rapprocher ».

---

## 4. Requête rapide (shell Odoo)

En environnement de dev, pour obtenir encaissements / décaissements sur la période :

```bash
# Depuis la racine du projet (ex. tenants/o19/apps/odoo/lab)
docker compose -p dorevia_odoo_lab_o19 exec odoo odoo shell -d odoo_lab_o19 -c /etc/odoo/odoo.conf --no-http
```

En shell Odoo (Python) :

```python
company = env.company  # ou env['res.company'].sudo().browse(1)
date_from = '2026-01-01'
date_to = '2026-03-08'

Payment = env['account.payment'].sudo()
domain_in = [
    ('state', 'in', ('posted', 'reconciled')),
    ('journal_id.company_id', '=', company.id),
    ('journal_id.type', '=', 'bank'),
    ('payment_type', '=', 'inbound'),
    ('date', '>=', date_from),
    ('date', '<=', date_to),
]
domain_out = domain_in[:-2] + [('payment_type', '=', 'outbound')]

inbound = Payment.search(domain_in)
outbound = Payment.search(domain_out)
encaissements = sum(inbound.mapped('amount'))
decaissements = sum(outbound.mapped('amount'))

print('Encaissements:', encaissements)
print('Décaissements:', decaissements)
```

---

## 5. Alignement avec Linky

| Ce que Linky affiche | Source actuelle | Contrôle Odoo |
|----------------------|-----------------|----------------|
| Encaissements (Cash) | Vault `payments-in` | Somme `account.payment` inbound, journal bank, période (voir §1) |
| Décaissements (Cash) | Vault `payments-out` | Somme `account.payment` outbound, journal bank, période (voir §2) |
| Solde comptable (Trésorerie) | Odoo via Vault `linky_bank_reconciliation` | Solde comptes bancaires, écritures posted (§3) |

Si les montants Odoo (§1–§3) diffèrent de Linky, soit les données Vault sont incomplètes (encaissements/décaissements), soit le périmètre (dates, société) n’est pas le même.
