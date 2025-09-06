package database

import (
	"fmt"
	"time"

	"player-service/internal/models"
)

// TeamRepositoryBadger handles database operations for teams using BadgerDB
type TeamRepositoryBadger struct{}

// NewTeamRepositoryBadger creates a new team repository
func NewTeamRepositoryBadger() *TeamRepositoryBadger {
	return &TeamRepositoryBadger{}
}

// CreateTeam creates a new team in the database
func (r *TeamRepositoryBadger) CreateTeam(req *models.CreateTeamRequest) (*models.Team, error) {
	// Generate ID
	id, err := GetNextID("team")
	if err != nil {
		return nil, fmt.Errorf("failed to generate team ID: %w", err)
	}

	team := &models.Team{
		ID:              id,
		Name:            req.Name,
		Captain:         req.Captain,
		ViceCaptain:     req.ViceCaptain,
		Budget:          req.Budget,
		RemainingBudget: req.Budget, // Initially, remaining budget equals total budget
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Store team
	if err := Set(id, team); err != nil {
		return nil, fmt.Errorf("failed to create team: %w", err)
	}

	return team, nil
}

// GetTeam retrieves a team by ID
func (r *TeamRepositoryBadger) GetTeam(id string) (*models.Team, error) {
	var team models.Team
	if err := Get(id, &team); err != nil {
		return nil, fmt.Errorf("team not found")
	}

	// Initialize empty players array to avoid nil pointer issues
	team.Players = []models.Player{}

	return &team, nil
}

// GetTeams retrieves all teams with optional filtering
func (r *TeamRepositoryBadger) GetTeams(limit, offset int) ([]*models.Team, error) {
	keys, err := ListKeys("team:")
	if err != nil {
		return nil, fmt.Errorf("failed to get teams: %w", err)
	}

	var teams []*models.Team
	for _, key := range keys {
		var team models.Team
		if err := Get(key, &team); err != nil {
			continue // Skip invalid entries
		}

		// Initialize empty players array to avoid nil pointer issues
		team.Players = []models.Player{}

		teams = append(teams, &team)
	}

	// Apply pagination
	if offset > 0 && offset < len(teams) {
		teams = teams[offset:]
	}
	if limit > 0 && limit < len(teams) {
		teams = teams[:limit]
	}

	return teams, nil
}

// UpdateTeam updates a team in the database
func (r *TeamRepositoryBadger) UpdateTeam(id string, req *models.UpdateTeamRequest) (*models.Team, error) {
	// Get existing team
	existingTeam, err := r.GetTeam(id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		existingTeam.Name = *req.Name
	}
	if req.Captain != nil {
		existingTeam.Captain = *req.Captain
	}
	if req.ViceCaptain != nil {
		existingTeam.ViceCaptain = req.ViceCaptain
	}
	if req.Budget != nil {
		// Update remaining budget proportionally
		if existingTeam.Budget > 0 {
			ratio := existingTeam.RemainingBudget / existingTeam.Budget
			existingTeam.RemainingBudget = *req.Budget * ratio
		} else {
			existingTeam.RemainingBudget = *req.Budget
		}
		existingTeam.Budget = *req.Budget
	}
	if req.RemainingBudget != nil {
		existingTeam.RemainingBudget = *req.RemainingBudget
	}

	existingTeam.UpdatedAt = time.Now()

	// Update team
	if err := Set(id, existingTeam); err != nil {
		return nil, fmt.Errorf("failed to update team: %w", err)
	}

	return existingTeam, nil
}

// DeleteTeam deletes a team from the database
func (r *TeamRepositoryBadger) DeleteTeam(id string) error {
	// Check if team exists
	exists, err := Exists(id)
	if err != nil {
		return fmt.Errorf("failed to check team existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("team not found")
	}

	// Delete team
	if err := Delete(id); err != nil {
		return fmt.Errorf("failed to delete team: %w", err)
	}

	return nil
}

// AddPlayerToTeam adds a player to a team
func (r *TeamRepositoryBadger) AddPlayerToTeam(teamID, playerID string) error {
	// Check if team exists
	team, err := r.GetTeam(teamID)
	if err != nil {
		return fmt.Errorf("team not found: %w", err)
	}

	// Check if player exists
	playerRepo := NewPlayerRepositoryBadger()
	player, err := playerRepo.GetPlayer(playerID)
	if err != nil {
		return fmt.Errorf("player not found: %w", err)
	}

	// Check if player is already sold to another team
	if player.Status == "sold" && player.SoldTo != teamID {
		return fmt.Errorf("player is already sold to another team")
	}

	// Update player to be sold to this team
	updateReq := &models.UpdatePlayerRequest{
		Status: stringPtr("sold"),
		SoldTo: stringPtr(teamID),
	}

	_, err = playerRepo.UpdatePlayer(playerID, updateReq)
	if err != nil {
		return fmt.Errorf("failed to update player: %w", err)
	}

	// Update team's remaining budget (assuming player cost is based on band)
	playerCost := float64(player.Band) * 10000 // Example: Band 1 = 10k, Band 2 = 20k, etc.
	if team.RemainingBudget < playerCost {
		return fmt.Errorf("insufficient budget to add player")
	}

	team.RemainingBudget -= playerCost
	team.UpdatedAt = time.Now()

	// Update team
	if err := Set(teamID, team); err != nil {
		return fmt.Errorf("failed to update team: %w", err)
	}

	return nil
}

// RemovePlayerFromTeam removes a player from a team
func (r *TeamRepositoryBadger) RemovePlayerFromTeam(teamID, playerID string) error {
	// Check if team exists
	team, err := r.GetTeam(teamID)
	if err != nil {
		return fmt.Errorf("team not found: %w", err)
	}

	// Check if player exists and is sold to this team
	playerRepo := NewPlayerRepositoryBadger()
	player, err := playerRepo.GetPlayer(playerID)
	if err != nil {
		return fmt.Errorf("player not found: %w", err)
	}

	if player.SoldTo != teamID {
		return fmt.Errorf("player is not sold to this team")
	}

	// Update player to be available again
	updateReq := &models.UpdatePlayerRequest{
		Status: stringPtr("available"),
		SoldTo: stringPtr(""),
	}

	_, err = playerRepo.UpdatePlayer(playerID, updateReq)
	if err != nil {
		return fmt.Errorf("failed to update player: %w", err)
	}

	// Refund team's budget
	playerCost := float64(player.Band) * 10000
	team.RemainingBudget += playerCost
	team.UpdatedAt = time.Now()

	// Update team
	if err := Set(teamID, team); err != nil {
		return fmt.Errorf("failed to update team: %w", err)
	}

	return nil
}

// GetTeamPlayers retrieves all players belonging to a team
func (r *TeamRepositoryBadger) GetTeamPlayers(teamID string) ([]*models.Player, error) {
	// Check if team exists
	_, err := r.GetTeam(teamID)
	if err != nil {
		return nil, fmt.Errorf("team not found: %w", err)
	}

	// Get all players and filter by team
	playerRepo := NewPlayerRepositoryBadger()
	allPlayers, err := playerRepo.GetPlayers("sold", "", 0, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to get players: %w", err)
	}

	var teamPlayers []*models.Player
	for _, player := range allPlayers {
		if player.SoldTo == teamID {
			teamPlayers = append(teamPlayers, player)
		}
	}

	return teamPlayers, nil
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}
