package main

import (
	"log"

	"ffws/internal/config"
	"ffws/internal/db"
	"ffws/internal/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	database := db.Connect(cfg)
	_ = database // will be passed into repositories starting Day 2

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // tighten this before launch
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	router.GET("/health", handlers.HealthCheck)

	api := router.Group("/api/v1")
	{
		api.POST("/subscribe", handlers.HealthCheck) // placeholder, we'll build this next
	}

	log.Printf("starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}
