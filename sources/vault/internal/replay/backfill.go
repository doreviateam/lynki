package replay

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/utils"
)

// BackfillResult résumé du backfill
type BackfillResult struct {
	Tenant       string
	Invoices     int
	Payments     int
	Legacy       int
	Errors       int
	LockedAt     time.Time
	UnlockedAt   time.Time
}

// BackfillFromDocuments lance le backfill documents → economic_events (E3-US1a, E3-US1b)
// Active le write barrier (lock) pendant l'exécution. Idempotent.
func BackfillFromDocuments(ctx context.Context, db *storage.DB, tenant, lockedBy string) (*BackfillResult, error) {
	if db == nil || db.Pool == nil {
		return nil, fmt.Errorf("database not configured")
	}
	if tenant == "" {
		return nil, fmt.Errorf("tenant is required")
	}

	result := &BackfillResult{Tenant: tenant, LockedAt: time.Now().UTC()}
	defer func() {
		result.UnlockedAt = time.Now().UTC()
		_ = db.UnlockTenant(ctx, tenant)
	}()

	// E3-US0 : Activer write barrier
	if err := db.LockTenant(ctx, tenant, lockedBy, "backfill"); err != nil {
		return nil, fmt.Errorf("lock tenant: %w", err)
	}

	// 1. Extraire factures (documents)
	invoices, err := db.ListDocumentInvoicesForBackfill(ctx, tenant)
	if err != nil {
		return nil, fmt.Errorf("list invoices: %w", err)
	}

	// 2. Extraire paiements (documents)
	payments, err := db.ListDocumentPaymentsForBackfill(ctx, tenant)
	if err != nil {
		return nil, fmt.Errorf("list payments: %w", err)
	}

	// 3. Fusion + tri par created_at, id
	merged := mergeAndSortByTime(invoices, payments)

	// 4. Mapper et insérer chaque document
	for _, doc := range merged {
		event, err := documentToEconomicEvent(doc)
		if err != nil {
			result.Errors++
			continue
		}
		event.Tenant = tenant
		event.IngestSource = "backfill"
		idempKey := doc.ID.String()
		event.IngestIdempotencyKey = &idempKey

		_, err = db.InsertEconomicEventForBackfill(ctx, event, lockedBy)
		if err != nil {
			if err == storage.ErrTenantLocked {
				result.Errors++
				continue
			}
			// Idempotent : peut échouer si doublon (unique constraint)
			result.Errors++
			continue
		}

		if event.EventType == "invoice_issued" || event.EventType == "invoice_refund" {
			result.Invoices++
		} else {
			result.Payments++
		}
	}

	return result, nil
}


// mergeAndSortByTime fusionne invoices et payments puis trie par timestamp global (created_at, id).
// SPEC §5 Migration : "Tri : timestamp ASC, event_id ASC". Garantit l'ordre rejouable sans compensation Runner.
func mergeAndSortByTime(invoices, payments []storage.DocRowForBackfill) []storage.DocRowForBackfill {
	merged := make([]storage.DocRowForBackfill, 0, len(invoices)+len(payments))
	merged = append(merged, invoices...)
	merged = append(merged, payments...)
	// Tri global : created_at ASC, id ASC (ordre déterministe pour replay)
	sort.Slice(merged, func(i, j int) bool {
		if merged[i].CreatedAt.Before(merged[j].CreatedAt) {
			return true
		}
		if merged[i].CreatedAt.After(merged[j].CreatedAt) {
			return false
		}
		return merged[i].ID.String() < merged[j].ID.String()
	})
	return merged
}

func documentToEconomicEvent(d storage.DocRowForBackfill) (*models.EconomicEvent, error) {
	// Déterminer le type : invoice ou payment
	isPayment := (d.Source != nil && *d.Source == "payment") ||
		(d.OdooModel != nil && *d.OdooModel == "account.payment")

	if isPayment {
		return documentToPaymentEvent(d)
	}
	return documentToInvoiceEvent(d)
}

