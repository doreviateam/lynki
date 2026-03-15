package handlers

import (
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
)

// PayrollODLinePayload une ligne OD comptable de paie (body ingestion).
// SPEC EBE OD payroll v1.0 — seules les lignes 641* et 645* avec state=posted sont acceptées.
type PayrollODLinePayload struct {
	MoveID     int     `json:"move_id"`
	LineID     int     `json:"line_id"`
	LineDate   string  `json:"line_date"`   // YYYY-MM-DD
	AccountCode string `json:"account_code"`
	Debit      float64 `json:"debit"`
	Credit     float64 `json:"credit"`
	Currency   string  `json:"currency"`
	State      string  `json:"state"`
	CompanyID  *int    `json:"company_id,omitempty"`
}

// PayrollODIngestPayload body POST /api/v1/payroll-od-lines
type PayrollODIngestPayload struct {
	Lines []PayrollODLinePayload `json:"lines"`
}

// PayrollODIngestHandler gère POST /api/v1/payroll-od-lines
// Ingestion idempotente des lignes OD paie (641*, 645*) pour l'agrégat EBE.
func PayrollODIngestHandler(db *storage.DB) fiber.Handler {
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

		var p PayrollODIngestPayload
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

		lines := make([]storage.PayrollODLine, 0, len(p.Lines))
		for i := range p.Lines {
			line := &p.Lines[i]
			if !storage.IsEligibleAccountCode(line.AccountCode) {
				continue // ignorer 421*, 431* et tout compte hors 641/645
			}
			if line.State != "" && line.State != "posted" {
				continue // n'accepter que les écritures postées
			}
			lineDate, err := time.Parse("2006-01-02", line.LineDate)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": fmt.Sprintf("invalid line_date at index %d (use YYYY-MM-DD)", i),
				})
			}
			currency := line.Currency
			if currency == "" {
				currency = "EUR"
			}
			state := line.State
			if state == "" {
				state = "posted"
			}
			lines = append(lines, storage.PayrollODLine{
				Tenant:      tenant,
				MoveID:      line.MoveID,
				LineID:      line.LineID,
				LineDate:    lineDate,
				AccountCode: line.AccountCode,
				Debit:       line.Debit,
				Credit:      line.Credit,
				Currency:    currency,
				State:       state,
				CompanyID:   line.CompanyID,
			})
		}

		if len(lines) == 0 {
			return c.Status(fiber.StatusOK).JSON(fiber.Map{
				"status": "no_eligible_lines",
				"count":  0,
			})
		}

		ctx := c.Context()
		n, err := db.UpsertPayrollODLines(ctx, lines)
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
