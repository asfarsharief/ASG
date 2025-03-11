import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const [tabValue, setTabValue] = React.useState(0);

  // Mock user data
  const user = {
    id: '1',
    username: 'vintage_collector',
    email: 'collector@example.com',
    rating: 4.8,
    totalAuctions: 12,
    activeAuctions: 3,
    wonAuctions: 8,
  };

  // Mock auction data
  const myAuctions = [
    {
      id: '1',
      title: 'Vintage Watch',
      status: 'active',
      currentPrice: 500,
      endTime: '2024-04-01',
    },
    {
      id: '2',
      title: 'Antique Furniture',
      status: 'ended',
      currentPrice: 1200,
      endTime: '2024-03-15',
    },
  ];

  const bids = [
    {
      id: '1',
      auctionTitle: 'Art Collection',
      amount: 2500,
      status: 'outbid',
      timestamp: '2024-03-20T10:30:00Z',
    },
    {
      id: '2',
      auctionTitle: 'Vintage Camera',
      amount: 800,
      status: 'winning',
      timestamp: '2024-03-19T15:45:00Z',
    },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Profile Information
              </Typography>
              <Typography variant="body1">
                Username: {user.username}
              </Typography>
              <Typography variant="body1">
                Email: {user.email}
              </Typography>
              <Typography variant="body1">
                Rating: {user.rating}/5
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Typography variant="body1">
                Total Auctions: {user.totalAuctions}
              </Typography>
              <Typography variant="body1">
                Active Auctions: {user.activeAuctions}
              </Typography>
              <Typography variant="body1">
                Won Auctions: {user.wonAuctions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="My Auctions" />
                  <Tab label="My Bids" />
                  <Tab label="Won Auctions" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <List>
                  {myAuctions.map((auction) => (
                    <React.Fragment key={auction.id}>
                      <ListItem>
                        <ListItemText
                          primary={auction.title}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Status: {auction.status}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Current Price: ${auction.currentPrice}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                End Time: {new Date(auction.endTime).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <List>
                  {bids.map((bid) => (
                    <React.Fragment key={bid.id}>
                      <ListItem>
                        <ListItemText
                          primary={bid.auctionTitle}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Amount: ${bid.amount}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Status: {bid.status}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Time: {new Date(bid.timestamp).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="body1">
                  No won auctions yet.
                </Typography>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 