package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/doreviateam/diva/internal/archive"
	"github.com/doreviateam/diva/internal/docx"
	"github.com/doreviateam/diva/internal/facts"
	"github.com/doreviateam/diva/internal/mistral"
	"github.com/doreviateam/diva/internal/models"
	"github.com/gofiber/fiber/v2"
)

type accountingReportRequest struct {
	models.AccountingInsightRequest
	Branding *docx.BrandingConfig `json:"branding,omitempty"`
}

// AccountingReportHandler — POST /diva/accounting/report (Sprint 14 T79).
// Template-first strict : génère un DOCX sans aucun appel LLM.
func AccountingReportHandler(mc *mistral.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		var req accountingReportRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "Request invalide."},
			})
		}

		if req.Context.Tenant == "" || req.Context.DateStart == "" || req.Context.DateEnd == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{"code": "BAD_REQUEST", "message": "context.tenant, date_start et date_end requis"},
			})
		}

		insightReq := &req.AccountingInsightRequest
		input := toFactsInput(insightReq)
		pack := facts.BuildAccountingFactsPack(input)
		if pack == nil {
			return c.Status(422).JSON(fiber.Map{
				"error": fiber.Map{"code": "NO_DATA", "message": "Données comptables insuffisantes pour générer le rapport."},
			})
		}

		generatedAt := time.Now().UTC().Format(time.RFC3339)
		report, err := facts.GenerateAccountingReport(pack, generatedAt)
		if err != nil {
			slog.Error("event=accounting_report_failed",
				"tenant", req.Context.Tenant,
				"error", err.Error(),
			)
			return c.Status(500).JSON(fiber.Map{
				"error": fiber.Map{"code": "REPORT_GENERATION_FAILED", "message": err.Error()},
			})
		}

		docxBytes, err := docx.RenderReport(report, req.Branding)
		if err != nil {
			slog.Error("event=accounting_report_docx_failed",
				"tenant", req.Context.Tenant,
				"error", err.Error(),
			)
			return c.Status(500).JSON(fiber.Map{
				"error": fiber.Map{"code": "DOCX_RENDER_FAILED", "message": err.Error()},
			})
		}

		durationMs := time.Since(start).Milliseconds()
		slog.Info("event=accounting_report_generated",
			"tenant", req.Context.Tenant,
			"facts_hash", pack.FactsHash,
			"template_version", facts.ReportTemplateVersion,
			"duration_ms", durationMs,
			"size_bytes", len(docxBytes),
		)

		filename := fmt.Sprintf("synthese-comptable-%s-%s_%s.docx",
			req.Context.Tenant, req.Context.DateStart, req.Context.DateEnd)

		if packJSON, err := json.Marshal(pack); err == nil {
			archive.ArchiveFactsPackAsync(os.Getenv("VAULT_URL"), req.Context.Tenant, pack.FactsHash, "report", facts.ReportTemplateVersion, packJSON)
		}

		c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
		c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		c.Set("X-Facts-Hash", pack.FactsHash)
		c.Set("X-Template-Version", facts.ReportTemplateVersion)

		return c.Send(docxBytes)
	}
}
