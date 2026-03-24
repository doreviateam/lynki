package handlers

import (
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// BalanceSheetRubricsExportHandler GET /api/accounting/balance-sheet/rubrics/export — Sprint 08 T47.
func BalanceSheetRubricsExportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return rubricExportHandler(db, log, "bilan", storage.BalanceSheetRubrics, storage.BalanceSheetSections(), nil)
}

// IncomeStatementRubricsExportHandler GET /api/accounting/income-statement/rubrics/export — Sprint 08 T47.
func IncomeStatementRubricsExportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return rubricExportHandler(db, log, "compte_de_resultat", storage.IncomeStatementRubrics, storage.IncomeStatementSections(), storage.IncomeStatementFormulas)
}

func rubricExportHandler(
	db *storage.DB,
	log *zerolog.Logger,
	prefix string,
	rubrics []storage.RubricDefinition,
	sections map[string]string,
	formulas []storage.FormulaRubric,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}
		q, _, err := parseRubricQuery(c)
		if err != nil {
			fe, ok := err.(*fiber.Error)
			if ok {
				return c.Status(fe.Code).JSON(fiber.Map{"error": fe.Message})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		ctx := c.Context()
		compare := strings.TrimSpace(c.Query("compare"))

		agg, err := db.AggregateByRubrics(ctx, q, rubrics, sections)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		lines := agg.Lines
		if formulas != nil {
			lines = storage.ComputeFormulas(lines, formulas)
		}

		var prevLines []storage.RubricLine
		var prevFrom, prevTo string
		if compare == "n-1" {
			prevFrom, prevTo = previousPeriod(q.DateFrom, q.DateTo)
			prevQ := &storage.RubricQuery{Tenant: q.Tenant, DateFrom: prevFrom, DateTo: prevTo, CompanyIDs: q.CompanyIDs}
			prevAgg, prevErr := db.AggregateByRubrics(ctx, prevQ, rubrics, sections)
			if prevErr == nil {
				prevLines = prevAgg.Lines
				if formulas != nil {
					prevLines = storage.ComputeFormulas(prevLines, formulas)
				}
			}
		}

		suffix := ""
		if compare == "n-1" {
			suffix = "_comparatif"
		}
		filename := fmt.Sprintf("%s_rubriques%s_%s_%s_%s.csv", prefix, suffix, q.Tenant, q.DateFrom, q.DateTo)
		c.Set("Content-Type", "text/csv; charset=utf-8")
		c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		c.Set("X-Lynki-Export-Coverage", agg.Coverage)
		c.Set("X-Lynki-Export-Complete", strconv.FormatBool(agg.Complete))
		c.Set("X-Lynki-Accounting-Source", "vault")
		c.Set("X-Lynki-Export-Detail-Level", "rubrics")

		w := csv.NewWriter(c.Response().BodyWriter())

		if compare == "n-1" {
			_ = w.Write([]string{
				"rubric_id", "label", "section",
				"amount_current", "amount_previous", "delta", "delta_percent",
				"period_from", "period_to", "period_previous_from", "period_previous_to",
				"referentiel_version", "coverage", "complete",
				"tenant", "generated_at",
			})

			prevByID := make(map[string]float64, len(prevLines))
			for _, pl := range prevLines {
				prevByID[pl.RubricID] = pl.Amount
			}

			generatedAt := time.Now().UTC().Format(time.RFC3339)
			completeStr := strconv.FormatBool(agg.Complete)
			for _, l := range lines {
				prev, hasPrev := prevByID[l.RubricID]
				prevStr := ""
				deltaStr := ""
				deltaPctStr := ""
				if hasPrev {
					prevStr = formatCSVAmount(prev)
					delta := l.Amount - prev
					deltaStr = formatCSVAmount(delta)
					if prev != 0 {
						deltaPctStr = formatCSVAmount(delta / prev * 100)
					}
				}
				_ = w.Write([]string{
					l.RubricID, l.Label, l.Section,
					formatCSVAmount(l.Amount), prevStr, deltaStr, deltaPctStr,
					q.DateFrom, q.DateTo, prevFrom, prevTo,
					referentielVersionLynki, agg.Coverage, completeStr,
					q.Tenant, generatedAt,
				})
			}
		} else {
			_ = w.Write([]string{
				"rubric_id", "label", "section", "amount",
				"referentiel_version", "coverage", "complete",
				"tenant", "period_from", "period_to", "generated_at",
			})
			generatedAt := time.Now().UTC().Format(time.RFC3339)
			completeStr := strconv.FormatBool(agg.Complete)
			for _, l := range lines {
				_ = w.Write([]string{
					l.RubricID, l.Label, l.Section,
					formatCSVAmount(l.Amount),
					referentielVersionLynki, agg.Coverage, completeStr,
					q.Tenant, q.DateFrom, q.DateTo, generatedAt,
				})
			}
		}
		w.Flush()

		if log != nil {
			log.Debug().
				Str("tenant", q.Tenant).
				Str("from", q.DateFrom).Str("to", q.DateTo).
				Str("compare", compare).
				Int("lines", len(lines)).
				Str("coverage", agg.Coverage).
				Str("type", prefix).
				Msg("rubrics export")
		}
		return nil
	}
}
