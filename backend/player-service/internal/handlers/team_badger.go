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

// TeamHandlerBadger handles HTTP requests for team operations using BadgerDB
type TeamHandlerBadger struct {
	repo *database.TeamRepositoryBadger
}

// NewTeamHandlerBadger creates a new team handler
func NewTeamHandlerBadger() *TeamHandlerBadger {
	return &TeamHandlerBadger{
		repo: database.NewTeamRepositoryBadger(),
	}
}

// GetTeams handles GET /api/v1/teams
func (h *TeamHandlerBadger) GetTeams(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	fmt.Println("GetTeams")
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

	teams, err := h.repo.GetTeams(limit, offset)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get teams", err)
		return
	}

	fmt.Println("Teams retrieved successfully", teams)
	h.sendSuccessResponse(w, http.StatusOK, "Teams retrieved successfully", teams)
}

// GetTeam handles GET /api/v1/teams/{id}
func (h *TeamHandlerBadger) GetTeam(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GetTeam")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	team, err := h.repo.GetTeam(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Team not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get team", err)
		}
		return
	}

	fmt.Println("Team retrieved successfully", team)
	h.sendSuccessResponse(w, http.StatusOK, "Team retrieved successfully", team)
}

// CreateTeam handles POST /api/v1/teams
func (h *TeamHandlerBadger) CreateTeam(w http.ResponseWriter, r *http.Request) {
	fmt.Println("CreateTeam")
	var req models.CreateTeamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Basic validation
	if req.Name == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team name is required", nil)
		return
	}

	if req.Captain == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team captain is required", nil)
		return
	}

	if req.Budget < 0 {
		h.sendErrorResponse(w, http.StatusBadRequest, "Budget must be non-negative", nil)
		return
	}

	team, err := h.repo.CreateTeam(&req)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to create team", err)
		return
	}

	fmt.Println("Team created successfully", team)
	h.sendSuccessResponse(w, http.StatusCreated, "Team created successfully", team)
}

// UpdateTeam handles PUT /api/v1/teams/{id}
func (h *TeamHandlerBadger) UpdateTeam(w http.ResponseWriter, r *http.Request) {
	fmt.Println("UpdateTeam")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	var req models.UpdateTeamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate budget if provided
	if req.Budget != nil && *req.Budget < 0 {
		h.sendErrorResponse(w, http.StatusBadRequest, "Budget must be non-negative", nil)
		return
	}

	team, err := h.repo.UpdateTeam(id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Team not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to update team", err)
		}
		return
	}

	fmt.Println("Team updated successfully", team)
	h.sendSuccessResponse(w, http.StatusOK, "Team updated successfully", team)
}

// DeleteTeam handles DELETE /api/v1/teams/{id}
func (h *TeamHandlerBadger) DeleteTeam(w http.ResponseWriter, r *http.Request) {
	fmt.Println("DeleteTeam")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	err := h.repo.DeleteTeam(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Team not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to delete team", err)
		}
		return
	}

	fmt.Println("Team deleted successfully")
	h.sendSuccessResponse(w, http.StatusOK, "Team deleted successfully", nil)
}

// GetTeamPlayers handles GET /api/v1/teams/{id}/players
func (h *TeamHandlerBadger) GetTeamPlayers(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GetTeamPlayers")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	players, err := h.repo.GetTeamPlayers(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Team not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get team players", err)
		}
		return
	}

	fmt.Println("Team players retrieved successfully", players)
	h.sendSuccessResponse(w, http.StatusOK, "Team players retrieved successfully", players)
}

// AddPlayerToTeam handles POST /api/v1/teams/{id}/players
func (h *TeamHandlerBadger) AddPlayerToTeam(w http.ResponseWriter, r *http.Request) {
	fmt.Println("AddPlayerToTeam")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	var req models.AddPlayerToTeamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if req.PlayerID == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	err := h.repo.AddPlayerToTeam(id, req.PlayerID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Team or player not found", err)
		} else if strings.Contains(err.Error(), "already sold") {
			h.sendErrorResponse(w, http.StatusConflict, "Player is already sold to another team", err)
		} else if strings.Contains(err.Error(), "insufficient budget") {
			h.sendErrorResponse(w, http.StatusBadRequest, "Insufficient budget to add player", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to add player to team", err)
		}
		return
	}

	fmt.Println("Player added to team successfully")
	h.sendSuccessResponse(w, http.StatusOK, "Player added to team successfully", nil)
}

// RemovePlayerFromTeam handles DELETE /api/v1/teams/{id}/players/{playerId}
func (h *TeamHandlerBadger) RemovePlayerFromTeam(w http.ResponseWriter, r *http.Request) {
	fmt.Println("RemovePlayerFromTeam")
	vars := mux.Vars(r)
	id := vars["id"]
	playerID := vars["playerId"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Team ID is required", nil)
		return
	}

	if playerID == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	err := h.repo.RemovePlayerFromTeam(id, playerID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Team or player not found", err)
		} else if strings.Contains(err.Error(), "not sold to this team") {
			h.sendErrorResponse(w, http.StatusBadRequest, "Player is not sold to this team", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to remove player from team", err)
		}
		return
	}

	fmt.Println("Player removed from team successfully")
	h.sendSuccessResponse(w, http.StatusOK, "Player removed from team successfully", nil)
}

// sendSuccessResponse sends a successful JSON response
func (h *TeamHandlerBadger) sendSuccessResponse(w http.ResponseWriter, statusCode int, message string, data interface{}) {
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
func (h *TeamHandlerBadger) sendErrorResponse(w http.ResponseWriter, statusCode int, message string, err error) {
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
