package handlers

import (
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

type lynkiAgedBalanceResponse struct {
	RestitutionID           string                          `json:"restitution_id"`
	ReferentielVersion      string                          `json:"referentiel_version"`
	Tenant                  string                          `json:"tenant"`
	CompanyID               *string                         `json:"company_id,omitempty"`
	CompanyIDs              []int32                         `json:"company_ids,omitempty"`
	AsOfDate                string                          `json:"as_of_date"`
	GeneratedAt             string                          `json:"generated_at"`
	Lines                   []storage.AgedBalanceLine       `json:"lines"`
	Complete                bool                            `json:"complete"`
	Coverage                string                          `json:"coverage,omitempty"`
	AgingBasis              storage.AgingBasis              `json:"aging_basis"`
	V2Limitations           []string                        `json:"v2_limitations,omitempty"`
	PartialMatchingCoverage storage.PartialMatchingCoverage `json:"partial_matching_coverage"`
}

func parseAgedBalanceQuery(c *fiber.Ctx, balanceType storage.AgedBalanceType) (*storage.AgedBalanceQuery, string, error) {
	tenant := c.Query("tenant")
	if tenant == "" {
		return nil, "", fiber.NewError(fiber.StatusBadRequest, "tenant is required")
	}
	asOfDate := strings.TrimSpace(c.Query("as_of_date"))
	if asOfDate == "" {
		return nil, "", fiber.NewError(fiber.StatusBadRequest, "as_of_date is required (YYYY-MM-DD)")
	}
	v := validators.NewValidator()
	if err := v.ValidateDate(asOfDate + "T00:00:00Z"); err != nil {
		return nil, "", fiber.NewError(fiber.StatusBadRequest, "invalid as_of_date (use YYYY-MM-DD)")
	}
	companyIDs, companyIDStr, err := parseCompanyFilter(c)
	if err != nil {
		return nil, "", err
	}
	return &storage.AgedBalanceQuery{
		Tenant:     tenant,
		AsOfDate:   asOfDate,
		CompanyIDs: companyIDs,
		Type:       balanceType,
	}, companyIDStr, nil
}

// AgedReceivablesHandler GET /api/accounting/aged-receivables — Sprint 09 T50.
func AgedReceivablesHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return agedBalanceHandler(db, log, storage.AgedReceivables, "lynki.accounting.aged_receivables")
}

// AgedPayablesHandler GET /api/accounting/aged-payables — Sprint 09 T51.
func AgedPayablesHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler {
	return agedBalanceHandler(db, log, storage.AgedPayables, "lynki.accounting.aged_payables")
}

func agedBalanceHandler(db *storage.DB, log *zerolog.Logger, balanceType storage.AgedBalanceType, restitutionID string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Database not configured"})
		}
		q, companyIDStr, err := parseAgedBalanceQuery(c, balanceType)
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

		var companyPtr *string
		if companyIDStr != "" {
			companyPtr = &companyIDStr
		}

		resp := lynkiAgedBalanceResponse{
			RestitutionID:           restitutionID,
			ReferentielVersion:      referentielVersionLynki,
			Tenant:                  q.Tenant,
			CompanyID:               companyPtr,
			CompanyIDs:              q.CompanyIDs,
			AsOfDate:                q.AsOfDate,
			GeneratedAt:             time.Now().UTC().Format(time.RFC3339),
			Lines:                   result.Lines,
			Complete:                result.Complete,
			Coverage:                result.Coverage,
			AgingBasis:              result.AgingBasis,
			V2Limitations:           result.V2Limitations,
			PartialMatchingCoverage: result.PartialMatchingCoverage,
		}
		if resp.Lines == nil {
			resp.Lines = []storage.AgedBalanceLine{}
		}

		if log != nil {
			log.Debug().
				Str("tenant", q.Tenant).
				Str("as_of", q.AsOfDate).
				Int("partners", len(resp.Lines)).
				Str("type", restitutionID).
				Msg("aged balance")
		}
		return c.JSON(resp)
	}
}
