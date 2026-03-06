# Route GET /ui/aggregations/adjustments

Spec : SPEC_DOREVIA_ADJUSTMENTS_v1.0, ADDENDUM Phase 1. Version : v1.7.0-adjustments.

Le handler et le storage sont dans ce dépôt. Pour exposer l'endpoint, ajouter dans le main qui monte les routes Fiber :

```go
app.Get("/ui/aggregations/adjustments", handlers.AdjustmentsAggregationHandler(db))
```

RBAC : la route est déjà dans internal/auth/rbac.go (PermissionReadDocuments).

Test après déploiement :
curl -s "http://<vault>:8080/ui/aggregations/adjustments?tenant=<tenant>&date_debut=2026-01-01&date_fin=2026-12-31"
