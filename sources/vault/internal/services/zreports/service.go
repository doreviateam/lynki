package zreports

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/ledger/filesystem"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
)

// canonicalizeZReportInput canonicalise un ZReportInput selon l'ordre spécifié
// Ordre canonique (section 11 spec) :
// 1. chain_level, 2. company_id, 3. date_close, 4. date_open, 5. hash_prev,
// 6. last_ticket_hash, 7. payments, 8. sequence, 9. tickets, 10. tickets_count,
// 11. totals, 12. z_id, 13. tenant
func canonicalizeZReportInput(input *ZReportInput) ([]byte, error) {
	// Créer une copie pour ne pas modifier l'original
	canonical := map[string]interface{}{
		"chain_level":     input.ChainLevel,
		"company_id":      input.CompanyID,
		"date_close":      input.DateClose.Format("2006-01-02T15:04:05Z07:00"),
		"date_open":       input.DateOpen.Format("2006-01-02T15:04:05Z07:00"),
		"payments":        input.Payments,
		"sequence":        input.Sequence,
		"tickets":         input.Tickets,
		"tickets_count":   input.TicketsCount,
		"totals": map[string]interface{}{
			"amount_net":   input.Totals.AmountNet,
			"amount_tax":   input.Totals.AmountTax,
			"amount_total": input.Totals.AmountTotal,
		},
		"z_id":   input.ZID,
		"tenant": input.Tenant,
	}

	// Ajouter hash_prev seulement s'il n'est pas nil et non vide
	if input.HashPrev != nil && *input.HashPrev != "" {
		canonical["hash_prev"] = *input.HashPrev
	}

	// Ajouter last_ticket_hash seulement s'il n'est pas vide
	// Sprint 7 - Modification : last_ticket_hash optionnel pour sessions sans tickets
	if input.LastTicketHash != "" {
		canonical["last_ticket_hash"] = input.LastTicketHash
	}

	// Marshal en JSON compact
	jsonBytes, err := json.Marshal(canonical)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal canonical Z-Report: %w", err)
	}

	// Appliquer la canonicalisation JSON standard (tri récursif, suppression null, normalisation nombres)
	canonicalBytes, err := utils.CanonicalizeJSON(jsonBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to canonicalize JSON: %w", err)
	}

	return canonicalBytes, nil
}

// convertPayments convertit les payments du service vers les types filesystem
func convertPayments(payments []Payment) []filesystem.Payment {
	result := make([]filesystem.Payment, len(payments))
	for i, p := range payments {
		result[i] = filesystem.Payment{
			Method: p.Method,
			Amount: p.Amount,
		}
	}
	return result
}

// ValidationError représente une erreur de validation
type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("validation error [%s]: %s", e.Field, e.Message)
}

// ZReportValidator valide les Z-Reports
type ZReportValidator struct {
	ledger filesystem.ZReportLedger
}

// NewZReportValidator crée un nouveau validateur Z-Report
func NewZReportValidator(ledger filesystem.ZReportLedger) *ZReportValidator {
	return &ZReportValidator{ledger: ledger}
}

// ValidateTenant valide la cohérence du tenant
func (v *ZReportValidator) ValidateTenant(headerTenant, payloadTenant string, companyID int) error {
	if headerTenant != payloadTenant {
		return ValidationError{Field: "tenant", Message: fmt.Sprintf("tenant mismatch: header=%s, payload=%s", headerTenant, payloadTenant)}
	}
	if headerTenant == "" {
		return ValidationError{Field: "tenant", Message: "tenant is required"}
	}
	if companyID <= 0 {
		return ValidationError{Field: "company_id", Message: "company_id must be greater than 0"}
	}
	return nil
}

