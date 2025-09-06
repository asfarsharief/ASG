package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"player-service/internal/database"
	"player-service/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/rs/cors"
)

func main() {
	// Initialize BadgerDB connection
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data"
	}

	db, err := database.InitBadgerDB(dbPath)
	if err != nil {
		log.Fatal("Failed to initialize BadgerDB:", err)
	}
	defer database.CloseBadgerDB(db)

	// Initialize safe database wrapper
	safeDB := database.NewSafeBadgerDB(db)

	// Initialize handlers
	playerHandler := handlers.NewSafePlayerHandlerGin(safeDB)
	teamHandler := handlers.NewTeamHandlerBadgerGin()
	gameHandler := handlers.NewGameHandlerBadgerGin()

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode) // Set to gin.DebugMode for development
	router := gin.New()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Timeout middleware to prevent long-running requests
	router.Use(func(c *gin.Context) {
		c.Next()
	})

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	// Apply CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "*")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// API routes
	api := router.Group("/api/v1")

	// Player routes
	api.GET("/players", playerHandler.GetPlayers)
	api.POST("/players", playerHandler.CreatePlayer)
	api.GET("/players/:id", playerHandler.GetPlayer)
	api.PUT("/players/:id", playerHandler.UpdatePlayer)
	api.DELETE("/players/:id", playerHandler.DeletePlayer)

	// Team routes
	api.GET("/teams", teamHandler.GetTeams)
	api.POST("/teams", teamHandler.CreateTeam)
	api.GET("/teams/:id", teamHandler.GetTeam)
	api.PUT("/teams/:id", teamHandler.UpdateTeam)
	api.DELETE("/teams/:id", teamHandler.DeleteTeam)
	api.GET("/teams/:id/players", teamHandler.GetTeamPlayers)
	api.POST("/teams/:id/players", teamHandler.AddPlayerToTeam)
	api.DELETE("/teams/:id/players/:playerId", teamHandler.RemovePlayerFromTeam)

	// Game routes
	api.GET("/games", gameHandler.GetGames)
	api.POST("/games", gameHandler.CreateGame)
	api.GET("/games/:id", gameHandler.GetGame)
	api.PUT("/games/:id", gameHandler.UpdateGame)
	api.DELETE("/games/:id", gameHandler.DeleteGame)
	api.GET("/games/:id/stats", gameHandler.GetGameStats)
	api.POST("/games/:id/stats", gameHandler.AddPlayerStats)
	api.PUT("/games/:id/stats/:statId", gameHandler.UpdatePlayerStats)
	api.DELETE("/games/:id/stats/:statId", gameHandler.DeletePlayerStats)

	// Health check
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "OK",
			"message": "Server is running",
		})
	})

	// Start server
	server := &http.Server{
		Addr:    ":8080",
		Handler: c.Handler(router),
	}

	// Start server in a goroutine
	go func() {
		log.Println("Server starting on :8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Server shutting down...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
