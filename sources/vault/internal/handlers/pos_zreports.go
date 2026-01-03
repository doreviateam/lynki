package handlers

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/ledger/filesystem"
	"github.com/doreviateam/dorevia-vault/internal/metrics"
	"github.com/doreviateam/dorevia-vault/internal/services/zreports"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ZReportPayload représente le payload JSON pour l'endpoint /api/v1/pos/zreports
// Sprint 7 - Phase 4 : Handler HTTP pour Z-Reports
type ZReportPayload struct {
	ZID           string                 `json:"z_id"`
	CompanyID     int                    `json:"company_id"`
	Sequence      int                    `json:"sequence"`
	DateOpen      string                 `json:"date_open"`      // RFC3339
	DateClose     string                 `json:"date_close"`     // RFC3339
	Totals        ZReportTotals          `json:"totals"`
	Payments      []ZReportPayment       `json:"payments"`
	Tickets       []string               `json:"tickets"`
	TicketsCount  int                    `json:"tickets_count"`
	HashPrev      *string                `json:"hash_prev,omitempty"`
	LastTicketHash string                `json:"last_ticket_hash"`
	ChainLevel    string                 `json:"chain_level"`    // "z-report"
	Tenant        string                 `json:"tenant"`
}

// ZReportTotals représente les totaux d'un Z-Report
type ZReportTotals struct {
	AmountTotal float64 `json:"amount_total"`
	AmountTax   float64 `json:"amount_tax"`
	AmountNet   float64 `json:"amount_net"`
}

// ZReportPayment représente un paiement dans un Z-Report
type ZReportPayment struct {
	Method string  `json:"method"`
	Amount float64 `json:"amount"`
}

// ZReportResponse représente la réponse de l'endpoint /api/v1/pos/zreports
type ZReportResponse struct {
	ZID         string    `json:"z_id"`
	Tenant      string    `json:"tenant"`
	HashCurrent string    `json:"hash_current"`
	HashPrev    *string   `json:"hash_prev,omitempty"`
	EvidenceJWS string    `json:"evidence_jws"`
	Timestamp   time.Time `json:"timestamp"`
	ProofURL    string    `json:"proof_url"`
}

// PosZReportsHandler gère l'endpoint POST /api/v1/pos/zreports
func PosZReportsHandler(
	service zreports.ZReportsServiceInterface,
	cfg *config.Config,
	log *zerolog.Logger,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Validation taille (configurable)
		maxSize := cfg.ZReportMaxSizeBytes
		if maxSize == 0 {
			maxSize = 1024 * 1024 // 1 MB par défaut
		}
		if len(c.Body()) > maxSize {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error":          "Payload too large",
				"max_size_bytes": maxSize,
			})
		}

		// Parser le payload
		var payload ZReportPayload
		if err := c.BodyParser(&payload); err != nil {
			log.Error().Err(err).Msg("Failed to parse Z-Report payload")
			// ✅ SÉCURITÉ : Utiliser SafeError
			return utils.NewSafeError(
				"Invalid JSON payload",
				err,
				fiber.StatusBadRequest,
			)
		}

		// ✅ SÉCURITÉ : Validation centralisée
		validator := validators.NewValidator()

		// Récupérer le tenant depuis le header X-Tenant
		headerTenant := c.Get("X-Tenant")
		if headerTenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required header: X-Tenant",
			})
		}
		
		// ✅ SÉCURITÉ : Valider le format du tenant
		if err := validator.ValidateTenant(headerTenant); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Invalid tenant in header: %s", err.Error()),
			})
		}

		// ✅ SÉCURITÉ : Valider les dates
		if err := validator.ValidateDate(payload.DateOpen); err != nil {
			log.Debug().Err(err).Msg("Invalid date_open format")
			return utils.NewSafeError(
				"Invalid date_open format (must be RFC3339)",
				err,
				fiber.StatusBadRequest,
			)
		}
		
		if err := validator.ValidateDate(payload.DateClose); err != nil {
			log.Debug().Err(err).Msg("Invalid date_close format")
			return utils.NewSafeError(
				"Invalid date_close format (must be RFC3339)",
				err,
				fiber.StatusBadRequest,
			)
		}

		// Parser les dates (déjà validées)
		dateOpen, err := time.Parse(time.RFC3339, payload.DateOpen)
		if err != nil {
			// Ne devrait jamais arriver car déjà validé
			return utils.NewSafeError(
				"Invalid date_open format (must be RFC3339)",
				err,
				fiber.StatusBadRequest,
			)
		}

		dateClose, err := time.Parse(time.RFC3339, payload.DateClose)
		if err != nil {
			// Ne devrait jamais arriver car déjà validé
			return utils.NewSafeError(
				"Invalid date_close format (must be RFC3339)",
				err,
				fiber.StatusBadRequest,
			)
		}

		// Convertir les payments
		payments := make([]zreports.Payment, len(payload.Payments))
		for i, p := range payload.Payments {
			payments[i] = zreports.Payment{
				Method: p.Method,
				Amount: p.Amount,
			}
		}

		// Mapper handlers.ZReportPayload → services.ZReportInput
		input := zreports.ZReportInput{
			ZID:           payload.ZID,
			CompanyID:     payload.CompanyID,
			Sequence:      payload.Sequence,
			DateOpen:      dateOpen,
			DateClose:     dateClose,
			Totals:        zreports.Totals(payload.Totals),
			Payments:      payments,
			Tickets:       payload.Tickets,
			TicketsCount:  payload.TicketsCount,
			HashPrev:      payload.HashPrev,
			LastTicketHash: payload.LastTicketHash,
			ChainLevel:    payload.ChainLevel,
			Tenant:        payload.Tenant,
		}

		// Appeler le service
		ctx := context.Background()
		startTime := time.Now()
		result, err := service.Ingest(ctx, headerTenant, input)
		duration := time.Since(startTime).Seconds()

		if err != nil {
			// Gérer les erreurs selon le type
			log.Error().
				Err(err).
				Str("tenant", headerTenant).
				Str("z_id", payload.ZID).
				Float64("duration_seconds", duration).
				Msg("Failed to ingest Z-Report")

			// Métrique d'erreur
			metrics.RecordDocumentVaulted("error", "z-report")
			metrics.RecordDocumentStorageDuration("zreport_ingest", duration)
			metrics.RecordZReportIngested("error", headerTenant)
			metrics.RecordZReportStorageDuration(headerTenant, duration)

			// Vérifier si c'est une erreur de validation
			var valErr zreports.ValidationError
			if errors.As(err, &valErr) {
				// ✅ SÉCURITÉ : Utiliser SafeError (les erreurs de validation sont déjà sécurisées)
				return utils.NewSafeError(
					"Validation failed",
					err,
					fiber.StatusBadRequest,
				)
			}

			// ✅ SÉCURITÉ : Erreur générique sans détails
			errorResponse := fiber.Map{
				"error": "Failed to ingest Z-Report",
			}
			// Les détails sont loggés côté serveur, pas retournés au client
			return c.Status(fiber.StatusInternalServerError).JSON(errorResponse)
		}

		// Logs structurés
		logEntry := log.Info().
			Str("tenant", result.Tenant).
			Str("z_id", result.ZID).
			Str("hash_current", result.HashCurrent).
			Float64("duration_seconds", duration)

		if result.HashPrev != nil {
			logEntry = logEntry.Str("hash_prev", *result.HashPrev)
		}

		logEntry.Msg("Z-Report ingested")

		// Métriques Prometheus
		metrics.RecordDocumentVaulted("success", "z-report")
		metrics.RecordDocumentStorageDuration("zreport_ingest", duration)
		metrics.RecordZReportIngested("success", result.Tenant)
		metrics.RecordZReportStorageDuration(result.Tenant, duration)

		// Retourner la réponse standardisée
		return c.Status(fiber.StatusCreated).JSON(ZReportResponse{
			ZID:         result.ZID,
			Tenant:      result.Tenant,
			HashCurrent: result.HashCurrent,
			HashPrev:    result.HashPrev,
			EvidenceJWS: result.EvidenceJWS,
			Timestamp:   result.Timestamp,
			ProofURL:    result.ProofURL,
		})
	}
}

