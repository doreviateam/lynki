package store

import (
	"context"
	"crypto/sha256"
	"encoding/binary"
	"encoding/json"
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/doreviateam/diva/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	StatusProcessing = "processing"
	StatusDone       = "done"
	StatusFailed     = "failed"
)

var (
	ErrNotFound = errors.New("analysis not found")
)

type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(ctx context.Context, connString string) (*PostgresStore, error) {
	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return nil, err
	}
	return &PostgresStore{pool: pool}, nil
}

func (s *PostgresStore) Close() {
	s.pool.Close()
}

func (s *PostgresStore) Get(ctx context.Context, contextHash string) (*Analysis, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT context_hash, status, flash_json, started_at, updated_at, expires_at,
		       COALESCE(error_code, ''), COALESCE(error_message, '')
		FROM diva_analysis
		WHERE context_hash = $1
	`, contextHash)

	var a Analysis
	var flashJSON []byte
	err := row.Scan(&a.ContextHash, &a.Status, &flashJSON, &a.StartedAt, &a.UpdatedAt, &a.ExpiresAt, &a.ErrorCode, &a.ErrorMessage)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	a.FlashJSON = flashJSON
	return &a, nil
}

// UpsertProcessing claims the row for processing. Returns true if we claimed it (launch worker), false if another request is already processing.
func (s *PostgresStore) UpsertProcessing(ctx context.Context, contextHash string, ttl time.Duration) (inserted bool, err error) {
	expiresAt := time.Now().Add(ttl)
	cmd, err := s.pool.Exec(ctx, `
		INSERT INTO diva_analysis (context_hash, status, started_at, updated_at, expires_at)
		VALUES ($1, 'processing', now(), now(), $2)
		ON CONFLICT (context_hash) DO UPDATE SET
			status = 'processing',
			started_at = now(),
			updated_at = now(),
			expires_at = $2,
			flash_json = NULL,
			error_code = NULL,
			error_message = NULL
		WHERE diva_analysis.expires_at < now() OR diva_analysis.status IN ('failed', 'done')
	`, contextHash, expiresAt)
	if err != nil {
		return false, err
	}
	return cmd.RowsAffected() > 0, nil
}

func (s *PostgresStore) MarkDone(ctx context.Context, contextHash string, flash models.Flash, meta models.Meta, ttl time.Duration) error {
	flashMeta := struct {
		Flash models.Flash `json:"flash"`
		Meta  models.Meta  `json:"meta"`
	}{Flash: flash, Meta: meta}
	data, err := json.Marshal(flashMeta)
	if err != nil {
		return err
	}
	expiresAt := time.Now().Add(ttl)
	_, err = s.pool.Exec(ctx, `
		UPDATE diva_analysis
		SET status = 'done', flash_json = $2, updated_at = now(), expires_at = $3,
		    error_code = NULL, error_message = NULL
		WHERE context_hash = $1 AND status = 'processing'
	`, contextHash, data, expiresAt)
	return err
}

func (s *PostgresStore) MarkFailed(ctx context.Context, contextHash string, code, message string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE diva_analysis
		SET status = 'failed', error_code = $2, error_message = $3, updated_at = now()
		WHERE context_hash = $1 AND status = 'processing'
	`, contextHash, code, message)
	return err
}

func (s *PostgresStore) MarkStaleFailed(ctx context.Context, contextHash string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE diva_analysis
		SET status = 'failed', error_code = 'timeout', error_message = 'Job dépassé (stale)', updated_at = now()
		WHERE context_hash = $1 AND status = 'processing'
	`, contextHash)
	return err
}

// GetInsight retourne l'insight le plus récent pour le context_key.
// Priorité : ok non expiré > error (quel que soit expires_at).
// Mapping DB→API : ok→ready, error→failed, pas de ligne→pending.
func (s *PostgresStore) GetInsight(ctx context.Context, contextKey string) (*Insight, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT status, message_text, flash_json, COALESCE(confidence, ''),
		       created_at, expires_at, COALESCE(error_code, '')
		FROM diva_insights
		WHERE context_key = $1
		  AND (
		    (status = 'ok' AND expires_at > now())
		    OR status = 'error'
		  )
		ORDER BY
		  CASE WHEN status = 'ok' THEN 0 ELSE 1 END,
		  created_at DESC
		LIMIT 1
	`, contextKey)
	var i Insight
	var flashJSON []byte
	err := row.Scan(&i.Status, &i.MessageText, &flashJSON, &i.Confidence,
		&i.CreatedAt, &i.ExpiresAt, &i.ErrorCode)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	i.Flash = flashJSON
	return &i, nil
}

