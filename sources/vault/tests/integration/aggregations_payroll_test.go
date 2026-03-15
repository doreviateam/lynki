package integration

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPayrollAggregation_SourceNone vérifie S-BE-2 : période sans paie → payroll_source = "none".
func TestPayrollAggregation_SourceNone(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}
	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	// Nettoyer payroll_od_lines pour le tenant de test
	_, _ = db.Pool.Exec(ctx, "DELETE FROM payroll_od_lines WHERE tenant = $1", "test-payroll-none")

	resp, err := db.PayrollAggregation(ctx, "test-payroll-none", "2026-01-01", "2026-01-31", "month", "")
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "none", resp.PayrollSource)
	assert.True(t, resp.PayrollUnavailable)
	assert.Equal(t, 0.0, resp.TotalCharges)
	assert.Equal(t, 0, resp.PayslipCount)
}

// TestPayrollAggregation_SourceOD vérifie S-BE-1 : OD 641/645 → payroll_source = "od", total et count.
func TestPayrollAggregation_SourceOD(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}
	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	tenant := "test-payroll-od"
	_, _ = db.Pool.Exec(ctx, "DELETE FROM payroll_od_lines WHERE tenant = $1", tenant)

	// Deux écritures (move_id distincts) : 10 750 + 10 750 = 21 500 € (net signé)
	lines := []storage.PayrollODLine{
		{Tenant: tenant, MoveID: 1001, LineID: 1, LineDate: time.Date(2026, 1, 31, 0, 0, 0, 0, time.UTC), AccountCode: "641100", Debit: 10750, Credit: 0, Currency: "EUR", State: "posted", CompanyID: intPtr(1)},
		{Tenant: tenant, MoveID: 1002, LineID: 1, LineDate: time.Date(2026, 2, 28, 0, 0, 0, 0, time.UTC), AccountCode: "645100", Debit: 10750, Credit: 0, Currency: "EUR", State: "posted", CompanyID: intPtr(1)},
	}
	_, err = db.UpsertPayrollODLines(ctx, lines)
	require.NoError(t, err)

	resp, err := db.PayrollAggregation(ctx, tenant, "2026-01-01", "2026-02-28", "month", "")
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "od", resp.PayrollSource)
	assert.False(t, resp.PayrollUnavailable)
	assert.InDelta(t, 21500, resp.TotalCharges, 0.01)
	assert.Equal(t, 2, resp.PayslipCount) // count = move_id distincts
	require.NotNil(t, resp.Breakdown)
	assert.InDelta(t, 10750, resp.Breakdown.Accounts641, 0.01)
	assert.InDelta(t, 10750, resp.Breakdown.Accounts645, 0.01)
}

// TestPayrollAggregation_SourcePayslipPriority vérifie S-BE-3 : en présence de payslip et d’OD,
// la source retenue est payslip et le total = total bulletins (pas de double comptage).
func TestPayrollAggregation_SourcePayslipPriority(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}
	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	tenant := "test-payroll-payslip-priority"
	_, _ = db.Pool.Exec(ctx, "DELETE FROM payroll_od_lines WHERE tenant = $1", tenant)
	_, _ = db.Pool.Exec(ctx, "DELETE FROM documents WHERE tenant = $1 AND odoo_model = 'hr.payslip'", tenant)

	// 1. Insérer un bulletin (payslip) : 5 000 € sur 2026-01-15
	docID := uuid.New().String()
	_, err = db.Pool.Exec(ctx, `
		INSERT INTO documents (id, filename, sha256_hex, stored_path, created_at, tenant, odoo_model, invoice_date, total_ht, currency)
		VALUES ($1, 'payslip-recette-continue', 'sha256-test-sbe3', '/tmp/payslip', NOW(), $2, 'hr.payslip', '2026-01-15', 5000, 'EUR')
	`, docID, tenant)
	require.NoError(t, err)

	// 2. Insérer des OD sur la même période (3 000 €) — ne doivent pas s’ajouter au total
	lines := []storage.PayrollODLine{
		{Tenant: tenant, MoveID: 3001, LineID: 1, LineDate: time.Date(2026, 1, 20, 0, 0, 0, 0, time.UTC), AccountCode: "641100", Debit: 3000, Credit: 0, Currency: "EUR", State: "posted", CompanyID: nil},
	}
	_, err = db.UpsertPayrollODLines(ctx, lines)
	require.NoError(t, err)

	// 3. Agrégation : doit retourner source = payslip, total = 5 000 (pas 8 000)
	resp, err := db.PayrollAggregation(ctx, tenant, "2026-01-01", "2026-01-31", "month", "")
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "payslip", resp.PayrollSource)
	assert.InDelta(t, 5000, resp.TotalCharges, 0.01)
	assert.Equal(t, 1, resp.PayslipCount)
	assert.False(t, resp.PayrollUnavailable)

	// Nettoyage
	_, _ = db.Pool.Exec(ctx, "DELETE FROM documents WHERE id = $1", docID)
	_, _ = db.Pool.Exec(ctx, "DELETE FROM payroll_od_lines WHERE tenant = $1", tenant)
}

// TestPayrollAggregation_Extourne vérifie S-BE-4 : crédit sur 641* réduit le total (net signé).
func TestPayrollAggregation_Extourne(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}
	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)
	defer db.Close()

	tenant := "test-payroll-extourne"
	_, _ = db.Pool.Exec(ctx, "DELETE FROM payroll_od_lines WHERE tenant = $1", tenant)

	// Une OD débit 1000 €, une OD crédit (extourne) 300 € → net = 700 €
	lines := []storage.PayrollODLine{
		{Tenant: tenant, MoveID: 2001, LineID: 1, LineDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC), AccountCode: "641100", Debit: 1000, Credit: 0, Currency: "EUR", State: "posted", CompanyID: nil},
		{Tenant: tenant, MoveID: 2002, LineID: 1, LineDate: time.Date(2026, 1, 20, 0, 0, 0, 0, time.UTC), AccountCode: "641100", Debit: 0, Credit: 300, Currency: "EUR", State: "posted", CompanyID: nil},
	}
	_, err = db.UpsertPayrollODLines(ctx, lines)
	require.NoError(t, err)

	resp, err := db.PayrollAggregation(ctx, tenant, "2026-01-01", "2026-01-31", "month", "")
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "od", resp.PayrollSource)
	assert.InDelta(t, 700, resp.TotalCharges, 0.01)
	assert.Equal(t, 2, resp.PayslipCount)
}

func intPtr(i int) *int { return &i }
