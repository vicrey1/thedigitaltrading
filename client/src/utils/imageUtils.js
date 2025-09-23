// Utility functions for handling image URLs

/**
 * Constructs a full image URL using the API base URL
 * @param {string} imagePath - The image path (e.g., "/uploads/cars/filename.jpg")
 * @returns {string} - Full image URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If the path already includes the full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
  
  // Ensure the path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${apiBaseUrl}${normalizedPath}`;
};

/**
 * Gets the image URL from a car image object or fallback string
 * @param {Object|string} imageData - Image object with url property or string path
 * @param {string} fallback - Fallback image path
 * @returns {string} - Full image URL
 */
export const getCarImageUrl = (imageData, fallback = '') => {
  let imagePath = '';
  
  if (typeof imageData === 'object' && imageData?.url) {
    imagePath = imageData.url;
  } else if (typeof imageData === 'string') {
    imagePath = imageData;
  } else if (fallback) {
    imagePath = fallback;
  }
  
  return getFullImageUrl(imagePath);
};