package handlers

import (
	"net/http"
	"strconv"

	"player-service/internal/database"
	"player-service/internal/models"

	"github.com/gin-gonic/gin"
)

// SafePlayerHandlerGin handles HTTP requests for player operations using stack-safe operations
type SafePlayerHandlerGin struct {
	repo *database.SafePlayerRepository
}

// NewSafePlayerHandlerGin creates a new safe player handler
func NewSafePlayerHandlerGin(safeDB *database.SafeBadgerDB) *SafePlayerHandlerGin {
	return &SafePlayerHandlerGin{
		repo: database.NewSafePlayerRepository(safeDB),
	}
}

// GetPlayers handles GET /api/v1/players
func (h *SafePlayerHandlerGin) GetPlayers(c *gin.Context) {
	// Parse query parameters
	status := c.Query("status")
	bandStr := c.Query("band")
	limitStr := c.Query("limit")
	offsetStr := c.Query("offset")

	limit := 0
	offset := 0
	band := 0

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

	if bandStr != "" {
		if b, err := strconv.Atoi(bandStr); err == nil && b > 0 {
			band = b
		}
	}

	// Set reasonable limits to prevent stack overflow
	if limit <= 0 || limit > 1000 {
		limit = 100 // Default limit
	}
	if offset < 0 {
		offset = 0
	}

	var bandParam string
	if band > 0 {
		bandParam = strconv.Itoa(band)
	}

	players, err := h.repo.GetPlayers(status, bandParam, limit, offset)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to get players", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Players retrieved successfully",
		"data":    players,
		"count":   len(players),
		"limit":   limit,
		"offset":  offset,
	})
}

// GetPlayer handles GET /api/v1/players/{id}
func (h *SafePlayerHandlerGin) GetPlayer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	player, err := h.repo.GetPlayer(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusNotFound, "Player not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player retrieved successfully",
		"data":    player,
	})
}

// CreatePlayer handles POST /api/v1/players
func (h *SafePlayerHandlerGin) CreatePlayer(c *gin.Context) {
	var req models.CreatePlayerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate required fields
	if req.Name == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player name is required", nil)
		return
	}

	if req.Band <= 0 {
		h.sendErrorResponse(c, http.StatusBadRequest, "Valid band number is required", nil)
		return
	}

	player, err := h.repo.CreatePlayer(&req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to create player", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Player created successfully",
		"data":    player,
	})
}

// UpdatePlayer handles PUT /api/v1/players/{id}
func (h *SafePlayerHandlerGin) UpdatePlayer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	var req models.UpdatePlayerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	player, err := h.repo.UpdatePlayer(id, &req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to update player", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player updated successfully",
		"data":    player,
	})
}

// DeletePlayer handles DELETE /api/v1/players/{id}
func (h *SafePlayerHandlerGin) DeletePlayer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	err := h.repo.DeletePlayer(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to delete player", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player deleted successfully",
	})
}

// sendErrorResponse sends an error response
func (h *SafePlayerHandlerGin) sendErrorResponse(c *gin.Context, statusCode int, message string, err error) {
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
