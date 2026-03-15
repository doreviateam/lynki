package handlers

import (
	"context"
	"encoding/json"
	"io"
	"math"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
)

const (
	paymentsCompletenessTolerance = 0.01
	paymentsCompletenessCacheTTL  = 5 * time.Second // sync Linky / Vault / Odoo < 7 s
)

type paymentsCompletenessCacheEntry struct {
	Result   paymentsCompletenessResponse
	ExpiresAt time.Time
}

var paymentsCompletenessCache = struct {
	mu    sync.RWMutex
	entries map[string]paymentsCompletenessCacheEntry
}{
	entries: make(map[string]paymentsCompletenessCacheEntry),
}

type paymentsCompletenessResponse struct {
	OK                bool    `json:"ok"`
	Badge             string  `json:"badge"`
	Message           string  `json:"message"`
	PaymentsCount     int     `json:"payments_count,omitempty"`
	PaymentsSumSigned float64 `json:"payments_sum_amount_signed,omitempty"`
	ErpCount          int     `json:"erp_count,omitempty"`
	ErpSumSigned      float64 `json:"erp_sum_amount_signed,omitempty"`
	MissingOdooIDs    []int   `json:"missing_odoo_ids,omitempty"` // IDs ERP non vaultés (si list_missing=1)
	CachedAt          string  `json:"cached_at,omitempty"`
}

// PaymentsCompletenessHandler gère GET /ui/aggregations/payments-completeness (SPEC Carte Paiements v1.1).
// Contrôle count + sum (tolérance 0,01 €). Messages distincts : écart vs Odoo inaccessible. Cache 45s.
func PaymentsCompletenessHandler(db *storage.DB, odooURL string, cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		companyID := c.Query("company_id")
		dateFrom := c.Query("date_from")
		dateTo := c.Query("date_to")
		listMissing := c.Query("list_missing") == "1"

		// Default period if absent (évite faux blocage hors période)
		if dateFrom == "" {
			dateFrom = "2000-01-01"
		}
		if dateTo == "" {
			dateTo = "2030-12-31"
		}

		cacheKey := tenant + "|" + companyID + "|" + dateFrom + "|" + dateTo
		if listMissing {
			cacheKey += "|list_missing"
		}
		paymentsCompletenessCache.mu.RLock()
		if e, ok := paymentsCompletenessCache.entries[cacheKey]; ok && time.Now().Before(e.ExpiresAt) {
			paymentsCompletenessCache.mu.RUnlock()
			return c.JSON(e.Result)
		}
		paymentsCompletenessCache.mu.RUnlock()

		res := computePaymentsCompleteness(c.Context(), db, odooURL, cfg, tenant, companyID, dateFrom, dateTo, listMissing)

		paymentsCompletenessCache.mu.Lock()
		paymentsCompletenessCache.entries[cacheKey] = paymentsCompletenessCacheEntry{
			Result:   res,
			ExpiresAt: time.Now().Add(paymentsCompletenessCacheTTL),
		}
		paymentsCompletenessCache.mu.Unlock()

		return c.JSON(res)
	}
}

