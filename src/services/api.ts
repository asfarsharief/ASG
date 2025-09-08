// API service for backend communication

import { API_CONFIG, buildApiUrl } from '../config/api';

export interface ApiPlayer {
  id: string;
  name: string;
  band: number;
  status: string;
  basketballStats?: {
    winPercentage: number;
    pointsAverage: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    reboundsAverage: number;
    assistsAverage: number;
    stealsAverage: number;
    blocksAverage: number;
    turnoversAverage: number;
    gamesPlayed: number;
    minutesPerGame: number;
  };
  photoUrl?: string;
}

export interface ApiPlayerGameStats {
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

export interface ApiGame {
  id: string;
  gameName: string;
  gameDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameResult: string;
  playerStats: ApiPlayerGameStats[];
}

export interface ApiAuction {
  id: string;
  name: string;
  status: string;
  currentTeamId: string;
  currentPlayerId?: string;
  currentBand: number;
  teams: any[];
  bands: any[];
  createdAt: string;
  updatedAt: string;
  currentRound: number;
  unsoldPlayers: { [key: number]: any[] };
  randomizePlayersOrder: boolean;
  randomizeAllPlayers: boolean;
}

/**
 * Fetch players from the backend API
 */
export const fetchPlayers = async (): Promise<ApiPlayer[]> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PLAYERS));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const players = await response.json();
    console.log('Raw response from backend:', players);
    
    // Check if players is null or not an array
    if (!players || !Array.isArray(players)) {
      console.warn('Invalid players data received from backend:', players);
      return [];
    }
    
    console.log('Fetched players from backend:', players.length);
    
    // Automatically sync to localforage
    try {
      const localforage = (await import('localforage')).default;
      await localforage.setItem('players', players);
      console.log('Synced players to localforage:', players.length);
    } catch (syncError) {
      console.error('Error syncing players to localforage:', syncError);
      // Don't throw error, just log it - the API call was successful
    }
    
    return players;
  } catch (error) {
    console.error('Error fetching players from backend:', error);
    throw error;
  }
};

/**
 * Fetch auctions from the backend API
 */
export const fetchAuctions = async (): Promise<ApiAuction[]> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUCTIONS));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const auctions = await response.json();
    
    // Check if auctions is null or not an array
    if (!auctions || !Array.isArray(auctions)) {
      console.warn('Invalid auctions data received from backend:', auctions);
      return [];
    }
    
    console.log('Fetched auctions from backend:', auctions.length);
    
    // Automatically sync to localforage
    try {
      const localforage = (await import('localforage')).default;
      await localforage.setItem('auctions', auctions);
      console.log('Synced auctions to localforage:', auctions.length);
    } catch (syncError) {
      console.error('Error syncing auctions to localforage:', syncError);
    }
    
    return auctions;
  } catch (error) {
    console.error('Error fetching auctions from backend:', error);
    throw error;
  }
};

/**
 * Fetch games from the backend API
 */
export const fetchGames = async (): Promise<ApiGame[]> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GAMES));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const games = await response.json();
    
    // Check if games is null or not an array
    if (!games || !Array.isArray(games)) {
      console.warn('Invalid games data received from backend:', games);
      return [];
    }
    
    console.log('Fetched games from backend:', games.length);
    
    // Automatically sync to localforage
    try {
      const localforage = (await import('localforage')).default;
      await localforage.setItem('games', games);
      console.log('Synced games to localforage:', games.length);
    } catch (syncError) {
      console.error('Error syncing games to localforage:', syncError);
    }
    
    return games;
  } catch (error) {
    console.error('Error fetching games from backend:', error);
    throw error;
  }
};

/**
 * Check if backend is available
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PLAYERS), {
      method: 'GET',
      timeout: 5000,
    } as any);
    return response.ok;
  } catch (error) {
    console.log('Backend not available:', error);
    return false;
  }
};

/**
 * Create a new player
 */
export const createPlayer = async (player: ApiPlayer): Promise<{ message: string; player: ApiPlayer }> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PLAYERS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(player),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Player created successfully:', result.player);
    return result;
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
};

/**
 * Update an existing player
 */
export const updatePlayer = async (playerId: string, player: ApiPlayer): Promise<{ message: string; player: ApiPlayer }> => {
  try {
    const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.PLAYERS}/${playerId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(player),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Player updated successfully:', result.player);
    return result;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

/**
 * Delete a player
 */
export const deletePlayer = async (playerId: string): Promise<{ message: string; playerId: string }> => {
  try {
    const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.PLAYERS}/${playerId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Player deleted successfully:', result.playerId);
    return result;
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

/**
 * Create a new game
 */
export const createGame = async (game: ApiGame): Promise<{ message: string; game: ApiGame }> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.GAMES), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(game),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Game created successfully:', result.game);
    return result;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

/**
 * Update an existing game
 */
export const updateGame = async (gameId: string, game: ApiGame): Promise<{ message: string; game: ApiGame }> => {
  try {
    const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.GAMES}/${gameId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(game),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Game updated successfully:', result.game);
    return result;
  } catch (error) {
    console.error('Error updating game:', error);
    throw error;
  }
};

/**
 * Delete a game
 */
export const deleteGame = async (gameId: string): Promise<{ message: string; gameId: string }> => {
  try {
    const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.GAMES}/${gameId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Game deleted successfully:', result.gameId);
    return result;
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
};


