package crypto

import "context"

// NoOpSigner implémente Signer sans clé JWS (JWS désactivé).
// Retourne une signature vide pour permettre l'ingestion des paiements sans scellement.
func NewNoOpSigner() *NoOpSigner { return &NoOpSigner{} }

// NoOpSigner est un signer qui ne signe pas (evidence_jws vide en base).
type NoOpSigner struct{}

// SignPayload retourne une signature vide (JWS désactivé).
func (s *NoOpSigner) SignPayload(ctx context.Context, payload []byte) (*Signature, error) {
	return &Signature{JWS: "", KID: ""}, nil
}

// KeyID retourne une chaîne vide.
func (s *NoOpSigner) KeyID() string { return "" }
