package replay

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strconv"
)

// CursorPayload contient les données du cursor (E2-US2)
type CursorPayload struct {
	Sequence int64  `json:"s"`
	Tenant   string `json:"t,omitempty"`
}

// BuildCursor génère un cursor signé : base64(json) + '.' + base64(HMAC-SHA256)
func BuildCursor(sequence int64, tenant, secret string) (string, error) {
	payload := CursorPayload{Sequence: sequence, Tenant: tenant}
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	b64Data := base64.RawURLEncoding.EncodeToString(data)

	if secret == "" {
		// Fallback : cursor non signé (pour dev)
		return b64Data, nil
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(data)
	sig := mac.Sum(nil)
	b64Sig := base64.RawURLEncoding.EncodeToString(sig)

	return b64Data + "." + b64Sig, nil
}

// ParseCursor vérifie le HMAC et décode le cursor. Retourne (sequence, nil) ou (0, error)
func ParseCursor(cursor, tenant, secret string) (int64, error) {
	if cursor == "" {
		return 0, nil
	}

	parts := splitCursor(cursor)
	if len(parts) == 1 {
		// Cursor non signé (legacy) : interpréter comme sequence directe
		if n, err := strconv.ParseInt(cursor, 10, 64); err == nil && n >= 0 {
			return n, nil
		}
		data, err := base64.RawURLEncoding.DecodeString(parts[0])
		if err != nil {
			return 0, fmt.Errorf("invalid cursor encoding")
		}
		var p CursorPayload
		if err := json.Unmarshal(data, &p); err != nil {
			return 0, fmt.Errorf("invalid cursor payload")
		}
		return p.Sequence, nil
	}

	if len(parts) != 2 || secret == "" {
		return 0, fmt.Errorf("invalid cursor format")
	}

	data, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return 0, fmt.Errorf("invalid cursor encoding")
	}

	expectedSig, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || len(expectedSig) != sha256.Size {
		return 0, fmt.Errorf("invalid cursor signature")
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(data)
	actualSig := mac.Sum(nil)
	if !hmac.Equal(actualSig, expectedSig) {
		return 0, fmt.Errorf("cursor signature mismatch")
	}

	var p CursorPayload
	if err := json.Unmarshal(data, &p); err != nil {
		return 0, fmt.Errorf("invalid cursor payload")
	}
	return p.Sequence, nil
}

func splitCursor(s string) []string {
	for i, c := range s {
		if c == '.' {
			return []string{s[:i], s[i+1:]}
		}
	}
	return []string{s}
}
