package handlers

import (
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

type lynkiRubricResponse struct {
	RestitutionID      string               `json:"restitution_id"`
	ReferentielVersion string               `json:"referentiel_version"`
	DetailLevel        string               `json:"detail_level"`
	Tenant             string               `json:"tenant"`
	CompanyID          *string              `json:"company_id,omitempty"`
	CompanyIDs         []int32              `json:"company_ids,omitempty"`
	PeriodFrom         string               `json:"period_from"`
	PeriodTo           string               `json:"period_to"`
	GeneratedAt        string               `json:"generated_at"`
	Lines              []storage.RubricLine `json:"lines"`
	TotalActif         *float64             `json:"total_actif,omitempty"`
	TotalPassif        *float64             `json:"total_passif,omitempty"`
	VaultFreshness     *string              `json:"vault_freshness,omitempty"`
	Complete           bool                 `json:"complete"`
	Coverage           string               `json:"coverage,omitempty"`
	Compare            string               `json:"compare,omitempty"`
	LinesPrevious      []storage.RubricLine `json:"lines_previous,omitempty"`
	PeriodPreviousFrom string               `json:"period_previous_from,omitempty"`
	PeriodPreviousTo   string               `json:"period_previous_to,omitempty"`
	CompletePrevious   *bool                `json:"complete_previous,omitempty"`
}

// previousPeriod shifts a date range back by one year.
// Go's AddDate handles Feb 29 → Feb 28 automatically.
func previousPeriod(dateFrom, dateTo string) (string, string) {
	const layout = "2006-01-02"
	from, err := time.Parse(layout, dateFrom)
	if err != nil {
		return dateFrom, dateTo
	}
	to, err := time.Parse(layout, dateTo)
	if err != nil {
		return dateFrom, dateTo
	}
	return from.AddDate(-1, 0, 0).Format(layout), to.AddDate(-1, 0, 0).Format(layout)
}

// parseCompanyFilter parses company_ids (canonical, Sprint 11 T59) or fallback company_id.
// Returns sorted, deduplicated int32 slice. Empty slice = all companies.
func parseCompanyFilter(c *fiber.Ctx) ([]int32, string, error) {
	raw := strings.TrimSpace(c.Query("company_ids"))
	if raw == "" {
		raw = strings.TrimSpace(c.Query("company_id"))
	}
	if raw == "" {
		return nil, "", nil
	}
	seen := make(map[int32]bool)
	var ids []int32
	for _, s := range strings.Split(raw, ",") {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		n, err := strconv.ParseInt(s, 10, 32)
		if err != nil {
			return nil, "", fiber.NewError(fiber.StatusBadRequest, "invalid company_id(s)")
		}
		id := int32(n)
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
	parts := make([]string, len(ids))
	for i, id := range ids {
		parts[i] = strconv.FormatInt(int64(id), 10)
	}
	return ids, strings.Join(parts, ","), nil
}

func parseRubricQuery(c *fiber.Ctx) (*storage.RubricQuery, string, error) {
	tenant := c.Query("tenant")
	if tenant == "" {
		return nil, "", fiber.NewError(fiber.StatusBadRequest, "tenant is required")
	}
	dateDebut := strings.TrimSpace(c.Query("date_debut"))
	dateFin := strings.TrimSpace(c.Query("date_fin"))
	if dateDebut == "" || dateFin == "" {
		return nil, "", fiber.NewError(fiber.StatusBadRequest, "date_debut and date_fin are required (YYYY-MM-DD)")
	}
	v := validators.NewValidator()
	if err := v.ValidateDate(dateDebut + "T00:00:00Z"); err != nil {
		return nil, "", fiber.NewError(fiber.StatusBadRequest, "invalid date_debut (use YYYY-MM-DD)")
	}
	if err := v.ValidateDate(dateFin + "T00:00:00Z"); err != nil {
		return nil, "", fiber.NewError(fiber.StatusBadRequest, "invalid date_fin (use YYYY-MM-DD)")
	}
	companyIDs, companyIDStr, err := parseCompanyFilter(c)
	if err != nil {
		return nil, "", err
	}
	return &storage.RubricQuery{
		Tenant:     tenant,
		DateFrom:   dateDebut,
		DateTo:     dateFin,
		CompanyIDs: companyIDs,
	}, companyIDStr, nil
}

// BalanceSheetRubricsHandler GET /api/accounting/balance-sheet/rubrics — Sprint 08 T43 / Sprint 10 T54.
func BalanceSheetRubricsHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}
		q, companyIDStr, err := parseRubricQuery(c)
		if err != nil {
			fe, ok := err.(*fiber.Error)
			if ok {
				return c.Status(fe.Code).JSON(fiber.Map{"error": fe.Message})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		ctx := c.Context()
		compare := strings.TrimSpace(c.Query("compare"))

		agg, err := db.AggregateByRubrics(ctx, q, storage.BalanceSheetRubrics, storage.BalanceSheetSections())
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		var totalActif, totalPassif float64
		for _, l := range agg.Lines {
			switch l.Section {
			case "actif":
				totalActif += l.Amount
			case "passif":
				totalPassif += l.Amount
			}
		}

		var companyPtr *string
		if companyIDStr != "" {
			companyPtr = &companyIDStr
		}
		fresh := "rubrics:" + agg.Coverage
		resp := lynkiRubricResponse{
			RestitutionID:      "lynki.accounting.balance_sheet",
			ReferentielVersion: referentielVersionLynki,
			DetailLevel:        "rubrics",
			Tenant:             q.Tenant,
			CompanyID:          companyPtr,
			CompanyIDs:         q.CompanyIDs,
			PeriodFrom:         q.DateFrom,
			PeriodTo:           q.DateTo,
			GeneratedAt:        time.Now().UTC().Format(time.RFC3339),
			Lines:              agg.Lines,
			TotalActif:         &totalActif,
			TotalPassif:        &totalPassif,
			VaultFreshness:     &fresh,
			Complete:           agg.Complete,
			Coverage:           agg.Coverage,
		}
		if resp.Lines == nil {
			resp.Lines = []storage.RubricLine{}
		}

		if compare == "n-1" {
			prevFrom, prevTo := previousPeriod(q.DateFrom, q.DateTo)
			prevQ := &storage.RubricQuery{Tenant: q.Tenant, DateFrom: prevFrom, DateTo: prevTo, CompanyIDs: q.CompanyIDs}
			prevAgg, prevErr := db.AggregateByRubrics(ctx, prevQ, storage.BalanceSheetRubrics, storage.BalanceSheetSections())
			resp.Compare = "n-1"
			resp.PeriodPreviousFrom = prevFrom
			resp.PeriodPreviousTo = prevTo
			if prevErr != nil {
				cp := false
				resp.CompletePrevious = &cp
				resp.LinesPrevious = []storage.RubricLine{}
			} else {
				resp.CompletePrevious = &prevAgg.Complete
				if prevAgg.Lines == nil {
					resp.LinesPrevious = []storage.RubricLine{}
				} else {
					resp.LinesPrevious = prevAgg.Lines
				}
			}
		}

		if log != nil {
			log.Debug().
				Str("tenant", q.Tenant).
				Str("from", q.DateFrom).Str("to", q.DateTo).
				Str("compare", compare).
				Int("rubrics", len(resp.Lines)).
				Str("coverage", agg.Coverage).
				Float64("total_actif", totalActif).
				Float64("total_passif", totalPassif).
				Msg("balance sheet rubrics")
		}
		return c.JSON(resp)
	}
}

// IncomeStatementRubricsHandler GET /api/accounting/income-statement/rubrics — Sprint 08 T44 / Sprint 10 T54.
func IncomeStatementRubricsHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}
		q, companyIDStr, err := parseRubricQuery(c)
		if err != nil {
			fe, ok := err.(*fiber.Error)
			if ok {
				return c.Status(fe.Code).JSON(fiber.Map{"error": fe.Message})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		ctx := c.Context()
		compare := strings.TrimSpace(c.Query("compare"))

		agg, err := db.AggregateByRubrics(ctx, q, storage.IncomeStatementRubrics, storage.IncomeStatementSections())
		if err != nil {
			status := fiber.StatusInternalServerError
			if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") {
				status = fiber.StatusBadRequest
			}
			return c.Status(status).JSON(fiber.Map{"error": err.Error()})
		}

		lines := storage.ComputeFormulas(agg.Lines, storage.IncomeStatementFormulas)

		var companyPtr *string
		if companyIDStr != "" {
			companyPtr = &companyIDStr
		}
		fresh := "rubrics:" + agg.Coverage
		resp := lynkiRubricResponse{
			RestitutionID:      "lynki.accounting.income_statement",
			ReferentielVersion: referentielVersionLynki,
			DetailLevel:        "rubrics",
			Tenant:             q.Tenant,
			CompanyID:          companyPtr,
			CompanyIDs:         q.CompanyIDs,
			PeriodFrom:         q.DateFrom,
			PeriodTo:           q.DateTo,
			GeneratedAt:        time.Now().UTC().Format(time.RFC3339),
			Lines:              lines,
			VaultFreshness:     &fresh,
			Complete:           agg.Complete,
			Coverage:           agg.Coverage,
		}
		if resp.Lines == nil {
			resp.Lines = []storage.RubricLine{}
		}

		if compare == "n-1" {
			prevFrom, prevTo := previousPeriod(q.DateFrom, q.DateTo)
			prevQ := &storage.RubricQuery{Tenant: q.Tenant, DateFrom: prevFrom, DateTo: prevTo, CompanyIDs: q.CompanyIDs}
			prevAgg, prevErr := db.AggregateByRubrics(ctx, prevQ, storage.IncomeStatementRubrics, storage.IncomeStatementSections())
			resp.Compare = "n-1"
			resp.PeriodPreviousFrom = prevFrom
			resp.PeriodPreviousTo = prevTo
			if prevErr != nil {
				cp := false
				resp.CompletePrevious = &cp
				resp.LinesPrevious = []storage.RubricLine{}
			} else {
				prevLines := storage.ComputeFormulas(prevAgg.Lines, storage.IncomeStatementFormulas)
				resp.CompletePrevious = &prevAgg.Complete
				if prevLines == nil {
					resp.LinesPrevious = []storage.RubricLine{}
				} else {
					resp.LinesPrevious = prevLines
				}
			}
		}

		if log != nil {
			log.Debug().
				Str("tenant", q.Tenant).
				Str("from", q.DateFrom).Str("to", q.DateTo).
				Str("compare", compare).
				Int("rubrics", len(resp.Lines)).
				Str("coverage", agg.Coverage).
				Msg("income statement rubrics")
		}
		return c.JSON(resp)
	}
}
