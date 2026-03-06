package main

import (
	"context"
	"log"
	"os"

	"github.com/doreviateam/dorevia-vault/internal/replay"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = os.Getenv("TEST_DATABASE_URL")
	}
	if dbURL == "" {
		log.Fatal("DATABASE_URL or TEST_DATABASE_URL required")
	}
	ctx := context.Background()
	l := logger.New("info")
	db, err := storage.NewDB(ctx, dbURL, l)
	if err != nil {
		log.Fatalf("DB connect: %v", err)
	}
	defer db.Close()
	if err := replay.SeedRegressionDataset(ctx, db); err != nil {
		log.Fatalf("Seed failed: %v", err)
	}
	log.Println("Dataset regression chargé (tenant: regression-tenant)")
}
