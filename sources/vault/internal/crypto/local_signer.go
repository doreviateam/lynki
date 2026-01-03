package crypto

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// LocalSigner implémente Signer en utilisant crypto.Service (implémentation locale)
// Sprint 6 - Phase 2 : Adaptateur depuis le service JWS existant
type LocalSigner struct {
	service *Service
}

// NewLocalSigner crée un LocalSigner depuis un Service existant
func NewLocalSigner(service *Service) *LocalSigner {
	return &LocalSigner{service: service}
}

// SignPayload signe un payload Evidence
// Supporte deux formats :
// 1. EvidencePayload (documents) : {document_id, sha256, timestamp}
// 2. ZReportEvidencePayload (Z-Reports) : {z_id, tenant, hash_current, hash_prev, iat, iss}
func (s *LocalSigner) SignPayload(ctx context.Context, payload []byte) (*Signature, error) {
	// Détecter le type de payload en vérifiant la présence de champs spécifiques
	var payloadMap map[string]interface{}
	if err := json.Unmarshal(payload, &payloadMap); err != nil {
		return nil, fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// Si le payload contient "iat" (int64) et "z_id", c'est un ZReportEvidencePayload
	if _, hasIAT := payloadMap["iat"]; hasIAT && payloadMap["z_id"] != nil {
		var zReportEvidence ZReportEvidencePayload
		if err := json.Unmarshal(payload, &zReportEvidence); err != nil {
			return nil, fmt.Errorf("failed to unmarshal Z-Report evidence payload: %w", err)
		}

		// C'est un Z-Report Evidence Payload
		// Convertir IAT (int64 Unix timestamp) en time.Time
		timestamp := time.Unix(zReportEvidence.IAT, 0).UTC()
		
		// Pour les Z-Reports, on utilise hash_current comme sha256 et z_id comme document_id
		jws, err := s.service.SignEvidence(zReportEvidence.ZID, zReportEvidence.HashCurrent, timestamp)
		if err != nil {
			return nil, fmt.Errorf("failed to sign evidence: %w", err)
		}

		return &Signature{
			JWS: jws,
			KID: s.service.GetKID(),
		}, nil
	}

	// Sinon, essayer de parser comme EvidencePayload (format standard)
	var evidence EvidencePayload
	if err := json.Unmarshal(payload, &evidence); err != nil {
		return nil, fmt.Errorf("failed to unmarshal evidence payload: %w", err)
	}

	// Parser le timestamp
	timestamp, err := time.Parse(time.RFC3339, evidence.Timestamp)
	if err != nil {
		return nil, fmt.Errorf("failed to parse timestamp: %w", err)
	}

	// Utiliser le service JWS existant
	jws, err := s.service.SignEvidence(evidence.DocumentID, evidence.Sha256, timestamp)
	if err != nil {
		return nil, fmt.Errorf("failed to sign evidence: %w", err)
	}

	return &Signature{
		JWS: jws,
		KID: s.service.GetKID(),
	}, nil
}

// KeyID retourne le KID actuel
func (s *LocalSigner) KeyID() string {
	return s.service.GetKID()
}

