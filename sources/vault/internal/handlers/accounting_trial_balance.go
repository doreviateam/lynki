package handlers

import (
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// referentielVersionLynki version du référentiel de mapping comptable Lynki (Sprint 04 T23).
// Partagée par TOUS les handlers lynki.accounting.* du package (trial_balance, general_ledger, ...).
// Mécanisme de bump : modifier cette constante unique + bumper REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md.
// Valeur courante alignée sur ZeDocs/web57/REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md v1.1.
const referentielVersionLynki = "1.1"

type lynkiTrialBalanceResponse struct {
	RestitutionID      string                        `json:"restitution_id"`
	ReferentielVersion string                        `json:"referentiel_version"`
	Tenant             string                        `json:"tenant"`
	CompanyID          *string                       `json:"company_id"`
	PeriodFrom         string                        `json:"period_from"`
	PeriodTo           string                        `json:"period_to"`
	GeneratedAt        string                        `json:"generated_at"`
	Lines              []storage.TrialBalanceLineRow `json:"lines"`
	VaultFreshness     *string                       `json:"vault_freshness"`
	Complete           bool                          `json:"complete"`
	Coverage           string                        `json:"coverage,omitempty"`
}

// TrialBalanceHandler GET /api/accounting/trial-balance — restitution lynki.accounting.trial_balance (Sprint 02 T11).
// Query : tenant, date_debut, date_fin (requis), company_id (optionnel).
func TrialBalanceHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "tenant is required",
			})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
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

		companyIDStr := c.Query("company_ids")
		if companyIDStr == "" {
			companyIDStr = c.Query("company_id")
		}
		ctx := c.Context()

		var accountPrefixes []string
		if raw := strings.TrimSpace(c.Query("account_prefixes")); raw != "" {
			for _, p := range strings.Split(raw, ",") {
				p = strings.TrimSpace(p)
				if p != "" {
					accountPrefixes = append(accountPrefixes, p)
				}
			}
		}

		agg, err := db.TrialBalanceAggregationFiltered(ctx, tenant, dateDebut, dateFin, companyIDStr, accountPrefixes)
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		var companyPtr *string
		if companyIDStr != "" {
			companyPtr = &companyIDStr
		}

		fresh := "aggregated:" + agg.Coverage
		resp := lynkiTrialBalanceResponse{
			RestitutionID:      "lynki.accounting.trial_balance",
			ReferentielVersion: referentielVersionLynki,
			Tenant:             tenant,
			CompanyID:          companyPtr,
			PeriodFrom:         dateDebut,
			PeriodTo:           dateFin,
			GeneratedAt:        time.Now().UTC().Format(time.RFC3339),
			Lines:              agg.Lines,
			VaultFreshness:     &fresh,
			Complete:           agg.Complete,
			Coverage:           agg.Coverage,
		}

		if log != nil {
			log.Debug().
				Str("tenant", tenant).
				Str("from", dateDebut).Str("to", dateFin).
				Int("lines", len(agg.Lines)).
				Str("coverage", agg.Coverage).
				Bool("complete", agg.Complete).
				Msg("trial balance")
		}

		return c.JSON(resp)
	}
}
