package db

import (
	"log"
	"net"
	"net/url"
	"os"
	"strconv"
	"time"

	"ffws/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(cfg.DBUser, cfg.DBPassword),
		Host:   net.JoinHostPort(cfg.DBHost, cfg.DBPort),
		Path:   "/" + cfg.DBName,
	}

	q := u.Query()
	q.Set("sslmode", "require")
	q.Set("connect_timeout", "10") // never hang forever while opening a connection
	if cfg.DBStatementTimeoutMS > 0 {
		// Postgres cancels any single query that runs longer than this, so one slow query
		// cannot hold a pool connection (and eventually the whole site) hostage.
		q.Set("statement_timeout", strconv.Itoa(cfg.DBStatementTimeoutMS))
	}
	u.RawQuery = q.Encode()

	dsn := u.String()

	// Only log errors and slow queries. Logging every statement at Info level costs a lot
	// of I/O under load and floods the logs.
	gormLogger := logger.New(log.New(os.Stdout, "", log.LstdFlags), logger.Config{
		SlowThreshold:             500 * time.Millisecond,
		LogLevel:                  logger.Warn,
		IgnoreRecordNotFoundError: true,
	})

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: gormLogger})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get sql.DB: %v", err)
	}

	// Connection pool. A pool of 1 makes every request wait in a single queue behind the
	// slowest query, so the whole site stalls under load.
	sqlDB.SetMaxOpenConns(cfg.DBMaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.DBMaxIdleConns)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	log.Printf("database connected successfully (pool: max %d open, %d idle)", cfg.DBMaxOpenConns, cfg.DBMaxIdleConns)
	return db
}
