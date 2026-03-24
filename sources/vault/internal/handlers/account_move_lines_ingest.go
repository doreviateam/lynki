package handlers

import (
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
)

// AccountMoveLinePayload une écriture comptable (body ingestion POST /api/v1/account-move-lines).
type AccountMoveLinePayload struct {
	MoveID           int     `json:"move_id"`
	LineID           int     `json:"line_id"`
	LineDate         string  `json:"line_date"`    // YYYY-MM-DD
	AccountCode      string  `json:"account_code"`
	JournalCode      string  `json:"journal_code"` // ex. BNK1, VEN, ACH, OD — traçabilité couverture
	Debit            float64 `json:"debit"`
	Credit           float64 `json:"credit"`
	Currency         string  `json:"currency"`
	State            string  `json:"state"`         // seul "posted" est accepté
	CompanyID        *int    `json:"company_id,omitempty"`
	PartnerID        *int    `json:"partner_id,omitempty"`        // Sprint 07 T37
	PartnerName      string  `json:"partner_name,omitempty"`      // Sprint 07 T37
	DateMaturity     *string `json:"date_maturity,omitempty"`     // Sprint 11 T63 — YYYY-MM-DD nullable
	FullReconcileID  *int    `json:"full_reconcile_id,omitempty"` // Sprint 11 T63
	MatchingNumber   *string `json:"matching_number,omitempty"`   // Sprint 11 T63
}

// AccountMoveLinesIngestPayload body POST /api/v1/account-move-lines
type AccountMoveLinesIngestPayload struct {
	Lines []AccountMoveLinePayload `json:"lines"`
}

// AccountMoveLinesIngestHandler POST /api/v1/account-move-lines — Sprint 04 T21/T22.
// Ingestion idempotente des écritures comptables Odoo tous journaux.
// Header : X-Tenant (requis). Body JSON : {lines: [...]}
func AccountMoveLinesIngestHandler(db *storage.DB) fiber.Handler {
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

		var p AccountMoveLinesIngestPayload
		if err := c.BodyParser(&p); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON body",
			})
		}
		if len(p.Lines) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "lines array is required and must not be empty",
			})
		}

		lines := make([]storage.AccountMoveLine, 0, len(p.Lines))
		for i := range p.Lines {
			line := &p.Lines[i]
			// Seules les écritures posted — doctrine comptable
			if line.State != "" && line.State != "posted" {
				continue
			}
			if line.AccountCode == "" {
				continue
			}
			lineDate, err := time.Parse("2006-01-02", line.LineDate)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": fmt.Sprintf("invalid line_date at index %d (use YYYY-MM-DD)", i),
				})
			}
		aml := storage.AccountMoveLine{
			Tenant:          tenant,
			MoveID:          line.MoveID,
			LineID:          line.LineID,
			LineDate:        lineDate,
			AccountCode:     line.AccountCode,
			JournalCode:     line.JournalCode,
			Debit:           line.Debit,
			Credit:          line.Credit,
			Currency:        line.Currency,
			State:           line.State,
			CompanyID:       line.CompanyID,
			PartnerID:       line.PartnerID,
			PartnerName:     line.PartnerName,
			FullReconcileID: line.FullReconcileID,
			MatchingNumber:  line.MatchingNumber,
		}
		if line.DateMaturity != nil {
			dm, err2 := time.Parse("2006-01-02", *line.DateMaturity)
			if err2 == nil {
				aml.DateMaturity = &dm
			}
		}
			lines = append(lines, aml)
		}

		if len(lines) == 0 {
			return c.Status(fiber.StatusOK).JSON(fiber.Map{
				"status": "no_eligible_lines",
				"count":  0,
			})
		}

		ctx := c.Context()
		n, err := db.UpsertAccountMoveLines(ctx, lines)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"status": "ingested",
			"count":  n,
		})
	}
}
