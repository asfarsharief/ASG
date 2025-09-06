package handlers

import (
	"net/http"
	"strconv"

	"player-service/internal/database"
	"player-service/internal/models"

	"github.com/gin-gonic/gin"
)

// TeamHandlerBadgerGin handles HTTP requests for team operations using BadgerDB and Gin
type TeamHandlerBadgerGin struct {
	repo *database.TeamRepositoryBadger
}

// NewTeamHandlerBadgerGin creates a new team handler
func NewTeamHandlerBadgerGin() *TeamHandlerBadgerGin {
	return &TeamHandlerBadgerGin{
		repo: database.NewTeamRepositoryBadger(),
	}
}

// GetTeams handles GET /api/v1/teams
func (h *TeamHandlerBadgerGin) GetTeams(c *gin.Context) {
	// Parse query parameters
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

	teams, err := h.repo.GetTeams(limit, offset)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to get teams", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Teams retrieved successfully",
		"data":    teams,
	})
}

// GetTeam handles GET /api/v1/teams/{id}
func (h *TeamHandlerBadgerGin) GetTeam(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	team, err := h.repo.GetTeam(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusNotFound, "Team not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Team retrieved successfully",
		"data":    team,
	})
}

// CreateTeam handles POST /api/v1/teams
func (h *TeamHandlerBadgerGin) CreateTeam(c *gin.Context) {
	var req models.CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate required fields
	if req.Name == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team name is required", nil)
		return
	}

	if req.Captain == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team captain is required", nil)
		return
	}

	if req.Budget <= 0 {
		h.sendErrorResponse(c, http.StatusBadRequest, "Valid budget amount is required", nil)
		return
	}

	team, err := h.repo.CreateTeam(&req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to create team", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Team created successfully",
		"data":    team,
	})
}

// UpdateTeam handles PUT /api/v1/teams/{id}
func (h *TeamHandlerBadgerGin) UpdateTeam(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	var req models.UpdateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	team, err := h.repo.UpdateTeam(id, &req)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to update team", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Team updated successfully",
		"data":    team,
	})
}

// DeleteTeam handles DELETE /api/v1/teams/{id}
func (h *TeamHandlerBadgerGin) DeleteTeam(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	err := h.repo.DeleteTeam(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to delete team", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Team deleted successfully",
	})
}

// GetTeamPlayers handles GET /api/v1/teams/{id}/players
func (h *TeamHandlerBadgerGin) GetTeamPlayers(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	players, err := h.repo.GetTeamPlayers(id)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to get team players", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Team players retrieved successfully",
		"data":    players,
	})
}

// AddPlayerToTeam handles POST /api/v1/teams/{id}/players
func (h *TeamHandlerBadgerGin) AddPlayerToTeam(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	var req models.AddPlayerToTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if req.PlayerID == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	err := h.repo.AddPlayerToTeam(id, req.PlayerID)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to add player to team", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player added to team successfully",
	})
}

// RemovePlayerFromTeam handles DELETE /api/v1/teams/{id}/players/{playerId}
func (h *TeamHandlerBadgerGin) RemovePlayerFromTeam(c *gin.Context) {
	id := c.Param("id")
	playerID := c.Param("playerId")

	if id == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	if playerID == "" {
		h.sendErrorResponse(c, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	err := h.repo.RemovePlayerFromTeam(id, playerID)
	if err != nil {
		h.sendErrorResponse(c, http.StatusInternalServerError, "Failed to remove player from team", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Player removed from team successfully",
	})
}

// sendErrorResponse sends an error response
func (h *TeamHandlerBadgerGin) sendErrorResponse(c *gin.Context, statusCode int, message string, err error) {
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

