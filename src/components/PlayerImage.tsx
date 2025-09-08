import React, { useState, useEffect } from 'react';
import { Avatar, Box, CircularProgress } from '@mui/material';
import { getPlayerImageUrl } from '../config/api';

interface PlayerImageProps {
  playerId: string;
  playerName: string;
  size?: number;
  variant?: 'circular' | 'rounded' | 'square';
  showFallback?: boolean;
  className?: string;
}

const PlayerImage: React.FC<PlayerImageProps> = ({
  playerId,
  playerName,
  size = 40,
  variant = 'circular',
  showFallback = true,
  className,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(false);

      try {
        // Use the player image API endpoint with player ID
        const url = getPlayerImageUrl(playerId);

        // Test if the image loads
        const img = new Image();
        img.onload = () => {
          setImageUrl(url);
          setLoading(false);
        };
        img.onerror = () => {
          setError(true);
          setLoading(false);
        };
        img.src = url;
      } catch (err) {
        console.error('Error loading player image:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadImage();
  }, [playerId]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFallbackColor = (name: string): string => {
    // Generate a consistent color based on the name
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <Box
        className={className}
        sx={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.200',
          borderRadius: variant === 'circular' ? '50%' : variant === 'rounded' ? 1 : 0,
        }}
      >
        <CircularProgress size={size * 0.5} />
      </Box>
    );
  }

  if (error || !imageUrl) {
    if (!showFallback) {
      return null;
    }
    
    return (
      <Avatar
        className={className}
        sx={{
          width: size,
          height: size,
          backgroundColor: getFallbackColor(playerName),
          fontSize: size * 0.4,
          fontWeight: 'bold',
        }}
        variant={variant}
      >
        {getInitials(playerName)}
      </Avatar>
    );
  }

  return (
    <Avatar
      className={className}
      src={imageUrl}
      alt={playerName}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 'bold',
        backgroundColor: getFallbackColor(playerName),
      }}
      variant={variant}
      onError={() => {
        setError(true);
        setImageUrl('');
      }}
    >
      {getInitials(playerName)}
    </Avatar>
  );
};

export default PlayerImage;
