package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	JWTSecret   string
	Environment string

	// AllowedOrigins is the list of browser origins allowed by CORS (CORS_ORIGINS, comma-separated).
	AllowedOrigins []string

	// TrustedProxies lists reverse proxies whose X-Forwarded-For header may be believed
	// (TRUSTED_PROXIES, comma-separated IPs/CIDRs). Empty = trust none, use the socket IP.
	TrustedProxies []string
}

const minJWTSecretLength = 32

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using system env vars")
	}
	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", ""),
		DBName:      getEnv("DB_NAME", "ffws"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		Environment: getEnv("ENV", "development"),
	}

	// A missing or weak secret would let anyone forge valid (even admin) tokens, so refuse to start.
	if len(cfg.JWTSecret) < minJWTSecretLength {
		log.Fatalf("JWT_SECRET must be set and at least %d characters long (generate one with: openssl rand -hex 32)", minJWTSecretLength)
	}

	origins, originsSet := os.LookupEnv("CORS_ORIGINS")
	if !originsSet {
		if cfg.Environment == "production" {
			log.Fatal("CORS_ORIGINS must be set in production (e.g. https://your-domain.com)")
		}
		origins = "http://localhost:3000"
	}
	for _, o := range strings.Split(origins, ",") {
		if o = strings.TrimSpace(o); o != "" && o != "*" {
			cfg.AllowedOrigins = append(cfg.AllowedOrigins, o)
		}
	}
	if len(cfg.AllowedOrigins) == 0 {
		log.Fatal("CORS_ORIGINS must list at least one explicit origin (\"*\" is not allowed)")
	}

	for _, p := range strings.Split(os.Getenv("TRUSTED_PROXIES"), ",") {
		if p = strings.TrimSpace(p); p != "" {
			cfg.TrustedProxies = append(cfg.TrustedProxies, p)
		}
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
