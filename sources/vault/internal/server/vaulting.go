package server

import (
	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/handlers"
	"github.com/doreviateam/dorevia-vault/internal/ledger"
	"github.com/doreviateam/dorevia-vault/internal/services"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// RegisterVaultingRoutes enregistre les routes de vaultage (invoices, proof) pour le flux Odoo → DVIG → Vault.
// Ces routes sont requises pour que les factures soient ingérées et que Odoo puisse récupérer les preuves.
func RegisterVaultingRoutes(app *fiber.App, db *storage.DB, cfg *config.Config, log *zerolog.Logger) {
	if db == nil {
		log.Warn().Msg("Vaulting routes disabled: database not configured")
		return
	}

	// JWS service (optionnel — nil si clés absentes)
	var jwsService *crypto.Service
	if cfg.JWSPrivateKeyPath != "" && cfg.JWSPublicKeyPath != "" {
		var err error
		jwsService, err = crypto.NewService(cfg.JWSPrivateKeyPath, cfg.JWSPublicKeyPath, cfg.JWSKID)
		if err != nil {
			log.Warn().Err(err).Msg("JWS service not available, invoices will run without signature")
		}
	}

	storageDir := cfg.StorageDir
	if storageDir == "" {
		storageDir = "/opt/dorevia-vault/storage"
	}

	// POST /api/v1/invoices — Ingestion factures Odoo (DVIG worker, format invoices)
	app.Post("/api/v1/invoices", handlers.InvoicesHandler(db, storageDir, jwsService, cfg, log, nil, nil))

	// POST /api/v1/events — Format générique DVIG (fallback invoice.posted, SPEC v1.1)
	app.Post("/api/v1/events", handlers.EventsHandler(db, storageDir, jwsService, cfg, log))

	// POST /api/v1/payments — Ingestion paiements Odoo (DVIG worker, payment.posted)
	repo := storage.NewPostgresRepository(db.Pool, log)
	ledgerService := ledger.NewService()
	var signer crypto.Signer
	if jwsService != nil {
		signer = crypto.NewLocalSigner(jwsService)
	} else {
		signer = crypto.NewNoOpSigner()
	}
	paymentsService := services.NewPaymentsService(repo, ledgerService, signer)
	app.Post("/api/v1/payments", handlers.PaymentsHandler(paymentsService, cfg, log))

	// GET /api/v1/proof/* — Récupération preuves par ID Odoo (Odoo cron / action Sécuriser)
	proofGroup := app.Group("/api/v1/proof")
	proofGroup.Get("/account_move/:id", handlers.GetProofAccountMove(db, jwsService, log))
	proofGroup.Get("/account_payment/:id", handlers.GetProofAccountPayment(db, jwsService))
	proofGroup.Get("/pos_order/:id", handlers.GetProofPosOrder(db, jwsService))
	proofGroup.Get("/pos_payment/:id", handlers.GetProofPosPayment(db, jwsService))
	proofGroup.Post("/bulk", handlers.GetProofsBulk(db))

	// POST /api/v1/expected-counts — Phase DVIG : déclaration comptages attendus (Odoo → DVIG → Vault)
	app.Post("/api/v1/expected-counts", handlers.ExpectedCountsHandler(db))

	log.Info().Msg("Vaulting routes enabled: /api/v1/invoices, /api/v1/events, /api/v1/payments, /api/v1/proof/*, /api/v1/expected-counts")
}
