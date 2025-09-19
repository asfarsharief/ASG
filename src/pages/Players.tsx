import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Player } from '../types';
import localforage from 'localforage';
import PlayerImage from '../components/PlayerImage';
import { createPlayer, updatePlayer, deletePlayer } from '../services/api';
import { syncPlayersFromBackend } from '../utils/storage';

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState<{
    name: string;
    photoUrl: string | undefined;
    basketballStats: {
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
  }>({
    name: '',
    photoUrl: undefined,
    basketballStats: {
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
    },
  });

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        // First try to sync from backend
        await syncPlayersFromBackend();
        console.log('Successfully synced players from backend');
      } catch (error) {
        console.log('Backend sync failed, using local data:', error);
      }
      
      // Load players from localForage (either synced or existing)
      localforage.getItem<Player[]>('players').then((storedPlayers) => {
        if (Array.isArray(storedPlayers)) {
          setPlayers(storedPlayers);
        } else if (storedPlayers && typeof storedPlayers === 'string') {
          // Handle legacy JSON string format
          setPlayers(JSON.parse(storedPlayers));
        }
      });
    };

    loadPlayers();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayer.name) return;

    if (isEditing && selectedPlayer) {
      // Update existing player
      const updatedPlayer: Player = {
        ...selectedPlayer,
        name: newPlayer.name,
        photoUrl: newPlayer.photoUrl,
        basketballStats: newPlayer.basketballStats,
      };

      // Update localforage first
      const updatedPlayers = players.map(player =>
        player.id === selectedPlayer.id ? updatedPlayer : player
      );
      setPlayers(updatedPlayers);
      localforage.setItem('players', updatedPlayers);

      // Then call API to update in backend
      try {
        const apiPlayer = {
          id: updatedPlayer.id,
          name: updatedPlayer.name,
          band: updatedPlayer.band,
          status: updatedPlayer.status,
          basketballStats: updatedPlayer.basketballStats,
          photoUrl: updatedPlayer.photoUrl,
        };
        
        const result = await updatePlayer(selectedPlayer.id, apiPlayer);
        console.log('Player updated in backend:', result);
        
        // Update local player with the response from backend
        const finalUpdatedPlayer = { ...updatedPlayer, photoUrl: result.player.photoUrl };
        setPlayers(prevPlayers => {
          const finalUpdatedPlayers = prevPlayers.map(p => p.id === selectedPlayer.id ? finalUpdatedPlayer : p);
          localforage.setItem('players', finalUpdatedPlayers);
          return finalUpdatedPlayers;
        });
        
      } catch (error) {
        console.error('Failed to update player in backend:', error);
        // Player is still updated locally, so we continue
      }
    } else {
      // Add new player
      const player: Player = {
        id: Date.now().toString(),
        name: newPlayer.name,
        photoUrl: newPlayer.photoUrl,
        band: 0, // This will be set when added to a band
        status: 'available',
        basketballStats: newPlayer.basketballStats,
      };

      // Add to localforage first
      const updatedPlayers = [...players, player];
      setPlayers(updatedPlayers);
      localforage.setItem('players', updatedPlayers);

      // Then call API to save to backend
      try {
        const apiPlayer = {
          id: player.id,
          name: player.name,
          band: player.band,
          status: player.status,
          basketballStats: player.basketballStats,
          photoUrl: player.photoUrl,
        };
        
        const result = await createPlayer(apiPlayer);
        console.log('Player saved to backend:', result);
        
        // Update local player with the response from backend
        const updatedPlayer = { ...player, photoUrl: result.player.photoUrl };
        setPlayers(prevPlayers => {
          const finalUpdatedPlayers = prevPlayers.map(p => p.id === player.id ? updatedPlayer : p);
          localforage.setItem('players', finalUpdatedPlayers);
          return finalUpdatedPlayers;
        });
        
      } catch (error) {
        console.error('Failed to save player to backend:', error);
        // Player is still saved locally, so we continue
      }
    }

    handleCloseDialog();
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setNewPlayer({
      name: player.name,
      photoUrl: player.photoUrl,
      basketballStats: player.basketballStats || {
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
      },
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      // Update localforage first
      const updatedPlayers = players.filter(player => player.id !== playerId);
      setPlayers(updatedPlayers);
      localforage.setItem('players', updatedPlayers);

      // Then call API to delete from backend
      try {
        const result = await deletePlayer(playerId);
        console.log('Player deleted from backend:', result);
      } catch (error) {
        console.error('Failed to delete player from backend:', error);
        // Player is still deleted locally, so we continue
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewPlayer({ 
      name: '', 
      photoUrl: undefined,
      basketballStats: {
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
      },
    });
    setIsEditing(false);
    setSelectedPlayer(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Players
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setIsEditing(false);
            setSelectedPlayer(null);
            setNewPlayer({ 
              name: '', 
              photoUrl: undefined,
              basketballStats: {
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
              },
            });
            setOpenDialog(true);
          }}
        >
          Add New Player
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Total Players: {players.length}
          </Typography>
          <Grid container spacing={3}>
            {players.map((player, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={player.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', pb: 1 }}>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <PlayerImage
                        playerId={player.id}
                        playerName={player.name}
                        size={120}
                        variant="circular"
                        className="player-avatar"
                      />
                      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPlayer(player)}
                          sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            width: 32,
                            height: 32,
                            mr: 0.5
                          }}
                        >
                          ✏️
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePlayer(player.id)}
                          sx={{ 
                            bgcolor: 'error.main', 
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                            width: 32,
                            height: 32
                          }}
                        >
                          🗑️
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {player.name}
                    </Typography>
                    
                    {player.basketballStats && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip 
                          label={`${player.basketballStats.pointsAverage} PPG`} 
                          size="small" 
                          color="primary" 
                          sx={{ mb: 0.5 }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Chip 
                            label={`${player.basketballStats.fieldGoalPercentage}% FG`} 
                            size="small" 
                            color="secondary" 
                          />
                          <Chip 
                            label={`${player.basketballStats.winPercentage}% Win`} 
                            size="small" 
                            color="success" 
                          />
                        </Box>
                        <Chip 
                          label={`${player.basketballStats.gamesPlayed} Games`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Player' : 'Add New Player'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                autoFocus
                margin="dense"
                label="Player Name"
                fullWidth
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                label="Photo URL"
                fullWidth
                value={newPlayer.photoUrl || ''}
                onChange={(e) => setNewPlayer({ ...newPlayer, photoUrl: e.target.value || undefined })}
              />
            </Grid>
          </Grid>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Basketball Statistics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Win Percentage (%)"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.winPercentage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        winPercentage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Points Per Game"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.pointsAverage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        pointsAverage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Field Goal %"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.fieldGoalPercentage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        fieldGoalPercentage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="3-Point %"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.threePointPercentage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        threePointPercentage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Free Throw %"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.freeThrowPercentage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        freeThrowPercentage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Rebounds Per Game"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.reboundsAverage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        reboundsAverage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Assists Per Game"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.assistsAverage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        assistsAverage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Steals Per Game"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.stealsAverage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        stealsAverage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Blocks Per Game"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.blocksAverage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        blocksAverage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Turnovers Per Game"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.turnoversAverage}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        turnoversAverage: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Games Played"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.gamesPlayed}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        gamesPlayed: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    margin="dense"
                    label="Minutes Per Game"
                    type="text"
                    fullWidth
                    value={newPlayer.basketballStats.minutesPerGame}
                    onChange={(e) => setNewPlayer({
                      ...newPlayer,
                      basketballStats: {
                        ...newPlayer.basketballStats,
                        minutesPerGame: Number(e.target.value) || 0
                      }
                    })}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddPlayer} color="primary">
            {isEditing ? 'Save Changes' : 'Add Player'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Players; 