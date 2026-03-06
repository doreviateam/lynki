package handlers

import (
	"strings"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// SalesAggregationHandler gère GET /ui/aggregations/sales (SPEC_DOREVIA_UI_CARD_SALES_v1.0).
// Paramètres : date_debut (obligatoire), date_fin (obligatoire), granularity (optionnel, défaut month), tenant (optionnel si déduit du contexte/auth).
func SalesAggregationHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		granularity := c.Query("granularity", "month")
		tenant := c.Query("tenant")
		companyID := c.Query("company_id")

		if dateDebut == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "date_debut is required",
			})
		}
		if dateFin == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "date_fin is required",
			})
		}
		if tenant == "" {
			// TODO: déduire du token / header X-Tenant-ID si auth activée
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "tenant is required",
			})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
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

		allowedGranularity := map[string]bool{"day": true, "week": true, "month": true}
		if !allowedGranularity[granularity] {
			granularity = "month"
		}

		ctx := c.Context()
		resp, err := db.SalesAggregation(ctx, tenant, dateDebut, dateFin, granularity, companyID)
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
