package handlers

import (
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// PayrollAggregationHandler gère GET /ui/aggregations/payroll
// Retourne le total des charges de personnel (source payslip ou OD 641*/645* ou none).
// SPEC EBE OD payroll v1.0 — payroll_source, payroll_unavailable, breakdown.
func PayrollAggregationHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "tenant is required",
			})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		today := time.Now().Format("2006-01-02")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		if dateDebut == "" {
			dateDebut = c.Query("date_from")
		}
		if dateFin == "" {
			dateFin = c.Query("date_to")
		}
		if dateDebut == "" {
			dateDebut = time.Now().AddDate(0, -12, 0).Format("2006-01-02")
		}
		if dateFin == "" {
			dateFin = today
		}

		granularity := c.Query("granularity", "month")
		companyID := c.Query("company_id")

		ctx := c.Context()
		resp, err := db.PayrollAggregation(ctx, tenant, dateDebut, dateFin, granularity, companyID)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "invalid ") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		if log != nil {
			ev := log.Debug().
				Str("tenant", tenant).
				Str("from", dateDebut).Str("to", dateFin).
				Str("payroll_source", resp.PayrollSource).
				Float64("total", resp.TotalCharges).
				Int("count", resp.PayslipCount)
			if resp.Breakdown != nil {
				ev = ev.Float64("total_641", resp.Breakdown.Accounts641).Float64("total_645", resp.Breakdown.Accounts645)
			}
			ev.Msg("payroll aggregation")
		}

		return c.JSON(resp)
	}
}
