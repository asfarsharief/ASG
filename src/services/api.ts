// API Service Layer for Backend Communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

// Generic API response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Generic API error class
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new ApiError(response.status, result.error || result.message);
  }

  return result.data as T;
}

// Player API functions
export const playerApi = {
  // Get all players with optional filtering
  getPlayers: async (params?: {
    status?: string;
    band?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.band) searchParams.append('band', params.band);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/players${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<any[]>(endpoint);
  },

  // Get player by ID
  getPlayer: async (id: string) => {
    return apiRequest<any>(`/players/${id}`);
  },

  // Create new player
  createPlayer: async (playerData: any) => {
    return apiRequest<any>('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  // Update player
  updatePlayer: async (id: string, playerData: any) => {
    return apiRequest<any>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  },

  // Delete player
  deletePlayer: async (id: string) => {
    return apiRequest<void>(`/players/${id}`, {
      method: 'DELETE',
    });
  },
};

// Team API functions
export const teamApi = {
  // Get all teams
  getTeams: async (params?: {
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/teams${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<any[]>(endpoint);
  },

  // Get team by ID
  getTeam: async (id: string) => {
    return apiRequest<any>(`/teams/${id}`);
  },

  // Create new team
  createTeam: async (teamData: any) => {
    return apiRequest<any>('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  // Update team
  updateTeam: async (id: string, teamData: any) => {
    return apiRequest<any>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  },

  // Delete team
  deleteTeam: async (id: string) => {
    return apiRequest<void>(`/teams/${id}`, {
      method: 'DELETE',
    });
  },

  // Get team players
  getTeamPlayers: async (teamId: string) => {
    return apiRequest<any[]>(`/teams/${teamId}/players`);
  },

  // Add player to team
  addPlayerToTeam: async (teamId: string, playerId: string) => {
    return apiRequest<void>(`/teams/${teamId}/players`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  },

  // Remove player from team
  removePlayerFromTeam: async (teamId: string, playerId: string) => {
    return apiRequest<void>(`/teams/${teamId}/players/${playerId}`, {
      method: 'DELETE',
    });
  },
};

// Game API functions
export const gameApi = {
  // Get all games
  getGames: async (params?: {
    team_id?: string;
    date?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.team_id) searchParams.append('team_id', params.team_id);
    if (params?.date) searchParams.append('date', params.date);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/games${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<any[]>(endpoint);
  },

  // Get game by ID
  getGame: async (id: string) => {
    return apiRequest<any>(`/games/${id}`);
  },

  // Create new game
  createGame: async (gameData: any) => {
    return apiRequest<any>('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  },

  // Update game
  updateGame: async (id: string, gameData: any) => {
    return apiRequest<any>(`/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  },

  // Delete game
  deleteGame: async (id: string) => {
    return apiRequest<void>(`/games/${id}`, {
      method: 'DELETE',
    });
  },

  // Get game stats
  getGameStats: async (gameId: string) => {
    return apiRequest<any[]>(`/games/${gameId}/stats`);
  },

  // Add player stats to game
  addPlayerStats: async (gameId: string, statsData: any) => {
    return apiRequest<any>(`/games/${gameId}/stats`, {
      method: 'POST',
      body: JSON.stringify(statsData),
    });
  },

  // Update player stats
  updatePlayerStats: async (gameId: string, statId: string, statsData: any) => {
    return apiRequest<any>(`/games/${gameId}/stats/${statId}`, {
      method: 'PUT',
      body: JSON.stringify(statsData),
    });
  },

  // Delete player stats
  deletePlayerStats: async (gameId: string, statId: string) => {
    return apiRequest<void>(`/games/${gameId}/stats/${statId}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthApi = {
  check: async () => {
    return apiRequest<string>('/health');
  },
};

// Export the ApiError class for error handling
export { ApiError };