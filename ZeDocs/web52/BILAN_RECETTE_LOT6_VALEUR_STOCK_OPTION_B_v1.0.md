# Bilan recette Lot 6 — Valeur du stock (Option B) laplatine2026

**Date :** 2026-03-15  
**Référence :** ZeDocs/web52/CHECKLIST_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md

---

## Résumé

| Critère | Statut |
|---------|--------|
| R6.1 — Recette Vault | ✅ Validé (POST, GET, 404, stock-series, upsert) |
| R6.2 — Recette Odoo | ✅ Validé (cron exécuté, snapshot J-1 poussé : 5122,03 € au 14/03/2026) |
| R6.3 — Recette Linky | ✅ Validé (API, UI, alignement : calcul Odoo 14/03/2026 = 5122,03 €) |
| R6.4 — Idempotence | ✅ Validé (created_at inchangé, updated_at mis à jour) |

---

## Réalisé

- **Vault** : image `dorevia/vault:stock-valuation-2026-03-15` déployée ; script `scripts/recette_stock_valuation_lot6.sh` exécuté avec succès.
- **Odoo** : base `laplatine2026` ; paramètres `dorevia.vault.url`, `dorevia.stock_valuation.token`, `dorevia.tenant` configurés ; cron `cron_push_stock_valuation_snapshot()` exécuté → snapshot **5122,03 €** pour as_of_date **2026-03-14** enregistré en Vault.
- **Linky** : image `dorevia/linky:stock-valuation-2026-03-15` déployée ; carte BFR affiche le bloc Stocks (valorisation inventaire) avec valeur et date.
- **Idempotence** : vérifiée en base (une ligne, created_at inchangé après second POST).

---

## Alignement métier (R6.3.2)

- **Vérification effectuée** : exécution du calcul de valorisation (stock.valuation.layer, société 1, date 14/03/2026) dans Odoo shell (script `scripts/odoo_stock_valuation_at_date.py`) → **5122,03 €**, identique au snapshot Vault et à l’affichage Linky. Le livrable Option B est considéré **accepté**.

---

## Valeur de référence

- **Snapshot J-1 (14/03/2026)** calculé par Odoo et enregistré en Vault : **5122,03 €**.
- À comparer avec le rapport Odoo *Inventaire → Analyse → Valorisation* à la même date.

---

*ZeDocs/web52 — Bilan recette Lot 6 valeur du stock Option B v1.0 — 2026-03-15.*
