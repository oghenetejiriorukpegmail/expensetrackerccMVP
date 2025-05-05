/**
 * Utilities to handle hydration and CSP issues
 */

/**
 * Safely sets up browser-only features after hydration is complete
 * to avoid hydration mismatches
 * @param callback Function to run after hydration
 */
export const runAfterHydration = (callback: () => void) => {
  // Only run in client
  if (typeof window === 'undefined') return;
  
  // Check if document is already fully loaded
  if (document.readyState === 'complete') {
    // Add a small delay to ensure Vue hydration is complete
    setTimeout(callback, 50);
  } else {
    // Wait for document to fully load
    window.addEventListener('load', () => {
      // Add a small delay to ensure Vue hydration is complete
      setTimeout(callback, 50);
    }, { once: true });
  }
};

/**
 * Safe storage wrapper that handles various edge cases
 * with CSP and browser security
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Error accessing localStorage:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, value);
      // Also use sessionStorage as backup
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        // Ignore session storage errors
      }
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
      // Also clean up sessionStorage
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        // Ignore session storage errors
      }
    } catch (e) {
      console.warn('Error removing from localStorage:', e);
    }
  }
};