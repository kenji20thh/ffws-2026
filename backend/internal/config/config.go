package config

import (
	"log"
	"os"
	"strconv"
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

	// GoogleClientID is the OAuth client id used to verify Google sign-in tokens (GOOGLE_CLIENT_ID).
	// Empty = Google sign-in disabled.
	GoogleClientID string

	// AllowedOrigins is the list of browser origins allowed by CORS (CORS_ORIGINS, comma-separated).
	AllowedOrigins []string

	// TrustedProxies lists reverse proxies whose X-Forwarded-For header may be believed
	// (TRUSTED_PROXIES, comma-separated IPs/CIDRs). Empty = trust none, use the socket IP.
	TrustedProxies []string

	// Database pool (DB_MAX_OPEN_CONNS, DB_MAX_IDLE_CONNS). Keep MaxOpen below your database's
	// connection limit. DBStatementTimeoutMS (DB_STATEMENT_TIMEOUT_MS, 0 = off) makes Postgres
	// cancel any query running longer than that; leave it off behind PgBouncer-style poolers.
	DBMaxOpenConns       int
	DBMaxIdleConns       int
	DBStatementTimeoutMS int

	// Traffic protection.
	// RateLimitRPS / RateLimitBurst: per-IP limit across the whole API (RATE_LIMIT_RPS, RATE_LIMIT_BURST).
	// RateLimitExemptIPs: IPs never rate limited, e.g. your Next.js server that renders pages
	// for many visitors from ONE IP (RATE_LIMIT_EXEMPT_IPS, comma-separated).
	// MaxInFlight: requests handled at once; extra ones get a fast 503 instead of piling up (MAX_IN_FLIGHT).
	RateLimitRPS       float64
	RateLimitBurst     int
	RateLimitExemptIPs []string
	MaxInFlight        int
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
		DBName:      getEnvNonEmpty("DB_NAME", "ffws"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		Environment: getEnv("ENV", "development"),

		GoogleClientID: strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID")),
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
	for _, p := range strings.Split(os.Getenv("RATE_LIMIT_EXEMPT_IPS"), ",") {
		if p = strings.TrimSpace(p); p != "" {
			cfg.RateLimitExemptIPs = append(cfg.RateLimitExemptIPs, p)
		}
	}

	cfg.DBMaxOpenConns = getEnvInt("DB_MAX_OPEN_CONNS", 10, 1)
	cfg.DBMaxIdleConns = getEnvInt("DB_MAX_IDLE_CONNS", cfg.DBMaxOpenConns, 0)
	if cfg.DBMaxIdleConns > cfg.DBMaxOpenConns {
		cfg.DBMaxIdleConns = cfg.DBMaxOpenConns
	}
	cfg.DBStatementTimeoutMS = getEnvInt("DB_STATEMENT_TIMEOUT_MS", 0, 0)
	cfg.RateLimitRPS = float64(getEnvInt("RATE_LIMIT_RPS", 20, 1))
	cfg.RateLimitBurst = getEnvInt("RATE_LIMIT_BURST", 60, 1)
	cfg.MaxInFlight = getEnvInt("MAX_IN_FLIGHT", 256, 1)

	return cfg
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvNonEmpty(key, fallback string) string {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return fallback
	}
	return val
}

// getEnvInt reads an integer env var; a missing, invalid or too-small value falls back to the default.
func getEnvInt(key string, fallback, min int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < min {
		log.Printf("ignoring invalid %s=%q, using %d", key, raw, fallback)
		return fallback
	}
	return n
}
