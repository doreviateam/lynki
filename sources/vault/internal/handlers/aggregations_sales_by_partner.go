package handlers

import (
	"strconv"
	"strings"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// SalesByPartnerAggregationHandler gère GET /ui/aggregations/sales-by-partner (Pareto 80/20).
// Paramètres : tenant, date_debut, date_fin, company_id (optionnel), limit (optionnel, défaut 50).
func SalesByPartnerAggregationHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		companyID := c.Query("company_id")
		limitStr := c.Query("limit", "50")

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

		if dateDebut == "" {
			dateDebut = "2000-01-01"
		}
		if dateFin == "" {
			dateFin = "2030-12-31"
		}

		limit := 50
		if limitStr != "" {
			if n, err := strconv.Atoi(limitStr); err == nil && n > 0 {
				limit = n
			}
		}

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

		ctx := c.Context()
		resp, err := db.SalesByPartnerAggregation(ctx, tenant, dateDebut, dateFin, companyID, limit)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "invalid ") || strings.Contains(err.Error(), "date_debut") || strings.Contains(err.Error(), "date_fin") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(resp)
	}
}
