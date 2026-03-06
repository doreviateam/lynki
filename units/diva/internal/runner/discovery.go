package runner

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"time"
)

var discoveryClient = &http.Client{Timeout: 10 * time.Second}

type CockpitCard struct {
	Key      string `json:"key"`
	Label    string `json:"label"`
	Unit     string `json:"unit"`
	Required bool   `json:"required"`
}

type CardsResponse struct {
	Schema       string        `json:"schema"`
	CardsVersion string        `json:"cards_version"`
	Cards        []CockpitCard `json:"cards"`
}

type CompaniesResponse struct {
	Schema    string `json:"schema"`
	Companies []int  `json:"companies"`
}

// CardsSpec is the canonical representation for payload_hash.
type CardsSpec struct {
	Version  string   `json:"version"`
	Keys     []string `json:"keys"`
	Required []string `json:"required"`
}

// FetchCockpitCards calls GET /api/cockpit/cards on Linky.
func FetchCockpitCards(linkyURL, tenant string) (*CardsResponse, *CardsSpec, error) {
	u, err := url.Parse(linkyURL)
	if err != nil {
		return nil, nil, err
	}
	u.Path = "/api/cockpit/cards"
	q := u.Query()
	q.Set("tenant", tenant)
	u.RawQuery = q.Encode()

	resp, err := discoveryClient.Get(u.String())
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, nil, fmt.Errorf("cockpit/cards: %s", resp.Status)
	}

	var cr CardsResponse
	if err := json.NewDecoder(resp.Body).Decode(&cr); err != nil {
		return nil, nil, err
	}

	keys := make([]string, 0, len(cr.Cards))
	required := make([]string, 0)
	for _, c := range cr.Cards {
		keys = append(keys, c.Key)
		if c.Required {
			required = append(required, c.Key)
		}
	}
	sort.Strings(keys)
	sort.Strings(required)

	spec := &CardsSpec{
		Version:  cr.CardsVersion,
		Keys:     keys,
		Required: required,
	}
	return &cr, spec, nil
}

// FetchCockpitCompanies calls GET /api/cockpit/companies on Linky.
func FetchCockpitCompanies(linkyURL, tenant string) ([]int, error) {
	u, err := url.Parse(linkyURL)
	if err != nil {
		return nil, err
	}
	u.Path = "/api/cockpit/companies"
	q := u.Query()
	q.Set("tenant", tenant)
	u.RawQuery = q.Encode()

	resp, err := discoveryClient.Get(u.String())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cockpit/companies: %s", resp.Status)
	}

	var cr CompaniesResponse
	if err := json.NewDecoder(resp.Body).Decode(&cr); err != nil {
		return nil, err
	}
	return cr.Companies, nil
}
