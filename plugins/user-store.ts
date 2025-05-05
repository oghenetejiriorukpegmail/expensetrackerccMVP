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
      
      if (event === 'SIGNED_OUT') {
        userStore.resetState();
      }
    });
    
    // Clean up on unmount
    nuxtApp.hook('app:unmounted', () => {
      subscription.unsubscribe();
    });
  }
});