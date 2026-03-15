package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// PayrollIngestPayload représente le body POST /api/v1/payroll
// Émis par DVIG depuis l'événement payroll.charge.posted (Odoo hr.payslip).
type PayrollIngestPayload struct {
	// Identification
	Name         string `json:"name"`           // Référence bulletin (ex: SLIP/2026/03/001)
	EmployeeID   int    `json:"employee_id"`
	EmployeeName string `json:"employee_name"`
	// Montants (EUR)
	TotalCharges float64 `json:"total_charges"` // Coût total employeur → stocké dans total_ht
	NetSalary    float64 `json:"net_salary"`
	EmployerCost float64 `json:"employer_cost"`
	Currency     string  `json:"currency"`
	// Période de paie
	DateFrom  string `json:"date_from"`  // YYYY-MM-DD — stocké dans invoice_date
	DateTo    string `json:"date_to"`
	CompanyID int    `json:"company_id"`
	// Idempotence
	IdempotencyKey string `json:"idempotency_key"`
}

// PayrollIngestHandler gère POST /api/v1/payroll
// Persiste les charges de personnel dans la table documents (odoo_model = 'hr.payslip').
// SPEC DVIG Event Registry v1.0 §3.6 — alimenté par payroll.charge.posted.
func PayrollIngestHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		tenant := c.Get("X-Tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing X-Tenant header",
			})
		}

		var p PayrollIngestPayload
		if err := c.BodyParser(&p); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON body",
			})
		}

		if p.Name == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "name (payslip reference) is required",
			})
		}
		if p.TotalCharges <= 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "total_charges must be > 0",
			})
		}
		if p.DateFrom == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "date_from is required",
			})
		}

		invoiceDate, err := time.Parse("2006-01-02", p.DateFrom)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid date_from (use YYYY-MM-DD)",
			})
		}

		if p.Currency == "" {
			p.Currency = "EUR"
		}

		// Calcul clé d'idempotence si non fournie
		if p.IdempotencyKey == "" {
			canonical := fmt.Sprintf("payroll:%s:%s:%s:%.2f", tenant, p.Name, p.DateFrom, p.TotalCharges)
			p.IdempotencyKey = fmt.Sprintf("%x", sha256.Sum256([]byte(canonical)))
		}

		// Sérialisation JSON pour storage
		payloadJSON, _ := json.Marshal(p)
		contentType := "application/json"
		odooModel := "hr.payslip"
		odooState := "done"
		source := "payroll"
		moveType := "payroll_charge"
		currency := p.Currency
		totalCharges := p.TotalCharges
		complianceStatus := "out_of_scope" // Bulletins hors champ Factur-X
		facturXPresent := false
		invoiceNumber := p.Name
		tenantRef := tenant

		var companyIDStr *string
		if p.CompanyID > 0 {
			s := fmt.Sprintf("odoo:%d", p.CompanyID)
			companyIDStr = &s
		}

		// SHA256 du payload (idempotence)
		hashBytes := sha256.Sum256(payloadJSON)
		hashHex := fmt.Sprintf("%x", hashBytes)

		doc := &models.Document{
			ID:               uuid.New(),
			Filename:         p.Name + ".json",
			ContentType:      contentType,
			SizeBytes:        int64(len(payloadJSON)),
			SHA256Hex:        hashHex,
			StoredPath:       "",
			CreatedAt:        time.Now().UTC(),
			Source:           &source,
			OdooModel:        &odooModel,
			OdooID:           &p.EmployeeID,
			OdooState:        &odooState,
			InvoiceNumber:    &invoiceNumber,
			InvoiceDate:      &invoiceDate,
			TotalHT:          &totalCharges,
			TotalTTC:         &totalCharges,
			Currency:         &currency,
			PayloadJSON:      payloadJSON,
			Tenant:           &tenantRef,
			MoveType:         &moveType,
			ComplianceStatus: &complianceStatus,
			FacturXPresent:   &facturXPresent,
			IdempotencyKey:   &p.IdempotencyKey,
			CompanyID:        companyIDStr,
		}
		if p.EmployeeName != "" {
			doc.PartnerName = &p.EmployeeName
		}

		ctx := context.Background()
		if err := db.StoreDocumentWithTransaction(ctx, doc, payloadJSON, ""); err != nil {
			if log != nil {
				log.Error().Err(err).Str("tenant", tenant).Str("name", p.Name).Msg("payroll ingest: store failed")
			}
			// Idempotence : document déjà existant = OK
			errMsg := err.Error()
			if len(errMsg) > 20 && (errMsg[len(errMsg)-20:] == "duplicate key value" || contains(errMsg, "duplicate") || contains(errMsg, "unique")) {
				return c.Status(fiber.StatusOK).JSON(fiber.Map{
					"status":          "already_ingested",
					"idempotency_key": p.IdempotencyKey,
				})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to store payroll event",
			})
		}

		if log != nil {
			log.Info().
				Str("tenant", tenant).
				Str("name", p.Name).
				Float64("total_charges", p.TotalCharges).
				Str("date_from", p.DateFrom).
				Msg("payroll ingested")
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"status":          "ingested",
			"document_id":     doc.ID.String(),
			"idempotency_key": p.IdempotencyKey,
			"total_charges":   p.TotalCharges,
			"currency":        p.Currency,
		})
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 ||
		func() bool {
			for i := 0; i <= len(s)-len(sub); i++ {
				if s[i:i+len(sub)] == sub {
					return true
				}
			}
			return false
		}())
}
