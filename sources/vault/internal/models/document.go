package models

import (
	"time"

	"github.com/google/uuid"
)

// Document représente un document stocké dans le système
type Document struct {
	// Champs existants
	ID          uuid.UUID `json:"id"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"content_type"`
	SizeBytes   int64     `json:"size_bytes"`
	SHA256Hex   string    `json:"sha256_hex"`
	StoredPath  string    `json:"stored_path"`
	CreatedAt   time.Time `json:"created_at"`

	// Métadonnées Odoo (Sprint 1)
	Source    *string `json:"source,omitempty"`     // sales|purchase|pos|stock|sale
	OdooModel *string `json:"odoo_model,omitempty"` // account.move, pos.order, etc.
	OdooID    *int    `json:"odoo_id,omitempty"`    // ID dans Odoo
	OdooState *string `json:"odoo_state,omitempty"` // posted, paid, done, etc.

	// Routage PDP (préparation Sprint 2)
	PDPRequired    *bool   `json:"pdp_required,omitempty"`    // Nécessite dispatch PDP ?
	DispatchStatus *string `json:"dispatch_status,omitempty"` // PENDING|SENT|ACK|REJECTED

	// Métadonnées facture (préparation Sprint 2 - validation Factur-X)
	InvoiceNumber *string    `json:"invoice_number,omitempty"`
	InvoiceDate   *time.Time `json:"invoice_date,omitempty"`
	TotalHT       *float64   `json:"total_ht,omitempty"`
	TotalTTC      *float64   `json:"total_ttc,omitempty"`
	Currency      *string    `json:"currency,omitempty"`
	SellerVAT     *string    `json:"seller_vat,omitempty"`
	BuyerVAT      *string    `json:"buyer_vat,omitempty"`

	// Preuves d'intégrité (Sprint 2)
	EvidenceJWS *string `json:"evidence_jws,omitempty"` // Jeton JWS signé
	LedgerHash  *string `json:"ledger_hash,omitempty"`  // Hash dans le ledger

	// Champs POS (Sprint 6) - optionnels, NULL pour documents non-POS
	SourceIDText *string `json:"source_id_text,omitempty" db:"source_id_text"` // ID textuel (pour POS)
	PayloadJSON  []byte  `json:"payload_json,omitempty" db:"payload_json"`     // JSON brut (pour POS)
	PosSession   *string `json:"pos_session,omitempty" db:"pos_session"`
	Cashier      *string `json:"cashier,omitempty" db:"cashier"`
	Location     *string `json:"location,omitempty" db:"location"`

	// Multi-tenant (Sprint 4 - US-4.3)
	Tenant *string `json:"tenant,omitempty" db:"tenant"` // Tenant ID (UUID ou alphanumérique)

	// SPEC 1 - Vaulting account.move posted (2026-01-03)
	MoveType         *string `json:"move_type,omitempty" db:"move_type"`                   // Type de mouvement Odoo (out_invoice, in_invoice, out_refund, in_refund)
	ComplianceStatus *string `json:"compliance_status,omitempty" db:"compliance_status"`   // Statut conformité Factur-X 2026 (compliant, non_compliant_2026, out_of_scope)
	FacturXPresent   *bool   `json:"facturx_present,omitempty" db:"facturx_present"`       // Indique si le document contient un format Factur-X

	// SPEC DVIG → Vault Forwarding v1.1 - Idempotence bout en bout
	IdempotencyKey *string `json:"idempotency_key,omitempty" db:"idempotency_key"` // Clé d'idempotence SHA256 transmise par DVIG

	// SPEC Company v1.1 - Filtre Company Linky (annexe normative v1.2)
	CompanyID *string `json:"company_id,omitempty" db:"company_id"` // Format <source_system>:<source_company_id>. Nullable pour legacy.

	// Nom du client/partenaire (buyer) - transmis par DVIG dans meta.partner_name
	PartnerName *string `json:"partner_name,omitempty" db:"partner_name"`

	// Confirmation Bancaire (SPEC v1.3) - montant signé pour clamp confirmation
	AmountSigned *float64 `json:"amount_signed,omitempty" db:"amount_signed"` // encaissement +, décaissement −

	// AR by Partner (SPEC v1.0.3) - encours & retard
	AmountResidual         *float64   `json:"amount_residual,omitempty" db:"amount_residual"`
	InvoiceDateDue         *time.Time `json:"invoice_date_due,omitempty" db:"invoice_date_due"`
	PartnerID              *string    `json:"partner_id,omitempty" db:"partner_id"`
	LastResidualEventAt    *time.Time `json:"last_residual_event_at,omitempty" db:"last_residual_event_at"`
}

// DocumentListResponse représente la réponse pour la liste de documents
type DocumentListResponse struct {
	Data       []Document         `json:"data"`
	Pagination PaginationResponse `json:"pagination"`
}

// PaginationResponse contient les informations de pagination
type PaginationResponse struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
	Pages int `json:"pages"`
}

// DocumentQuery représente les paramètres de requête pour la recherche
type DocumentQuery struct {
	Page     int
	Limit    int
	Search   string
	Type     string
	DateFrom *time.Time
	DateTo   *time.Time
}
