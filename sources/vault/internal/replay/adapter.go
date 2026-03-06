package replay

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/models"
)

// AdapterConfig configuration pour appeler l'adapter Odoo (E5-US3)
// P0 : Timeout configuré, pas de blocage infini. Credentials prod via secret manager.
type AdapterConfig struct {
	BaseURL   string        // ex: https://odoo.example.com (sans trailing slash)
	Database  string        // nom de la base Odoo (multi-DB) — vide = défaut
	User      string        // prod : depuis secret manager, pas admin/admin
	Password  string
	Timeout   time.Duration // défaut 30s
	RetryMax  int           // nb retries sur erreur réseau/5xx (0 = désactivé)
}

// ApplyResult résultat d'un appel à un endpoint adapter
// P0 : Applied seulement si HTTP 200/201 + JSON attendu + status applied/created/updated
type ApplyResult struct {
	Applied     bool            // true si créé/mis à jour (validation stricte)
	Skipped     bool            // true si déjà appliqué (idempotence)
	Failed      bool            // true si erreur
	ResID       int64           // ID res Odoo (move_id, payment_id, partner_id)
	Message     string          // message d'erreur ou warning
	Allocations []AllocationItem // E6-US4bis : allocations FIFO paiement → factures
}

// AllocationItem représente une allocation paiement → facture (E6-US4bis)
type AllocationItem struct {
	InvoiceID     int     `json:"invoice_id"`
	AmountApplied float64 `json:"amount_applied"`
}

// OdooAdapter appelle les endpoints /dorevia/replay/* de l'adapter Odoo
type OdooAdapter struct {
	cfg    AdapterConfig
	client *http.Client
}

// NewOdooAdapter crée un client adapter
func NewOdooAdapter(cfg AdapterConfig) *OdooAdapter {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}
	return &OdooAdapter{
		cfg: cfg,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

func (a *OdooAdapter) baseURL() string {
	return strings.TrimSuffix(a.cfg.BaseURL, "/")
}

func (a *OdooAdapter) do(method, path string, body []byte) (*http.Response, error) {
	url := a.baseURL() + path
	if a.cfg.Database != "" {
		sep := "?"
		if strings.Contains(path, "?") {
			sep = "&"
		}
		url += sep + "db=" + a.cfg.Database
	}
	req, err := http.NewRequest(method, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if a.cfg.User != "" || a.cfg.Password != "" {
		auth := base64.StdEncoding.EncodeToString([]byte(a.cfg.User + ":" + a.cfg.Password))
		req.Header.Set("Authorization", "Basic "+auth)
	}
	return a.client.Do(req)
}

// doWithRetry exécute la requête avec retry sur erreur réseau ou 5xx (P0)
func (a *OdooAdapter) doWithRetry(method, path string, body []byte) (*http.Response, error) {
	var lastErr error
	for attempt := 0; attempt <= a.cfg.RetryMax; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(attempt) * 2 * time.Second
			time.Sleep(backoff)
		}
		resp, err := a.do(method, path, body)
		if err != nil {
			lastErr = err
			continue
		}
		// Retry sur 5xx uniquement
		if resp.StatusCode >= 500 && attempt < a.cfg.RetryMax {
			resp.Body.Close()
			lastErr = fmt.Errorf("HTTP %d", resp.StatusCode)
			continue
		}
		return resp, nil
	}
	return nil, lastErr
}

