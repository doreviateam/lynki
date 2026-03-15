package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// ArSnapshotJobHandler gère POST /ui/jobs/ar-snapshot (ADR-0010, E3).
// Query: tenant (requis), company_id (optionnel), as_of_date (optionnel = dernier jour du mois précédent Europe/Paris).
func ArSnapshotJobHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	loc, _ := time.LoadLocation("Europe/Paris")
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		companyID := c.Query("company_id")
		asOfDateStr := c.Query("as_of_date")

		var asOfDate time.Time
		if asOfDateStr != "" {
			t, err := time.ParseInLocation("2006-01-02", asOfDateStr, loc)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "as_of_date must be YYYY-MM-DD"})
			}
			asOfDate = t
		} else {
			now := time.Now().In(loc)
			firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
			asOfDate = firstOfMonth.AddDate(0, 0, -1)
		}

		dateStr := asOfDate.Format("2006-01-02")
		resp, err := db.ArByPartnerAggregation(c.Context(), tenant, dateStr, dateStr, dateStr, companyID, false, 1)
		if err != nil {
			if log != nil {
				log.Warn().Err(err).Str("tenant", tenant).Msg("ArByPartnerAggregation failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		cid := 0
		if companyID != "" && companyID != "0" {
			if parsed, err := parseCompanyID(companyID); err == nil {
				cid = parsed
			}
		}

		row := &storage.ARTotalsSnapshot{
			Tenant:               tenant,
			CompanyID:            cid,
			AsOfDate:             asOfDate,
			OpenAmount:           resp.Totals.OpenAmount,
			OverdueAmount:        resp.Totals.OverdueAmount,
			OpenCountInvoices:    resp.Totals.OpenCountInvoices,
			OverdueCountInvoices: resp.Totals.OverdueCountInvoices,
		}
		if err := db.UpsertARTotalsSnapshot(c.Context(), row); err != nil {
			if log != nil {
				log.Warn().Err(err).Str("tenant", tenant).Msg("UpsertARTotalsSnapshot failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		if log != nil {
			log.Info().
				Str("tenant", tenant).
				Int("company_id", cid).
				Str("as_of_date", dateStr).
				Msg("AR snapshot upserted")
		}
		return c.JSON(fiber.Map{
			"ok":         true,
			"tenant":     tenant,
			"company_id": cid,
			"as_of_date": dateStr,
		})
	}
}
