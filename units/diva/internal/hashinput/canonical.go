package hashinput

import (
	"encoding/json"
	"sort"
)

// CanonicalJSONForHash sérialise v en JSON canonical (clés triées, null conservés).
// À utiliser pour hash_input (payload_hash). Contrairement à une canonicalisation
// qui supprime les nulls, celle-ci les conserve pour respecter la règle « zéro absent ».
func CanonicalJSONForHash(v interface{}) ([]byte, error) {
	normalized := normalizeValueKeepNulls(v)
	return json.Marshal(normalized)
}

// normalizeValueKeepNulls normalise récursivement en triant les clés, sans supprimer null.
func normalizeValueKeepNulls(v interface{}) interface{} {
	switch val := v.(type) {
	case map[string]interface{}:
		keys := make([]string, 0, len(val))
		for k := range val {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		sorted := make(map[string]interface{})
		for _, k := range keys {
			sorted[k] = normalizeValueKeepNulls(val[k])
		}
		return sorted

	case []interface{}:
		out := make([]interface{}, len(val))
		for i, item := range val {
			out[i] = normalizeValueKeepNulls(item)
		}
		return out

	case float64:
		if val == float64(int64(val)) {
			return int64(val)
		}
		return val

	default:
		return v
	}
}
