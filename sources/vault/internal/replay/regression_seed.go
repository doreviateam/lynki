package replay

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/google/uuid"
)

// RegressionTenant tenant du dataset de régression (E5-US0)
const RegressionTenant = "regression-tenant"

// SeedRegressionDataset insère le dataset de régression : 10 invoices, 5 payments
// Multi-partners, paiement partiel, ordre chronologique mélangé.
func SeedRegressionDataset(ctx context.Context, db *storage.DB) error {
	if db == nil || db.Pool == nil {
		return fmt.Errorf("database not configured")
	}

	_, _ = db.Pool.Exec(ctx, `DELETE FROM economic_events WHERE tenant = $1`, RegressionTenant)
	_, _ = db.Pool.Exec(ctx, `DELETE FROM tenant_sequences WHERE tenant = $1`, RegressionTenant)
	_, _ = db.Pool.Exec(ctx, `DELETE FROM tenant_locks WHERE tenant = $1`, RegressionTenant)

	partners := []struct{ ref, name string }{
		{"P001", "Client Alpha SARL"},
		{"P002", "Client Beta SA"},
		{"P003", "Fournisseur Gamma"},
	}

	invoices := []struct {
		id     string
		date   string
		partner int
		ttc    float64
		ht     float64
	}{
		{"F-2026-001", "2026-01-05", 0, 1196.00, 996.67},
		{"F-2026-002", "2026-01-08", 1, 2400.00, 2000.00},
		{"F-2026-003", "2026-01-10", 0, 598.00, 498.33},
		{"F-2026-004", "2026-01-12", 2, 359.40, 299.50},
		{"F-2026-005", "2026-01-15", 1, 120.00, 100.00},
		{"F-2026-006", "2026-01-18", 0, 2392.00, 1993.33},
		{"F-2026-007", "2026-01-20", 2, 118.80, 99.00},
		{"F-2026-008", "2026-01-22", 0, 600.00, 500.00},
		{"F-2026-009", "2026-01-25", 1, 2380.00, 1983.33},
		{"F-2026-010", "2026-01-28", 0, 119.60, 99.67},
	}

	payments := []struct {
		id     string
		date   string
		partner int
		amount float64
		dir    string
	}{
		{"PAY-001", "2026-01-09", 0, 500.00, "inbound"},
		{"PAY-002", "2026-01-11", 1, 2400.00, "inbound"},
		{"PAY-003", "2026-01-16", 0, 696.00, "inbound"},
		{"PAY-004", "2026-01-23", 2, 359.40, "outbound"},
		{"PAY-005", "2026-01-26", 0, 1000.00, "inbound"},
	}

	type eventRow struct {
		ts  time.Time
		evt *models.EconomicEvent
	}
	var rows []eventRow

	for _, inv := range invoices {
		t, _ := time.Parse("2006-01-02", inv.date)
		p := partners[inv.partner]
		moveType := "out_invoice"
		if inv.partner == 2 {
			moveType = "in_invoice"
		}
		canonical := map[string]interface{}{
			"event_type": "invoice_issued", "invoice_id": inv.id,
			"partner_ref": p.ref, "partner_name": p.name,
			"amount_total": inv.ttc, "amount_untaxed": inv.ht,
			"amount_tax": inv.ttc - inv.ht, "currency": "EUR",
			"date": inv.date, "invoice_date": inv.date, "move_type": moveType,
		}
		payloadJSON, _ := CanonicalToJSON(canonical)
		_, hashHex, _ := utils.CanonicalJSONAndHash(payloadJSON)
		rows = append(rows, eventRow{ts: t, evt: &models.EconomicEvent{
			EventID: uuid.New(), Tenant: RegressionTenant, EventType: "invoice_issued",
			Timestamp: t, PayloadJSON: payloadJSON, Hash: hashHex,
			SchemaVersion: SchemaVersionV1, IngestSource: "regression_seed",
		}})
	}

	for _, pay := range payments {
		t, _ := time.Parse("2006-01-02", pay.date)
		p := partners[pay.partner]
		eventType := "payment_received"
		if pay.dir == "outbound" {
			eventType = "payment_sent"
		}
		canonical := map[string]interface{}{
			"event_type": eventType, "payment_id": pay.id,
			"partner_ref": p.ref, "partner_name": p.name,
			"amount": pay.amount, "currency": "EUR", "date": pay.date,
			"payment_type": pay.dir, "method": "transfer", "is_refund": false, "company_id": 1,
		}
		payloadJSON, _ := CanonicalToJSON(canonical)
		_, hashHex, _ := utils.CanonicalJSONAndHash(payloadJSON)
		rows = append(rows, eventRow{ts: t, evt: &models.EconomicEvent{
			EventID: uuid.New(), Tenant: RegressionTenant, EventType: eventType,
			Timestamp: t, PayloadJSON: payloadJSON, Hash: hashHex,
			SchemaVersion: SchemaVersionV1, IngestSource: "regression_seed",
		}})
	}

	sort.Slice(rows, func(i, j int) bool { return rows[i].ts.Before(rows[j].ts) })

	for _, r := range rows {
		if _, err := db.InsertEconomicEvent(ctx, r.evt); err != nil {
			return fmt.Errorf("insert event: %w", err)
		}
	}
	return nil
}