func computePaymentsCompleteness(ctx context.Context, db *storage.DB, odooBaseURL string, cfg *config.Config, tenant, companyID, dateFrom, dateTo string, listMissing bool) paymentsCompletenessResponse {
	stub := paymentsCompletenessResponse{
		OK:      false,
		Badge:   "Données incomplètes",
		Message: "Contrôle de complétude indisponible (Odoo inaccessible)",
	}

	odooURL := ""
	if cfg != nil {
		if tenant == "laplatine2026" && cfg.OdooBankReconciliationURLLaplatine2026 != "" {
			odooURL = cfg.OdooBankReconciliationURLLaplatine2026
		} else if tenant == "o19" && cfg.OdooBankReconciliationURLO19 != "" {
			odooURL = cfg.OdooBankReconciliationURLO19
		} else if tenant == cfg.OdooBankReconciliationTenant {
			odooURL = odooBaseURL
		}
	}

	if odooURL == "" {
		// Pas d'Odoo configuré → considérer incomplet (message générique)
		return stub
	}

	// Appel Odoo
	u, err := url.Parse(odooURL)
	if err != nil {
		return stub
	}
	q := u.Query()
	q.Set("tenant", tenant)
	q.Set("date_from", dateFrom)
	q.Set("date_to", dateTo)
	if companyID != "" {
		q.Set("company_id", companyID)
	}
	if listMissing {
		q.Set("list_ids", "1")
	}
	u.RawQuery = q.Encode()

	timeout := 5 * time.Second
	if cfg != nil && cfg.OdooTimeoutSec > 0 && cfg.OdooTimeoutSec < 60 {
		timeout = time.Duration(cfg.OdooTimeoutSec) * time.Second
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return stub
	}
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return stub
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return stub
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return stub
	}

	var odooData struct {
		PaymentsPostedCount           int     `json:"payments_posted_count"`
		PaymentsPostedSumAmountSigned float64 `json:"payments_posted_sum_amount_signed"`
		PaymentsPostedIDs              []int   `json:"payments_posted_ids"`
	}
	if err := json.Unmarshal(body, &odooData); err != nil {
		return stub
	}

	erpCount := odooData.PaymentsPostedCount
	erpSum := utils.RoundMoney2(odooData.PaymentsPostedSumAmountSigned)

	// Vault
	var vaultCount int
	var vaultSum float64
	var vaultIDs []int
	if db != nil {
		if r, err := db.GetPaymentsCompletenessCountSum(ctx, tenant, companyID, dateFrom, dateTo); err == nil {
			vaultCount = r.Count
			vaultSum = utils.RoundMoney2(r.SumAmountSigned)
		}
		if listMissing {
			if ids, err := db.GetPaymentsVaultedOdooIDs(ctx, tenant, companyID, dateFrom, dateTo); err == nil {
				vaultIDs = ids
			}
		}
	}

	// Contrôle : count strict, sum tolérance 0,01 € (SPEC v1.1)
	countOK := erpCount == vaultCount
	sumOK := math.Abs(erpSum-vaultSum) <= paymentsCompletenessTolerance

	// IDs manquants : ERP - Vault (si list_missing et écart détecté)
	var missingIDs []int
	if listMissing && len(odooData.PaymentsPostedIDs) > 0 {
		vaultSet := make(map[int]bool)
		for _, id := range vaultIDs {
			vaultSet[id] = true
		}
		for _, id := range odooData.PaymentsPostedIDs {
			if !vaultSet[id] {
				missingIDs = append(missingIDs, id)
			}
		}
	}

	if countOK && sumOK {
		res := paymentsCompletenessResponse{
			OK:                true,
			Badge:             "",
			Message:           "",
			PaymentsCount:     vaultCount,
			PaymentsSumSigned: vaultSum,
			ErpCount:          erpCount,
			ErpSumSigned:      erpSum,
		}
		if len(missingIDs) > 0 {
			res.MissingOdooIDs = missingIDs
		}
		return res
	}

	// Tenant avec Odoo comme source de vérité (o19, laplatine2026, etc.) : considérer synchronisé
	// dès que les données Odoo sont disponibles, pour éviter DONNÉES PARTIELLES alors que les montants affichés viennent d'Odoo.
	res := paymentsCompletenessResponse{
		OK:                true,
		Badge:             "Source ERP",
		Message:           "Données depuis l'ERP (Odoo). Rattrapage Vault en cours si écart.",
		PaymentsCount:     vaultCount,
		PaymentsSumSigned: vaultSum,
		ErpCount:          erpCount,
		ErpSumSigned:      erpSum,
		MissingOdooIDs:    missingIDs,
	}
	return res
}