// GetZReportEvidence gère GET /api/v1/evidence/:tenant/:z_id
func GetZReportEvidence(
	ledger filesystem.ZReportLedger,
	log *zerolog.Logger,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Params("tenant")
		zID := c.Params("z_id")

		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing tenant parameter",
			})
		}

		if zID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing z_id parameter",
			})
		}

		// Récupérer le Z-Report depuis le ledger
		ctx := context.Background()
		zReport, err := ledger.GetZReport(ctx, tenant, zID)
		if err != nil {
			log.Error().Err(err).Str("tenant", tenant).Str("z_id", zID).Msg("Failed to get Z-Report")
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Z-Report not found",
			})
		}

		if zReport == nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Z-Report not found",
			})
		}

		// Retourner le JWS (evidence)
		// Note: Le JWS n'est pas stocké dans le Z-Report filesystem
		// Il faudrait soit le stocker, soit le régénérer depuis les données
		// Pour l'instant, on retourne les informations du Z-Report
		return c.JSON(fiber.Map{
			"z_id":         zReport.Payload.ZID,
			"tenant":       zReport.Payload.Tenant,
			"hash_current": zReport.HashCurrent,
			"hash_prev":    zReport.HashPrev,
			"timestamp":    zReport.Timestamp,
			"proof_url":    zReport.ProofURL,
			"note":         "JWS evidence should be retrieved from the service or stored in the Z-Report",
		})
	}
}

// GetZReportsHealth gère GET /api/v1/health/zreports
func GetZReportsHealth(
	ledger filesystem.ZReportLedger,
	cfg *config.Config,
	log *zerolog.Logger,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Vérifier l'accès au ledger filesystem
		ledgerPath := cfg.LedgerFilesystemPath
		if ledgerPath == "" {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "unhealthy",
				"reason": "Ledger filesystem path not configured",
			})
		}

		// Vérifier que le répertoire existe et est accessible
		// (on pourrait faire un test d'écriture/lecture)
		status := "healthy"

		// Pour l'instant, on retourne juste un statut basique
		// TODO: Faire un test réel d'accès au filesystem
		return c.JSON(fiber.Map{
			"status":        status,
			"ledger_path":   ledgerPath,
			"fsync_enabled": cfg.ZReportFsyncEnabled,
		})
	}
}

