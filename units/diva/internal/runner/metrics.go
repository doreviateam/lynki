package runner

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/doreviateam/diva/internal/models"
)

// kpiMetricResponse — format d'une carte KPI retournée par Linky
type kpiMetricResponse struct {
	Value        *float64 `json:"value"`
	Status       string   `json:"status,omitempty"`
	StatusReason string   `json:"status_reason,omitempty"`
}

// dashboardMetricsResponse — format retourné par Linky /api/dashboard-metrics
type dashboardMetricsResponse struct {
	Treasury    kpiMetricResponse      `json:"treasury"`
	Cash        kpiMetricResponse      `json:"cash"`
	Business    kpiMetricResponse      `json:"business"`
	Taxes       kpiMetricResponse      `json:"taxes"`
	CreditNotes kpiMetricResponse      `json:"credit_notes"`
	Refunds     kpiMetricResponse      `json:"refunds"`
	PosShops    kpiMetricResponse      `json:"pos_shops"`
	PosZ        kpiMetricResponse      `json:"pos_z"`
	Details     map[string]interface{} `json:"_details,omitempty"`
}

var cardMapping = []struct {
	specKey string
	label   string
	unit    string
	getKpi  func(*dashboardMetricsResponse) *kpiMetricResponse
}{
	{"treasury_validated_pct", "Trésorerie validée", "%", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.Treasury }},
	{"cash", "Cash", "EUR", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.Cash }},
	{"business", "Business", "EUR", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.Business }},
	{"taxes", "Taxes", "EUR", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.Taxes }},
	{"credit_notes", "Notes de crédit", "EUR", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.CreditNotes }},
	{"refunds", "Remboursements", "EUR", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.Refunds }},
	{"pos_shops", "POS magasins", "EUR", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.PosShops }},
	{"pos_z", "Z de caisse", "EUR", func(d *dashboardMetricsResponse) *kpiMetricResponse { return &d.PosZ }},
}

// MetricsResult contient cards et _details pour le runner.
type MetricsResult struct {
	Cards   []models.Card
	Details map[string]interface{}
}

func FetchMetricsFromLinky(linkyURL, tenant, dateStart, dateEnd string, companyID int) ([]models.Card, error) {
	res, err := FetchMetricsFromLinkyFull(linkyURL, tenant, dateStart, dateEnd, companyID)
	if err != nil {
		return nil, err
	}
	return res.Cards, nil
}

func FetchMetricsFromLinkyFull(linkyURL, tenant, dateStart, dateEnd string, companyID int) (*MetricsResult, error) {
	u, err := url.Parse(linkyURL)
	if err != nil {
		return nil, err
	}
	u.Path = "/api/dashboard-metrics"
	q := u.Query()
	q.Set("tenant", tenant)
	q.Set("date_debut", dateStart)
	q.Set("date_fin", dateEnd)
	if companyID > 0 {
		q.Set("company_id", fmt.Sprintf("odoo:%d", companyID))
	}
	u.RawQuery = q.Encode()

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(u.String())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("dashboard-metrics: %s", resp.Status)
	}

	var dm dashboardMetricsResponse
	if err := json.NewDecoder(resp.Body).Decode(&dm); err != nil {
		return nil, err
	}

	cards := make([]models.Card, 0, len(cardMapping))
	for _, m := range cardMapping {
		kpi := m.getKpi(&dm)
		cards = append(cards, models.Card{
			Key:          m.specKey,
			Label:        m.label,
			Value:        kpi.Value,
			Unit:         m.unit,
			Status:       kpi.Status,
			StatusReason: kpi.StatusReason,
		})
	}
	details := dm.Details
	if details == nil {
		details = make(map[string]interface{})
	}
	return &MetricsResult{Cards: cards, Details: details}, nil
}
