import { adminApi } from '../services/api';

/**
 * Clears all authentication data and local storage
 * This will effectively log the user out and clear any stored credentials
 */
export const clearLocalStorage = (): void => {
  try {
    // Clear authentication tokens and user info
    adminApi.clearToken();
    
    // Clear any other local storage items if needed
    // localStorage.clear(); // Uncomment this line to clear ALL local storage
    
    console.log('Local storage cleared successfully');
  } catch (error) {
    console.error('Error clearing local storage:', error);
  }
};

export default clearLocalStorage;
