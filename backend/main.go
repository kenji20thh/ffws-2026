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
		&models.TeamStaff{},
		&models.TournamentDay{},
		&models.TournamentDayTeam{},
		&models.Room{},
		&models.RoomTeamResult{},
		&models.PlayerRoomStat{},
		&models.User{},
		&models.FantasyTeam{},
		&models.FantasySelection{},
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

	fantasyRepo := repository.NewFantasyRepository(database)
	fantasyHandler := handlers.NewFantasyHandler(fantasyRepo)

	api := router.Group("/api/v1")
	{
		api.POST("/auth/register", middleware.RateLimit(1, 3), authHandler.Register)
		api.POST("/auth/login", middleware.RateLimit(1, 5), authHandler.Login)

		api.POST("/subscribe", middleware.RateLimit(1, 5), subscriberHandler.Subscribe)

		api.GET("/teams/:id/stats", teamStatsHandler.GetProfile)
		api.GET("/teams/:id/staff", teamStaffHandler.List)

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
		api.GET("/fantasy/schedule", fantasyHandler.GetSchedule)

		api.GET("/fantasy/players", fantasyHandler.GetPlayerPool)
		api.GET("/fantasy/standings", fantasyHandler.GetStandings)
		api.GET("/fantasy/teams/:id", fantasyHandler.GetTeamProfile)

		protected := api.Group("/")
		protected.Use(middleware.RequireAuth(cfg))
		{
			protected.POST("/fantasy/team", fantasyHandler.CreateTeam)
			protected.GET("/fantasy/team", fantasyHandler.GetMyTeam)
			protected.GET("/fantasy/team/selections/:dayId", fantasyHandler.GetMySelection)
			protected.POST("/fantasy/team/selections/:dayId", fantasyHandler.SubmitSelection)

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
			}
		}
	}

	log.Printf("starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}
