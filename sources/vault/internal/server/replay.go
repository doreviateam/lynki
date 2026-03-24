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
// SPEC : ZeDocs/web22, dashboard-metrics, RECONCIL. ADR-001 (ZeDocs/web51) : gateway /ui/dlp/*, /ui/diva/*.
func RegisterUiAggregations(app *fiber.App, db *storage.DB, cfg *config.Config, log *zerolog.Logger) {
	// Gateway DLP/DIVA (ADR-001 ZeDocs/web51) — exposé même sans DB
	if cfg != nil && log != nil {
		app.Get("/ui/dlp/energy-summary", handlers.DLPEnergySummaryHandler(cfg, log))
		// Lot 3 — admin DLP
		app.Get("/ui/dlp/companies", handlers.DLPProxyHandler(cfg, log, "/api/v1/companies", "GET"))
		app.Post("/ui/dlp/companies", handlers.DLPProxyHandler(cfg, log, "/api/v1/companies", "POST"))
		app.Get("/ui/dlp/dlps", handlers.DLPProxyHandler(cfg, log, "/api/v1/dlps", "GET"))
		app.Post("/ui/dlp/dlps", handlers.DLPProxyHandler(cfg, log, "/api/v1/dlps", "POST"))
		app.Get("/ui/dlp/dlps/:id", handlers.DLPProxyIDHandler(cfg, log, "/api/v1/dlps/", "id", "GET"))
		app.Patch("/ui/dlp/dlps/:id", handlers.DLPProxyIDHandler(cfg, log, "/api/v1/dlps/", "id", "PATCH"))
		app.Get("/ui/dlp/perimeters", handlers.DLPProxyHandler(cfg, log, "/api/v1/perimeters", "GET"))
		app.Post("/ui/dlp/perimeters", handlers.DLPProxyHandler(cfg, log, "/api/v1/perimeters", "POST"))
		app.Patch("/ui/dlp/perimeters/:id", handlers.DLPProxyIDHandler(cfg, log, "/api/v1/perimeters/", "id", "PATCH"))
		app.Get("/ui/dlp/project-perimeter-map", handlers.DLPProxyHandler(cfg, log, "/api/v1/project-perimeter-map", "GET"))
		app.Post("/ui/dlp/project-perimeter-map", handlers.DLPProxyHandler(cfg, log, "/api/v1/project-perimeter-map", "POST"))
		app.Delete("/ui/dlp/project-perimeter-map/:id", handlers.DLPProxyIDHandler(cfg, log, "/api/v1/project-perimeter-map/", "id", "DELETE"))
		app.Get("/ui/diva/insights", handlers.DIVAInsightsHandler(cfg, log))
		app.Post("/ui/diva/generate", handlers.DIVAGenerateHandler(cfg, log))
		app.Post("/ui/diva/explain", handlers.DIVAExplainHandler(cfg, log))
		app.Post("/ui/diva/explain/async", handlers.DIVAExplainAsyncHandler(cfg, log))
		app.Get("/ui/diva/jobs/:contextHash", handlers.DIVAJobsHandler(cfg, log))
		app.Post("/ui/diva/activity", handlers.DIVAActivityHandler(cfg, log))
		app.Get("/ui/diva/activity", handlers.DIVAGetActivityHandler(cfg, log))
	}
	app.Get("/ui/aggregations/treasury", handlers.TreasuryAggregationHandler(db, cfg.OdooBankReconciliationURL, cfg, log))
	app.Get("/ui/aggregations/payments-completeness", handlers.PaymentsCompletenessHandler(db, cfg.OdooBankReconciliationURL, cfg))
	app.Get("/ui/system/bank-reconciliation-health", handlers.BankReconciliationHealthHandler(cfg.OdooBankReconciliationURL, cfg))
	app.Get("/ui/aggregations/pos-sessions", handlers.PosSessionsAggregationHandler(db))
	app.Get("/ui/aggregations/sales-by-partner", handlers.SalesByPartnerAggregationHandler(db))
	app.Get("/ui/aggregations/ar-by-partner", handlers.ArByPartnerAggregationHandler(db))
	app.Post("/ui/ar-payment-history/backfill", handlers.ArPaymentHistoryBackfillHandler(db))
	app.Get("/ui/aggregations/ap-by-partner", handlers.ApByPartnerAggregationHandler(db))
	app.Get("/ui/aggregations/payroll", handlers.PayrollAggregationHandler(db, log))
	if db == nil {
		return
	}
	app.Get("/ui/aggregations/treasury-series", handlers.TreasurySeriesHandler(db))
	app.Post("/ui/jobs/treasury-snapshot", handlers.TreasurySnapshotJobHandler(db, cfg.OdooBankReconciliationURL, cfg, log))
	app.Get("/ui/aggregations/ar-series", handlers.ArSeriesHandler(db))
	app.Post("/ui/jobs/ar-snapshot", handlers.ArSnapshotJobHandler(db, log))
	app.Get("/ui/aggregations/bfr-series", handlers.BfrSeriesHandler(db))
	app.Post("/ui/jobs/ap-snapshot", handlers.ApSnapshotJobHandler(db, log))
	// ZeDocs/web52 Option B — Valeur du stock (snapshots J-1, spec v1.1)
	app.Post("/internal/stock-valuation-snapshot", handlers.StockValuationSnapshotPostHandler(db, cfg, log))
	app.Get("/ui/aggregations/stock-valuation", handlers.StockValuationHandler(db))
	app.Get("/ui/aggregations/stock-series", handlers.StockSeriesHandler(db))
	app.Get("/ui/aggregations/sales", handlers.SalesAggregationHandler(db))
	app.Get("/ui/aggregations/purchases", handlers.PurchasesAggregationHandler(db))
	app.Get("/ui/aggregations/payments-in", handlers.PaymentsInAggregationHandler(db))
	app.Get("/ui/aggregations/payments-out", handlers.PaymentsOutAggregationHandler(db))
	app.Get("/ui/aggregations/adjustments", handlers.AdjustmentsAggregationHandler(db))
	app.Get("/ui/companies", handlers.CompaniesHandler(db))
	// T2.7 : Cache 5 s pour GET /ui/completeness-snapshot (clé: tenant+company_id+date_debut+date_fin)
	snapshotCache := cache.NewCompletenessSnapshotCache(5 * time.Second)
	app.Get("/ui/completeness-snapshot", handlers.CompletenessSnapshotHandler(db, snapshotCache))
	// Lynki Phase 2 — GET /api/accounting/trial-balance → lynki.accounting.trial_balance (PLAN_SPRINT_02 T11)
	app.Get("/api/accounting/trial-balance", handlers.TrialBalanceHandler(db, log))
	// Lynki Phase 2 — GET /api/accounting/general-ledger → lynki.accounting.general_ledger (PLAN_SPRINT_03 T17)
	app.Get("/api/accounting/general-ledger", handlers.GeneralLedgerHandler(db, log))
	// Lynki Phase 2 — GET /api/accounting/trial-balance/export → CSV (Sprint 04 T24)
	app.Get("/api/accounting/trial-balance/export", handlers.TrialBalanceExportHandler(db, log))
	// Lynki Phase 2 — GET /api/accounting/general-ledger/export → CSV (Sprint 05 T29)
	app.Get("/api/accounting/general-ledger/export", handlers.GeneralLedgerExportHandler(db, log))
	// Sprint 07 — Bilan / CR premier incrément (agrégation par classe PCG)
	app.Get("/api/accounting/balance-sheet", handlers.BalanceSheetHandler(db, log))
	app.Get("/api/accounting/income-statement", handlers.IncomeStatementHandler(db, log))
	// Sprint 08 — Bilan / CR par rubriques PCG (REFERENTIEL §9–§10)
	app.Get("/api/accounting/balance-sheet/rubrics", handlers.BalanceSheetRubricsHandler(db, log))
	app.Get("/api/accounting/income-statement/rubrics", handlers.IncomeStatementRubricsHandler(db, log))
	app.Get("/api/accounting/balance-sheet/rubrics/export", handlers.BalanceSheetRubricsExportHandler(db, log))
	app.Get("/api/accounting/income-statement/rubrics/export", handlers.IncomeStatementRubricsExportHandler(db, log))
	// Sprint 09 — Balances tiers (REFERENTIEL §11–§12)
	app.Get("/api/accounting/aged-receivables", handlers.AgedReceivablesHandler(db, log))
	app.Get("/api/accounting/aged-payables", handlers.AgedPayablesHandler(db, log))

	// Sprint 10 — Exports balances tiers CSV (T57)
	app.Get("/api/accounting/aged-receivables/export", handlers.AgedReceivablesExportHandler(db, log))
	app.Get("/api/accounting/aged-payables/export", handlers.AgedPayablesExportHandler(db, log))

	// Sprint 13 T72 — Calendrier comptable aligné ERP
	app.Get("/api/accounting/periods", handlers.AccountingPeriodsHandler(db, log))
	app.Post("/api/accounting/periods/sync", handlers.AccountingPeriodsSyncHandler(db, log))

	// Sprint 14 T80 — Historisation FactsPack
	app.Post("/api/accounting/facts-pack/archive", handlers.FactsPackArchiveHandler(db, log))
	app.Get("/api/accounting/facts-pack/:hash", handlers.FactsPackGetHandler(db, log))

	// Sprint 15 T86 — Purge rétention 90j FactsPack (Bearer token, cron plateforme)
	app.Post("/internal/jobs/facts-pack-purge", handlers.FactsPackPurgeJobHandler(db, cfg, log))
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
