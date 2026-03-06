package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/doreviateam/dlp/internal/config"
	"github.com/doreviateam/dlp/internal/server"
)

func main() {
	cfg := config.Load()

	srv, err := server.New(server.Config{
		Port:        cfg.Port,
		LogLevel:    cfg.LogLevel,
		DatabaseURL: cfg.DatabaseURL,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to start DLP: %v\n", err)
		os.Exit(1)
	}
	defer srv.Close()

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
		<-sig
		srv.Close()
		os.Exit(0)
	}()

	addr := ":" + cfg.Port
	if err := srv.App().Listen(addr); err != nil {
		fmt.Fprintf(os.Stderr, "Listen failed: %v\n", err)
		os.Exit(1)
	}
}
