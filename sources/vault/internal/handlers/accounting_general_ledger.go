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

type lynkiGeneralLedgerResponse struct {
	RestitutionID      string                      `json:"restitution_id"`
	ReferentielVersion string                      `json:"referentiel_version"`
	Tenant             string                      `json:"tenant"`
	AccountCode        string                      `json:"account_code"`
	CompanyID          *string                     `json:"company_id"`
	PeriodFrom         string                      `json:"period_from"`
	PeriodTo           string                      `json:"period_to"`
	GeneratedAt        string                      `json:"generated_at"`
	Lines              []storage.GeneralLedgerLine `json:"lines"`
	TotalDebit         float64                     `json:"total_debit"`
	TotalCredit        float64                     `json:"total_credit"`
	OpeningBalance     float64                     `json:"opening_balance"`  // Sprint 06 T34
	TotalCount         int                         `json:"total_count"`      // Sprint 06 T34
	Page               int                         `json:"page,omitempty"`   // Sprint 06 T34
	PageSize           int                         `json:"page_size,omitempty"` // Sprint 06 T34
	VaultFreshness     *string                     `json:"vault_freshness"`
	Complete           bool                        `json:"complete"`
	Coverage           string                      `json:"coverage,omitempty"`
	// Sprint 06 T33 + Sprint 07 T38 : filtres actifs
	FilterJournal     string `json:"filter_journal,omitempty"`
	FilterPartner     *int   `json:"filter_partner,omitempty"`
	FilterPartnerName string `json:"filter_partner_name,omitempty"`
}

// GeneralLedgerHandler GET /api/accounting/general-ledger — lynki.accounting.general_ledger.
// Query requis : tenant, account_code, date_debut, date_fin.
// Query optionnel : company_id, journal_code, partner_id, page, page_size (Sprint 06 T33/T34).
func GeneralLedgerHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}

		accountCode := strings.TrimSpace(c.Query("account_code"))
		dateDebut := strings.TrimSpace(c.Query("date_debut"))
		dateFin := strings.TrimSpace(c.Query("date_fin"))
		companyID := c.Query("company_ids")
		if companyID == "" {
			companyID = c.Query("company_id")
		}

		// Sprint 06 T33 + Sprint 07 T38 — filtres optionnels
		journalCode := strings.TrimSpace(c.Query("journal_code"))
		partnerIDStr := strings.TrimSpace(c.Query("partner_id"))
		partnerName := strings.TrimSpace(c.Query("partner_name"))

		// Sprint 06 T34 — pagination optionnelle
		pageStr := strings.TrimSpace(c.Query("page"))
		pageSizeStr := strings.TrimSpace(c.Query("page_size"))

		if accountCode == "" || dateDebut == "" || dateFin == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "account_code, date_debut and date_fin are required",
			})
		}

		v := validators.NewValidator()
		if err := v.ValidateDate(dateDebut + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_debut (use YYYY-MM-DD)"})
		}
		if err := v.ValidateDate(dateFin + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid date_fin (use YYYY-MM-DD)"})
		}

		ctx := c.Context()
		q, err := storage.NewGeneralLedgerQuery(tenant, accountCode, dateDebut, dateFin, companyID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// Appliquer filtres optionnels T33/T34
		page := 1
		pageSize := 0
		if pageStr != "" {
			if p, err2 := strconv.Atoi(pageStr); err2 == nil && p > 0 {
				page = p
			}
		}
		if pageSizeStr != "" {
			if ps, err2 := strconv.Atoi(pageSizeStr); err2 == nil && ps > 0 {
				pageSize = ps
			}
		}
		if err := q.SetFilters(journalCode, partnerIDStr, partnerName, page, pageSize); err != nil {
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

		var companyPtr *string
		if companyID != "" {
			companyPtr = &companyID
		}
		var filterPartnerPtr *int
		if q.PartnerID != nil {
			v := int(*q.PartnerID)
			filterPartnerPtr = &v
		}

		fresh := "entries:" + result.Coverage
		resp := lynkiGeneralLedgerResponse{
			RestitutionID:      "lynki.accounting.general_ledger",
			ReferentielVersion: referentielVersionLynki,
			Tenant:             tenant,
			AccountCode:        accountCode,
			CompanyID:          companyPtr,
			PeriodFrom:         dateDebut,
			PeriodTo:           dateFin,
			GeneratedAt:        time.Now().UTC().Format(time.RFC3339),
			Lines:              result.Lines,
			TotalDebit:         result.TotalDebit,
			TotalCredit:        result.TotalCredit,
			OpeningBalance:     result.OpeningBalance,
			TotalCount:         result.TotalCount,
			Page:               page,
			PageSize:           pageSize,
			VaultFreshness:     &fresh,
			Complete:           result.Complete,
			Coverage:           result.Coverage,
			FilterJournal:      journalCode,
			FilterPartner:      filterPartnerPtr,
			FilterPartnerName:  partnerName,
		}

		if log != nil {
			log.Debug().
				Str("tenant", tenant).
				Str("account", accountCode).
				Str("from", dateDebut).Str("to", dateFin).
				Int("lines", len(result.Lines)).
				Int("total", result.TotalCount).
				Str("journal", journalCode).
				Str("coverage", result.Coverage).
				Msg("general ledger")
		}

		return c.JSON(resp)
	}
}
