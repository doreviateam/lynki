package services

// PaymentInput représente l'input pour l'ingestion d'un paiement
// Type défini dans services pour éviter la dépendance inverse (services → handlers)
type PaymentInput struct {
	Tenant            string                 // Obligatoire
	SourceSystem      string                 // Défaut: "odoo"
	SourceModel       string                 // Obligatoire (ex: "account.payment", "pos.payment")
	SourceID          string                 // Obligatoire (ex: "PAY/2025/00123")
	PaymentDate       string                 // Obligatoire (RFC3339)
	Amount            float64                // Obligatoire
	Currency          string                 // Obligatoire (ISO 4217)
	Method            string                 // Obligatoire (cash, card, mixed, check, transfer, other)
	Source            string                 // Obligatoire (pos, account)
	PaymentDirection  string                 // Obligatoire (inbound, outbound)
	IsRefund          bool                   // Obligatoire
	CompanyID         int                    // Obligatoire
	Payment           map[string]interface{} // Obligatoire (JSON brut du paiement avec métadonnées)
	IdempotencyKey    string                 // Optionnel (SPEC v1.1 Step 1) ; si fourni, priorité sur SHA256
	// Step 3 — SPEC v1.1 : source duale + allocations
	BusinessSource   string                 // Optionnel : POS | ACCOUNT | ECOM | PSP | BANK
	TechnicalSource  string                 // Optionnel : ex. odoo_account, odoo_pos
	CompanyName      string                 // Optionnel : libellé magasin
	CompanyIDString   string                 // Optionnel : format normatif technical_source:raw_id (prioritaire sur dérivation)
	Allocations      []AllocationItem        // Optionnel : liens documents (factures, tickets)
}

// AllocationItem — un document économique lié au paiement (SPEC v1.1 §3.2).
type AllocationItem struct {
	DocumentType       string  `json:"document_type"`        // invoice | credit_note | receipt | order | other
	DocumentNumber     string  `json:"document_number"`
	DocumentSourceModel string `json:"document_source_model"`
	DocumentSourceID   string  `json:"document_source_id"`
	AllocatedAmount    float64 `json:"allocated_amount"`
}

