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
  List,
  ListItem,
  Divider,
  IconButton,
  Avatar,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Player } from '../types';
import { playerApi, ApiError } from '../services/api';
import { transformPlayerFromBackend, transformPlayerToBackend, createDefaultBasketballStats } from '../utils/dataTransform';
import LoadingError from '../components/LoadingError';

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState<{
    name: string;
    photoUrl: string | undefined;
    band: number;
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
    band: 1,
    basketballStats: createDefaultBasketballStats(),
  });

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const backendPlayers = await playerApi.getPlayers();
      const transformedPlayers = backendPlayers.map(transformPlayerFromBackend);
      setPlayers(transformedPlayers);
    } catch (err) {
      console.error('Error loading players:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.name) return;

    try {
      setLoading(true);
      setError(null);

      const playerData = transformPlayerToBackend({
        name: newPlayer.name,
        photoUrl: newPlayer.photoUrl,
        band: newPlayer.band,
        status: 'available',
        basketballStats: newPlayer.basketballStats,
      });

      if (isEditing && selectedPlayer) {
        // Update existing player
        const updatedPlayer = await playerApi.updatePlayer(selectedPlayer.id, playerData);
        const transformedPlayer = transformPlayerFromBackend(updatedPlayer);
        setPlayers(players.map(p => p.id === selectedPlayer.id ? transformedPlayer : p));
      } else {
        // Add new player
        const newPlayerData = await playerApi.createPlayer(playerData);
        const transformedPlayer = transformPlayerFromBackend(newPlayerData);
        setPlayers([...players, transformedPlayer]);
      }

      handleCloseDialog();
    } catch (err) {
      console.error('Error saving player:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to save player');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setNewPlayer({
      name: player.name,
      photoUrl: player.photoUrl,
      band: player.band,
      basketballStats: player.basketballStats || createDefaultBasketballStats(),
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        setLoading(true);
        setError(null);
        await playerApi.deletePlayer(playerId);
        setPlayers(players.filter(player => player.id !== playerId));
      } catch (err) {
        console.error('Error deleting player:', err);
        setError(err instanceof ApiError ? err.message : 'Failed to delete player');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewPlayer({ 
      name: '', 
      photoUrl: undefined,
      band: 1,
      basketballStats: createDefaultBasketballStats(),
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
              band: 1,
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

      <LoadingError loading={loading} error={error} onRetry={loadPlayers}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Players: {players.length}
            </Typography>
            <List>
              {players.map((player, index) => (
                <React.Fragment key={player.id}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditPlayer(player)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDeletePlayer(player.id)}
                        >
                          Delete
                        </IconButton>
                      </Box>
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Avatar
                        src={player.photoUrl}
                        alt={player.name}
                        sx={{ width: 56, height: 56, mr: 2 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                          {index + 1}. {player.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={`Band ${player.band}`} 
                            size="small" 
                            color="default" 
                          />
                          <Chip 
                            label={player.status} 
                            size="small" 
                            color={player.status === 'available' ? 'success' : 'warning'} 
                          />
                          {player.basketballStats && (
                            <>
                              <Chip 
                                label={`${player.basketballStats.pointsAverage} PPG`} 
                                size="small" 
                                color="primary" 
                              />
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
                              <Chip 
                                label={`${player.basketballStats.gamesPlayed} Games`} 
                                size="small" 
                                variant="outlined" 
                              />
                            </>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < players.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </LoadingError>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Player' : 'Add New Player'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                autoFocus
                margin="dense"
                label="Player Name"
                fullWidth
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                margin="dense"
                label="Photo URL"
                fullWidth
                value={newPlayer.photoUrl || ''}
                onChange={(e) => setNewPlayer({ ...newPlayer, photoUrl: e.target.value || undefined })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                margin="dense"
                label="Band"
                type="number"
                fullWidth
                value={newPlayer.band}
                onChange={(e) => setNewPlayer({ ...newPlayer, band: Number(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 10 }}
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
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