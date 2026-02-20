package hashinput

import (
	"sort"

	"github.com/doreviateam/diva/internal/models"
)

// Clés des 8 cartes cockpit (règle zéro absent).
var cardKeys = []string{
	"business", "cash", "credit_notes", "pos_shops", "pos_z", "refunds", "taxes", "treasury_validated_pct",
}

// CARD_VALUE_SCALE : treasury_validated_pct → basis_points, reste → minor.
const defaultMinorUnit = 2 // EUR

// BuildHashInput construit l'objet hash_input à partir du payload for AI (ExplainRequest).
// Inclut cards + agrégats POS (v1.4 hash v2).
func BuildHashInput(req *models.ExplainRequest) (map[string]interface{}, error) {
	ctx := map[string]interface{}{
		"tenant":        req.Context.Tenant,
		"company_id":    req.Context.CompanyID,
		"context_scope": "cockpit",
		"date_start":    req.Context.DateStart,
		"date_end":      req.Context.DateEnd,
		"currency":      firstNonEmpty(req.Context.Currency, "EUR"),
	}

	cardMap := make(map[string]interface{})
	cardsByKey := make(map[string]*models.Card)
	for i := range req.Dashboard.Cards {
		cardsByKey[req.Dashboard.Cards[i].Key] = &req.Dashboard.Cards[i]
	}

	for _, key := range cardKeys {
		card := cardsByKey[key]
		var cardVal map[string]interface{}
		if key == "treasury_validated_pct" {
			bp := toBasisPoints(nil)
			if card != nil && card.Value != nil {
				bp = toBasisPoints(card.Value)
			}
			cardVal = map[string]interface{}{"value_basis_points": bp}
		} else {
			minor := toMinor(nil, defaultMinorUnit)
			if card != nil {
				minor = toMinor(card.Value, defaultMinorUnit)
			}
			cardVal = map[string]interface{}{"value_minor": minor}
		}
		cardMap[key] = cardVal
	}

	out := map[string]interface{}{
		"schema":        "dorevia.diva.hash_input.v2",
		"context":       ctx,
		"context_scope": "cockpit",
		"cards":         cardMap,
	}

	if req.CardsSpec != nil {
		out["cards_spec"] = req.CardsSpec
	}

	if posAgg := extractPOSAggregatesForHash(req.Dashboard.Details); posAgg != nil {
		out["pos_aggregates"] = posAgg
	}

	return out, nil
}

// extractPOSAggregatesForHash extrait les agrégats POS normalisés pour le hash.
// Exclut timestamps, IDs de session, données variables. Trie shops par shop_id.
func extractPOSAggregatesForHash(details map[string]interface{}) map[string]interface{} {
	if details == nil {
		return nil
	}
	raw, ok := details["pos_shops"]
	if !ok || raw == nil {
		return nil
	}
	m, ok := raw.(map[string]interface{})
	if !ok {
		return nil
	}

	agg := map[string]interface{}{
		"total_sessions":   toHashInt(m["total_sessions"]),
		"sealed_sessions":  toHashInt(m["sealed_sessions"]),
		"pending_sessions": toHashInt(m["pending_sessions"]),
		"total_tickets":    toHashInt(m["total_tickets"]),
		"anomaly_sessions": toHashInt(m["anomaly_sessions"]),
		"cash_total":       toMinorFromRaw(m["cash_total"]),
		"card_total":       toMinorFromRaw(m["card_total"]),
		"total_difference": toMinorFromRaw(m["total_difference"]),
	}

	if shopsRaw, ok := m["shops"]; ok {
		if shops, ok := shopsRaw.([]interface{}); ok && len(shops) > 0 {
			agg["shops"] = normalizePOSShopsForHash(shops)
		}
	}

	return agg
}

// normalizePOSShopsForHash normalise et trie les shops par shop_id pour hash stable.
func normalizePOSShopsForHash(shops []interface{}) []map[string]interface{} {
	type shopEntry struct {
		id    string
		entry map[string]interface{}
	}
	var entries []shopEntry
	for _, s := range shops {
		sm, ok := s.(map[string]interface{})
		if !ok {
			continue
		}
		id := ""
		if v, ok := sm["shop_id"].(string); ok {
			id = v
		}
		entries = append(entries, shopEntry{
			id: id,
			entry: map[string]interface{}{
				"shop_id":        id,
				"sessions_count": toHashInt(sm["sessions_count"]),
				"total_sales":    toMinorFromRaw(sm["total_sales"]),
			},
		})
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].id < entries[j].id
	})
	out := make([]map[string]interface{}, len(entries))
	for i, e := range entries {
		out[i] = e.entry
	}
	return out
}

func toHashInt(v interface{}) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	}
	return 0
}

func toMinorFromRaw(v interface{}) *int64 {
	switch n := v.(type) {
	case float64:
		return toMinor(&n, defaultMinorUnit)
	case int:
		f := float64(n)
		return toMinor(&f, defaultMinorUnit)
	}
	return toMinor(nil, defaultMinorUnit)
}

func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

