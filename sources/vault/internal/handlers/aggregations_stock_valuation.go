package handlers

import (
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// StockValuationSnapshotPayload body POST /internal/stock-valuation-snapshot (ZeDocs/web52 spec §2.1).
type StockValuationSnapshotPayload struct {
	Tenant          string   `json:"tenant"`
	CompanyID       string   `json:"company_id"`
	AsOfDate        string   `json:"as_of_date"` // YYYY-MM-DD
	Value           float64  `json:"value"`
	Currency        string   `json:"currency"`
	Source          string   `json:"source"`
	ValuationMethod *string  `json:"valuation_method,omitempty"`
}

const stockValuationSourceCanonical = "odoo.inventory.valuation"

// StockValuationSnapshotPostHandler gère POST /internal/stock-valuation-snapshot.
// Protégé par Bearer token (STOCK_VALUATION_INTERNAL_TOKEN). Upsert ; created_at immuable.
func StockValuationSnapshotPostHandler(db *storage.DB, cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "database not configured"})
		}
		auth := c.Get("Authorization")
		token := ""
		if len(auth) > 7 && (auth[:7] == "Bearer " || auth[:7] == "bearer ") {
			token = auth[7:]
		}
		expected := ""
		if cfg != nil {
			expected = cfg.StockValuationInternalToken
		}
		if expected == "" || token != expected {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing or invalid internal token"})
		}

		var p StockValuationSnapshotPayload
		if err := c.BodyParser(&p); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
		}
		if p.Tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if p.CompanyID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "company_id is required"})
		}
		if p.AsOfDate == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "as_of_date is required"})
		}
		if p.Currency == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "currency is required"})
		}
		if p.Source == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "source is required"})
		}
		asOfDate, err := time.Parse("2006-01-02", p.AsOfDate)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "as_of_date must be YYYY-MM-DD"})
		}
		if p.Source != stockValuationSourceCanonical {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "source must be " + stockValuationSourceCanonical})
		}

		row := &storage.StockValuationSnapshot{
			Tenant:          p.Tenant,
			CompanyID:       p.CompanyID,
			AsOfDate:        asOfDate,
			Value:           p.Value,
			Currency:        p.Currency,
			Source:          p.Source,
			ValuationMethod: p.ValuationMethod,
		}
		if err := db.UpsertStockValuationSnapshot(c.Context(), row); err != nil {
			if log != nil {
				log.Warn().Err(err).Str("tenant", p.Tenant).Str("company_id", p.CompanyID).Msg("UpsertStockValuationSnapshot failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(fiber.Map{"ok": true, "as_of_date": p.AsOfDate})
	}
}

// StockValuationHandler gère GET /ui/aggregations/stock-valuation.
// Paramètres obligatoires : tenant, company_id. Optionnel : as_of_date. 404 si aucun snapshot.
func StockValuationHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "database not configured"})
		}
		tenant := c.Query("tenant")
		companyID := c.Query("company_id")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if companyID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "company_id is required"})
		}
		var asOfDate *time.Time
		if ad := c.Query("as_of_date"); ad != "" {
			t, err := time.Parse("2006-01-02", ad)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "as_of_date must be YYYY-MM-DD"})
			}
			asOfDate = &t
		}
		row, err := db.GetStockValuationSnapshot(c.Context(), tenant, companyID, asOfDate)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if row == nil {
			return c.Status(fiber.StatusNotFound).SendString("")
		}
		return c.JSON(fiber.Map{
			"value":       row.Value,
			"currency":    row.Currency,
			"as_of_date":  row.AsOfDate.Format("2006-01-02"),
			"company_id":  row.CompanyID,
		})
	}
}

// StockSeriesHandler gère GET /ui/aggregations/stock-series.
// Paramètres obligatoires : tenant, company_id, date_debut, date_fin. 200 + series vide si aucun point.
func StockSeriesHandler(db *storage.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "database not configured"})
		}
		tenant := c.Query("tenant")
		companyID := c.Query("company_id")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		if companyID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "company_id is required"})
		}
		if dateDebut == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_debut is required"})
		}
		if dateFin == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_fin is required"})
		}
		dateStart, err1 := time.Parse("2006-01-02", dateDebut)
		dateEnd, err2 := time.Parse("2006-01-02", dateFin)
		if err1 != nil || err2 != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_debut and date_fin must be YYYY-MM-DD"})
		}
		if dateEnd.Before(dateStart) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "date_fin must be >= date_debut"})
		}

		rows, err := db.GetStockValuationSnapshots(c.Context(), tenant, companyID, dateStart, dateEnd)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		series := make([]fiber.Map, 0, len(rows))
		currency := "EUR"
		for _, r := range rows {
			if r.Currency != "" {
				currency = r.Currency
			}
			series = append(series, fiber.Map{
				"period": r.AsOfDate.Format("2006-01-02"),
				"amount": r.Value,
			})
		}
		return c.JSON(fiber.Map{"series": series, "currency": currency})
	}
}
