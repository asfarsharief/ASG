# Image Download Feature

This document describes the image download functionality implemented in the ASG Basketball Auction System backend.

## Overview

The backend now automatically downloads player images from external URLs and serves them locally. This improves performance, reduces external dependencies, and provides better control over image delivery.

## Features

### Automatic Image Download
- Downloads images from Google Drive links during initial data loading
- Supports multiple image formats (JPEG, PNG, GIF, WebP, SVG)
- Automatic file extension detection from content type
- Fallback to original URL if download fails

### Image Management
- Local storage in `images/` directory
- Automatic cleanup of unused images
- Simple naming convention: `{playerId}.{extension}`
- Static file serving via `/images/` endpoint

### API Endpoints

#### Static Image Serving
```
GET /images/{filename}
```
Serves static image files from the local `images/` directory.

#### Player Image Endpoint
```
GET /players/{id}/image
```
- Returns the player's image
- Automatically downloads image if not available locally
- Redirects to local image URL
- Falls back to original URL if download fails

#### Manual Image Download
```
POST /players/{id}/download-image
```
Manually triggers image download for a specific player.

**Response:**
```json
{
  "message": "Image downloaded successfully",
  "localUrl": "/images/123.jpg"
}
```

## Configuration

### Environment Variables
- `IMAGES_DIR`: Directory for storing images (default: `images`)
- `BASE_URL`: Base URL for the API (default: `http://localhost:8080`)

### Directory Structure
```
backend/
├── images/                 # Downloaded images
│   ├── 123.jpg
│   ├── 456.png
│   └── ...
├── data/
│   └── auction-data.json
├── main.go
├── services/
│   └── image_service.go
└── ...
```

## Usage

### Starting the Server
```bash
cd backend
go run main.go
```

The server will:
1. Create the `images/` directory if it doesn't exist
2. Download images for all players during initial data loading
3. Serve images via `/images/` endpoint
4. Provide image management API endpoints

### Frontend Integration

The frontend automatically uses local images when available:

```typescript
// PlayerImage component uses simplified approach
<PlayerImage
  playerId={player.id}
  playerName={player.name}
  size={56}
  variant="circular"
/>
```

## Image Service Features

### DownloadImage Function
- HTTP client with 30-second timeout
- Content type validation
- Automatic file extension detection
- Error handling and logging

### ImageExists Function
- Checks for existing local images
- Supports multiple file extensions
- Returns local URL if found

### CleanupOldImages Function
- Removes images for inactive players
- Maintains clean storage
- Prevents disk space issues

## Error Handling

### Download Failures
- Logs error messages
- Keeps original URL as fallback
- Continues processing other images

### Invalid Content Types
- Validates image MIME types
- Rejects non-image content
- Provides clear error messages

### File System Errors
- Handles permission issues
- Creates directories as needed
- Graceful error recovery

## Performance Considerations

### Caching
- Images are cached locally after download
- No re-downloading of existing images
- Fast serving via static file endpoint

### Memory Usage
- Streaming download (no memory buffering)
- Efficient file operations
- Automatic cleanup of unused images

### Network Optimization
- Single download per image
- 30-second timeout prevents hanging
- Fallback to original URLs

## Security

### Content Validation
- MIME type checking
- File extension validation
- Size limits (configurable)

### Path Security
- Sanitized filenames
- No directory traversal
- Controlled file access

## Troubleshooting

### Common Issues

1. **Images not downloading**
   - Check network connectivity
   - Verify image URLs are accessible
   - Check server logs for error messages

2. **Permission errors**
   - Ensure write permissions on `images/` directory
   - Check file system permissions

3. **Invalid content types**
   - Verify image URLs return proper MIME types
   - Check for redirects or authentication issues

### Debug Mode
Enable verbose logging by setting log level in the application.

## Future Enhancements

- Image resizing and optimization
- Multiple image formats support
- CDN integration
- Image compression
- Batch download operations
- Image metadata extraction
