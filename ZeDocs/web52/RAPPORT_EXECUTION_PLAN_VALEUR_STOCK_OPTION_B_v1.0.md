# Rapport d'exécution détaillé du plan — Valeur du stock (Option B) laplatine2026

**Version :** 1.0  
**Date :** 2026-03-15  
**Référence :** ZeDocs/web52/PLAN_IMPLEMENTATION_VALEUR_STOCK_OPTION_B_v1.0.md

---

## 1. Vue d’ensemble

| Lot | Statut | Tâches |
|-----|--------|--------|
| Lot 1 — Vault migration | ✅ Implémenté | V1.1, V1.2 |
| Lot 2 — Vault POST | ✅ Implémenté | V2.1, V2.2, V2.3, V2.4 |
| Lot 3 — Vault GET | ✅ Implémenté | V3.1, V3.2, V3.3, V3.4 |
| Lot 4 — Odoo calcul + cron | ✅ Implémenté | O4.1, O4.2, O4.3, O4.4 (à recetter) |
| Lot 5 — Linky | ✅ Implémenté | L5.1, L5.2, L5.3 ; L5.4 non réalisé (optionnel) |
| Lot 6 — Recette | ⏳ À exécuter | R6.1, R6.2, R6.3, R6.4 |

---

## 2. Lot 1 — Vault : migration et modèle

### V1.1 — Migration 044_stock_valuation_snapshots.sql

| DoD | Implémentation |
|-----|-----------------|
| Table créée ; pas de colonne `status`. | **Fichier :** `sources/vault/migrations/044_stock_valuation_snapshots.sql` |

**Détail :**

- Table `stock_valuation_snapshots` avec colonnes : `id` (BIGSERIAL), `tenant`, `company_id`, `as_of_date`, `value` (NUMERIC(18,4)), `currency`, `source`, `valuation_method`, `created_at`, `updated_at`.
- Contrainte `UNIQUE(tenant, company_id, as_of_date)`.
- Index `idx_stock_valuation_tenant_company_date` sur `(tenant, company_id, as_of_date)`.
- Aucune colonne `status`.

**Statut :** ✅ Conforme.

---

### V1.2 — Mécanisme de migration exécute la 044

| DoD | Implémentation |
|-----|-----------------|
| Smoke test ou script : table présente après déploiement. | Dépend du mécanisme de migration Vault (démarrage ou outil). La migration 044 est fournie ; l’exécution relève du déploiement / recette. |

**Statut :** ⚠️ Implémenté côté code ; validation de déploiement attendue en recette.

---

## 3. Lot 2 — Vault : endpoint d’écriture

### V2.1 — POST /internal/stock-valuation-snapshot, route + token

| DoD | Implémentation |
|-----|-----------------|
| Route exposée ; 401 si token manquant ou invalide. | **Fichiers :** `sources/vault/internal/handlers/aggregations_stock_valuation.go`, `internal/server/replay.go`. |

**Détail :**

- `replay.go` : `app.Post("/internal/stock-valuation-snapshot", handlers.StockValuationSnapshotPostHandler(db, cfg, log))`.
- Handler : extraction du Bearer depuis `Authorization` ; comparaison à `cfg.StockValuationInternalToken` (env `STOCK_VALUATION_INTERNAL_TOKEN`). Si token vide ou différent → `401` + `{"error": "missing or invalid internal token"}`.

**Statut :** ✅ Conforme.

---

### V2.2 — Validation du body

| DoD | Implémentation |
|-----|-----------------|
| 400 avec message explicite si champ manquant ou date invalide. | **Fichier :** `aggregations_stock_valuation.go` (l. 44–69). |

**Détail :**

- Vérifications : `tenant`, `company_id`, `as_of_date`, `currency`, `source` non vides → 400 + message (`"tenant is required"`, etc.).
- `as_of_date` parsé en `YYYY-MM-DD` ; si invalide → 400 `"as_of_date must be YYYY-MM-DD"`.
- `source` doit être égal à `"odoo.inventory.valuation"` ; sinon → 400 `"source must be odoo.inventory.valuation"`.

**Statut :** ✅ Conforme.

---

### V2.3 — Upsert, created_at immuable

| DoD | Implémentation |
|-----|-----------------|
| 200 retourné ; en base, created_at inchangé à l’update. | **Fichier :** `sources/vault/internal/storage/stock_valuation_snapshots.go`. |

