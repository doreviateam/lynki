package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/gofiber/fiber/v2"
)

// BankReconciliationHealthResponse is the response for GET /ui/system/bank-reconciliation-health
// (SPEC Indicateur Confiance Rapprochement Bancaire Linky v1.0 + Trésorerie v1.1).
// Proxie vers Odoo ODOO_BANK_RECONCILIATION_URL pour last_statement_date, oldest_unreconciled_date, etc.
type BankReconciliationHealthResponse struct {
	ReconciliationRate     *float64 `json:"reconciliation_rate"`
	LastStatementDate      *string  `json:"last_statement_date"`
	UnreconciledEntries    int      `json:"unreconciled_entries"`
	UnreconciledAmount     float64  `json:"unreconciled_amount"`
	BankAccountsCount      int      `json:"bank_accounts_count"`
	OldestUnreconciledDate *string  `json:"oldest_unreconciled_date,omitempty"`
}

// BankReconciliationHealthHandler handles GET /ui/system/bank-reconciliation-health.
// Proxie vers Odoo si OdooBankReconciliationURL est configuré pour le tenant ; sinon stub (routage multi-tenant).
func BankReconciliationHealthHandler(odooURL string, cfg *config.Config) fiber.Handler {
	stub := BankReconciliationHealthResponse{
		ReconciliationRate:     nil,
		LastStatementDate:      nil,
		UnreconciledEntries:    0,
		UnreconciledAmount:     0,
		BankAccountsCount:      0,
		OldestUnreconciledDate: nil,
	}
	return func(c *fiber.Ctx) error {
		if c.Query("tenant") == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		tenant := c.Query("tenant")
		effectiveURL := ""
		if cfg != nil {
			if tenant == "laplatine2026" && cfg.OdooBankReconciliationURLLaplatine2026 != "" {
				effectiveURL = cfg.OdooBankReconciliationURLLaplatine2026
			} else if tenant == "o19" && cfg.OdooBankReconciliationURLO19 != "" {
				effectiveURL = cfg.OdooBankReconciliationURLO19
			} else if tenant == cfg.OdooBankReconciliationTenant {
				effectiveURL = odooURL
			}
		}
		if effectiveURL == "" {
			return c.JSON(stub)
		}
		// Proxy vers Odoo GET /dorevia/vault/linky_bank_reconciliation
		base, err := url.Parse(effectiveURL)
		if err != nil {
			return c.JSON(stub)
		}
		q := base.Query()
		q.Set("tenant", c.Query("tenant"))
		if companyID := c.Query("company_id"); companyID != "" {
			q.Set("company_id", companyID)
		}
		base.RawQuery = q.Encode()
		req, err := http.NewRequestWithContext(c.Context(), http.MethodGet, base.String(), nil)
		if err != nil {
			return c.JSON(stub)
		}
		req.Header.Set("Accept", "application/json")
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return c.JSON(stub)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return c.JSON(stub)
		}
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return c.JSON(stub)
		}
		var data struct {
			ReconciliationRate     *float64 `json:"reconciliation_rate"`
			LastStatementDate      *string  `json:"last_statement_date"`
			UnreconciledEntries    int      `json:"unreconciled_entries"`
			UnreconciledAmount    float64  `json:"unreconciled_amount"`
			BankAccountsCount     int      `json:"bank_accounts_count"`
			OldestUnreconciledDate *string  `json:"oldest_unreconciled_date"`
		}
		if err := json.Unmarshal(body, &data); err != nil {
			return c.JSON(stub)
		}
		return c.JSON(BankReconciliationHealthResponse{
			ReconciliationRate:     data.ReconciliationRate,
			LastStatementDate:      data.LastStatementDate,
			UnreconciledEntries:    data.UnreconciledEntries,
			UnreconciledAmount:     data.UnreconciledAmount,
			BankAccountsCount:      data.BankAccountsCount,
			OldestUnreconciledDate: data.OldestUnreconciledDate,
		})
	}
}
