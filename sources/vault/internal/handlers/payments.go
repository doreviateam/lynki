package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/metrics"
	"github.com/doreviateam/dorevia-vault/internal/services"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// PaymentPayload représente le payload JSON pour l'endpoint /api/v1/payments
// Note: Ce type est utilisé uniquement dans le handler. Le service utilise services.PaymentInput
type PaymentPayload struct {
	Tenant           string                 `json:"tenant"`            // Obligatoire
	SourceSystem     string                 `json:"source_system"`     // Défaut: "odoo"
	SourceModel      string                 `json:"source_model"`      // Obligatoire
	SourceID         string                 `json:"source_id"`         // Obligatoire
	PaymentDate      string                 `json:"payment_date"`      // Obligatoire (RFC3339)
	Amount           float64                `json:"amount"`            // Obligatoire
	Currency         string                 `json:"currency"`          // Obligatoire
	Method           string                 `json:"method"`            // Obligatoire
	Source           string                 `json:"source"`            // Obligatoire
	PaymentDirection string                 `json:"payment_direction"` // Obligatoire
	IsRefund         bool                   `json:"is_refund"`         // Obligatoire
	CompanyID        int                    `json:"company_id"`        // Obligatoire
	Payment          map[string]interface{} `json:"payment"`           // Obligatoire (JSON brut)
}

