package server

import (
	"context"
	"os"

	"github.com/doreviateam/dlp/internal/db"
	"github.com/doreviateam/dlp/internal/handlers"
	"github.com/doreviateam/dlp/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Server DLP
type Server struct {
	app *fiber.App
	db  *db.DB
	log *zerolog.Logger
}

// New crée le serveur DLP
func New(cfg Config) (*Server, error) {
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})
	app.Use(recover.New())

	logger := log.Output(zerolog.ConsoleWriter{Out: os.Stdout})
	if cfg.LogLevel == "debug" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	var database *db.DB
	if cfg.DatabaseURL != "" {
		ctx := context.Background()
		var err error
		database, err = db.NewDB(ctx, cfg.DatabaseURL, &logger)
		if err != nil {
			return nil, err
		}
	} else {
		logger.Warn().Msg("DATABASE_URL not set, readiness will fail")
	}

	s := &Server{app: app, db: database, log: &logger}
	s.setupRoutes()
	return s, nil
}

func (s *Server) setupRoutes() {
	s.app.Get("/health", handlers.Health)
	if s.db != nil {
		s.app.Get("/ready", handlers.Ready(s.db))
		st := store.NewStore(s.db.Pool)
		api := s.app.Group("/api/v1")
		api.Get("/companies", handlers.Companies(st))
		api.Post("/companies", handlers.CreateCompany(st))
		api.Get("/perimeters", handlers.Perimeters(st))
		api.Post("/perimeters", handlers.CreatePerimeter(st))
		api.Patch("/perimeters/:id", handlers.UpdatePerimeter(st))
		api.Get("/dlps", handlers.ListDLPs(st))
		api.Post("/dlps", handlers.CreateDLP(st))
		api.Get("/dlps/:id", handlers.GetDLP(st))
		api.Patch("/dlps/:id", handlers.UpdateDLP(st))
		api.Get("/project-perimeter-map", handlers.ProjectPerimeterMapList(st))
		api.Post("/project-perimeter-map", handlers.ProjectPerimeterMapCreate(st))
		api.Delete("/project-perimeter-map/:id", handlers.ProjectPerimeterMapDelete(st))
		api.Post("/timesheet-validated", handlers.TimesheetValidated(st, s.log))
		api.Get("/dlp/energy-summary", handlers.EnergySummary(st))
	} else {
		s.app.Get("/ready", func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"status": "unhealthy", "error": "database not configured"})
		})
	}
}

// App returns the Fiber app
func (s *Server) App() *fiber.App {
	return s.app
}

// Close ferme les ressources
func (s *Server) Close() {
	if s.db != nil {
		s.db.Close()
	}
}

// Config du serveur
type Config struct {
	Port        string
	LogLevel    string
	DatabaseURL string
}
