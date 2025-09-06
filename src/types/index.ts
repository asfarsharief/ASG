export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  endTime: Date;
  sellerId: string;
  imageUrl: string;
  bids: Bid[];
  status: 'active' | 'ended' | 'sold';
}

export interface Bid {
  id: string;
  amount: number;
  bidderId: string;
  timestamp: Date;
  auctionItemId: string;
}

export interface Team {
  id: string;
  name: string;
  captain: string;
  viceCaptain?: string;
  budget: number;
  remainingBudget: number;
  players: Player[];
}

export interface BasketballStats {
  winPercentage: number; // Win percentage (0-100)
  pointsAverage: number; // Points per game
  fieldGoalPercentage: number; // Field goal percentage (0-100)
  threePointPercentage: number; // Three-point percentage (0-100)
  freeThrowPercentage: number; // Free throw percentage (0-100)
  reboundsAverage: number; // Rebounds per game
  assistsAverage: number; // Assists per game
  stealsAverage: number; // Steals per game
  blocksAverage: number; // Blocks per game
  turnoversAverage: number; // Turnovers per game
  gamesPlayed: number; // Total games played
  minutesPerGame: number; // Minutes per game
}

export interface Player {
  id: string;
  name: string;
  photoUrl?: string;
  band: number;
  status: 'available' | 'sold';
  soldTo?: string;
  soldPrice?: number;
  soldInRound?: number;
  soldFromBand?: number;
  soldFromBandName?: string;
  soldFromBandBasePrice?: number;
  skipped?: boolean;
  // Basketball Stats
  basketballStats?: BasketballStats;
}

export interface AuctionBand {
  id: number;
  name: string;
  basePrice: number;
  players: Player[];
  randomizePlayersOrder: boolean;
}

export interface AuctionState {
  id: string;
  name: string;
  currentTeamId: string;
  currentPlayerId: string | null;
  status: 'setup' | 'ongoing' | 'in_progress' | 'completed' | 'paused';
  currentBand: number;
  teams: Team[];
  bands: AuctionBand[];
  createdAt: string;
  updatedAt: string;
  currentRound: number;
  unsoldPlayers: {
    [bandId: number]: Player[];
  };
  randomizePlayersOrder: boolean;
}

export interface Auction {
  id: string;
  name: string;
  status: 'setup' | 'ongoing' | 'in_progress' | 'completed' | 'paused';
  date: string;
  teams: Team[];
  bands: AuctionBand[];
  currentBandIndex?: number;
  currentPlayerIndex?: number;
  currentBid?: number;
  currentTeam?: string;
}

export interface BasketballTeam {
  id: string;
  name: string;
  players: string[]; // Array of player IDs
  createdAt: string;
}

export interface Game {
  id: string;
  gameName: string;
  gameDate: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameResult: 'home_win' | 'away_win' | 'tie';
  playerStats: PlayerGameStats[];
}

export interface PlayerGameStats {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  gameId: string;
  minutesPlayed: number;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  plusMinus: number;
}

// Keep the old GameStats interface for backward compatibility
export interface GameStats {
  id: string;
  playerId: string;
  playerName: string;
  gameDate: string;
  opponent: string;
  gameResult: 'win' | 'loss';
  minutesPlayed: number;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  plusMinus: number;
} 