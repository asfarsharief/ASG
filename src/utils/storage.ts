import localforage from 'localforage';

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