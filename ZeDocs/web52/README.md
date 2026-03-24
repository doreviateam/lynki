# ZeDocs/web52 — Valeur du stock (Option B) laplatine2026

**Périmètre :** Exposition de la valorisation inventaire dans Linky pour le tenant laplatine2026, via snapshots Vault (Option B). Doctrine : Odoo calcule → Vault historise → Linky affiche.

**Statut :** ✅ Livré et accepté (recette Lot 6 clôturée le 2026-03-15).

---

## Documents

| Document | Rôle |
|----------|------|
| **SPEC_VALEUR_STOCK_OPTION_B_LAPLATINE2026_v1.0.md** | Spécification détaillée (contrats API, sémantique, exigences). |
| **RAPPORT_VALEUR_STOCK_LAPLATINE2026_v1.0.md** | Rapport de choix (Option B retenue) et contexte. |
| **PLAN_IMPLEMENTATION_VALEUR_STOCK_OPTION_B_v1.0.md** | Plan par lots (Vault, Odoo, Linky, recette) et critères de clôture. |
| **RAPPORT_IMPLEMENTATION_VALEUR_STOCK_OPTION_B_v1.0.md** | Synthèse d’implémentation (fichiers, config, recette clôturée). |
| **RAPPORT_EXECUTION_PLAN_VALEUR_STOCK_OPTION_B_v1.0.md** | Rapport d’exécution détaillé (traçabilité par tâche, DoD, statut). |
| **CHECKLIST_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md** | Checklist recette R6.1–R6.4 (Vault, Odoo, Linky, idempotence). |
| **BILAN_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md** | Bilan final recette et alignement métier. |

---

## Références techniques

- **Vault :** migration 044, `sources/vault/internal/handlers/aggregations_stock_valuation.go`, `internal/storage/stock_valuation_snapshots.go`
- **Odoo :** `units/odoo/custom-addons/dorevia_vault_connector/models/stock_valuation_push.py`, cron « Vault Stock Valuation Snapshot (J-1) »
- **Linky :** `units/dorevia-linky/app/api/stock-valuation/route.ts`, `app/api/stock-evolution/route.ts`, `WorkingCapitalCard*`
- **Recette automatisée :** `scripts/recette_stock_valuation_lot6.sh` ; vérification alignement : `scripts/odoo_stock_valuation_at_date.py`

---

*ZeDocs/web52 — Index documentation valeur du stock Option B — 2026-03-15.*
