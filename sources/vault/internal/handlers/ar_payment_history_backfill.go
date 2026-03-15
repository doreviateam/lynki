package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
)

// ArPaymentHistoryBackfillPayload corps JSON pour POST /ui/ar-payment-history/backfill
type ArPaymentHistoryBackfillPayload struct {
	Tenant    string                       `json:"tenant"`
	CompanyID string                       `json:"company_id"`
	Rows     []ArPaymentHistoryBackfillRow `json:"rows"`
}

// ArPaymentHistoryBackfillRow une ligne facture payée
type ArPaymentHistoryBackfillRow struct {
	PartnerID       string `json:"partner_id"`
	PartnerName     string `json:"partner_name"`
	OdooInvoiceID   int    `json:"odoo_invoice_id"`
	InvoiceDateDue  string `json:"invoice_date_due"`  // YYYY-MM-DD
	PaymentDate     string `json:"payment_date"`     // YYYY-MM-DD
}

// ArPaymentHistoryBackfillHandler gère POST /ui/ar-payment-history/backfill (backfill délai moyen de paiement)
func ArPaymentHistoryBackfillHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}
		var payload ArPaymentHistoryBackfillPayload
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON"})
		}
		if payload.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		companyID := payload.CompanyID
		rows := make([]storage.ArPaymentHistoryRow, 0, len(payload.Rows))
		for _, r := range payload.Rows {
			due, errDue := time.Parse("2006-01-02", r.InvoiceDateDue)
			pay, errPay := time.Parse("2006-01-02", r.PaymentDate)
			if errDue != nil || errPay != nil {
				continue
			}
			rows = append(rows, storage.ArPaymentHistoryRow{
				PartnerID:      r.PartnerID,
				PartnerName:    r.PartnerName,
				OdooInvoiceID:  r.OdooInvoiceID,
				InvoiceDateDue: due,
				PaymentDate:    pay,
			})
		}
		if err := db.UpsertArPaymentHistoryBatch(c.Context(), payload.Tenant, companyID, rows); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(fiber.Map{"ok": true, "upserted": len(rows)})
	}
}
