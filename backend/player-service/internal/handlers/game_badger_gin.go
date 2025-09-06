package handlers

import (
	"net/http"
	"strconv"

	"player-service/internal/database"
	"player-service/internal/models"

	"github.com/gin-gonic/gin"
)

// GameHandlerBadgerGin handles HTTP requests for game operations using BadgerDB and Gin
type GameHandlerBadgerGin struct {
	repo *database.GameRepositoryBadger
}

// NewGameHandlerBadgerGin creates a new game handler
func NewGameHandlerBadgerGin() *GameHandlerBadgerGin {
	return &GameHandlerBadgerGin{
		repo: database.NewGameRepositoryBadger(),
	}
}

// GetGames handles GET /api/v1/games
func (h *GameHandlerBadgerGin) GetGames(c *gin.Context) {
	// Parse query parameters
	teamID := c.Query("team_id")
	date := c.Query("date")
	limitStr := c.Query("limit")
	offsetStr := c.Query("offset")

	limit := 0
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	games, err := h.repo.GetGames(teamID, date, limit, offset)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to get games", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Games retrieved successfully",
		"data":    games,
	})
}

// GetGame handles GET /api/v1/games/{id}
func (h *GameHandlerBadgerGin) GetGame(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	game, err := h.repo.GetGame(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusNotFound, "Game not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Game retrieved successfully",
		"data":    game,
	})
}

// CreateGame handles POST /api/v1/games
func (h *GameHandlerBadgerGin) CreateGame(c *gin.Context) {
	var req models.CreateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate required fields
	if req.GameName == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game name is required", nil)
		return
	}

	if req.GameDate == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game date is required", nil)
		return
	}

	if req.HomeTeamId == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Home team ID is required", nil)
		return
	}

	if req.AwayTeamId == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Away team ID is required", nil)
		return
	}

	game, err := h.repo.CreateGame(&req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to create game", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Game created successfully",
		"data":    game,
	})
}

// UpdateGame handles PUT /api/v1/games/{id}
func (h *GameHandlerBadgerGin) UpdateGame(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	var req models.UpdateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	game, err := h.repo.UpdateGame(id, &req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to update game", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Game updated successfully",
		"data":    game,
	})
}

// DeleteGame handles DELETE /api/v1/games/{id}
func (h *GameHandlerBadgerGin) DeleteGame(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	err := h.repo.DeleteGame(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to delete game", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Game deleted successfully",
	})
}

// GetGameStats handles GET /api/v1/games/{id}/stats
func (h *GameHandlerBadgerGin) GetGameStats(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	stats, err := h.repo.GetPlayerStatsForGame(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to get game stats", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Game stats retrieved successfully",
		"data":    stats,
	})
}

// AddPlayerStats handles POST /api/v1/games/{id}/stats
func (h *GameHandlerBadgerGin) AddPlayerStats(c *gin.Context) {
	gameID := c.Param("id")
	if gameID == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	var req models.AddPlayerStatsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate required fields
	if req.PlayerId == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	if req.PlayerName == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player name is required", nil)
		return
	}

	if req.TeamId == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	if req.TeamName == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team name is required", nil)
		return
	}

	stats, err := h.repo.AddPlayerStats(gameID, &req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to add player stats", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Player stats added successfully",
		"data":    stats,
	})
}

// UpdatePlayerStats handles PUT /api/v1/games/{id}/stats/{statId}
func (h *GameHandlerBadgerGin) UpdatePlayerStats(c *gin.Context) {
	gameID := c.Param("id")
	statID := c.Param("statId")

	if gameID == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	if statID == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Stat ID is required", nil)
		return
	}

	var req models.UpdatePlayerStatsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	stats, err := h.repo.UpdatePlayerStats(gameID, statID, &req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to update player stats", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player stats updated successfully",
		"data":    stats,
	})
}

// DeletePlayerStats handles DELETE /api/v1/games/{id}/stats/{statId}
func (h *GameHandlerBadgerGin) DeletePlayerStats(c *gin.Context) {
	gameID := c.Param("id")
	statID := c.Param("statId")

	if gameID == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	if statID == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Stat ID is required", nil)
		return
	}

	err := h.repo.DeletePlayerStats(gameID, statID)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to delete player stats", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player stats deleted successfully",
	})
}

// sendErrorResponse sends an error response
func (h *GameHandlerBadgerGin) sendErrorResponse(c *gin.Context, statusCode int, message string, err error) {
	errorMsg := message
	if err != nil {
		errorMsg = message + ": " + err.Error()
	}

	c.JSON(statusCode, gin.H{
		"success": false,
		"message": errorMsg,
		"error":   err.Error(),
	})
}
