package server

import (
	"context"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/cache"
	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/replay"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// RegisterInvoicesResidualRoute enregistre POST /api/v1/invoices/residual (SPEC AR by Partner S2.1)
func RegisterInvoicesResidualRoute(app *fiber.App, db *storage.DB, log *zerolog.Logger) {
	if db == nil || log == nil {
		return
	}
	app.Post("/api/v1/invoices/residual", handlers.InvoicesResidualHandler(db, log))
	app.Post("/api/v1/bank-reconciliation/events", handlers.BankReconciliationEventsHandler(db, log))
	app.Post("/api/v1/bank-reconciliation/confirmation-events", handlers.BankReconciliationConfirmationHandler(db, log))
}

// RegisterUiAggregations enregistre les routes Linky (sales, purchases, payments, adjustments, treasury, companies).
// SPEC : ZeDocs/web22, dashboard-metrics, RECONCIL
func RegisterUiAggregations(app *fiber.App, db *storage.DB, cfg *config.Config, log *zerolog.Logger) {
	app.Get("/ui/aggregations/treasury", handlers.TreasuryAggregationHandler(db, cfg.OdooBankReconciliationURL, cfg, log))
	app.Get("/ui/aggregations/payments-completeness", handlers.PaymentsCompletenessHandler(db, cfg.OdooBankReconciliationURL, cfg))
	app.Get("/ui/system/bank-reconciliation-health", handlers.BankReconciliationHealthHandler(cfg.OdooBankReconciliationURL, cfg))
	app.Get("/ui/aggregations/pos-sessions", handlers.PosSessionsAggregationHandler(db))
	app.Get("/ui/aggregations/sales-by-partner", handlers.SalesByPartnerAggregationHandler(db))
	app.Get("/ui/aggregations/ar-by-partner", handlers.ArByPartnerAggregationHandler(db))
	if db == nil {
		return
	}
	app.Get("/ui/aggregations/sales", handlers.SalesAggregationHandler(db))
	app.Get("/ui/aggregations/purchases", handlers.PurchasesAggregationHandler(db))
	app.Get("/ui/aggregations/payments-in", handlers.PaymentsInAggregationHandler(db))
	app.Get("/ui/aggregations/payments-out", handlers.PaymentsOutAggregationHandler(db))
	app.Get("/ui/aggregations/adjustments", handlers.AdjustmentsAggregationHandler(db))
	app.Get("/ui/companies", handlers.CompaniesHandler(db))
	// T2.7 : Cache 5 s pour GET /ui/completeness-snapshot (clé: tenant+company_id+date_debut+date_fin)
	snapshotCache := cache.NewCompletenessSnapshotCache(5 * time.Second)
	app.Get("/ui/completeness-snapshot", handlers.CompletenessSnapshotHandler(db, snapshotCache))
}

// RegisterReplayRoutes enregistre les routes replay ERP (E4-US2, E4-US3, E5, E7-US1)
func RegisterReplayRoutes(app *fiber.App, db *storage.DB, cfg *config.Config, log *zerolog.Logger) {
	if db == nil {
		return
	}

	// E7-US1 : Wizard « Rebrancher un ERP » + page détail job
	app.Get("/replay/wizard", handlers.ReplayWizardHandler)
	app.Get("/replay/jobs/:id", handlers.ReplayJobDetailHandler)

	api := app.Group("/api/v1/replay")
	api.Post("/jobs", handlers.ReplayJobsCreateHandler(db, cfg, log))
	api.Get("/jobs/:id", handlers.ReplayJobGetHandler(db, log))
	api.Get("/jobs/:id/logs", handlers.ReplayJobLogsHandler(db, log))
	api.Get("/jobs/:id/report", handlers.ReplayJobReportHandler(db, log))
	api.Get("/events", handlers.ReplayEventsHandler(db, cfg, log))
	api.Post("/ingest", handlers.ReplayIngestHandler(db, log))
	api.Post("/backfill", handlers.ReplayBackfillHandler(db, log))
}

// StartReplayRunner démarre le Runner (poll jobs queued)
func StartReplayRunner(ctx context.Context, db *storage.DB, cfg *config.Config, log *zerolog.Logger) *replay.Runner {
	if db == nil {
		return nil
	}
	runner := replay.NewRunner(db, cfg, log)
	runner.Start(ctx)
	return runner
}
