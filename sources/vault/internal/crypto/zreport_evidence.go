package crypto

// ZReportEvidencePayload représente le payload à signer pour un Z-Report
// Sprint 7 - Phase 0 : Payload JWS spécifique aux Z-Reports
type ZReportEvidencePayload struct {
	ZID         string `json:"z_id"`
	Tenant      string `json:"tenant"`
	HashCurrent string `json:"hash_current"`
	HashPrev    string `json:"hash_prev,omitempty"` // Peut être vide pour le premier Z du mois
	IAT         int64  `json:"iat"`                 // Issued At (Unix timestamp)
	ISS         string `json:"iss"`                 // Issuer (toujours "dorevia-vault")
}

