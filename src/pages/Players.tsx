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
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
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
  }>({
    name: '',
    photoUrl: undefined,
  });

  useEffect(() => {
    // Load players from localForage
    localforage.getItem('players').then((storedPlayers) => {
      if (storedPlayers && typeof storedPlayers === 'string') {
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
            }
          : player
      );
      setPlayers(updatedPlayers);
      localforage.setItem('players', JSON.stringify(updatedPlayers));
    } else {
      // Add new player
      const player: Player = {
        id: Date.now().toString(),
        name: newPlayer.name,
        photoUrl: newPlayer.photoUrl,
        band: 0, // This will be set when added to a band
        status: 'available',
      };

      const updatedPlayers = [...players, player];
      setPlayers(updatedPlayers);
      localforage.setItem('players', JSON.stringify(updatedPlayers));
    }

    handleCloseDialog();
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setNewPlayer({
      name: player.name,
      photoUrl: player.photoUrl,
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      const updatedPlayers = players.filter(player => player.id !== playerId);
      setPlayers(updatedPlayers);
      localforage.setItem('players', JSON.stringify(updatedPlayers));
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewPlayer({ name: '', photoUrl: undefined });
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
            setNewPlayer({ name: '', photoUrl: undefined });
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
                  <ListItemText
                    primary={`${index + 1}. ${player.name}`}
                    secondary={
                      player.photoUrl && (
                        <Typography component="span" variant="body2">
                          Photo: {player.photoUrl}
                        </Typography>
                      )
                    }
                  />
                </ListItem>
                {index < players.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit Player' : 'Add New Player'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Player Name"
            fullWidth
            value={newPlayer.name}
            onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Photo URL"
            fullWidth
            value={newPlayer.photoUrl || ''}
            onChange={(e) => setNewPlayer({ ...newPlayer, photoUrl: e.target.value || undefined })}
          />
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