package main

import (
	"os"

	"github.com/doreviateam/diva/internal/server"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
		ErrorHandler:         server.ErrorHandler,
	})
	app.Use(recover.New())

	port := os.Getenv("DIVA_PORT")
	if port == "" {
		port = "8010"
	}

	srv := server.New(app)
	srv.SetupRoutes()

	if err := app.Listen(":" + port); err != nil {
		panic(err)
	}
}
