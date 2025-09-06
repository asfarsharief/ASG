package database

import (
	"fmt"
	"time"

	"player-service/internal/models"
)

// GameRepositoryBadger handles database operations for games using BadgerDB
type GameRepositoryBadger struct{}

// NewGameRepositoryBadger creates a new game repository
func NewGameRepositoryBadger() *GameRepositoryBadger {
	return &GameRepositoryBadger{}
}

// CreateGame creates a new game in the database
func (r *GameRepositoryBadger) CreateGame(req *models.CreateGameRequest) (*models.Game, error) {
	// Generate ID
	id, err := GetNextID("game")
	if err != nil {
		return nil, fmt.Errorf("failed to generate game ID: %w", err)
	}

	// Determine game result
	var gameResult string
	if req.HomeScore > req.AwayScore {
		gameResult = "home_win"
	} else if req.AwayScore > req.HomeScore {
		gameResult = "away_win"
	} else {
		gameResult = "tie"
	}

	game := &models.Game{
		ID:           id,
		GameName:     req.GameName,
		GameDate:     req.GameDate,
		HomeTeamId:   req.HomeTeamId,
		HomeTeamName: req.HomeTeamName,
		AwayTeamId:   req.AwayTeamId,
		AwayTeamName: req.AwayTeamName,
		HomeScore:    req.HomeScore,
		AwayScore:    req.AwayScore,
		GameResult:   gameResult,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Store game
	if err := Set(id, game); err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}

	return game, nil
}

// GetGame retrieves a game by ID
func (r *GameRepositoryBadger) GetGame(id string) (*models.Game, error) {
	var game models.Game
	if err := Get(id, &game); err != nil {
		return nil, fmt.Errorf("game not found")
	}

	// Populate player stats for this game
	stats, err := r.GetPlayerStatsForGame(game.ID)
	if err == nil {
		game.PlayerStats = make([]models.PlayerGameStats, len(stats))
		for i, stat := range stats {
			game.PlayerStats[i] = *stat
		}
	}

	return &game, nil
}

// GetGames retrieves all games with optional filtering
func (r *GameRepositoryBadger) GetGames(teamID, date string, limit, offset int) ([]*models.Game, error) {
	keys, err := ListKeys("game:")
	if err != nil {
		return nil, fmt.Errorf("failed to get games: %w", err)
	}

	var games []*models.Game
	for _, key := range keys {
		var game models.Game
		if err := Get(key, &game); err != nil {
			continue // Skip invalid entries
		}

		// Apply filters
		if teamID != "" && game.HomeTeamId != teamID && game.AwayTeamId != teamID {
			continue
		}
		if date != "" && game.GameDate != date {
			continue
		}

		// Populate player stats for this game
		stats, err := r.GetPlayerStatsForGame(game.ID)
		if err == nil {
			game.PlayerStats = make([]models.PlayerGameStats, len(stats))
			for i, stat := range stats {
				game.PlayerStats[i] = *stat
			}
		}

		games = append(games, &game)
	}

	// Apply pagination
	if offset > 0 && offset < len(games) {
		games = games[offset:]
	}
	if limit > 0 && limit < len(games) {
		games = games[:limit]
	}

	return games, nil
}

