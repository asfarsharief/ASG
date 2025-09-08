// API Configuration

export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  
  // API endpoints
  ENDPOINTS: {
    PLAYERS: '/players',
    AUCTIONS: '/auctions',
    GAMES: '/games',
    IMAGES: '/images',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to build image URL
export const buildImageUrl = (imagePath: string): string => {
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a local path starting with /images, build full URL
  if (imagePath.startsWith('/images/')) {
    return `${API_CONFIG.BASE_URL}${imagePath}`;
  }
  
  // Default: prepend base URL
  return `${API_CONFIG.BASE_URL}${imagePath}`;
};

// Helper function to get player image URL
export const getPlayerImageUrl = (playerId: string): string => {
  return `${API_CONFIG.BASE_URL}/players/${playerId}/image`;
};

