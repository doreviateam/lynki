package runner

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/doreviateam/diva/internal/models"
)

// GenerateResult holds the parsed response from POST /diva/generate.
type GenerateResult struct {
	State     string `json:"state"`
	ErrorCode string `json:"error_code,omitempty"`
}

// CallDivaGenerate appelle POST /diva/generate pour alimenter diva_insights.
func CallDivaGenerate(divaURL, tenant string, companyID int, dateStart, dateEnd string, cards []models.Card, details map[string]interface{}, cardsSpec *CardsSpec) (*GenerateResult, error) {
	dashboard := map[string]interface{}{
		"cards": cards,
	}
	if len(details) > 0 {
		dashboard["_details"] = details
	}
	body := map[string]interface{}{
		"context": map[string]interface{}{
			"tenant":     tenant,
			"company_id": companyID,
			"date_start": dateStart,
			"date_end":   dateEnd,
			"timezone":   "Europe/Paris",
			"currency":   "EUR",
			"locale":     "fr-FR",
		},
		"context_scope": "cockpit",
		"dashboard":     dashboard,
		"options": map[string]interface{}{
			"mode":                  "flash",
			"output_mode":           "short",
			"force_refresh":         false,
			"generated_from_runner": true,
		},
	}

	if cardsSpec != nil {
		body["cards_spec"] = cardsSpec
	}

	data, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 120 * time.Second}
	req, err := http.NewRequest("POST", divaURL+"/diva/generate", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		return &GenerateResult{State: "fresh"}, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("diva generate: %s", resp.Status)
	}

	var result GenerateResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return &GenerateResult{State: "ready"}, nil
	}
	if result.State == "" {
		result.State = "ready"
	}
	return &result, nil
}
