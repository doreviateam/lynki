# Rapport d'implémentation — Valeur du stock (Option B) laplatine2026

**Version :** 1.0  
**Date :** 2026-03-15  
**Référence :** ZeDocs/web52/PLAN_IMPLEMENTATION_VALEUR_STOCK_OPTION_B_v1.0.md

---

## 1. Synthèse

L’implémentation des **Lots 1 à 5** du plan Option B est réalisée et la **recette Lot 6** est clôturée. La chaîne **Odoo → Vault → Linky** est en place et validée.

| Lot | Statut | Commentaire |
|-----|--------|-------------|
| Lot 1 — Vault migration | ✅ Livré | Table `stock_valuation_snapshots` (migration 044) |
| Lot 2 — Vault POST | ✅ Livré | `POST /internal/stock-valuation-snapshot`, token Bearer, upsert |
| Lot 3 — Vault GET | ✅ Livré | `GET /ui/aggregations/stock-valuation` (404 si absent), `GET /ui/aggregations/stock-series` |
| Lot 4 — Odoo calcul + cron | ✅ Livré | Modèle `dorevia.stock.valuation.push`, cron J-1, config documentée |
| Lot 5 — Linky routes + carte BFR | ✅ Livré | `/api/stock-valuation`, `/api/stock-evolution`, WorkingCapitalCard avec snapshot |
| Lot 6 — Recette | ✅ Accepté | R6.1 à R6.4 validés ; alignement Odoo vérifié (14/03/2026 = 5122,03 €). Voir CHECKLIST et BILAN. |

---

## 2. Détail par lot

### Lot 1–3 — Vault

- **Fichiers :**
  - `sources/vault/migrations/044_stock_valuation_snapshots.sql`
  - `sources/vault/internal/storage/stock_valuation_snapshots.go`
  - `sources/vault/internal/handlers/aggregations_stock_valuation.go`
  - Routes enregistrées dans `internal/server/replay.go`
- **Comportement :** POST upsert (created_at immuable), GET point 404 si aucun snapshot, GET série 200 avec `series: []` si vide.

### Lot 4 — Odoo

- **Fichiers :**
  - `units/odoo/custom-addons/dorevia_vault_connector/models/stock_valuation_push.py`
  - `data/ir_cron.xml` (cron « Vault Stock Valuation Snapshot (J-1) », 1 jour)
  - `data/ir_model_data.xml`, `security/ir.model.access.csv`, `models/__init__.py`
  - `README.md` (paramètres stock)
- **Config (Paramètres système ou env) :** `dorevia.vault.url`, `dorevia.stock_valuation.token`, `dorevia.tenant`, `dorevia.stock_valuation.company_ids` (optionnel).
- **Calcul :** `stock.valuation.layer` (module `stock_account`), filtre `stock_move_id.company_id` et `create_date <= as_of_date` ; valeur 0 acceptée ; échec → pas de snapshot (log uniquement).
- **Cron :** `as_of_date = J-1` ; pour chaque société configurée, calcul puis POST Vault. Planification à 02:00 possible via *Paramètres → Technique → Actions planifiées*.

### Lot 5 — Linky

- **Fichiers :**
  - `units/dorevia-linky/app/api/stock-valuation/route.ts`
  - `units/dorevia-linky/app/api/stock-evolution/route.ts`
  - `WorkingCapitalCard.tsx` / `WorkingCapitalCardWithPolling.tsx` (prop `stockValuation`, microcopy « Valeur au DD/MM/AAAA » ou « Aucun snapshot disponible »).

---

## 3. Recette Lot 6 (clôturée)

La recette a été exécutée et validée (2026-03-15) :

- **R6.1** — Vault : script `scripts/recette_stock_valuation_lot6.sh` ; POST, GET, 404, stock-series, upsert OK.
- **R6.2** — Odoo : cron exécuté (base laplatine2026) ; snapshot J-1 poussé (5122,03 € au 14/03/2026).
- **R6.3** — Linky : API + UI ; alignement vérifié par calcul Odoo (stock.valuation.layer au 14/03/2026 = 5122,03 €).
- **R6.4** — Idempotence : created_at inchangé, updated_at mis à jour (vérifié en base).

**Références recette :** ZeDocs/web52/CHECKLIST_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md, BILAN_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md.

---

## 4. Références

- **Plan :** ZeDocs/web52/PLAN_IMPLEMENTATION_VALEUR_STOCK_OPTION_B_v1.0.md  
- **Spec :** ZeDocs/web52/SPEC_VALEUR_STOCK_OPTION_B_LAPLATINE2026_v1.0.md  
- **Rapport d’exécution :** ZeDocs/web52/RAPPORT_EXECUTION_PLAN_VALEUR_STOCK_OPTION_B_v1.0.md  
- **Checklist recette :** ZeDocs/web52/CHECKLIST_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md  
- **Bilan recette :** ZeDocs/web52/BILAN_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md  
- **Connecteur Odoo :** units/odoo/custom-addons/dorevia_vault_connector/ (README § Configuration)

---

*ZeDocs/web52 — Rapport implémentation valeur du stock Option B v1.0 — 2026-03-15.*
