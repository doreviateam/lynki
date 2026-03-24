package runner

import (
	"context"
	"log/slog"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

type Runner struct {
	cfg *Config
}

func New(cfg *Config) *Runner {
	return &Runner{cfg: cfg}
}

func (r *Runner) Run(ctx context.Context) {
	if !r.cfg.Enabled {
		slog.Info("event=diva_runner_skip reason=disabled")
		return
	}
	if len(r.cfg.TenantConfig) == 0 {
		slog.Info("event=diva_runner_skip reason=no_tenant_config")
		return
	}

	if r.cfg.Mode == "once" {
		r.tick(ctx)
		return
	}

	for {
		func() {
			defer func() {
				if rec := recover(); rec != nil {
					slog.Warn("event=diva_runner_tick", "status", "panic", "err", rec)
				}
			}()
			r.tick(ctx)
		}()

		// Intervalle aléatoire entre MinIntervalSec et MaxIntervalSec (bornes inclusives).
		// Évite la synchronisation de tous les tenants sur le même instant.
		minSec := r.cfg.MinIntervalSec
		maxSec := r.cfg.MaxIntervalSec
		if minSec <= 0 {
			minSec = r.cfg.IntervalSec
		}
		if maxSec <= minSec {
			maxSec = minSec
		}
		rangeSec := maxSec - minSec
		var wait time.Duration
		if rangeSec > 0 {
			wait = time.Duration(minSec+rand.Intn(rangeSec+1)) * time.Second
		} else {
			wait = time.Duration(minSec) * time.Second
		}
		slog.Info("event=diva_runner_sleep", "next_in_s", int(wait.Seconds()), "min_s", minSec, "max_s", maxSec)

		select {
		case <-ctx.Done():
			return
		case <-time.After(wait):
		}
	}
}

// tenants extracts unique tenant names from TenantConfig.
func (r *Runner) tenants() []string {
	seen := map[string]bool{}
	var out []string
	for _, tc := range r.cfg.TenantConfig {
		if !seen[tc.Tenant] {
			seen[tc.Tenant] = true
			out = append(out, tc.Tenant)
		}
	}
	return out
}

// staticCompanies returns the company_id list from static config for a given tenant.
func (r *Runner) staticCompanies(tenant string) []int {
	var out []int
	for _, tc := range r.cfg.TenantConfig {
		if tc.Tenant == tenant {
			out = append(out, tc.CompanyID)
		}
	}
	return out
}

func (r *Runner) tick(ctx context.Context) {
	start := time.Now()
	slog.Info("event=diva_runner_tick status=start")

	var wg sync.WaitGroup
	sem := make(chan struct{}, r.cfg.Concurrency)
	var processed atomic.Int32

	for _, tenant := range r.tenants() {
		companies, err := FetchCockpitCompanies(r.cfg.LinkyURL, tenant)
		if err != nil {
			slog.Warn("event=diva_runner_discovery", "tenant", tenant, "target", "companies", "status", "failed", "err", err)
			companies = r.staticCompanies(tenant)
			slog.Info("event=diva_runner_discovery", "tenant", tenant, "target", "companies", "status", "fallback_static", "companies", companies)
		} else if len(companies) == 0 {
			// Découverte réussie mais liste vide → fallback config statique
			companies = r.staticCompanies(tenant)
			slog.Info("event=diva_runner_discovery", "tenant", tenant, "target", "companies", "status", "fallback_static_empty", "companies", companies)
		} else {
			slog.Info("event=diva_runner_discovery", "tenant", tenant, "target", "companies", "status", "ok", "companies", companies)
		}

		_, cardsSpec, cardsErr := FetchCockpitCards(r.cfg.LinkyURL, tenant)
		if cardsErr != nil {
			slog.Warn("event=diva_runner_discovery", "tenant", tenant, "target", "cards", "status", "failed", "err", cardsErr)
		} else {
			slog.Info("event=diva_runner_discovery", "tenant", tenant, "target", "cards", "status", "ok", "version", cardsSpec.Version, "count", len(cardsSpec.Keys))
		}

		for _, cid := range companies {
			for _, period := range r.cfg.Periods {
				dateStart, dateEnd, err := PeriodDates(period)
				if err != nil || dateStart == "" {
					continue
				}

				select {
				case <-ctx.Done():
					goto done
				case sem <- struct{}{}:
				}

				wg.Add(1)
				go func(t string, cid int, p, ds, de string, spec *CardsSpec) {
					defer wg.Done()
					defer func() { <-sem }()
					defer func() {
						if r := recover(); r != nil {
							slog.Warn("event=diva_runner_context", "tenant", t, "company_id", cid, "period", p, "status", "panic", "err", r)
						}
					}()

				// Garde d'inactivité : skip Mistral si personne n'a consulté récemment.
				if r.cfg.IdleThresholdSec > 0 {
					if !IsActive(r.cfg.DivaURL, t, cid, r.cfg.IdleThresholdSec) {
						slog.Info("event=diva_runner_idle_skip", "tenant", t, "company_id", cid, "period", p, "reason", "no_recent_activity", "threshold_s", r.cfg.IdleThresholdSec)
						return
					}
				}

				metrics, err := FetchMetricsFromLinkyFull(r.cfg.LinkyURL, t, ds, de, cid)
				if err != nil {
					slog.Warn("event=diva_runner_context", "tenant", t, "company_id", cid, "period", p, "status", "failed", "err", err)
					return
				}

				result, err := CallDivaGenerate(r.cfg.DivaURL, t, cid, ds, de, metrics.Cards, metrics.Details, spec)
				if err != nil {
					slog.Warn("event=diva_runner_context", "tenant", t, "company_id", cid, "period", p, "mode", "cockpit", "status", "failed", "err", err)
					return
				}
				processed.Add(1)
				if result.State == "failed" {
					slog.Warn("event=diva_runner_context", "tenant", t, "company_id", cid, "period", p, "mode", "cockpit", "state", result.State, "error_code", result.ErrorCode)
				} else {
					slog.Info("event=diva_runner_context", "tenant", t, "company_id", cid, "period", p, "mode", "cockpit", "state", result.State)
				}
				}(tenant, cid, period, dateStart, dateEnd, cardsSpec)
			}
		}
	}

done:
	wg.Wait()
	elapsed := time.Since(start)
	interval := time.Duration(r.cfg.IntervalSec) * time.Second
	if elapsed > interval {
		slog.Warn("event=diva_runner_tick", "status", "end", "duration_ms", elapsed.Milliseconds(), "contexts_processed", processed.Load(), "drift", "tick exceeded interval", "interval_ms", interval.Milliseconds())
	} else {
		slog.Info("event=diva_runner_tick", "status", "end", "duration_ms", elapsed.Milliseconds(), "contexts_processed", processed.Load())
	}
}
