/**
 * Create a wrapper around the Pinia store to handle Supabase composables
 * This is necessary because Pinia stores cannot use composables outside of setup functions
 */

import { useSupabaseClient } from '#imports';

// Type for store wrapper function
type StoreWrapper<T> = (supabaseClient?: any) => T;

/**
 * Creates a wrapper function for store actions that need Supabase client
 * @param useStore The Pinia store hook 
 * @returns A function that returns the store with Supabase client-aware methods
 */
export function createStoreWrapper<T>(useStore: () => T): StoreWrapper<T> {
  return (providedClient?: any) => {
    const store = useStore();
    const client = providedClient || (typeof useSupabaseClient === 'function' ? useSupabaseClient() : null);
    
    return {
      ...store,
      // Add supabaseClient property
      supabaseClient: client
    } as T & { supabaseClient: any };
  };
}