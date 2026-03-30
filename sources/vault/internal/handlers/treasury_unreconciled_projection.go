package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// TreasuryUnreconciledProjectionHandler gère GET /ui/aggregations/treasury-unreconciled-lines.
// Liste les move_id non rapprochés depuis bank_reconciliation_projection (T-TR-DETAIL-003, V1 projection).
// Query : tenant (requis), company_id (optionnel), limit (défaut 50, max 200), offset (défaut 0, max 10000).
// Retourne aussi aging_buckets (comptage global) et has_more (heuristique : len(items)==limit).
func TreasuryUnreconciledProjectionHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.JSON(fiber.Map{"items": []any{}, "source": "none", "partial": true})
		}
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		companyID := c.Query("company_id")
		limit := c.QueryInt("limit", 50)
		if limit > 200 {
			limit = 200
		}
		if limit < 1 {
			limit = 50
		}
		offset := c.QueryInt("offset", 0)
		if offset < 0 {
			offset = 0
		}
		if offset > 10000 {
			offset = 10000
		}

		aging, agingErr := db.CountUnreconciledProjectionByAgingBuckets(c.Context(), tenant, companyID)
		lines, err := db.ListBankReconciliationUnreconciledProjection(c.Context(), tenant, companyID, limit, offset)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "query_failed",
				"items":   []any{},
				"source":  "bank_reconciliation_projection",
				"partial": true,
			})
		}
		items := make([]fiber.Map, 0, len(lines))
		for _, row := range lines {
			m := fiber.Map{
				"move_id":            row.MoveID,
				"amount":             utils.RoundMoney2(row.Amount),
				"last_transition_at": row.LastTransitionAt.UTC().Format(time.RFC3339),
			}
			if row.AccountID != nil {
				m["account_id"] = *row.AccountID
			} else {
				m["account_id"] = nil
			}
			if row.CompanyID != nil {
				m["company_id"] = *row.CompanyID
			}
			items = append(items, m)
		}

		agingPayload := fiber.Map{"0_7": 0, "8_30": 0, "30_plus": 0}
		if agingErr == nil {
			agingPayload = fiber.Map{
				"0_7":     aging.D0To7,
				"8_30":    aging.D8To30,
				"30_plus": aging.D30Plus,
			}
		}

		return c.JSON(fiber.Map{
			"items":         items,
			"source":        "bank_reconciliation_projection",
			"partial":       true,
			"limit":         limit,
			"offset":        offset,
			"has_more":      len(lines) == limit,
			"aging_buckets": agingPayload,
		})
	}
}
