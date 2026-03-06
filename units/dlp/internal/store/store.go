package store

import (
	"context"
	"errors"

	"github.com/doreviateam/dlp/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store accès BDD DLP
type Store struct {
	pool *pgxpool.Pool
}

// NewStore crée un store
func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// --- Tenants ---

// GetTenantIDBySlug résout un slug (ex: sarl-la-platine) en UUID tenant.
// Si le tenant n'existe pas, le crée puis retourne son id (GetOrCreate).
func (s *Store) GetTenantIDBySlug(ctx context.Context, slug string) (uuid.UUID, bool, error) {
	var id uuid.UUID
	err := s.pool.QueryRow(ctx, `SELECT id FROM tenants WHERE slug = $1`, slug).Scan(&id)
	if err == nil {
		return id, true, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, false, err
	}
	// Tenant inconnu : création automatique
	err = s.pool.QueryRow(ctx, `INSERT INTO tenants (slug) VALUES ($1) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`, slug).Scan(&id)
	if err != nil {
		return uuid.Nil, false, err
	}
	return id, true, nil
}

// ResolveTenantID accepte un UUID ou un slug, retourne l'UUID tenant.
func (s *Store) ResolveTenantID(ctx context.Context, tenant string) (uuid.UUID, error) {
	if parsed, err := uuid.Parse(tenant); err == nil {
		return parsed, nil
	}
	id, found, err := s.GetTenantIDBySlug(ctx, tenant)
	if err != nil {
		return uuid.Nil, err
	}
	if !found {
		return uuid.Nil, errors.New("tenant not found")
	}
	return id, nil
}

// --- Companies ---

func (s *Store) ListCompanies(ctx context.Context, tenantID uuid.UUID) ([]models.Company, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, tenant_id, external_id, name, hit_count, created_at
		FROM companies WHERE tenant_id = $1 ORDER BY name
	`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Company
	for rows.Next() {
		var c models.Company
		if err := rows.Scan(&c.ID, &c.TenantID, &c.ExternalID, &c.Name, &c.HitCount, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) CreateCompany(ctx context.Context, tenantID uuid.UUID, externalID, name string) (*models.Company, error) {
	var c models.Company
	err := s.pool.QueryRow(ctx, `
		INSERT INTO companies (tenant_id, external_id, name)
		VALUES ($1, $2, $3)
		RETURNING id, tenant_id, external_id, name, hit_count, created_at
	`, tenantID, externalID, name).Scan(&c.ID, &c.TenantID, &c.ExternalID, &c.Name, &c.HitCount, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) GetCompanyByID(ctx context.Context, id uuid.UUID) (*models.Company, error) {
	var c models.Company
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, external_id, name, hit_count, created_at
		FROM companies WHERE id = $1
	`, id).Scan(&c.ID, &c.TenantID, &c.ExternalID, &c.Name, &c.HitCount, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) GetCompanyByExternalID(ctx context.Context, tenantID uuid.UUID, externalID string) (*models.Company, error) {
	var c models.Company
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, external_id, name, hit_count, created_at
		FROM companies WHERE tenant_id = $1 AND external_id = $2
	`, tenantID, externalID).Scan(&c.ID, &c.TenantID, &c.ExternalID, &c.Name, &c.HitCount, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// --- Business Perimeters ---

func (s *Store) ListPerimeters(ctx context.Context, tenantID uuid.UUID) ([]models.BusinessPerimeter, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, tenant_id, company_id, name, hit_count, sort_order, created_at
		FROM business_perimeters WHERE tenant_id = $1 ORDER BY sort_order, name
	`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.BusinessPerimeter
	for rows.Next() {
		var p models.BusinessPerimeter
		if err := rows.Scan(&p.ID, &p.TenantID, &p.CompanyID, &p.Name, &p.HitCount, &p.SortOrder, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) CreatePerimeter(ctx context.Context, tenantID, companyID uuid.UUID, name string, sortOrder int) (*models.BusinessPerimeter, error) {
	var p models.BusinessPerimeter
	err := s.pool.QueryRow(ctx, `
		INSERT INTO business_perimeters (tenant_id, company_id, name, sort_order)
		VALUES ($1, $2, $3, $4)
		RETURNING id, tenant_id, company_id, name, hit_count, sort_order, created_at
	`, tenantID, companyID, name, sortOrder).Scan(&p.ID, &p.TenantID, &p.CompanyID, &p.Name, &p.HitCount, &p.SortOrder, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) UpdatePerimeter(ctx context.Context, id uuid.UUID, name *string, sortOrder *int) (*models.BusinessPerimeter, error) {
	if name != nil && sortOrder != nil {
		_, err := s.pool.Exec(ctx, `UPDATE business_perimeters SET name = $1, sort_order = $2 WHERE id = $3`, *name, *sortOrder, id)
		if err != nil {
			return nil, err
		}
	} else if name != nil {
		_, err := s.pool.Exec(ctx, `UPDATE business_perimeters SET name = $1 WHERE id = $2`, *name, id)
		if err != nil {
			return nil, err
		}
	} else if sortOrder != nil {
		_, err := s.pool.Exec(ctx, `UPDATE business_perimeters SET sort_order = $1 WHERE id = $2`, *sortOrder, id)
		if err != nil {
			return nil, err
		}
	}
	return s.GetPerimeterByID(ctx, id)
}

func (s *Store) GetPerimeterByID(ctx context.Context, id uuid.UUID) (*models.BusinessPerimeter, error) {
	var p models.BusinessPerimeter
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, company_id, name, hit_count, sort_order, created_at
		FROM business_perimeters WHERE id = $1
	`, id).Scan(&p.ID, &p.TenantID, &p.CompanyID, &p.Name, &p.HitCount, &p.SortOrder, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}
