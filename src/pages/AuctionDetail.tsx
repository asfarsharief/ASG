import React, { useState, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  TextField,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [bidAmount, setBidAmount] = useState('');

  // Mock data for auction details
  const auction = {
    id: '1',
    title: 'Vintage Watch',
    description: 'A beautiful vintage timepiece from the 1950s. This watch has been carefully maintained and is in excellent working condition. The gold-plated case shows minimal wear, and the original leather strap is still intact.',
    currentPrice: 500,
    startingPrice: 100,
    endTime: '2024-04-01',
    imageUrl: 'https://via.placeholder.com/600x400',
    status: 'active',
    seller: {
      id: '1',
      username: 'vintage_collector',
      rating: 4.8,
    },
    bids: [
      {
        id: '1',
        amount: 500,
        bidderId: '2',
        timestamp: '2024-03-20T10:30:00Z',
      },
      {
        id: '2',
        amount: 450,
        bidderId: '3',
        timestamp: '2024-03-20T09:15:00Z',
      },
    ],
  };

  const handlePlaceBid = () => {
    // TODO: Implement bid placement logic
    console.log('Placing bid:', bidAmount);
    setBidAmount('');
  };

  const handleBidAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBidAmount(e.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={auction.imageUrl}
              alt={auction.title}
            />
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom>
                {auction.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {auction.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Auction Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Starting Price
                  </Typography>
                  <Typography variant="h6">${auction.startingPrice}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Current Price
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${auction.currentPrice}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    End Time
                  </Typography>
                  <Typography variant="h6">
                    {new Date(auction.endTime).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="h6" color={auction.status === 'active' ? 'success.main' : 'error.main'}>
                    {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Place a Bid
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Bid Amount"
                  type="number"
                  value={bidAmount}
                  onChange={handleBidAmountChange}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={handlePlaceBid}
                disabled={auction.status !== 'active'}
              >
                Place Bid
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bid History
              </Typography>
              <List>
                {auction.bids.map((bid) => (
                  <ListItem key={bid.id}>
                    <ListItemText
                      primary={`$${bid.amount}`}
                      secondary={new Date(bid.timestamp).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AuctionDetail; 