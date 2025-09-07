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

export interface ApiGame {
  id: string;
  gameName: string;
  gameDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameResult: string;
  playerStats: any[];
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
    console.log('Fetched players from backend:', players.length);
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
    console.log('Fetched auctions from backend:', auctions.length);
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
    console.log('Fetched games from backend:', games.length);
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
