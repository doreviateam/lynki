package handlers

import (
	"github.com/doreviateam/dlp/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func ProjectPerimeterMapList(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant required"})
		}
		tenantID, err := st.ResolveTenantID(c.Context(), tenant)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant: " + err.Error()})
		}
		sourceSystem := c.Query("source_system")
		list, err := st.ListProjectPerimeterMap(c.Context(), tenantID, sourceSystem)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(list)
	}
}

func ProjectPerimeterMapCreate(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			TenantID            string `json:"tenant_id"`
			SourceSystem        string `json:"source_system"`
			ProjectExternalID   string `json:"project_external_id"`
			BusinessPerimeterID string `json:"business_perimeter_id"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		if req.TenantID == "" || req.SourceSystem == "" || req.ProjectExternalID == "" || req.BusinessPerimeterID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant_id, source_system, project_external_id, business_perimeter_id required"})
		}
		tenantID, err := st.ResolveTenantID(c.Context(), req.TenantID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant_id: " + err.Error()})
		}
		perimeterID, err := uuid.Parse(req.BusinessPerimeterID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid business_perimeter_id"})
		}
		m, err := st.UpsertProjectPerimeterMap(c.Context(), tenantID, req.SourceSystem, req.ProjectExternalID, perimeterID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusCreated).JSON(m)
	}
}

func ProjectPerimeterMapDelete(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		idStr := c.Params("id")
		if idStr == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id required"})
		}
		id, err := uuid.Parse(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
		}
		if err := st.DeleteProjectPerimeterMap(c.Context(), id); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusNoContent).Send(nil)
	}
}
