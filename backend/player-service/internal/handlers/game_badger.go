package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"player-service/internal/database"
	"player-service/internal/models"

	"github.com/gorilla/mux"
)

// GameHandlerBadger handles HTTP requests for game operations using BadgerDB
type GameHandlerBadger struct {
	repo *database.GameRepositoryBadger
}

// NewGameHandlerBadger creates a new game handler
func NewGameHandlerBadger() *GameHandlerBadger {
	return &GameHandlerBadger{
		repo: database.NewGameRepositoryBadger(),
	}
}

// GetGames handles GET /api/v1/games
func (h *GameHandlerBadger) GetGames(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	fmt.Println("GetGames")
	teamID := r.URL.Query().Get("team_id")
	date := r.URL.Query().Get("date")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

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
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get games", err)
		return
	}
	fmt.Println("Games retrieved successfully", games)
	h.sendSuccessResponse(w, http.StatusOK, "Games retrieved successfully", games)
}

// GetGame handles GET /api/v1/games/{id}
func (h *GameHandlerBadger) GetGame(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GetGame")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	game, err := h.repo.GetGame(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Game not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get game", err)
		}
		return
	}

	fmt.Println("Game retrieved successfully", game)
	h.sendSuccessResponse(w, http.StatusOK, "Game retrieved successfully", game)
}

// CreateGame handles POST /api/v1/games
func (h *GameHandlerBadger) CreateGame(w http.ResponseWriter, r *http.Request) {
	fmt.Println("CreateGame")
	var req models.CreateGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Basic validation
	if req.GameName == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game name is required", nil)
		return
	}

	if req.GameDate == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game date is required", nil)
		return
	}

	if req.HomeTeamId == "" || req.AwayTeamId == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Both home and away team IDs are required", nil)
		return
	}

	if req.HomeTeamId == req.AwayTeamId {
		h.sendErrorResponse(w, http.StatusBadRequest, "Home and away teams must be different", nil)
		return
	}

	game, err := h.repo.CreateGame(&req)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to create game", err)
		return
	}

	fmt.Println("Game created successfully", game)
	h.sendSuccessResponse(w, http.StatusCreated, "Game created successfully", game)
}

// UpdateGame handles PUT /api/v1/games/{id}
func (h *GameHandlerBadger) UpdateGame(w http.ResponseWriter, r *http.Request) {
	fmt.Println("UpdateGame")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	var req models.UpdateGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate scores if provided
	if req.HomeScore != nil && *req.HomeScore < 0 {
		h.sendErrorResponse(w, http.StatusBadRequest, "Home score must be non-negative", nil)
		return
	}

	if req.AwayScore != nil && *req.AwayScore < 0 {
		h.sendErrorResponse(w, http.StatusBadRequest, "Away score must be non-negative", nil)
		return
	}

	game, err := h.repo.UpdateGame(id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Game not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to update game", err)
		}
		return
	}

	fmt.Println("Game updated successfully", game)
	h.sendSuccessResponse(w, http.StatusOK, "Game updated successfully", game)
}

// DeleteGame handles DELETE /api/v1/games/{id}
func (h *GameHandlerBadger) DeleteGame(w http.ResponseWriter, r *http.Request) {
	fmt.Println("DeleteGame")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	err := h.repo.DeleteGame(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Game not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to delete game", err)
		}
		return
	}

	fmt.Println("Game deleted successfully")
	h.sendSuccessResponse(w, http.StatusOK, "Game deleted successfully", nil)
}

// GetGameStats handles GET /api/v1/games/{id}/stats
func (h *GameHandlerBadger) GetGameStats(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GetGameStats")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	stats, err := h.repo.GetPlayerStatsForGame(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Game not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get game stats", err)
		}
		return
	}

	fmt.Println("Game stats retrieved successfully", stats)
	h.sendSuccessResponse(w, http.StatusOK, "Game stats retrieved successfully", stats)
}

// AddPlayerStats handles POST /api/v1/games/{id}/stats
func (h *GameHandlerBadger) AddPlayerStats(w http.ResponseWriter, r *http.Request) {
	fmt.Println("AddPlayerStats")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	var req models.AddPlayerStatsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Basic validation
	if req.PlayerId == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	if req.PlayerName == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player name is required", nil)
		return
	}

	if req.TeamId == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	if req.TeamName == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team name is required", nil)
		return
	}

	stats, err := h.repo.AddPlayerStats(id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Game not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to add player stats", err)
		}
		return
	}

	fmt.Println("Player stats added successfully", stats)
	h.sendSuccessResponse(w, http.StatusCreated, "Player stats added successfully", stats)
}

// UpdatePlayerStats handles PUT /api/v1/games/{id}/stats/{statId}
func (h *GameHandlerBadger) UpdatePlayerStats(w http.ResponseWriter, r *http.Request) {
	fmt.Println("UpdatePlayerStats")
	vars := mux.Vars(r)
	gameID := vars["id"]
	statID := vars["statId"]

	if gameID == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	if statID == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Stat ID is required", nil)
		return
	}

	var req models.UpdatePlayerStatsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate scores if provided
	if req.Points != nil && *req.Points < 0 {
		h.sendErrorResponse(w, http.StatusBadRequest, "Points must be non-negative", nil)
		return
	}

	if req.MinutesPlayed != nil && *req.MinutesPlayed < 0 {
		h.sendErrorResponse(w, http.StatusBadRequest, "Minutes played must be non-negative", nil)
		return
	}

	stats, err := h.repo.UpdatePlayerStats(gameID, statID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Game or stats not found", err)
		} else if strings.Contains(err.Error(), "do not belong") {
			h.sendErrorResponse(w, http.StatusBadRequest, "Stats do not belong to this game", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to update player stats", err)
		}
		return
	}

	fmt.Println("Player stats updated successfully", stats)
	h.sendSuccessResponse(w, http.StatusOK, "Player stats updated successfully", stats)
}

// DeletePlayerStats handles DELETE /api/v1/games/{id}/stats/{statId}
func (h *GameHandlerBadger) DeletePlayerStats(w http.ResponseWriter, r *http.Request) {
	fmt.Println("DeletePlayerStats")
	vars := mux.Vars(r)
	gameID := vars["id"]
	statID := vars["statId"]

	if gameID == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Game ID is required", nil)
		return
	}

	if statID == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Stat ID is required", nil)
		return
	}

	err := h.repo.DeletePlayerStats(gameID, statID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Game or stats not found", err)
		} else if strings.Contains(err.Error(), "do not belong") {
			h.sendErrorResponse(w, http.StatusBadRequest, "Stats do not belong to this game", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to delete player stats", err)
		}
		return
	}

	fmt.Println("Player stats deleted successfully")
	h.sendSuccessResponse(w, http.StatusOK, "Player stats deleted successfully", nil)
}

// sendSuccessResponse sends a successful JSON response
func (h *GameHandlerBadger) sendSuccessResponse(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := models.APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	}

	json.NewEncoder(w).Encode(response)
}

// sendErrorResponse sends an error JSON response
func (h *GameHandlerBadger) sendErrorResponse(w http.ResponseWriter, statusCode int, message string, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := models.APIResponse{
		Success: false,
		Message: message,
	}

	if err != nil {
		response.Error = err.Error()
	}

	json.NewEncoder(w).Encode(response)
}
