package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// TreasurySeriesHandler gère GET /ui/aggregations/treasury-series (ADR-0010, spec §11).
// Retourne la série des snapshots trésorerie (granularity month en v1).
func TreasurySeriesHandler(db *storage.DB) fiber.Handler {
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

		rows, err := db.GetTreasuryPositionSnapshots(c.Context(), tenant, companyID, dateStart, dateEnd)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		// Réponse alignée spec consolidée §11 (granularity month en v1)
		points := make([]fiber.Map, 0, len(rows))
		currency := "EUR"
		for _, r := range rows {
			if r.Currency != "" {
				currency = r.Currency
			}
			secondary := fiber.Map{}
			if r.ErpBalance != nil {
				secondary["cash_erp"] = utils.RoundMoney2(*r.ErpBalance)
			}
			totalVol := r.Reconciled + r.Unreconciled
			if totalVol > 1e-9 && r.ErpBalance != nil && *r.ErpBalance != 0 {
				secondary["coverage_ratio"] = utils.RoundMoney2(r.ValidatedBalance / *r.ErpBalance)
			}
			pt := fiber.Map{
				"date":         r.AsOfDate.Format("2006-01-02"),
				"value":        r.ValidatedBalance,
				"state":        "available",
				"reconciled":   utils.RoundMoney2(r.Reconciled),
				"unreconciled": utils.RoundMoney2(r.Unreconciled),
			}
			if len(secondary) > 0 {
				pt["secondary"] = secondary
			}
			points = append(points, pt)
		}

		companyIDOut := 0
		if companyID != "" && companyID != "0" {
			if cid, err := parseCompanyID(companyID); err == nil {
				companyIDOut = cid
			}
		}
		res := fiber.Map{
			"metric":         "cash_validated",
			"granularity":    "month",
			"period":         "30d",
			"currency":       currency,
			"scope":          fiber.Map{"tenant": tenant, "company_id": companyIDOut},
			"points":         points,
			"partial_reason": nil,
		}
		return c.JSON(res)
	}
}
