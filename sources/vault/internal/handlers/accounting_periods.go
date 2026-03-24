package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// --- Response types ---

type periodEntry struct {
	Month         int        `json:"month"`
	Year          int        `json:"year"`
	CompanyID     string     `json:"company_id"`
	Status        string     `json:"status"`
	ClosedAt      *time.Time `json:"closed_at"`
	Heterogeneous bool       `json:"heterogeneous,omitempty"`
}

type periodsResponse struct {
	Tenant      string        `json:"tenant"`
	FiscalYear  *fiscalYear   `json:"fiscal_year,omitempty"`
	Periods     []periodEntry `json:"periods"`
	GeneratedAt string        `json:"generated_at"`
}

type fiscalYear struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

// AccountingPeriodsHandler GET /api/accounting/periods — Sprint 13 T72.
func AccountingPeriodsHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}

		yearStr := c.Query("year")
		year := time.Now().Year()
		if yearStr != "" {
			parsed, err := strconv.Atoi(yearStr)
			if err != nil || parsed < 2000 || parsed > 2100 {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid year"})
			}
			year = parsed
		}

		companyIDs := parseCompanyIDsParam(c.Query("company_ids"))

		rows, err := db.GetAccountingPeriods(c.Context(), tenant, year, companyIDs)
		if err != nil {
			log.Error().Err(err).Str("tenant", tenant).Int("year", year).Msg("accounting_periods: query failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		periods := buildPeriodEntries(rows, companyIDs)

		var fy *fiscalYear
		if len(rows) > 0 {
			fy = &fiscalYear{
				Start: rows[0].FiscalYearStart.Format("2006-01-02"),
				End:   rows[0].FiscalYearEnd.Format("2006-01-02"),
			}
		}

		return c.JSON(periodsResponse{
			Tenant:      tenant,
			FiscalYear:  fy,
			Periods:     periods,
			GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func buildPeriodEntries(rows []storage.AccountingPeriodRow, companyIDs []string) []periodEntry {
	type monthKey struct {
		Year  int
		Month int
	}

	grouped := map[monthKey][]storage.AccountingPeriodRow{}
	for _, r := range rows {
		k := monthKey{Year: r.PeriodYear, Month: r.PeriodMonth}
		grouped[k] = append(grouped[k], r)
	}

	multiCompany := len(companyIDs) != 1

	var entries []periodEntry
	for k, group := range grouped {
		status := group[0].Status
		var closedAt *time.Time
		if group[0].ClosedAt != nil {
			t := *group[0].ClosedAt
			closedAt = &t
		}

		heterogeneous := false
		if multiCompany && len(group) > 1 {
			for _, r := range group[1:] {
				if r.Status != status {
					heterogeneous = true
					break
				}
			}
		}

		consolidated := status
		if heterogeneous {
			consolidated = "partial"
		}

		entries = append(entries, periodEntry{
			Month:         k.Month,
			Year:          k.Year,
			CompanyID:     group[0].CompanyID,
			Status:        consolidated,
			ClosedAt:      closedAt,
			Heterogeneous: heterogeneous,
		})
	}

	return entries
}

func parseCompanyIDsParam(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

// --- Sync handler ---

type periodSyncEntry struct {
	CompanyID       string  `json:"company_id"`
	FiscalYearStart string  `json:"fiscal_year_start"`
	FiscalYearEnd   string  `json:"fiscal_year_end"`
	PeriodMonth     int     `json:"period_month"`
	PeriodYear      int     `json:"period_year"`
	Status          string  `json:"status"`
	ClosedAt        *string `json:"closed_at,omitempty"`
}

type periodSyncRequest struct {
	Tenant  string            `json:"tenant"`
	Periods []periodSyncEntry `json:"periods"`
}

// AccountingPeriodsSyncHandler POST /api/accounting/periods/sync — Sprint 13 T72.
func AccountingPeriodsSyncHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		var req periodSyncRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
		}
		if req.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if len(req.Periods) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "periods array is required"})
		}

		upserted, err := db.UpsertAccountingPeriods(c.Context(), req.Tenant, toStoragePeriods(req.Periods))
		if err != nil {
			log.Error().Err(err).Str("tenant", req.Tenant).Msg("accounting_periods_sync: upsert failed")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		log.Info().Str("tenant", req.Tenant).Int("upserted", upserted).Msg("accounting_periods_sync: done")
		return c.JSON(fiber.Map{"ok": true, "upserted": upserted})
	}
}

func toStoragePeriods(entries []periodSyncEntry) []storage.AccountingPeriodUpsert {
	result := make([]storage.AccountingPeriodUpsert, len(entries))
	for i, e := range entries {
		result[i] = storage.AccountingPeriodUpsert{
			CompanyID:       e.CompanyID,
			FiscalYearStart: e.FiscalYearStart,
			FiscalYearEnd:   e.FiscalYearEnd,
			PeriodMonth:     e.PeriodMonth,
			PeriodYear:      e.PeriodYear,
			Status:          e.Status,
			ClosedAt:        e.ClosedAt,
		}
	}
	return result
}
