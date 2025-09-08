package models

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

type Player struct {
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	Status          string           `json:"status"`
	BasketballStats *BasketballStats `json:"basketballStats,omitempty"`
	PhotoUrl        string           `json:"photoUrl,omitempty"`
}

type PlayerStats struct {
	ID                     string `json:"id"`
	PlayerId               string `json:"playerId"`
	PlayerName             string `json:"playerName"`
	TeamId                 string `json:"teamId"`
	TeamName               string `json:"teamName"`
	GameId                 string `json:"gameId"`
	MinutesPlayed          int    `json:"minutesPlayed"`
	Points                 int    `json:"points"`
	FieldGoalsMade         int    `json:"fieldGoalsMade"`
	FieldGoalsAttempted    int    `json:"fieldGoalsAttempted"`
	ThreePointersMade      int    `json:"threePointersMade"`
	ThreePointersAttempted int    `json:"threePointersAttempted"`
	FreeThrowsMade         int    `json:"freeThrowsMade"`
	FreeThrowsAttempted    int    `json:"freeThrowsAttempted"`
	Rebounds               int    `json:"rebounds"`
	Assists                int    `json:"assists"`
	Steals                 int    `json:"steals"`
	Blocks                 int    `json:"blocks"`
	Turnovers              int    `json:"turnovers"`
	PersonalFouls          int    `json:"personalFouls"`
	PlusMinus              int    `json:"plusMinus"`
}

type Game struct {
	ID           string        `json:"id"`
	GameName     string        `json:"gameName"`
	GameDate     string        `json:"gameDate"`
	HomeTeamName string        `json:"homeTeamName"`
	AwayTeamName string        `json:"awayTeamName"`
	HomeScore    int           `json:"homeScore"`
	AwayScore    int           `json:"awayScore"`
	GameResult   string        `json:"gameResult"`
	PlayerStats  []PlayerStats `json:"playerStats"`
}

type Team struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Captain         string   `json:"captain"`
	Budget          int      `json:"budget"`
	RemainingBudget int      `json:"remainingBudget"`
	Players         []Player `json:"players"`
}

type Band struct {
	ID                    int64    `json:"id"`
	Name                  string   `json:"name"`
	BasePrice             int      `json:"basePrice"`
	Players               []Player `json:"players"`
	RandomizePlayersOrder bool     `json:"randomizePlayersOrder"`
}

type Auction struct {
	ID                    string             `json:"id"`
	Name                  string             `json:"name"`
	Status                string             `json:"status"`
	CurrentTeamId         string             `json:"currentTeamId"`
	CurrentPlayerId       *string            `json:"currentPlayerId"` // nullable
	CurrentBand           int64              `json:"currentBand"`
	Teams                 []Team             `json:"teams"`
	Bands                 []Band             `json:"bands"`
	CreatedAt             string             `json:"createdAt"`
	UpdatedAt             string             `json:"updatedAt"`
	CurrentRound          int                `json:"currentRound"`
	UnsoldPlayers         map[int64][]Player `json:"unsoldPlayers"`
	RandomizePlayersOrder bool               `json:"randomizePlayersOrder"`
	RandomizeAllPlayers   bool               `json:"randomizeAllPlayers"`
}
