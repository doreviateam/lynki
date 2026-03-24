package handlers

import (
	"strconv"
	"time"

	"github.com/doreviateam/diva/internal/store"
	"github.com/gofiber/fiber/v2"
)

// RecordActivity gère POST /diva/activity
// Corps JSON : {"tenant": "...", "company_id": 1}
// Enregistre la date de dernière consultation (garde d'inactivité Option B).
func RecordActivity(s store.ActivityStore) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			Tenant    string `json:"tenant"`
			CompanyID int    `json:"company_id"`
		}
		if err := c.BodyParser(&req); err != nil || req.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant required"})
		}
		if err := s.RecordActivity(c.Context(), req.Tenant, req.CompanyID); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.SendStatus(fiber.StatusNoContent)
	}
}

// GetActivity gère GET /diva/activity?tenant=...&company_id=...
// Utilisé par le runner pour vérifier si une consultation récente existe.
func GetActivity(s store.ActivityStore) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			tenant = c.Get("X-Tenant")
		}
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant required"})
		}
		companyID, _ := strconv.Atoi(c.Query("company_id"))

		t, err := s.GetLastActivity(c.Context(), tenant, companyID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if t.IsZero() {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"last_seen_at": nil})
		}
		return c.JSON(fiber.Map{"last_seen_at": t.UTC().Format(time.RFC3339)})
	}
}
