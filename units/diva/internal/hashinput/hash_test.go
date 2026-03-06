package hashinput

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/doreviateam/diva/internal/models"
)

func TestComputePayloadHash_Idempotence(t *testing.T) {
	req := makeCockpitRequest()
	h1, err := ComputePayloadHash(req)
	if err != nil {
		t.Fatalf("ComputePayloadHash: %v", err)
	}
	h2, err := ComputePayloadHash(req)
	if err != nil {
		t.Fatalf("ComputePayloadHash: %v", err)
	}
	if h1 != h2 {
		t.Errorf("hash non idempotent: %s vs %s", h1, h2)
	}
}

func TestComputePayloadHash_DifferentData_DifferentHash(t *testing.T) {
	req1 := makeCockpitRequest()
	req2 := makeCockpitRequest()
	req2.Dashboard.Cards[1].Value = ptrFloat(35000)

	h1, _ := ComputePayloadHash(req1)
	h2, _ := ComputePayloadHash(req2)
	if h1 == h2 {
		t.Errorf("hash identique alors que données différentes: %s", h1)
	}
}

func TestComputePayloadHash_FormattedIgnored(t *testing.T) {
	req1 := makeCockpitRequest()
	req2 := makeCockpitRequest()
	req2.Dashboard.Cards[0].Formatted = "autre format"
	req2.Dashboard.Cards[0].Label = "autre label"

	h1, _ := ComputePayloadHash(req1)
	h2, _ := ComputePayloadHash(req2)
	if h1 != h2 {
		t.Errorf("formatted/label ne doivent pas influencer le hash: %s vs %s", h1, h2)
	}
}

func TestCanonicalJSONForHash_KeepsNull(t *testing.T) {
	m := map[string]interface{}{
		"a": 1,
		"b": (*int64)(nil),
	}
	canonical, err := CanonicalJSONForHash(m)
	if err != nil {
		t.Fatalf("CanonicalJSONForHash: %v", err)
	}
	var decoded map[string]interface{}
	if err := json.Unmarshal(canonical, &decoded); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if _, hasB := decoded["b"]; !hasB {
		t.Errorf("expected key b to be present (with null value)")
	}
	if !strings.Contains(string(canonical), "null") {
		t.Errorf("canonical should contain null for nil value, got %s", canonical)
	}
}

func TestCanonicalJSONForHash_SortedKeys(t *testing.T) {
	m := map[string]interface{}{
		"z": 1,
		"a": 2,
		"m": 3,
	}
	canonical, err := CanonicalJSONForHash(m)
	if err != nil {
		t.Fatalf("CanonicalJSONForHash: %v", err)
	}
	// Ordre attendu : a, m, z
	expected := `{"a":2,"m":3,"z":1}`
	if string(canonical) != expected {
		t.Errorf("got %s, want %s", canonical, expected)
	}
}

func TestBuildHashInput_Cockpit(t *testing.T) {
	req := makeCockpitRequest()
	hi, err := BuildHashInput(req)
	if err != nil {
		t.Fatalf("BuildHashInput: %v", err)
	}
	if hi["context_scope"] != "cockpit" {
		t.Errorf("context_scope = %v, want cockpit", hi["context_scope"])
	}
	cards, ok := hi["cards"].(map[string]interface{})
	if !ok {
		t.Fatalf("cards not a map: %T", hi["cards"])
	}
	for _, key := range cardKeys {
		if _, ok := cards[key]; !ok {
			t.Errorf("cards missing key %s", key)
		}
	}
	cash, _ := cards["cash"].(map[string]interface{})
	if cash != nil {
		vm, _ := cash["value_minor"].(*int64)
		if vm != nil && *vm != 3400000 {
			t.Errorf("cash value_minor = %v, want 3400000", *vm)
		}
	}
}

func TestComputeContextKey_Format(t *testing.T) {
	key := ComputeContextKey("sarl-la-platine", 1, "2026-01-01", "2026-02-18", "")
	expected := "cockpit:sarl-la-platine:1:2026-01-01:2026-02-18"
	if key != expected {
		t.Errorf("context_key = %q, want %q", key, expected)
	}
}

func TestComputeContextKey_CompanyZero(t *testing.T) {
	key := ComputeContextKey("sarl-la-platine", 0, "2026-01-01", "2026-02-18", "")
	expected := "cockpit:sarl-la-platine:0:2026-01-01:2026-02-18"
	if key != expected {
		t.Errorf("context_key = %q, want %q", key, expected)
	}
}

func TestComputeContextKey_WithPartner(t *testing.T) {
	key := ComputeContextKey("sarl-la-platine", 0, "2026-01-01", "2026-02-18", "Client Dupont")
	expected := "cockpit:sarl-la-platine:0:2026-01-01:2026-02-18:Client Dupont"
	if key != expected {
		t.Errorf("context_key = %q, want %q", key, expected)
	}
}

func TestBuildHashInput_POSIncluded(t *testing.T) {
	req := makeCockpitRequestWithPOS()
	hi, err := BuildHashInput(req)
	if err != nil {
		t.Fatalf("BuildHashInput: %v", err)
	}
	posAgg, ok := hi["pos_aggregates"].(map[string]interface{})
	if !ok {
		t.Fatal("pos_aggregates absent du hash input")
	}
	if posAgg["total_sessions"] != 7 {
		t.Errorf("total_sessions = %v, want 7", posAgg["total_sessions"])
	}
	shops, ok := posAgg["shops"].([]map[string]interface{})
	if !ok || len(shops) != 2 {
		t.Fatalf("shops count = %v, want 2", len(shops))
	}
	if shops[0]["shop_id"] != "Comptoir La Platine" {
		t.Errorf("shops[0] = %v, want Comptoir La Platine (trié)", shops[0]["shop_id"])
	}
}

