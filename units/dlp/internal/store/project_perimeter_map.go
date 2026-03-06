package store

import (
	"context"

	"github.com/doreviateam/dlp/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Store) ListProjectPerimeterMap(ctx context.Context, tenantID uuid.UUID, sourceSystem string) ([]models.ProjectPerimeterMap, error) {
	var rows pgx.Rows
	var err error
	if sourceSystem == "" {
		rows, err = s.pool.Query(ctx, `
			SELECT id, tenant_id, source_system, project_external_id, business_perimeter_id, created_at, updated_at
			FROM project_perimeter_map WHERE tenant_id = $1 ORDER BY source_system, project_external_id
		`, tenantID)
	} else {
		rows, err = s.pool.Query(ctx, `
			SELECT id, tenant_id, source_system, project_external_id, business_perimeter_id, created_at, updated_at
			FROM project_perimeter_map WHERE tenant_id = $1 AND source_system = $2 ORDER BY project_external_id
		`, tenantID, sourceSystem)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.ProjectPerimeterMap
	for rows.Next() {
		var m models.ProjectPerimeterMap
		if err := rows.Scan(&m.ID, &m.TenantID, &m.SourceSystem, &m.ProjectExternalID, &m.BusinessPerimeterID, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) UpsertProjectPerimeterMap(ctx context.Context, tenantID uuid.UUID, sourceSystem, projectExternalID string, businessPerimeterID uuid.UUID) (*models.ProjectPerimeterMap, error) {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO project_perimeter_map (tenant_id, source_system, project_external_id, business_perimeter_id)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (tenant_id, source_system, project_external_id)
		DO UPDATE SET business_perimeter_id = $4, updated_at = now()
	`, tenantID, sourceSystem, projectExternalID, businessPerimeterID)
	if err != nil {
		return nil, err
	}
	var m models.ProjectPerimeterMap
	err = s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, source_system, project_external_id, business_perimeter_id, created_at, updated_at
		FROM project_perimeter_map WHERE tenant_id = $1 AND source_system = $2 AND project_external_id = $3
	`, tenantID, sourceSystem, projectExternalID).Scan(&m.ID, &m.TenantID, &m.SourceSystem, &m.ProjectExternalID, &m.BusinessPerimeterID, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *Store) DeleteProjectPerimeterMap(ctx context.Context, id uuid.UUID) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM project_perimeter_map WHERE id = $1`, id)
	return err
}

func (s *Store) GetProjectPerimeterMapByProject(ctx context.Context, tenantID uuid.UUID, sourceSystem, projectExternalID string) (*models.ProjectPerimeterMap, error) {
	var m models.ProjectPerimeterMap
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, source_system, project_external_id, business_perimeter_id, created_at, updated_at
		FROM project_perimeter_map WHERE tenant_id = $1 AND source_system = $2 AND project_external_id = $3
	`, tenantID, sourceSystem, projectExternalID).Scan(&m.ID, &m.TenantID, &m.SourceSystem, &m.ProjectExternalID, &m.BusinessPerimeterID, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}
