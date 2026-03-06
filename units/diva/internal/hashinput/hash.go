package hashinput

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/doreviateam/diva/internal/models"
)

// ComputeContextKey produit cockpit:<tenant>:<company_id>:<date_start>:<date_end> ou
// cockpit:<tenant>:<company_id>:<date_start>:<date_end>:<partner_name> si partnerName non vide.
// context_scope est toujours "cockpit" (seule valeur, spec v1.3 §2).
func ComputeContextKey(tenant string, companyID int, dateStart, dateEnd, partnerName string) string {
	base := fmt.Sprintf("cockpit:%s:%d:%s:%s", tenant, companyID, dateStart, dateEnd)
	if partnerName != "" {
		return base + ":" + partnerName
	}
	return base
}

// ComputePayloadHash calcule SHA-256(canonical_json(hash_input)) pour idempotence.
func ComputePayloadHash(req *models.ExplainRequest) (string, error) {
	hi, err := BuildHashInput(req)
	if err != nil {
		return "", err
	}
	canonical, err := CanonicalJSONForHash(hi)
	if err != nil {
		return "", err
	}
	h := sha256.Sum256(canonical)
	return hex.EncodeToString(h[:]), nil
}