**Détail :**

- `UpsertStockValuationSnapshot` : `INSERT ... ON CONFLICT (tenant, company_id, as_of_date) DO UPDATE SET value, currency, source, valuation_method, updated_at = now()`. La clause DO UPDATE ne modifie pas `created_at`.

**Statut :** ✅ Conforme.

---

### V2.4 — Réponse 200, body minimal, gestion 500

| DoD | Implémentation |
|-----|-----------------|
| Comportement conforme spec § 2.1. | **Fichier :** `aggregations_stock_valuation.go` (l. 80–87). |

**Détail :**

- Succès : `c.JSON(fiber.Map{"ok": true, "as_of_date": p.AsOfDate})` → 200.
- Erreur DB en upsert : 500 + `{"error": err.Error()}`.

**Statut :** ✅ Conforme.

---

## 4. Lot 3 — Vault : endpoints de lecture

### V3.1 — GET /ui/aggregations/stock-valuation, paramètres obligatoires

| DoD | Implémentation |
|-----|-----------------|
| Route enregistrée ; 400 si paramètre manquant. | **Fichiers :** `replay.go` (`app.Get("/ui/aggregations/stock-valuation", ...)`), `aggregations_stock_valuation.go` (StockValuationHandler). |

**Détail :**

- Query params : `tenant`, `company_id` obligatoires ; `as_of_date` optionnel.
- Si `tenant` ou `company_id` vide → 400 + message. Si `as_of_date` fourni et invalide → 400.

**Statut :** ✅ Conforme.

---

### V3.2 — Logique de lecture, 404 si aucun snapshot

| DoD | Implémentation |
|-----|-----------------|
| 200 + body { value, currency, as_of_date, company_id } ou 404. | **Fichiers :** `aggregations_stock_valuation.go` (l. 114–126), `storage/stock_valuation_snapshots.go` (GetStockValuationSnapshot). |

**Détail :**

- `GetStockValuationSnapshot(ctx, tenant, companyID, asOfDate)` : si `asOfDate != nil` → SELECT à cette date ; sinon → ORDER BY as_of_date DESC LIMIT 1. Retourne `(nil, nil)` si aucune ligne (pgx.ErrNoRows).
- Handler : si `row == nil` → `c.Status(fiber.StatusNotFound).SendString("")` (404). Sinon 200 + JSON `value`, `currency`, `as_of_date`, `company_id`.

**Statut :** ✅ Conforme.

---

### V3.3 — GET /ui/aggregations/stock-series, paramètres obligatoires

| DoD | Implémentation |
|-----|-----------------|
| Route enregistrée ; 400 si manquant ou date invalide ou date_fin < date_debut. | **Fichiers :** `replay.go` (`app.Get("/ui/aggregations/stock-series", handlers.StockSeriesHandler(db))`), `aggregations_stock_valuation.go` (StockSeriesHandler, l. 132–161). |

**Détail :**

- Paramètres obligatoires : `tenant`, `company_id`, `date_debut`, `date_fin`. Vérification YYYY-MM-DD ; si `date_fin < date_debut` → 400 `"date_fin must be >= date_debut"`.

**Statut :** ✅ Conforme.

---

### V3.4 — Série + 200 avec series vide si aucun point

| DoD | Implémentation |
|-----|-----------------|
| 200 + body { series: [{ period, amount }], currency }. Si aucun point : 200 + `{ "series": [], "currency": "EUR" }`. | **Fichiers :** `storage/stock_valuation_snapshots.go` (GetStockValuationSnapshots), `aggregations_stock_valuation.go` (l. 163–177). |

**Détail :**

- `GetStockValuationSnapshots(ctx, tenant, companyID, dateStart, dateEnd)` : SELECT WHERE as_of_date BETWEEN dateStart AND dateEnd ORDER BY as_of_date ASC.
- Handler : construction de `series[]` avec `period` (as_of_date), `amount` (value) ; `currency` par défaut "EUR" si aucune ligne. Réponse toujours 200 (pas de 404 pour série vide).

**Statut :** ✅ Conforme.

---

## 5. Lot 4 — Odoo : calcul et job (B1)

### O4.1 — Logique de calcul réutilisable

| DoD | Implémentation |
|-----|-----------------|
| Succès → (value, currency) y compris value=0 ; échec → pas d’appel Vault. | **Fichier :** `units/odoo/custom-addons/dorevia_vault_connector/models/stock_valuation_push.py`. |

