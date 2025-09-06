package database

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"player-service/internal/models"

	"github.com/dgraph-io/badger/v4"
)

// PlayerRepositoryBadger handles database operations for players using BadgerDB
type PlayerRepositoryBadger struct{}

// NewPlayerRepositoryBadger creates a new player repository
func NewPlayerRepositoryBadger() *PlayerRepositoryBadger {
	return &PlayerRepositoryBadger{}
}

// CreatePlayer creates a new player in the database
func (r *PlayerRepositoryBadger) CreatePlayer(req *models.CreatePlayerRequest) (*models.Player, error) {
	// Generate ID
	id, err := GetNextID("player")
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

	// Store player
	if err := Set(id, player); err != nil {
		return nil, fmt.Errorf("failed to create player: %w", err)
	}

	return player, nil
}

// GetPlayer retrieves a player by ID
func (r *PlayerRepositoryBadger) GetPlayer(id string) (*models.Player, error) {
	var player models.Player
	if err := Get(id, &player); err != nil {
		return nil, fmt.Errorf("player not found")
	}
	return &player, nil
}

// GetPlayers retrieves all players with optional filtering
func (r *PlayerRepositoryBadger) GetPlayers(status, band string, limit, offset int) ([]*models.Player, error) {
	var players []*models.Player
	var processedCount int
	var skippedCount int

	// Use direct iteration instead of ListKeys to avoid memory issues
	err := DB.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = false
		it := txn.NewIterator(opts)
		defer it.Close()

		prefixBytes := []byte("player:")
		for it.Seek(prefixBytes); it.ValidForPrefix(prefixBytes); it.Next() {
			// Limit processing to prevent stack overflow
			if processedCount > 10000 { // Safety limit
				break
			}
			processedCount++

			item := it.Item()

			var player models.Player
			if err := item.Value(func(val []byte) error {
				return json.Unmarshal(val, &player)
			}); err != nil {
				continue // Skip invalid entries
			}

			// Apply filters
			if status != "" && player.Status != status {
				skippedCount++
				continue
			}
			if band != "" {
				if bandInt, err := strconv.Atoi(band); err == nil && player.Band != bandInt {
					skippedCount++
					continue
				}
			}

			players = append(players, &player)
		}
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get players: %w", err)
	}

	// Apply pagination
	if offset > 0 && offset < len(players) {
		players = players[offset:]
	}
	if limit > 0 && limit < len(players) {
		players = players[:limit]
	}

	return players, nil
}

// UpdatePlayer updates a player in the database
func (r *PlayerRepositoryBadger) UpdatePlayer(id string, req *models.UpdatePlayerRequest) (*models.Player, error) {
	// Get existing player
	existingPlayer, err := r.GetPlayer(id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
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

	// Update player
	if err := Set(id, existingPlayer); err != nil {
		return nil, fmt.Errorf("failed to update player: %w", err)
	}

	return existingPlayer, nil
}

// DeletePlayer deletes a player from the database
func (r *PlayerRepositoryBadger) DeletePlayer(id string) error {
	// Check if player exists
	exists, err := Exists(id)
	if err != nil {
		return fmt.Errorf("failed to check player existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("player not found")
	}

	// Delete player
	if err := Delete(id); err != nil {
		return fmt.Errorf("failed to delete player: %w", err)
	}

	return nil
}
