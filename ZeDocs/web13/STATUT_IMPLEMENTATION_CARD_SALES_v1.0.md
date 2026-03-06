# Statut d’implémentation — Card Ventes certifiées (SPEC_DOREVIA_UI_CARD_SALES_v1.0)

**Dernière mise à jour** : suite implémentation backend + plan + checklist Appsmith.

---

## ✅ Fait

| Élément | Fichier / détail |
|--------|-------------------|
| Spec card | `SPEC_DOREVIA_UI_CARD_SALES_v1.0.md` |
| Plan d’implémentation | `PLAN_IMPLEMENTATION_SPEC_DOREVIA_UI_CARD_SALES_v1.0.md` |
| Modèle réponse API | `sources/vault/internal/models/aggregations.go` (SalesAggregationResponse, SeriesPoint) |
| Storage agrégation ventes | `sources/vault/internal/storage/aggregations_sales.go` (SalesAggregation) |
| Handler GET /ui/aggregations/sales | `sources/vault/internal/handlers/aggregations_sales.go` |
| RBAC | `sources/vault/internal/auth/rbac.go` — route `/ui/aggregations/sales` → PermissionReadDocuments |
| Tests unitaires handler | `sources/vault/tests/unit/aggregations_sales_test.go` (sans DB, params manquants) |
| Checklist Appsmith | `CHECKLIST_APPSMITH_CARD_VENTES_CERTIFIEES_v1.0.md` |

---

## ⏳ À faire

| # | Tâche | Responsable / note |
|---|--------|---------------------|
| 1 | Enregistrer la route dans le point d’entrée Vault | Le binaire est construit via `./cmd/vault` (Dockerfile) ; ce répertoire n’est pas présent dans le dépôt actuel. À ajouter dans le main qui monte les routes : `app.Get("/ui/aggregations/sales", handlers.SalesAggregationHandler(db))`. |
| 2 | Déployer Vault avec la nouvelle route | Rebuild image, redémarrage conteneur. |
| 3 | Tester l’endpoint en conditions réelles | `GET .../ui/aggregations/sales?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-02-06&granularity=month` |
| 4 | Créer la card dans Appsmith | Suivre `CHECKLIST_APPSMITH_CARD_VENTES_CERTIFIEES_v1.0.md` (API, widgets, filtres). |

---

## Prochain pas recommandé

1. **Si vous avez accès au code qui enregistre les routes Vault** (autre dépôt, autre branche, ou `cmd/vault` à créer) : y ajouter la ligne pour `/ui/aggregations/sales`.
2. **Sinon** : déployer le code actuel (handler + storage + RBAC sont prêts), puis ajouter la route au moment où vous modifiez le bootstrap Vault.
3. Ensuite : test manuel de l’API puis mise en place de la card dans Appsmith.

---

Version : v1.0
