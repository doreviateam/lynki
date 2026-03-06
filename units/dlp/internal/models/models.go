package models

import (
	"time"

	"github.com/google/uuid"
)

// Company représente une société
type Company struct {
	ID         uuid.UUID  `json:"id"`
	TenantID   uuid.UUID  `json:"tenant_id"`
	ExternalID string     `json:"external_id"`
	Name       string     `json:"name"`
	HitCount   int        `json:"hit_count"`
	CreatedAt  time.Time  `json:"created_at"`
}

// BusinessPerimeter représente un périmètre métier
type BusinessPerimeter struct {
	ID         uuid.UUID `json:"id"`
	TenantID   uuid.UUID `json:"tenant_id"`
	CompanyID  uuid.UUID `json:"company_id"`
	Name       string    `json:"name"`
	HitCount   int       `json:"hit_count"`
	SortOrder  int       `json:"sort_order"`
	CreatedAt  time.Time `json:"created_at"`
}

// DLP représente une décision stratégique
type DLP struct {
	ID                 uuid.UUID   `json:"id"`
	TenantID           uuid.UUID   `json:"tenant_id"`
	Title              string      `json:"title"`
	Intention          string      `json:"intention"`
	Hypothesis         string      `json:"hypothesis"`
	CreatedAt          time.Time   `json:"created_at"`
	CreatedBy          string      `json:"created_by"`
	Status             string      `json:"status"`
	HitCount           int         `json:"hit_count"`
	ArchivedAt         *time.Time  `json:"archived_at,omitempty"`
	SnapshotID         *uuid.UUID  `json:"snapshot_id,omitempty"`
	ScopeCompanyIDs    []uuid.UUID `json:"scope_company_ids"`
	ScopePerimeterIDs   []uuid.UUID `json:"scope_perimeter_ids"`
}

// ProjectPerimeterMap mapping projet ERP → périmètre
type ProjectPerimeterMap struct {
	ID                 uuid.UUID `json:"id"`
	TenantID           uuid.UUID `json:"tenant_id"`
	SourceSystem       string    `json:"source_system"`
	ProjectExternalID  string    `json:"project_external_id"`
	BusinessPerimeterID uuid.UUID `json:"business_perimeter_id"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// --- Requêtes / Réponses ---

type CreateCompanyRequest struct {
	TenantID   string `json:"tenant_id"`
	ExternalID string `json:"external_id"`
	Name       string `json:"name"`
}

type CreatePerimeterRequest struct {
	TenantID  string `json:"tenant_id"`
	CompanyID string `json:"company_id"`
	Name      string `json:"name"`
	SortOrder *int   `json:"sort_order,omitempty"`
}

type UpdatePerimeterRequest struct {
	Name      *string `json:"name,omitempty"`
	SortOrder *int    `json:"sort_order,omitempty"`
}

type CreateDLPRequest struct {
	TenantID           string   `json:"tenant_id"`
	Title              string   `json:"title"`
	Intention          string   `json:"intention"`
	Hypothesis         string   `json:"hypothesis"`
	CreatedBy          string   `json:"created_by"`
	ScopeCompanyIDs    []string `json:"scope_company_ids"`
	ScopePerimeterIDs   []string `json:"scope_perimeter_ids"`
}

type UpdateDLPRequest struct {
	Title            *string  `json:"title,omitempty"`
	Intention        *string  `json:"intention,omitempty"`
	Hypothesis       *string  `json:"hypothesis,omitempty"`
	Status           *string  `json:"status,omitempty"`
	ScopeCompanyIDs   []string `json:"scope_company_ids,omitempty"`
	ScopePerimeterIDs []string `json:"scope_perimeter_ids,omitempty"`
}

type CreateProjectPerimeterMapRequest struct {
	TenantID            string `json:"tenant_id"`
	SourceSystem        string `json:"source_system"`
	ProjectExternalID   string `json:"project_external_id"`
	BusinessPerimeterID string `json:"business_perimeter_id"`
}
