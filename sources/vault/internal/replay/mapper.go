package replay

import (
	"encoding/json"
	"fmt"
	"strconv"
)

// RawPayload représente le payload raw DVIG (Odoo → DVIG → Vault)
type RawPayload struct {
	Source         string                 `json:"source"`
	EventType      string                 `json:"event_type"`
	IdempotencyKey string                 `json:"idempotency_key"`
	Data           map[string]interface{} `json:"data"`
}

// Raw types supportés (E1-US4)
var supportedRawTypes = map[string]bool{
	"invoice.posted": true,
	"payment.posted": true,
}

// IsSupportedRawType retourne true si le type raw est supporté
func IsSupportedRawType(eventType string) bool {
	return supportedRawTypes[eventType]
}

// SupportedRawTypes retourne la liste des types supportés
func SupportedRawTypes() []string {
	return []string{"invoice.posted", "payment.posted"}
}

// MapRawToCanonical transforme un payload raw en payload canonique dorevia.economic_event.v1
// SPEC ERP Reconnect v1.2 — ANNEXE_Mapping_Backfill_Schema_JSON
func MapRawToCanonical(raw *RawPayload) (map[string]interface{}, error) {
	if raw == nil || raw.Data == nil {
		return nil, fmt.Errorf("raw payload or data is nil")
	}
	data := raw.Data

	switch raw.EventType {
	case "invoice.posted":
		return mapInvoicePosted(data), nil
	case "payment.posted":
		return mapPaymentPosted(data), nil
	default:
		return nil, fmt.Errorf("unsupported event_type: %s", raw.EventType)
	}
}

func mapInvoicePosted(data map[string]interface{}) map[string]interface{} {
	moveType := getStr(data, "move_type", "out_invoice")
	eventType := "invoice_issued"
	if moveType == "out_refund" || moveType == "in_refund" {
		eventType = "invoice_refund"
	}
	return map[string]interface{}{
		"event_type":     eventType,
		"invoice_id":     getStr(data, "name", ""),
		"partner_ref":    partnerRef(data),
		"partner_name":   getStr(data, "partner_name", ""),
		"amount_total":   getFloat(data, "amount_total"),
		"amount_untaxed": getFloat(data, "amount_untaxed"),
		"amount_tax":     getFloat(data, "amount_tax"),
		"currency":       getStr(data, "currency", "EUR"),
		"date":           getStr(data, "date", getStr(data, "invoice_date", "")),
		"invoice_date":   getStr(data, "invoice_date", getStr(data, "date", "")),
		"move_type":      moveType,
	}
}

func mapPaymentPosted(data map[string]interface{}) map[string]interface{} {
	paymentType := getStr(data, "payment_type", "inbound")
	eventType := "payment_received"
	if paymentType == "outbound" {
		eventType = "payment_sent"
	}
	return map[string]interface{}{
		"event_type":    eventType,
		"payment_id":    getStr(data, "name", ""),
		"partner_ref":   partnerRef(data),
		"partner_name":  getStr(data, "partner_name", ""),
		"amount":        getFloat(data, "amount"),
		"currency":      getStr(data, "currency", "EUR"),
		"date":          getStr(data, "date", ""),
		"payment_type":  paymentType,
		"method":        getStr(data, "method", "transfer"),
		"is_refund":     getBool(data, "is_refund"),
		"company_id":    getInt(data, "company_id"),
	}
}

func partnerRef(data map[string]interface{}) string {
	if v, ok := data["partner_id"]; ok {
		switch x := v.(type) {
		case float64:
			return strconv.FormatInt(int64(x), 10)
		case int:
			return strconv.Itoa(x)
		case int64:
			return strconv.FormatInt(x, 10)
		case string:
			return x
		}
	}
	if v, ok := data["vat"]; ok && v != nil {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

func getStr(m map[string]interface{}, key, def string) string {
	if v, ok := m[key]; ok && v != nil {
		if s, ok := v.(string); ok {
			return s
		}
		return fmt.Sprintf("%v", v)
	}
	return def
}

func getFloat(m map[string]interface{}, key string) float64 {
	if v, ok := m[key]; ok && v != nil {
		switch x := v.(type) {
		case float64:
			return x
		case int:
			return float64(x)
		case int64:
			return float64(x)
		}
	}
	return 0
}

func getInt(m map[string]interface{}, key string) int {
	if v, ok := m[key]; ok && v != nil {
		switch x := v.(type) {
		case float64:
			return int(x)
		case int:
			return x
		case int64:
			return int(x)
		}
	}
	return 0
}

func getBool(m map[string]interface{}, key string) bool {
	if v, ok := m[key]; ok && v != nil {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return false
}

// CanonicalToJSON serialise le payload canonique en JSON (pour hash et stockage)
func CanonicalToJSON(canonical map[string]interface{}) ([]byte, error) {
	return json.Marshal(canonical)
}
