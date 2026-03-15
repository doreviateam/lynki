package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// ApByPartnerAggregationHandler gère GET /ui/aggregations/ap-by-partner
// Dettes fournisseurs ouvertes (in_invoice, amount_residual > 0), groupées par partenaire.
// Miroir de ArByPartnerAggregationHandler pour move_type = 'in_invoice'.
// SPEC DVIG Event Registry v1.0 §7 — débloque BFR complet (AR open - AP open).
func ApByPartnerAggregationHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		asOfDate := c.Query("as_of_date")
		companyID := c.Query("company_id")
		overdueStr := c.Query("overdue", "false")
		limitStr := c.Query("limit", "50")

		// Alias compat
		if dateDebut == "" {
			dateDebut = c.Query("date_from")
		}
		if dateFin == "" {
			dateFin = c.Query("date_to")
		}

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
		if dateDebut == "" {
			dateDebut = time.Now().AddDate(-1, 0, 0).Format("2006-01-02")
		}
		if dateFin == "" {
			dateFin = today
		}
		if asOfDate == "" {
			asOfDate = today
		}

		limit := 50
		if limitStr != "" {
			if n, err := strconv.Atoi(limitStr); err == nil && n > 0 {
				limit = n
			}
		}

		overdueOnly := strings.EqualFold(overdueStr, "true") || overdueStr == "1"

		v := validators.NewValidator()
		if err := v.ValidateDate(dateDebut + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid date_debut (use YYYY-MM-DD)",
			})
		}
		if err := v.ValidateDate(dateFin + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid date_fin (use YYYY-MM-DD)",
			})
		}
		if err := v.ValidateDate(asOfDate + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid as_of_date (use YYYY-MM-DD)",
			})
		}

		ctx := c.Context()
		resp, err := db.ApByPartnerAggregation(ctx, tenant, dateDebut, dateFin, asOfDate, companyID, overdueOnly, limit)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "invalid ") || strings.Contains(err.Error(), "date_") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(resp)
	}
}
