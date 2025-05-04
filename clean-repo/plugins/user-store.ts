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
        // Initialize user profile and settings
        await userStore.fetchProfile(supabase);
      }
    } catch (error) {
      console.error('Error initializing user store:', error);
    }
  };
  
  // For client-side only
  if (process.client) {
    // Initialize on app start
    await initializeUserStore();
    
    // Also initialize when auth state changes
    const supabase = useSupabaseClient();
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await initializeUserStore();
      } else if (event === 'SIGNED_OUT') {
        const userStore = useUserStore();
        userStore.resetState();
      }
    });
  }
});