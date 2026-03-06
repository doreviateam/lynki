package replay

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMapInvoicePosted(t *testing.T) {
	raw := &RawPayload{
		EventType:      "invoice.posted",
		IdempotencyKey: "abc123",
		Data: map[string]interface{}{
			"model":          "account.move",
			"id":             float64(1234),
			"name":           "FAC/2026/00001",
			"move_type":      "out_invoice",
			"partner_id":     float64(42),
			"partner_name":   "Client SARL",
			"amount_total":   1200.0,
			"amount_untaxed": 1000.0,
			"amount_tax":     200.0,
			"currency":       "EUR",
			"date":           "2026-02-15",
			"invoice_date":   "2026-02-15",
		},
	}
	canonical, err := MapRawToCanonical(raw)
	require.NoError(t, err)
	assert.Equal(t, "invoice_issued", canonical["event_type"])
	assert.Equal(t, "FAC/2026/00001", canonical["invoice_id"])
	assert.Equal(t, "42", canonical["partner_ref"])
	assert.Equal(t, "Client SARL", canonical["partner_name"])
	assert.Equal(t, 1200.0, canonical["amount_total"])
	assert.Equal(t, "EUR", canonical["currency"])
}

func TestMapPaymentPosted(t *testing.T) {
	raw := &RawPayload{
		EventType: "payment.posted",
		Data: map[string]interface{}{
			"model":         "account.payment",
			"id":            float64(567),
			"name":          "PAY/2026/00001",
			"amount":        500.0,
			"currency":      "EUR",
			"date":          "2026-02-16",
			"partner_id":    float64(42),
			"partner_name":  "Client SARL",
			"payment_type":  "inbound",
			"method":        "transfer",
			"is_refund":     false,
			"company_id":    float64(1),
		},
	}
	canonical, err := MapRawToCanonical(raw)
	require.NoError(t, err)
	assert.Equal(t, "payment_received", canonical["event_type"])
	assert.Equal(t, "PAY/2026/00001", canonical["payment_id"])
	assert.Equal(t, "42", canonical["partner_ref"])
	assert.Equal(t, 500.0, canonical["amount"])
}

func TestMapPaymentOutbound(t *testing.T) {
	raw := &RawPayload{
		EventType: "payment.posted",
		Data: map[string]interface{}{
			"name":         "PAY/002",
			"amount":       100.0,
			"partner_id":   float64(10),
			"payment_type": "outbound",
		},
	}
	canonical, err := MapRawToCanonical(raw)
	require.NoError(t, err)
	assert.Equal(t, "payment_sent", canonical["event_type"])
}

func TestUnsupportedType(t *testing.T) {
	raw := &RawPayload{EventType: "unknown.event", Data: map[string]interface{}{}}
	_, err := MapRawToCanonical(raw)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported")
}

func TestIsSupportedRawType(t *testing.T) {
	assert.True(t, IsSupportedRawType("invoice.posted"))
	assert.True(t, IsSupportedRawType("payment.posted"))
	assert.False(t, IsSupportedRawType("unknown"))
}

func TestCanonicalToJSON(t *testing.T) {
	canonical := map[string]interface{}{
		"event_type": "invoice_issued",
		"invoice_id": "FAC/001",
		"partner_ref": "42",
	}
	b, err := CanonicalToJSON(canonical)
	require.NoError(t, err)
	var decoded map[string]interface{}
	err = json.Unmarshal(b, &decoded)
	require.NoError(t, err)
	assert.Equal(t, "invoice_issued", decoded["event_type"])
}
