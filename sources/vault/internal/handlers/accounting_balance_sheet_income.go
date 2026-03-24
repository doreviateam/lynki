package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// lynkiClassAggregationResponse contrat JSON partagé Bilan / CR (Sprint 07 T39/T40).
type lynkiClassAggregationResponse struct {
	RestitutionID      string                    `json:"restitution_id"`
	ReferentielVersion string                    `json:"referentiel_version"`
	Tenant             string                    `json:"tenant"`
	CompanyID          *string                   `json:"company_id"`
	PeriodFrom         string                    `json:"period_from"`
	PeriodTo           string                    `json:"period_to"`
	GeneratedAt        string                    `json:"generated_at"`
	PerimeterNote      string                    `json:"perimeter_note"`
	Lines              []storage.ClassBalanceLine `json:"lines"`
	VaultFreshness     *string                   `json:"vault_freshness,omitempty"`
	Complete           bool                      `json:"complete"`
	Coverage           string                    `json:"coverage,omitempty"`
}

func parseCompanyIDInt32(companyIDStr string) (*int32, error) {
	if strings.TrimSpace(companyIDStr) == "" {
		return nil, nil
	}
	n64, err := strconv.ParseInt(strings.TrimSpace(companyIDStr), 10, 32)
	if err != nil {
		return nil, err
	}
	v := int32(n64)
	return &v, nil
}

// BalanceSheetHandler GET /api/accounting/balance-sheet — lynki.accounting.balance_sheet (Sprint 07 T39).
func BalanceSheetHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	const note = "Premier incrément — agrégation par classe PCG (1er chiffre, classes 1–5), source account_move_lines uniquement."
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		dateDebut := strings.TrimSpace(c.Query("date_debut"))
		dateFin := strings.TrimSpace(c.Query("date_fin"))
		if dateDebut == "" || dateFin == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_debut and date_fin are required (YYYY-MM-DD)"})
		}

		v := validators.NewValidator()
		if err := v.ValidateDate(dateDebut + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_debut (use YYYY-MM-DD)"})
		}
		if err := v.ValidateDate(dateFin + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_fin (use YYYY-MM-DD)"})
		}

		companyIDs, companyIDStr, err := parseCompanyFilter(c)
		if err != nil {
			fe, ok := err.(*fiber.Error)
			if ok {
				return c.Status(fe.Code).JSON(fiber.Map{"error": fe.Message})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		ctx := c.Context()
		agg, err := db.AggregateBalanceByAccountClass(ctx, &storage.AccountingClassAggregationQuery{
			Tenant:        tenant,
			DateFrom:      dateDebut,
			DateTo:        dateFin,
			CompanyIDs:    companyIDs,
			ClassesFilter: []string{"1", "2", "3", "4", "5"},
		})
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
		resp := lynkiClassAggregationResponse{
			RestitutionID:      "lynki.accounting.balance_sheet",
			ReferentielVersion: referentielVersionLynki,
			Tenant:             tenant,
			CompanyID:          companyPtr,
			PeriodFrom:         dateDebut,
			PeriodTo:           dateFin,
			GeneratedAt:        time.Now().UTC().Format(time.RFC3339),
			PerimeterNote:      note,
			Lines:              agg.Lines,
			VaultFreshness:     &fresh,
			Complete:           agg.Complete,
			Coverage:           agg.Coverage,
		}
		if resp.Lines == nil {
			resp.Lines = []storage.ClassBalanceLine{}
		}

		if log != nil {
			log.Debug().
				Str("tenant", tenant).
				Str("from", dateDebut).Str("to", dateFin).
				Int("lines", len(resp.Lines)).
				Str("coverage", agg.Coverage).
				Bool("complete", agg.Complete).
				Msg("balance sheet (class aggregate)")
		}
		return c.JSON(resp)
	}
}

// IncomeStatementHandler GET /api/accounting/income-statement — lynki.accounting.income_statement (Sprint 07 T40).
func IncomeStatementHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	const note = "Premier incrément — agrégation par classe PCG (1er chiffre, classes 6–7), source account_move_lines uniquement."
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		dateDebut := strings.TrimSpace(c.Query("date_debut"))
		dateFin := strings.TrimSpace(c.Query("date_fin"))
		if dateDebut == "" || dateFin == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_debut and date_fin are required (YYYY-MM-DD)"})
		}

		v := validators.NewValidator()
		if err := v.ValidateDate(dateDebut + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_debut (use YYYY-MM-DD)"})
		}
		if err := v.ValidateDate(dateFin + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_fin (use YYYY-MM-DD)"})
		}

		companyIDs, companyIDStr, err := parseCompanyFilter(c)
		if err != nil {
			fe, ok := err.(*fiber.Error)
			if ok {
				return c.Status(fe.Code).JSON(fiber.Map{"error": fe.Message})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		ctx := c.Context()
		agg, err := db.AggregateBalanceByAccountClass(ctx, &storage.AccountingClassAggregationQuery{
			Tenant:        tenant,
			DateFrom:      dateDebut,
			DateTo:        dateFin,
			CompanyIDs:    companyIDs,
			ClassesFilter: []string{"6", "7"},
		})
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
		resp := lynkiClassAggregationResponse{
			RestitutionID:      "lynki.accounting.income_statement",
			ReferentielVersion: referentielVersionLynki,
			Tenant:             tenant,
			CompanyID:          companyPtr,
			PeriodFrom:         dateDebut,
			PeriodTo:           dateFin,
			GeneratedAt:        time.Now().UTC().Format(time.RFC3339),
			PerimeterNote:      note,
			Lines:              agg.Lines,
			VaultFreshness:     &fresh,
			Complete:           agg.Complete,
			Coverage:           agg.Coverage,
		}
		if resp.Lines == nil {
			resp.Lines = []storage.ClassBalanceLine{}
		}

		if log != nil {
			log.Debug().
				Str("tenant", tenant).
				Str("from", dateDebut).Str("to", dateFin).
				Int("lines", len(resp.Lines)).
				Str("coverage", agg.Coverage).
				Bool("complete", agg.Complete).
				Msg("income statement (class aggregate)")
		}
		return c.JSON(resp)
	}
}