**Détail :**

- `_compute_stock_value_at_date(company, as_of_date)` :
  - Si `stock.valuation.layer` absent (module stock_account non installé) → retourne `None` (log debug).
  - Sinon : domaine `stock_move_id.company_id`, `create_date <= as_of_date 23:59:59` ; somme des `value` ; retourne `float(total)` (0 autorisé).
  - Exception → log warning + retourne `None`. Aucun snapshot envoyé si `None`.
- Devise : `company.currency_id.name` ou `company_id` du contexte (cron), défaut "EUR".

**Point de vigilance (recette R6.3) :** Cette logique doit être **strictement alignée** avec le rapport Odoo *Inventaire → Analyse → Valorisation* à la même date. Si la sémantique « à date » du connecteur diffère de celle du rapport, le système peut être techniquement propre mais fonctionnellement décalé. L’alignement valeur calculée / valeur rapport est le **verrou de validation métier central** du Lot 6.

**Statut :** ✅ Implémenté ; alignement à confirmer en recette.

---

### O4.2 — Cron B1, as_of_date = J-1, POST Vault

| DoD | Implémentation |
|-----|-----------------|
| Cron déclenché ; as_of_date = J-1 ; body conforme ; erreurs loguées. | **Fichiers :** `stock_valuation_push.py` (cron_push_stock_valuation_snapshot, _push_snapshot), `data/ir_cron.xml`. |

**Détail :**

- `cron_push_stock_valuation_snapshot()` : `as_of_date = date.today() - timedelta(days=1)`. Pour chaque société (config ou toutes) : calcul → si valeur calculée (y compris 0), `_push_snapshot` avec body `tenant`, `company_id` (odoo:id), `as_of_date` (YYYY-MM-DD), `value`, `currency`, `source=odoo.inventory.valuation` ; POST `{vault_url}/internal/stock-valuation-snapshot` avec Bearer token.
- Cron enregistré : « Vault Stock Valuation Snapshot (J-1) », `model.cron_push_stock_valuation_snapshot()`, interval 1 jour. Planification à 02:00 possible en UI (Paramètres → Technique → Actions planifiées).

**Statut :** ✅ Conforme.

---

### O4.3 — Configuration

| DoD | Implémentation |
|-----|-----------------|
| Config documentée ; job utilisable pour laplatine2026. | **Fichiers :** `stock_valuation_push.py` (get_stock_valuation_config), `README.md` (section Configuration). |

**Détail :**

- Paramètres : `dorevia.vault.url`, `dorevia.stock_valuation.token`, `dorevia.tenant`, `dorevia.stock_valuation.company_ids` (optionnel). Env : `ODOO_VAULT_URL`, `STOCK_VALUATION_INTERNAL_TOKEN`, `ODOO_TENANT`. README décrit ces clés et le cron.

**Statut :** ✅ Conforme.

---

### O4.4 — Idempotence

| DoD | Implémentation |
|-----|-----------------|
| Recette : deux runs même date → même ligne, updated_at mis à jour, created_at inchangé. | Côté Vault : upsert par (tenant, company_id, as_of_date) ; DO UPDATE sans toucher created_at. Côté Odoo : pas de garde-fou contre double exécution ; le deuxième POST fait un upsert. La démonstration d’idempotence relève de la recette (R6.4). |

**Statut :** ✅ Implémenté (Vault upsert) ; à valider en recette.

---

## 6. Lot 5 — Linky : routes API et carte BFR

### L5.1 — GET /api/stock-valuation

| DoD | Implémentation |
|-----|-----------------|
| Route opérationnelle ; 404 propagé si aucun snapshot. | **Fichier :** `units/dorevia-linky/app/api/stock-valuation/route.ts`. |

**Détail :**

- Query params : `tenant`, `company_id` requis ; `as_of_date` optionnel. Proxy vers `VAULT_URL/ui/aggregations/stock-valuation?…`. Timeout 10 s. Si Vault retourne 404 → `NextResponse(null, { status: 404 })`. Pas d’exposition du token interne.

**Statut :** ✅ Conforme.

---

### L5.2 — GET /api/stock-evolution

| DoD | Implémentation |
|-----|-----------------|
| Route opérationnelle ; body { series, currency }. | **Fichier :** `units/dorevia-linky/app/api/stock-evolution/route.ts`. |

