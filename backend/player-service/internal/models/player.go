package models

import (
	"time"
)

// Player represents a basketball player
type Player struct {
	ID                    string           `json:"id"`
	Name                  string           `json:"name"`
	PhotoURL              string           `json:"photoUrl,omitempty"`
	Band                  int              `json:"band"`
	Status                string           `json:"status"`
	SoldTo                string           `json:"soldTo,omitempty"`
	SoldPrice             float64          `json:"soldPrice,omitempty"`
	SoldInRound           int              `json:"soldInRound,omitempty"`
	SoldFromBand          int              `json:"soldFromBand,omitempty"`
	SoldFromBandName      string           `json:"soldFromBandName,omitempty"`
	SoldFromBandBasePrice float64          `json:"soldFromBandBasePrice,omitempty"`
	Skipped               bool             `json:"skipped"`
	BasketballStats       *BasketballStats `json:"basketballStats,omitempty"`
	CreatedAt             time.Time        `json:"createdAt"`
	UpdatedAt             time.Time        `json:"updatedAt"`
}

// BasketballStats represents a player's basketball statistics
type BasketballStats struct {
	WinPercentage        float64 `json:"winPercentage"`
	PointsAverage        float64 `json:"pointsAverage"`
	FieldGoalPercentage  float64 `json:"fieldGoalPercentage"`
	ThreePointPercentage float64 `json:"threePointPercentage"`
	FreeThrowPercentage  float64 `json:"freeThrowPercentage"`
	ReboundsAverage      float64 `json:"reboundsAverage"`
	AssistsAverage       float64 `json:"assistsAverage"`
	StealsAverage        float64 `json:"stealsAverage"`
	BlocksAverage        float64 `json:"blocksAverage"`
	TurnoversAverage     float64 `json:"turnoversAverage"`
	GamesPlayed          int     `json:"gamesPlayed"`
	MinutesPerGame       float64 `json:"minutesPerGame"`
}

// CreatePlayerRequest represents the request payload for creating a player
type CreatePlayerRequest struct {
	Name                  string           `json:"name" validate:"required,min=1,max=100"`
	PhotoURL              string           `json:"photoUrl,omitempty" validate:"omitempty,url"`
	Band                  int              `json:"band" validate:"min=1,max=10"`
	Status                string           `json:"status" validate:"oneof=available sold"`
	SoldTo                string           `json:"soldTo,omitempty" validate:"omitempty,min=1,max=100"`
	SoldPrice             float64          `json:"soldPrice,omitempty" validate:"omitempty,min=0"`
	SoldInRound           int              `json:"soldInRound,omitempty" validate:"omitempty,min=1"`
	SoldFromBand          int              `json:"soldFromBand,omitempty" validate:"omitempty,min=1,max=10"`
	SoldFromBandName      string           `json:"soldFromBandName,omitempty" validate:"omitempty,min=1,max=100"`
	SoldFromBandBasePrice float64          `json:"soldFromBandBasePrice,omitempty" validate:"omitempty,min=0"`
	Skipped               bool             `json:"skipped"`
	BasketballStats       *BasketballStats `json:"basketballStats,omitempty"`
}

// UpdatePlayerRequest represents the request payload for updating a player
type UpdatePlayerRequest struct {
	Name                  *string          `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	PhotoURL              *string          `json:"photoUrl,omitempty" validate:"omitempty,url"`
	Band                  *int             `json:"band,omitempty" validate:"omitempty,min=1,max=10"`
	Status                *string          `json:"status,omitempty" validate:"omitempty,oneof=available sold"`
	SoldTo                *string          `json:"soldTo,omitempty" validate:"omitempty,min=1,max=100"`
	SoldPrice             *float64         `json:"soldPrice,omitempty" validate:"omitempty,min=0"`
	SoldInRound           *int             `json:"soldInRound,omitempty" validate:"omitempty,min=1"`
	SoldFromBand          *int             `json:"soldFromBand,omitempty" validate:"omitempty,min=1,max=10"`
	SoldFromBandName      *string          `json:"soldFromBandName,omitempty" validate:"omitempty,min=1,max=100"`
	SoldFromBandBasePrice *float64         `json:"soldFromBandBasePrice,omitempty" validate:"omitempty,min=0"`
	Skipped               *bool            `json:"skipped,omitempty"`
	BasketballStats       *BasketballStats `json:"basketballStats,omitempty"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
