package handlers

import (
	"strconv"

	"github.com/doreviateam/dlp/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func EnergySummary(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant required"})
		}
		var tenantID uuid.UUID
		if parsed, err := uuid.Parse(tenant); err == nil {
			tenantID = parsed
		} else {
			// Résolution par slug (ex: sarl-la-platine)
			id, found, err := st.GetTenantIDBySlug(c.Context(), tenant)
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
			}
			if !found {
				// Tenant inconnu : réponse vide (pas d'erreur, UX propre)
				periodDays := 90
				if p := c.Query("period_days"); p != "" {
					if n, err := strconv.Atoi(p); err == nil && n > 0 {
						periodDays = n
					}
				}
				return c.JSON(&store.EnergySummaryResponse{
					DLPActiveCount: 0,
					HitsTotal:      0,
					PeriodDays:     periodDays,
					ByPerimeter:    []store.EnergySummaryRow{},
					ByCompany:      []store.EnergySummaryRow{},
				})
			}
			tenantID = id
		}
		periodDays := 90
		if p := c.Query("period_days"); p != "" {
			if n, err := strconv.Atoi(p); err == nil && n > 0 {
				periodDays = n
			}
		}
		var companyIDFilter *uuid.UUID
		if comp := c.Query("company_id"); comp != "" {
			if parsed, err := uuid.Parse(comp); err == nil {
				companyIDFilter = &parsed
			}
		}
		resp, err := st.GetEnergySummary(c.Context(), tenantID, periodDays, companyIDFilter)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(resp)
	}
}
