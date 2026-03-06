package db

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

// DB encapsule la connexion PostgreSQL du service DLP
type DB struct {
	Pool *pgxpool.Pool
	log  *zerolog.Logger
}

// NewDB crée une connexion et applique les migrations
func NewDB(ctx context.Context, databaseURL string, log *zerolog.Logger) (*DB, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database config: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("connect to database: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}
	db := &DB{Pool: pool, log: log}
	if err := db.migrate(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	if log != nil {
		log.Debug().Msg("DLP database connected and migrated")
	}
	return db, nil
}

// Close ferme le pool
func (db *DB) Close() {
	if db != nil && db.Pool != nil {
		db.Pool.Close()
	}
}

// Health vérifie l'accessibilité de la base
func (db *DB) Health(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

// migrate crée schema_migrations et applique les fichiers SQL dans migrations/
func (db *DB) migrate(ctx context.Context) error {
	_, err := db.Pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(64) PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`)
	if err != nil {
		return err
	}

	base := os.Getenv("DLP_MIGRATIONS_DIR")
	if base == "" {
		base = "migrations"
	}
	entries, err := os.ReadDir(base)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, f := range files {
		version := strings.TrimSuffix(f, ".sql")
		var applied int
		err := db.Pool.QueryRow(ctx, "SELECT 1 FROM schema_migrations WHERE version = $1", version).Scan(&applied)
		if err == nil {
			continue // déjà appliquée
		}
		path := filepath.Join(base, f)
		sql, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read %s: %w", f, err)
		}
		if _, err := db.Pool.Exec(ctx, string(sql)); err != nil {
			return fmt.Errorf("migrate %s: %w", f, err)
		}
		if _, err := db.Pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", version); err != nil {
			return fmt.Errorf("record migration %s: %w", f, err)
		}
		if db.log != nil {
			db.log.Info().Str("migration", version).Msg("Applied migration")
		}
	}
	return nil
}
