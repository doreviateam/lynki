package store

import (
	"context"
	"time"

	"github.com/doreviateam/dlp/internal/models"
	"github.com/google/uuid"
)

func (s *Store) CreateDLP(ctx context.Context, d *models.CreateDLPRequest) (*models.DLP, error) {
	tenantID, err := uuid.Parse(d.TenantID)
	if err != nil {
		return nil, err
	}
	var dlp models.DLP
	err = s.pool.QueryRow(ctx, `
		INSERT INTO dlps (tenant_id, title, intention, hypothesis, created_by, status)
		VALUES ($1, $2, $3, $4, $5, 'active')
		RETURNING id, tenant_id, title, intention, hypothesis, created_at, created_by, status, hit_count, archived_at, snapshot_id
	`, tenantID, d.Title, d.Intention, d.Hypothesis, d.CreatedBy).Scan(
		&dlp.ID, &dlp.TenantID, &dlp.Title, &dlp.Intention, &dlp.Hypothesis, &dlp.CreatedAt, &dlp.CreatedBy, &dlp.Status, &dlp.HitCount, &dlp.ArchivedAt, &dlp.SnapshotID)
	if err != nil {
		return nil, err
	}
	// scope_companies et scope_perimeters
	for _, cid := range d.ScopeCompanyIDs {
		companyUUID, err := uuid.Parse(cid)
		if err != nil {
			continue
		}
		s.pool.Exec(ctx, `INSERT INTO dlp_scope_companies (dlp_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, dlp.ID, companyUUID)
	}
	for _, pid := range d.ScopePerimeterIDs {
		permUUID, err := uuid.Parse(pid)
		if err != nil {
			continue
		}
		s.pool.Exec(ctx, `INSERT INTO dlp_scope_perimeters (dlp_id, business_perimeter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, dlp.ID, permUUID)
	}
	scopes, _ := s.getDLPScopes(ctx, dlp.ID)
	dlp.ScopeCompanyIDs = scopes.Companies
	dlp.ScopePerimeterIDs = scopes.Perimeters
	return &dlp, nil
}

func (s *Store) GetDLPByID(ctx context.Context, id uuid.UUID) (*models.DLP, error) {
	var d models.DLP
	var archivedAt *time.Time
	var snapshotID *uuid.UUID
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, title, intention, hypothesis, created_at, created_by, status, hit_count, archived_at, snapshot_id
		FROM dlps WHERE id = $1
	`, id).Scan(&d.ID, &d.TenantID, &d.Title, &d.Intention, &d.Hypothesis, &d.CreatedAt, &d.CreatedBy, &d.Status, &d.HitCount, &archivedAt, &snapshotID)
	if err != nil {
		return nil, err
	}
	d.ArchivedAt = archivedAt
	d.SnapshotID = snapshotID
	scopes, _ := s.getDLPScopes(ctx, d.ID)
	d.ScopeCompanyIDs = scopes.Companies
	d.ScopePerimeterIDs = scopes.Perimeters
	return &d, nil
}

func (s *Store) UpdateDLP(ctx context.Context, id uuid.UUID, u *models.UpdateDLPRequest) (*models.DLP, error) {
	dlp, err := s.GetDLPByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if u.Title != nil {
		dlp.Title = *u.Title
	}
	if u.Intention != nil {
		dlp.Intention = *u.Intention
	}
	if u.Hypothesis != nil {
		dlp.Hypothesis = *u.Hypothesis
	}
	if u.Status != nil {
		dlp.Status = *u.Status
		if *u.Status == "archived" {
			now := time.Now()
			dlp.ArchivedAt = &now
			s.pool.Exec(ctx, `UPDATE dlps SET title=$1, intention=$2, hypothesis=$3, status=$4, archived_at=$5 WHERE id=$6`,
				dlp.Title, dlp.Intention, dlp.Hypothesis, dlp.Status, now, id)
		} else {
			dlp.ArchivedAt = nil
			s.pool.Exec(ctx, `UPDATE dlps SET title=$1, intention=$2, hypothesis=$3, status=$4, archived_at=NULL WHERE id=$5`,
				dlp.Title, dlp.Intention, dlp.Hypothesis, dlp.Status, id)
		}
	} else {
		s.pool.Exec(ctx, `UPDATE dlps SET title=$1, intention=$2, hypothesis=$3 WHERE id=$4`,
			dlp.Title, dlp.Intention, dlp.Hypothesis, id)
	}
	if len(u.ScopeCompanyIDs) > 0 {
		s.pool.Exec(ctx, `DELETE FROM dlp_scope_companies WHERE dlp_id = $1`, id)
		for _, cid := range u.ScopeCompanyIDs {
			cu, _ := uuid.Parse(cid)
			s.pool.Exec(ctx, `INSERT INTO dlp_scope_companies (dlp_id, company_id) VALUES ($1, $2)`, id, cu)
		}
	}
	if len(u.ScopePerimeterIDs) > 0 {
		s.pool.Exec(ctx, `DELETE FROM dlp_scope_perimeters WHERE dlp_id = $1`, id)
		for _, pid := range u.ScopePerimeterIDs {
			pu, _ := uuid.Parse(pid)
			s.pool.Exec(ctx, `INSERT INTO dlp_scope_perimeters (dlp_id, business_perimeter_id) VALUES ($1, $2)`, id, pu)
		}
	}
	return s.GetDLPByID(ctx, id)
}
