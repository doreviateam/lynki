package store

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// EnergySummaryRow pour by_perimeter / by_company
type EnergySummaryRow struct {
	PerimeterID   string  `json:"perimeter_id,omitempty"`
	PerimeterName string  `json:"perimeter_name,omitempty"`
	CompanyID     string  `json:"company_id"`
	CompanyName   string  `json:"company_name,omitempty"`
	Hits          int     `json:"hits"`
	Pct           float64 `json:"pct"`
}

// EnergySummaryResponse réponse GET energy-summary
type EnergySummaryResponse struct {
	DLPActiveCount int                 `json:"dlp_active_count"`
	HitsTotal      int                 `json:"hits_total"`
	PeriodDays     int                 `json:"period_days"`
	ByPerimeter    []EnergySummaryRow  `json:"by_perimeter"`
	ByCompany      []EnergySummaryRow  `json:"by_company"`
}

func (s *Store) GetEnergySummary(ctx context.Context, tenantID uuid.UUID, periodDays int, companyIDFilter *uuid.UUID) (*EnergySummaryResponse, error) {
	if periodDays <= 0 {
		periodDays = 90
	}
	cutoff := time.Now().AddDate(0, 0, -periodDays)

	resp := &EnergySummaryResponse{
		PeriodDays:  periodDays,
		ByPerimeter: []EnergySummaryRow{},
		ByCompany:   []EnergySummaryRow{},
	}

	// DLP actives
	var dlpCount int
	err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM dlps WHERE tenant_id = $1 AND status = 'active'`, tenantID).Scan(&dlpCount)
	if err != nil {
		return nil, err
	}
	resp.DLPActiveCount = dlpCount

	// Hits totaux dans la période
	var total int
	if companyIDFilter != nil {
		err = s.pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM hits WHERE tenant_id = $1 AND hit_at >= $2 AND company_id = $3
		`, tenantID, cutoff, *companyIDFilter).Scan(&total)
	} else {
		err = s.pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM hits WHERE tenant_id = $1 AND hit_at >= $2
		`, tenantID, cutoff).Scan(&total)
	}
	if err != nil {
		return nil, err
	}
	resp.HitsTotal = total

	if total == 0 {
		return resp, nil
	}

	// By perimeter (sort_order, puis hits décroissant)
	q := `
		SELECT bp.id, bp.name, bp.company_id, c.name,
			COUNT(h.id)::int as hits,
			ROUND(100.0 * COUNT(h.id) / NULLIF($2, 0), 0)::float as pct
		FROM business_perimeters bp
		JOIN companies c ON c.id = bp.company_id
		LEFT JOIN hits h ON h.business_perimeter_id = bp.id AND h.tenant_id = $1 AND h.hit_at >= $3
	`
	args := []interface{}{tenantID, total, cutoff}
	if companyIDFilter != nil {
		q = `
		SELECT bp.id, bp.name, bp.company_id, c.name,
			COUNT(h.id)::int as hits,
			ROUND(100.0 * COUNT(h.id) / NULLIF($2, 0), 0)::float as pct
		FROM business_perimeters bp
		JOIN companies c ON c.id = bp.company_id
		LEFT JOIN hits h ON h.business_perimeter_id = bp.id AND h.tenant_id = $1 AND h.hit_at >= $3 AND h.company_id = $4
		`
		args = append(args, *companyIDFilter)
	}
	q += `
		GROUP BY bp.id, bp.name, bp.company_id, c.name, bp.sort_order
		HAVING COUNT(h.id) > 0
		ORDER BY bp.sort_order, hits DESC
	`
	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var r EnergySummaryRow
		var permID, companyID uuid.UUID
		if err := rows.Scan(&permID, &r.PerimeterName, &companyID, &r.CompanyName, &r.Hits, &r.Pct); err != nil {
			return nil, err
		}
		r.PerimeterID = permID.String()
		r.CompanyID = companyID.String()
		resp.ByPerimeter = append(resp.ByPerimeter, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// By company
	q2 := `
		SELECT c.id, c.name, COUNT(h.id)::int as hits,
			ROUND(100.0 * COUNT(h.id) / NULLIF($2, 0), 0)::float as pct
		FROM companies c
		LEFT JOIN hits h ON h.company_id = c.id AND h.tenant_id = $1 AND h.hit_at >= $3
	`
	args2 := []interface{}{tenantID, total, cutoff}
	if companyIDFilter != nil {
		q2 = `
		SELECT c.id, c.name, COUNT(h.id)::int as hits,
			ROUND(100.0 * COUNT(h.id) / NULLIF($2, 0), 0)::float as pct
		FROM companies c
		LEFT JOIN hits h ON h.company_id = c.id AND h.tenant_id = $1 AND h.hit_at >= $3 AND h.company_id = $4
		`
		q2 += ` WHERE c.tenant_id = $1 AND c.id = $4 `
		args2 = append(args2, *companyIDFilter)
	} else {
		q2 += ` WHERE c.tenant_id = $1 `
	}
	q2 += `
		GROUP BY c.id, c.name
		HAVING COUNT(h.id) > 0
		ORDER BY hits DESC
	`
	rows2, err := s.pool.Query(ctx, q2, args2...)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()
	for rows2.Next() {
		var r EnergySummaryRow
		var companyID uuid.UUID
		if err := rows2.Scan(&companyID, &r.CompanyName, &r.Hits, &r.Pct); err != nil {
			return nil, err
		}
		r.CompanyID = companyID.String()
		resp.ByCompany = append(resp.ByCompany, r)
	}
	return resp, rows2.Err()
}
