package config

import (
	"os"

	"github.com/caarlos0/env/v11"
)

// Config contient toute la configuration de l'application
type Config struct {
	Port        string `env:"PORT" envDefault:"8080"`
	LogLevel    string `env:"LOG_LEVEL" envDefault:"info"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:""`
	StorageDir  string `env:"STORAGE_DIR" envDefault:"/opt/dorevia-vault/storage"`

	// Audit Configuration (Sprint 4 Phase 4.2)
	AuditDir string `env:"AUDIT_DIR" envDefault:"/opt/dorevia-vault/audit"`

	// Odoo Export Configuration (Sprint 4 Phase 4.3)
	OdooURL      string `env:"ODOO_URL" envDefault:""`
	OdooDatabase string `env:"ODOO_DATABASE" envDefault:""`
	OdooUser     string `env:"ODOO_USER" envDefault:""`
	OdooPassword string `env:"ODOO_PASSWORD" envDefault:""`

	// JWS Configuration (Sprint 2)
	JWSEnabled          bool   `env:"JWS_ENABLED" envDefault:"true"`
	JWSRequired         bool   `env:"JWS_REQUIRED" envDefault:"true"`
	JWSPrivateKeyPath   string `env:"JWS_PRIVATE_KEY_PATH" envDefault:""`
	JWSPublicKeyPath    string `env:"JWS_PUBLIC_KEY_PATH" envDefault:""`
	JWSPrivateKeyBase64 string `env:"JWS_PRIVATE_KEY_BASE64" envDefault:""`
	JWSPublicKeyBase64  string `env:"JWS_PUBLIC_KEY_BASE64" envDefault:""`
	JWSKID              string `env:"JWS_KID" envDefault:"key-2025-Q1"`

	// Ledger Configuration (Sprint 2)
	LedgerEnabled bool `env:"LEDGER_ENABLED" envDefault:"true"`

	// Auth Configuration (Sprint 5 Phase 5.2)
	AuthEnabled      bool   `env:"AUTH_ENABLED" envDefault:"false"`
	JWTEnabled       bool   `env:"AUTH_JWT_ENABLED" envDefault:"true"`
	APIKeyEnabled    bool   `env:"AUTH_APIKEY_ENABLED" envDefault:"true"`
	JWTPublicKeyPath string `env:"AUTH_JWT_PUBLIC_KEY_PATH" envDefault:""`

	// Factur-X Validation Configuration (Sprint 5 Phase 5.3)
	FacturXValidationEnabled  bool `env:"FACTURX_VALIDATION_ENABLED" envDefault:"true"`
	FacturXValidationRequired bool `env:"FACTURX_VALIDATION_REQUIRED" envDefault:"false"`

	// Webhooks Configuration (Sprint 5 Phase 5.3)
	WebhooksEnabled   bool   `env:"WEBHOOKS_ENABLED" envDefault:"false"`
	WebhooksRedisURL  string `env:"WEBHOOKS_REDIS_URL" envDefault:"redis://localhost:6379/0"`
	WebhooksSecretKey string `env:"WEBHOOKS_SECRET_KEY" envDefault:""`
	WebhooksWorkers   int    `env:"WEBHOOKS_WORKERS" envDefault:"3"`
	// URLs webhooks par événement (format: event1:url1,url2|event2:url3)
	WebhooksURLs string `env:"WEBHOOKS_URLS" envDefault:""`

	// POS Configuration (Sprint 6)
	PosTicketMaxSizeBytes int `env:"POS_TICKET_MAX_SIZE_BYTES" envDefault:"65536"` // 64 KB

	// Payments Configuration
	PaymentMaxSizeBytes int `env:"PAYMENT_MAX_SIZE_BYTES" envDefault:"65536"` // 64 KB

	// Z-Reports Configuration (Sprint 7)
	LedgerFilesystemPath string `env:"LEDGER_FILESYSTEM_PATH" envDefault:"/opt/dorevia-vault/ledger"`
	ZReportMaxSizeBytes  int    `env:"ZREPORT_MAX_SIZE_BYTES" envDefault:"1048576"` // 1 MB
	ZReportFsyncEnabled  bool   `env:"ZREPORT_FSYNC_ENABLED" envDefault:"true"`

	// ✅ SÉCURITÉ : Limites de taille pour uploads (Phase 2)
	MaxUploadSizeBytes int `env:"MAX_UPLOAD_SIZE_BYTES" envDefault:"10485760"` // 10 MB par défaut
	MaxBase64SizeBytes int `env:"MAX_BASE64_SIZE_BYTES" envDefault:"15728640"` // 15 MB (compense overhead base64 ~33%)

	// ✅ SÉCURITÉ : Rate Limiting Configuration (Phase 3)
	RateLimitMaxRequests   int `env:"RATE_LIMIT_MAX_REQUESTS" envDefault:"100"`  // Requêtes par période
	RateLimitExpirationSec int `env:"RATE_LIMIT_EXPIRATION_SEC" envDefault:"60"` // Période en secondes
	RateLimitUploadMax     int `env:"RATE_LIMIT_UPLOAD_MAX" envDefault:"20"`     // Limite spéciale pour uploads
	RateLimitUploadExpSec  int `env:"RATE_LIMIT_UPLOAD_EXP_SEC" envDefault:"60"` // Période pour uploads

	// ✅ SÉCURITÉ : CORS Configuration (Phase 3)
	CORSAllowedOrigins string `env:"CORS_ALLOWED_ORIGINS" envDefault:"*"` // Origines autorisées (séparées par virgule, * pour toutes)

	// SPEC 2 - Constat Monthly Job Configuration
	ConstatJobEnabled bool   `env:"CONSTAT_JOB_ENABLED" envDefault:"false"` // Activer le job mensuel de génération de constats
	CoreURL           string `env:"CORE_URL" envDefault:""`                 // URL de l'API Odoo CORE
	CoreToken         string `env:"CORE_TOKEN" envDefault:""`               // Token d'authentification pour Odoo CORE
	VaultID           string `env:"VAULT_ID" envDefault:""`                 // Identifiant de l'instance Vault
}

// Load charge la configuration depuis les variables d'environnement
func Load() (Config, error) {
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return cfg, err
	}
	return cfg, nil
}

// LoadOrDie charge la configuration ou termine le programme en cas d'erreur
func LoadOrDie() Config {
	cfg, err := Load()
	if err != nil {
		panic("Failed to load configuration: " + err.Error())
	}
	return cfg
}

// GetPort retourne le port depuis la config ou la variable d'environnement
func GetPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "8080"
	}
	return port
}