// ValidatePayload valide le payload Z-Report
func (v *ZReportValidator) ValidatePayload(input *ZReportInput) error {
	if input.ZID == "" {
		return ValidationError{Field: "z_id", Message: "z_id is required"}
	}
	if input.ChainLevel == "" {
		return ValidationError{Field: "chain_level", Message: "chain_level is required"}
	}
	if input.ChainLevel != "z-report" {
		return ValidationError{Field: "chain_level", Message: fmt.Sprintf("chain_level must be 'z-report', got '%s'", input.ChainLevel)}
	}
	if input.Tenant == "" {
		return ValidationError{Field: "tenant", Message: "tenant is required"}
	}
	// last_ticket_hash est requis uniquement si tickets_count > 0
	// Sprint 7 - Modification : rendre last_ticket_hash optionnel pour sessions sans tickets
	if input.TicketsCount > 0 && input.LastTicketHash == "" {
		return ValidationError{Field: "last_ticket_hash", Message: "last_ticket_hash is required when tickets_count > 0"}
	}
	if input.DateOpen.IsZero() {
		return ValidationError{Field: "date_open", Message: "date_open is required"}
	}
	if input.DateClose.IsZero() {
		return ValidationError{Field: "date_close", Message: "date_close is required"}
	}
	if input.DateClose.Before(input.DateOpen) {
		return ValidationError{Field: "date_close", Message: "date_close must be after date_open"}
	}
	if input.Totals.AmountTotal < 0 {
		return ValidationError{Field: "totals.amount_total", Message: "amount_total must be >= 0"}
	}
	if input.Totals.AmountTax < 0 {
		return ValidationError{Field: "totals.amount_tax", Message: "amount_tax must be >= 0"}
	}
	if input.Totals.AmountNet < 0 {
		return ValidationError{Field: "totals.amount_net", Message: "amount_net must be >= 0"}
	}
	for i, payment := range input.Payments {
		if payment.Method == "" {
			return ValidationError{Field: fmt.Sprintf("payments[%d].method", i), Message: "payment method is required"}
		}
		if payment.Amount < 0 {
			return ValidationError{Field: fmt.Sprintf("payments[%d].amount", i), Message: "payment amount must be >= 0"}
		}
	}
	if input.TicketsCount != len(input.Tickets) {
		return ValidationError{Field: "tickets_count", Message: fmt.Sprintf("tickets_count (%d) must equal len(tickets) (%d)", input.TicketsCount, len(input.Tickets))}
	}
	for i, ticket := range input.Tickets {
		if ticket == "" {
			return ValidationError{Field: fmt.Sprintf("tickets[%d]", i), Message: "ticket ID cannot be empty"}
		}
	}
	return nil
}

// ValidateHashPrev valide que hash_prev existe dans le ledger (si fourni)
func (v *ZReportValidator) ValidateHashPrev(ctx context.Context, tenant string, hashPrev *string, dateClose time.Time) error {
	if hashPrev == nil || *hashPrev == "" {
		return nil
	}
	year := dateClose.Year()
	month := int(dateClose.Month())
	lastHash, err := v.ledger.GetLastHash(ctx, tenant, year, month)
	if err != nil {
		return fmt.Errorf("failed to get last hash: %w", err)
	}
	if lastHash != *hashPrev {
		return ValidationError{Field: "hash_prev", Message: fmt.Sprintf("hash_prev (%s) does not match last hash (%s)", *hashPrev, lastHash)}
	}
	return nil
}

// Validate valide complètement un Z-Report (tenant + payload + hash_prev)
func (v *ZReportValidator) Validate(ctx context.Context, headerTenant string, input *ZReportInput) error {
	if err := v.ValidateTenant(headerTenant, input.Tenant, input.CompanyID); err != nil {
		return err
	}
	if err := v.ValidatePayload(input); err != nil {
		return err
	}
	if err := v.ValidateHashPrev(ctx, input.Tenant, input.HashPrev, input.DateClose); err != nil {
		return err
	}
	return nil
}

// ZReportsServiceInterface définit l'interface du service Z-Reports
type ZReportsServiceInterface interface {
	Ingest(ctx context.Context, headerTenant string, input ZReportInput) (*ZReportResult, error)
}

// ZReportsService gère l'ingestion des Z-Reports
// Sprint 7 - Phase 3 : Service métier pour Z-Reports
type ZReportsService struct {
	ledger    filesystem.ZReportLedger
	validator *ZReportValidator
	signer    crypto.Signer
	repo      storage.DocumentRepository
}

// Vérifier que ZReportsService implémente ZReportsServiceInterface
var _ ZReportsServiceInterface = (*ZReportsService)(nil)

// NewZReportsService crée un nouveau service Z-Reports
func NewZReportsService(
	ledger filesystem.ZReportLedger,
	validator *ZReportValidator,
	signer crypto.Signer,
	repo storage.DocumentRepository,
) *ZReportsService {
	return &ZReportsService{
		ledger:    ledger,
		validator: validator,
		signer:    signer,
		repo:      repo,
	}
}

