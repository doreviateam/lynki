package handlers

import (
	"strings"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// PosSessionsAggregationHandler gère GET /ui/aggregations/pos-sessions (SPEC sessions.md).
// Paramètres : tenant (obligatoire), date_debut, date_fin, shop_id (optionnel).
func PosSessionsAggregationHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		shopID := c.Query("shop_id")

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

		// Défauts de période (alignés sur dashboard-metrics)
		if dateDebut == "" {
			dateDebut = "2000-01-01"
		}
		if dateFin == "" {
			dateFin = "2030-12-31"
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
		resp, err := db.PosSessionsAggregation(ctx, tenant, dateDebut, dateFin, shopID)
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
