package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// ArSeriesHandler gère GET /ui/aggregations/ar-series (ADR-0010, E3, spec §11).
// Métrique principale Encours = receivables_overdue (overdue_amount).
func ArSeriesHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		companyID := c.Query("company_id")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		if dateDebut == "" {
			dateDebut = "2000-01-01"
		}
		if dateFin == "" {
			dateFin = "2030-12-31"
		}
		dateStart, err1 := time.Parse("2006-01-02", dateDebut)
		dateEnd, err2 := time.Parse("2006-01-02", dateFin)
		if err1 != nil || err2 != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_debut and date_fin must be YYYY-MM-DD"})
		}
		if dateEnd.Before(dateStart) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_fin must be >= date_debut"})
		}

		rows, err := db.GetARTotalsSnapshots(c.Context(), tenant, companyID, dateStart, dateEnd)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		points := make([]fiber.Map, 0, len(rows))
		for _, r := range rows {
			overdueRatio := 0.0
			if r.OpenAmount > 1e-9 {
				overdueRatio = utils.RoundMoney2(r.OverdueAmount / r.OpenAmount)
			}
			pt := fiber.Map{
				"date":   r.AsOfDate.Format("2006-01-02"),
				"value":  r.OverdueAmount,
				"state":  "available",
				"secondary": fiber.Map{
					"receivables_total": r.OpenAmount,
					"overdue_ratio":     overdueRatio,
				},
			}
			points = append(points, pt)
		}

		companyIDOut := 0
		if companyID != "" && companyID != "0" {
			if cid, err := parseCompanyID(companyID); err == nil {
				companyIDOut = cid
			}
		}
		return c.JSON(fiber.Map{
			"metric":         "receivables_overdue",
			"granularity":    "month",
			"period":         "30d",
			"currency":       "EUR",
			"scope":          fiber.Map{"tenant": tenant, "company_id": companyIDOut},
			"points":         points,
			"partial_reason": nil,
		})
	}
}