// UpdateGame updates a game in the database
func (r *GameRepositoryBadger) UpdateGame(id string, req *models.UpdateGameRequest) (*models.Game, error) {
	// Get existing game
	existingGame, err := r.GetGame(id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.GameName != nil {
		existingGame.GameName = *req.GameName
	}
	if req.GameDate != nil {
		existingGame.GameDate = *req.GameDate
	}
	if req.HomeTeamId != nil {
		existingGame.HomeTeamId = *req.HomeTeamId
	}
	if req.HomeTeamName != nil {
		existingGame.HomeTeamName = *req.HomeTeamName
	}
	if req.AwayTeamId != nil {
		existingGame.AwayTeamId = *req.AwayTeamId
	}
	if req.AwayTeamName != nil {
		existingGame.AwayTeamName = *req.AwayTeamName
	}
	if req.HomeScore != nil {
		existingGame.HomeScore = *req.HomeScore
	}
	if req.AwayScore != nil {
		existingGame.AwayScore = *req.AwayScore
	}

	// Recalculate game result
	if req.HomeScore != nil || req.AwayScore != nil {
		if existingGame.HomeScore > existingGame.AwayScore {
			existingGame.GameResult = "home_win"
		} else if existingGame.AwayScore > existingGame.HomeScore {
			existingGame.GameResult = "away_win"
		} else {
			existingGame.GameResult = "tie"
		}
	}

	existingGame.UpdatedAt = time.Now()

	// Update game
	if err := Set(id, existingGame); err != nil {
		return nil, fmt.Errorf("failed to update game: %w", err)
	}

	return existingGame, nil
}

// DeleteGame deletes a game from the database
func (r *GameRepositoryBadger) DeleteGame(id string) error {
	// Check if game exists
	exists, err := Exists(id)
	if err != nil {
		return fmt.Errorf("failed to check game existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("game not found")
	}

	// Delete all player stats for this game first
	statsKeys, err := ListKeys("game_stats:" + id + ":")
	if err == nil {
		for _, key := range statsKeys {
			Delete(key)
		}
	}

	// Delete game
	if err := Delete(id); err != nil {
		return fmt.Errorf("failed to delete game: %w", err)
	}

	return nil
}

// AddPlayerStats adds player statistics to a game
func (r *GameRepositoryBadger) AddPlayerStats(gameID string, req *models.AddPlayerStatsRequest) (*models.PlayerGameStats, error) {
	// Check if game exists
	_, err := r.GetGame(gameID)
	if err != nil {
		return nil, fmt.Errorf("game not found: %w", err)
	}

	// Generate stats ID
	statsID, err := GetNextID("game_stats:" + gameID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate stats ID: %w", err)
	}

	stats := &models.PlayerGameStats{
		ID:                     statsID,
		PlayerId:               req.PlayerId,
		PlayerName:             req.PlayerName,
		TeamId:                 req.TeamId,
		TeamName:               req.TeamName,
		GameId:                 gameID,
		MinutesPlayed:          req.MinutesPlayed,
		Points:                 req.Points,
		FieldGoalsMade:         req.FieldGoalsMade,
		FieldGoalsAttempted:    req.FieldGoalsAttempted,
		ThreePointersMade:      req.ThreePointersMade,
		ThreePointersAttempted: req.ThreePointersAttempted,
		FreeThrowsMade:         req.FreeThrowsMade,
		FreeThrowsAttempted:    req.FreeThrowsAttempted,
		Rebounds:               req.Rebounds,
		Assists:                req.Assists,
		Steals:                 req.Steals,
		Blocks:                 req.Blocks,
		Turnovers:              req.Turnovers,
		PersonalFouls:          req.PersonalFouls,
		PlusMinus:              req.PlusMinus,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}

	// Store stats
	if err := Set(statsID, stats); err != nil {
		return nil, fmt.Errorf("failed to create player stats: %w", err)
	}

	return stats, nil
}

// UpdatePlayerStats updates player statistics for a game
func (r *GameRepositoryBadger) UpdatePlayerStats(gameID, statsID string, req *models.UpdatePlayerStatsRequest) (*models.PlayerGameStats, error) {
	// Get existing stats
	var stats models.PlayerGameStats
	if err := Get(statsID, &stats); err != nil {
		return nil, fmt.Errorf("player stats not found")
	}

	// Verify stats belong to the game
	if stats.GameId != gameID {
		return nil, fmt.Errorf("stats do not belong to this game")
	}

	// Update fields if provided
	if req.MinutesPlayed != nil {
		stats.MinutesPlayed = *req.MinutesPlayed
	}
	if req.Points != nil {
		stats.Points = *req.Points
	}
	if req.FieldGoalsMade != nil {
		stats.FieldGoalsMade = *req.FieldGoalsMade
	}
	if req.FieldGoalsAttempted != nil {
		stats.FieldGoalsAttempted = *req.FieldGoalsAttempted
	}
	if req.ThreePointersMade != nil {
		stats.ThreePointersMade = *req.ThreePointersMade
	}
	if req.ThreePointersAttempted != nil {
		stats.ThreePointersAttempted = *req.ThreePointersAttempted
	}
	if req.FreeThrowsMade != nil {
		stats.FreeThrowsMade = *req.FreeThrowsMade
	}
	if req.FreeThrowsAttempted != nil {
		stats.FreeThrowsAttempted = *req.FreeThrowsAttempted
	}
	if req.Rebounds != nil {
		stats.Rebounds = *req.Rebounds
	}
	if req.Assists != nil {
		stats.Assists = *req.Assists
	}
	if req.Steals != nil {
		stats.Steals = *req.Steals
	}
	if req.Blocks != nil {
		stats.Blocks = *req.Blocks
	}
	if req.Turnovers != nil {
		stats.Turnovers = *req.Turnovers
	}
	if req.PersonalFouls != nil {
		stats.PersonalFouls = *req.PersonalFouls
	}
	if req.PlusMinus != nil {
		stats.PlusMinus = *req.PlusMinus
	}

	stats.UpdatedAt = time.Now()

	// Update stats
	if err := Set(statsID, &stats); err != nil {
		return nil, fmt.Errorf("failed to update player stats: %w", err)
	}

	return &stats, nil
}

// DeletePlayerStats deletes player statistics from a game
func (r *GameRepositoryBadger) DeletePlayerStats(gameID, statsID string) error {
	// Get existing stats to verify they belong to the game
	var stats models.PlayerGameStats
	if err := Get(statsID, &stats); err != nil {
		return fmt.Errorf("player stats not found")
	}

	if stats.GameId != gameID {
		return fmt.Errorf("stats do not belong to this game")
	}

	// Delete stats
	if err := Delete(statsID); err != nil {
		return fmt.Errorf("failed to delete player stats: %w", err)
	}

	return nil
}

// GetPlayerStatsForGame retrieves all player statistics for a specific game
func (r *GameRepositoryBadger) GetPlayerStatsForGame(gameID string) ([]*models.PlayerGameStats, error) {
	// Check if game exists
	_, err := r.GetGame(gameID)
	if err != nil {
		return nil, fmt.Errorf("game not found: %w", err)
	}

	// Get all stats for this game
	keys, err := ListKeys("game_stats:" + gameID + ":")
	if err != nil {
		return nil, fmt.Errorf("failed to get player stats: %w", err)
	}

	var stats []*models.PlayerGameStats
	for _, key := range keys {
		var stat models.PlayerGameStats
		if err := Get(key, &stat); err != nil {
			continue // Skip invalid entries
		}
		stats = append(stats, &stat)
	}

	return stats, nil
}
