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

// AgedReceivablesExportHandler GET /api/accounting/aged-receivables/export — Sprint 10 T57.
func AgedReceivablesExportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return agedBalanceExportHandler(db, log, storage.AgedReceivables, "aged_receivables")
}

// AgedPayablesExportHandler GET /api/accounting/aged-payables/export — Sprint 10 T57.
func AgedPayablesExportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return agedBalanceExportHandler(db, log, storage.AgedPayables, "aged_payables")
}

func agedBalanceExportHandler(
	db *storage.DB,
	log *zerolog.Logger,
	balanceType storage.AgedBalanceType,
	prefix string,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}
		q, _, err := parseAgedBalanceQuery(c, balanceType)
		if err != nil {
			fe, ok := err.(*fiber.Error)
			if ok {
				return c.Status(fe.Code).JSON(fiber.Map{"error": fe.Message})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		result, err := db.AggregateAgedBalance(c.Context(), q)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		filename := fmt.Sprintf("%s_%s_%s.csv", prefix, q.Tenant, q.AsOfDate)
		c.Set("Content-Type", "text/csv; charset=utf-8")
		c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		c.Set("X-Lynki-Export-Coverage", result.Coverage)
		c.Set("X-Lynki-Export-Complete", strconv.FormatBool(result.Complete))
		c.Set("X-Lynki-Accounting-Source", "vault")

		w := csv.NewWriter(c.Response().BodyWriter())
		_ = w.Write([]string{
			"partner_id", "partner_name",
			"not_due", "range_0_30", "range_31_60", "range_61_90", "range_91_180", "range_over_180",
			"total",
			"partial_matching",
			"aging_basis", "as_of_date", "tenant", "referentiel_version", "coverage", "generated_at",
		})

		generatedAt := time.Now().UTC().Format(time.RFC3339)
		agingBasisStr := string(result.AgingBasis)
		partialMatchingStr := string(result.PartialMatchingCoverage)
		for _, l := range result.Lines {
			_ = w.Write([]string{
				strconv.FormatInt(int64(l.PartnerID), 10),
				l.PartnerName,
				formatCSVAmount(l.NotDue),
				formatCSVAmount(l.Range0_30),
				formatCSVAmount(l.Range31_60),
				formatCSVAmount(l.Range61_90),
				formatCSVAmount(l.Range91_180),
				formatCSVAmount(l.RangeOver180),
				formatCSVAmount(l.Total),
				partialMatchingStr,
				agingBasisStr,
				q.AsOfDate,
				q.Tenant,
				referentielVersionLynki,
				result.Coverage,
				generatedAt,
			})
		}
		w.Flush()

		if log != nil {
			log.Debug().
				Str("tenant", q.Tenant).
				Str("as_of", q.AsOfDate).
				Int("lines", len(result.Lines)).
				Str("type", prefix).
				Msg("aged balance export")
		}
		return nil
	}
}