**Détail :**

- Paramètres : `tenant`, `company_id`, `date_debut`, `date_fin`. Proxy vers `VAULT_URL/ui/aggregations/stock-series?…`. Timeout 10 s. Retour du body Vault (series, currency).

**Statut :** ✅ Conforme.

---

### L5.3 — Carte BFR (WorkingCapitalCard)

| DoD | Implémentation |
|-----|-----------------|
| Si 200 : valeur + devise + « Valeur au DD/MM/AAAA ». Si 404 : « Aucun snapshot disponible ». | **Fichiers :** `WorkingCapitalCardWithPolling.tsx`, `WorkingCapitalCard.tsx`. |

**Détail :**

- `WorkingCapitalCardWithPolling` : appel `GET /api/stock-valuation` avec `tenant` et `company_id` (contexte) ; passe `stockValuation` à la carte.
- `WorkingCapitalCard` : prop optionnelle `stockValuation`. Si présent : affichage du montant (formatAmount) + « Valeur au DD/MM/AAAA » (as_of_date en format FR). Si absent : « Aucun snapshot disponible ».

**Statut :** ✅ Conforme (spec § 6.3).

---

### L5.4 — (Optionnel) Bloc Évolution

| DoD | Implémentation |
|-----|-----------------|
| Si réalisé : série affichée (courbe ou tableau). | Non réalisé. L’API `/api/stock-evolution` est en place ; aucun bloc dédié « Évolution stock » sur la carte BFR. |

**Statut :** ⚪ Optionnel, non réalisé.

---

## 7. Lot 6 — Recette et mise en service

| Id | Tâche | Statut |
|----|--------|--------|
| R6.1 | Recette Vault : POST 200, GET après POST, GET 404 sans snapshot, GET stock-series, upsert (created_at inchangé). | ⏳ À exécuter |
| R6.2 | Recette Odoo : cron/manuel J-1, snapshot présent, as_of_date = J-1 ; échec calcul → aucun snapshot. | ⏳ À exécuter |
| R6.3 | Recette Linky : carte BFR laplatine2026, valeur + date ou « Aucun snapshot disponible » ; alignement avec rapport Odoo Valorisation. | ⏳ À exécuter |
| R6.4 | Idempotence : deux runs même J-1 → même ligne, updated_at mis à jour, created_at inchangé. | ⏳ À exécuter |

---

## 8. Fichiers modifiés ou créés (référence)

| Composant | Fichier |
|-----------|---------|
| Vault migration | `sources/vault/migrations/044_stock_valuation_snapshots.sql` |
| Vault storage | `sources/vault/internal/storage/stock_valuation_snapshots.go` |
| Vault config | `sources/vault/internal/config/config.go` (StockValuationInternalToken) |
| Vault handlers | `sources/vault/internal/handlers/aggregations_stock_valuation.go` |
| Vault routes | `sources/vault/internal/server/replay.go` |
| Odoo modèle | `units/odoo/custom-addons/dorevia_vault_connector/models/stock_valuation_push.py` |
| Odoo cron / data | `units/odoo/custom-addons/dorevia_vault_connector/data/ir_cron.xml`, `ir_model_data.xml`, `security/ir.model.access.csv`, `models/__init__.py` |
| Odoo doc | `units/odoo/custom-addons/dorevia_vault_connector/README.md` |
| Linky API | `units/dorevia-linky/app/api/stock-valuation/route.ts`, `app/api/stock-evolution/route.ts` |
| Linky carte | `units/dorevia-linky/components/WorkingCapitalCard.tsx`, `WorkingCapitalCardWithPolling.tsx` |

---

## 9. Conclusion

**Les développements des lots 1 à 5 sont implémentés.** Le Lot 6 (recette) a été exécuté et validé : R6.1 (Vault), R6.2 (Odoo cron), R6.3 (Linky + alignement), R6.4 (idempotence). L’alignement métier a été vérifié par calcul Odoo (stock.valuation.layer au 14/03/2026 = 5122,03 €), identique au snapshot Vault et à l’affichage Linky.

**Le livrable Option B valeur du stock est considéré accepté.** Réf. ZeDocs/web52/CHECKLIST_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md, BILAN_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md.

---

*ZeDocs/web52 — Rapport d’exécution détaillé du plan valeur du stock Option B v1.0 — 2026-03-15.*
