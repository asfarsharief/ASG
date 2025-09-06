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
import localforage from 'localforage';

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
    // Load players from localForage
    localforage.getItem<Player[]>('players').then((storedPlayers) => {
      if (Array.isArray(storedPlayers)) {
        setPlayers(storedPlayers);
      } else if (storedPlayers && typeof storedPlayers === 'string') {
        // Handle legacy JSON string format
        setPlayers(JSON.parse(storedPlayers));
      }
    });
  }, []);

  const handleAddPlayer = () => {
    if (!newPlayer.name) return;

    if (isEditing && selectedPlayer) {
      // Update existing player
      const updatedPlayers = players.map(player =>
        player.id === selectedPlayer.id
          ? {
              ...player,
              name: newPlayer.name,
              photoUrl: newPlayer.photoUrl,
              basketballStats: newPlayer.basketballStats,
            }
          : player
      );
      setPlayers(updatedPlayers);
      localforage.setItem('players', updatedPlayers);
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

      const updatedPlayers = [...players, player];
      setPlayers(updatedPlayers);
      localforage.setItem('players', updatedPlayers);
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

  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      const updatedPlayers = players.filter(player => player.id !== playerId);
      setPlayers(updatedPlayers);
      localforage.setItem('players', updatedPlayers);
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
                      {player.basketballStats && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
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
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {index < players.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
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