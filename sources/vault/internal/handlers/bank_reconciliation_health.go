package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/gofiber/fiber/v2"
)

// BankReconciliationHealthResponse is the response for GET /ui/system/bank-reconciliation-health
// (SPEC Indicateur Confiance Rapprochement Bancaire Linky v1.0 + Trésorerie v1.1).
type BankReconciliationHealthResponse struct {
	ReconciliationRate    *float64 `json:"reconciliation_rate"`
	LastStatementDate     *string  `json:"last_statement_date"`
	UnreconciledEntries   int      `json:"unreconciled_entries"`
	UnreconciledAmount    float64  `json:"unreconciled_amount"`
	BankAccountsCount     int      `json:"bank_accounts_count"`
	OldestUnreconciledDate *string  `json:"oldest_unreconciled_date,omitempty"` // SPEC Trésorerie v1.1 — date plus ancienne ligne non rapprochée (YYYY-MM-DD)
}

// BankReconciliationHealthHandler handles GET /ui/system/bank-reconciliation-health. Calls Odoo if configured.
func BankReconciliationHealthHandler(odooURL string) fiber.Handler {
	stub := BankReconciliationHealthResponse{
		ReconciliationRate: nil,
		LastStatementDate:  nil,
		UnreconciledEntries: 0,
		UnreconciledAmount:  0,
		BankAccountsCount:   0,
	}
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		companyID := c.Query("company_id")

		if odooURL == "" {
			return c.JSON(stub)
		}

		base, _ := url.Parse(odooURL)
		q := base.Query()
		if companyID != "" {
			q.Set("company_id", companyID)
		}
		base.RawQuery = q.Encode()

		req, err := http.NewRequestWithContext(c.Context(), http.MethodGet, base.String(), nil)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(stub)
		}
		req.Header.Set("Accept", "application/json")

		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(stub)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return c.Status(fiber.StatusServiceUnavailable).JSON(stub)
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(stub)
		}

		var data struct {
			ReconciliationRate     *float64 `json:"reconciliation_rate"`
			LastStatementDate      *string  `json:"last_statement_date"`
			UnreconciledEntries    int      `json:"unreconciled_entries"`
			UnreconciledAmount     float64  `json:"unreconciled_amount"`
			BankAccountsCount      int      `json:"bank_accounts_count"`
			OldestUnreconciledDate *string  `json:"oldest_unreconciled_date"`
		}
		if err := json.NewDecoder(bytes.NewReader(body)).Decode(&data); err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(stub)
		}

		return c.JSON(BankReconciliationHealthResponse{
			ReconciliationRate:     data.ReconciliationRate,
			LastStatementDate:      data.LastStatementDate,
			UnreconciledEntries:   data.UnreconciledEntries,
			UnreconciledAmount:    data.UnreconciledAmount,
			BankAccountsCount:     data.BankAccountsCount,
			OldestUnreconciledDate: data.OldestUnreconciledDate,
		})
	}
}
