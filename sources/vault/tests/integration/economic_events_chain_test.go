package integration

import (
	"context"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestDBForEconomicEvents configure la DB et exécute les migrations 028/029 si besoin
func setupTestDBForEconomicEvents(t *testing.T) *storage.DB {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	ctx := context.Background()
	log := logger.New("error")
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)

	// Exécuter migrations 028 et 029 si tables inexistantes (idempotent)
	for _, sql := range []string{
		`CREATE TABLE IF NOT EXISTS tenant_sequences (tenant VARCHAR(255) PRIMARY KEY, last_sequence BIGINT NOT NULL DEFAULT 0)`,
		`CREATE TABLE IF NOT EXISTS economic_events (
			event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant VARCHAR(255) NOT NULL,
			event_type VARCHAR(100) NOT NULL,
			sequence BIGINT NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL,
			payload_json JSONB NOT NULL,
			hash VARCHAR(64) NOT NULL,
			prev_hash VARCHAR(64),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			source_payload_json JSONB,
			schema_version VARCHAR(50) NOT NULL DEFAULT 'dorevia.economic_event.v1',
			ingest_source VARCHAR(50) NOT NULL DEFAULT 'dvig',
			ingest_idempotency_key VARCHAR(64),
			event_key VARCHAR(255),
			company_id INTEGER,
			CONSTRAINT unique_sequence_per_tenant UNIQUE (tenant, sequence)
		)`,
		`CREATE TABLE IF NOT EXISTS tenant_locks (tenant VARCHAR(255) PRIMARY KEY, locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), locked_by VARCHAR(100), reason VARCHAR(255) DEFAULT 'backfill')`,
	} {
		_, err = db.Pool.Exec(ctx, sql)
		require.NoError(t, err)
	}

	// Nettoyer pour test isolé
	_, _ = db.Pool.Exec(ctx, "DELETE FROM economic_events")
	_, _ = db.Pool.Exec(ctx, "DELETE FROM tenant_sequences")
	_, _ = db.Pool.Exec(ctx, "DELETE FROM tenant_locks")

	return db
}

// TestEconomicEvents_ChainContinuity vérifie : pas de trou de séquence, prev_hash cohérent (E1-US2bis)
func TestEconomicEvents_ChainContinuity(t *testing.T) {
	db := setupTestDBForEconomicEvents(t)
	defer db.Close()
	ctx := context.Background()

	tenant := "chain-test-tenant"
	events := make([]*models.EconomicEvent, 3)
	var lastHash *string

	for i := 0; i < 3; i++ {
		payload := []byte(fmt.Sprintf(`{"event_type":"invoice_issued","invoice_id":"F-TEST-%d","amount_total":100}`, i))
		canonical, hashHex, err := utils.CanonicalJSONAndHash(payload)
		require.NoError(t, err)

		evt := &models.EconomicEvent{
			Tenant:        tenant,
			EventType:     "invoice_issued",
			Timestamp:     time.Now().UTC(),
			PayloadJSON:   canonical,
			Hash:          hashHex,
			SchemaVersion: "dorevia.economic_event.v1",
			IngestSource:  "test",
		}
		if lastHash != nil {
			evt.PrevHash = lastHash
		}

		inserted, err := db.InsertEconomicEvent(ctx, evt)
		require.NoError(t, err)
		events[i] = inserted

		// Vérifier sequence sans trou (1, 2, 3)
		assert.Equal(t, int64(i+1), inserted.Sequence, "sequence doit être 1, 2, 3 sans trou")
		assert.NotEmpty(t, inserted.Hash)

		// prev_hash du suivant doit pointer vers hash du précédent
		if i > 0 {
			assert.NotNil(t, inserted.PrevHash)
			assert.Equal(t, events[i-1].Hash, *inserted.PrevHash, "prev_hash doit pointer vers hash du précédent")
		} else {
			assert.Nil(t, inserted.PrevHash)
		}
		lastHash = &inserted.Hash
	}

	// Vérifier chaîne complète via feed
	list, err := db.ListEconomicEvents(ctx, storage.ListEconomicEventsQuery{Tenant: tenant, Limit: 10})
	require.NoError(t, err)
	assert.Len(t, list, 3)
	for i := range list {
		assert.Equal(t, int64(i+1), list[i].Sequence)
		if i > 0 {
			require.NotNil(t, list[i].PrevHash)
			assert.Equal(t, list[i-1].Hash, *list[i].PrevHash)
		}
	}
}

// TestEconomicEvents_ConcurrentInsert vérifie le comportement sous insertion concurrente (1 writer/tenant)
func TestEconomicEvents_ConcurrentInsert(t *testing.T) {
	db := setupTestDBForEconomicEvents(t)
	defer db.Close()
	ctx := context.Background()
	tenant := "concurrent-tenant"

	// 5 insertions concurrentes pour le même tenant
	var wg sync.WaitGroup
	results := make([]*models.EconomicEvent, 5)
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			payload := []byte(fmt.Sprintf(`{"event_type":"payment_received","payment_id":"P-%d","amount":50}`, idx))
			canonical, hashHex, err := utils.CanonicalJSONAndHash(payload)
			if err != nil {
				return
			}
			evt := &models.EconomicEvent{
				Tenant:        tenant,
				EventType:     "payment_received",
				Timestamp:     time.Now().UTC(),
				PayloadJSON:   canonical,
				Hash:          hashHex,
				IngestSource:  "test",
			}
			inserted, err := db.InsertEconomicEvent(ctx, evt)
			if err == nil {
				results[idx] = inserted
			}
		}(i)
	}
	wg.Wait()

	// Compter les insertions réussies et vérifier pas de doublon de sequence
	sequences := make(map[int64]bool)
	successCount := 0
	for _, r := range results {
		if r != nil {
			successCount++
			assert.False(t, sequences[r.Sequence], "pas de doublon de sequence")
			sequences[r.Sequence] = true
		}
	}
	assert.Equal(t, 5, successCount, "toutes les insertions concurrentes doivent réussir")

	// Vérifier pas de trou (1..5)
	list, err := db.ListEconomicEvents(ctx, storage.ListEconomicEventsQuery{Tenant: tenant, Limit: 10})
	require.NoError(t, err)
	assert.Len(t, list, 5)
	for i := range list {
		assert.Equal(t, int64(i+1), list[i].Sequence)
	}
}
