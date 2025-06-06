import React, { useRef } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Alert,
} from '@mui/material';
import { exportStorageToJson, importStorageFromJson } from '../utils/storage';

const DataManagement = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleExport = async () => {
    try {
      await exportStorageToJson();
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error exporting data. Please try again.' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importStorageFromJson(file);
      setMessage({ type: 'success', text: 'Data imported successfully! Please refresh the page.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error importing data. Please check the file format.' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Management
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Export Data
        </Typography>
        <Typography variant="body1" paragraph>
          Export all auction data to a JSON file. This file can be used to backup your data or transfer it to another device.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExport}
        >
          Export Data
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Data
        </Typography>
        <Typography variant="body1" paragraph>
          Import auction data from a previously exported JSON file. This will replace all current data.
        </Typography>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => fileInputRef.current?.click()}
        >
          Import Data
        </Button>
      </Paper>

      {message && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={message.type}>
            {message.text}
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default DataManagement; 