import React, { useState, ChangeEvent } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const AuctionList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Mock data for auctions
  const auctions = [
    {
      id: '1',
      title: 'Vintage Watch',
      description: 'A beautiful vintage timepiece',
      currentPrice: 500,
      startingPrice: 100,
      endTime: '2024-04-01',
      imageUrl: 'https://via.placeholder.com/300x200',
      status: 'active',
    },
    {
      id: '2',
      title: 'Antique Furniture',
      description: 'Classic wooden chair from the 1800s',
      currentPrice: 1200,
      startingPrice: 800,
      endTime: '2024-04-05',
      imageUrl: 'https://via.placeholder.com/300x200',
      status: 'active',
    },
    {
      id: '3',
      title: 'Art Collection',
      description: 'Modern art piece by renowned artist',
      currentPrice: 2500,
      startingPrice: 2000,
      endTime: '2024-04-10',
      imageUrl: 'https://via.placeholder.com/300x200',
      status: 'active',
    },
  ];

  const filteredAuctions = auctions.filter((auction) =>
    auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    auction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.currentPrice - b.currentPrice;
      case 'price-high':
        return b.currentPrice - a.currentPrice;
      case 'newest':
        return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
      default:
        return 0;
    }
  });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    setSortBy(e.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Auctions
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search auctions"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={handleSortChange}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={4}>
        {sortedAuctions.map((auction) => (
          <Grid item key={auction.id} xs={12} sm={6} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={auction.imageUrl}
                alt={auction.title}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h3">
                  {auction.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {auction.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  Current Price: ${auction.currentPrice}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starting Price: ${auction.startingPrice}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ends: {new Date(auction.endTime).toLocaleDateString()}
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/auctions/${auction.id}`}
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AuctionList; 