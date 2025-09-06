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

// PlayerHandlerBadger handles HTTP requests for player operations using BadgerDB
type PlayerHandlerBadger struct {
	repo *database.PlayerRepositoryBadger
}

// NewPlayerHandlerBadger creates a new player handler
func NewPlayerHandlerBadger() *PlayerHandlerBadger {
	return &PlayerHandlerBadger{
		repo: database.NewPlayerRepositoryBadger(),
	}
}

// GetPlayers handles GET /api/v1/players
func (h *PlayerHandlerBadger) GetPlayers(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	fmt.Println("GetPlayers")
	status := r.URL.Query().Get("status")
	band := r.URL.Query().Get("band")
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

	players, err := h.repo.GetPlayers(status, band, limit, offset)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get players", err)
		return
	}

	fmt.Println("Players retrieved successfully", players)
	h.sendSuccessResponse(w, http.StatusOK, "Players retrieved successfully", players)
}

// GetPlayer handles GET /api/v1/players/{id}
func (h *PlayerHandlerBadger) GetPlayer(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GetPlayer")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	player, err := h.repo.GetPlayer(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Player not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get player", err)
		}
		return
	}

	fmt.Println("Player retrieved successfully", player)
	h.sendSuccessResponse(w, http.StatusOK, "Player retrieved successfully", player)
}

// CreatePlayer handles POST /api/v1/players
func (h *PlayerHandlerBadger) CreatePlayer(w http.ResponseWriter, r *http.Request) {
	fmt.Println("CreatePlayer")
	var req models.CreatePlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Basic validation
	if req.Name == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player name is required", nil)
		return
	}

	if req.Band < 1 || req.Band > 10 {
		h.sendErrorResponse(w, http.StatusBadRequest, "Band must be between 1 and 10", nil)
		return
	}

	if req.Status != "" && req.Status != "available" && req.Status != "sold" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Status must be 'available' or 'sold'", nil)
		return
	}

	player, err := h.repo.CreatePlayer(&req)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to create player", err)
		return
	}

	fmt.Println("Player created successfully", player)
	h.sendSuccessResponse(w, http.StatusCreated, "Player created successfully", player)
}

// UpdatePlayer handles PUT /api/v1/players/{id}
func (h *PlayerHandlerBadger) UpdatePlayer(w http.ResponseWriter, r *http.Request) {
	fmt.Println("UpdatePlayer")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	var req models.UpdatePlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate band if provided
	if req.Band != nil && (*req.Band < 1 || *req.Band > 10) {
		h.sendErrorResponse(w, http.StatusBadRequest, "Band must be between 1 and 10", nil)
		return
	}

	// Validate status if provided
	if req.Status != nil && *req.Status != "available" && *req.Status != "sold" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Status must be 'available' or 'sold'", nil)
		return
	}

	player, err := h.repo.UpdatePlayer(id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Player not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to update player", err)
		}
		return
	}

	fmt.Println("Player updated successfully", player)
	h.sendSuccessResponse(w, http.StatusOK, "Player updated successfully", player)
}

// DeletePlayer handles DELETE /api/v1/players/{id}
func (h *PlayerHandlerBadger) DeletePlayer(w http.ResponseWriter, r *http.Request) {
	fmt.Println("DeletePlayer")
	vars := mux.Vars(r)
	id := vars["id"]

	if id == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Player ID is required", nil)
		return
	}

	err := h.repo.DeletePlayer(id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.sendErrorResponse(w, http.StatusNotFound, "Player not found", err)
		} else {
			h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to delete player", err)
		}
		return
	}

	fmt.Println("Player deleted successfully")
	h.sendSuccessResponse(w, http.StatusOK, "Player deleted successfully", nil)
}

// sendSuccessResponse sends a successful JSON response
func (h *PlayerHandlerBadger) sendSuccessResponse(w http.ResponseWriter, statusCode int, message string, data interface{}) {
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
func (h *PlayerHandlerBadger) sendErrorResponse(w http.ResponseWriter, statusCode int, message string, err error) {
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
