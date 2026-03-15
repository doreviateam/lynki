package handlers

import (
	"context"
	"strconv"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// TreasurySnapshotJobHandler gère POST /ui/jobs/treasury-snapshot (ADR-0010, E2).
// Déclenché par cron/orchestrateur : snapshot du mois précédent (as_of_date = dernier jour calendaire).
// Query: tenant (requis), company_id (optionnel, "" = consolidé), as_of_date (optionnel, défaut = dernier jour du mois précédent Europe/Paris).
func TreasurySnapshotJobHandler(db *storage.DB, odooURL string, cfg *config.Config, log *zerolog.Logger) fiber.Handler {
	loc, _ := time.LoadLocation("Europe/Paris")
	return func(c *fiber.Ctx) error {
		tenant := c.Query("tenant")
		if tenant == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "tenant is required"})
		}
		companyID := c.Query("company_id")
		asOfDateStr := c.Query("as_of_date")

		var asOfDate time.Time
		if asOfDateStr != "" {
			t, err := time.ParseInLocation("2006-01-02", asOfDateStr, loc)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "as_of_date must be YYYY-MM-DD"})
			}
			asOfDate = t
		} else {
			now := time.Now().In(loc)
			firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
			asOfDate = firstOfMonth.AddDate(0, 0, -1)
		}

		dateDebut := asOfDate.Format("2006-01-02")
		dateFin := dateDebut

		odooURLForTenant := ""
		if cfg != nil {
			if tenant == "laplatine2026" && cfg.OdooBankReconciliationURLLaplatine2026 != "" {
				odooURLForTenant = cfg.OdooBankReconciliationURLLaplatine2026
			} else if tenant == "o19" && cfg.OdooBankReconciliationURLO19 != "" {
				odooURLForTenant = cfg.OdooBankReconciliationURLO19
			} else if tenant == cfg.OdooBankReconciliationTenant {
				odooURLForTenant = odooURL
			}
		}

		data, err := ComputeTreasurySnapshotData(c.Context(), db, odooURLForTenant, cfg, tenant, companyID, dateDebut, dateFin, log)
		if err != nil {
			if log != nil {
				log.Warn().Err(err).Str("tenant", tenant).Str("company_id", companyID).Msg("ComputeTreasurySnapshotData failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		cid := 0
		if companyID != "" && companyID != "0" {
			if parsed, err := parseCompanyID(companyID); err == nil {
				cid = parsed
			}
		}

		row := &storage.TreasuryPositionSnapshot{
			Tenant:           tenant,
			CompanyID:        cid,
			AsOfDate:         asOfDate,
			ValidatedBalance: data.ValidatedBalance,
			ErpBalance:       data.ErpBalance,
			Reconciled:       data.Reconciled,
			Unreconciled:     data.Unreconciled,
			Currency:         data.Currency,
		}
		if err := db.UpsertTreasuryPositionSnapshot(c.Context(), row); err != nil {
			if log != nil {
				log.Warn().Err(err).Str("tenant", tenant).Msg("UpsertTreasuryPositionSnapshot failed")
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		if log != nil {
			log.Info().
				Str("tenant", tenant).
				Int("company_id", cid).
				Str("as_of_date", asOfDate.Format("2006-01-02")).
				Msg("Treasury snapshot upserted")
		}
		return c.JSON(fiber.Map{
			"ok":         true,
			"tenant":     tenant,
			"company_id": cid,
			"as_of_date": asOfDate.Format("2006-01-02"),
		})
	}
}

// getOdooURLForTenant retourne l'URL Odoo pour un tenant (même logique que TreasuryAggregationHandler).
func getOdooURLForTenant(tenant string, odooURL string, cfg *config.Config) string {
	if cfg == nil {
		return odooURL
	}
	if tenant == "laplatine2026" && cfg.OdooBankReconciliationURLLaplatine2026 != "" {
		return cfg.OdooBankReconciliationURLLaplatine2026
	}
	if tenant == "o19" && cfg.OdooBankReconciliationURLO19 != "" {
		return cfg.OdooBankReconciliationURLO19
	}
	if tenant == cfg.OdooBankReconciliationTenant {
		return odooURL
	}
	return ""
}

// RunTreasurySnapshotForAllTenants exécute le snapshot pour tous les (tenant, company_id) de la projection.
// Utilisable par un job batch (cron appelle une fois ou une route qui itère).
func RunTreasurySnapshotForAllTenants(ctx context.Context, db *storage.DB, odooURL string, cfg *config.Config, asOfDate time.Time, log *zerolog.Logger) (int, error) {
	pairs, err := db.ListTenantCompanyIDsFromProjection(ctx)
	if err != nil {
		return 0, err
	}
	dateStr := asOfDate.Format("2006-01-02")
	count := 0
	for _, p := range pairs {
		odooURLForTenant := getOdooURLForTenant(p.Tenant, odooURL, cfg)
		companyIDStr := ""
		if p.CompanyID != 0 {
			companyIDStr = strconv.Itoa(p.CompanyID)
		}
		data, err := ComputeTreasurySnapshotData(ctx, db, odooURLForTenant, cfg, p.Tenant, companyIDStr, dateStr, dateStr, log)
		if err != nil {
			if log != nil {
				log.Warn().Err(err).Str("tenant", p.Tenant).Int("company_id", p.CompanyID).Msg("ComputeTreasurySnapshotData failed")
			}
			continue
		}
		row := &storage.TreasuryPositionSnapshot{
			Tenant:           p.Tenant,
			CompanyID:        p.CompanyID,
			AsOfDate:         asOfDate,
			ValidatedBalance: data.ValidatedBalance,
			ErpBalance:       data.ErpBalance,
			Reconciled:       data.Reconciled,
			Unreconciled:     data.Unreconciled,
			Currency:         data.Currency,
		}
		if err := db.UpsertTreasuryPositionSnapshot(ctx, row); err != nil {
			if log != nil {
				log.Warn().Err(err).Str("tenant", p.Tenant).Msg("Upsert failed")
			}
			continue
		}
		count++
	}
	return count, nil
}
