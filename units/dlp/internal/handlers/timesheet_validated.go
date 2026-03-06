package handlers

import (
	"time"

	"github.com/doreviateam/dlp/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// TimesheetValidated POST /api/v1/timesheet-validated
func TimesheetValidated(st *store.Store, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var p store.TimesheetValidatedPayload
		if err := c.BodyParser(&p); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		if p.TenantID == "" || p.SourceSystem == "" || p.CompanyID == "" || p.ProjectExternalID == "" || p.TimeEntryExternalID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant_id, source_system, company_id, project_external_id, time_entry_external_id required"})
		}
		if p.HitAt.IsZero() {
			p.HitAt = time.Now()
		}

		hits, mappingMissing, err := st.ProcessTimesheetValidated(c.Context(), &p)
		if mappingMissing {
			if log != nil {
				log.Info().Str("tenant", p.TenantID).Str("project", p.ProjectExternalID).Msg("mapping_missing")
			}
			return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"status": "accepted", "message": "mapping_missing"})
		}
		if err != nil {
			if err == store.ErrCompanyNotFound {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "company not found"})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"status": "accepted", "hits_inserted": hits})
	}
}
