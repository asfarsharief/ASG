package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"auction-backend/models"
	"auction-backend/store"

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
	_ = json.Unmarshal(obj["players"], &players)
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

	fmt.Println("Initial data loaded into BoltDB")
}

func main() {
	dbFile := "auction.db"

	// Check if DB already exists
	_, err := os.Stat(dbFile)
	dbExists := err == nil

	if err := store.InitDB(dbFile); err != nil {
		panic(err)
	}

	// Only load from JSON if DB is new
	if !dbExists {
		loadInitialData()
	} else {
		fmt.Println("Using existing BoltDB:", dbFile)
	}

	r := gin.Default()

	r.GET("/players", func(c *gin.Context) {
		var list []models.Player
		_ = store.GetAll("players", &list)
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

	r.Run(":8080")
}
