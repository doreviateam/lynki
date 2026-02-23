package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/middleware"
	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// EventsPayload représente le format POST /api/v1/events (DVIG format_vault_payload_events)
type EventsPayload struct {
	Tenant        string                 `json:"tenant"`
	EventID       string                 `json:"event_id"`
	IdempotencyKey string                `json:"idempotency_key"`
	Source        map[string]interface{} `json:"source"`
	EventType     string                 `json:"event_type"`
	OccurredAt    string                 `json:"occurred_at"`
	Payload       map[string]interface{} `json:"payload"`
}

// EventsHandler gère POST /api/v1/events — format générique DVIG (fallback pour invoice.posted).
// Pour invoice.posted : crée un document dans la table documents pour que Odoo puisse récupérer la preuve.
func EventsHandler(db *storage.DB, storageDir string, jwsService *crypto.Service, cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		var req EventsPayload
		if err := c.BodyParser(&req); err != nil {
			log.Error().Err(err).Msg("Failed to parse events payload")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON payload",
			})
		}

		tenant := req.Tenant
		if tenant == "" {
			tenant = c.Get("X-Tenant")
		}
		if tenant == "" && req.Source != nil {
			if t, ok := req.Source["tenant"].(string); ok {
				tenant = t
			}
		}
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing tenant (body.tenant, X-Tenant, or source.tenant)",
			})
		}

		switch req.EventType {
		case "invoice.posted":
			return handleInvoicePosted(c, db, storageDir, jwsService, cfg, log, tenant, &req)
		default:
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":       "Unsupported event_type",
				"event_type":  req.EventType,
				"supported":   []string{"invoice.posted"},
			})
		}
	}
}

