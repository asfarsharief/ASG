package database

import (
	"fmt"
	"time"

	"player-service/internal/models"

	"github.com/dgraph-io/badger/v4"
)

// SafePlayerRepository provides stack-safe player operations
type SafePlayerRepository struct {
	safeDB *SafeBadgerDB
}

// NewSafePlayerRepository creates a new safe player repository
func NewSafePlayerRepository(safeDB *SafeBadgerDB) *SafePlayerRepository {
	return &SafePlayerRepository{safeDB: safeDB}
}

// GetPlayers retrieves all players with optional filtering using stack-safe operations
func (r *SafePlayerRepository) GetPlayers(status, band string, limit, offset int) ([]*models.Player, error) {
	var players []*models.Player

	// Set reasonable limits
	if limit <= 0 || limit > 1000 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	err := r.safeDB.SafeIteratePlayers(status, band, limit, offset, func(player *models.Player) bool {
		players = append(players, player)
		return true
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get players: %w", err)
	}

	return players, nil
}

// GetPlayer retrieves a player by ID using stack-safe operations
func (r *SafePlayerRepository) GetPlayer(id string) (*models.Player, error) {
	var player models.Player
	err := r.safeDB.SafeGet(id, &player)
	if err != nil {
		return nil, fmt.Errorf("player not found: %w", err)
	}
	return &player, nil
}

// CreatePlayer creates a new player using stack-safe operations
func (r *SafePlayerRepository) CreatePlayer(req *models.CreatePlayerRequest) (*models.Player, error) {
	// Generate ID using safe method
	id, err := r.safeDB.SafeGetNextID("player")
	if err != nil {
		return nil, fmt.Errorf("failed to generate player ID: %w", err)
	}

	player := &models.Player{
		ID:                    id,
		Name:                  req.Name,
		PhotoURL:              req.PhotoURL,
		Band:                  req.Band,
		Status:                req.Status,
		SoldTo:                req.SoldTo,
		SoldPrice:             req.SoldPrice,
		SoldInRound:           req.SoldInRound,
		SoldFromBand:          req.SoldFromBand,
		SoldFromBandName:      req.SoldFromBandName,
		SoldFromBandBasePrice: req.SoldFromBandBasePrice,
		Skipped:               req.Skipped,
		BasketballStats:       req.BasketballStats,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	// Store player using safe method
	if err := r.safeDB.SafeSet(id, player); err != nil {
		return nil, fmt.Errorf("failed to create player: %w", err)
	}

	return player, nil
}

// UpdatePlayer updates a player using stack-safe operations
func (r *SafePlayerRepository) UpdatePlayer(id string, req *models.UpdatePlayerRequest) (*models.Player, error) {
	// Get existing player
	existingPlayer, err := r.GetPlayer(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Name != nil {
		existingPlayer.Name = *req.Name
	}
	if req.PhotoURL != nil {
		existingPlayer.PhotoURL = *req.PhotoURL
	}
	if req.Band != nil {
		existingPlayer.Band = *req.Band
	}
	if req.Status != nil {
		existingPlayer.Status = *req.Status
	}
	if req.SoldTo != nil {
		existingPlayer.SoldTo = *req.SoldTo
	}
	if req.SoldPrice != nil {
		existingPlayer.SoldPrice = *req.SoldPrice
	}
	if req.SoldInRound != nil {
		existingPlayer.SoldInRound = *req.SoldInRound
	}
	if req.SoldFromBand != nil {
		existingPlayer.SoldFromBand = *req.SoldFromBand
	}
	if req.SoldFromBandName != nil {
		existingPlayer.SoldFromBandName = *req.SoldFromBandName
	}
	if req.SoldFromBandBasePrice != nil {
		existingPlayer.SoldFromBandBasePrice = *req.SoldFromBandBasePrice
	}
	if req.Skipped != nil {
		existingPlayer.Skipped = *req.Skipped
	}
	if req.BasketballStats != nil {
		existingPlayer.BasketballStats = req.BasketballStats
	}

	existingPlayer.UpdatedAt = time.Now()

	// Save updated player
	if err := r.safeDB.SafeSet(id, existingPlayer); err != nil {
		return nil, fmt.Errorf("failed to update player: %w", err)
	}

	return existingPlayer, nil
}

// DeletePlayer deletes a player using stack-safe operations
func (r *SafePlayerRepository) DeletePlayer(id string) error {
	// Check if player exists
	_, err := r.GetPlayer(id)
	if err != nil {
		return err
	}

	// Delete player
	return r.safeDB.db.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte(id))
	})
}
