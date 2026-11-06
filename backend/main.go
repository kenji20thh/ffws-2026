package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"ffws/internal/config"
	"ffws/internal/db"
	"ffws/internal/handlers"
	"ffws/internal/middleware"
	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

func main() {
	cfg := config.Load()
	database := db.Connect(cfg)

	sqlDB, err := database.DB()
	if err != nil {
		log.Fatalf("failed to get database connection: %v", err)
	}

	// The connection pool size is configured in db.Connect (DB_MAX_OPEN_CONNS).
	// Note: this SET only applies to the one connection that runs it. That is fine as long as
	// your database user's default search_path already includes "public".
	if _, err := sqlDB.Exec("SET search_path TO public"); err != nil {
		log.Fatalf("failed to set database schema: %v", err)
	}

	if err := database.AutoMigrate(
		&models.Subscriber{},
		&models.Tournament{},
		&models.Team{},
		&models.Player{},
		&models.Weapon{},
		&models.PlayerWeaponKill{},
		&models.PlayerHeadshot{},
		&models.TeamStaff{},
		&models.TournamentDay{},
		&models.TournamentDayTeam{},
		&models.Room{},
		&models.RoomTeamResult{},
		&models.PlayerRoomStat{},
		&models.TeamPenalty{},
		&models.User{},
		&models.FantasyTeam{},
		&models.FantasySelection{},
		&models.FantasyChipUse{},
		&models.Prediction{},
		&models.PredictionTeam{},
		&models.PrivateLeague{},
		&models.PrivateLeagueMember{},
	); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// One-off backfill for rooms created before rooms had a session: on days that have two
	// lobbies, rooms numbered above 6 (7-12) are the second lobby's. Idempotent: it only
	// touches rooms still on the default session 1.
	if err := database.Exec(`
		UPDATE rooms SET session = 2
		WHERE session = 1 AND room_number > 6
		  AND tournament_day_id IN (SELECT tournament_day_id FROM tournament_day_teams WHERE session >= 2)
	`).Error; err != nil {
		log.Printf("room session backfill skipped: %v", err)
	}

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// gin.New instead of gin.Default so we control the logger (no log spam from health checks)
	// and answer a panic with a clean JSON 500. A panic in one request never takes the server down.
	router := gin.New()
	router.Use(
		gin.LoggerWithConfig(gin.LoggerConfig{SkipPaths: []string{"/health", "/ready"}}),
		gin.CustomRecovery(func(c *gin.Context, recovered any) {
			log.Printf("panic recovered: %v", recovered)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}),
	)

	// Only believe X-Forwarded-For from proxies you list in TRUSTED_PROXIES; otherwise anyone
	// could fake their IP and dodge the rate limiter.
	if err := router.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		log.Fatalf("invalid TRUSTED_PROXIES: %v", err)
	}
	if len(cfg.TrustedProxies) == 0 && cfg.Environment == "production" {
		log.Println("WARNING: TRUSTED_PROXIES is empty. If this API runs behind a reverse proxy / platform load balancer, " +
			"every visitor looks like the same IP and the rate limiters will block real users together. Set TRUSTED_PROXIES.")
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour, // browsers remember the preflight, so far fewer OPTIONS requests
	}))

	// Health probes are registered BEFORE the protection middleware below, so they are never
	// rate limited or shed while the server is busy.
	router.GET("/health", handlers.HealthCheck)
	router.GET("/ready", handlers.ReadyCheck(sqlDB))

	router.Use(
		middleware.SecurityHeaders(),
		middleware.BodyLimit(1<<20), // 1 MB is far more than any JSON body this API accepts
		middleware.MaxInFlight(cfg.MaxInFlight),
		middleware.GlobalRateLimit(cfg.RateLimitRPS, cfg.RateLimitBurst, cfg.RateLimitExemptIPs),
	)

	// Response caching for PUBLIC read routes (see middleware.CacheGET).
	// slow: rarely changes. live: changes while matches are being scored.
	// The strings are the query parameters each route reads (they form the cache key).
	slow := func(params ...string) gin.HandlerFunc {
		return middleware.CacheGET(30*time.Second, 10*time.Minute, params...)
	}
	live := func(params ...string) gin.HandlerFunc {
		return middleware.CacheGET(10*time.Second, 5*time.Minute, params...)
	}

	subscriberRepo := repository.NewSubscriberRepository(database)
	subscriberHandler := handlers.NewSubscriberHandler(subscriberRepo)

	tournamentRepo := repository.NewTournamentRepository(database)
	tournamentHandler := handlers.NewTournamentHandler(tournamentRepo)

	teamRepo := repository.NewTeamRepository(database)
	teamHandler := handlers.NewTeamHandler(teamRepo)

	playerRepo := repository.NewPlayerRepository(database)
	playerStatsRepo := repository.NewPlayerStatsRepository(database)
	playerHandler := handlers.NewPlayerHandler(playerRepo, playerStatsRepo)

	tournamentDayRepo := repository.NewTournamentDayRepository(database)
	dayTeamRepo := repository.NewTournamentDayTeamRepository(database)
	tournamentDayHandler := handlers.NewTournamentDayHandler(tournamentDayRepo, dayTeamRepo)

	roomRepo := repository.NewRoomRepository(database)
	roomHandler := handlers.NewRoomHandler(roomRepo)

	roomResultRepo := repository.NewRoomResultRepository(database)
	roomResultHandler := handlers.NewRoomResultHandler(roomResultRepo)

	userRepo := repository.NewUserRepository(database)
	authHandler := handlers.NewAuthHandler(userRepo, cfg)

	teamStaffRepo := repository.NewTeamStaffRepository(database)
	teamStaffHandler := handlers.NewTeamStaffHandler(teamStaffRepo)

	weaponRepo := repository.NewWeaponRepository(database)
	weaponHandler := handlers.NewWeaponHandler(weaponRepo)

	teamStatsRepo := repository.NewTeamStatsRepository(database)
	teamStatsHandler := handlers.NewTeamStatsHandler(teamStatsRepo)

	playerStatsHandler := handlers.NewPlayerStatsHandler(playerStatsRepo)

	predictionRepo := repository.NewPredictionRepository(database)
	predictionHandler := handlers.NewPredictionHandler(predictionRepo)

	fantasyRepo := repository.NewFantasyRepository(database)
	fantasyHandler := handlers.NewFantasyHandler(fantasyRepo)

	// Teams created before leagues existed get their region from their country.
	if n, err := fantasyRepo.BackfillRegions(); err != nil {
		log.Printf("warning: could not backfill fantasy regions: %v", err)
	} else if n > 0 {
		log.Printf("assigned a region league to %d existing fantasy teams", n)
	}

	api := router.Group("/api/v1")
	{
		api.POST("/auth/register", middleware.RateLimit(rate.Every(30*time.Second), 3), authHandler.Register)
		api.POST("/auth/login", middleware.RateLimit(rate.Every(15*time.Second), 5), authHandler.Login)
		api.POST("/auth/google", middleware.RateLimit(rate.Every(10*time.Second), 10), authHandler.Google)
		api.POST("/auth/google/complete", middleware.RateLimit(rate.Every(10*time.Second), 10), authHandler.GoogleComplete)

		api.POST("/subscribe", middleware.RateLimit(rate.Every(10*time.Second), 5), subscriberHandler.Subscribe)

		api.GET("/teams/:id/stats", live(), teamStatsHandler.GetProfile)
		api.GET("/teams/:id/staff", slow(), teamStaffHandler.List)

		api.GET("/predictions/standings", live("tournament_id", "day_id"), predictionHandler.GetStandings)
		api.GET("/predictions/:id", middleware.OptionalAuth(cfg), predictionHandler.GetByID)

		api.GET("/tournaments", slow(), tournamentHandler.List)
		api.GET("/tournaments/:slug", slow(), tournamentHandler.GetBySlug)
		api.GET("/teams", slow("tournament_id"), teamHandler.List)
		api.GET("/teams/:id", slow(), teamHandler.GetByID)
		api.GET("/players", slow("team_id"), playerHandler.List)
		api.GET("/players/:id", live(), playerHandler.GetByID)
		api.GET("/weapons", slow(), weaponHandler.List)
		api.GET("/tournament-days", slow("tournament_id"), tournamentDayHandler.List)
		api.GET("/tournament-days/:id", slow(), tournamentDayHandler.GetByID)
		api.GET("/tournament-days/:id/teams", slow(), tournamentDayHandler.GetTeams)
		api.GET("/rooms", live("tournament_day_id"), roomHandler.List)
		api.GET("/rooms/:id", live(), roomHandler.GetByID)
		api.GET("/rooms/:id/results", live(), roomResultHandler.GetSummary)
		api.GET("/standings", live("tournament_id"), roomResultHandler.GetStandings)
		api.GET("/penalties", live("tournament_id"), roomResultHandler.GetPenalties)

		api.GET("/player-leaderboard", live("tournament_id", "day_id", "session"), playerStatsHandler.GetLeaderboard)

		api.GET("/fantasy/players", live("tournament_id", "day_id"), fantasyHandler.GetPlayerPool)
		api.GET("/fantasy/player-form", live("tournament_id"), fantasyHandler.GetPlayerForm)
		api.GET("/fantasy/standings", live("tournament_id", "day_id"), fantasyHandler.GetStandings)
		api.GET("/fantasy/teams/:id", middleware.OptionalAuth(cfg), fantasyHandler.GetTeamProfile)

		protected := api.Group("/")
		protected.Use(middleware.RequireAuth(cfg))
		{
			protected.GET("/auth/me", authHandler.Me)
			protected.PUT("/auth/username", middleware.RateLimit(rate.Every(30*time.Second), 5), authHandler.ChangeUsername)
			protected.PUT("/auth/password", middleware.RateLimit(rate.Every(15*time.Second), 5), authHandler.ChangePassword)

			protected.POST("/fantasy/team", fantasyHandler.CreateTeam)
			protected.GET("/fantasy/team", fantasyHandler.GetMyTeam)
			protected.GET("/fantasy/leagues", fantasyHandler.GetMyLeagues)
			protected.GET("/fantasy/leagues/:slug/standings", fantasyHandler.GetLeagueStandings)
			protected.POST("/fantasy/leagues/private", middleware.RateLimit(rate.Every(10*time.Second), 5), fantasyHandler.CreatePrivateLeague)
			protected.POST("/fantasy/leagues/join", middleware.RateLimit(rate.Every(6*time.Second), 10), fantasyHandler.JoinPrivateLeague)
			protected.DELETE("/fantasy/leagues/private/:id", fantasyHandler.LeavePrivateLeague)
			protected.GET("/fantasy/team/selections/:dayId", fantasyHandler.GetMySelection)
			protected.POST("/fantasy/team/selections/:dayId", fantasyHandler.SubmitSelection)
			protected.GET("/predictions/mine/:dayId", predictionHandler.GetMine)
			protected.POST("/predictions/:dayId", predictionHandler.Submit)

			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireAdmin(), middleware.PurgeCacheAfterWrite())
			{
				adminOnly.POST("/auth/accounts", authHandler.CreateAccount)
				adminOnly.GET("/auth/accounts", authHandler.ListAccounts)
				adminOnly.POST("/auth/accounts/:id/grant-admin", authHandler.GrantAdmin)

				adminOnly.POST("/tournaments", tournamentHandler.Create)
				adminOnly.POST("/teams", teamHandler.Create)
				adminOnly.POST("/players", playerHandler.Create)
				adminOnly.POST("/tournament-days", tournamentDayHandler.Create)
				adminOnly.PUT("/tournament-days/:id", tournamentDayHandler.Update)
				adminOnly.POST("/tournament-days/:id/teams", tournamentDayHandler.AssignTeams)
				adminOnly.POST("/rooms", roomHandler.Create)
				adminOnly.POST("/rooms/:id/results", roomResultHandler.Submit)
				adminOnly.GET("/rooms/:id/player-stats", roomResultHandler.GetPlayerStats)

				adminOnly.POST("/teams/:id/staff", teamStaffHandler.Create)
				adminOnly.DELETE("/staff/:id", teamStaffHandler.Delete)
				adminOnly.PUT("/teams/:id", teamHandler.Update)
				adminOnly.DELETE("/teams/:id", teamHandler.Delete)
				adminOnly.PUT("/players/:id", playerHandler.Update)
				adminOnly.GET("/players/:id/weapons", weaponHandler.GetPlayerKills)
				adminOnly.PUT("/players/:id/weapons", weaponHandler.SetPlayerKills)
				adminOnly.DELETE("/players/:id", playerHandler.Delete)
				adminOnly.PUT("/rooms/:id", roomHandler.Update)
				adminOnly.DELETE("/rooms/:id", roomHandler.Delete)

			}
		}
	}

	// Explicit server timeouts. gin's router.Run has none, so slow or stalled clients
	// ("slowloris") could hold connections open forever and exhaust the server.
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       90 * time.Second,
		MaxHeaderBytes:    1 << 16,
	}

	serverErr := make(chan error, 1)
	go func() {
		log.Printf("starting server on port %s", cfg.Port)
		serverErr <- srv.ListenAndServe()
	}()

	// Graceful shutdown: on deploy/restart, finish in-flight requests instead of cutting them off.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server failed: %v", err)
		}
	case sig := <-stop:
		log.Printf("received %v, shutting down gracefully", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("graceful shutdown did not finish: %v", err)
		}
		if err := sqlDB.Close(); err != nil {
			log.Printf("closing database: %v", err)
		}
	}
}
