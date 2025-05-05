// User store initialization plugin
import { useUserStore } from '~/stores/userStore';
import { useSupabaseClient } from '#imports';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Initialize user store with Supabase client inside the plugin
  // This ensures the Nuxt context is available
  const initializeUserStore = async () => {
    try {
      const supabase = useSupabaseClient();
      const userStore = useUserStore();
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session found on app load, initializing user profile');
        // Initialize user profile and settings
        await userStore.fetchProfile(supabase);
      }
    } catch (error) {
      console.error('Error initializing user store:', error);
    }
  };
  
  // Function to handle session recovery
  const recoverSession = async () => {
    try {
      const supabase = useSupabaseClient();
      
      // Try to recover session from storage
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error recovering session:', error);
        return false;
      }
      
      return data.session !== null;
    } catch (error) {
      console.error('Exception during session recovery:', error);
      return false;
    }
  };
  
  // For client-side only
  if (process.client) {
    // First try to recover any existing session
    await recoverSession();
    
    // Then initialize user store
    await initializeUserStore();
    
    // Also listen for auth state changes
    const supabase = useSupabaseClient();
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        await initializeUserStore();
      } else if (event === 'SIGNED_OUT') {
        const userStore = useUserStore();
        userStore.resetState();
      } else if (event === 'TOKEN_REFRESHED') {
        // Re-initialize the user store when token is refreshed
        await initializeUserStore();
      }
    });
  }
});