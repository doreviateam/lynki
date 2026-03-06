package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/config"
	"github.com/doreviateam/dorevia-vault/internal/replay"
	"github.com/doreviateam/dorevia-vault/internal/server"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupReplayTestDB configure DB + tables economic_events + replay_jobs (E4, E5)
func setupReplayTestDB(t *testing.T) *storage.DB {
	db := setupTestDBForEconomicEvents(t)

	ctx := context.Background()
	// Migrations 030, 031
	for _, sql := range []string{
		`CREATE TABLE IF NOT EXISTS replay_jobs (
			job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant VARCHAR(255) NOT NULL,
			mode VARCHAR(20) NOT NULL CHECK (mode IN ('dry_run', 'apply')),
			status VARCHAR(20) NOT NULL DEFAULT 'queued',
			range_from TIMESTAMPTZ,
			range_to TIMESTAMPTZ,
			options JSONB DEFAULT '{}',
			progress_events_processed BIGINT DEFAULT 0,
			progress_last_sequence BIGINT,
			progress_cursor VARCHAR(512),
			stats_json JSONB DEFAULT '{}',
			error_message TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			started_at TIMESTAMPTZ,
			completed_at TIMESTAMPTZ
		)`,
		`CREATE TABLE IF NOT EXISTS replay_job_logs (
			id BIGSERIAL PRIMARY KEY,
			job_id UUID NOT NULL REFERENCES replay_jobs(job_id) ON DELETE CASCADE,
			logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			level VARCHAR(10) NOT NULL DEFAULT 'info',
			message TEXT NOT NULL,
			data JSONB
		)`,
		`ALTER TABLE replay_jobs ADD COLUMN IF NOT EXISTS stats_json JSONB DEFAULT '{}'`,
	} {
		_, err := db.Pool.Exec(ctx, sql)
		require.NoError(t, err)
	}

	_, _ = db.Pool.Exec(ctx, "DELETE FROM replay_job_logs")
	_, _ = db.Pool.Exec(ctx, "DELETE FROM replay_jobs")

	return db
}

// TestReplayRegression_DatasetAndDryRun valide le dataset de régression + dry_run E2E (E5-US0 + E4-US4)
func TestReplayRegression_DatasetAndDryRun(t *testing.T) {
	if os.Getenv("TEST_DATABASE_URL") == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	db := setupReplayTestDB(t)
	defer db.Close()

	// E5-US0 : Charger le dataset (10 invoices, 5 payments, multi-partners, partiel)
	err := replay.SeedRegressionDataset(ctx, db)
	require.NoError(t, err)

	// Config + routes
	cfg := config.Config{
		DatabaseURL:         os.Getenv("TEST_DATABASE_URL"),
		ReplayEventsLimitMax: 100,
	}
	log := logger.New("error")
	app := fiber.New()
	server.RegisterReplayRoutes(app, db, &cfg, log)

	// Créer un job dry_run via API
	body := []byte(`{"tenant":"` + replay.RegressionTenant + `","mode":"dry_run","range":{"from":"2026-01-01","to":"2026-02-01"}}`)
	req := httptest.NewRequest("POST", "/api/v1/replay/jobs", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	require.NoError(t, err)
	require.Equal(t, 201, resp.StatusCode)

	var createResp struct {
		JobID string `json:"job_id"`
	}
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&createResp))
	require.NotEmpty(t, createResp.JobID)

	// Exécuter le job immédiatement (sans attendre le poll)
	runner := replay.NewRunner(db, &cfg, log)
	runner.ProcessOneJob(ctx)

	// E4-US4 : Vérifier logs paginés
	reqLogs := httptest.NewRequest("GET", "/api/v1/replay/jobs/"+createResp.JobID+"/logs?limit=10&offset=0", nil)
	respLogs, err := app.Test(reqLogs)
	require.NoError(t, err)
	assert.Equal(t, 200, respLogs.StatusCode)
	var logsResp struct {
		Data  []interface{} `json:"data"`
		Total int           `json:"total"`
	}
	require.NoError(t, json.NewDecoder(respLogs.Body).Decode(&logsResp))
	assert.GreaterOrEqual(t, logsResp.Total, 1, "au moins 1 log attendu")

	// E4-US4 : Vérifier report exportable
	reqReport := httptest.NewRequest("GET", "/api/v1/replay/jobs/"+createResp.JobID+"/report", nil)
	respReport, err := app.Test(reqReport)
	require.NoError(t, err)
	assert.Equal(t, 200, respReport.StatusCode)

	var report map[string]interface{}
	require.NoError(t, json.NewDecoder(respReport.Body).Decode(&report))
	assert.Equal(t, "completed", report["status"])

	stats, _ := report["stats"].(map[string]interface{})
	require.NotNil(t, stats, "stats attendues dans le report")

	eventsTotal, _ := stats["events_total"].(float64)
	assert.Equal(t, float64(15), eventsTotal, "15 events attendus (10 invoices + 5 payments)")

	invoiceIssued, _ := stats["invoice_issued"].(float64)
	assert.Equal(t, float64(10), invoiceIssued)

	partners, _ := stats["partners"].(float64)
	assert.GreaterOrEqual(t, partners, float64(2), "au moins 2 partners (P001, P002, P003)")
}
