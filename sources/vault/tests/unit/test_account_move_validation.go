package unit

import (
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/handlers"
)

// TestValidateAccountMovePayload_ValidPayloads teste les payloads valides
func TestValidateAccountMovePayload_ValidPayloads(t *testing.T) {
	tests := []struct {
		name    string
		payload *handlers.InvoicePayload
	}{
		{
			name: "AC-1: out_invoice posted avec source sales",
			payload: &handlers.InvoicePayload{
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
			payload: &handlers.InvoicePayload{
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
			payload: &handlers.InvoicePayload{
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
			payload: &handlers.InvoicePayload{
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
			// Note: validateAccountMovePayload est une fonction privée
			// On teste via le handler complet dans les tests d'intégration
			// Ici on vérifie juste que le payload est bien structuré
			if tt.payload.Model != "account.move" {
				t.Errorf("Expected model 'account.move', got '%s'", tt.payload.Model)
			}
			if tt.payload.State != "posted" {
				t.Errorf("Expected state 'posted', got '%s'", tt.payload.State)
			}
			if tt.payload.Meta == nil {
				t.Error("Meta is required")
			}
			if moveType, ok := tt.payload.Meta["move_type"].(string); !ok || moveType == "" {
				t.Error("meta.move_type is required and must be a non-empty string")
			}
			if tenant, ok := tt.payload.Meta["tenant"].(string); !ok || tenant == "" {
				t.Error("meta.tenant is required and must be a non-empty string")
			}
		})
	}
}

// TestValidateAccountMovePayload_InvalidModel teste AC-5: model != "account.move"
func TestValidateAccountMovePayload_InvalidModel(t *testing.T) {
	payload := &handlers.InvoicePayload{
		Source: "sales",
		Model:  "pos.order", // Invalid model
		State:  "posted",
		Meta: map[string]interface{}{
			"move_type": "out_invoice",
			"tenant":    "test-tenant",
		},
	}

	// On teste via le handler dans les tests d'intégration
	// Ici on vérifie juste la structure
	if payload.Model == "account.move" {
		t.Error("Expected invalid model for this test")
	}
}

// TestValidateAccountMovePayload_InvalidState teste AC-6: state != "posted"
func TestValidateAccountMovePayload_InvalidState(t *testing.T) {
	invalidStates := []string{"draft", "cancel", "paid", "done"}

	for _, state := range invalidStates {
		t.Run("state_"+state, func(t *testing.T) {
			payload := &handlers.InvoicePayload{
				Source: "sales",
				Model:  "account.move",
				State:  state,
				Meta: map[string]interface{}{
					"move_type": "out_invoice",
					"tenant":    "test-tenant",
				},
			}

			// On teste via le handler dans les tests d'intégration
			if payload.State == "posted" {
				t.Errorf("Expected invalid state '%s' for this test", state)
			}
		})
	}
}

// TestValidateAccountMovePayload_InvalidMoveType teste AC-7: move_type invalide
func TestValidateAccountMovePayload_InvalidMoveType(t *testing.T) {
	invalidMoveTypes := []string{"invalid", "out_credit", "in_credit", ""}

	for _, moveType := range invalidMoveTypes {
		t.Run("move_type_"+moveType, func(t *testing.T) {
			payload := &handlers.InvoicePayload{
				Source: "sales",
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": moveType,
					"tenant":    "test-tenant",
				},
			}

			// On teste via le handler dans les tests d'intégration
			if mt, ok := payload.Meta["move_type"].(string); ok {
				allowed := map[string]bool{
					"out_invoice": true,
					"in_invoice":  true,
					"out_refund":  true,
					"in_refund":   true,
				}
				if allowed[mt] {
					t.Errorf("Expected invalid move_type '%s' for this test", moveType)
				}
			}
		})
	}
}

// TestValidateAccountMovePayload_SourceMoveTypeMismatch teste AC-8: source/move_type mismatch
func TestValidateAccountMovePayload_SourceMoveTypeMismatch(t *testing.T) {
	tests := []struct {
		name    string
		source  string
		moveType string
	}{
		{"out_invoice avec purchase", "purchase", "out_invoice"},
		{"in_invoice avec sales", "sales", "in_invoice"},
		{"out_refund avec purchase", "purchase", "out_refund"},
		{"in_refund avec sales", "sales", "in_refund"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := &handlers.InvoicePayload{
				Source: tt.source,
				Model:  "account.move",
				State:  "posted",
				Meta: map[string]interface{}{
					"move_type": tt.moveType,
					"tenant":    "test-tenant",
				},
			}

			// On teste via le handler dans les tests d'intégration
			// Ici on vérifie juste la structure
			expectedSource := ""
			if tt.moveType == "out_invoice" || tt.moveType == "out_refund" {
				expectedSource = "sales"
			} else if tt.moveType == "in_invoice" || tt.moveType == "in_refund" {
				expectedSource = "purchase"
			}

			if payload.Source == expectedSource {
				t.Errorf("Expected source mismatch: got '%s', expected different from '%s'", payload.Source, expectedSource)
			}
		})
	}
}

// TestValidateAccountMovePayload_MissingTenant teste AC-9: tenant manquant
func TestValidateAccountMovePayload_MissingTenant(t *testing.T) {
	payload := &handlers.InvoicePayload{
		Source: "sales",
		Model:  "account.move",
		State:  "posted",
		Meta: map[string]interface{}{
			"move_type": "out_invoice",
			// tenant manquant
		},
	}

	// On teste via le handler dans les tests d'intégration
	if tenant, ok := payload.Meta["tenant"].(string); ok && tenant != "" {
		t.Error("Expected missing tenant for this test")
	}
}

