package archive

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

type archivePayload struct {
	Tenant          string          `json:"tenant"`
	FactsHash       string          `json:"facts_hash"`
	PackJSON        json.RawMessage `json:"pack_json"`
	Source          string          `json:"source"`
	TemplateVersion string          `json:"template_version"`
}

func archiveFactsPack(vaultURL, tenant, factsHash, source, templateVersion string, packJSON []byte) error {
	payload := archivePayload{
		Tenant:          tenant,
		FactsHash:       factsHash,
		PackJSON:        json.RawMessage(packJSON),
		Source:          source,
		TemplateVersion: templateVersion,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	client := &http.Client{Timeout: 5 * time.Second}
	url := vaultURL + "/api/accounting/facts-pack/archive"

	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("POST %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("POST %s: status %d", url, resp.StatusCode)
	}
	return nil
}

// ArchiveFactsPackAsync lance l'archivage dans une goroutine (fire-and-forget).
func ArchiveFactsPackAsync(vaultURL, tenant, factsHash, source, templateVersion string, packJSON []byte) {
	if vaultURL == "" {
		slog.Warn("event=facts_pack_archive_skipped", "reason", "vault_url_missing")
		return
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("event=facts_pack_archive_panic", "tenant", tenant, "facts_hash", factsHash, "panic", r)
			}
		}()

		start := time.Now()
		err := archiveFactsPack(vaultURL, tenant, factsHash, source, templateVersion, packJSON)
		durationMs := time.Since(start).Milliseconds()

		if err != nil {
			slog.Warn("event=facts_pack_archive_failed",
				"tenant", tenant,
				"facts_hash", factsHash,
				"source", source,
				"error", err.Error(),
				"duration_ms", durationMs,
			)
			return
		}

		slog.Info("event=facts_pack_archive_sent",
			"tenant", tenant,
			"facts_hash", factsHash,
			"source", source,
			"template_version", templateVersion,
			"duration_ms", durationMs,
		)
	}()
}
