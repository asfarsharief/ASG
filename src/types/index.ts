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
}

export interface AuctionBand {
  id: number;
  name: string;
  basePrice: number;
  players: Player[];
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