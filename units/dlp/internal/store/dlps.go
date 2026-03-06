package store

import (
	"context"
	"time"

	"github.com/doreviateam/dlp/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type dlpScopes struct {
	Companies  []uuid.UUID
	Perimeters []uuid.UUID
}

func (s *Store) getDLPScopes(ctx context.Context, dlpID uuid.UUID) (dlpScopes, error) {
	var sc dlpScopes
	rows, err := s.pool.Query(ctx, `SELECT company_id FROM dlp_scope_companies WHERE dlp_id = $1`, dlpID)
	if err != nil {
		return sc, err
	}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return sc, err
		}
		sc.Companies = append(sc.Companies, id)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return sc, err
	}
	rows2, err := s.pool.Query(ctx, `SELECT business_perimeter_id FROM dlp_scope_perimeters WHERE dlp_id = $1`, dlpID)
	if err != nil {
		return sc, err
	}
	for rows2.Next() {
		var id uuid.UUID
		if err := rows2.Scan(&id); err != nil {
			rows2.Close()
			return sc, err
		}
		sc.Perimeters = append(sc.Perimeters, id)
	}
	rows2.Close()
	return sc, rows2.Err()
}

func (s *Store) ListDLPs(ctx context.Context, tenantID uuid.UUID, status string) ([]models.DLP, error) {
	var rows pgx.Rows
	var err error
	if status == "" || status == "all" {
		rows, err = s.pool.Query(ctx, `
			SELECT id, tenant_id, title, intention, hypothesis, created_at, created_by, status, hit_count, archived_at, snapshot_id
			FROM dlps WHERE tenant_id = $1 ORDER BY created_at DESC
		`, tenantID)
	} else {
		rows, err = s.pool.Query(ctx, `
			SELECT id, tenant_id, title, intention, hypothesis, created_at, created_by, status, hit_count, archived_at, snapshot_id
			FROM dlps WHERE tenant_id = $1 AND status = $2 ORDER BY created_at DESC
		`, tenantID, status)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.DLP
	for rows.Next() {
		var d models.DLP
		var archivedAt *time.Time
		var snapshotID *uuid.UUID
		if err := rows.Scan(&d.ID, &d.TenantID, &d.Title, &d.Intention, &d.Hypothesis, &d.CreatedAt, &d.CreatedBy, &d.Status, &d.HitCount, &archivedAt, &snapshotID); err != nil {
			return nil, err
		}
		d.ArchivedAt = archivedAt
		d.SnapshotID = snapshotID
		scopes, _ := s.getDLPScopes(ctx, d.ID)
		d.ScopeCompanyIDs = scopes.Companies
		d.ScopePerimeterIDs = scopes.Perimeters
		out = append(out, d)
	}
	return out, rows.Err()
}
