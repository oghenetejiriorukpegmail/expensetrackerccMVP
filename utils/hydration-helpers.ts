/**
 * Simple helper functions for hydration and storage
 */

/**
 * Safe localStorage wrapper
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
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Error removing from localStorage:', e);
    }
  }
};

/**
 * Simple function to run after hydration
 */
export const runAfterHydration = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  setTimeout(callback, 100);
};