// PartnerUpsert appelle POST /dorevia/replay/partner/upsert (E6-US2)
// Idempotent par partner_ref côté Odoo.
func (a *OdooAdapter) PartnerUpsert(tenant, name, partnerRef string, extra map[string]interface{}) (*ApplyResult, error) {
	payload := map[string]interface{}{
		"tenant":       tenant,
		"name":         name,
		"partner_ref":  partnerRef,
	}
	for k, v := range extra {
		payload[k] = v
	}
	body, _ := json.Marshal(payload)
	resp, err := a.doWithRetry("POST", "/dorevia/replay/partner/upsert", body)
	if err != nil {
		return &ApplyResult{Failed: true, Message: err.Error()}, nil
	}
	defer resp.Body.Close()

	var data struct {
		PartnerID int    `json:"partner_id"`
		Status    string `json:"status"`
		Error     string `json:"error"`
		Details   string `json:"details"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&data)

	if resp.StatusCode >= 400 {
		msg := data.Details
		if msg == "" {
			msg = data.Error
		}
		return &ApplyResult{Failed: true, Message: msg, ResID: int64(data.PartnerID)}, nil
	}
	// P0 : validation stricte — applied seulement si HTTP 2xx + status ok + res_id cohérent
	if !isAppliedStatus(data.Status) || data.PartnerID <= 0 {
		return &ApplyResult{Failed: true, Message: "réponse Odoo invalide (status ou partner_id)", ResID: int64(data.PartnerID)}, nil
	}
	return &ApplyResult{Applied: true, ResID: int64(data.PartnerID)}, nil
}

// InvoiceCreateSynth appelle POST /dorevia/replay/invoice/create_synth (E6-US3)
func (a *OdooAdapter) InvoiceCreateSynth(tenant string, evt *models.EconomicEvent) (*ApplyResult, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal(evt.PayloadJSON, &payload); err != nil {
		return &ApplyResult{Failed: true, Message: "invalid payload"}, nil
	}
	payload["event_id"] = evt.EventID.String()
	payload["tenant"] = tenant
	body, _ := json.Marshal(payload)

	resp, err := a.doWithRetry("POST", "/dorevia/replay/invoice/create_synth", body)
	if err != nil {
		return &ApplyResult{Failed: true, Message: err.Error()}, nil
	}
	defer resp.Body.Close()

	var data struct {
		MoveID  int    `json:"move_id"`
		Status  string `json:"status"`
		Error   string `json:"error"`
		Details string `json:"details"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&data)

	if resp.StatusCode >= 400 {
		msg := data.Details
		if msg == "" {
			msg = data.Error
		}
		return &ApplyResult{Failed: true, Message: msg, ResID: int64(data.MoveID)}, nil
	}
	if data.Status == "skipped" {
		return &ApplyResult{Skipped: true, ResID: int64(data.MoveID)}, nil
	}
	// P0 : validation stricte — applied seulement si HTTP 2xx + status applied + move_id > 0
	if !isAppliedStatus(data.Status) || data.MoveID <= 0 {
		return &ApplyResult{Failed: true, Message: "réponse Odoo invalide (status ou move_id)"}, nil
	}
	return &ApplyResult{Applied: true, ResID: int64(data.MoveID)}, nil
}

// PaymentCreate appelle POST /dorevia/replay/payment/create (E6-US4)
func (a *OdooAdapter) PaymentCreate(tenant string, evt *models.EconomicEvent) (*ApplyResult, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal(evt.PayloadJSON, &payload); err != nil {
		return &ApplyResult{Failed: true, Message: "invalid payload"}, nil
	}
	payload["event_id"] = evt.EventID.String()
	payload["tenant"] = tenant
	body, _ := json.Marshal(payload)

	resp, err := a.doWithRetry("POST", "/dorevia/replay/payment/create", body)
	if err != nil {
		return &ApplyResult{Failed: true, Message: err.Error()}, nil
	}
	defer resp.Body.Close()

	var data struct {
		PaymentID   int              `json:"payment_id"`
		Status      string           `json:"status"`
		Error       string           `json:"error"`
		Details     string           `json:"details"`
		Allocations []AllocationItem `json:"allocations"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&data)

	if resp.StatusCode >= 400 {
		msg := data.Details
		if msg == "" {
			msg = data.Error
		}
		return &ApplyResult{Failed: true, Message: msg, ResID: int64(data.PaymentID)}, nil
	}
	if data.Status == "skipped" {
		return &ApplyResult{Skipped: true, ResID: int64(data.PaymentID), Allocations: data.Allocations}, nil
	}
	// P0 : validation stricte
	if !isAppliedStatus(data.Status) || data.PaymentID <= 0 {
		return &ApplyResult{Failed: true, Message: "réponse Odoo invalide (status ou payment_id)"}, nil
	}
	return &ApplyResult{Applied: true, ResID: int64(data.PaymentID), Allocations: data.Allocations}, nil
}

// isAppliedStatus indique si le status Odoo signifie "appliqué" (P0 validation stricte)
func isAppliedStatus(s string) bool {
	switch s {
	case "applied", "created", "updated":
		return true
	}
	return false
}

// extractPartnerName extrait partner_name du payload canonique
func extractPartnerName(payloadJSON []byte) string {
	if len(payloadJSON) == 0 {
		return ""
	}
	var m map[string]interface{}
	if json.Unmarshal(payloadJSON, &m) != nil {
		return ""
	}
	if v, ok := m["partner_name"]; ok && v != nil {
		return fmt.Sprintf("%v", v)
	}
	return ""
}
