// API Configuration

export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  
  // API endpoints
  ENDPOINTS: {
    PLAYERS: '/players',
    AUCTIONS: '/auctions',
    GAMES: '/games',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

