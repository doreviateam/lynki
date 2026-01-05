package handlers

import (
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/validation"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

// TestValidateAccountMovePayload_ValidPayloads teste AC-1 à AC-4 : payloads valides
func TestValidateAccountMovePayload_ValidPayloads(t *testing.T) {
	tests := []struct {
		name    string
		payload *InvoicePayload
	}{
		{
			name: "AC-1: out_invoice posted avec source sales",
			payload: &InvoicePayload{
				Source: "sales",
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": "out_invoice",
					"tenant":    "test-tenant",
				},
			},
		},
		{
			name: "AC-2: in_invoice posted avec source purchase",
			payload: &InvoicePayload{
				Source: "purchase",
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": "in_invoice",
					"tenant":    "test-tenant",
				},
			},
		},
		{
			name: "AC-3: out_refund posted avec source sales",
			payload: &InvoicePayload{
				Source: "sales",
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": "out_refund",
					"tenant":    "test-tenant",
				},
			},
		},
		{
			name: "AC-4: in_refund posted avec source purchase",
			payload: &InvoicePayload{
				Source: "purchase",
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": "in_refund",
					"tenant":    "test-tenant",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateAccountMovePayload(tt.payload)
			assert.NoError(t, err, "Valid payload should not return error")
		})
	}
}

// TestValidateAccountMovePayload_InvalidModel teste AC-5 : model != "account.move"
func TestValidateAccountMovePayload_InvalidModel(t *testing.T) {
	payload := &InvoicePayload{
		Source: "sales",
		Model:  "pos.order", // Invalid model
		State:  "posted",
		Meta: map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    "test-tenant",
		},
	}

	err := validateAccountMovePayload(payload)
	assert.Error(t, err, "Invalid model should return error")
	assert.Contains(t, err.Error(), "model must be 'account.move'", "Error should mention model validation")
}

// TestValidateAccountMovePayload_InvalidState teste AC-6 : state != "posted"
func TestValidateAccountMovePayload_InvalidState(t *testing.T) {
	invalidStates := []string{"draft", "cancel", "paid", "done"}

	for _, state := range invalidStates {
		t.Run("state_"+state, func(t *testing.T) {
			payload := &InvoicePayload{
				Source: "sales",
				Model:  "account.move",
				State:  state,
				Meta: map[string]interface{}{
					"move_type": "out_invoice",
					"tenant":    "test-tenant",
				},
			}

			err := validateAccountMovePayload(payload)
			assert.Error(t, err, "Invalid state should return error")
			assert.Contains(t, err.Error(), "state must be 'posted'", "Error should mention state validation")
		})
	}
}

// TestValidateAccountMovePayload_InvalidMoveType teste AC-7 : move_type invalide
func TestValidateAccountMovePayload_InvalidMoveType(t *testing.T) {
	invalidMoveTypes := []string{"invalid", "out_credit", "in_credit", ""}

	for _, moveType := range invalidMoveTypes {
		t.Run("move_type_"+moveType, func(t *testing.T) {
			payload := &InvoicePayload{
				Source: "sales",
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": moveType,
					"tenant":    "test-tenant",
				},
			}

			err := validateAccountMovePayload(payload)
			assert.Error(t, err, "Invalid move_type should return error")
			assert.Contains(t, err.Error(), "move_type", "Error should mention move_type validation")
		})
	}
}

// TestValidateAccountMovePayload_MissingMoveType teste le cas où move_type est absent
func TestValidateAccountMovePayload_MissingMoveType(t *testing.T) {
	payload := &InvoicePayload{
		Source: "sales",
		Model:  "account.move",
		State:  "posted",
		Meta: map[string]interface{}{
			"tenant": "test-tenant",
			// move_type manquant
		},
	}

	err := validateAccountMovePayload(payload)
	assert.Error(t, err, "Missing move_type should return error")
	assert.Contains(t, err.Error(), "meta.move_type is required", "Error should mention move_type is required")
}

// TestValidateAccountMovePayload_SourceMoveTypeMismatch teste AC-8 : source/move_type mismatch
func TestValidateAccountMovePayload_SourceMoveTypeMismatch(t *testing.T) {
	tests := []struct {
		name     string
		source   string
		moveType string
	}{
		{"out_invoice avec purchase", "purchase", "out_invoice"},
		{"in_invoice avec sales", "sales", "in_invoice"},
		{"out_refund avec purchase", "purchase", "out_refund"},
		{"in_refund avec sales", "sales", "in_refund"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := &InvoicePayload{
				Source: tt.source,
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": tt.moveType,
					"tenant":    "test-tenant",
				},
			}

			err := validateAccountMovePayload(payload)
			assert.Error(t, err, "Source/move_type mismatch should return error")
			assert.Contains(t, err.Error(), "source", "Error should mention source validation")
		})
	}
}

