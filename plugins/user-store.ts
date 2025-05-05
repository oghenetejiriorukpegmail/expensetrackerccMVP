// Simple user store initialization plugin
import { useUserStore } from '~/stores/userStore';
import { useSupabaseClient } from '#imports';

export default defineNuxtPlugin((nuxtApp) => {
  // Only run auth state listener on client side
  if (process.client) {
    const supabase = useSupabaseClient();
    const userStore = useUserStore();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('User signed in or token refreshed, initializing profile');
        // Don't await to prevent blocking - this is a background operation
        userStore.fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, resetting state');
        userStore.resetState();
      }
    });
    
    // Clean up on unmount
    nuxtApp.hook('app:unmounted', () => {
      subscription.unsubscribe();
    });
  }
});