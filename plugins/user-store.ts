// User store initialization plugin
import { useUserStore } from '~/stores/userStore';
import { useSupabaseClient } from '#imports';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Single source of truth for the Supabase client
  const supabase = useSupabaseClient();
  const userStore = useUserStore();
  
  // Initialize user store with Supabase client inside the plugin
  // This ensures the Nuxt context is available
  const initializeUserStore = async () => {
    try {
      // First try to recover from localStorage if available
      if (typeof localStorage !== 'undefined') {
        const storedSession = localStorage.getItem('supabase-auth');
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession?.access_token && parsedSession?.refresh_token) {
              console.log('Found session in localStorage, attempting to restore');
              // Set the session explicitly
              await supabase.auth.setSession({
                access_token: parsedSession.access_token,
                refresh_token: parsedSession.refresh_token
              });
            }
          } catch (e) {
            console.error('Error parsing stored session:', e);
          }
        }
      }
      
      // Now check if the session was successfully restored or exists naturally
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session found on app load, initializing user profile');
        // Initialize user profile and settings
        await userStore.fetchProfile(supabase);
        
        // Re-store the session for redundancy
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('supabase-auth', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user
          }));
        }
      } else {
        console.log('No session found on app load');
      }
    } catch (error) {
      console.error('Error initializing user store:', error);
    }
  };
  
  // For client-side only to avoid SSR issues
  if (process.client) {
    // Immediately initialize user store on plugin load
    await initializeUserStore();
    
    // Set up auth state change listener with the same Supabase instance
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          // Wait a moment for auth state to propagate
          await new Promise(resolve => setTimeout(resolve, 100));
          await initializeUserStore();
        }
      } else if (event === 'SIGNED_OUT') {
        userStore.resetState();
      }
    });
    
    // Clean up subscription when app is unmounted
    nuxtApp.hook('app:unmounted', () => {
      subscription.unsubscribe();
    });
  }
});