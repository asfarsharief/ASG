import localforage from 'localforage';
import { fetchPlayers, fetchAuctions, fetchGames, checkBackendHealth } from '../services/api';

// Function to export all local storage data to a JSON file
export const exportStorageToJson = async () => {
  try {
    const data: { [key: string]: any } = {};
    const keys = await localforage.keys();
    
    for (const key of keys) {
      data[key] = await localforage.getItem(key);
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting storage:', error);
    throw error;
  }
};

// Function to import data from a JSON file to local storage
export const importStorageFromJson = async (file: File) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    for (const [key, value] of Object.entries(data)) {
      await localforage.setItem(key, value);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing storage:', error);
    throw error;
  }
};

// Function to update JSON file whenever local storage changes
export const setupStorageSync = () => {
  // Create a MutationObserver to watch for changes in local storage
  const observer = new MutationObserver(async () => {
    try {
      const data: { [key: string]: any } = {};
      const keys = await localforage.keys();
      
      for (const key of keys) {
        data[key] = await localforage.getItem(key);
      }
      
      // Store the data in localStorage as a backup
      localStorage.setItem('auction-data-backup', JSON.stringify(data));
    } catch (error) {
      console.error('Error syncing storage:', error);
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
};

// Function to load data from backup on startup
export const loadStorageFromBackup = async () => {
  try {
    const backup = localStorage.getItem('auction-data-backup');
    if (backup) {
      const data = JSON.parse(backup);
      for (const [key, value] of Object.entries(data)) {
        await localforage.setItem(key, value);
      }
    }
  } catch (error) {
    console.error('Error loading from backup:', error);
  }
};

// Function to sync data from backend API
export const syncDataFromBackend = async () => {
  try {
    console.log('Checking backend availability...');
    const isBackendAvailable = await checkBackendHealth();
    
    if (!isBackendAvailable) {
      console.log('Backend not available, skipping sync');
      return false;
    }

    console.log('Backend available, syncing data...');
    
    // Fetch data from backend
    const [players, auctions, games] = await Promise.all([
      fetchPlayers(),
      fetchAuctions(),
      fetchGames()
    ]);

    // Update localforage with backend data
    await localforage.setItem('players', players);
    await localforage.setItem('auctions', auctions);
    await localforage.setItem('games', games);

    console.log('Successfully synced data from backend:', {
      players: players.length,
      auctions: auctions.length,
      games: games.length
    });

    return true;
  } catch (error) {
    console.error('Error syncing data from backend:', error);
    return false;
  }
};

// Function to sync only players from backend (for specific use case)
export const syncPlayersFromBackend = async () => {
  try {
    console.log('Checking backend availability for players sync...');
    const isBackendAvailable = await checkBackendHealth();
    
    if (!isBackendAvailable) {
      console.log('Backend not available, skipping players sync');
      return false;
    }

    console.log('Backend available, syncing players...');
    
    // Fetch players from backend
    const players = await fetchPlayers();

    // Update localforage with backend players data
    await localforage.setItem('players', players);

    console.log('Successfully synced players from backend:', players.length);

    return true;
  } catch (error) {
    console.error('Error syncing players from backend:', error);
    return false;
  }
}; 