package config

import (
	"github.com/caarlos0/env/v11"
)

// Config contient la configuration du service DLP
type Config struct {
	Port        string `env:"PORT" envDefault:"8020"`
	LogLevel    string `env:"LOG_LEVEL" envDefault:"info"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:""`
}

// Load charge la configuration depuis l'environnement
func Load() Config {
	var cfg Config
	env.Parse(&cfg)
	return cfg
}