func handleInvoicePosted(c *fiber.Ctx, db *storage.DB, storageDir string, jwsService *crypto.Service, cfg *config.Config, log *zerolog.Logger, tenant string, req *EventsPayload) error {
	start := time.Now()
	traceID := middleware.GetTraceID(c)
	data := req.Payload
	if data == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing payload",
		})
	}

	odooID, _ := parseOdooID(data["id"])
	if odooID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing payload.id",
		})
	}

	model, _ := data["model"].(string)
	if model == "" {
		model = "account.move"
	}
	moveType, _ := data["move_type"].(string)
	if moveType == "" {
		moveType = "out_invoice"
	}

	source := "sales"
	if moveType == "in_invoice" || moveType == "in_refund" {
		source = "purchase"
	}

	// Contenu = JSON canonique du payload (comme format_vault_payload_invoices)
	payloadJSON, err := json.Marshal(data)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}
	fileContent, _, err := utils.CanonicalJSONAndHash(payloadJSON)
	if err != nil {
		fileContent = payloadJSON
	}

	filename := "document.pdf"
	if name, ok := data["name"].(string); ok && name != "" {
		filename = utils.SanitizeFilename(name + ".pdf")
	}
	if err := utils.ValidateFilename(filename); err != nil {
		filename = "document.pdf"
	}

	docID := uuid.New()
	doc := &models.Document{
		ID:          docID,
		Filename:    filename,
		ContentType: "application/json",
		SizeBytes:   int64(len(fileContent)),
		Source:      &source,
		OdooModel:   &model,
		OdooID:      &odooID,
		OdooState:   strPtr("posted"),
		Tenant:      &tenant,
		MoveType:    &moveType,
	}
	doc.PDPRequired = boolPtr(false)
	doc.DispatchStatus = strPtr("PENDING")
	doc.ComplianceStatus = strPtr("out_of_scope")
	doc.FacturXPresent = boolPtr(false)
	if req.IdempotencyKey != "" {
		doc.IdempotencyKey = &req.IdempotencyKey
	}
	if partnerName, ok := data["partner_name"].(string); ok && partnerName != "" {
		doc.PartnerName = &partnerName
	}
	if number, ok := data["name"].(string); ok && number != "" {
		doc.InvoiceNumber = &number
	}
	if dateStr, ok := data["invoice_date"].(string); ok && dateStr != "" {
		if t, err := time.Parse("2006-01-02", dateStr); err == nil {
			doc.InvoiceDate = &t
		}
	}
	if totalHT, ok := parseFloat(data["amount_untaxed"]); ok {
		doc.TotalHT = &totalHT
	}
	if totalTTC, ok := parseFloat(data["amount_total"]); ok {
		doc.TotalTTC = &totalTTC
	}
	if currency, ok := data["currency"].(string); ok && currency != "" {
		doc.Currency = &currency
	}
	if amountRes, ok := parseFloat(data["amount_residual"]); ok {
		doc.AmountResidual = &amountRes
	}
	if dueStr, ok := data["invoice_date_due"].(string); ok && dueStr != "" {
		if t, err := time.Parse("2006-01-02", dueStr); err == nil {
			doc.InvoiceDateDue = &t
		}
	}
	if pid := extractPartnerID(data["partner_id"]); pid != "" {
		doc.PartnerID = &pid
	}

	ctx := context.Background()
	if storageDir == "" {
		storageDir = "/opt/dorevia-vault/storage"
	}

	var storeErr error
	if (cfg.JWSEnabled && jwsService != nil) || cfg.LedgerEnabled {
		storeErr = db.StoreDocumentWithEvidence(ctx, doc, fileContent, storageDir, jwsService, cfg.JWSEnabled, cfg.JWSRequired, cfg.LedgerEnabled)
	} else {
		storeErr = db.StoreDocumentWithTransaction(ctx, doc, fileContent, storageDir)
	}

	if storeErr != nil {
		if existsErr, ok := storeErr.(storage.ErrDocumentExists); ok {
			existingDoc, err := db.GetDocumentByID(ctx, existsErr.ID)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve existing document"})
			}
			durationMs := int(time.Since(start).Milliseconds())
			log.Info().
				Str("trace_id", traceID).
				Str("trace_id_source", middleware.GetTraceIDSource(c)).
				Str("tenant", tenant).
				Str("tenant_source", middleware.GetTenantSource(c)).
				Str("event_type", req.EventType).
				Str("odoo_model", model).
				Int("odoo_id", odooID).
				Str("document_id", existingDoc.ID.String()).
				Int("duration_ms", durationMs).
				Msg("vault_ingest_idempotent")
			return c.Status(fiber.StatusOK).JSON(fiber.Map{
				"id":       existingDoc.ID.String(),
				"vault_id": existingDoc.ID.String(),
				"message":  "Already ingested",
			})
		}
		log.Error().Err(storeErr).Msg("Store document from events failed")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store document",
		})
	}

	durationMs := int(time.Since(start).Milliseconds())
	log.Info().
		Str("trace_id", traceID).
		Str("trace_id_source", middleware.GetTraceIDSource(c)).
		Str("tenant", tenant).
		Str("tenant_source", middleware.GetTenantSource(c)).
		Str("event_type", req.EventType).
		Str("odoo_model", model).
		Int("odoo_id", odooID).
		Str("document_id", docID.String()).
		Int("duration_ms", durationMs).
		Msg("vault_ingest_ok")

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":       docID.String(),
		"vault_id": docID.String(),
	})
}

func parseOdooID(v interface{}) (int, bool) {
	switch x := v.(type) {
	case float64:
		return int(x), true
	case int:
		return x, true
	case int64:
		return int(x), true
	default:
		return 0, false
	}
}

func parseFloat(v interface{}) (float64, bool) {
	switch x := v.(type) {
	case float64:
		return x, true
	case int:
		return float64(x), true
	case int64:
		return float64(x), true
	default:
		return 0, false
	}
}

func strPtr(s string) *string { return &s }
func boolPtr(b bool) *bool    { return &b }

func extractPartnerID(v interface{}) string {
	if v == nil {
		return ""
	}
	switch x := v.(type) {
	case float64:
		return fmt.Sprintf("%.0f", x)
	case int:
		return fmt.Sprintf("%d", x)
	case int64:
		return fmt.Sprintf("%d", x)
	case []interface{}:
		if len(x) >= 1 {
			switch id := x[0].(type) {
			case float64:
				return fmt.Sprintf("%.0f", id)
			case int:
				return fmt.Sprintf("%d", id)
			}
		}
	}
	return ""
}
