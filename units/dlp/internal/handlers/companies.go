package handlers

import (
	"github.com/doreviateam/dlp/internal/store"
	"github.com/gofiber/fiber/v2"
)

// Companies handler
func Companies(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant required"})
		}
		tenantID, err := st.ResolveTenantID(c.Context(), tenant)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant: " + err.Error()})
		}
		list, err := st.ListCompanies(c.Context(), tenantID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(list)
	}
}

// CreateCompany handler
func CreateCompany(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			TenantID   string `json:"tenant_id"`
			ExternalID string `json:"external_id"`
			Name       string `json:"name"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		if req.TenantID == "" || req.ExternalID == "" || req.Name == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant_id, external_id, name required"})
		}
		tenantID, err := st.ResolveTenantID(c.Context(), req.TenantID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant_id: " + err.Error()})
		}
		company, err := st.CreateCompany(c.Context(), tenantID, req.ExternalID, req.Name)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusCreated).JSON(company)
	}
}