// TestValidateAccountMovePayload_MissingTenant teste AC-9 : tenant manquant
func TestValidateAccountMovePayload_MissingTenant(t *testing.T) {
	payload := &InvoicePayload{
		Source: "sales",
		Model:  "account.move",
		State:  "posted",
		Meta: map[string]interface{}{
			"move_type": "out_invoice",
			// tenant manquant
		},
	}

	err := validateAccountMovePayload(payload)
	assert.Error(t, err, "Missing tenant should return error")
	assert.Contains(t, err.Error(), "meta.tenant", "Error should mention tenant validation")
}

// TestValidateAccountMovePayload_EmptyTenant teste le cas où tenant est vide
func TestValidateAccountMovePayload_EmptyTenant(t *testing.T) {
	payload := &InvoicePayload{
		Source: "sales",
		Model:  "account.move",
		State:  "posted",
		Meta: map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    "", // tenant vide
		},
	}

	err := validateAccountMovePayload(payload)
	assert.Error(t, err, "Empty tenant should return error")
	assert.Contains(t, err.Error(), "meta.tenant must be a non-empty string", "Error should mention tenant must be non-empty")
}

// TestValidateAccountMovePayload_MissingMeta teste le cas où meta est nil
func TestValidateAccountMovePayload_MissingMeta(t *testing.T) {
	payload := &InvoicePayload{
		Source: "sales",
		Model:  "account.move",
		State:  "posted",
		Meta:   nil, // meta manquant
	}

	err := validateAccountMovePayload(payload)
	assert.Error(t, err, "Missing meta should return error")
	assert.Contains(t, err.Error(), "meta is required", "Error should mention meta is required")
}

