// Utility functions for safe date handling

/**
 * Safely formats a date string to a localized date string
 * @param dateString - The date string to format
 * @returns Formatted date string or fallback text
 */
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

/**
 * Safely formats a date string to a localized date and time string
 * @param dateString - The date string to format
 * @returns Formatted date and time string or fallback text
 */
export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date time:', dateString, error);
    return 'Invalid Date';
  }
};

/**
 * Creates a properly formatted ISO date string
 * @returns ISO date string
 */
export const createISODate = (): string => {
  return new Date().toISOString();
};

/**
 * Validates if a date string is valid
 * @param dateString - The date string to validate
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (dateString: string | undefined | null): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

