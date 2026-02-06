// Get the base URL for backend (without /api suffix)
const getBackendBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://business-card-api.atlasskilltech.app/api';
  // Remove '/api' suffix if present
  return apiUrl.replace(/\/api\/?$/, '');
};

/**
 * Converts a backend image path to a full URL
 * @param {string} imagePath - The image path from the backend (e.g., 'uploads/card-123.jpg' or '/uploads/card-123.jpg')
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const baseUrl = getBackendBaseUrl();
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Adds authentication token to image URL if needed
 * @param {string} imageUrl - The image URL
 * @returns {string} - URL with auth token if needed
 */
export const getAuthenticatedImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  const token = localStorage.getItem('token');
  if (!token) return imageUrl;
  
  // If URL already has query params, append token
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}token=${token}`;
};

export default {
  getImageUrl,
  getAuthenticatedImageUrl
};
