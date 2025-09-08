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
	baseURL := "http://localhost:10000"

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
	r.POST("/players", func(c *gin.Context) {
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

		// Check and download image if photoUrl is provided
		if newPlayer.PhotoUrl != "" {
			// Check if image already exists locally
			if localPath, exists := imageService.ImageExists(newPlayer.Name); exists {
				fmt.Printf("Image already exists for player %s: %s\n", newPlayer.Name, localPath)
			} else {
				// Download image if it doesn't exist locally
				fmt.Printf("Downloading image for new player %s...\n", newPlayer.Name)
				localImagePath, err := imageService.DownloadImage(newPlayer.PhotoUrl, newPlayer.Name)
				if err != nil {
					fmt.Printf("Failed to download image for player %s: %v\n", newPlayer.Name, err)
					// Keep original URL as fallback
				} else {
					fmt.Printf("Downloaded image for player %s: %s\n", newPlayer.Name, localImagePath)
				}
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

	// Update player API endpoint
	r.PUT("/players/:id", func(c *gin.Context) {
		playerID := c.Param("id")

		// Get existing player from database
		var players []models.Player
		_ = store.GetAll("players", &players)

		var existingPlayer *models.Player
		for _, p := range players {
			if p.ID == playerID {
				existingPlayer = &p
				break
			}
		}

		if existingPlayer == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
			return
		}

		var updatedPlayer models.Player
		if err := c.ShouldBindJSON(&updatedPlayer); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
			return
		}

		// Validate required fields
		if updatedPlayer.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Player name is required"})
			return
		}

		// Preserve the original ID
		updatedPlayer.ID = playerID

		// Check and download image if photoUrl is provided and different from existing
		if updatedPlayer.PhotoUrl != "" && updatedPlayer.PhotoUrl != existingPlayer.PhotoUrl {
			// Check if image already exists locally
			if localPath, exists := imageService.ImageExists(updatedPlayer.Name); exists {
				fmt.Printf("Image already exists for player %s: %s\n", updatedPlayer.Name, localPath)
			} else {
				// Download image if it doesn't exist locally
				fmt.Printf("Downloading image for updated player %s...\n", updatedPlayer.Name)
				localImagePath, err := imageService.DownloadImage(updatedPlayer.PhotoUrl, updatedPlayer.Name)
				if err != nil {
					fmt.Printf("Failed to download image for player %s: %v\n", updatedPlayer.Name, err)
					// Keep original URL as fallback
				} else {
					fmt.Printf("Downloaded image for player %s: %s\n", updatedPlayer.Name, localImagePath)
				}
			}
		}

		// Save updated player to database
		if err := store.Save("players", playerID, updatedPlayer); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update player"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Player updated successfully",
			"player":  updatedPlayer,
		})
	})

	// Delete player API endpoint
	r.DELETE("/players/:id", func(c *gin.Context) {
		playerID := c.Param("id")

		// Get existing player from database
		var players []models.Player
		_ = store.GetAll("players", &players)

		var existingPlayer *models.Player
		for _, p := range players {
			if p.ID == playerID {
				existingPlayer = &p
				break
			}
		}

		if existingPlayer == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
			return
		}

		// Delete player from database
		if err := store.Delete("players", playerID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete player"})
			return
		}

		// Clean up player image if it exists
		if existingPlayer.PhotoUrl != "" {
			fmt.Printf("Cleaning up image for deleted player %s...\n", existingPlayer.Name)
			// Note: We don't delete the image immediately as it might be referenced by other data
			// The cleanup will happen during the periodic cleanup process
		}

		c.JSON(http.StatusOK, gin.H{
			"message":  "Player deleted successfully",
			"playerId": playerID,
		})
	})

	// Create new game API endpoint
	r.POST("/games", func(c *gin.Context) {
		var newGame models.Game
		if err := c.ShouldBindJSON(&newGame); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
			return
		}

		// Validate required fields
		if newGame.GameName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Game name is required"})
			return
		}
		if newGame.GameDate == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Game date is required"})
			return
		}
		if newGame.HomeTeamName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Home team name is required"})
			return
		}
		if newGame.AwayTeamName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Away team name is required"})
			return
		}

		// Generate ID if not provided
		if newGame.ID == "" {
			newGame.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		}

		// Save game to database
		if err := store.Save("games", newGame.ID, newGame); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save game"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Game created successfully",
			"game":    newGame,
		})
	})

	// Update game API endpoint
	r.PUT("/games/:id", func(c *gin.Context) {
		gameID := c.Param("id")

		// Get existing game from database
		var games []models.Game
		_ = store.GetAll("games", &games)

		var existingGame *models.Game
		for _, g := range games {
			if g.ID == gameID {
				existingGame = &g
				break
			}
		}

		if existingGame == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
			return
		}

		var updatedGame models.Game
		if err := c.ShouldBindJSON(&updatedGame); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
			return
		}

		// Validate required fields
		if updatedGame.GameName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Game name is required"})
			return
		}
		if updatedGame.GameDate == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Game date is required"})
			return
		}
		if updatedGame.HomeTeamName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Home team name is required"})
			return
		}
		if updatedGame.AwayTeamName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Away team name is required"})
			return
		}

		// Preserve the original ID
		updatedGame.ID = gameID

		// Save updated game to database
		if err := store.Save("games", gameID, updatedGame); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update game"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Game updated successfully",
			"game":    updatedGame,
		})
	})

	// Delete game API endpoint
	r.DELETE("/games/:id", func(c *gin.Context) {
		gameID := c.Param("id")

		// Get existing game from database
		var games []models.Game
		_ = store.GetAll("games", &games)

		var existingGame *models.Game
		for _, g := range games {
			if g.ID == gameID {
				existingGame = &g
				break
			}
		}

		if existingGame == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
			return
		}

		// Delete game from database
		if err := store.Delete("games", gameID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete game"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Game deleted successfully",
			"gameId":  gameID,
		})
	})

	// Sync auction data from frontend to backend
	r.POST("/auctions/sync", func(c *gin.Context) {
		var auctionData struct {
			Auctions []models.Auction `json:"auctions"`
		}

		if err := c.ShouldBindJSON(&auctionData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
			return
		}

		if len(auctionData.Auctions) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No auction data provided"})
			return
		}

		// Clear existing auctions in database
		var existingAuctions []models.Auction
		_ = store.GetAll("auctions", &existingAuctions)

		// Delete all existing auctions
		for _, auction := range existingAuctions {
			store.Delete("auctions", auction.ID)
		}

		// Save new auction data to database
		syncedCount := 0
		for _, auction := range auctionData.Auctions {
			if err := store.Save("auctions", auction.ID, auction); err != nil {
				fmt.Printf("Failed to save auction %s: %v\n", auction.ID, err)
				continue
			}
			syncedCount++
		}

		c.JSON(http.StatusOK, gin.H{
			"message":       "Auction data synced successfully",
			"syncedCount":   syncedCount,
			"totalAuctions": len(auctionData.Auctions),
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

	fmt.Printf("Server starting on :10000\n")
	fmt.Printf("Images will be served from: %s\n", filepath.Join(imagesDir))
	r.Run(":10000")
}
