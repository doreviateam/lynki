package handlers

import (
	"strings"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// AdjustmentsAggregationHandler gère GET /ui/aggregations/adjustments (SPEC_DOREVIA_ADJUSTMENTS_v1.0, ADDENDUM Phase 1).
// Paramètres : tenant (requis), date_debut, date_fin (requis), event_type (optionnel), direction (optionnel), company_id, granularity (day|month), list=1 (optionnel).
func AdjustmentsAggregationHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		granularity := c.Query("granularity", "month")
		tenant := c.Query("tenant")
		companyID := c.Query("company_id")
		eventType := c.Query("event_type")
		direction := c.Query("direction")

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
		allowedEventTypes := map[string]bool{
			"refund.customer.paid": true, "refund.supplier.received": true,
			"credit_note.customer.issued": true, "credit_note.supplier.received": true,
		}
		if eventType != "" && !allowedEventTypes[eventType] {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid event_type (use refund.customer.paid | refund.supplier.received | credit_note.customer.issued | credit_note.supplier.received)",
			})
		}
		if direction != "" && direction != "inbound" && direction != "outbound" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid direction (use inbound | outbound)",
			})
		}

		ctx := c.Context()
		resp, err := db.AdjustmentsAggregation(ctx, tenant, dateDebut, dateFin, granularity, companyID, eventType, direction)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "invalid ") || strings.Contains(err.Error(), "date_debut") || strings.Contains(err.Error(), "date_fin") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if c.Query("list") == "1" {
			events, errList := db.ListAdjustmentEvents(ctx, tenant, dateDebut, dateFin, companyID, eventType, direction)
			if errList != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "list events: " + errList.Error(),
				})
			}
			resp.Events = events
		}

		return c.JSON(resp)
	}
}
