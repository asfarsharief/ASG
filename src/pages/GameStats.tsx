import React, { useState, useEffect } from 'react';
import * as localForage from 'localforage';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Add, Edit, Delete, SportsBasketball, ExpandMore } from '@mui/icons-material';
import { Game, Player, PlayerGameStats } from '../types';
import { gameApi, playerApi, teamApi, ApiError } from '../services/api';
import { transformGameFromBackend, transformGameToBackend, transformPlayerFromBackend, transformTeamFromBackend, transformPlayerGameStatsFromBackend, transformPlayerGameStatsToBackend, createDefaultPlayerGameStats } from '../utils/dataTransform';
import LoadingError from '../components/LoadingError';

const GameStatsPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGameDialog, setOpenGameDialog] = useState(false);
  const [isEditingGame, setIsEditingGame] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [newGame, setNewGame] = useState({
    gameName: '',
    gameDate: '',
    homeTeamId: '',
    homeTeamName: '',
    awayTeamId: '',
    awayTeamName: '',
    homeScore: 0,
    awayScore: 0,
  });
  // Removed homeTeamPlayers and awayTeamPlayers - now using playerStats for team management
  const [playerStats, setPlayerStats] = useState<PlayerGameStats[]>([]);
  const [openPlayerDialog, setOpenPlayerDialog] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [currentTeamType, setCurrentTeamType] = useState<'home' | 'away'>('home');
  const [newPlayerStats, setNewPlayerStats] = useState<PlayerGameStats>({
    id: '',
    playerId: '',
    playerName: '',
    teamId: '',
    teamName: '',
    gameId: '',
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading data...');
      
      // Try to load from browser storage first
      const [cachedGames, cachedPlayers, cachedTeams] = await Promise.all([
        localForage.getItem('games'),
        localForage.getItem('players'),
        localForage.getItem('teams'),
      ]);
      
      // If we have cached data, use it immediately for faster UI
      if (cachedGames && cachedPlayers && cachedTeams) {
        console.log('Loading from browser storage...');
        setGames(Array.isArray(cachedGames) ? cachedGames : []);
        setPlayers(Array.isArray(cachedPlayers) ? cachedPlayers : []);
        setTeams(Array.isArray(cachedTeams) ? cachedTeams : []);
      }
      
      // Always fetch fresh data from backend in background
      try {
        const [gamesData, playersData, teamsData] = await Promise.all([
          gameApi.getGames(),
          playerApi.getPlayers(),
          teamApi.getTeams(),
        ]);
        
        console.log('Raw players data:', playersData);
        const transformedGames = gamesData.map(transformGameFromBackend);
        const transformedPlayers = playersData.map(transformPlayerFromBackend);
        const transformedTeams = teamsData.map(transformTeamFromBackend);
        
        console.log('Transformed players:', transformedPlayers);
        
        // Update state with fresh data
        setGames(transformedGames);
        setPlayers(transformedPlayers);
        setTeams(transformedTeams);
        
        // Update browser storage with fresh data
        await Promise.all([
          localForage.setItem('games', transformedGames),
          localForage.setItem('players', transformedPlayers),
          localForage.setItem('teams', transformedTeams),
        ]);
        
        console.log('Data updated in browser storage');
      } catch (backendError) {
        console.warn('Failed to fetch fresh data from backend, using cached data:', backendError);
        // If backend fails but we have cached data, continue with cached data
        if (!cachedGames || !cachedPlayers || !cachedTeams) {
          throw backendError; // Only throw if we don't have any cached data
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async () => {
    if (!newGame.gameName || !newGame.gameDate || !newGame.homeTeamName || !newGame.awayTeamName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const gameResult: 'home_win' | 'away_win' | 'tie' = 
        newGame.homeScore > newGame.awayScore ? 'home_win' : 
        newGame.awayScore > newGame.homeScore ? 'away_win' : 'tie';

      const gameData = transformGameToBackend({
        gameName: newGame.gameName,
        gameDate: newGame.gameDate,
        homeTeamId: '', // No longer using team IDs
        homeTeamName: newGame.homeTeamName,
        awayTeamId: '', // No longer using team IDs
        awayTeamName: newGame.awayTeamName,
        homeScore: newGame.homeScore,
        awayScore: newGame.awayScore,
        gameResult,
      });

      // Create temporary game object for immediate UI update
      const tempGame: Game = {
        id: `temp_${Date.now()}`, // Temporary ID
        gameName: newGame.gameName,
        gameDate: newGame.gameDate,
        homeTeamId: '',
        homeTeamName: newGame.homeTeamName,
        awayTeamId: '',
        awayTeamName: newGame.awayTeamName,
        homeScore: newGame.homeScore,
        awayScore: newGame.awayScore,
        gameResult,
        playerStats: playerStats.map(stat => ({
          ...stat,
          gameId: `temp_${Date.now()}`,
        })),
      };

      // Update browser storage immediately for responsive UI
      const updatedGames = [...games, tempGame];
      setGames(updatedGames);
      await localForage.setItem('games', updatedGames);

      try {
        // Push to backend
        const createdGame = await gameApi.createGame(gameData);
        const transformedGame = transformGameFromBackend(createdGame);

        // Add player stats to the game
        for (const stat of playerStats) {
          if (stat.playerId && stat.playerName) {
            const statsData = transformPlayerGameStatsToBackend({
              ...stat,
              gameId: transformedGame.id,
            });
            await gameApi.addPlayerStats(transformedGame.id, statsData);
          }
        }

        // Update with real data from backend
        const finalGame: Game = {
          ...transformedGame,
          playerStats: playerStats.map(stat => ({
            ...stat,
            gameId: transformedGame.id,
          })),
        };

        const finalGames = games.map(g => g.id === tempGame.id ? finalGame : g);
        setGames(finalGames);
        await localForage.setItem('games', finalGames);

        console.log('Game successfully created and synced with backend');
      } catch (backendError) {
        console.warn('Failed to sync with backend, keeping local changes:', backendError);
        // Keep the local changes even if backend fails
      }

      // Reset form
      setNewGame({
        gameName: '',
        gameDate: '',
        homeTeamId: '',
        homeTeamName: '',
        awayTeamId: '',
        awayTeamName: '',
        homeScore: 0,
        awayScore: 0,
      });
      setPlayerStats([]);
      setOpenGameDialog(false);
    } catch (err) {
      console.error('Error creating game:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerStats = async (game: Game) => {
    const updatedPlayers = Array.isArray(players) ? [...players] : [];

    game.playerStats.forEach(gameStat => {
      const playerIndex = updatedPlayers.findIndex(p => p.id === gameStat.playerId);
      if (playerIndex !== -1) {
        const player = updatedPlayers[playerIndex];
        const currentStats = player.basketballStats || {
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
        };

        // Determine if player won
        const playerWon = (gameStat.teamName === game.homeTeamName && game.gameResult === 'home_win') ||
                         (gameStat.teamName === game.awayTeamName && game.gameResult === 'away_win');

        // Update games played
        const newGamesPlayed = currentStats.gamesPlayed + 1;
        
        // Calculate new averages
        const newPointsAverage = ((currentStats.pointsAverage * currentStats.gamesPlayed) + gameStat.points) / newGamesPlayed;
        const newReboundsAverage = ((currentStats.reboundsAverage * currentStats.gamesPlayed) + gameStat.rebounds) / newGamesPlayed;
        const newAssistsAverage = ((currentStats.assistsAverage * currentStats.gamesPlayed) + gameStat.assists) / newGamesPlayed;
        const newStealsAverage = ((currentStats.stealsAverage * currentStats.gamesPlayed) + gameStat.steals) / newGamesPlayed;
        const newBlocksAverage = ((currentStats.blocksAverage * currentStats.gamesPlayed) + gameStat.blocks) / newGamesPlayed;
        const newTurnoversAverage = ((currentStats.turnoversAverage * currentStats.gamesPlayed) + gameStat.turnovers) / newGamesPlayed;
        const newMinutesPerGame = ((currentStats.minutesPerGame * currentStats.gamesPlayed) + gameStat.minutesPlayed) / newGamesPlayed;

        // Calculate win percentage
        const currentWins = Math.round((currentStats.winPercentage / 100) * currentStats.gamesPlayed);
        const newWins = currentWins + (playerWon ? 1 : 0);
        const newWinPercentage = (newWins / newGamesPlayed) * 100;

        // Calculate shooting percentages
        const newFieldGoalPercentage = gameStat.fieldGoalsAttempted > 0 ? 
          (gameStat.fieldGoalsMade / gameStat.fieldGoalsAttempted) * 100 : currentStats.fieldGoalPercentage;
        const newThreePointPercentage = gameStat.threePointersAttempted > 0 ? 
          (gameStat.threePointersMade / gameStat.threePointersAttempted) * 100 : currentStats.threePointPercentage;
        const newFreeThrowPercentage = gameStat.freeThrowsAttempted > 0 ? 
          (gameStat.freeThrowsMade / gameStat.freeThrowsAttempted) * 100 : currentStats.freeThrowPercentage;

        updatedPlayers[playerIndex] = {
          ...player,
          basketballStats: {
            ...currentStats,
            winPercentage: Math.round(newWinPercentage * 100) / 100,
            pointsAverage: Math.round(newPointsAverage * 100) / 100,
            fieldGoalPercentage: Math.round(newFieldGoalPercentage * 100) / 100,
            threePointPercentage: Math.round(newThreePointPercentage * 100) / 100,
            freeThrowPercentage: Math.round(newFreeThrowPercentage * 100) / 100,
            reboundsAverage: Math.round(newReboundsAverage * 100) / 100,
            assistsAverage: Math.round(newAssistsAverage * 100) / 100,
            stealsAverage: Math.round(newStealsAverage * 100) / 100,
            blocksAverage: Math.round(newBlocksAverage * 100) / 100,
            turnoversAverage: Math.round(newTurnoversAverage * 100) / 100,
            gamesPlayed: newGamesPlayed,
            minutesPerGame: Math.round(newMinutesPerGame * 100) / 100,
          },
        };
      }
    });

    setPlayers(updatedPlayers);
    await localForage.setItem('players', updatedPlayers);
  };

  const handleEditGame = (game: Game) => {
    setNewGame({
      gameName: game.gameName,
      gameDate: game.gameDate,
      homeTeamId: '', // No longer using team IDs
      homeTeamName: game.homeTeamName,
      awayTeamId: '', // No longer using team IDs
      awayTeamName: game.awayTeamName,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
    });
    setPlayerStats(game.playerStats);
    setIsEditingGame(true);
    setEditingGameId(game.id);
    setOpenGameDialog(true);
  };

  const handleUpdateGame = async () => {
    if (!editingGameId) return;

    try {
      setLoading(true);
      setError(null);

      const gameResult: 'home_win' | 'away_win' = newGame.homeScore > newGame.awayScore ? 'home_win' : 'away_win';

      const updatedGame: Game = {
        id: editingGameId,
        gameName: newGame.gameName,
        gameDate: newGame.gameDate,
        homeTeamId: '', // No longer using team IDs
        homeTeamName: newGame.homeTeamName,
        awayTeamId: '', // No longer using team IDs
        awayTeamName: newGame.awayTeamName,
        homeScore: newGame.homeScore,
        awayScore: newGame.awayScore,
        gameResult,
        playerStats: playerStats,
      };

      // Update browser storage immediately for responsive UI
      const updatedGames = games.map(g => g.id === editingGameId ? updatedGame : g);
      setGames(updatedGames);
      await localForage.setItem('games', updatedGames);

      try {
        // Push to backend
        const gameData = transformGameToBackend(updatedGame);
        await gameApi.updateGame(editingGameId, gameData);

        // Update player stats in backend
        for (const stat of playerStats) {
          if (stat.playerId && stat.playerName) {
            const statsData = transformPlayerGameStatsToBackend(stat);
            if (stat.id) {
              await gameApi.updatePlayerStats(editingGameId, stat.id, statsData);
            } else {
              await gameApi.addPlayerStats(editingGameId, statsData);
            }
          }
        }

        console.log('Game successfully updated and synced with backend');
      } catch (backendError) {
        console.warn('Failed to sync with backend, keeping local changes:', backendError);
        // Keep the local changes even if backend fails
      }

      // Reset form
      setNewGame({
        gameName: '',
        gameDate: '',
        homeTeamId: '',
        homeTeamName: '',
        awayTeamId: '',
        awayTeamName: '',
        homeScore: 0,
        awayScore: 0,
      });
      setPlayerStats([]);
      setIsEditingGame(false);
      setEditingGameId(null);
      setOpenGameDialog(false);
    } catch (err) {
      console.error('Error updating game:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to update game');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        setLoading(true);
        setError(null);

        // Update browser storage immediately for responsive UI
        const updatedGames = games.filter(g => g.id !== gameId);
        setGames(updatedGames);
        await localForage.setItem('games', updatedGames);

        try {
          // Push to backend
          await gameApi.deleteGame(gameId);
          console.log('Game successfully deleted and synced with backend');
        } catch (backendError) {
          console.warn('Failed to sync deletion with backend, keeping local changes:', backendError);
          // Keep the local changes even if backend fails
        }
      } catch (err) {
        console.error('Error deleting game:', err);
        setError(err instanceof ApiError ? err.message : 'Failed to delete game');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseGameDialog = () => {
    setNewGame({
      gameName: '',
      gameDate: '',
      homeTeamId: '',
      homeTeamName: '',
      awayTeamId: '',
      awayTeamName: '',
      homeScore: 0,
      awayScore: 0,
    });
    setPlayerStats([]);
    setIsEditingGame(false);
    setEditingGameId(null);
    setOpenGameDialog(false);
  };



  const getTeamPlayers = (teamType: 'home' | 'away') => {
    const teamName = teamType === 'home' ? newGame.homeTeamName : newGame.awayTeamName;
    // Get players who have stats for this team
    const teamPlayerIds = playerStats
      .filter(stat => stat.teamName === teamName)
      .map(stat => stat.playerId);
    
    return players.filter(player => teamPlayerIds.includes(player.id));
  };

  // Get players who are not already assigned to any team
  const getAvailablePlayersForTeam = (teamType: 'home' | 'away') => {
    const teamName = teamType === 'home' ? newGame.homeTeamName : newGame.awayTeamName;
    const assignedPlayerIds = new Set(playerStats.map(stat => stat.playerId));
    return players.filter(player => !assignedPlayerIds.has(player.id));
  };


  const handlePlayerRemove = async (playerId: string, teamType: 'home' | 'away') => {
    const teamName = teamType === 'home' ? newGame.homeTeamName : newGame.awayTeamName;
    
    try {
      setLoading(true);
      setError(null);

      // Find the stat to remove
      const statToRemove = playerStats.find(stat => 
        stat.playerId === playerId && stat.teamName === teamName
      );

      // Update browser storage immediately for responsive UI
      const updatedPlayerStats = playerStats.filter(stat => 
        !(stat.playerId === playerId && stat.teamName === teamName)
      );
      setPlayerStats(updatedPlayerStats);

      // Update the games array
      const updatedGames = games.map(game => {
        if (game.id === newPlayerStats.gameId) {
          return {
            ...game,
            playerStats: updatedPlayerStats.filter(stat => stat.gameId === game.id)
          };
        }
        return game;
      });
      setGames(updatedGames);
      await localForage.setItem('games', updatedGames);

      try {
        // Push to backend
        if (statToRemove && statToRemove.id && !statToRemove.id.startsWith('temp_')) {
          await gameApi.deletePlayerStats(statToRemove.gameId, statToRemove.id);
        }
        console.log('Player stats successfully removed and synced with backend');
      } catch (backendError) {
        console.warn('Failed to sync removal with backend, keeping local changes:', backendError);
        // Keep the local changes even if backend fails
      }
    } catch (err) {
      console.error('Error removing player stats:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to remove player stats');
    } finally {
      setLoading(false);
    }
  };


  const getPlayerStats = (playerId: string, teamType?: 'home' | 'away') => {
    if (teamType) {
      const teamName = teamType === 'home' ? newGame.homeTeamName : newGame.awayTeamName;
      return playerStats.find(stat => 
        stat.playerId === playerId && stat.teamName === teamName
      );
    }
    return playerStats.find(stat => stat.playerId === playerId);
  };

  const handleOpenPlayerDialog = (teamType: 'home' | 'away', playerId?: string) => {
    setCurrentTeamType(teamType);
    if (playerId) {
      // Editing existing player
      const existingStats = getPlayerStats(playerId);
      if (existingStats) {
        setNewPlayerStats(existingStats);
        setEditingPlayerId(playerId);
      }
    } else {
      // Adding new player
      setNewPlayerStats({
        id: '',
        playerId: '',
        playerName: '',
        teamId: '',
        teamName: teamType === 'home' ? newGame.homeTeamName : newGame.awayTeamName,
        gameId: '',
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
      setEditingPlayerId(null);
    }
    setOpenPlayerDialog(true);
  };

  const handleClosePlayerDialog = () => {
    setOpenPlayerDialog(false);
    setEditingPlayerId(null);
    setNewPlayerStats({
      id: '',
      playerId: '',
      playerName: '',
      teamId: '',
      teamName: '',
      gameId: '',
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
  };

  const handlePlayerSelect = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setNewPlayerStats(prev => ({
        ...prev,
        playerId: playerId,
        playerName: player.name,
        teamName: currentTeamType === 'home' ? newGame.homeTeamName : newGame.awayTeamName,
      }));
    }
  };

  const handleSavePlayerStats = async () => {
    if (!newPlayerStats.playerId) {
      alert('Please select a player');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update browser storage immediately for responsive UI
      let updatedPlayerStats: PlayerGameStats[];
      
      if (editingPlayerId) {
        // Update existing player stats
        updatedPlayerStats = playerStats.map(stat => 
          stat.playerId === editingPlayerId ? newPlayerStats : stat
        );
      } else {
        // Add new player stats
        const newStat: PlayerGameStats = {
          ...newPlayerStats,
          id: `temp_${Date.now()}`, // Temporary ID
        };
        updatedPlayerStats = [...playerStats, newStat];
      }
      
      setPlayerStats(updatedPlayerStats);
      
      // Update the games array with new player stats
      const updatedGames = games.map(game => {
        if (game.id === newPlayerStats.gameId) {
          return {
            ...game,
            playerStats: updatedPlayerStats.filter(stat => stat.gameId === game.id)
          };
        }
        return game;
      });
      setGames(updatedGames);
      await localForage.setItem('games', updatedGames);

      try {
        // Push to backend
        const statsData = transformPlayerGameStatsToBackend(newPlayerStats);

        if (editingPlayerId) {
          // Update existing player stats
          const existingStat = playerStats.find(stat => stat.playerId === editingPlayerId);
          if (existingStat) {
            await gameApi.updatePlayerStats(newPlayerStats.gameId, existingStat.id, statsData);
          }
        } else {
          // Add new player stats
          const createdStat = await gameApi.addPlayerStats(newPlayerStats.gameId, statsData);
          const transformedStat = transformPlayerGameStatsFromBackend(createdStat);
          
          // Update with real data from backend
          const finalPlayerStats = playerStats.map(stat => 
            stat.id === `temp_${Date.now()}` ? transformedStat : stat
          );
          setPlayerStats(finalPlayerStats);
          
          // Update games array with real data
          const finalGames = games.map(game => {
            if (game.id === newPlayerStats.gameId) {
              return {
                ...game,
                playerStats: finalPlayerStats.filter(stat => stat.gameId === game.id)
              };
            }
            return game;
          });
          setGames(finalGames);
          await localForage.setItem('games', finalGames);
        }

        console.log('Player stats successfully saved and synced with backend');
      } catch (backendError) {
        console.warn('Failed to sync with backend, keeping local changes:', backendError);
        // Keep the local changes even if backend fails
      }

      handleClosePlayerDialog();
    } catch (err) {
      console.error('Error saving player stats:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to save player stats');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayerStat = (field: keyof PlayerGameStats, value: any) => {
    setNewPlayerStats(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTeamStats = (teamType: 'home' | 'away') => {
    const teamName = teamType === 'home' ? newGame.homeTeamName : newGame.awayTeamName;
    const teamPlayerStats = playerStats.filter(stat => stat.teamName === teamName);
    
    if (teamPlayerStats.length === 0) {
      return {
        totalPoints: 0,
        totalRebounds: 0,
        totalAssists: 0,
        totalSteals: 0,
        totalBlocks: 0,
        totalTurnovers: 0,
        totalFieldGoalsMade: 0,
        totalFieldGoalsAttempted: 0,
        totalThreePointersMade: 0,
        totalThreePointersAttempted: 0,
        totalFreeThrowsMade: 0,
        totalFreeThrowsAttempted: 0,
        fieldGoalPercentage: 0,
        threePointPercentage: 0,
        freeThrowPercentage: 0,
      };
    }

    const totals = teamPlayerStats.reduce((acc, stat) => ({
      totalPoints: acc.totalPoints + stat.points,
      totalRebounds: acc.totalRebounds + stat.rebounds,
      totalAssists: acc.totalAssists + stat.assists,
      totalSteals: acc.totalSteals + stat.steals,
      totalBlocks: acc.totalBlocks + stat.blocks,
      totalTurnovers: acc.totalTurnovers + stat.turnovers,
      totalFieldGoalsMade: acc.totalFieldGoalsMade + stat.fieldGoalsMade,
      totalFieldGoalsAttempted: acc.totalFieldGoalsAttempted + stat.fieldGoalsAttempted,
      totalThreePointersMade: acc.totalThreePointersMade + stat.threePointersMade,
      totalThreePointersAttempted: acc.totalThreePointersAttempted + stat.threePointersAttempted,
      totalFreeThrowsMade: acc.totalFreeThrowsMade + stat.freeThrowsMade,
      totalFreeThrowsAttempted: acc.totalFreeThrowsAttempted + stat.freeThrowsAttempted,
    }), {
      totalPoints: 0,
      totalRebounds: 0,
      totalAssists: 0,
      totalSteals: 0,
      totalBlocks: 0,
      totalTurnovers: 0,
      totalFieldGoalsMade: 0,
      totalFieldGoalsAttempted: 0,
      totalThreePointersMade: 0,
      totalThreePointersAttempted: 0,
      totalFreeThrowsMade: 0,
      totalFreeThrowsAttempted: 0,
    });

    return {
      ...totals,
      fieldGoalPercentage: totals.totalFieldGoalsAttempted > 0 
        ? Math.round((totals.totalFieldGoalsMade / totals.totalFieldGoalsAttempted) * 100) 
        : 0,
      threePointPercentage: totals.totalThreePointersAttempted > 0 
        ? Math.round((totals.totalThreePointersMade / totals.totalThreePointersAttempted) * 100) 
        : 0,
      freeThrowPercentage: totals.totalFreeThrowsAttempted > 0 
        ? Math.round((totals.totalFreeThrowsMade / totals.totalFreeThrowsAttempted) * 100) 
        : 0,
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsBasketball />
          Game Statistics
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpenGameDialog(true)}
        >
          Add Game
        </Button>
      </Box>

      <LoadingError loading={loading} error={error} onRetry={loadData}>
        {games.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No games recorded yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Game" to start recording game statistics
              </Typography>
            </CardContent>
          </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {games.map((game) => (
            <Accordion key={game.id}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6">{game.gameName}</Typography>
                  <Chip 
                    label={new Date(game.gameDate).toLocaleDateString()} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Typography variant="body1">
                    {game.homeTeamName} vs {game.awayTeamName}
                  </Typography>
                  <Chip 
                    label={`${game.homeScore} - ${game.awayScore}`}
                    color={game.gameResult === 'home_win' ? 'success' : 'default'}
                    size="small"
                  />
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditGame(game); }}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteGame(game.id); }}>
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell>Min</TableCell>
                        <TableCell>PTS</TableCell>
                        <TableCell>REB</TableCell>
                        <TableCell>AST</TableCell>
                        <TableCell>STL</TableCell>
                        <TableCell>BLK</TableCell>
                        <TableCell>TO</TableCell>
                        <TableCell>FG%</TableCell>
                        <TableCell>3P%</TableCell>
                        <TableCell>FT%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {game.playerStats.map((stat) => (
                        <TableRow key={stat.id}>
                          <TableCell>{stat.playerName}</TableCell>
                          <TableCell>{stat.teamName}</TableCell>
                          <TableCell>{stat.minutesPlayed}</TableCell>
                          <TableCell>{stat.points}</TableCell>
                          <TableCell>{stat.rebounds}</TableCell>
                          <TableCell>{stat.assists}</TableCell>
                          <TableCell>{stat.steals}</TableCell>
                          <TableCell>{stat.blocks}</TableCell>
                          <TableCell>{stat.turnovers}</TableCell>
                          <TableCell>
                            {stat.fieldGoalsAttempted > 0 
                              ? `${Math.round((stat.fieldGoalsMade / stat.fieldGoalsAttempted) * 100)}%`
                              : '0%'
                            }
                          </TableCell>
                          <TableCell>
                            {stat.threePointersAttempted > 0 
                              ? `${Math.round((stat.threePointersMade / stat.threePointersAttempted) * 100)}%`
                              : '0%'
                            }
                          </TableCell>
                          <TableCell>
                            {stat.freeThrowsAttempted > 0 
                              ? `${Math.round((stat.freeThrowsMade / stat.freeThrowsAttempted) * 100)}%`
                              : '0%'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      </LoadingError>

      {/* Add/Edit Game Dialog */}
      <Dialog open={openGameDialog} onClose={handleCloseGameDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {isEditingGame ? 'Edit Game' : 'Add New Game'}
        </DialogTitle>
        <DialogContent>
          {/* Game Basic Info */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Game Name"
                value={newGame.gameName}
                onChange={(e) => setNewGame({ ...newGame, gameName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Game Date"
                type="date"
                value={newGame.gameDate}
                onChange={(e) => setNewGame({ ...newGame, gameDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label={`${newGame.homeTeamName || 'Team 1'} Score`}
                  type="number"
                  value={newGame.homeScore}
                  onChange={(e) => setNewGame({ ...newGame, homeScore: parseInt(e.target.value) || 0 })}
                  required
                />
                <TextField
                  fullWidth
                  label={`${newGame.awayTeamName || 'Team 2'} Score`}
                  type="number"
                  value={newGame.awayScore}
                  onChange={(e) => setNewGame({ ...newGame, awayScore: parseInt(e.target.value) || 0 })}
                  required
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Main Content: Two Team Sections */}
          <Grid container spacing={4}>
            {/* Team 1 Section */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ flexGrow: 1 }}>
                      {newGame.homeTeamName || 'Team 1'}
                    </Typography>
                    <Chip 
                      label={`${getTeamPlayers('home').length} players`} 
                      color="primary" 
                      size="small"
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    required
                    label="Home Team"
                    value={newGame.homeTeamName}
                    onChange={(e) => setNewGame({ 
                      ...newGame, 
                      homeTeamName: e.target.value,
                      homeTeamId: '' // Clear team ID when manually entering name
                    })}
                    sx={{ mb: 3 }}
                  />

                  {/* Team 1 Players List */}
                  {getTeamPlayers('home').length > 0 ? (
                    <Box sx={{ mb: 3 }}>
                      {getTeamPlayers('home').map((player: Player) => {
                        const stats = getPlayerStats(player.id, 'home');
                        return (
                          <Card key={player.id} sx={{ mb: 1, p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {player.name}
                                </Typography>
                                {player.band && (
                                  <Chip 
                                    label={`Band ${player.band}`} 
                                    size="small" 
                                    variant="outlined" 
                                    color="primary"
                                  />
                                )}
                                <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                                  <Typography variant="body2" color="primary">
                                    PTS: {stats?.points || 0}
                                  </Typography>
                                  <Typography variant="body2" color="secondary">
                                    REB: {stats?.rebounds || 0}
                                  </Typography>
                                  <Typography variant="body2" color="success.main">
                                    AST: {stats?.assists || 0}
                                  </Typography>
                                  <Typography variant="body2">
                                    MIN: {stats?.minutesPlayed || 0}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPlayerDialog('home', player.id)}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handlePlayerRemove(player.id, 'home')}
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Card>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      border: '2px dashed #e0e0e0', 
                      borderRadius: 2,
                      mb: 3,
                      backgroundColor: '#fafafa'
                    }}>
                      <Typography variant="body1" color="text.secondary">
                        No players added yet
                      </Typography>
                    </Box>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenPlayerDialog('home')}
                    size="large"
                  >
                    Add Player to Team 1
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Team 2 Section */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ flexGrow: 1 }}>
                      {newGame.awayTeamName || 'Team 2'}
                    </Typography>
                    <Chip 
                      label={`${getTeamPlayers('away').length} players`} 
                      color="secondary" 
                      size="small"
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    required
                    label="Away Team"
                    value={newGame.awayTeamName}
                    onChange={(e) => setNewGame({ 
                      ...newGame, 
                      awayTeamName: e.target.value,
                      awayTeamId: '' // Clear team ID when manually entering name
                    })}
                    sx={{ mb: 3 }}
                  />

                  {/* Team 2 Players List */}
                  {getTeamPlayers('away').length > 0 ? (
                    <Box sx={{ mb: 3 }}>
                      {getTeamPlayers('away').map((player: Player) => {
                        const stats = getPlayerStats(player.id, 'away');
                        return (
                          <Card key={player.id} sx={{ mb: 1, p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {player.name}
                                </Typography>
                                {player.band && (
                                  <Chip 
                                    label={`Band ${player.band}`} 
                                    size="small" 
                                    variant="outlined" 
                                    color="secondary"
                                  />
                                )}
                                <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                                  <Typography variant="body2" color="primary">
                                    PTS: {stats?.points || 0}
                                  </Typography>
                                  <Typography variant="body2" color="secondary">
                                    REB: {stats?.rebounds || 0}
                                  </Typography>
                                  <Typography variant="body2" color="success.main">
                                    AST: {stats?.assists || 0}
                                  </Typography>
                                  <Typography variant="body2">
                                    MIN: {stats?.minutesPlayed || 0}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPlayerDialog('away', player.id)}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handlePlayerRemove(player.id, 'away')}
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Card>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      border: '2px dashed #e0e0e0', 
                      borderRadius: 2,
                      mb: 3,
                      backgroundColor: '#fafafa'
                    }}>
                      <Typography variant="body1" color="text.secondary">
                        No players added yet
                      </Typography>
                    </Box>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenPlayerDialog('away')}
                    size="large"
                    color="secondary"
                  >
                    Add Player to Team 2
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Team Stats Summary */}
          {playerStats.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Team Statistics Summary</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {newGame.homeTeamName || 'Team 1'}
                      </Typography>
                      {(() => {
                        const stats = calculateTeamStats('home');
                        return (
                          <Grid container spacing={1}>
                            <Grid item xs={6}><Typography variant="body2">Points: {stats.totalPoints}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Rebounds: {stats.totalRebounds}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Assists: {stats.totalAssists}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Steals: {stats.totalSteals}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Blocks: {stats.totalBlocks}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Turnovers: {stats.totalTurnovers}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">FG%: {stats.fieldGoalPercentage}%</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">3P%: {stats.threePointPercentage}%</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">FT%: {stats.freeThrowPercentage}%</Typography></Grid>
                          </Grid>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {newGame.awayTeamName || 'Team 2'}
                      </Typography>
                      {(() => {
                        const stats = calculateTeamStats('away');
                        return (
                          <Grid container spacing={1}>
                            <Grid item xs={6}><Typography variant="body2">Points: {stats.totalPoints}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Rebounds: {stats.totalRebounds}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Assists: {stats.totalAssists}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Steals: {stats.totalSteals}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Blocks: {stats.totalBlocks}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Turnovers: {stats.totalTurnovers}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">FG%: {stats.fieldGoalPercentage}%</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">3P%: {stats.threePointPercentage}%</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">FT%: {stats.freeThrowPercentage}%</Typography></Grid>
                          </Grid>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGameDialog}>Cancel</Button>
          <Button
            onClick={isEditingGame ? handleUpdateGame : handleAddGame}
            variant="contained"
          >
            {isEditingGame ? 'Update Game' : 'Add Game'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Player Dialog */}
      <Dialog open={openPlayerDialog} onClose={handleClosePlayerDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlayerId ? 'Edit Player Stats' : 'Add Player to Team'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Player Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Player</InputLabel>
                <Select
                  value={newPlayerStats.playerId}
                  onChange={(e) => handlePlayerSelect(e.target.value as string)}
                  displayEmpty
                  disabled={!!editingPlayerId}
                >
                  <MenuItem value="" disabled>
                    Select a player
                  </MenuItem>
                  {(() => {
                    if (!Array.isArray(players) || players.length === 0) {
                      return [
                        <MenuItem key="no-players" value="" disabled>
                          {loading ? 'Loading players...' : 'No players available'}
                        </MenuItem>
                      ];
                    }
                    
                    const availablePlayers = getAvailablePlayersForTeam(currentTeamType);
                    
                    if (availablePlayers.length === 0) {
                      return [
                        <MenuItem key="no-available-players" value="" disabled>
                          No available players for this team
                        </MenuItem>
                      ];
                    }
                    
                    return availablePlayers.map((player) => (
                      <MenuItem key={player.id} value={player.id}>
                        {player.name} {player.band ? `(Band ${player.band})` : ''}
                      </MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
            </Grid>

            {/* Basic Stats */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Basic Statistics</Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Minutes Played"
                type="number"
                value={newPlayerStats.minutesPlayed}
                onChange={(e) => handleUpdatePlayerStat('minutesPlayed', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Points"
                type="number"
                value={newPlayerStats.points}
                onChange={(e) => handleUpdatePlayerStat('points', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Rebounds"
                type="number"
                value={newPlayerStats.rebounds}
                onChange={(e) => handleUpdatePlayerStat('rebounds', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Assists"
                type="number"
                value={newPlayerStats.assists}
                onChange={(e) => handleUpdatePlayerStat('assists', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>

            {/* Advanced Stats */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Advanced Statistics</Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Steals"
                type="number"
                value={newPlayerStats.steals}
                onChange={(e) => handleUpdatePlayerStat('steals', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Blocks"
                type="number"
                value={newPlayerStats.blocks}
                onChange={(e) => handleUpdatePlayerStat('blocks', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Turnovers"
                type="number"
                value={newPlayerStats.turnovers}
                onChange={(e) => handleUpdatePlayerStat('turnovers', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Personal Fouls"
                type="number"
                value={newPlayerStats.personalFouls}
                onChange={(e) => handleUpdatePlayerStat('personalFouls', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>

            {/* Shooting Stats */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Shooting Statistics</Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="FG Made"
                type="number"
                value={newPlayerStats.fieldGoalsMade}
                onChange={(e) => handleUpdatePlayerStat('fieldGoalsMade', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="FG Attempted"
                type="number"
                value={newPlayerStats.fieldGoalsAttempted}
                onChange={(e) => handleUpdatePlayerStat('fieldGoalsAttempted', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="3P Made"
                type="number"
                value={newPlayerStats.threePointersMade}
                onChange={(e) => handleUpdatePlayerStat('threePointersMade', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="3P Attempted"
                type="number"
                value={newPlayerStats.threePointersAttempted}
                onChange={(e) => handleUpdatePlayerStat('threePointersAttempted', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="FT Made"
                type="number"
                value={newPlayerStats.freeThrowsMade}
                onChange={(e) => handleUpdatePlayerStat('freeThrowsMade', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="FT Attempted"
                type="number"
                value={newPlayerStats.freeThrowsAttempted}
                onChange={(e) => handleUpdatePlayerStat('freeThrowsAttempted', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Plus/Minus"
                type="number"
                value={newPlayerStats.plusMinus}
                onChange={(e) => handleUpdatePlayerStat('plusMinus', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>

            {/* Shooting Percentages Display */}
            {newPlayerStats.fieldGoalsAttempted > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Shooting Percentages: 
                  FG%: {Math.round((newPlayerStats.fieldGoalsMade / newPlayerStats.fieldGoalsAttempted) * 100)}% | 
                  {newPlayerStats.threePointersAttempted > 0 && ` 3P%: ${Math.round((newPlayerStats.threePointersMade / newPlayerStats.threePointersAttempted) * 100)}%`} | 
                  {newPlayerStats.freeThrowsAttempted > 0 && ` FT%: ${Math.round((newPlayerStats.freeThrowsMade / newPlayerStats.freeThrowsAttempted) * 100)}%`}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlayerDialog}>Cancel</Button>
          <Button
            onClick={handleSavePlayerStats}
            variant="contained"
            disabled={!newPlayerStats.playerId}
          >
            {editingPlayerId ? 'Update Player' : 'Add Player'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameStatsPage;