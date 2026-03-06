package handlers

import (
	"github.com/doreviateam/dlp/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func Perimeters(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant required"})
		}
		tenantID, err := st.ResolveTenantID(c.Context(), tenant)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant: " + err.Error()})
		}
		list, err := st.ListPerimeters(c.Context(), tenantID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(list)
	}
}

func CreatePerimeter(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			TenantID  string `json:"tenant_id"`
			CompanyID string `json:"company_id"`
			Name      string `json:"name"`
			SortOrder *int   `json:"sort_order,omitempty"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		if req.TenantID == "" || req.CompanyID == "" || req.Name == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant_id, company_id, name required"})
		}
		tenantID, err := st.ResolveTenantID(c.Context(), req.TenantID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant_id: " + err.Error()})
		}
		companyID, err := uuid.Parse(req.CompanyID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid company_id"})
		}
		sortOrder := 0
		if req.SortOrder != nil {
			sortOrder = *req.SortOrder
		}
		p, err := st.CreatePerimeter(c.Context(), tenantID, companyID, req.Name, sortOrder)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusCreated).JSON(p)
	}
}

func UpdatePerimeter(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		idStr := c.Params("id")
		if idStr == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id required"})
		}
		id, err := uuid.Parse(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
		}
		var req struct {
			Name      *string `json:"name,omitempty"`
			SortOrder *int    `json:"sort_order,omitempty"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		p, err := st.UpdatePerimeter(c.Context(), id, req.Name, req.SortOrder)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(p)
	}
}
