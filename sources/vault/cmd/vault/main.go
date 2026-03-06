package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/doreviateam/dorevia-vault/internal/backfill"
	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/middleware"
	"github.com/doreviateam/dorevia-vault/internal/server"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
	"github.com/gofiber/fiber/v2"
)

func main() {
	// Sous-commande backfill payment-methods (SPEC backfill ventilation Espèces/Banque v1.0)
	if len(os.Args) >= 3 && os.Args[1] == "backfill" && os.Args[2] == "payment-methods" {
		runBackfillPaymentMethods()
		return
	}

	cfg := config.LoadOrDie()
	log := logger.New(cfg.LogLevel)

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	// Middleware X-Trace-Id (extrait ou génère, valide UUID v4, trace_id_source)
	app.Use(middleware.TraceMiddlewareWithLog(log))
	// Middleware X-Tenant (tenant_source pour diagnostic proof not found)
	app.Use(middleware.TenantMiddleware())

	// Routes de base
	app.Get("/", server.Home)
	app.Get("/health", server.Health)
	app.Get("/version", server.Version)

	// Route vault-health pour Linky Integrity Badge (SPEC Indicateur Confiance Vaultage v1.0, SPEC LINKY LAYOUT v1.3)
	app.Get("/ui/system/vault-health", server.VaultHealthHandler(cfg.DvigURL, cfg.DvigInternalToken))

	// Replay ERP (SPEC ERP Reconnect v1.2) — si DB configurée
	var db *storage.DB
	var replayRunner interface{ Stop() }
	if cfg.DatabaseURL != "" {
		ctx := context.Background()
		var err error
		db, err = storage.NewDB(ctx, cfg.DatabaseURL, log)
		if err != nil {
			log.Warn().Err(err).Msg("Database not available, replay routes disabled")
		} else {
			server.RegisterVaultingRoutes(app, db, &cfg, log)
			server.RegisterReplayRoutes(app, db, &cfg, log)
			server.RegisterInvoicesResidualRoute(app, db, log)
			runner := server.StartReplayRunner(ctx, db, &cfg, log)
			if runner != nil {
				replayRunner = runner
			}
		}
	}
	// Routes Linky (treasury ne nécessite pas DB, les autres oui)
	server.RegisterUiAggregations(app, db, &cfg, log)

	// Graceful shutdown
	go func() {
		sigchan := make(chan os.Signal, 1)
		signal.Notify(sigchan, os.Interrupt, syscall.SIGTERM)
		<-sigchan
		log.Info().Msg("Shutting down...")
		if replayRunner != nil {
			replayRunner.Stop()
		}
		if db != nil {
			db.Close()
		}
		if err := app.Shutdown(); err != nil {
			log.Error().Err(err).Msg("Shutdown error")
		}
	}()

	addr := fmt.Sprintf(":%s", config.GetPort())
	log.Info().Str("addr", addr).Msg("Starting Dorevia Vault")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Listen failed")
	}
}

func runBackfillPaymentMethods() {
	fs := flag.NewFlagSet("backfill payment-methods", flag.ExitOnError)
	tenant := fs.String("tenant", "", "Tenant ID (required)")
	odooURL := fs.String("odoo-url", "", "Odoo base URL (required)")
	dryRun := fs.Bool("dry-run", false, "Log only, no INSERT")
	batchSize := fs.Int("batch-size", 50, "Odoo batch size")
	limit := fs.Int("limit", 0, "Max documents (0=all)")
	_ = fs.Parse(os.Args[3:])

	log := logger.New("info")
	if *tenant == "" {
		log.Fatal().Msg("--tenant is required")
	}
	if *odooURL == "" {
		log.Fatal().Msg("--odoo-url is required")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal().Msg("DATABASE_URL is required")
	}

	ctx := context.Background()
	db, err := storage.NewDB(ctx, dbURL, log)
	if err != nil {
		log.Fatal().Err(err).Msg("Database connection failed")
	}
	defer db.Close()

	result, err := backfill.RunPaymentMethodsBackfill(ctx, db, *tenant, *odooURL, *dryRun, *batchSize, *limit, log)
	if err != nil {
		log.Fatal().Err(err).Msg("Backfill failed")
	}
	log.Info().
		Str("tenant", result.Tenant).
		Int("overrides", result.OverridesCreated).
		Int("without_source_id", result.WithoutSourceID).
		Bool("dry_run", *dryRun).
		Dur("duration", result.Duration).
		Msg("Backfill completed")
}
