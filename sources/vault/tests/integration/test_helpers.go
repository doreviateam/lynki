package integration

import (
	"context"
	"os"
	"testing"

	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/pkg/logger"
	"github.com/stretchr/testify/require"
)

// setupTestDB crée une connexion DB de test
// Fonction partagée pour tous les tests d'intégration
func setupTestDB(t *testing.T) *storage.DB {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}

	log := logger.New("error")
	ctx := context.Background()
	db, err := storage.NewDB(ctx, dbURL, log)
	require.NoError(t, err)

	// Nettoyer la table documents avant le test
	_, err = db.Pool.Exec(ctx, "DELETE FROM documents")
	require.NoError(t, err)

	return db
}

// setupTestJWS crée un service JWS de test avec des clés temporaires
// Fonction partagée pour tous les tests d'intégration
func setupTestJWS(t *testing.T) *crypto.Service {
	privateKeyPath := "/tmp/test_private_key.pem"
	publicKeyPath := "/tmp/test_public_key.pem"

	// Utiliser les clés du projet si disponibles
	if _, err := os.Stat("/opt/dorevia-vault/keys/private.pem"); err == nil {
		privateKeyPath = "/opt/dorevia-vault/keys/private.pem"
		publicKeyPath = "/opt/dorevia-vault/keys/public.pem"
	}

	service, err := crypto.NewService(privateKeyPath, publicKeyPath, "test-kid")
	if err != nil {
		t.Skipf("JWS service not available: %v", err)
	}
	return service
}

