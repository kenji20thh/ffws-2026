package main

import (
	"log"

	"ffws/internal/config"
	"ffws/internal/db"
	"ffws/internal/handlers"
	"ffws/internal/middleware"
	"ffws/internal/models"
	"ffws/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database := db.Connect(cfg)

	if err := database.AutoMigrate(
		&models.Subscriber{},
		&models.Tournament{},
		&models.Team{},
		&models.Player{},
		&models.TournamentDay{},
		&models.TournamentDayTeam{},
		&models.Room{},
		&models.RoomTeamResult{},
		&models.PlayerRoomStat{},
		&models.User{},
	); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
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
	playerHandler := handlers.NewPlayerHandler(playerRepo)

	tournamentDayRepo := repository.NewTournamentDayRepository(database)
	dayTeamRepo := repository.NewTournamentDayTeamRepository(database)
	tournamentDayHandler := handlers.NewTournamentDayHandler(tournamentDayRepo, dayTeamRepo)

	roomRepo := repository.NewRoomRepository(database)
	roomHandler := handlers.NewRoomHandler(roomRepo)

	roomResultRepo := repository.NewRoomResultRepository(database)
	roomResultHandler := handlers.NewRoomResultHandler(roomResultRepo)

	userRepo := repository.NewUserRepository(database)
	authHandler := handlers.NewAuthHandler(userRepo, cfg)

	api := router.Group("/api/v1")
	{
		api.POST("/auth/register", middleware.RateLimit(1, 3), authHandler.Register)
		api.POST("/auth/login", middleware.RateLimit(1, 5), authHandler.Login)

		api.POST("/subscribe", middleware.RateLimit(1, 5), subscriberHandler.Subscribe)

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

		protected := api.Group("/")
		protected.Use(middleware.RequireAuth(cfg))
		{
			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireAdmin())
			{
				adminOnly.POST("/auth/accounts", authHandler.CreateAccount)
				adminOnly.GET("/auth/accounts", authHandler.ListAccounts)
				adminOnly.POST("/auth/accounts/:id/grant-admin", authHandler.GrantAdmin)
			}

			protected.POST("/tournaments", tournamentHandler.Create)
			protected.POST("/teams", teamHandler.Create)
			protected.POST("/players", playerHandler.Create)
			protected.POST("/tournament-days", tournamentDayHandler.Create)
			protected.POST("/tournament-days/:id/teams", tournamentDayHandler.AssignTeams)
			protected.POST("/rooms", roomHandler.Create)
			protected.POST("/rooms/:id/results", roomResultHandler.Submit)

			protected.PUT("/teams/:id", teamHandler.Update)
			protected.DELETE("/teams/:id", teamHandler.Delete)
			protected.PUT("/players/:id", playerHandler.Update)
			protected.DELETE("/players/:id", playerHandler.Delete)
			protected.PUT("/rooms/:id", roomHandler.Update)
			protected.DELETE("/rooms/:id", roomHandler.Delete)
		}
	}

	log.Printf("starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}
