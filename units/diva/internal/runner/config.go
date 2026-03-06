package runner

import (
	"os"
	"strconv"
	"strings"
)

// TenantCompany pairs (tenant, company_id) pour le runner.
type TenantCompany struct {
	Tenant    string
	CompanyID int
}

type Config struct {
	Enabled       bool
	Mode          string // loop | once
	IntervalSec   int
	Concurrency   int
	TenantConfig  []TenantCompany // ex: core:0;sarl-la-platine:1,2
	LinkyURL      string
	DivaURL       string
	Periods       []string // current_month, ytd
}

func LoadConfig() *Config {
	enabled := os.Getenv("RUNNER_ENABLED") != "false"
	mode := os.Getenv("RUNNER_MODE")
	if mode == "" {
		mode = "loop"
	}
	intervalSec := 120
	if s := os.Getenv("RUNNER_INTERVAL_SECONDS"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			intervalSec = n
		}
	}
	concurrency := 1
	if s := os.Getenv("RUNNER_CONCURRENCY"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n >= 1 && n <= 2 {
			concurrency = n
		}
	}
	var tenantConfig []TenantCompany
	if s := os.Getenv("RUNNER_TENANT_CONFIG"); s != "" {
		tenantConfig = parseTenantConfig(s)
	}
	if len(tenantConfig) == 0 {
		tenants := strings.Split(os.Getenv("RUNNER_TENANTS"), ",")
		for i := range tenants {
			tenants[i] = strings.TrimSpace(tenants[i])
		}
		var filtered []string
		for _, t := range tenants {
			if t != "" {
				filtered = append(filtered, t)
			}
		}
		companyIDs := []int{0}
		if s := os.Getenv("RUNNER_COMPANY_IDS"); s != "" {
			ids := strings.Split(s, ",")
			companyIDs = companyIDs[:0]
			for _, idStr := range ids {
				if n, err := strconv.Atoi(strings.TrimSpace(idStr)); err == nil {
					companyIDs = append(companyIDs, n)
				}
			}
			if len(companyIDs) == 0 {
				companyIDs = []int{0}
			}
		}
		for _, t := range filtered {
			for _, cid := range companyIDs {
				tenantConfig = append(tenantConfig, TenantCompany{Tenant: t, CompanyID: cid})
			}
		}
	}

	linkyURL := os.Getenv("LINKY_URL")
	if linkyURL == "" {
		linkyURL = "http://linky:3000"
	}
	divaURL := os.Getenv("DIVA_URL")
	if divaURL == "" {
		divaURL = "http://diva:8010"
	}

	periods := []string{"current_month", "ytd"}
	if s := os.Getenv("RUNNER_PERIODS"); s != "" {
		periods = strings.Split(s, ",")
		for i := range periods {
			periods[i] = strings.TrimSpace(periods[i])
		}
	}

	return &Config{
		Enabled:      enabled,
		Mode:         mode,
		IntervalSec:  intervalSec,
		Concurrency:  concurrency,
		TenantConfig: tenantConfig,
		LinkyURL:     strings.TrimSuffix(linkyURL, "/"),
		DivaURL:      strings.TrimSuffix(divaURL, "/"),
		Periods:      periods,
	}
}

// parseTenantConfig décode RUNNER_TENANT_CONFIG : tenant:1,2;tenant2:0
func parseTenantConfig(s string) []TenantCompany {
	var out []TenantCompany
	for _, part := range strings.Split(s, ";") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		colon := strings.Index(part, ":")
		if colon < 0 {
			continue
		}
		tenant := strings.TrimSpace(part[:colon])
		idsStr := strings.TrimSpace(part[colon+1:])
		if tenant == "" {
			continue
		}
		for _, idStr := range strings.Split(idsStr, ",") {
			idStr = strings.TrimSpace(idStr)
			if idStr == "" {
				continue
			}
			n, err := strconv.Atoi(idStr)
			if err != nil {
				continue
			}
			out = append(out, TenantCompany{Tenant: tenant, CompanyID: n})
		}
	}
	return out
}