func TestBuildHashInput_NoPOS_NoAggregates(t *testing.T) {
	req := makeCockpitRequest()
	hi, err := BuildHashInput(req)
	if err != nil {
		t.Fatalf("BuildHashInput: %v", err)
	}
	if _, ok := hi["pos_aggregates"]; ok {
		t.Error("pos_aggregates ne devrait pas être présent sans _details")
	}
}

func TestHashV2_StableWithSameData(t *testing.T) {
	req1 := makeCockpitRequestWithPOS()
	req2 := makeCockpitRequestWithPOS()
	h1, _ := ComputePayloadHash(req1)
	h2, _ := ComputePayloadHash(req2)
	if h1 != h2 {
		t.Errorf("hash instable pour mêmes données: %s vs %s", h1, h2)
	}
}

func TestHashV2_POSChangeChangesHash(t *testing.T) {
	req1 := makeCockpitRequestWithPOS()
	req2 := makeCockpitRequestWithPOS()
	pos := req2.Dashboard.Details["pos_shops"].(map[string]interface{})
	pos["total_sessions"] = float64(8)

	h1, _ := ComputePayloadHash(req1)
	h2, _ := ComputePayloadHash(req2)
	if h1 == h2 {
		t.Error("hash identique malgré changement POS sessions")
	}
}

func TestHashV2_ShopOrderStable(t *testing.T) {
	req1 := makeCockpitRequestWithPOS()
	req2 := makeCockpitRequestWithPOS()
	pos2 := req2.Dashboard.Details["pos_shops"].(map[string]interface{})
	pos2["shops"] = []interface{}{
		map[string]interface{}{"shop_id": "Sweet Manihot", "sessions_count": float64(4), "total_sales": float64(1544.40)},
		map[string]interface{}{"shop_id": "Comptoir La Platine", "sessions_count": float64(3), "total_sales": float64(2668.80)},
	}

	h1, _ := ComputePayloadHash(req1)
	h2, _ := ComputePayloadHash(req2)
	if h1 != h2 {
		t.Errorf("hash devrait être identique quel que soit l'ordre des shops: %s vs %s", h1, h2)
	}
}

func TestHashV3_StatusChangeChangesHash(t *testing.T) {
	req1 := makeCockpitRequest()
	req1.Dashboard.Cards[0].Status = "watch"

	req2 := makeCockpitRequest()
	req2.Dashboard.Cards[0].Status = "ok"

	h1, _ := ComputePayloadHash(req1)
	h2, _ := ComputePayloadHash(req2)
	if h1 == h2 {
		t.Error("hash identique malgré changement de statut treasury watch→ok")
	}
}

func TestHashV3_StatusIncludedInCards(t *testing.T) {
	req := makeCockpitRequest()
	req.Dashboard.Cards[0].Status = "watch"

	hi, err := BuildHashInput(req)
	if err != nil {
		t.Fatalf("BuildHashInput: %v", err)
	}
	cards := hi["cards"].(map[string]interface{})
	treasury := cards["treasury_validated_pct"].(map[string]interface{})
	if treasury["status"] != "watch" {
		t.Errorf("treasury status = %v, want watch", treasury["status"])
	}

	if hi["schema"] != "dorevia.diva.hash_input.v3" {
		t.Errorf("schema = %v, want dorevia.diva.hash_input.v3", hi["schema"])
	}
}

func makeCockpitRequest() *models.ExplainRequest {
	return &models.ExplainRequest{
		Context: models.Context{
			Tenant:    "sarl-la-platine",
			CompanyID: 0,
			DateStart: "2026-01-01",
			DateEnd:   "2026-02-16",
			Currency:  "EUR",
		},
		Dashboard: models.Dashboard{
			Cards: []models.Card{
				{Key: "treasury_validated_pct", Value: ptrFloat(0), Formatted: "0 %"},
				{Key: "cash", Value: ptrFloat(34000), Formatted: "+ 34 000 €"},
				{Key: "business", Value: ptrFloat(43000)},
				{Key: "taxes", Value: ptrFloat(8500)},
				{Key: "credit_notes", Value: ptrFloat(-400)},
				{Key: "refunds", Value: ptrFloat(1686.84)},
				{Key: "pos_shops", Value: ptrFloat(12500)},
				{Key: "pos_z", Value: nil},
			},
		},
		Options: models.Options{Mode: "flash"},
	}
}

func makeCockpitRequestWithPOS() *models.ExplainRequest {
	req := makeCockpitRequest()
	req.Dashboard.Details = map[string]interface{}{
		"pos_shops": map[string]interface{}{
			"total_sessions":   float64(7),
			"sealed_sessions":  float64(7),
			"pending_sessions": float64(0),
			"total_tickets":    float64(8),
			"cash_total":       float64(0),
			"card_total":       float64(4213.20),
			"total_difference": float64(0),
			"anomaly_sessions": float64(0),
			"shops": []interface{}{
				map[string]interface{}{"shop_id": "Comptoir La Platine", "sessions_count": float64(3), "total_sales": float64(2668.80)},
				map[string]interface{}{"shop_id": "Sweet Manihot", "sessions_count": float64(4), "total_sales": float64(1544.40)},
			},
		},
	}
	return req
}