// TestDetectFacturXCompliance_Compliant teste le cas où Factur-X est présent → compliant
func TestDetectFacturXCompliance_Compliant(t *testing.T) {
	logger := zerolog.Nop()
	
	// Créer un résultat de validation Factur-X valide
	facturXResult := &validation.ValidationResult{
		Valid: true,
		Metadata: &validation.InvoiceMetadata{
			SellerVAT: "FR12345678901",
			BuyerVAT:  "FR98765432109",
		},
	}

	meta := map[string]interface{}{
		"tenant": "test-tenant",
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	assert.Equal(t, "compliant", complianceStatus, "Should be compliant when Factur-X is present")
	assert.True(t, facturXPresent, "facturx_present should be true")
}

// TestDetectFacturXCompliance_NonCompliant2026 teste le cas B2B sans Factur-X → non_compliant_2026
func TestDetectFacturXCompliance_NonCompliant2026(t *testing.T) {
	logger := zerolog.Nop()
	
	// Pas de résultat Factur-X (nil ou invalide)
	var facturXResult *validation.ValidationResult = nil

	// Meta avec buyer_vat et seller_vat (B2B probable)
	meta := map[string]interface{}{
		"tenant":     "test-tenant",
		"buyer_vat":  "FR98765432109",
		"seller_vat": "FR12345678901",
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	assert.Equal(t, "non_compliant_2026", complianceStatus, "Should be non_compliant_2026 when B2B probable but no Factur-X")
	assert.False(t, facturXPresent, "facturx_present should be false")
}

// TestDetectFacturXCompliance_NonCompliant2026_InvalidResult teste le cas Factur-X invalide avec B2B
func TestDetectFacturXCompliance_NonCompliant2026_InvalidResult(t *testing.T) {
	logger := zerolog.Nop()
	
	// Résultat Factur-X invalide
	facturXResult := &validation.ValidationResult{
		Valid: false,
		Errors: []string{"Invalid XML structure"},
	}

	meta := map[string]interface{}{
		"tenant":     "test-tenant",
		"buyer_vat":  "FR98765432109",
		"seller_vat": "FR12345678901",
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	assert.Equal(t, "non_compliant_2026", complianceStatus, "Should be non_compliant_2026 when Factur-X invalid but B2B probable")
	assert.False(t, facturXPresent, "facturx_present should be false when Factur-X is invalid")
}

// TestDetectFacturXCompliance_OutOfScope teste le cas B2C / non qualifié → out_of_scope
func TestDetectFacturXCompliance_OutOfScope(t *testing.T) {
	logger := zerolog.Nop()
	
	// Pas de résultat Factur-X
	var facturXResult *validation.ValidationResult = nil

	// Meta sans buyer_vat ni seller_vat (B2C probable)
	meta := map[string]interface{}{
		"tenant": "test-tenant",
		// Pas de buyer_vat ni seller_vat
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	assert.Equal(t, "out_of_scope", complianceStatus, "Should be out_of_scope when no B2B indicators")
	assert.False(t, facturXPresent, "facturx_present should be false")
}

// TestDetectFacturXCompliance_OutOfScope_OnlyBuyerVAT teste le cas avec seulement buyer_vat
func TestDetectFacturXCompliance_OutOfScope_OnlyBuyerVAT(t *testing.T) {
	logger := zerolog.Nop()
	
	var facturXResult *validation.ValidationResult = nil

	// Meta avec seulement buyer_vat (pas seller_vat)
	meta := map[string]interface{}{
		"tenant":    "test-tenant",
		"buyer_vat": "FR98765432109",
		// Pas de seller_vat
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	assert.Equal(t, "out_of_scope", complianceStatus, "Should be out_of_scope when only buyer_vat (not B2B probable)")
	assert.False(t, facturXPresent, "facturx_present should be false")
}

// TestDetectFacturXCompliance_OutOfScope_OnlySellerVAT teste le cas avec seulement seller_vat
func TestDetectFacturXCompliance_OutOfScope_OnlySellerVAT(t *testing.T) {
	logger := zerolog.Nop()
	
	var facturXResult *validation.ValidationResult = nil

	// Meta avec seulement seller_vat (pas buyer_vat)
	meta := map[string]interface{}{
		"tenant":     "test-tenant",
		"seller_vat": "FR12345678901",
		// Pas de buyer_vat
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	assert.Equal(t, "out_of_scope", complianceStatus, "Should be out_of_scope when only seller_vat (not B2B probable)")
	assert.False(t, facturXPresent, "facturx_present should be false")
}

// TestDetectFacturXCompliance_MetadataPriority teste la priorité des métadonnées (Factur-X > payload)
func TestDetectFacturXCompliance_MetadataPriority(t *testing.T) {
	logger := zerolog.Nop()
	
	// Résultat Factur-X avec métadonnées
	facturXResult := &validation.ValidationResult{
		Valid: true,
		Metadata: &validation.InvoiceMetadata{
			SellerVAT: "FR11111111111", // Depuis Factur-X
			BuyerVAT:  "FR22222222222", // Depuis Factur-X
		},
	}

	// Meta avec des valeurs différentes (devrait être ignorées)
	meta := map[string]interface{}{
		"tenant":     "test-tenant",
		"buyer_vat":  "FR99999999999", // Devrait être ignoré
		"seller_vat": "FR88888888888", // Devrait être ignoré
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	assert.Equal(t, "compliant", complianceStatus, "Should be compliant when Factur-X is present")
	assert.True(t, facturXPresent, "facturx_present should be true")
}

// TestDetectFacturXCompliance_FallbackToPayload teste le fallback vers métadonnées payload
func TestDetectFacturXCompliance_FallbackToPayload(t *testing.T) {
	logger := zerolog.Nop()
	
	// Résultat Factur-X valide mais sans métadonnées VAT
	facturXResult := &validation.ValidationResult{
		Valid: true,
		Metadata: &validation.InvoiceMetadata{
			// Pas de BuyerVAT ni SellerVAT dans les métadonnées Factur-X
		},
	}

	// Meta avec buyer_vat et seller_vat (devrait être utilisé en fallback)
	meta := map[string]interface{}{
		"tenant":     "test-tenant",
		"buyer_vat":  "FR98765432109",
		"seller_vat": "FR12345678901",
	}

	complianceStatus, facturXPresent := detectFacturXCompliance(facturXResult, meta, &logger)

	// Factur-X présent → compliant (même si B2B détecté via payload)
	assert.Equal(t, "compliant", complianceStatus, "Should be compliant when Factur-X is present (even if VAT from payload)")
	assert.True(t, facturXPresent, "facturx_present should be true")
}

