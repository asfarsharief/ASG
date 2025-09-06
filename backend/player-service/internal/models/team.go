package models

import (
	"time"
)

// Team represents a basketball team
type Team struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Captain         string    `json:"captain"`
	ViceCaptain     *string   `json:"viceCaptain,omitempty"`
	Budget          float64   `json:"budget"`
	RemainingBudget float64   `json:"remainingBudget"`
	Players         []Player  `json:"players,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// TeamWithPlayers represents a team with its players
type TeamWithPlayers struct {
	Team
	Players []Player `json:"players"`
}

// CreateTeamRequest represents the request payload for creating a team
type CreateTeamRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=100"`
	Captain     string  `json:"captain" validate:"required,min=1,max=100"`
	ViceCaptain *string `json:"viceCaptain,omitempty" validate:"omitempty,min=1,max=100"`
	Budget      float64 `json:"budget" validate:"required,min=0"`
}

// UpdateTeamRequest represents the request payload for updating a team
type UpdateTeamRequest struct {
	Name            *string  `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Captain         *string  `json:"captain,omitempty" validate:"omitempty,min=1,max=100"`
	ViceCaptain     *string  `json:"viceCaptain,omitempty" validate:"omitempty,min=1,max=100"`
	Budget          *float64 `json:"budget,omitempty" validate:"omitempty,min=0"`
	RemainingBudget *float64 `json:"remainingBudget,omitempty" validate:"omitempty,min=0"`
}

// AddPlayerToTeamRequest represents the request to add a player to a team
type AddPlayerToTeamRequest struct {
	PlayerID string `json:"playerId" validate:"required"`
}

// RemovePlayerFromTeamRequest represents the request to remove a player from a team
type RemovePlayerFromTeamRequest struct {
	PlayerID string `json:"playerId" validate:"required"`
}
