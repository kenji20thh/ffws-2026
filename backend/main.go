package main

import (
	"log"
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

	sqlDB.SetMaxOpenConns(1)

	if _, err := sqlDB.Exec("SET search_path TO public"); err != nil {
		log.Fatalf("failed to set database schema: %v", err)
	}

	if err := database.AutoMigrate(
		&models.Subscriber{},
		&models.Tournament{},
		&models.Team{},
		&models.Player{},
		&models.TeamStaff{},
		&models.TournamentDay{},
		&models.TournamentDayTeam{},
		&models.Room{},
		&models.RoomTeamResult{},
		&models.PlayerRoomStat{},
		&models.User{},
		&models.FantasyTeam{},
		&models.FantasySelection{},
		&models.Prediction{},
		&models.PredictionTeam{},
	); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	router := gin.Default()

	// Only believe X-Forwarded-For from proxies you list in TRUSTED_PROXIES; otherwise anyone
	// could fake their IP and dodge the rate limiter.
	if err := router.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		log.Fatalf("invalid TRUSTED_PROXIES: %v", err)
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	router.GET("/health", handlers.HealthCheck)

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

	teamStatsRepo := repository.NewTeamStatsRepository(database)
	teamStatsHandler := handlers.NewTeamStatsHandler(teamStatsRepo)

	playerStatsHandler := handlers.NewPlayerStatsHandler(playerStatsRepo)

	predictionRepo := repository.NewPredictionRepository(database)
	predictionHandler := handlers.NewPredictionHandler(predictionRepo)

	fantasyRepo := repository.NewFantasyRepository(database)
	fantasyHandler := handlers.NewFantasyHandler(fantasyRepo)

	api := router.Group("/api/v1")
	{
		api.POST("/auth/register", middleware.RateLimit(rate.Every(30*time.Second), 3), authHandler.Register)
		api.POST("/auth/login", middleware.RateLimit(rate.Every(15*time.Second), 5), authHandler.Login)

		api.POST("/subscribe", middleware.RateLimit(rate.Every(10*time.Second), 5), subscriberHandler.Subscribe)

		api.GET("/teams/:id/stats", teamStatsHandler.GetProfile)
		api.GET("/teams/:id/staff", teamStaffHandler.List)

		api.GET("/predictions/standings", predictionHandler.GetStandings)
		api.GET("/predictions/:id", predictionHandler.GetByID)

		api.GET("/tournaments", tournamentHandler.List)
		api.GET("/tournaments/:slug", tournamentHandler.GetBySlug)
		api.GET("/teams", teamHandler.List)
		api.GET("/teams/:id", teamHandler.GetByID)
		api.GET("/players", playerHandler.List)
		api.GET("/players/:id", playerHandler.GetByID)
		api.GET("/tournament-days", tournamentDayHandler.List)
		api.GET("/tournament-days/:id", tournamentDayHandler.GetByID)
		api.GET("/tournament-days/:id/teams", tournamentDayHandler.GetTeams)
		api.GET("/rooms", roomHandler.List)
		api.GET("/rooms/:id", roomHandler.GetByID)
		api.GET("/rooms/:id/results", roomResultHandler.GetSummary)
		api.GET("/standings", roomResultHandler.GetStandings)

		api.GET("/player-leaderboard", playerStatsHandler.GetLeaderboard)

		api.GET("/fantasy/players", fantasyHandler.GetPlayerPool)
		api.GET("/fantasy/standings", fantasyHandler.GetStandings)
		api.GET("/fantasy/teams/:id", middleware.OptionalAuth(cfg), fantasyHandler.GetTeamProfile)

		protected := api.Group("/")
		protected.Use(middleware.RequireAuth(cfg))
		{
			protected.POST("/fantasy/team", fantasyHandler.CreateTeam)
			protected.GET("/fantasy/team", fantasyHandler.GetMyTeam)
			protected.GET("/fantasy/team/selections/:dayId", fantasyHandler.GetMySelection)
			protected.POST("/fantasy/team/selections/:dayId", fantasyHandler.SubmitSelection)
			protected.GET("/predictions/mine/:dayId", predictionHandler.GetMine)
			protected.POST("/predictions/:dayId", predictionHandler.Submit)

			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireAdmin())
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

				adminOnly.POST("/teams/:id/staff", teamStaffHandler.Create)
				adminOnly.DELETE("/staff/:id", teamStaffHandler.Delete)
				adminOnly.PUT("/teams/:id", teamHandler.Update)
				adminOnly.DELETE("/teams/:id", teamHandler.Delete)
				adminOnly.PUT("/players/:id", playerHandler.Update)
				adminOnly.DELETE("/players/:id", playerHandler.Delete)
				adminOnly.PUT("/rooms/:id", roomHandler.Update)
				adminOnly.DELETE("/rooms/:id", roomHandler.Delete)

				adminOnly.POST("/predictions/:dayId/score", predictionHandler.ScoreDay)
			}
		}
	}

	log.Printf("starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}

}
