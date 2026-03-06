package handlers

import (
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
)

// CompaniesHandler gère GET /ui/companies?tenant=<tenant_id> (SPEC_VAULT_LINKY_COMPANY v1.1).
// Retourne [{ company_id, documents_count }] trié par company_id ASC.
func CompaniesHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
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
		list, err := db.ListCompanies(c.Context(), tenant)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.JSON(list)
	}
}
