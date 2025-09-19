import React, { useState, useEffect } from 'react';
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
import localForage from 'localforage';
import { Game, Player, PlayerGameStats } from '../types';
import { formatDate } from '../utils/dateUtils';
import { createGame, updateGame, deleteGame, updatePlayer, ApiGame, ApiPlayerGameStats, ApiPlayer } from '../services/api';

const GameStatsPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [openGameDialog, setOpenGameDialog] = useState(false);
  const [isEditingGame, setIsEditingGame] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [newGame, setNewGame] = useState({
    gameName: '',
    gameDate: '',
    homeTeamName: '',
    awayTeamName: '',
    homeScore: 0,
    awayScore: 0,
  });
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<string[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<string[]>([]);
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

  // Helper functions to convert between frontend and API types
  const convertGameToApi = (game: Game): ApiGame => ({
    id: game.id,
    gameName: game.gameName,
    gameDate: game.gameDate,
    homeTeamName: game.homeTeamName,
    awayTeamName: game.awayTeamName,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    gameResult: game.gameResult,
    playerStats: game.playerStats.map(convertPlayerGameStatsToApi)
  });

  const convertApiToGame = (apiGame: ApiGame): Game => ({
    id: apiGame.id,
    gameName: apiGame.gameName,
    gameDate: apiGame.gameDate,
    homeTeamId: '', // Not used in API
    homeTeamName: apiGame.homeTeamName,
    awayTeamId: '', // Not used in API
    awayTeamName: apiGame.awayTeamName,
    homeScore: apiGame.homeScore,
    awayScore: apiGame.awayScore,
    gameResult: apiGame.gameResult as 'home_win' | 'away_win',
    playerStats: apiGame.playerStats.map(convertApiToPlayerGameStats)
  });

  const convertPlayerGameStatsToApi = (stats: PlayerGameStats): ApiPlayerGameStats => ({
    id: stats.id,
    playerId: stats.playerId,
    playerName: stats.playerName,
    teamId: stats.teamId,
    teamName: stats.teamName,
    gameId: stats.gameId,
    minutesPlayed: stats.minutesPlayed,
    points: stats.points,
    fieldGoalsMade: stats.fieldGoalsMade,
    fieldGoalsAttempted: stats.fieldGoalsAttempted,
    threePointersMade: stats.threePointersMade,
    threePointersAttempted: stats.threePointersAttempted,
    freeThrowsMade: stats.freeThrowsMade,
    freeThrowsAttempted: stats.freeThrowsAttempted,
    rebounds: stats.rebounds,
    assists: stats.assists,
    steals: stats.steals,
    blocks: stats.blocks,
    turnovers: stats.turnovers,
    personalFouls: stats.personalFouls,
    plusMinus: stats.plusMinus
  });

  const convertApiToPlayerGameStats = (apiStats: ApiPlayerGameStats): PlayerGameStats => ({
    id: apiStats.id,
    playerId: apiStats.playerId,
    playerName: apiStats.playerName,
    teamId: apiStats.teamId,
    teamName: apiStats.teamName,
    gameId: apiStats.gameId,
    minutesPlayed: apiStats.minutesPlayed,
    points: apiStats.points,
    fieldGoalsMade: apiStats.fieldGoalsMade,
    fieldGoalsAttempted: apiStats.fieldGoalsAttempted,
    threePointersMade: apiStats.threePointersMade,
    threePointersAttempted: apiStats.threePointersAttempted,
    freeThrowsMade: apiStats.freeThrowsMade,
    freeThrowsAttempted: apiStats.freeThrowsAttempted,
    rebounds: apiStats.rebounds,
    assists: apiStats.assists,
    steals: apiStats.steals,
    blocks: apiStats.blocks,
    turnovers: apiStats.turnovers,
    personalFouls: apiStats.personalFouls,
    plusMinus: apiStats.plusMinus
  });

  // Helper function to convert Player to ApiPlayer
  const convertPlayerToApi = (player: Player): ApiPlayer => ({
    id: player.id,
    name: player.name,
    band: player.band,
    status: player.status,
    basketballStats: player.basketballStats,
    photoUrl: player.photoUrl
  });

  // Function to sync updated players to backend
  const syncUpdatedPlayersToBackend = async (updatedPlayers: Player[]) => {
    console.log('Syncing updated players to backend...');
    
    for (const player of updatedPlayers) {
      try {
        const apiPlayer = convertPlayerToApi(player);
        const result = await updatePlayer(player.id, apiPlayer);
        console.log(`Player ${player.name} synced to backend:`, result);
      } catch (error) {
        console.error(`Failed to sync player ${player.name} to backend:`, error);
        // Continue with other players even if one fails
      }
    }
    
    console.log('Player sync to backend completed');
  };

  const loadData = async () => {
    try {
      const [gamesData, playersData] = await Promise.all([
        localForage.getItem<Game[]>('games'),
        localForage.getItem<Player[]>('players'),
      ]);
      
      console.log('Loaded players data:', playersData);
      console.log('Is players data array?', Array.isArray(playersData));
      
      // Handle both array and JSON string formats
      let processedPlayers = [];
      if (Array.isArray(playersData)) {
        processedPlayers = playersData;
      } else if (playersData && typeof playersData === 'string') {
        try {
          processedPlayers = JSON.parse(playersData);
        } catch (e) {
          console.error('Error parsing players JSON:', e);
          processedPlayers = [];
        }
      }
      
      // Ensure we always have arrays
      setGames(Array.isArray(gamesData) ? gamesData : []);
      setPlayers(Array.isArray(processedPlayers) ? processedPlayers : []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays on error
      setGames([]);
      setPlayers([]);
    }
  };

  const handleAddGame = async () => {
    if (!newGame.gameName || !newGame.gameDate || !newGame.homeTeamName || !newGame.awayTeamName) {
      alert('Please fill in all required fields');
      return;
    }

    if (homeTeamPlayers.length === 0 || awayTeamPlayers.length === 0) {
      alert('Please select players for both teams');
      return;
    }

    const gameResult: 'home_win' | 'away_win' = newGame.homeScore > newGame.awayScore ? 'home_win' : 'away_win';

    const game: Game = {
      id: Date.now().toString(),
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

    // Update localforage first
    const updatedGames = [...games, game];
    setGames(updatedGames);
    await localForage.setItem('games', updatedGames);

    // Then call API to save to backend
    try {
      const apiGame = convertGameToApi(game);
      const result = await createGame(apiGame);
      console.log('Game saved to backend:', result);
      
      // Update local game with the response from backend
      const updatedGame = convertApiToGame(result.game);
      setGames(prevGames => {
        const finalUpdatedGames = prevGames.map(g => g.id === game.id ? updatedGame : g);
        localForage.setItem('games', finalUpdatedGames);
        return finalUpdatedGames;
      });
    } catch (error) {
      console.error('Failed to save game to backend:', error);
      // Game is still saved locally, so we continue
    }

    // Update player statistics and sync to backend
    const updatedPlayers = await updatePlayerStats(game);
    await syncUpdatedPlayersToBackend(updatedPlayers);

    // Reset form
    setNewGame({
      gameName: '',
      gameDate: '',
      homeTeamName: '',
      awayTeamName: '',
      homeScore: 0,
      awayScore: 0,
    });
    setHomeTeamPlayers([]);
    setAwayTeamPlayers([]);
    setPlayerStats([]);
    setOpenGameDialog(false);
  };

  const updatePlayerStats = async (game: Game): Promise<Player[]> => {
    const updatedPlayers = Array.isArray(players) ? [...players] : [];
    const playersToSync: Player[] = [];

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

        const updatedPlayer = {
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

        updatedPlayers[playerIndex] = updatedPlayer;
        playersToSync.push(updatedPlayer);
      }
    });

    setPlayers(updatedPlayers);
    await localForage.setItem('players', updatedPlayers);
    
    return playersToSync;
  };

  const handleEditGame = (game: Game) => {
    setNewGame({
      gameName: game.gameName,
      gameDate: game.gameDate,
      homeTeamName: game.homeTeamName,
      awayTeamName: game.awayTeamName,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
    });
    setPlayerStats(game.playerStats);
    
    // Populate team players based on existing player stats
    const homePlayers: string[] = [];
    const awayPlayers: string[] = [];
    
    game.playerStats.forEach(stat => {
      if (stat.teamName === game.homeTeamName) {
        homePlayers.push(stat.playerId);
      } else if (stat.teamName === game.awayTeamName) {
        awayPlayers.push(stat.playerId);
      }
    });
    
    setHomeTeamPlayers(homePlayers);
    setAwayTeamPlayers(awayPlayers);
    
    setIsEditingGame(true);
    setEditingGameId(game.id);
    setOpenGameDialog(true);
  };

  const handleUpdateGame = async () => {
    if (!editingGameId) return;

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

    // Update localforage first
    const updatedGames = games.map(g => g.id === editingGameId ? updatedGame : g);
    setGames(updatedGames);
    await localForage.setItem('games', updatedGames);

    // Then call API to update in backend
    try {
      const apiGame = convertGameToApi(updatedGame);
      const result = await updateGame(editingGameId, apiGame);
      console.log('Game updated in backend:', result);
      
      // Update local game with the response from backend
      const finalUpdatedGame = convertApiToGame(result.game);
      setGames(prevGames => {
        const finalUpdatedGames = prevGames.map(g => g.id === editingGameId ? finalUpdatedGame : g);
        localForage.setItem('games', finalUpdatedGames);
        return finalUpdatedGames;
      });
    } catch (error) {
      console.error('Failed to update game in backend:', error);
      // Game is still updated locally, so we continue
    }

    // Update player statistics and sync to backend
    const updatedPlayers = await updatePlayerStats(updatedGame);
    await syncUpdatedPlayersToBackend(updatedPlayers);

    // Reset form
    setNewGame({
      gameName: '',
      gameDate: '',
      homeTeamName: '',
      awayTeamName: '',
      homeScore: 0,
      awayScore: 0,
    });
    setHomeTeamPlayers([]);
    setAwayTeamPlayers([]);
    setPlayerStats([]);
    setIsEditingGame(false);
    setEditingGameId(null);
    setOpenGameDialog(false);
  };

  const handleDeleteGame = async (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      // Update localforage first
      const updatedGames = games.filter(g => g.id !== gameId);
      setGames(updatedGames);
      await localForage.setItem('games', updatedGames);

      // Then call API to delete from backend
      try {
        const result = await deleteGame(gameId);
        console.log('Game deleted from backend:', result);
      } catch (error) {
        console.error('Failed to delete game from backend:', error);
        // Game is still deleted locally, so we continue
      }
    }
  };

  const handleCloseGameDialog = () => {
    setNewGame({
      gameName: '',
      gameDate: '',
      homeTeamName: '',
      awayTeamName: '',
      homeScore: 0,
      awayScore: 0,
    });
    setHomeTeamPlayers([]);
    setAwayTeamPlayers([]);
    setPlayerStats([]);
    setIsEditingGame(false);
    setEditingGameId(null);
    setOpenGameDialog(false);
  };



  const getTeamPlayers = (teamType: 'home' | 'away') => {
    const playerIds = teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    return Array.isArray(players) ? players.filter(player => playerIds.includes(player.id)) : [];
  };


  const handlePlayerRemove = (playerId: string, teamType: 'home' | 'away') => {
    if (teamType === 'home') {
      setHomeTeamPlayers(prev => prev.filter(id => id !== playerId));
    } else {
      setAwayTeamPlayers(prev => prev.filter(id => id !== playerId));
    }
    
    // Remove stats entry for the player
    setPlayerStats(prev => prev.filter(stat => stat.playerId !== playerId));
  };


  const getPlayerStats = (playerId: string) => {
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

  const handleSavePlayerStats = () => {
    if (!newPlayerStats.playerId) {
      alert('Please select a player');
      return;
    }

    if (editingPlayerId) {
      // Update existing player stats
      setPlayerStats(prev => prev.map(stat => 
        stat.playerId === editingPlayerId 
          ? { ...newPlayerStats, id: stat.id }
          : stat
      ));
    } else {
      // Add new player stats
      const newStat: PlayerGameStats = {
        ...newPlayerStats,
        id: Date.now().toString() + Math.random(),
      };
      
      setPlayerStats(prev => [...prev, newStat]);
      
      // Add player to team
      if (currentTeamType === 'home') {
        setHomeTeamPlayers(prev => [...prev, newPlayerStats.playerId]);
      } else {
        setAwayTeamPlayers(prev => [...prev, newPlayerStats.playerId]);
      }
    }

    handleClosePlayerDialog();
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
                    label={formatDate(game.gameDate)} 
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
                  type="text"
                  value={newGame.homeScore}
                  onChange={(e) => setNewGame({ ...newGame, homeScore: parseInt(e.target.value) || 0 })}
                  required
                />
                <TextField
                  fullWidth
                  label={`${newGame.awayTeamName || 'Team 2'} Score`}
                  type="text"
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
                    label="Team Name"
                    value={newGame.homeTeamName}
                    onChange={(e) => setNewGame({ ...newGame, homeTeamName: e.target.value })}
                    required
                    sx={{ mb: 3 }}
                  />

                  {/* Team 1 Players Table */}
                  {getTeamPlayers('home').length > 0 ? (
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell align="center">PTS</TableCell>
                            <TableCell align="center">REB</TableCell>
                            <TableCell align="center">AST</TableCell>
                            <TableCell align="center">MIN</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getTeamPlayers('home').map((player) => {
                            const stats = getPlayerStats(player.id);
                            return (
                              <TableRow key={player.id}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {player.name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" color="primary">
                                    {stats?.points || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" color="secondary">
                                    {stats?.rebounds || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" color="success.main">
                                    {stats?.assists || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {stats?.minutesPlayed || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
                    label="Team Name"
                    value={newGame.awayTeamName}
                    onChange={(e) => setNewGame({ ...newGame, awayTeamName: e.target.value })}
                    required
                    sx={{ mb: 3 }}
                  />

                  {/* Team 2 Players Table */}
                  {getTeamPlayers('away').length > 0 ? (
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell align="center">PTS</TableCell>
                            <TableCell align="center">REB</TableCell>
                            <TableCell align="center">AST</TableCell>
                            <TableCell align="center">MIN</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getTeamPlayers('away').map((player) => {
                            const stats = getPlayerStats(player.id);
                            return (
                              <TableRow key={player.id}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {player.name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" color="primary">
                                    {stats?.points || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" color="secondary">
                                    {stats?.rebounds || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" color="success.main">
                                    {stats?.assists || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {stats?.minutesPlayed || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
                  {Array.isArray(players) ? players
                    .filter(player => {
                      if (editingPlayerId) return player.id === newPlayerStats.playerId;
                      // Filter out players who are already in either team for this game
                      const allSelectedPlayers = [...homeTeamPlayers, ...awayTeamPlayers];
                      return !allSelectedPlayers.includes(player.id);
                    })
                    .map((player) => (
                      <MenuItem key={player.id} value={player.id}>
                        {player.name}
                      </MenuItem>
                    )) : []}
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
                type="text"
                value={newPlayerStats.minutesPlayed}
                onChange={(e) => handleUpdatePlayerStat('minutesPlayed', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Points"
                type="text"
                value={newPlayerStats.points}
                onChange={(e) => handleUpdatePlayerStat('points', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Rebounds"
                type="text"
                value={newPlayerStats.rebounds}
                onChange={(e) => handleUpdatePlayerStat('rebounds', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Assists"
                type="text"
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
                type="text"
                value={newPlayerStats.steals}
                onChange={(e) => handleUpdatePlayerStat('steals', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Blocks"
                type="text"
                value={newPlayerStats.blocks}
                onChange={(e) => handleUpdatePlayerStat('blocks', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Turnovers"
                type="text"
                value={newPlayerStats.turnovers}
                onChange={(e) => handleUpdatePlayerStat('turnovers', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Personal Fouls"
                type="text"
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
                type="text"
                value={newPlayerStats.fieldGoalsMade}
                onChange={(e) => handleUpdatePlayerStat('fieldGoalsMade', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="FG Attempted"
                type="text"
                value={newPlayerStats.fieldGoalsAttempted}
                onChange={(e) => handleUpdatePlayerStat('fieldGoalsAttempted', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="3P Made"
                type="text"
                value={newPlayerStats.threePointersMade}
                onChange={(e) => handleUpdatePlayerStat('threePointersMade', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="3P Attempted"
                type="text"
                value={newPlayerStats.threePointersAttempted}
                onChange={(e) => handleUpdatePlayerStat('threePointersAttempted', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="FT Made"
                type="text"
                value={newPlayerStats.freeThrowsMade}
                onChange={(e) => handleUpdatePlayerStat('freeThrowsMade', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="FT Attempted"
                type="text"
                value={newPlayerStats.freeThrowsAttempted}
                onChange={(e) => handleUpdatePlayerStat('freeThrowsAttempted', parseInt(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Plus/Minus"
                type="text"
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