// PaymentResponse représente la réponse standardisée
type PaymentResponse struct {
	ID          string    `json:"id"`
	Tenant      string    `json:"tenant"`
	SHA256Hex   string    `json:"sha256_hex"`
	LedgerHash  *string   `json:"ledger_hash,omitempty"`
	EvidenceJWS *string   `json:"evidence_jws,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// PaymentsHandler gère l'endpoint POST /api/v1/payments
func PaymentsHandler(
	service services.PaymentsServiceInterface,
	cfg *config.Config,
	log *zerolog.Logger,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Validation taille (configurable)
		maxSize := cfg.PaymentMaxSizeBytes
		if maxSize == 0 {
			maxSize = 64 * 1024 // 64 KB par défaut
		}
		if len(c.Body()) > maxSize {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error":          "Payload too large",
				"max_size_bytes": maxSize,
			})
		}

		// Parser le payload
		var payload PaymentPayload
		if err := c.BodyParser(&payload); err != nil {
			log.Error().Err(err).Msg("Failed to parse payment payload")
			// ✅ SÉCURITÉ : Utiliser SafeError pour ne pas exposer les détails
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

		// Validation des champs obligatoires
		if payload.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: tenant",
			})
		}

		// Vérifier cohérence tenant
		if payload.Tenant != headerTenant {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Tenant mismatch: header X-Tenant (%s) does not match payload.tenant (%s)", headerTenant, payload.Tenant),
			})
		}

		if payload.SourceModel == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: source_model",
			})
		}
		if payload.SourceID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: source_id",
			})
		}
		if payload.PaymentDate == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: payment_date",
			})
		}
		if payload.Amount <= 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "amount must be greater than 0",
			})
		}
		if payload.Currency == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: currency",
			})
		}
		if payload.Method == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: method",
			})
		}
		if payload.Source == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: source",
			})
		}
		if payload.PaymentDirection == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: payment_direction",
			})
		}
		if payload.Payment == nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing required field: payment",
			})
		}

		// Validation des valeurs autorisées
		validMethods := map[string]bool{
			"cash":     true,
			"card":     true,
			"mixed":    true,
			"check":    true,
			"transfer": true,
			"other":    true,
		}
		if !validMethods[payload.Method] {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Invalid method: %s (must be one of: cash, card, mixed, check, transfer, other)", payload.Method),
			})
		}

		validSources := map[string]bool{
			"pos":     true,
			"account": true,
		}
		if !validSources[payload.Source] {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Invalid source: %s (must be one of: pos, account)", payload.Source),
			})
		}

		validDirections := map[string]bool{
			"inbound":  true,
			"outbound": true,
		}
		if !validDirections[payload.PaymentDirection] {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Invalid payment_direction: %s (must be one of: inbound, outbound)", payload.PaymentDirection),
			})
		}

		// Validation du format de date
		if _, err := time.Parse(time.RFC3339, payload.PaymentDate); err != nil {
			log.Debug().Err(err).Msg("Invalid payment date format")
			// ✅ SÉCURITÉ : Utiliser SafeError pour ne pas exposer les détails
			return utils.NewSafeError(
				"Invalid payment_date format (must be RFC3339)",
				err,
				fiber.StatusBadRequest,
			)
		}

		// Valeur par défaut pour source_system
		if payload.SourceSystem == "" {
			payload.SourceSystem = "odoo"
		}

		// Mapper handlers.PaymentPayload → services.PaymentInput
		input := services.PaymentInput{
			Tenant:           payload.Tenant,
			SourceSystem:     payload.SourceSystem,
			SourceModel:      payload.SourceModel,
			SourceID:         payload.SourceID,
			PaymentDate:      payload.PaymentDate,
			Amount:           payload.Amount,
			Currency:         payload.Currency,
			Method:           payload.Method,
			Source:           payload.Source,
			PaymentDirection: payload.PaymentDirection,
			IsRefund:         payload.IsRefund,
			CompanyID:        payload.CompanyID,
			Payment:          payload.Payment,
		}

		// Appeler le service
		ctx := context.Background()
		startTime := time.Now()
		result, err := service.Ingest(ctx, input)
		duration := time.Since(startTime).Seconds()

		if err != nil {
			// Gérer les erreurs selon le type
			log.Error().
				Err(err).
				Str("tenant", payload.Tenant).
				Str("source_model", payload.SourceModel).
				Str("source_id", payload.SourceID).
				Float64("duration_seconds", duration).
				Msg("Failed to ingest payment")

			// Métrique d'erreur
			metrics.RecordDocumentVaulted("error", "payment")
			metrics.RecordDocumentStorageDuration("payment_ingest", duration)

			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to ingest payment",
			})
		}

		// Déterminer le statut (idempotent si le document existait déjà)
		status := "success"
		if result.CreatedAt.Before(startTime.Add(-100 * time.Millisecond)) {
			// Si le document a été créé avant notre appel, c'est un cas idempotent
			status = "idempotent"
		}

		// Extraire correlation_id depuis Payment pour traçabilité DVIG
		var correlationID string
		if payload.Payment != nil {
			if cid, ok := payload.Payment["correlation_id"].(string); ok {
				correlationID = cid
			}
		}

		// Logs structurés
		logEntry := log.Info().
			Str("tenant", result.Tenant).
			Str("source_model", payload.SourceModel).
			Str("source_id", payload.SourceID).
			Str("document_id", result.ID.String()).
			Str("sha256_hex", result.SHA256Hex).
			Float64("duration_seconds", duration)

		// Ajouter correlation_id si présent (DVIG traçabilité)
		if correlationID != "" {
			logEntry = logEntry.Str("correlation_id", correlationID)
		}

		if result.LedgerHash != nil {
			logEntry = logEntry.Str("ledger_hash", *result.LedgerHash)
		}
		if result.EvidenceJWS != nil {
			logEntry = logEntry.Str("evidence_jws", *result.EvidenceJWS)
		}

		logEntry.Msg("Payment ingested")

		// Métriques Prometheus
		metrics.RecordDocumentVaulted(status, "payment")
		metrics.RecordDocumentStorageDuration("payment_ingest", duration)

		// Retourner la réponse standardisée
		statusCode := fiber.StatusCreated
		if status == "idempotent" {
			// Pour idempotence, on retourne 200 OK au lieu de 201 Created
			statusCode = fiber.StatusOK
		}

		return c.Status(statusCode).JSON(PaymentResponse{
			ID:          result.ID.String(),
			Tenant:      result.Tenant,
			SHA256Hex:   result.SHA256Hex,
			LedgerHash:  result.LedgerHash,
			EvidenceJWS: result.EvidenceJWS,
			CreatedAt:   result.CreatedAt,
		})
	}
}

// GetPayment gère GET /api/v1/payments -> 405 Method Not Allowed
// Retourne une erreur claire avec header Allow: POST
func GetPayment(c *fiber.Ctx) error {
	c.Set("Allow", "POST")
	return c.Status(fiber.StatusMethodNotAllowed).JSON(fiber.Map{
		"error":   "Method Not Allowed",
		"message": "Only POST method is allowed for /api/v1/payments",
	})
}
