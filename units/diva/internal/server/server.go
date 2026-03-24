package server

import (
	"context"
	"os"
	"strconv"
	"time"

	"github.com/doreviateam/diva/internal/cache"
	"github.com/doreviateam/diva/internal/guard"
	"github.com/doreviateam/diva/internal/handlers"
	"github.com/doreviateam/diva/internal/mistral"
	"github.com/doreviateam/diva/internal/store"
	"github.com/gofiber/fiber/v2"
)

type Server struct {
	app          *fiber.App
	cache        *cache.Cache
	guard        *guard.RefreshGuard
	analysisStore store.AnalysisStore
	mistral      *mistral.Client
}

func New(app *fiber.App) *Server {
	ttlSec := 300
	if s := os.Getenv("CACHE_TTL_SECONDS"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			ttlSec = n
		}
	}
	purgeIntervalSec := 60
	if s := os.Getenv("JOBS_PURGE_INTERVAL_SECONDS"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			purgeIntervalSec = n
		}
	}
	// maxAge = 2 * MISTRAL_TIMEOUT (30s) = 60s pour purge des locks orphelins
	guardMaxAge := 60 * time.Second
	if s := os.Getenv("GUARD_MAX_AGE_SECONDS"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			guardMaxAge = time.Duration(n) * time.Second
		}
	}

	var analysisStore store.AnalysisStore
	dbURL := os.Getenv("DIVA_DATABASE_URL")
	if dbURL != "" {
		if pg, err := store.NewPostgresStore(context.Background(), dbURL); err == nil {
			analysisStore = pg
		}
	}
	if analysisStore == nil {
		analysisStore = store.NewMemoryStore(ttlSec, purgeIntervalSec)
	}

	return &Server{
		app:           app,
		cache:         cache.New(ttlSec),
		guard:         guard.New(guardMaxAge),
		analysisStore: analysisStore,
		mistral:       mistral.NewClient(),
	}
}

func (s *Server) SetupRoutes() {
	s.app.Get("/health", handlers.Health)
	s.app.Post("/diva/explain", handlers.Explain(s.cache, s.guard, s.mistral))
	s.app.Post("/diva/explain/async", handlers.ExplainAsync(s.cache, s.guard, s.analysisStore, s.mistral))
	s.app.Get("/diva/jobs/:contextHash", handlers.GetJobByContextHash(s.analysisStore))

	if insightsStore, ok := s.analysisStore.(store.InsightsStore); ok {
		s.app.Get("/diva/insights", handlers.GetInsights(insightsStore))
	}
	if genStore, ok := s.analysisStore.(store.GenerateStore); ok {
		s.app.Post("/diva/generate", handlers.Generate(genStore, s.guard, s.mistral))
	}
	if actStore, ok := s.analysisStore.(store.ActivityStore); ok {
		s.app.Post("/diva/activity", handlers.RecordActivity(actStore))
		s.app.Get("/diva/activity", handlers.GetActivity(actStore))
	}

	// Sprint 12 T69 — insight comptable (template-first, Mistral local optionnel)
	s.app.Post("/diva/accounting/insight", handlers.AccountingInsightHandler(s.mistral))

	// Sprint 13 T75 — rapport structuré DOCX (template-first strict, zéro LLM)
	s.app.Post("/diva/accounting/report", handlers.AccountingReportHandler(s.mistral))
}