// Ingest traite l'ingestion d'un Z-Report
func (s *ZReportsService) Ingest(ctx context.Context, headerTenant string, input ZReportInput) (*ZReportResult, error) {
	// 1. Validation complète (tenant + payload + hash_prev)
	if err := s.validator.Validate(ctx, headerTenant, &input); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// 2. Vérifier que last_ticket_hash existe dans le repository (si fourni)
	// Sprint 7 - Modification : last_ticket_hash optionnel pour sessions sans tickets
	// (le ticket doit avoir été vaulté avant le Z-Report uniquement si last_ticket_hash est fourni)
	if input.LastTicketHash != "" {
		doc, err := s.repo.GetDocumentBySHA256(ctx, input.LastTicketHash)
		if err != nil {
			return nil, fmt.Errorf("failed to check last_ticket_hash: %w", err)
		}
		if doc == nil {
			return nil, fmt.Errorf("last_ticket_hash not found: %s (ticket must be vaulted before Z-Report)", input.LastTicketHash)
		}
	}

	// 3. Récupérer hash_prev depuis le ledger filesystem
	// Si hash_prev n'est pas fourni dans l'input, on le récupère du ledger
	year := input.DateClose.Year()
	month := int(input.DateClose.Month())
	
	var hashPrev *string
	if input.HashPrev != nil && *input.HashPrev != "" {
		// hash_prev fourni dans l'input, on l'utilise
		hashPrev = input.HashPrev
	} else {
		// Récupérer le dernier hash du mois
		lastHash, err := s.ledger.GetLastHash(ctx, input.Tenant, year, month)
		if err != nil {
			return nil, fmt.Errorf("failed to get last hash: %w", err)
		}
		if lastHash != "" {
			hashPrev = &lastHash
		}
		// Si lastHash est vide, c'est le premier Z du mois (hashPrev reste nil)
	}

	// 4. Créer une copie de l'input avec hash_prev mis à jour
	inputWithHashPrev := input
	inputWithHashPrev.HashPrev = hashPrev

	// 5. Canonicaliser le JSON (supprime hash_current, trie les clés)
	canonicalBytes, err := canonicalizeZReportInput(&inputWithHashPrev)
	if err != nil {
		return nil, fmt.Errorf("failed to canonicalize Z-Report: %w", err)
	}

	// 6. Calculer hash_current = SHA256(canonical_json)
	hash := sha256.Sum256(canonicalBytes)
	hashCurrent := hex.EncodeToString(hash[:])

	// 7. Construire le payload Evidence et signer
	now := time.Now().UTC()
	evidencePayload := crypto.ZReportEvidencePayload{
		ZID:         input.ZID,
		Tenant:      input.Tenant,
		HashCurrent: hashCurrent,
		IAT:         now.Unix(),
		ISS:         "dorevia-vault",
	}

	// Ajouter hash_prev si présent
	if hashPrev != nil && *hashPrev != "" {
		evidencePayload.HashPrev = *hashPrev
	}

	evidenceBytes, err := json.Marshal(evidencePayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal evidence payload: %w", err)
	}

	signature, err := s.signer.SignPayload(ctx, evidenceBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to sign evidence: %w", err)
	}
	evidenceJWS := signature.JWS

	// 8. Créer le ZReport pour stockage (conversion vers types filesystem)
	zReport := &filesystem.ZReport{
		Payload: filesystem.ZReportPayload{
			ZID:           inputWithHashPrev.ZID,
			CompanyID:     inputWithHashPrev.CompanyID,
			Sequence:      inputWithHashPrev.Sequence,
			DateOpen:      inputWithHashPrev.DateOpen,
			DateClose:     inputWithHashPrev.DateClose,
			Totals:        filesystem.Totals(inputWithHashPrev.Totals),
			Payments:      convertPayments(inputWithHashPrev.Payments),
			Tickets:       inputWithHashPrev.Tickets,
			TicketsCount:  inputWithHashPrev.TicketsCount,
			HashPrev:      inputWithHashPrev.HashPrev,
			LastTicketHash: inputWithHashPrev.LastTicketHash,
			ChainLevel:    inputWithHashPrev.ChainLevel,
			Tenant:        inputWithHashPrev.Tenant,
		},
		HashCurrent: hashCurrent,
		HashPrev:    hashPrev,
		Timestamp:   now,
		ProofURL:    fmt.Sprintf("/api/v1/evidence/%s/%s", input.Tenant, input.ZID),
	}

	// 9. Stocker dans le ledger filesystem
	if err := s.ledger.StoreZReport(ctx, input.Tenant, zReport); err != nil {
		return nil, fmt.Errorf("failed to store Z-Report in ledger: %w", err)
	}

	// 10. Retourner le résultat
	return &ZReportResult{
		ZID:         input.ZID,
		Tenant:      input.Tenant,
		HashCurrent: hashCurrent,
		HashPrev:    hashPrev,
		EvidenceJWS: evidenceJWS,
		Timestamp:   now,
		ProofURL:    zReport.ProofURL,
	}, nil
}

