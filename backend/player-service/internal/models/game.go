package models

import (
	"time"
)

// Game represents a basketball game
type Game struct {
	ID           string            `json:"id"`
	GameName     string            `json:"gameName"`
	GameDate     string            `json:"gameDate"`
	HomeTeamId   string            `json:"homeTeamId"`
	HomeTeamName string            `json:"homeTeamName"`
	AwayTeamId   string            `json:"awayTeamId"`
	AwayTeamName string            `json:"awayTeamName"`
	HomeScore    int               `json:"homeScore"`
	AwayScore    int               `json:"awayScore"`
	GameResult   string            `json:"gameResult"` // home_win, away_win, tie
	PlayerStats  []PlayerGameStats `json:"playerStats,omitempty"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}

// GameWithStats represents a game with player statistics
type GameWithStats struct {
	Game
	PlayerStats []PlayerGameStats `json:"playerStats"`
}

// PlayerGameStats represents a player's statistics for a specific game
type PlayerGameStats struct {
	ID                     string    `json:"id"`
	PlayerId               string    `json:"playerId"`
	PlayerName             string    `json:"playerName"`
	TeamId                 string    `json:"teamId"`
	TeamName               string    `json:"teamName"`
	GameId                 string    `json:"gameId"`
	MinutesPlayed          int       `json:"minutesPlayed"`
	Points                 int       `json:"points"`
	FieldGoalsMade         int       `json:"fieldGoalsMade"`
	FieldGoalsAttempted    int       `json:"fieldGoalsAttempted"`
	ThreePointersMade      int       `json:"threePointersMade"`
	ThreePointersAttempted int       `json:"threePointersAttempted"`
	FreeThrowsMade         int       `json:"freeThrowsMade"`
	FreeThrowsAttempted    int       `json:"freeThrowsAttempted"`
	Rebounds               int       `json:"rebounds"`
	Assists                int       `json:"assists"`
	Steals                 int       `json:"steals"`
	Blocks                 int       `json:"blocks"`
	Turnovers              int       `json:"turnovers"`
	PersonalFouls          int       `json:"personalFouls"`
	PlusMinus              int       `json:"plusMinus"`
	CreatedAt              time.Time `json:"createdAt"`
	UpdatedAt              time.Time `json:"updatedAt"`
}

// CreateGameRequest represents the request payload for creating a game
type CreateGameRequest struct {
	GameName     string `json:"gameName" validate:"required,min=1,max=200"`
	GameDate     string `json:"gameDate" validate:"required"`
	HomeTeamId   string `json:"homeTeamId" validate:"required"`
	HomeTeamName string `json:"homeTeamName" validate:"required,min=1,max=100"`
	AwayTeamId   string `json:"awayTeamId" validate:"required"`
	AwayTeamName string `json:"awayTeamName" validate:"required,min=1,max=100"`
	HomeScore    int    `json:"homeScore" validate:"min=0"`
	AwayScore    int    `json:"awayScore" validate:"min=0"`
}

// UpdateGameRequest represents the request payload for updating a game
type UpdateGameRequest struct {
	GameName     *string `json:"gameName,omitempty" validate:"omitempty,min=1,max=200"`
	GameDate     *string `json:"gameDate,omitempty"`
	HomeTeamId   *string `json:"homeTeamId,omitempty"`
	HomeTeamName *string `json:"homeTeamName,omitempty" validate:"omitempty,min=1,max=100"`
	AwayTeamId   *string `json:"awayTeamId,omitempty"`
	AwayTeamName *string `json:"awayTeamName,omitempty" validate:"omitempty,min=1,max=100"`
	HomeScore    *int    `json:"homeScore,omitempty" validate:"omitempty,min=0"`
	AwayScore    *int    `json:"awayScore,omitempty" validate:"omitempty,min=0"`
}

// AddPlayerStatsRequest represents the request to add player stats to a game
type AddPlayerStatsRequest struct {
	PlayerId               string `json:"playerId" validate:"required"`
	PlayerName             string `json:"playerName" validate:"required"`
	TeamId                 string `json:"teamId" validate:"required"`
	TeamName               string `json:"teamName" validate:"required"`
	MinutesPlayed          int    `json:"minutesPlayed" validate:"min=0"`
	Points                 int    `json:"points" validate:"min=0"`
	FieldGoalsMade         int    `json:"fieldGoalsMade" validate:"min=0"`
	FieldGoalsAttempted    int    `json:"fieldGoalsAttempted" validate:"min=0"`
	ThreePointersMade      int    `json:"threePointersMade" validate:"min=0"`
	ThreePointersAttempted int    `json:"threePointersAttempted" validate:"min=0"`
	FreeThrowsMade         int    `json:"freeThrowsMade" validate:"min=0"`
	FreeThrowsAttempted    int    `json:"freeThrowsAttempted" validate:"min=0"`
	Rebounds               int    `json:"rebounds" validate:"min=0"`
	Assists                int    `json:"assists" validate:"min=0"`
	Steals                 int    `json:"steals" validate:"min=0"`
	Blocks                 int    `json:"blocks" validate:"min=0"`
	Turnovers              int    `json:"turnovers" validate:"min=0"`
	PersonalFouls          int    `json:"personalFouls" validate:"min=0"`
	PlusMinus              int    `json:"plusMinus"`
}

// UpdatePlayerStatsRequest represents the request to update player stats
type UpdatePlayerStatsRequest struct {
	MinutesPlayed          *int `json:"minutesPlayed,omitempty" validate:"omitempty,min=0"`
	Points                 *int `json:"points,omitempty" validate:"omitempty,min=0"`
	FieldGoalsMade         *int `json:"fieldGoalsMade,omitempty" validate:"omitempty,min=0"`
	FieldGoalsAttempted    *int `json:"fieldGoalsAttempted,omitempty" validate:"omitempty,min=0"`
	ThreePointersMade      *int `json:"threePointersMade,omitempty" validate:"omitempty,min=0"`
	ThreePointersAttempted *int `json:"threePointersAttempted,omitempty" validate:"omitempty,min=0"`
	FreeThrowsMade         *int `json:"freeThrowsMade,omitempty" validate:"omitempty,min=0"`
	FreeThrowsAttempted    *int `json:"freeThrowsAttempted,omitempty" validate:"omitempty,min=0"`
	Rebounds               *int `json:"rebounds,omitempty" validate:"omitempty,min=0"`
	Assists                *int `json:"assists,omitempty" validate:"omitempty,min=0"`
	Steals                 *int `json:"steals,omitempty" validate:"omitempty,min=0"`
	Blocks                 *int `json:"blocks,omitempty" validate:"omitempty,min=0"`
	Turnovers              *int `json:"turnovers,omitempty" validate:"omitempty,min=0"`
	PersonalFouls          *int `json:"personalFouls,omitempty" validate:"omitempty,min=0"`
	PlusMinus              *int `json:"plusMinus,omitempty"`
}
