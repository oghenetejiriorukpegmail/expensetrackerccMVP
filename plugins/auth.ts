// Auth session helper plugin
import { safeStorage } from '~/utils/hydration-helpers';

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    // Initialize session refresher - no longer using global middleware
    const refreshSession = async () => {
      try {
        const supabase = useSupabaseClient();
        
        // Check if session exists using Supabase client
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Save session to storage for redundancy
          safeStorage.setItem('supabase-auth', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at
          }));
          
          // Check if token is about to expire (within 10 minutes)
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const tenMinutesInSeconds = 10 * 60;
          
          if (expiresAt && (expiresAt - now < tenMinutesInSeconds)) {
            console.log('Session token close to expiry, refreshing...');
            // Refresh the session
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error('Error refreshing session:', error);
            } else {
              console.log('Session refreshed successfully');
              
              // Update storage with refreshed session
              if (data.session) {
                safeStorage.setItem('supabase-auth', JSON.stringify({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                  expires_at: data.session.expires_at
                }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Error in session refresh:', err);
      }
    };
    
    // Run the session refresher on initial load
    refreshSession();
    
    // Set up interval to check and refresh session
    const refreshInterval = setInterval(refreshSession, 5 * 60 * 1000); // Every 5 minutes
    
    // Clean up interval on app unmount
    nuxtApp.hook('app:unmounted', () => {
      clearInterval(refreshInterval);
    });
  }
});