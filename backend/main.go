package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"auction-backend/models"
	"auction-backend/services"
	"auction-backend/store"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func loadInitialData() {
	// Read JSON file
	data, err := ioutil.ReadFile("data/auction-data.json")
	if err != nil {
		fmt.Println("No initial JSON found:", err)
		return
	}

	var obj map[string]json.RawMessage
	if err := json.Unmarshal(data, &obj); err != nil {
		fmt.Println("Error parsing JSON:", err)
		return
	}

	// Players
	var players []models.Player
	err = json.Unmarshal(obj["players"], &players)
	if err != nil {
		fmt.Println("Error parsing JSON:", err)
	}
	for _, p := range players {
		_ = store.Save("players", p.ID, p)
	}
	// Auctions
	var auctions []models.Auction
	_ = json.Unmarshal([]byte(obj["auctions"]), &auctions)
	for _, a := range auctions {
		_ = store.Save("auctions", a.ID, a)
	}

	// Games
	var games []models.Game
	_ = json.Unmarshal(obj["games"], &games)
	for _, g := range games {
		_ = store.Save("games", g.ID, g)
	}

	fmt.Println("Initial data loaded into BoltDB with images downloaded")
}

func main() {
	dbFile := "auction.db"
	imagesDir := "images"
	baseURL := "http://localhost:8080"

	// Check if DB already exists
	_, err := os.Stat(dbFile)
	dbExists := err == nil

	if err := store.InitDB(dbFile); err != nil {
		panic(err)
	}

	// Initialize image service
	imageService := services.NewImageService(imagesDir, baseURL)

	// Only load from JSON if DB is new
	if !dbExists {
		loadInitialData()
	} else {
		fmt.Println("Using existing BoltDB:", dbFile)
	}

	r := gin.Default()

	// Add CORS middleware
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Serve static images
	r.Static("/images", imagesDir)

	// API endpoints
	r.GET("/players", func(c *gin.Context) {
		var list []models.Player
		_ = store.GetAll("players", &list)

		// Check and download images for each player
		for i, player := range list {
			if player.PhotoUrl != "" {
				// Check if image already exists locally
				if localPath, exists := imageService.ImageExists(player.Name); exists {
					// Update player with local image path
					list[i].PhotoUrl = localPath
				} else {
					// Download image if it doesn't exist locally
					fmt.Printf("Downloading image for player %s...\n", player.Name)
					localImagePath, err := imageService.DownloadImage(player.PhotoUrl, player.Name)
					if err != nil {
						fmt.Printf("Failed to download image for player %s: %v\n", player.Name, err)
						// Keep original URL as fallback
					} else {
						// Update player with local image path
						list[i].PhotoUrl = localImagePath
						// Save updated player to database
						_ = store.Save("players", player.ID, list[i])
						fmt.Printf("Downloaded image for player %s: %s\n", player.Name, localImagePath)
					}
				}
			}
		}

		c.JSON(http.StatusOK, list)
	})

	r.GET("/auctions", func(c *gin.Context) {
		var list []models.Auction
		_ = store.GetAll("auctions", &list)
		c.JSON(http.StatusOK, list)
	})

	r.GET("/games", func(c *gin.Context) {
		var list []models.Game
		_ = store.GetAll("games", &list)
		c.JSON(http.StatusOK, list)
	})

	// Create new player API endpoint
	r.PUT("/players", func(c *gin.Context) {
		var newPlayer models.Player
		if err := c.ShouldBindJSON(&newPlayer); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
			return
		}

		// Validate required fields
		if newPlayer.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Player name is required"})
			return
		}

		// Generate ID if not provided
		if newPlayer.ID == "" {
			newPlayer.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		}

		// Download image if photoUrl is provided
		if newPlayer.PhotoUrl != "" {
			fmt.Printf("Downloading image for new player %s...\n", newPlayer.Name)
			localImagePath, err := imageService.DownloadImage(newPlayer.PhotoUrl, newPlayer.Name)
			if err != nil {
				fmt.Printf("Failed to download image for player %s: %v\n", newPlayer.Name, err)
				// Keep original URL as fallback
			} else {
				// Update player with local image path
				newPlayer.PhotoUrl = localImagePath
				fmt.Printf("Downloaded image for player %s: %s\n", newPlayer.Name, localImagePath)
			}
		}

		// Save player to database
		if err := store.Save("players", newPlayer.ID, newPlayer); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save player"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Player created successfully",
			"player":  newPlayer,
		})
	})

	// Image API endpoint
	r.GET("/players/:id/image", func(c *gin.Context) {
		playerID := c.Param("id")

		// Get player from database
		var players []models.Player
		_ = store.GetAll("players", &players)

		var player *models.Player
		for _, p := range players {
			if p.ID == playerID {
				player = &p
				break
			}
		}

		if player == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
			return
		}

		// Find the image file by player name
		imagePath, err := imageService.FindImageByPlayerName(player.Name)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Player image not found"})
			return
		}

		// Detect content type from file extension
		contentType := "image/jpeg" // Default
		if strings.HasSuffix(strings.ToLower(imagePath), ".png") {
			contentType = "image/png"
		} else if strings.HasSuffix(strings.ToLower(imagePath), ".gif") {
			contentType = "image/gif"
		} else if strings.HasSuffix(strings.ToLower(imagePath), ".webp") {
			contentType = "image/webp"
		} else if strings.HasSuffix(strings.ToLower(imagePath), ".svg") {
			contentType = "image/svg+xml"
		}

		// Set appropriate headers for image response
		c.Header("Content-Type", contentType)
		c.Header("Cache-Control", "public, max-age=3600") // Cache for 1 hour

		// Serve the image file
		c.File(imagePath)
	})

	fmt.Printf("Server starting on :8080\n")
	fmt.Printf("Images will be served from: %s\n", filepath.Join(imagesDir))
	r.Run(":8080")
}
