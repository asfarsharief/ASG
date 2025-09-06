// Data Transformation Utilities
// Converts between frontend and backend data formats

import { Player, Team, Game, PlayerGameStats, BasketballStats } from '../types';

// Transform player from backend to frontend format
export const transformPlayerFromBackend = (backendPlayer: any): Player => {
  console.log('Transforming player from backend:', backendPlayer);
  
  const transformed = {
    id: backendPlayer.id,
    name: backendPlayer.name,
    photoUrl: backendPlayer.photoUrl || backendPlayer.photoURL,
    band: backendPlayer.band,
    status: backendPlayer.status as 'available' | 'sold',
    soldTo: backendPlayer.soldTo,
    soldPrice: backendPlayer.soldPrice,
    soldInRound: backendPlayer.soldInRound,
    soldFromBand: backendPlayer.soldFromBand,
    soldFromBandName: backendPlayer.soldFromBandName,
    soldFromBandBasePrice: backendPlayer.soldFromBandBasePrice,
    skipped: backendPlayer.skipped || false,
    basketballStats: backendPlayer.basketballStats ? {
      winPercentage: backendPlayer.basketballStats.winPercentage || 0,
      pointsAverage: backendPlayer.basketballStats.pointsAverage || 0,
      fieldGoalPercentage: backendPlayer.basketballStats.fieldGoalPercentage || 0,
      threePointPercentage: backendPlayer.basketballStats.threePointPercentage || 0,
      freeThrowPercentage: backendPlayer.basketballStats.freeThrowPercentage || 0,
      reboundsAverage: backendPlayer.basketballStats.reboundsAverage || 0,
      assistsAverage: backendPlayer.basketballStats.assistsAverage || 0,
      stealsAverage: backendPlayer.basketballStats.stealsAverage || 0,
      blocksAverage: backendPlayer.basketballStats.blocksAverage || 0,
      turnoversAverage: backendPlayer.basketballStats.turnoversAverage || 0,
      gamesPlayed: backendPlayer.basketballStats.gamesPlayed || 0,
      minutesPerGame: backendPlayer.basketballStats.minutesPerGame || 0,
    } : undefined,
  };
  
  console.log('Transformed player:', transformed);
  return transformed;
};

// Transform player from frontend to backend format
export const transformPlayerToBackend = (frontendPlayer: Partial<Player>): any => {
  const backendPlayer: any = {
    name: frontendPlayer.name,
    band: frontendPlayer.band,
    status: frontendPlayer.status || 'available',
  };

  if (frontendPlayer.photoUrl !== undefined) {
    backendPlayer.photoUrl = frontendPlayer.photoUrl;
  }
  if (frontendPlayer.soldTo !== undefined) {
    backendPlayer.soldTo = frontendPlayer.soldTo;
  }
  if (frontendPlayer.soldPrice !== undefined) {
    backendPlayer.soldPrice = frontendPlayer.soldPrice;
  }
  if (frontendPlayer.soldInRound !== undefined) {
    backendPlayer.soldInRound = frontendPlayer.soldInRound;
  }
  if (frontendPlayer.soldFromBand !== undefined) {
    backendPlayer.soldFromBand = frontendPlayer.soldFromBand;
  }
  if (frontendPlayer.soldFromBandName !== undefined) {
    backendPlayer.soldFromBandName = frontendPlayer.soldFromBandName;
  }
  if (frontendPlayer.soldFromBandBasePrice !== undefined) {
    backendPlayer.soldFromBandBasePrice = frontendPlayer.soldFromBandBasePrice;
  }
  if (frontendPlayer.skipped !== undefined) {
    backendPlayer.skipped = frontendPlayer.skipped;
  }
  if (frontendPlayer.basketballStats) {
    backendPlayer.basketballStats = {
      winPercentage: frontendPlayer.basketballStats.winPercentage,
      pointsAverage: frontendPlayer.basketballStats.pointsAverage,
      fieldGoalPercentage: frontendPlayer.basketballStats.fieldGoalPercentage,
      threePointPercentage: frontendPlayer.basketballStats.threePointPercentage,
      freeThrowPercentage: frontendPlayer.basketballStats.freeThrowPercentage,
      reboundsAverage: frontendPlayer.basketballStats.reboundsAverage,
      assistsAverage: frontendPlayer.basketballStats.assistsAverage,
      stealsAverage: frontendPlayer.basketballStats.stealsAverage,
      blocksAverage: frontendPlayer.basketballStats.blocksAverage,
      turnoversAverage: frontendPlayer.basketballStats.turnoversAverage,
      gamesPlayed: frontendPlayer.basketballStats.gamesPlayed,
      minutesPerGame: frontendPlayer.basketballStats.minutesPerGame,
    };
  }

  return backendPlayer;
};

// Transform team from backend to frontend format
export const transformTeamFromBackend = (backendTeam: any): Team => {
  return {
    id: backendTeam.id,
    name: backendTeam.name,
    captain: backendTeam.captain,
    viceCaptain: backendTeam.viceCaptain,
    budget: backendTeam.budget,
    remainingBudget: backendTeam.remainingBudget,
    players: backendTeam.players ? backendTeam.players.map(transformPlayerFromBackend) : [],
  };
};

// Transform team from frontend to backend format
export const transformTeamToBackend = (frontendTeam: Partial<Team>): any => {
  const backendTeam: any = {
    name: frontendTeam.name,
    captain: frontendTeam.captain,
    budget: frontendTeam.budget,
  };

  if (frontendTeam.viceCaptain !== undefined) {
    backendTeam.viceCaptain = frontendTeam.viceCaptain;
  }
  if (frontendTeam.remainingBudget !== undefined) {
    backendTeam.remainingBudget = frontendTeam.remainingBudget;
  }

  return backendTeam;
};