// WithGenerateLock acquiert le lock session sur contextKey, exécute fn, libère le lock.
func (s *PostgresStore) WithGenerateLock(ctx context.Context, contextKey string, fn func(GenerateTx) error) error {
	lockKey := contextKeyToLockKey(contextKey)
	timeoutSec := 120
	if v := os.Getenv("INSIGHTS_LOCK_TIMEOUT"); v != "" {
		if n, e := strconv.Atoi(v); e == nil && n > 0 {
			timeoutSec = n
		}
	} else if v := os.Getenv("INSIGHTS_LOCK_TIMEOUT_SECONDS"); v != "" {
		if n, e := strconv.Atoi(v); e == nil && n > 0 {
			timeoutSec = n
		}
	}
	conn, err := s.pool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()
	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, "SET LOCAL lock_timeout = '"+strconv.Itoa(timeoutSec)+"s'")
	if err != nil {
		_ = tx.Rollback(ctx)
		return err
	}
	_, err = tx.Exec(ctx, "SELECT pg_advisory_lock($1)", lockKey)
	if err != nil {
		_ = tx.Rollback(ctx)
		if isLockTimeout(err) {
			return ErrLockTimeout
		}
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	defer func() { _, _ = conn.Exec(ctx, "SELECT pg_advisory_unlock($1)", lockKey) }()
	return fn(&generateTx{conn: conn})
}

func contextKeyToLockKey(k string) int64 {
	h := sha256.Sum256([]byte(k))
	return int64(binary.BigEndian.Uint64(h[:8]))
}

func isLockTimeout(err error) bool {
	var e *pgconn.PgError
	return errors.As(err, &e) && e.Code == "55P03"
}

type generateTx struct {
	conn *pgxpool.Conn
}

func (g *generateTx) CheckInsightFresh(contextKey, payloadHash string) (bool, error) {
	var one int
	err := g.conn.QueryRow(context.Background(), `
		SELECT 1 FROM diva_insights
		WHERE context_key = $1 AND status = 'ok' AND expires_at > now() AND payload_hash = $2
		LIMIT 1
	`, contextKey, payloadHash).Scan(&one)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (g *generateTx) InsertInsight(ctx context.Context, p InsertInsightParams) error {
	ttlMin := 3
	if v := os.Getenv("INSIGHTS_TTL_MINUTES"); v != "" {
		if n, e := strconv.Atoi(v); e == nil && n > 0 {
			ttlMin = n
		}
	}
	exp := time.Now().Add(time.Duration(ttlMin) * time.Minute)

	status := p.Status
	if status == "" {
		status = "ok"
	}

	var ck interface{}
	if p.CardKey != "" {
		ck = p.CardKey
	}

	if status == "error" {
		var errorCode interface{}
		if p.ErrorCode != "" {
			errorCode = p.ErrorCode
		}
		_, _ = g.conn.Exec(ctx,
			`DELETE FROM diva_insights WHERE context_key = $1 AND status = 'error'`,
			p.ContextKey)
		_, err := g.conn.Exec(ctx, `
			INSERT INTO diva_insights (
				tenant, company_id, mode, card_key, date_start, date_end,
				context_key, payload_hash, message_text, flash_json,
				status, error_code, confidence, model, latency_ms, expires_at, generated_from_runner
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'error', $11, NULL, $12, $13, $14, $15)
		`, p.Tenant, p.CompanyID, p.Mode, ck, p.DateStart, p.DateEnd,
			p.ContextKey, p.PayloadHash, p.MessageText, p.FlashJSON,
			errorCode, p.Model, p.LatencyMs, exp, p.GeneratedFromRunner)
		return err
	}

	_, err := g.conn.Exec(ctx, `
		INSERT INTO diva_insights (
			tenant, company_id, mode, card_key, date_start, date_end,
			context_key, payload_hash, message_text, flash_json,
			status, confidence, model, latency_ms, expires_at, generated_from_runner
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ok', $11, $12, $13, $14, $15)
	`, p.Tenant, p.CompanyID, p.Mode, ck, p.DateStart, p.DateEnd,
		p.ContextKey, p.PayloadHash, p.MessageText, p.FlashJSON,
		p.Confidence, p.Model, p.LatencyMs, exp, p.GeneratedFromRunner)
	if err != nil {
		var e *pgconn.PgError
		if errors.As(err, &e) && e.Code == "23505" {
			_, uerr := g.conn.Exec(ctx, `
				UPDATE diva_insights
				SET message_text = $3,
				    flash_json = $4,
				    confidence = $5,
				    model = $6,
				    latency_ms = $7,
				    expires_at = $8,
				    created_at = now(),
				    generated_from_runner = $9
				WHERE context_key = $1
				  AND payload_hash = $2
				  AND status = 'ok'
			`, p.ContextKey, p.PayloadHash, p.MessageText, p.FlashJSON, p.Confidence, p.Model, p.LatencyMs, exp, p.GeneratedFromRunner)
			return uerr
		}
		return err
	}
	return nil
}
