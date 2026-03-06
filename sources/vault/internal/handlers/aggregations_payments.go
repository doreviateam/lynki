package handlers

import (
	"strings"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// PaymentsInAggregationHandler gère GET /ui/aggregations/payments-in (SPEC_DOREVIA_PAYMENTS_v1.1 §7.1 — Encaissements).
func PaymentsInAggregationHandler(db *storage.DB) fiber.Handler {
	return paymentsAggregationHandler(db, "inbound")
}

// PaymentsOutAggregationHandler gère GET /ui/aggregations/payments-out (SPEC_DOREVIA_PAYMENTS_v1.1 §7.2 — Décaissements).
func PaymentsOutAggregationHandler(db *storage.DB) fiber.Handler {
	return paymentsAggregationHandler(db, "outbound")
}

func paymentsAggregationHandler(db *storage.DB, direction string) fiber.Handler {
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
		resp, err := db.PaymentsAggregation(ctx, tenant, dateDebut, dateFin, granularity, companyID, direction)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "invalid ") || strings.Contains(err.Error(), "date_debut") || strings.Contains(err.Error(), "date_fin") || strings.Contains(err.Error(), "direction") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		// list=1 : ajouter la liste des constats (source_id, amount, payment_date) pour comparer avec la source
		if c.Query("list") == "1" {
			events, errList := db.ListPaymentEvents(ctx, tenant, dateDebut, dateFin, companyID, direction)
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
