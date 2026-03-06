package handlers

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"io"
	"math"
	"net/http"
	"net/url"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// TreasuryAggregationHandler gère GET /ui/aggregations/treasury (SPEC Trésorerie v4.1).
// Linky appelle uniquement le Vault ; le Vault agrège projection RECONCIL + proxy Odoo (erp_balance).
// Routage multi-tenant : ODOO_BANK_RECONCILIATION_URL s'applique uniquement au tenant configuré
// (ODOO_BANK_RECONCILIATION_TENANT). Pour les autres (ex. laplatine2026), pas de fallback Odoo → données projection seule.
func TreasuryAggregationHandler(db *storage.DB, odooURL string, cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "tenant is required",
			})
		}
		companyID := c.Query("company_id")
		dateDebut := c.Query("date_debut")
		dateFin := c.Query("date_fin")
		if dateDebut == "" {
			dateDebut = "2000-01-01"
		}
		if dateFin == "" {
			dateFin = "2030-12-31"
		}

		// Routage multi-tenant : URL par tenant
		odooURLForTenant := ""
		if cfg != nil {
			if tenant == "laplatine2026" && cfg.OdooBankReconciliationURLLaplatine2026 != "" {
				odooURLForTenant = cfg.OdooBankReconciliationURLLaplatine2026
			} else if tenant == cfg.OdooBankReconciliationTenant {
				odooURLForTenant = odooURL
			}
		}

		if db != nil {
			if res := treasuryFromProjectionAndOdoo(c.Context(), db, odooURLForTenant, cfg, tenant, companyID, dateDebut, dateFin, log); res != nil {
				return c.JSON(res)
			}
		}

		return c.JSON(buildTreasuryStub())
	}
}

// treasuryFromProjectionAndOdoo agrège projection RECONCIL + erp_balance Odoo → réponse v4.1.
func treasuryFromProjectionAndOdoo(ctx context.Context, db *storage.DB, odooURL string, cfg *config.Config, tenant, companyID, dateDebut, dateFin string, log *zerolog.Logger) fiber.Map {
	// 1. Lecture projection RECONCIL
	proj, err := db.GetBankReconciliationProjectionSums(ctx, tenant, companyID)
	if err != nil {
		return nil
	}

	vb := proj.ValidatedBalance
	_ = proj.UnreconciledBalance // réservé (optionnel future)
	rv := proj.ReconciledVolume
	uv := proj.UnreconciledVolume

	// Règle : À traiter et Traité proviennent UNIQUEMENT du Vault. Pas de proxy Odoo.
	// Si projection vide mais paiements vaultés → À traiter = volume des paiements vaultés (données Vault).
	if rv == 0 && uv == 0 {
		if vol, err := db.GetVaultedPaymentsVolumeTotal(ctx, tenant, companyID); err == nil && vol > 0 {
			uv = vol // À traiter = paiements vaultés en attente de rapprochement
		}
	}

	// 2. Appel Odoo pour erp_balance + health (bank_accounts_count, last_statement_date, etc.)
	var erpBalance *float64
	var bankAccountsCount *int
	var lastStatementDate, oldestUnreconciledDate *string
	if odooURL != "" {
		var odooReconciled, odooUnreconciled float64
		erpBalance, bankAccountsCount, lastStatementDate, oldestUnreconciledDate, odooReconciled, odooUnreconciled = fetchOdooTreasuryData(ctx, odooURL, tenant, companyID, cfg)
		_ = odooReconciled
		_ = odooUnreconciled
	}

	// 3. last_reconcil_event_at (optionnel)
	var lastReconcilAt *time.Time
	if last, err := db.GetLastReconcilEventAt(ctx, tenant, companyID); err == nil {
		lastReconcilAt = last
	}

	// 4. Confirmation bancaire (SPEC v1.3) — agrégation depuis financial_recon_deltas
	var confirmation *storage.ConfirmationAggregation
	if agg, err := db.GetConfirmationAggregation(ctx, tenant, companyID); err == nil {
		confirmation = agg
	}

	// 5. Reconciliation metrics « Reste à rapprocher » (SPEC web38)
	var reconMetrics *storage.ReconciliationMetricsResult
	if metrics, err := db.GetReconciliationMetrics(ctx, tenant, dateDebut, dateFin, companyID); err == nil {
		reconMetrics = metrics
	} else if log != nil {
		log.Warn().Err(err).Str("tenant", tenant).Str("company_id", companyID).Msg("GetReconciliationMetrics failed, reconciliation_metrics omitted")
	}

	// 6. Construction réponse v4.1 + confirmation + reconciliation_metrics
	return buildTreasuryResponse(vb, rv, uv, erpBalance, lastReconcilAt, companyID, bankAccountsCount, lastStatementDate, oldestUnreconciledDate, confirmation, reconMetrics, log)
}

