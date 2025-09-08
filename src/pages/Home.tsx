import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
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
  Chip,
} from '@mui/material';
import { AuctionState } from '../types';
import localforage from 'localforage';
import { formatDate } from '../utils/dateUtils';
import { syncAuctionData } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<AuctionState[]>([]);
  const [openAuctionDialog, setOpenAuctionDialog] = useState(false);
  const [newAuction, setNewAuction] = useState({
    name: '',
  });

  useEffect(() => {
    // Load auctions from localForage
    localforage.getItem<AuctionState[]>('auctions').then((storedAuctions) => {
      if (Array.isArray(storedAuctions)) {
        setAuctions(storedAuctions);
      } else if (storedAuctions && typeof storedAuctions === 'string') {
        // Handle legacy JSON string format
        setAuctions(JSON.parse(storedAuctions));
      }
    });
  }, []);

  const handleCreateAuction = () => {
    if (!newAuction.name) return;

    const auction: AuctionState = {
      id: Date.now().toString(),
      name: newAuction.name,
      status: 'setup',
      currentTeamId: '',
      currentPlayerId: null,
      currentBand: 1,
      teams: [],
      bands: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentRound: 1,
      unsoldPlayers: {},
      randomizePlayersOrder: false,
    };

    const updatedAuctions = [...auctions, auction];
    setAuctions(updatedAuctions);
    localforage.setItem('auctions', updatedAuctions);
    setOpenAuctionDialog(false);
    setNewAuction({ name: '' });
    
    // Navigate to auction setup page
    navigate(`/auction/${auction.id}/setup`);
  };

  const handleSyncAuctionData = async () => {
    try {
      console.log('Syncing auction data to backend...');
      const result = await syncAuctionData(auctions);
      alert(`Auction data synced successfully! Synced ${result.syncedCount} out of ${result.totalAuctions} auctions.`);
    } catch (error) {
      console.error('Failed to sync auction data:', error);
      alert('Failed to sync auction data to backend. Please try again.');
    }
  };

  const handleAuctionClick = (auction: AuctionState) => {
    if (auction.status === 'setup' || auction.status === 'ongoing') {
      navigate(`/auction/${auction.id}/setup`);
    } else {
      navigate(`/auction/${auction.id}`);
    }
  };

  const handleDeleteAuction = (auctionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the auction click
    if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      const updatedAuctions = auctions.filter(a => a.id !== auctionId);
      setAuctions(updatedAuctions);
      localforage.setItem('auctions', updatedAuctions);
    }
  };

  const getStatusColor = (status: AuctionState['status']) => {
    switch (status) {
      case 'ongoing':
        return 'success';
      case 'setup':
        return 'warning';
      case 'paused':
        return 'info';
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: AuctionState['status']) => {
    switch (status) {
      case 'ongoing':
        return 'Ongoing';
      case 'setup':
        return 'Setup';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Auctions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleSyncAuctionData}
            disabled={auctions.length === 0}
          >
            Sync Auction Data
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenAuctionDialog(true)}
          >
            Create New Auction
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <List>
                {auctions.map((auction, index) => (
                  <React.Fragment key={auction.id}>
                    <ListItem
                      component="div"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                      onClick={() => handleAuctionClick(auction)}
                    >
                      <ListItemText
                        primary={auction.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Created: {formatDate(auction.createdAt)}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Teams: {auction.teams.length} | Players: {auction.bands.reduce((sum, band) => sum + band.players.length, 0)}
                            </Typography>
                          </>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={getStatusLabel(auction.status)}
                          color={getStatusColor(auction.status)}
                          size="small"
                        />
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={(e) => handleDeleteAuction(auction.id, e)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </ListItem>
                    {index < auctions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Auction Dialog */}
      <Dialog open={openAuctionDialog} onClose={() => setOpenAuctionDialog(false)}>
        <DialogTitle>Create New Auction</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Auction Name"
            fullWidth
            value={newAuction.name}
            onChange={(e) => setNewAuction({ ...newAuction, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAuctionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAuction}
            color="primary"
            disabled={!newAuction.name}
          >
            Create Auction
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Home; 