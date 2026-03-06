package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// ExpectedCountItem un comptage attendu pour une source (batch)
type ExpectedCountItem struct {
	Source        string `json:"source"`
	ExpectedCount int    `json:"expected_count"`
}

// ExpectedCountsPayload payload POST /api/v1/expected-counts (DVIG → Vault)
// Spec: SPEC_ALIMENTATION_EXPECTED_COUNTS_DVIG_v1.0
type ExpectedCountsPayload struct {
	Tenant      string               `json:"tenant"`
	CompanyID   string               `json:"company_id"`
	PeriodFrom  string               `json:"period_from"`
	PeriodTo    string               `json:"period_to"`
	GeneratedAt string               `json:"generated_at,omitempty"` // ISO 8601 — traçabilité, audit
	Counts      []ExpectedCountItem  `json:"counts"`
}

var requiredSources = []string{"sales", "purchases", "paymentsIn", "paymentsOut", "pos"}
var validSources = map[string]bool{
	"sales": true, "purchases": true, "paymentsIn": true, "paymentsOut": true, "pos": true,
}

// ExpectedCountsHandler gère POST /api/v1/expected-counts.
// Appelé par DVIG (connecteur Odoo → DVIG → Vault). Pas de requête live ERP.
func ExpectedCountsHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		var req ExpectedCountsPayload
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JSON payload",
			})
		}
		if req.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "tenant is required",
			})
		}
		if req.PeriodFrom == "" {
			req.PeriodFrom = "2000-01-01"
		}
		if req.PeriodTo == "" {
			req.PeriodTo = "2030-12-31"
		}

		v := validators.NewValidator()
		if err := v.ValidateDate(req.PeriodFrom + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid period_from (use YYYY-MM-DD)",
			})
		}
		if err := v.ValidateDate(req.PeriodTo + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid period_to (use YYYY-MM-DD)",
			})
		}

		if len(req.Counts) != len(requiredSources) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "counts must contain exactly 5 sources",
				"got":     len(req.Counts),
				"required": len(requiredSources),
				"sources": requiredSources,
			})
		}
		seen := make(map[string]bool)
		for _, src := range requiredSources {
			seen[src] = false
		}
		for _, item := range req.Counts {
			if !validSources[item.Source] {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error":  "invalid source",
					"source": item.Source,
					"valid":  requiredSources,
				})
			}
			if seen[item.Source] {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error":  "duplicate source",
					"source": item.Source,
				})
			}
			seen[item.Source] = true
		}

		var generatedAt *time.Time
		if req.GeneratedAt != "" {
			if t, err := time.Parse(time.RFC3339, req.GeneratedAt); err == nil {
				generatedAt = &t
			}
		}

		ctx := c.Context()
		for _, item := range req.Counts {
			if item.ExpectedCount < 0 {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "expected_count must be >= 0",
					"source": item.Source,
				})
			}
			if err := db.UpsertExpectedCount(ctx, req.Tenant, req.CompanyID, req.PeriodFrom, req.PeriodTo, item.Source, item.ExpectedCount, generatedAt); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": err.Error(),
				})
			}
		}

		return c.Status(fiber.StatusNoContent).Send(nil)
	}
}
