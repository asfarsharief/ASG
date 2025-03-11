import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { Team, Player, AuctionState, AuctionBand } from '../types';
import localforage from 'localforage';

function getCommonElements<T>(list1: T[], list2: T[]): T[] {
  const set2 = new Set(list2);
  var res = list1.filter(item => set2.has(item));
  console.log("band: ", list1)
  console.log("available: ", list2)
  console.log("res: ", res)
  return res
}

const Auction = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [bands, setBands] = useState<AuctionBand[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState('');
  const [newBid, setNewBid] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [highestBid, setHighestBid] = useState<{ teamId: string; amount: number } | null>(null);
  const [showRoundCompleteDialog, setShowRoundCompleteDialog] = useState(false);
  const [unsoldPlayersCount, setUnsoldPlayersCount] = useState(0);
  const [randomizeNextRound, setRandomizeNextRound] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'sold' | 'skipped';
    player: Player;
    previousState: {
      teams: Team[];
      bands: AuctionBand[];
      availablePlayers: Player[];
      currentPlayer: Player | null;
      unsoldPlayers: Record<number, Player[]>;
    } | null;
  } | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState>({
    id: id || '',
    name: '',
    currentTeamId: '',
    currentPlayerId: null,
    status: 'setup',
    currentBand: 1,
    teams: [],
    bands: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentRound: 1,
    unsoldPlayers: {},
    randomizePlayersOrder: false,
  });
  const [upcomingPlayers, setUpcomingPlayers] = useState<Player[]>([]);
  const [showBandEditDialog, setShowBandEditDialog] = useState(false);
  const [editingBands, setEditingBands] = useState<AuctionBand[]>([]);
  const [biddingStarted, setBiddingStarted] = useState(false);
  const [isNameVisible, setIsNameVisible] = useState(false);

  useEffect(() => {
    console.log('FIRST')
    // Load auction data from localForage
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const currentAuction = auctions.find((a: AuctionState) => a.id === id);

        if (currentAuction) {
          setAuctionState(currentAuction);
          setTeams(currentAuction.teams);
          setBands(currentAuction.bands);
          
          // For completed auctions, show all sold players
          if (currentAuction.status === 'completed') {
            const allSoldPlayers = currentAuction.teams.flatMap((team: Team) => team.players);
            setAvailablePlayers(allSoldPlayers);
            setCurrentPlayer(allSoldPlayers[0] || null);
          } else {
            // For active auctions, show only available players
            const availablePlayers = currentAuction.bands.flatMap((band: AuctionBand) => 
              band.players.filter((player: Player) => player.status === 'available')
            );
            const shuffledPlayers = currentAuction.currentRound === 1 && currentAuction.randomizePlayersOrder
              ? [...availablePlayers].sort(() => Math.random() - 0.5)
              : availablePlayers;
            console.log("SHUFFLING: ",currentAuction.currentRound === 1 , currentAuction.randomizePlayersOrder, currentAuction.currentRound === 1 && currentAuction.randomizePlayersOrder, shuffledPlayers)
            setAvailablePlayers(shuffledPlayers);
            setCurrentPlayer(shuffledPlayers[0] || null);
            // Set upcoming players
            setUpcomingPlayers(shuffledPlayers.slice(1));
          }
        }
      }
    });
  }, [id]);

  useEffect(() => {
    if (availablePlayers.length > 0 && !currentPlayer) {
      setCurrentPlayer(availablePlayers[0]);
    }
    // Reset biddingStarted when a new player is up for bidding
    setBiddingStarted(false);
    // Hide the player's name by default
    setIsNameVisible(false);
  }, [availablePlayers, currentPlayer]);

  // Update current bid when current player changes
  useEffect(() => {
    if (currentPlayer && auctionState.status === 'in_progress') {
      const currentBand = bands.find(band => band.id === currentPlayer.band);
      if (currentBand) {
        const initialBid = currentBand.basePrice.toString();
        setCurrentBid(initialBid);
        setNewBid(initialBid); // Set new bid equal to current bid
      }
    }
  }, [currentPlayer, bands, auctionState.status]);

  // Update upcoming players when current player changes
  useEffect(() => {
    if (currentPlayer && availablePlayers.length > 0) {
      const currentIndex = availablePlayers.findIndex(p => p.id === currentPlayer.id);
      if (currentIndex !== -1) {
        setUpcomingPlayers(availablePlayers.slice(currentIndex + 1));
      }
    }
  }, [currentPlayer, availablePlayers]);

  const extractUpcomingPlayers = (): Player[] => {
    let playersInBand: Player[] = [];

    for (const band of bands) {
      playersInBand = band.players.filter(
        player => currentPlayer && player.band === currentPlayer.band
      );
      break; // Only process the first band
    }

    const availablePlayers = upcomingPlayers.filter(
      player => currentPlayer && player.band === currentPlayer.band
    );

    return getCommonElements(playersInBand, availablePlayers);
  }

  const handleStartAuction2 = () => {
    console.log("button called")
  }

  const handleStartAuction = () => {
    console.log("handleStartAuction called");
    console.log("Auction State: ", auctionState);

    if (!auctionState) return;

    // Initialize available players from first band
    const firstBand = auctionState.bands[0];
    console.log("First Band: ", firstBand);

    if (firstBand) {
      // For first round, show all available players in random order if randomizePlayersOrder is true
      const initialPlayers = firstBand.players.filter(p => 
        p.status === 'available' && 
        (auctionState.currentRound === 1 || Object.values(auctionState.unsoldPlayers).flat().some(up => up.id === p.id))
      );

      // Randomize the order for round 1 if randomizePlayersOrder is true
      const shuffledPlayers = auctionState.currentRound === 1 && auctionState.randomizePlayersOrder
        ? [...initialPlayers].sort(() => Math.random() - 0.5)
        : initialPlayers;

      setAvailablePlayers(shuffledPlayers);
      setCurrentPlayer(shuffledPlayers[0] || null);
      setUpcomingPlayers(shuffledPlayers.slice(1));
      console.log("random 1: ", shuffledPlayers);
      setAuctionState(prev => ({
        ...prev,
        currentBand: firstBand.id
      }));
    }

    const updatedState = {
      ...auctionState,
      status: 'in_progress' as const,
      currentBand: firstBand?.id || 1,
    };
    setAuctionState(updatedState);
    
    // Update auction in localForage
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: AuctionState) => 
          a.id === id ? updatedState : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });
  };

  const handlePlaceBid = () => {
    if (!currentPlayer || !currentBid) return;

    const bidAmount = Number(currentBid);

    // Allow first bid to be equal to base price, but subsequent bids must be higher
    if (!highestBid && bidAmount < Number(currentBid)) {
      alert('New bid must be higher than current bid!');
      return;
    }

    // Find the team with the highest remaining budget
    const eligibleTeam = teams.find(team => team.remainingBudget >= bidAmount);
    
    if (!eligibleTeam) {
      alert('No team has enough budget for this bid!');
      return;
    }

    setSelectedTeam(eligibleTeam.id);
    setHighestBid({
      teamId: eligibleTeam.id,
      amount: bidAmount,
    });
    setBiddingStarted(true);
  };

  const handleIncrementBid = (increment: number) => {
    if (!currentPlayer) return;

    const currentBand = bands.find(band => band.id === currentPlayer.band);
    if (!currentBand) return;

    const newAmount = Number(currentBid) + increment;
    setCurrentBid(newAmount.toString());
  };

  const handleClearBid = () => {
    setNewBid(currentBid);
  };

  const handleCustomBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBid(e.target.value);
  };

  const handleSellPlayer = () => {
    if (!currentPlayer || !highestBid || !selectedTeam) return;

    // Store current state for undo
    const previousState = {
      teams: [...teams],
      bands: [...bands],
      availablePlayers: [...availablePlayers],
      currentPlayer,
      unsoldPlayers: { ...auctionState.unsoldPlayers }
    };

    const biddingTeam = teams.find(team => team.id === selectedTeam);
    if (!biddingTeam) return;

    // Get the band information before updating
    const playerBand = bands.find(band => band.id === currentPlayer.band);
    if (!playerBand) return;

    // Update team's remaining budget and add player with band info
    const updatedTeams = teams.map(team => {
      if (team.id === selectedTeam) {
        return {
          ...team,
          remainingBudget: team.remainingBudget - Number(currentBid),
          players: [...team.players, { 
            ...currentPlayer, 
            soldTo: team.name, 
            soldPrice: Number(currentBid), 
            status: 'sold' as const,
            soldInRound: auctionState.currentRound,
            soldFromBand: currentPlayer.band,
            soldFromBandName: playerBand.name,
            soldFromBandBasePrice: playerBand.basePrice,
          }],
        };
      }
      return team;
    });

    // Update the current player's status in bands
    const updatedBands = bands.map(band => ({
      ...band,
      players: band.players.map(player =>
        player.id === currentPlayer.id
          ? { 
              ...player, 
              status: 'sold' as const, 
              soldTo: biddingTeam.name, 
              soldPrice: Number(currentBid),
              soldInRound: auctionState.currentRound,
              soldFromBand: currentPlayer.band,
              soldFromBandName: playerBand.name,
              soldFromBandBasePrice: playerBand.basePrice,
            }
          : player
      ),
    }));

    // Update available players
    const updatedAvailablePlayers = availablePlayers.filter(p => p.id !== currentPlayer.id);
    const nextPlayer = updatedAvailablePlayers[0];

    setTeams(updatedTeams);
    setBands(updatedBands);
    setAvailablePlayers(updatedAvailablePlayers);
    setCurrentPlayer(nextPlayer || null);
    setHighestBid(null);
    setCurrentBid('');
    setSelectedTeam('');
    
    // Reset new bid to the base price of the next player
    if (nextPlayer) {
      const nextBand = updatedBands.find(band => band.id === nextPlayer.band);
      if (nextBand) {
        setCurrentBid(nextBand.basePrice.toString());
      }
    }

    // Update auction state
    const updatedState = {
      ...auctionState,
      teams: updatedTeams,
      bands: updatedBands,
    };
    setAuctionState(updatedState);

    // Store updated data
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: AuctionState) => 
          a.id === id ? updatedState : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });

    // Check if there are no more available players AND no skipped players
    const skippedPlayers = Object.values(auctionState.unsoldPlayers).flat();
    if (updatedAvailablePlayers.length === 0 && skippedPlayers.length === 0) {
      const completedState = {
        ...updatedState,
        status: 'completed' as const,
      };
      setAuctionState(completedState);
      
      // Update auction status in localForage
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const finalAuctions = auctions.map((a: AuctionState) => 
            a.id === id ? completedState : a
          );
          localforage.setItem('auctions', JSON.stringify(finalAuctions));
        }
      });
    } else if (updatedAvailablePlayers.length === 0) {
      // If no more available players but there are skipped players, show round complete dialog
      const totalUnsold = Object.values(auctionState.unsoldPlayers).flat().length;
      setUnsoldPlayersCount(totalUnsold);
      setShowRoundCompleteDialog(true);
    }

    // After all state updates, store the last action
    setLastAction({
      type: 'sold',
      player: currentPlayer,
      previousState
    });
  };

  const handleSkipPlayer = () => {
    if (!currentPlayer) return;

    // Store current state for undo
    const previousState = {
      teams: [...teams],
      bands: [...bands],
      availablePlayers: [...availablePlayers],
      currentPlayer,
      unsoldPlayers: { ...auctionState.unsoldPlayers }
    };

    // Add player to unsold players for current band
    const updatedUnsoldPlayers = {
      ...auctionState.unsoldPlayers,
      [currentPlayer.band]: [
        ...(auctionState.unsoldPlayers[currentPlayer.band] || []),
        { ...currentPlayer, skipped: true }
      ]
    };

    // Update available players
    const updatedAvailablePlayers = availablePlayers.filter(p => p.id !== currentPlayer.id);
    
    // Get next player from current band
    const nextPlayerInBand = updatedAvailablePlayers.find(p => p.band === currentPlayer.band);

    if (nextPlayerInBand) {
      // Continue with next player in current band
      setAvailablePlayers(updatedAvailablePlayers);
      setCurrentPlayer(nextPlayerInBand);
      setUpcomingPlayers(updatedAvailablePlayers.filter(p => p.band === currentPlayer.band));
    } else {
      // Current band is complete, find next band
      const currentBandIndex = bands.findIndex(b => b.id === currentPlayer.band);
      const nextBand = bands[currentBandIndex + 1];
      
      if (nextBand) {
        // Move to next band
        const nextBandPlayers = nextBand.players.filter(p => p.status === 'available');
        setAvailablePlayers(nextBandPlayers);
        setCurrentPlayer(nextBandPlayers[0] || null);
        setUpcomingPlayers(nextBandPlayers.slice(1));
        setAuctionState(prev => ({
          ...prev,
          currentBand: nextBand.id
        }));
      } else {
        // Round complete
        const totalUnsold = Object.values(updatedUnsoldPlayers).flat().length;
        setUnsoldPlayersCount(totalUnsold);
        setShowRoundCompleteDialog(true);
      }
    }

    // Update auction state
    const updatedState = {
      ...auctionState,
      unsoldPlayers: updatedUnsoldPlayers,
    };
    setAuctionState(updatedState);

    // Store updated data
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: AuctionState) => 
          a.id === id ? updatedState : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });

    // After all state updates, store the last action
    setLastAction({
      type: 'skipped',
      player: currentPlayer,
      previousState
    });
  };

  const handleContinueWithSameBands = () => {
    // Get all unsold players from the previous round
    const unsoldPlayerIds = new Set(
      Object.values(auctionState.unsoldPlayers)
        .flat()
        .map(player => player.id)
    );

    // Reset only unsold players to available status
    const updatedBands = bands.map(band => ({
      ...band,
      players: band.players.map(player => ({
        ...player,
        status: unsoldPlayerIds.has(player.id) ? 'available' as const : player.status,
        skipped: false
      }))
    }));

    // Get all available players from all bands
    const allAvailablePlayers = updatedBands.flatMap(band =>
      band.players.filter(p => p.status === 'available' && unsoldPlayerIds.has(p.id))
    );

    // Start with first band's unsold players
    const firstBand = updatedBands[0];
    const firstBandPlayers = allAvailablePlayers.filter(p => p.band === firstBand.id);

    if (allAvailablePlayers.length > 0) {
      setAvailablePlayers(allAvailablePlayers);
      setCurrentPlayer(firstBandPlayers[0] || allAvailablePlayers[0]);
      setUpcomingPlayers(allAvailablePlayers.slice(1));
    } else {
      // If no players are available, complete the auction
      const completedState = {
        ...auctionState,
        bands: updatedBands,
        status: 'completed' as const,
      };
      setAuctionState(completedState);
      setShowRoundCompleteDialog(false);
      
      // Store updated data
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: AuctionState) => 
            a.id === id ? completedState : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
      return;
    }

    const updatedState = {
      ...auctionState,
      bands: updatedBands,
      currentRound: auctionState.currentRound + 1,
      unsoldPlayers: {},
      currentBand: firstBand?.id || 1,
    };
    setAuctionState(updatedState);
    setShowRoundCompleteDialog(false);

    // Store updated data
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: AuctionState) => 
          a.id === id ? updatedState : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });
  };

  const handleUpdateBand = (bandId: number, updates: Partial<AuctionBand>) => {
    setEditingBands(prevBands => 
      prevBands.map(band => 
        band.id === bandId ? { ...band, ...updates } : band
      )
    );
  };

  const handleDeleteBand = (bandId: number) => {
    setEditingBands(prevBands => prevBands.filter(band => band.id !== bandId));
  };

  const handleAddBand = () => {
    const newBandId = Math.max(...editingBands.map(b => b.id), 0) + 1;
    setEditingBands(prevBands => [...prevBands, {
      id: newBandId,
      name: `Band ${newBandId}`,
      basePrice: 10,
      players: []
    }]);
  };

  const handleSaveBands = () => {
    // Get all sold players from current bands
    const soldPlayers = bands.flatMap(band => 
      band.players.filter(player => player.status === 'sold')
    );

    // Create updated bands with sold players preserved and unsold players from editing
    const updatedBands = editingBands.map(band => ({
      ...band,
      players: [
        ...soldPlayers.filter(p => p.soldFromBand === band.id),
        ...band.players.filter(p => p.status === 'available')
      ]
    }));

    setBands(updatedBands);
    setShowBandEditDialog(false);

    // Get all available players from all bands for the next round
    let allAvailablePlayers = updatedBands.flatMap(band =>
      band.players.filter(p => p.status === 'available')
    );

    // Randomize order if checkbox was selected
    if (randomizeNextRound) {
      allAvailablePlayers = [...allAvailablePlayers].sort(() => Math.random() - 0.5);
    }

    // Start with first band's players
    const firstBand = updatedBands[0];
    const firstBandPlayers = allAvailablePlayers.filter(p => p.band === firstBand.id);

    if (allAvailablePlayers.length > 0) {
      setAvailablePlayers(allAvailablePlayers);
      setCurrentPlayer(firstBandPlayers[0] || allAvailablePlayers[0]);
      setUpcomingPlayers(allAvailablePlayers.slice(1));
      console.log("random 2: ", allAvailablePlayers)

      // Update auction state for next round
      const updatedState = {
        ...auctionState,
        bands: updatedBands,
        currentRound: auctionState.currentRound + 1,
        unsoldPlayers: {},
        currentBand: firstBand.id,
        status: 'in_progress' as const
      };
      setAuctionState(updatedState);

      // Store updated data
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: AuctionState) => 
            a.id === id ? updatedState : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    } else {
      // If no players are available, complete the auction
      const completedState = {
        ...auctionState,
        bands: updatedBands,
        status: 'completed' as const,
      };
      setAuctionState(completedState);
      
      // Store updated data
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: AuctionState) => 
            a.id === id ? completedState : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    }

    setShowRoundCompleteDialog(false);
  };

  const handleEditBands = () => {
    // Initialize editing bands with only unsold players
    const bandsWithUnsoldPlayers = bands.map(band => ({
      ...band,
      players: band.players.filter(player => player.status === 'available')
    }));
    setEditingBands(bandsWithUnsoldPlayers);
    setShowBandEditDialog(true);
  };

  const handleExitAuction = () => {
    const updatedState = {
      ...auctionState,
      status: 'completed' as const,
    };
    setAuctionState(updatedState);
    setShowRoundCompleteDialog(false);

    // Store updated data
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: AuctionState) => 
          a.id === id ? updatedState : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });
  };

  const handleExportData = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Process each team's data
    teams.forEach((team, index) => {
      // Get all players including captain and vice-captain
      const allPlayers = [...team.players];
      
      // Add captain if not already in the list
      if (team.captain && !allPlayers.some(p => p.name === team.captain)) {
        allPlayers.push({
          id: 'captain',
          name: team.captain,
          band: 0,
          status: 'sold',
          soldTo: team.name,
          soldPrice: 0,
          soldInRound: 0,
          soldFromBand: 0,
          soldFromBandName: 'N/A',
          soldFromBandBasePrice: 0
        });
      }

      // Add vice-captain if not already in the list
      if (team.viceCaptain && !allPlayers.some(p => p.name === team.viceCaptain)) {
        allPlayers.push({
          id: 'vice-captain',
          name: team.viceCaptain,
          band: 0,
          status: 'sold',
          soldTo: team.name,
          soldPrice: 0,
          soldInRound: 0,
          soldFromBand: 0,
          soldFromBandName: 'N/A',
          soldFromBandBasePrice: 0
        });
      }

      // Create team sheet data
      const teamData = [
        ['Player Name', 'Role', 'Band', 'Base Price', 'Round Selected', 'Final Price'],
        ...allPlayers.map(player => [
          `${player.name}${player.name === team.captain ? ' (c)' : ''}${player.name === team.viceCaptain ? ' (vc)' : ''}`,
          player.name === team.captain ? 'Captain' : (player.name === team.viceCaptain ? 'Vice Captain' : 'Player'),
          player.soldFromBandName || 'N/A',
          player.soldFromBandBasePrice || 0,
          player.soldInRound || 0,
          player.soldPrice || 0
        ])
      ];

      // Add summary rows
      teamData.push(
        [], // Empty row for spacing
        ['Team Summary'],
        ['Total Budget', `${team.budget} Cr.`],
        ['Total Spent', `${team.budget - team.remainingBudget} Cr.`],
        ['Remaining Budget', `${team.remainingBudget} Cr.`]
      );

      // Create worksheet and add to workbook
      const ws = XLSX.utils.aoa_to_sheet(teamData);
      XLSX.utils.book_append_sheet(wb, ws, team.name);
    });

    // Create summary sheet
    const summaryData = [
      ['Auction Summary'],
      ['Auction Name', auctionState.name],
      ['Completed At', new Date().toLocaleString()],
      [],
      ['Team', 'Captain', 'Vice Captain', 'Total Budget', 'Total Spent', 'Remaining Budget', 'Players Count'],
      ...teams.map(team => [
        team.name,
        team.captain || 'N/A',
        team.viceCaptain || 'N/A',
        team.budget,
        team.budget - team.remainingBudget,
        team.remainingBudget,
        team.players.length
      ])
    ];

    // Add summary sheet to workbook
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Auction Summary');

    // Save the workbook
    XLSX.writeFile(wb, 'auction_results.xlsx');
  };

  const handleUndo = () => {
    if (!lastAction || !lastAction.previousState) return;

    // Restore previous state
    setTeams(lastAction.previousState.teams);
    setBands(lastAction.previousState.bands);
    setAvailablePlayers(lastAction.previousState.availablePlayers);
    setCurrentPlayer(lastAction.previousState.currentPlayer);
    
    // Update auction state
    const updatedState = {
      ...auctionState,
      teams: lastAction.previousState.teams,
      bands: lastAction.previousState.bands,
      unsoldPlayers: lastAction.previousState.unsoldPlayers
    };
    setAuctionState(updatedState);

    // Reset bid-related states
    setHighestBid(null);
    setSelectedTeam('');
    const currentPlayer = lastAction.previousState.currentPlayer;
    if (currentPlayer) {
      const playerBand = lastAction.previousState.bands.find(
        band => band.id === currentPlayer.band
      );
      if (playerBand) {
        setCurrentBid(playerBand.basePrice.toString());
        setNewBid(playerBand.basePrice.toString());
      }
    }

    // Update localForage
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: AuctionState) => 
          a.id === id ? updatedState : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });

    // Clear last action
    setLastAction(null);
  };

  const toggleNameVisibility = () => {
    setIsNameVisible(!isNameVisible);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {auctionState?.name}
        </Typography>
        {auctionState.status === 'completed' ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            backgroundColor: 'success.main',
            color: 'white',
            padding: 2,
            borderRadius: 1
          }}>
            <Typography variant="h5">
              Auction Completed!
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleExportData}
              sx={{ ml: 2 }}
            >
              Export Data
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              {auctionState?.status === 'setup' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartAuction}
                >
                  Start Auction
                </Button>
              )}
              {auctionState.status === 'in_progress' && lastAction && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleUndo}
                  startIcon={<span>↩</span>}
                >
                  Undo Last Action
                </Button>
              )}
            </Box>
            {auctionState.status === 'in_progress' && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Typography variant="h6">
                  Round {auctionState.currentRound}
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="h6">
                  Current Band: {bands.find(b => b.id === currentPlayer?.band)?.name || 'None'}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Upcoming Players List */}
      {auctionState.status !== 'completed' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upcoming Players in Current Band
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto', 
            pb: 2,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'background.paper',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'action.hover',
              borderRadius: 4,
            },
          }}>
            {extractUpcomingPlayers().map((player: Player) => (
              <Card key={player.id} sx={{ minWidth: 200 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {player.photoUrl && (
                      <Avatar
                        src={player.photoUrl}
                        alt={player.name}
                        sx={{ width: 40, height: 40, mr: 1 }}
                      />
                    )}
                    <Typography variant="subtitle1">{player.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Band: {bands.find(band => band.id === player.band)?.name || 'Unknown'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      <Grid container spacing={4}>
        {/* Left Team Section */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {teams[0]?.name || 'Team 1'}
                {teams[0]?.remainingBudget <= Number(currentBid) + 10 && (
                  <Typography variant="body2" color="error" component="span" sx={{ ml: 1 }}>
                    Warning: Limited funds left
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {teams[0]?.captain && `Captain: ${teams[0].captain}`}
                {teams[0]?.viceCaptain && (
                  <>
                    <br />
                    Vice Captain: {teams[0].viceCaptain}
                  </>
                )}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Budget: {teams[0]?.remainingBudget || 0} Cr.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Selected Players:
              </Typography>
              <List dense>
                {teams[0]?.players.map((player, index) => (
                  <ListItem key={player.id}>
                    <ListItemText
                      primary={
                        `${index + 1}. ${player.name}${player.name === teams[0].captain ? ' (c)' : ''}${player.name === teams[0].viceCaptain ? ' (vc)' : ''}`
                      }
                      secondary={
                        <Typography variant="body2" component="span" color="text.secondary">
                          Sold for: {player.soldPrice} Cr. • Round {player.soldInRound || '?'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Player Section */}
        {auctionState.status !== 'completed' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Player
                </Typography>
                {currentPlayer ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {currentPlayer.photoUrl && (
                        <Avatar
                          src={currentPlayer.photoUrl}
                          alt={currentPlayer.name}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        />
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6">
                          {isNameVisible ? currentPlayer.name : '******'}
                        </Typography>
                        <Button onClick={toggleNameVisibility} size="small" variant="outlined" sx={{ mt: 1, minWidth: 'auto', padding: '4px 8px' }}>
                          {isNameVisible ? 'Hide Name' : 'Reveal Name'}
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                          Band: {bands.find(band => band.id === currentPlayer.band)?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                    {auctionState.status === 'setup' && (
                      <Typography color="text.secondary">
                        Start the auction to begin bidding
                      </Typography>
                    )}
                    {auctionState.status === 'in_progress' && (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Current Bid: {currentBid} Cr.
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                              variant="outlined"
                              onClick={() => handleIncrementBid(1)}
                              disabled={!biddingStarted}
                            >
                              +1
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleIncrementBid(2)}
                              disabled={!biddingStarted}
                            >
                              +2
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleIncrementBid(4)}
                              disabled={!biddingStarted}
                            >
                              +4
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleIncrementBid(5)}
                              disabled={!biddingStarted}
                            >
                              +5
                            </Button>
                            <TextField
                              label="Custom Bid"
                              type="number"
                              value={currentBid}
                              onChange={handleCustomBidChange}
                              size="small"
                              sx={{ width: 120 }}
                              inputProps={{ min: Number(currentBid) + 1 }}
                              disabled={!biddingStarted}
                            />
                          </Box>
                          {!highestBid && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <Button
                                variant="contained"
                                onClick={handlePlaceBid}
                                fullWidth
                              >
                                Start Bid
                              </Button>
                              <Button
                                variant="contained"
                                color="warning"
                                onClick={handleSkipPlayer}
                                fullWidth
                              >
                                Skip Player
                              </Button>
                            </Box>
                          )}
                          {highestBid && (
                            <Box sx={{ mb: 2 }}>
                              <FormControl fullWidth>
                                <InputLabel>Sold to</InputLabel>
                                <Select
                                  value={selectedTeam}
                                  label="Sold to"
                                  onChange={(e) => setSelectedTeam(e.target.value)}
                                >
                                  {teams.filter(team => team.remainingBudget >= Number(currentBid)).map((team) => (
                                    <MenuItem key={team.id} value={team.id}>
                                      {team.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={handleSellPlayer}
                                disabled={!selectedTeam}
                                fullWidth
                                sx={{ mt: 2 }}
                              >
                                Confirm Sale
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </>
                    )}
                  </>
                ) : (
                  <Typography color="text.secondary">
                    No players available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Right Team Section */}
        <Grid item xs={12} md={auctionState.status === 'completed' ? 6 : 3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {teams[1]?.name || 'Team 2'}
                {teams[1]?.remainingBudget <= Number(currentBid) + 10 && (
                  <Typography variant="body2" color="error" component="span" sx={{ ml: 1 }}>
                    Warning: Limited funds left
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {teams[1]?.captain && `Captain: ${teams[1].captain}`}
                {teams[1]?.viceCaptain && (
                  <>
                    <br />
                    Vice Captain: {teams[1].viceCaptain}
                  </>
                )}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Budget: {teams[1]?.remainingBudget || 0} Cr.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Selected Players:
              </Typography>
              <List dense>
                {teams[1]?.players.map((player, index) => (
                  <ListItem key={player.id}>
                    <ListItemText
                      primary={
                        `${index + 1}. ${player.name}${player.name === teams[1].captain ? ' (c)' : ''}${player.name === teams[1].viceCaptain ? ' (vc)' : ''}`
                      }
                      secondary={
                        <Typography variant="body2" component="span" color="text.secondary">
                          Sold for: {player.soldPrice} Cr. • Round {player.soldInRound || '?'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Skipped Players List */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Skipped Players
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto', 
          pb: 2,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'background.paper',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'action.hover',
            borderRadius: 4,
          },
        }}>
          {Object.values(auctionState.unsoldPlayers)
            .flat()
            .filter(player => player.status === 'available')
            .map((player) => (
              <Card key={player.id} sx={{ minWidth: 200 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {player.photoUrl && (
                      <Avatar
                        src={player.photoUrl}
                        alt={player.name}
                        sx={{ width: 40, height: 40, mr: 1 }}
                      />
                    )}
                    <Typography variant="subtitle1">{player.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Band: {bands.find(band => band.id === player.band)?.name || 'Unknown'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </Box>
      </Box>

      {/* Round Complete Dialog */}
      <Dialog open={showRoundCompleteDialog} onClose={() => setShowRoundCompleteDialog(false)}>
        <DialogTitle>Round {auctionState.currentRound} Complete</DialogTitle>
        <DialogContent>
          <Typography>
            {unsoldPlayersCount} players were left unsold in this round.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExitAuction} color="error">
            Exit Auction
          </Button>
          <Button onClick={handleEditBands} color="primary">
            Edit Bands
          </Button>
          <Button onClick={handleContinueWithSameBands} color="success">
            Continue with Same Bands
          </Button>
        </DialogActions>
      </Dialog>

      {/* Band Edit Dialog */}
      <Dialog 
        open={showBandEditDialog} 
        onClose={() => setShowBandEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Bands</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={randomizeNextRound}
                    onChange={(e) => setRandomizeNextRound(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Randomize player order for next round
                </label>
              </FormControl>
            </Box>
            {editingBands.map((band) => (
              <Card key={band.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      label="Band Name"
                      value={band.name}
                      onChange={(e) => handleUpdateBand(band.id, { name: e.target.value })}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <TextField
                      label="Base Price"
                      type="number"
                      value={band.basePrice}
                      onChange={(e) => handleUpdateBand(band.id, { basePrice: Number(e.target.value) })}
                      size="small"
                      sx={{ width: 120, mr: 2 }}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteBand(band.id)}
                    >
                      Delete Band
                    </Button>
                  </Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Unsold Players:
                  </Typography>
                  <List dense>
                    {band.players.map((player) => (
                      <ListItem key={player.id}>
                        <ListItemText
                          primary={player.name}
                        />
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleUpdateBand(band.id, {
                            players: band.players.filter(p => p.id !== player.id)
                          })}
                        >
                          Remove
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Add Player</InputLabel>
                      <Select
                        value=""
                        label="Add Player"
                        onChange={(e) => {
                          const playerId = e.target.value;
                          const player = Object.values(auctionState.unsoldPlayers)
                            .flat()
                            .find(p => p.id === playerId);
                          if (player) {
                            handleUpdateBand(band.id, {
                              players: [...band.players, { ...player, band: band.id }]
                            });
                          }
                        }}
                      >
                        {(() => {
                          const unsoldPlayers = Object.values(auctionState.unsoldPlayers)
                            .flat()
                            .filter((player: Player) => 
                              player.status === 'available' && 
                              !editingBands.some(b => b.players.some(p => p.id === player.id))
                            );
                          
                          return unsoldPlayers.map((player: Player) => (
                            <MenuItem key={player.id} value={player.id}>
                              {player.name}
                            </MenuItem>
                          ));
                        })()}
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outlined"
              onClick={handleAddBand}
              sx={{ mt: 2 }}
            >
              Add New Band
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBandEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveBands} 
            variant="contained" 
            color="primary"
          >
            Resume Auction
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Auction; 