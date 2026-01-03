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
}

