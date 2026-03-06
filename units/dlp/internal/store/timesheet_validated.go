package store

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalidPayload  = errors.New("invalid payload")
	ErrCompanyNotFound = errors.New("company not found")
)

// TimesheetValidatedPayload pour le POST timesheet-validated
type TimesheetValidatedPayload struct {
	TenantID            string    `json:"tenant_id"`
	SourceSystem        string    `json:"source_system"`
	CompanyID           string    `json:"company_id"` // UUID ou external_id
	ProjectExternalID   string    `json:"project_external_id"`
	TimeEntryExternalID string    `json:"time_entry_external_id"`
	HitAt               time.Time `json:"hit_at"`
}

// ProcessTimesheetValidated applique la logique Phase 3
// Retourne (hitsInserted, mappingMissing, error)
func (s *Store) ProcessTimesheetValidated(ctx context.Context, p *TimesheetValidatedPayload) (int, bool, error) {
	tenantID, err := uuid.Parse(p.TenantID)
	if err != nil {
		return 0, false, err
	}
	if p.SourceSystem == "" || p.ProjectExternalID == "" || p.TimeEntryExternalID == "" {
		return 0, false, ErrInvalidPayload
	}

	// Résoudre company (uuid ou external_id)
	var companyID uuid.UUID
	if parsed, err := uuid.Parse(p.CompanyID); err == nil {
		c, err := s.GetCompanyByID(ctx, parsed)
		if err != nil || c.TenantID != tenantID {
			return 0, false, ErrCompanyNotFound
		}
		companyID = c.ID
	} else {
		c, err := s.GetCompanyByExternalID(ctx, tenantID, p.CompanyID)
		if err != nil {
			return 0, false, ErrCompanyNotFound
		}
		companyID = c.ID
	}

	// Résoudre business_perimeter via mapping
	mapping, err := s.GetProjectPerimeterMapByProject(ctx, tenantID, p.SourceSystem, p.ProjectExternalID)
	if err != nil {
		return 0, true, nil // mapping_missing → 202
	}
	perimeterID := mapping.BusinessPerimeterID

	// DLP actives dont scope_companies ∋ company ET scope_perimeters ∋ perimeter
	dlps, err := s.ListDLPs(ctx, tenantID, "active")
	if err != nil {
		return 0, false, err
	}
	var matchingDLPs []uuid.UUID
	for _, d := range dlps {
		hasCompany := false
		for _, cid := range d.ScopeCompanyIDs {
			if cid == companyID {
				hasCompany = true
				break
			}
		}
		if !hasCompany {
			continue
		}
		hasPerimeter := false
		for _, pid := range d.ScopePerimeterIDs {
			if pid == perimeterID {
				hasPerimeter = true
				break
			}
		}
		if hasPerimeter {
			matchingDLPs = append(matchingDLPs, d.ID)
		}
	}

	hitAt := p.HitAt
	if hitAt.IsZero() {
		hitAt = time.Now()
	}

	hitsInserted := 0
	for _, dlpID := range matchingDLPs {
		cmd, err := s.pool.Exec(ctx, `
			INSERT INTO hits (tenant_id, dlp_id, company_id, business_perimeter_id, source_system, time_entry_external_id, hit_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (tenant_id, dlp_id, source_system, time_entry_external_id) DO NOTHING
		`, tenantID, dlpID, companyID, perimeterID, p.SourceSystem, p.TimeEntryExternalID, hitAt)
		if err != nil {
			continue
		}
		if cmd.RowsAffected() == 0 {
			continue // doublon, idempotence
		}
		hitsInserted++
		s.pool.Exec(ctx, `UPDATE dlps SET hit_count = hit_count + 1 WHERE id = $1`, dlpID)
		s.pool.Exec(ctx, `UPDATE business_perimeters SET hit_count = hit_count + 1 WHERE id = $1`, perimeterID)
		s.pool.Exec(ctx, `UPDATE companies SET hit_count = hit_count + 1 WHERE id = $1`, companyID)
	}

	return hitsInserted, false, nil
}
