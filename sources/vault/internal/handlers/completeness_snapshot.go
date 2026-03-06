package handlers

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/cache"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/validators"
	"github.com/gofiber/fiber/v2"
)

// CompletenessSnapshotResponse réponse GET /ui/completeness-snapshot
// Spec: SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1 §3.8 — Linky lit un état matérialisé
type CompletenessSnapshotResponse struct {
	SealedCount        int             `json:"sealed_count"`
	ExpectedCount      *int            `json:"expected_count,omitempty"`
	Complete           bool            `json:"complete"`
	SealedCountSources map[string]bool `json:"sealed_count_sources"`
	GeneratedAt        *string         `json:"generated_at,omitempty"` // ISO 8601 — "Dernière synchronisation"
}

// CompletenessSnapshotHandler gère GET /ui/completeness-snapshot
// Paramètres : tenant, date_debut, date_fin, company_id (optionnel)
// Fallback : si endpoint indisponible, Linky utilise la logique 5 endpoints.
// Si snapshotCache != nil, les réponses sont mises en cache 5 s (clé: tenant+company_id+date_debut+date_fin).
func CompletenessSnapshotHandler(db *storage.DB, snapshotCache *cache.CompletenessSnapshotCache) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		companyID := c.Query("company_id")

		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "tenant is required",
			})
		}
		if dateDebut == "" {
			dateDebut = "2000-01-01"
		}
		if dateFin == "" {
			dateFin = "2030-12-31"
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		v := validators.NewValidator()
		if err := v.ValidateDate(dateDebut + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid date_debut (use YYYY-MM-DD)",
			})
		}
		if err := v.ValidateDate(dateFin + "T00:00:00Z"); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid date_fin (use YYYY-MM-DD)",
			})
		}

		// Cache Vault 5 s — T2.7 : éviter lectures DB répétées pour le même scope
		if snapshotCache != nil {
			if cached := snapshotCache.Get(tenant, companyID, dateDebut, dateFin); len(cached) > 0 {
				c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
				return c.Send(cached)
			}
		}

		ctx := c.Context()
		commonParams := []interface{}{tenant, dateDebut, dateFin}
		if companyID != "" {
			commonParams = append(commonParams, companyID)
		}

		salesRes, errSales := db.SalesAggregation(ctx, tenant, dateDebut, dateFin, "month", companyID)
		purchasesRes, errPurchases := db.PurchasesAggregation(ctx, tenant, dateDebut, dateFin, "month", companyID)
		paymentsInRes, errPaymentsIn := db.PaymentsAggregation(ctx, tenant, dateDebut, dateFin, "month", companyID, "inbound")
		paymentsOutRes, errPaymentsOut := db.PaymentsAggregation(ctx, tenant, dateDebut, dateFin, "month", companyID, "outbound")
		posRes, errPos := db.PosSessionsAggregation(ctx, tenant, dateDebut, dateFin, "")

		salesOk := errSales == nil && salesRes != nil && salesRes.InvoicesCount >= 0
		purchasesOk := errPurchases == nil && purchasesRes != nil && purchasesRes.InvoicesCount >= 0
		paymentsInOk := errPaymentsIn == nil && paymentsInRes != nil && paymentsInRes.PaymentCount >= 0
		paymentsOutOk := errPaymentsOut == nil && paymentsOutRes != nil && paymentsOutRes.PaymentCount >= 0
		posOk := errPos == nil && posRes != nil && posRes.Items != nil

		complete := salesOk && purchasesOk && paymentsInOk && paymentsOutOk && posOk

		salesCount := 0
		if salesRes != nil {
			salesCount = salesRes.InvoicesCount
		}
		purchasesCount := 0
		if purchasesRes != nil {
			purchasesCount = purchasesRes.InvoicesCount
		}
		paymentsInCount := 0
		if paymentsInRes != nil {
			paymentsInCount = paymentsInRes.PaymentCount
		}
		paymentsOutCount := 0
		if paymentsOutRes != nil {
			paymentsOutCount = paymentsOutRes.PaymentCount
		}
		posSealedCount := 0
		if posRes != nil {
			for _, item := range posRes.Items {
				if strings.EqualFold(item.VaultStatus, "sealed") {
					posSealedCount++
				}
			}
		}

		sealedCount := posSealedCount + salesCount + purchasesCount + paymentsInCount + paymentsOutCount

		var expectedCount *int
		if total, err := db.ExpectedCountsTotal(ctx, tenant, companyID, dateDebut, dateFin); err == nil && total > 0 {
			expectedCount = &total // Phase DVIG : déclaré par connecteur
		} else if complete {
			expectedCount = &sealedCount // Fallback : identique au sealed quand complétude OK
		}

		var generatedAt *string
		if t, err := db.ExpectedCountsGeneratedAt(ctx, tenant, companyID, dateDebut, dateFin); err == nil && t != nil {
			s := t.Format(time.RFC3339)
			generatedAt = &s
		}

		resp := CompletenessSnapshotResponse{
			SealedCount:        sealedCount,
			ExpectedCount:      expectedCount,
			Complete:           complete,
			GeneratedAt:        generatedAt,
			SealedCountSources: map[string]bool{
				"sales":       salesOk,
				"purchases":   purchasesOk,
				"paymentsIn":  paymentsInOk,
				"paymentsOut": paymentsOutOk,
				"pos":         posOk,
			},
		}

		body, err := json.Marshal(resp)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "marshal failed"})
		}
		if snapshotCache != nil {
			snapshotCache.Set(tenant, companyID, dateDebut, dateFin, body)
		}
		c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		return c.Send(body)
	}
}
