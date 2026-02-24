package handlers

import (
	"github.com/doreviateam/dlp/internal/models"
	"github.com/doreviateam/dlp/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func ListDLPs(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant required"})
		}
		tenantID, err := st.ResolveTenantID(c.Context(), tenant)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant: " + err.Error()})
		}
		status := c.Query("status", "active")
		list, err := st.ListDLPs(c.Context(), tenantID, status)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(list)
	}
}

func CreateDLP(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req models.CreateDLPRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		if req.TenantID == "" || req.Title == "" || req.Intention == "" || req.CreatedBy == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant_id, title, intention, created_by required"})
		}
		// hypothesis optionnel (SPEC_DLP_UX_v0.1 : peut être vide pour création simplifiée)
		if req.ScopeCompanyIDs == nil {
			req.ScopeCompanyIDs = []string{}
		}
		if req.ScopePerimeterIDs == nil {
			req.ScopePerimeterIDs = []string{}
		}
		// Résoudre tenant_id (slug ou UUID)
		resolvedID, err := st.ResolveTenantID(c.Context(), req.TenantID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid tenant_id: " + err.Error()})
		}
		req.TenantID = resolvedID.String()
		dlp, err := st.CreateDLP(c.Context(), &req)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusCreated).JSON(dlp)
	}
}

func GetDLP(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		idStr := c.Params("id")
		if idStr == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id required"})
		}
		id, err := uuid.Parse(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
		}
		dlp, err := st.GetDLPByID(c.Context(), id)
		if err != nil {
			if err.Error() == "no rows in result set" {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(dlp)
	}
}

func UpdateDLP(st *store.Store) fiber.Handler {
	return func(c *fiber.Ctx) error {
		idStr := c.Params("id")
		if idStr == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id required"})
		}
		id, err := uuid.Parse(idStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
		}
		var req models.UpdateDLPRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		dlp, err := st.UpdateDLP(c.Context(), id, &req)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(dlp)
	}
}