func fetchOdooTreasuryData(ctx context.Context, baseURL, tenant, companyID string, cfg *config.Config) (*float64, *int, *string, *string, float64, float64) {
	u, err := url.Parse(baseURL)
	if err != nil {
		return nil, nil, nil, nil, 0, 0
	}
	q := u.Query()
	q.Set("tenant", tenant)
	if companyID != "" {
		q.Set("company_id", companyID)
	}
	u.RawQuery = q.Encode()

	timeout := 5 * time.Second
	if cfg != nil && cfg.OdooTimeoutSec > 0 && cfg.OdooTimeoutSec < 60 {
		timeout = time.Duration(cfg.OdooTimeoutSec) * time.Second
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, nil, nil, nil, 0, 0
	}
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, nil, nil, nil, 0, 0
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, nil, nil, nil, 0, 0
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, nil, nil, 0, 0
	}

	var data struct {
		ErpBalance            *float64 `json:"erp_balance"`
		ReconciledBalance      float64  `json:"reconciled_balance"`
		UnreconciledBalance    float64  `json:"unreconciled_balance"`
		BankAccountsCount     int      `json:"bank_accounts_count"`
		LastStatementDate     *string  `json:"last_statement_date"`
		OldestUnreconciledDate *string  `json:"oldest_unreconciled_date"`
		Debug *struct {
			BankBalance *float64 `json:"bank_balance"`
		} `json:"_debug"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, nil, nil, nil, 0, 0
	}
	var erp *float64
	if data.ErpBalance != nil {
		v := utils.RoundMoney2(*data.ErpBalance)
		erp = &v
	} else if data.Debug != nil && data.Debug.BankBalance != nil {
		v := utils.RoundMoney2(*data.Debug.BankBalance)
		erp = &v
	}
	bac := &data.BankAccountsCount
	odooReconciled := utils.RoundMoney2(data.ReconciledBalance)
	odooUnreconciled := utils.RoundMoney2(data.UnreconciledBalance)
	return erp, bac, data.LastStatementDate, data.OldestUnreconciledDate, odooReconciled, odooUnreconciled
}

func buildTreasuryResponse(validatedBalance, reconciledVol, unreconciledVol float64, erpBalance *float64, lastReconcilAt *time.Time, companyID string, bankAccountsCount *int, lastStatementDate, oldestUnreconciledDate *string, confirmation *storage.ConfirmationAggregation, reconMetrics *storage.ReconciliationMetricsResult, log *zerolog.Logger) fiber.Map {
	now := time.Now().UTC()
	genAt := now.Format(time.RFC3339)

	// Arrondi post-aggregation (SPEC §4.2)
	vb := utils.RoundMoney2(validatedBalance)
	rv := utils.RoundMoney2(reconciledVol)
	uv := utils.RoundMoney2(unreconciledVol)

	// Décision Produit 2026-02-25 : suspension exploitation confirmation — toujours proxy (données ERP)
	// L'infrastructure confirmation est conservée comme capacité latente (confirmation calculée mais non exposée)
	totalVol := rv + uv
	// rv = Σ ABS(reconciled), uv = Σ ABS(unreconciled) — Traité = rv, À traiter = uv
	processReconciled := rv
	processUnreconciled := uv
	// Quand projection vide (totalVol=0), ne pas afficher 100 % — indéterminé (Diagnostic Sweet Manihot 2026-02-25)
	// reliability_volume = taux de rapprochement = part traitée (rv/total)
	var reliabilityVolume interface{} = nil
	if totalVol > 0 {
		reliabilityVolume = utils.RoundMoney2(rv / totalVol)
	}
	processSource := "proxy"

	// Position (dépend d'erp_balance)
	var position fiber.Map
	var flags fiber.Map
	if erpBalance == nil {
		// Mode dégradé (SPEC §7.2) — Odoo indisponible
		position = fiber.Map{
			"validated_balance":    vb,
			"erp_balance":         nil,
			"unvalidated_exposure": nil,
			"reliability_position": nil,
		}
		flags = fiber.Map{
			"sign_mismatch":     false,
			"large_delta":       false,
			"structural_delta":  false,
		}
	} else {
		eb := *erpBalance
		unvalidated := utils.RoundMoney2(eb - vb)

		// reliability_position = LEAST(1, ABS(vb)/ABS(eb)), clamp si vb > eb
		reliabilityPosition := 1.0
		if math.Abs(eb) > 1e-9 {
			ratio := math.Abs(vb) / math.Abs(eb)
			if ratio > 1 {
				ratio = 1
			}
			reliabilityPosition = utils.RoundMoney2(ratio)
		}

		// Flags
		signMismatch := (eb > 0 && vb < 0) || (eb < 0 && vb > 0)
		threshold := utils.ComputeLargeDeltaThreshold(eb)
		largeDelta := math.Abs(unvalidated) > threshold
		structuralDelta := math.Abs(vb) > math.Abs(eb)

		position = fiber.Map{
			"validated_balance":    vb,
			"erp_balance":         eb,
			"unvalidated_exposure": unvalidated,
			"reliability_position": reliabilityPosition,
		}
		flags = fiber.Map{
			"sign_mismatch":    signMismatch,
			"large_delta":      largeDelta,
			"structural_delta": structuralDelta,
		}
	}

	process := fiber.Map{
		"reconciled_volume":   processReconciled,
		"unreconciled_volume": processUnreconciled,
		"reliability_volume":  reliabilityVolume,
		"source":              processSource,
	}

	companyIDOut := 0
	if companyID != "" && companyID != "0" {
		if cid, err := parseCompanyID(companyID); err == nil {
			companyIDOut = cid
		}
	}
	res := fiber.Map{
		"company_id":   companyIDOut,
		"position":     position,
		"process":      process,
		"flags":        flags,
		"generated_at": genAt,
	}
	// confirmation exposée pour Carte Paiements (Option A — SPEC v1.1, reprise Décision Produit 2026-02-25)
	if confirmation != nil {
		res["confirmation"] = fiber.Map{
			"total_amount_abs":       confirmation.TotalAmountAbs,
			"confirmed_amount_abs":   confirmation.ConfirmedAmountAbs,
			"unconfirmed_amount_abs": confirmation.UnconfirmedAmountAbs,
			"confirmation_rate":      confirmation.ConfirmationRate,
		}
	}

	// reconciliation_metrics « Reste à rapprocher » (SPEC web38)
	if reconMetrics != nil {
		res["reconciliation_metrics"] = fiber.Map{
			"total_amount_abs":      reconMetrics.TotalAmountAbs,
			"reconciled_amount_abs":  reconMetrics.ReconciledAmountAbs,
			"remaining_amount_abs":   reconMetrics.RemainingAmountAbs,
			"remaining_ratio":        reconMetrics.RemainingRatio,
			"generated_at":           genAt,
		}
	}

	if lastReconcilAt != nil {
		res["last_reconcil_event_at"] = lastReconcilAt.Format(time.RFC3339)
	}

	// Legacy (rétrocompat) — process reflète confirmation ou proxy selon disponibilité
	res["reconciled_balance"] = processReconciled
	res["unreconciled_balance"] = processUnreconciled
	res["accounting_balance"] = totalVol
	res["total"] = totalVol
	res["reconciled"] = processReconciled
	res["unreconciled"] = processUnreconciled
	res["reliability_rate"] = reliabilityVolume
	res["reconciliation_rate"] = reliabilityVolume
	res["currency"] = "EUR"

	if bankAccountsCount != nil {
		res["bank_accounts_count"] = *bankAccountsCount
	}
	if lastStatementDate != nil {
		res["last_statement_date"] = *lastStatementDate
	}
	if oldestUnreconciledDate != nil {
		res["oldest_unreconciled_date"] = *oldestUnreconciledDate
	}

	return res
}

func parseCompanyID(s string) (int, error) {
	if idx := strings.Index(s, ":"); idx >= 0 {
		s = s[idx+1:]
	}
	return strconv.Atoi(s)
}

func buildTreasuryStub() fiber.Map {
	position := fiber.Map{
		"validated_balance":    0,
		"erp_balance":          nil,
		"unvalidated_exposure":  nil,
		"reliability_position": nil,
	}
	return fiber.Map{
		"company_id":           0,
		"position":             position,
		"process":              fiber.Map{"reconciled_volume": 0, "unreconciled_volume": 0, "reliability_volume": 1.0, "source": "proxy"},
		"flags":                fiber.Map{"sign_mismatch": false, "large_delta": false, "structural_delta": false},
		"generated_at":         time.Now().UTC().Format(time.RFC3339),
		"reconciled_balance":  0,
		"unreconciled_balance": 0,
		"accounting_balance":  0,
		"total":               0,
		"reconciled":          0,
		"unreconciled":        0,
		"reliability_rate":     nil,
		"reconciliation_rate": nil,
		"currency":             "EUR",
	}
}
