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

	api := router.Group("/api/v1")
	{
		api.POST("/subscribe", subscriberHandler.Subscribe)
	}

	log.Printf("starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}