// Transform game from backend to frontend format
export const transformGameFromBackend = (backendGame: any): Game => {
  return {
    id: backendGame.id,
    gameName: backendGame.gameName,
    gameDate: backendGame.gameDate,
    homeTeamId: backendGame.homeTeamId,
    homeTeamName: backendGame.homeTeamName,
    awayTeamId: backendGame.awayTeamId,
    awayTeamName: backendGame.awayTeamName,
    homeScore: backendGame.homeScore,
    awayScore: backendGame.awayScore,
    gameResult: backendGame.gameResult as 'home_win' | 'away_win' | 'tie',
    playerStats: backendGame.playerStats ? backendGame.playerStats.map(transformPlayerGameStatsFromBackend) : [],
  };
};

// Transform game from frontend to backend format
export const transformGameToBackend = (frontendGame: Partial<Game>): any => {
  const backendGame: any = {
    gameName: frontendGame.gameName,
    gameDate: frontendGame.gameDate,
    homeTeamId: frontendGame.homeTeamId,
    homeTeamName: frontendGame.homeTeamName,
    awayTeamId: frontendGame.awayTeamId,
    awayTeamName: frontendGame.awayTeamName,
  };

  if (frontendGame.homeScore !== undefined) {
    backendGame.homeScore = frontendGame.homeScore;
  }
  if (frontendGame.awayScore !== undefined) {
    backendGame.awayScore = frontendGame.awayScore;
  }

  return backendGame;
};

// Transform player game stats from backend to frontend format
export const transformPlayerGameStatsFromBackend = (backendStats: any): PlayerGameStats => {
  return {
    id: backendStats.id,
    playerId: backendStats.playerId,
    playerName: backendStats.playerName,
    teamId: backendStats.teamId,
    teamName: backendStats.teamName,
    gameId: backendStats.gameId,
    minutesPlayed: backendStats.minutesPlayed,
    points: backendStats.points,
    fieldGoalsMade: backendStats.fieldGoalsMade,
    fieldGoalsAttempted: backendStats.fieldGoalsAttempted,
    threePointersMade: backendStats.threePointersMade,
    threePointersAttempted: backendStats.threePointersAttempted,
    freeThrowsMade: backendStats.freeThrowsMade,
    freeThrowsAttempted: backendStats.freeThrowsAttempted,
    rebounds: backendStats.rebounds,
    assists: backendStats.assists,
    steals: backendStats.steals,
    blocks: backendStats.blocks,
    turnovers: backendStats.turnovers,
    personalFouls: backendStats.personalFouls,
    plusMinus: backendStats.plusMinus,
  };
};

// Transform player game stats from frontend to backend format
export const transformPlayerGameStatsToBackend = (frontendStats: Partial<PlayerGameStats>): any => {
  const backendStats: any = {
    playerId: frontendStats.playerId,
    playerName: frontendStats.playerName,
    teamId: frontendStats.teamId,
    teamName: frontendStats.teamName,
  };

  if (frontendStats.minutesPlayed !== undefined) {
    backendStats.minutesPlayed = frontendStats.minutesPlayed;
  }
  if (frontendStats.points !== undefined) {
    backendStats.points = frontendStats.points;
  }
  if (frontendStats.fieldGoalsMade !== undefined) {
    backendStats.fieldGoalsMade = frontendStats.fieldGoalsMade;
  }
  if (frontendStats.fieldGoalsAttempted !== undefined) {
    backendStats.fieldGoalsAttempted = frontendStats.fieldGoalsAttempted;
  }
  if (frontendStats.threePointersMade !== undefined) {
    backendStats.threePointersMade = frontendStats.threePointersMade;
  }
  if (frontendStats.threePointersAttempted !== undefined) {
    backendStats.threePointersAttempted = frontendStats.threePointersAttempted;
  }
  if (frontendStats.freeThrowsMade !== undefined) {
    backendStats.freeThrowsMade = frontendStats.freeThrowsMade;
  }
  if (frontendStats.freeThrowsAttempted !== undefined) {
    backendStats.freeThrowsAttempted = frontendStats.freeThrowsAttempted;
  }
  if (frontendStats.rebounds !== undefined) {
    backendStats.rebounds = frontendStats.rebounds;
  }
  if (frontendStats.assists !== undefined) {
    backendStats.assists = frontendStats.assists;
  }
  if (frontendStats.steals !== undefined) {
    backendStats.steals = frontendStats.steals;
  }
  if (frontendStats.blocks !== undefined) {
    backendStats.blocks = frontendStats.blocks;
  }
  if (frontendStats.turnovers !== undefined) {
    backendStats.turnovers = frontendStats.turnovers;
  }
  if (frontendStats.personalFouls !== undefined) {
    backendStats.personalFouls = frontendStats.personalFouls;
  }
  if (frontendStats.plusMinus !== undefined) {
    backendStats.plusMinus = frontendStats.plusMinus;
  }

  return backendStats;
};

// Helper function to create default basketball stats
export const createDefaultBasketballStats = (): BasketballStats => ({
  winPercentage: 0,
  pointsAverage: 0,
  fieldGoalPercentage: 0,
  threePointPercentage: 0,
  freeThrowPercentage: 0,
  reboundsAverage: 0,
  assistsAverage: 0,
  stealsAverage: 0,
  blocksAverage: 0,
  turnoversAverage: 0,
  gamesPlayed: 0,
  minutesPerGame: 0,
});

// Helper function to create default player game stats
export const createDefaultPlayerGameStats = (): Partial<PlayerGameStats> => ({
  minutesPlayed: 0,
  points: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  rebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  personalFouls: 0,
  plusMinus: 0,
});