func documentToInvoiceEvent(d storage.DocRowForBackfill) (*models.EconomicEvent, error) {
	invoiceID := ""
	if d.InvoiceNumber != nil {
		invoiceID = *d.InvoiceNumber
	}
	if invoiceID == "" && d.SourceIDText != nil {
		invoiceID = *d.SourceIDText
	}
	if invoiceID == "" {
		invoiceID = d.ID.String()
	}

	partnerRef := ""
	if d.OdooID != nil {
		partnerRef = strconv.Itoa(*d.OdooID)
	}
	partnerName := ""
	moveType := "out_invoice"
	if d.MoveType != nil {
		moveType = *d.MoveType
	}

	// Extraire partner_name de payload_json si présent
	if len(d.PayloadJSON) > 0 {
		var payload map[string]interface{}
		if err := json.Unmarshal(d.PayloadJSON, &payload); err == nil {
			if v, ok := payload["partner_name"]; ok && v != nil {
				partnerName = fmt.Sprintf("%v", v)
			}
			if v, ok := payload["meta"]; ok {
				if meta, ok := v.(map[string]interface{}); ok {
					if v, ok := meta["partner_name"]; ok && v != nil {
						partnerName = fmt.Sprintf("%v", v)
					}
				}
			}
		}
	}

	amountTotal := 0.0
	amountUntaxed := 0.0
	amountTax := 0.0
	if d.TotalTTC != nil {
		amountTotal = *d.TotalTTC
	}
	if d.TotalHT != nil {
		amountUntaxed = *d.TotalHT
		amountTax = amountTotal - amountUntaxed
	}
	currency := "EUR"
	if d.Currency != nil {
		currency = *d.Currency
	}
	dateStr := ""
	if d.InvoiceDate != nil {
		dateStr = d.InvoiceDate.Format("2006-01-02")
	}
	if dateStr == "" {
		dateStr = d.CreatedAt.Format("2006-01-02")
	}

	eventType := "invoice_issued"
	if moveType == "out_refund" || moveType == "in_refund" {
		eventType = "invoice_refund"
	}

	canonical := map[string]interface{}{
		"event_type":     eventType,
		"invoice_id":     invoiceID,
		"partner_ref":    partnerRef,
		"partner_name":   partnerName,
		"amount_total":   amountTotal,
		"amount_untaxed": amountUntaxed,
		"amount_tax":     amountTax,
		"currency":       currency,
		"date":           dateStr,
		"invoice_date":   dateStr,
		"move_type":      moveType,
	}
	payloadJSON, err := CanonicalToJSON(canonical)
	if err != nil {
		return nil, err
	}
	_, hashHex, err := utils.CanonicalJSONAndHash(payloadJSON)
	if err != nil {
		return nil, err
	}

	return &models.EconomicEvent{
		EventID:      d.ID,
		EventType:    eventType,
		Timestamp:    d.CreatedAt,
		PayloadJSON:  payloadJSON,
		Hash:         hashHex,
		SchemaVersion: "dorevia.economic_event.v1",
	}, nil
}

func documentToPaymentEvent(d storage.DocRowForBackfill) (*models.EconomicEvent, error) {
	paymentID := ""
	if d.SourceIDText != nil {
		paymentID = *d.SourceIDText
	}
	if paymentID == "" && d.OdooID != nil {
		paymentID = fmt.Sprintf("PAY/%d", *d.OdooID)
	}
	if paymentID == "" {
		paymentID = d.ID.String()
	}

	partnerRef := ""
	partnerName := ""
	amount := 0.0
	currency := "EUR"
	dateStr := d.CreatedAt.Format("2006-01-02")
	paymentType := "inbound"
	method := "transfer"
	isRefund := false
	companyID := 0

	if len(d.PayloadJSON) > 0 {
		var payload map[string]interface{}
		if err := json.Unmarshal(d.PayloadJSON, &payload); err == nil {
			if v, ok := payload["payment"]; ok {
				if pm, ok := v.(map[string]interface{}); ok {
					if v, ok := pm["partner_id"]; ok && v != nil {
						partnerRef = fmt.Sprintf("%v", v)
					}
					if v, ok := pm["partner_name"]; ok && v != nil {
						partnerName = fmt.Sprintf("%v", v)
					}
					if v, ok := pm["amount"]; ok && v != nil {
						switch x := v.(type) {
						case float64:
							amount = x
						case int:
							amount = float64(x)
						}
					}
				}
			}
			if v, ok := payload["amount"]; ok && v != nil && amount == 0 {
				switch x := v.(type) {
				case float64:
					amount = x
				case int:
					amount = float64(x)
				}
			}
			if v, ok := payload["currency"]; ok && v != nil {
				currency = fmt.Sprintf("%v", v)
			}
			if v, ok := payload["payment_date"]; ok && v != nil {
				dateStr = fmt.Sprintf("%v", v)
				if len(dateStr) > 10 {
					dateStr = dateStr[:10]
				}
			}
		}
	}
	if amount == 0 && d.TotalTTC != nil {
		amount = *d.TotalTTC
	}
	if d.Currency != nil {
		currency = *d.Currency
	}

	eventType := "payment_received"
	if paymentType == "outbound" {
		eventType = "payment_sent"
	}

	canonical := map[string]interface{}{
		"event_type":   eventType,
		"payment_id":   paymentID,
		"partner_ref":  partnerRef,
		"partner_name": partnerName,
		"amount":       amount,
		"currency":     currency,
		"date":         dateStr,
		"payment_type": paymentType,
		"method":       method,
		"is_refund":    isRefund,
		"company_id":   companyID,
	}
	payloadJSON, err := CanonicalToJSON(canonical)
	if err != nil {
		return nil, err
	}
	_, hashHex, err := utils.CanonicalJSONAndHash(payloadJSON)
	if err != nil {
		return nil, err
	}

	return &models.EconomicEvent{
		EventID:       d.ID,
		EventType:     eventType,
		Timestamp:     d.CreatedAt,
		PayloadJSON:   payloadJSON,
		Hash:          hashHex,
		SchemaVersion: "dorevia.economic_event.v1",
	}, nil
}
