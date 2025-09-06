// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  PLAYERS: '/players',
  TEAMS: '/teams',
  GAMES: '/games',
} as const;

// Default pagination
export const DEFAULT_PAGINATION = {
  LIMIT: 50,
  OFFSET: 0,
} as const;