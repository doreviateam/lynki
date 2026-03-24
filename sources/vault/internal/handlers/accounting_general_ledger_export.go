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

// GeneralLedgerExportHandler GET /api/accounting/general-ledger/export — Sprint 05 T29.
// Sprint 06 T35 : filtres journal_code et partner_id optionnels, colonne journal + partenaire dans le CSV.
// Doctrine Vault : pas d'export depuis un stub — Vault est la source de vérité.
// Params requis : tenant, account_code, date_debut, date_fin.
// Params optionnels : company_id, journal_code, partner_id.
func GeneralLedgerExportHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}
		tenant := c.Query("tenant")
		accountCode := strings.TrimSpace(c.Query("account_code"))
		dateDebut := strings.TrimSpace(c.Query("date_debut"))
		dateFin := strings.TrimSpace(c.Query("date_fin"))

		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if accountCode == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "account_code is required"})
		}
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
		journalCode := strings.TrimSpace(c.Query("journal_code"))
		partnerIDStr := strings.TrimSpace(c.Query("partner_id"))
		partnerName := strings.TrimSpace(c.Query("partner_name"))

		ctx := c.Context()
		q, err := storage.NewGeneralLedgerQuery(tenant, accountCode, dateDebut, dateFin, companyID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		// Pas de pagination pour l'export — on exporte tout dans la limite maxExportLines
		if err := q.SetFilters(journalCode, partnerIDStr, partnerName, 1, 0); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		result, err := db.GeneralLedgerEntries(ctx, q)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		lines := result.Lines
		truncated := false
		if len(lines) > maxExportLines {
			lines = lines[:maxExportLines]
			truncated = true
		}

		journalSuffix := ""
		if journalCode != "" {
			journalSuffix = "_" + safeFilename(journalCode)
		}
		filename := fmt.Sprintf("grand_livre_%s_%s_%s_%s%s.csv",
			safeFilename(accountCode), safeFilename(tenant), dateDebut, dateFin, journalSuffix)
		c.Set("Content-Type", "text/csv; charset=utf-8")
		c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		c.Set("X-Lynki-Export-Coverage", result.Coverage)
		c.Set("X-Lynki-Export-Complete", strconv.FormatBool(result.Complete))
		c.Set("X-Lynki-Accounting-Source", "vault")
		if journalCode != "" {
			c.Set("X-Lynki-Export-Journal", journalCode)
		}
		if truncated {
			c.Set("X-Lynki-Export-Truncated", fmt.Sprintf("true; max=%d", maxExportLines))
		}

		w := csv.NewWriter(c.Response().BodyWriter())
		_ = w.Write([]string{
			"date", "journal_code", "partner_id", "partner_name",
			"move_id", "line_id", "debit", "credit", "solde_cumule",
			"account_code", "currency",
			"referentiel_version", "coverage", "complete",
			"tenant", "period_from", "period_to", "generated_at",
		})

		generatedAt := time.Now().UTC().Format(time.RFC3339)
		completeStr := strconv.FormatBool(result.Complete)
		var runningBalance float64
		for _, l := range lines {
			runningBalance += l.Debit - l.Credit
			partnerIDField := ""
			if l.PartnerID != nil {
				partnerIDField = strconv.FormatInt(*l.PartnerID, 10)
			}
			_ = w.Write([]string{
				l.LineDate,
				l.JournalCode,
				partnerIDField,
				l.PartnerName,
				strconv.FormatInt(l.MoveID, 10),
				strconv.FormatInt(l.LineID, 10),
				formatCSVAmount(l.Debit),
				formatCSVAmount(l.Credit),
				formatCSVAmount(runningBalance),
				l.AccountCode,
				l.Currency,
				referentielVersionLynki,
				result.Coverage,
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
				Str("account_code", accountCode).
				Str("from", dateDebut).Str("to", dateFin).
				Str("journal", journalCode).
				Int("lines", len(lines)).Bool("truncated", truncated).
				Msg("general ledger export")
		}
		return nil
	}
}

// safeFilename remplace les caractères non-alphanumériques par des underscores.
func safeFilename(s string) string {
	out := make([]byte, 0, len(s))
	for _, c := range []byte(s) {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' {
			out = append(out, c)
		} else {
			out = append(out, '_')
		}
	}
	return string(out)
}
