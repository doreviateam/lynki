package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/doreviateam/diva/internal/runner"
)

func main() {
	cfg := runner.LoadConfig()
	r := runner.New(cfg)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigCh
		cancel()
	}()

	r.Run(ctx)
}
