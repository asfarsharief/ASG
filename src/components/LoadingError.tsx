import React from 'react';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface LoadingErrorProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

const LoadingError: React.FC<LoadingErrorProps> = ({ 
  loading, 
  error, 
  onRetry, 
  children 
}) => {
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="200px"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="200px"
        gap={2}
        p={2}
      >
        <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        {onRetry && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        )}
      </Box>
    );
  }

  return <>{children}</>;
};

export default LoadingError;