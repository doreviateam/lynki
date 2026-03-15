package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// BfrSeriesHandler gère GET /ui/aggregations/bfr-series (ADR-0010, E4, spec §11).
// BFR = AR - AP par (tenant, company_id, as_of_date). Pas de table BFR dédiée.
func BfrSeriesHandler(db *storage.DB) fiber.Handler {
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

		arRows, err := db.GetARTotalsSnapshots(c.Context(), tenant, companyID, dateStart, dateEnd)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		apRows, err := db.GetApTotalsSnapshots(c.Context(), tenant, companyID, dateStart, dateEnd)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		apByDate := make(map[string]*storage.ApTotalsSnapshot)
		for i := range apRows {
			key := apRows[i].AsOfDate.Format("2006-01-02")
			apByDate[key] = &apRows[i]
		}

		points := make([]fiber.Map, 0, len(arRows))
		for _, r := range arRows {
			key := r.AsOfDate.Format("2006-01-02")
			ap := apByDate[key]
			arOpen := r.OpenAmount
			apOpen := 0.0
			if ap != nil {
				apOpen = ap.OpenAmount
			}
			bfrNet := utils.RoundMoney2(arOpen - apOpen)
			pt := fiber.Map{
				"date":  key,
				"value": bfrNet,
				"state": "available",
				"secondary": fiber.Map{
					"ar_total": arOpen,
					"ap_total": apOpen,
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
			"metric":         "bfr_net",
			"granularity":    "month",
			"period":         "30d",
			"currency":       "EUR",
			"scope":          fiber.Map{"tenant": tenant, "company_id": companyIDOut},
			"points":         points,
			"partial_reason": nil,
		})
	}
}
