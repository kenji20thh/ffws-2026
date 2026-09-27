package main

import (
	"log"

	"ffws/internal/config"
	"ffws/internal/db"
	"ffws/internal/handlers"
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

	api := router.Group("/api/v1")
	{
		api.POST("/subscribe", subscriberHandler.Subscribe)

		api.POST("/tournaments", tournamentHandler.Create)
		api.GET("/tournaments", tournamentHandler.List)
		api.GET("/tournaments/:slug", tournamentHandler.GetBySlug)

		api.POST("/teams", teamHandler.Create)
		api.GET("/teams", teamHandler.List)
		api.GET("/teams/:id", teamHandler.GetByID)

		api.POST("/players", playerHandler.Create)
		api.GET("/players", playerHandler.List)
		api.GET("/players/:id", playerHandler.GetByID)

		api.POST("/tournament-days", tournamentDayHandler.Create)
		api.GET("/tournament-days", tournamentDayHandler.List)
		api.GET("/tournament-days/:id", tournamentDayHandler.GetByID)
		api.POST("/tournament-days/:id/teams", tournamentDayHandler.AssignTeams)
		api.GET("/tournament-days/:id/teams", tournamentDayHandler.GetTeams)

		api.POST("/rooms", roomHandler.Create)
		api.GET("/rooms", roomHandler.List)
		api.GET("/rooms/:id", roomHandler.GetByID)
	}

	log.Printf("starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}
