package services

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type ImageService struct {
	ImagesDir string
	BaseURL   string
}

func NewImageService(imagesDir, baseURL string) *ImageService {
	// Create images directory if it doesn't exist
	if err := os.MkdirAll(imagesDir, 0755); err != nil {
		fmt.Printf("Error creating images directory: %v\n", err)
	}

	return &ImageService{
		ImagesDir: imagesDir,
		BaseURL:   baseURL,
	}
}

// DownloadImage downloads an image from URL and saves it locally
func (s *ImageService) DownloadImage(imageURL, playerName string) (string, error) {
	if imageURL == "" {
		return "", fmt.Errorf("empty image URL")
	}
	fmt.Printf("Downloading image for player %s: %s\n", playerName, imageURL)
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Make HTTP request
	resp, err := client.Get(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download image: status %d", resp.StatusCode)
	}

	// Get content type
	contentType := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return "", fmt.Errorf("invalid content type: %s", contentType)
	}

	// Determine file extension from content type
	ext := s.getExtensionFromContentType(contentType)
	if ext == "" {
		// Try to get extension from URL
		ext = s.getExtensionFromURL(imageURL)
		if ext == "" {
			ext = ".jpg" // Default fallback
		}
	}

	// Create filename using player name (sanitized)
	sanitizedName := s.sanitizeFilename(playerName)
	filename := fmt.Sprintf("%s%s", sanitizedName, ext)
	filepath := filepath.Join(s.ImagesDir, filename)

	// Create file
	file, err := os.Create(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

	// Copy image data to file
	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to save image: %v", err)
	}

	// Return the local URL path
	return fmt.Sprintf("/images/%s", filename), nil
}

// getExtensionFromContentType extracts file extension from MIME type
func (s *ImageService) getExtensionFromContentType(contentType string) string {
	switch contentType {
	case "image/jpeg":
		return ".jpg"
	case "image/jpg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "image/svg+xml":
		return ".svg"
	default:
		return ""
	}
}

// getExtensionFromURL extracts file extension from URL
func (s *ImageService) getExtensionFromURL(url string) string {
	// Remove query parameters
	if idx := strings.Index(url, "?"); idx != -1 {
		url = url[:idx]
	}

	// Get file extension
	ext := filepath.Ext(url)
	if ext != "" {
		return strings.ToLower(ext)
	}

	return ""
}

// sanitizeFilename creates a safe filename from player name
func (s *ImageService) sanitizeFilename(name string) string {
	// Replace spaces and special characters with underscores
	sanitized := strings.ReplaceAll(name, " ", "_")
	sanitized = strings.ReplaceAll(sanitized, "/", "_")
	sanitized = strings.ReplaceAll(sanitized, "\\", "_")
	sanitized = strings.ReplaceAll(sanitized, ":", "_")
	sanitized = strings.ReplaceAll(sanitized, "*", "_")
	sanitized = strings.ReplaceAll(sanitized, "?", "_")
	sanitized = strings.ReplaceAll(sanitized, "\"", "_")
	sanitized = strings.ReplaceAll(sanitized, "<", "_")
	sanitized = strings.ReplaceAll(sanitized, ">", "_")
	sanitized = strings.ReplaceAll(sanitized, "|", "_")

	// Remove any remaining non-alphanumeric characters except underscores
	var result strings.Builder
	for _, char := range sanitized {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') || char == '_' {
			result.WriteRune(char)
		}
	}

	return result.String()
}

// ImageExists checks if an image file exists locally
func (s *ImageService) ImageExists(playerName string) (string, bool) {
	// Try common extensions
	extensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
	sanitizedName := s.sanitizeFilename(playerName)

	for _, ext := range extensions {
		filename := fmt.Sprintf("%s%s", sanitizedName, ext)
		filepath := filepath.Join(s.ImagesDir, filename)

		if _, err := os.Stat(filepath); err == nil {
			return fmt.Sprintf("/images/%s", filename), true
		}
	}

	return "", false
}

// FindImageByPlayerID finds an image file by player ID
func (s *ImageService) FindImageByPlayerID(playerID string) (string, error) {
	// First, we need to get the player name from the database
	// This function will be called from the API endpoint where we have access to player data
	// For now, we'll return an error indicating this needs to be called with player name
	return "", fmt.Errorf("use FindImageByPlayerName instead")
}

// FindImageByPlayerName finds an image file by player name
func (s *ImageService) FindImageByPlayerName(playerName string) (string, error) {
	sanitizedName := s.sanitizeFilename(playerName)
	extensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}

	for _, ext := range extensions {
		filename := fmt.Sprintf("%s%s", sanitizedName, ext)
		filepath := filepath.Join(s.ImagesDir, filename)

		if _, err := os.Stat(filepath); err == nil {
			return filepath, nil
		}
	}

	return "", fmt.Errorf("image not found for player: %s", playerName)
}

// GetLocalImageURL returns the local URL for a player's image
func (s *ImageService) GetLocalImageURL(playerName string) string {
	sanitizedName := s.sanitizeFilename(playerName)
	return fmt.Sprintf("%s/images/%s", s.BaseURL, sanitizedName)
}

// CleanupOldImages removes images that are no longer referenced
func (s *ImageService) CleanupOldImages(activePlayerNames []string) error {
	// Create a set of active player names for quick lookup
	activeSet := make(map[string]bool)
	for _, name := range activePlayerNames {
		activeSet[s.sanitizeFilename(name)] = true
	}

	// Read directory
	files, err := os.ReadDir(s.ImagesDir)
	if err != nil {
		return fmt.Errorf("failed to read images directory: %v", err)
	}

	// Remove files for inactive players
	for _, file := range files {
		if file.IsDir() {
			continue
		}

		filename := file.Name()
		// Extract player name from filename (format: sanitized_name.ext)
		// Remove file extension to get sanitized player name
		sanitizedName := strings.TrimSuffix(filename, filepath.Ext(filename))

		// If player is not active, remove the image
		if !activeSet[sanitizedName] {
			filepath := filepath.Join(s.ImagesDir, filename)
			if err := os.Remove(filepath); err != nil {
				fmt.Printf("Failed to remove old image %s: %v\n", filename, err)
			} else {
				fmt.Printf("Removed old image: %s\n", filename)
			}
		}
	}

	return nil
}
