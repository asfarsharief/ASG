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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Team, Player, AuctionBand, Auction } from '../types';
import localforage from 'localforage';

const AuctionSetup = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bands, setBands] = useState<AuctionBand[]>([]);
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  const [openBandDialog, setOpenBandDialog] = useState(false);
  const [openPlayerDialog, setOpenPlayerDialog] = useState(false);
  const [selectedBand, setSelectedBand] = useState<AuctionBand | null>(null);
  const [isEditingBand, setIsEditingBand] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({
    name: '',
    captain: '',
    viceCaptain: '',
    budget: '',
  });
  const [newBand, setNewBand] = useState({
    name: '',
    basePrice: '',
  });
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    photoUrl: '',
  });
  const [expandedBands, setExpandedBands] = useState<number[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [randomizePlayersOrder, setRandomizePlayersOrder] = useState(false);

  // Get players who are not already captains or vice captains
  const getAvailablePlayersForTeam = () => {
    const existingCaptains = new Set(teams.map(team => team.captain));
    const existingViceCaptains = new Set(teams.map(team => team.viceCaptain).filter(Boolean));
    return availablePlayers.filter(player => 
      !existingCaptains.has(player.name) && !existingViceCaptains.has(player.name)
    );
  };

  // Get players who are not already in any band and not captains/vice captains
  const getAvailablePlayersForBand = () => {
    const existingCaptains = new Set(teams.map(team => team.captain));
    const existingViceCaptains = new Set(teams.map(team => team.viceCaptain).filter(Boolean));
    return availablePlayers.filter(player => 
      !existingCaptains.has(player.name) && 
      !existingViceCaptains.has(player.name)
    );
  };

  useEffect(() => {
    // Load auction data from localForage
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const currentAuction = auctions.find((a: Auction) => a.id === id);
        if (currentAuction) {
          setAuction(currentAuction);
          setTeams(currentAuction.teams);
          setBands(currentAuction.bands);
        }
      }
    });

    // Load available players from localForage
    localforage.getItem('players').then((storedPlayers) => {
      if (storedPlayers && typeof storedPlayers === 'string') {
        const allPlayers = JSON.parse(storedPlayers);
        // Filter out players that are already in bands
        const usedPlayerIds = new Set(bands.flatMap(band => band.players.map(p => p.id)));
        setAvailablePlayers(allPlayers.filter((player: Player) => !usedPlayerIds.has(player.id)));
      }
    });
  }, [id, bands]);

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setNewTeam({
      name: team.name,
      captain: team.captain,
      viceCaptain: team.viceCaptain || '',
      budget: team.budget.toString(),
    });
    setIsEditingTeam(true);
    setOpenTeamDialog(true);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      const updatedTeams = teams.filter(team => team.id !== teamId);
      setTeams(updatedTeams);
      
      // Update auction in localForage
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: Auction) => 
            a.id === id ? { ...a, teams: updatedTeams } : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    }
  };

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.captain || !newTeam.budget) return;

    if (isEditingTeam && selectedTeam) {
      // Update existing team
      const updatedTeams = teams.map(team => 
        team.id === selectedTeam.id
          ? {
              ...team,
              name: newTeam.name,
              captain: newTeam.captain,
              viceCaptain: newTeam.viceCaptain || undefined,
              budget: Number(newTeam.budget),
              remainingBudget: Number(newTeam.budget),
            }
          : team
      );
      setTeams(updatedTeams);
      
      // Update auction in localForage
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: Auction) => 
            a.id === id ? { ...a, teams: updatedTeams } : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    } else {
      // Add new team
      const team: Team = {
        id: Date.now().toString(),
        name: newTeam.name,
        captain: newTeam.captain,
        viceCaptain: newTeam.viceCaptain || undefined,
        budget: Number(newTeam.budget),
        remainingBudget: Number(newTeam.budget),
        players: [],
      };

      const updatedTeams = [...teams, team];
      setTeams(updatedTeams);
      
      // Update auction in localForage
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: Auction) => 
            a.id === id ? { ...a, teams: updatedTeams } : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    }

    setOpenTeamDialog(false);
    setNewTeam({ name: '', captain: '', viceCaptain: '', budget: '' });
    setIsEditingTeam(false);
    setSelectedTeam(null);
  };

  const handleCloseTeamDialog = () => {
    setOpenTeamDialog(false);
    setNewTeam({ name: '', captain: '', viceCaptain: '', budget: '' });
    setIsEditingTeam(false);
    setSelectedTeam(null);
  };

  const handleEditBand = (band: AuctionBand) => {
    setSelectedBand(band);
    setNewBand({
      name: band.name,
      basePrice: band.basePrice.toString(),
    });
    setIsEditingBand(true);
    setOpenBandDialog(true);
  };

  const handleDeleteBand = (bandId: number) => {
    if (window.confirm('Are you sure you want to delete this band? This will also delete all players in this band.')) {
      const updatedBands = bands.filter(band => band.id !== bandId);
      setBands(updatedBands);
      
      // Update auction in localForage
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: Auction) => 
            a.id === id ? { ...a, bands: updatedBands } : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    }
  };

  const handleAddBand = () => {
    if (!newBand.name || !newBand.basePrice) return;

    if (isEditingBand && selectedBand) {
      // Update existing band
      const updatedBands = bands.map(band => 
        band.id === selectedBand.id
          ? {
              ...band,
              name: newBand.name,
              basePrice: Number(newBand.basePrice),
            }
          : band
      );
      setBands(updatedBands);
      
      // Update auction in localForage
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: Auction) => 
            a.id === id ? { ...a, bands: updatedBands } : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    } else {
      // Add new band
      const band: AuctionBand = {
        id: Date.now(),
        name: newBand.name,
        basePrice: Number(newBand.basePrice),
        players: [],
      };

      const updatedBands = [...bands, band];
      setBands(updatedBands);
      
      // Update auction in localForage
      localforage.getItem('auctions').then((storedAuctions) => {
        if (storedAuctions && typeof storedAuctions === 'string') {
          const auctions = JSON.parse(storedAuctions);
          const updatedAuctions = auctions.map((a: Auction) => 
            a.id === id ? { ...a, bands: updatedBands } : a
          );
          localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        }
      });
    }

    setOpenBandDialog(false);
    setNewBand({ name: '', basePrice: '' });
    setIsEditingBand(false);
    setSelectedBand(null);
  };

  const handleCloseBandDialog = () => {
    setOpenBandDialog(false);
    setNewBand({ name: '', basePrice: '' });
    setIsEditingBand(false);
    setSelectedBand(null);
  };

  const handleAddPlayersToBand = () => {
    if (!selectedBand || selectedPlayerIds.length === 0) return;

    let selectedPlayers = availablePlayers.filter(player => 
      selectedPlayerIds.includes(player.id)
    ).map(player => ({
      ...player,
      band: selectedBand.id
    }));

    console.log("CHECKING IN random: ", randomizePlayersOrder)
    // Randomize players if checkbox is checked
    // if (randomizePlayersOrder) {
    //   selectedPlayers = [...selectedPlayers].sort(() => Math.random() - 0.5);
    // }

    const updatedBands = bands.map(band => {
      if (band.id === selectedBand.id) {
        return {
          ...band,
          players: [...band.players, ...selectedPlayers],
        };
      }
      return band;
    });

    setBands(updatedBands);
    
    // Update auction in localForage
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: Auction) => 
          a.id === id ? { ...a, bands: updatedBands, randomizePlayersOrder: randomizePlayersOrder } : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });

    setOpenPlayerDialog(false);
    setSelectedPlayerIds([]);
    // setRandomizePlayersOrder(false); // Reset the checkbox
  };

  const handleRemovePlayerFromBand = (bandId: number, playerId: string) => {
    const updatedBands = bands.map(band => {
      if (band.id === bandId) {
        return {
          ...band,
          players: band.players.filter(p => p.id !== playerId),
        };
      }
      return band;
    });

    setBands(updatedBands);
    
    // Update auction in localForage
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: Auction) => 
          a.id === id ? { ...a, bands: updatedBands } : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });
  };

  const handleStartAuction = () => {
    console.log("handleStartAuction in AuctionSetup called");
    console.log("Teams: ", teams);
    console.log("Bands: ", bands);

    if (teams.length === 0) {
      alert('Please add at least one team!');
      return;
    }

    if (bands.length === 0) {
      alert('Please add at least one band!');
      return;
    }

    const totalPlayers = bands.reduce((sum, band) => sum + band.players.length, 0);
    if (totalPlayers === 0) {
      alert('Please add at least one player!');
      return;
    }
    console.log("Randomized value: ", randomizePlayersOrder)
    // Update auction status and randomizePlayersOrder
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((auction: Auction) => 
          auction.id === id ? { ...auction, status: 'in_progress', randomizePlayersOrder: randomizePlayersOrder } : auction
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
        console.log("Updated Auctions: ", updatedAuctions);
      }
    });

    console.log("Navigating to auction page with ID:", id);
    navigate(`/auction/${id}`);
  };

  const handleSaveAndExit = () => {
    if (teams.length === 0) {
      alert('Please add at least one team!');
      return;
    }

    if (bands.length === 0) {
      alert('Please add at least one band!');
      return;
    }

    const totalPlayers = bands.reduce((sum, band) => sum + band.players.length, 0);
    if (totalPlayers === 0) {
      alert('Please add at least one player!');
      return;
    }

    // Update auction status to ongoing
    localforage.getItem('auctions').then((storedAuctions) => {
      if (storedAuctions && typeof storedAuctions === 'string') {
        const auctions = JSON.parse(storedAuctions);
        const updatedAuctions = auctions.map((a: Auction) => 
          a.id === id ? { ...a, status: 'setup' } : a
        );
        localforage.setItem('auctions', JSON.stringify(updatedAuctions));
      }
    });

    navigate('/');
  };

  const handleBandExpand = (bandId: number) => {
    setExpandedBands(prev => 
      prev.includes(bandId) 
        ? prev.filter(id => id !== bandId)
        : [...prev, bandId]
    );
  };

  const steps = ['Add Teams', 'Add Bands', 'Add Players', 'Start Auction'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {auction?.name} - Setup
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Grid container spacing={4}>
        {/* Teams Section */}
        {activeStep === 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Add Teams</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setIsEditingTeam(false);
                      setSelectedTeam(null);
                      setNewTeam({ name: '', captain: '', viceCaptain: '', budget: '' });
                      setOpenTeamDialog(true);
                    }}
                  >
                    Add Team
                  </Button>
                </Box>
                <List>
                  {teams.map((team, index) => (
                    <React.Fragment key={team.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditTeam(team)}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteTeam(team.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={team.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Captain: {team.captain}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Budget: {team.budget} Cr.
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < teams.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Bands Section */}
        {activeStep === 1 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Add Bands</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setIsEditingBand(false);
                      setSelectedBand(null);
                      setNewBand({ name: '', basePrice: '' });
                      setOpenBandDialog(true);
                    }}
                  >
                    Add Band
                  </Button>
                </Box>
                <List>
                  {bands.map((band, index) => (
                    <React.Fragment key={band.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditBand(band)}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteBand(band.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={band.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Base Price: {band.basePrice} Cr.
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Players: {band.players.length}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < bands.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Players Section */}
        {activeStep === 2 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Add Players</Typography>
                </Box>
                <List>
                  {bands.map((band, index) => (
                    <React.Fragment key={band.id}>
                      <ListItem>
                        <ListItemText
                          primary={band.name}
                          secondary={
                            <Typography component="span" variant="body2">
                              Players: {band.players.length}
                            </Typography>
                          }
                        />
                        <Box>
                          <IconButton
                            onClick={() => handleBandExpand(band.id)}
                            sx={{
                              transform: expandedBands.includes(band.id) ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s',
                            }}
                          >
                            <ExpandMoreIcon />
                          </IconButton>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedBand(band);
                              setOpenPlayerDialog(true);
                            }}
                          >
                            Add Players
                          </Button>
                        </Box>
                      </ListItem>
                      <Collapse in={expandedBands.includes(band.id)} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {band.players.map((player, playerIndex) => (
                            <ListItem 
                              key={player.id} 
                              sx={{ pl: 4 }}
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  color="error"
                                  onClick={() => handleRemovePlayerFromBand(band.id, player.id)}
                                >
                                  Remove
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={player.name}
                                secondary={
                                  <>
                                    {player.photoUrl && (
                                      <Typography component="span" variant="body2">
                                        Photo: {player.photoUrl}
                                      </Typography>
                                    )}
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                          {band.players.length === 0 && (
                            <ListItem sx={{ pl: 4 }}>
                              <ListItemText
                                primary="No players added yet"
                                secondary="Click 'Add Players' to add players to this band"
                              />
                            </ListItem>
                          )}
                        </List>
                      </Collapse>
                      {index < bands.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Review Section */}
        {activeStep === 3 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Review Setup</Typography>
                
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Teams</Typography>
                <List>
                  {teams.map((team, index) => (
                    <React.Fragment key={team.id}>
                      <ListItem>
                        <ListItemText
                          primary={team.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Captain: {team.captain}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Budget: {team.budget} Cr.
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < teams.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Bands and Players</Typography>
                <List>
                  {bands.map((band, index) => (
                    <React.Fragment key={band.id}>
                      <ListItem>
                        <ListItemText
                          primary={band.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Players: {band.players.length}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                {band.players.map(p => p.name).join(', ')}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < bands.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Team Dialog */}
      <Dialog open={openTeamDialog} onClose={handleCloseTeamDialog}>
        <DialogTitle>{isEditingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Captain</InputLabel>
            <Select
              value={newTeam.captain}
              label="Captain"
              onChange={(e) => setNewTeam({ ...newTeam, captain: e.target.value })}
            >
              {getAvailablePlayersForTeam().map((player) => (
                <MenuItem key={player.id} value={player.name}>
                  {player.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Vice Captain (Optional)</InputLabel>
            <Select
              value={newTeam.viceCaptain}
              label="Vice Captain (Optional)"
              onChange={(e) => setNewTeam({ ...newTeam, viceCaptain: e.target.value })}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {getAvailablePlayersForTeam().map((player) => (
                <MenuItem key={player.id} value={player.name}>
                  {player.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Budget"
            type="number"
            fullWidth
            value={newTeam.budget}
            onChange={(e) => setNewTeam({ ...newTeam, budget: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTeamDialog}>Cancel</Button>
          <Button onClick={handleAddTeam} color="primary">
            {isEditingTeam ? 'Save Changes' : 'Add Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Band Dialog */}
      <Dialog open={openBandDialog} onClose={handleCloseBandDialog}>
        <DialogTitle>{isEditingBand ? 'Edit Band' : 'Add New Band'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Band Name"
            fullWidth
            value={newBand.name}
            onChange={(e) => setNewBand({ ...newBand, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Base Price"
            type="number"
            fullWidth
            value={newBand.basePrice}
            onChange={(e) => setNewBand({ ...newBand, basePrice: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBandDialog}>Cancel</Button>
          <Button onClick={handleAddBand} color="primary">
            {isEditingBand ? 'Save Changes' : 'Add Band'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Players Dialog */}
      <Dialog
        open={openPlayerDialog}
        onClose={() => {
          setOpenPlayerDialog(false);
          setSelectedPlayerIds([]);
          setRandomizePlayersOrder(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Players to {selectedBand?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={randomizePlayersOrder}
                  onChange={(e) => setRandomizePlayersOrder(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Randomize player order
              </label>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Select Players</InputLabel>
              <Select
                multiple
                value={selectedPlayerIds}
                onChange={(e) => setSelectedPlayerIds(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
                renderValue={(selected) => {
                  const selectedPlayers = availablePlayers
                    .filter(player => selected.includes(player.id))
                    .map(player => player.name);
                  return selectedPlayers.join(', ');
                }}
              >
                {getAvailablePlayersForBand().map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    {player.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenPlayerDialog(false);
            setSelectedPlayerIds([]);
            setRandomizePlayersOrder(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddPlayersToBand} variant="contained" color="primary">
            Add Players
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
        <Box>
          {activeStep > 0 && (
            <Button
              variant="outlined"
              onClick={() => setActiveStep(activeStep - 1)}
              sx={{ mr: 2 }}
            >
              Previous
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
              sx={{ mr: 2 }}
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={handleStartAuction}
                sx={{ mr: 2 }}
              >
                Start Auction
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveAndExit}
              >
                Save and Exit
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default AuctionSetup; 