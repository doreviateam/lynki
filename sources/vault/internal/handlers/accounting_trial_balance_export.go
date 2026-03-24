package handlers

import (
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

const maxExportLines = 10_000

// TrialBalanceExportHandler GET /api/accounting/trial-balance/export — Sprint 04 T24.
// Exporte la balance générale en CSV (Content-Type: text/csv).
// Doctrine Vault : pas d'export depuis un stub — l'endpoint Vault est la source de vérité.
// Mêmes filtres que /api/accounting/trial-balance : tenant, date_debut, date_fin (requis), company_id (opt).
func TrialBalanceExportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		dateDebut := strings.TrimSpace(c.Query("date_debut"))
		dateFin := strings.TrimSpace(c.Query("date_fin"))
		if dateDebut == "" || dateFin == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "date_debut and date_fin are required (YYYY-MM-DD)",
			})
		}
		v := validators.NewValidator()
		if err := v.ValidateDate(dateDebut + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_debut (use YYYY-MM-DD)"})
		}
		if err := v.ValidateDate(dateFin + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_fin (use YYYY-MM-DD)"})
		}
		companyID := c.Query("company_ids")
		if companyID == "" {
			companyID = c.Query("company_id")
		}
		ctx := c.Context()

		agg, err := db.TrialBalanceAggregation(ctx, tenant, dateDebut, dateFin, companyID)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		lines := agg.Lines
		truncated := false
		if len(lines) > maxExportLines {
			lines = lines[:maxExportLines]
			truncated = true
		}

		filename := fmt.Sprintf("balance_generale_%s_%s_%s.csv", tenant, dateDebut, dateFin)
		c.Set("Content-Type", "text/csv; charset=utf-8")
		c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		c.Set("X-Lynki-Export-Coverage", agg.Coverage)
		c.Set("X-Lynki-Export-Complete", strconv.FormatBool(agg.Complete))
		c.Set("X-Lynki-Accounting-Source", "vault")
		if truncated {
			c.Set("X-Lynki-Export-Truncated", fmt.Sprintf("true; max=%d", maxExportLines))
		}

		w := csv.NewWriter(c.Response().BodyWriter())
		// En-tête
		_ = w.Write([]string{
			"compte", "libelle", "debit", "credit", "solde",
			"referentiel_version", "coverage", "complete",
			"tenant", "period_from", "period_to", "generated_at",
		})

		generatedAt := time.Now().UTC().Format(time.RFC3339)
		completeStr := strconv.FormatBool(agg.Complete)
		for _, l := range lines {
			_ = w.Write([]string{
				l.AccountCode,
				l.AccountName,
				formatCSVAmount(l.Debit),
				formatCSVAmount(l.Credit),
				formatCSVAmount(l.Balance),
				referentielVersionLynki,
				agg.Coverage,
				completeStr,
				tenant,
				dateDebut,
				dateFin,
				generatedAt,
			})
		}
		w.Flush()

		if log != nil {
			log.Debug().
				Str("tenant", tenant).
				Str("from", dateDebut).Str("to", dateFin).
				Int("lines", len(lines)).
				Bool("truncated", truncated).
				Str("coverage", agg.Coverage).
				Msg("trial balance export")
		}
		return nil
	}
}

func formatCSVAmount(f float64) string {
	return strconv.FormatFloat(f, 'f', 2, 64)
}
