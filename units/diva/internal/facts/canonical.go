package facts

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
)

// canonicalFactsPack — type dédié pour sérialisation canonique (Règle 2).
// Pas de maps, pas de float, pas de champs optionnels ambigus.
// L'ordre des Facts = celui de BuildFactsPack (ne jamais retrier).
type canonicalFactsPack struct {
	Version     string   `json:"version"`
	Facts       []string `json:"facts"`
	Completeness string  `json:"completeness"`
}

// CanonicalJSON produit les bytes canoniques du FactsPack pour hash déterministe.
// Ne retrie jamais : l'ordre des facts est celui de BuildFactsPack.
// UTF-8 strict, pas de pretty print.
func CanonicalJSON(fp *FactsPack) []byte {
	if fp == nil {
		return []byte("null")
	}
	cf := canonicalFactsPack{
		Version:     fp.Version,
		Facts:       fp.Messages(),
		Completeness: "absent",
	}
	if fp.DataCompleteness != nil && fp.DataCompleteness.BankHealthMetrics != "" {
		cf.Completeness = fp.DataCompleteness.BankHealthMetrics
	}
	out, _ := json.Marshal(cf)
	return out
}

// PayloadHash retourne SHA256(canonicalBytes) en hex pour idempotence cache.
func PayloadHash(fp *FactsPack) string {
	canonical := CanonicalJSON(fp)
	h := sha256.Sum256(canonical)
	return hex.EncodeToString(h[:])
}
