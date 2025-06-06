import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import AuctionSetup from './pages/AuctionSetup';
import Auction from './pages/Auction';
import Players from './pages/Players';
import DataManagement from './pages/DataManagement';
import { setupStorageSync, loadStorageFromBackup } from './utils/storage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  useEffect(() => {
    // Load data from backup on startup
    loadStorageFromBackup();
    
    // Setup storage sync
    const observer = setupStorageSync();
    
    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ASG Auction
            </Typography>
            <Button color="inherit" component={Link} to="/">
              Home
            </Button>
            <Button color="inherit" component={Link} to="/players">
              Players
            </Button>
            <Button color="inherit" component={Link} to="/data">
              Data Management
            </Button>
          </Toolbar>
        </AppBar>
        <Container>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auction/:id" element={<Auction />} />
            <Route path="/auction/:id/setup" element={<AuctionSetup />} />
            <Route path="/players" element={<Players />} />
            <Route path="/data" element={<DataManagement />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
