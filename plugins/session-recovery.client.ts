// Client-only plugin to ensure session recovery after hydration
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { runAfterHydration, safeStorage } from '~/utils/hydration-helpers';

export default defineNuxtPlugin({
  name: 'session-recovery',
  enforce: 'pre', // Run before other plugins
  
  setup(nuxtApp) {
    // Only run in client
    if (process.server) return;
    
    // Wait for hydration to complete before initializing
    runAfterHydration(() => {
      initializeSessionRecovery(nuxtApp);
    });
  }
});

/**
 * Initialize session recovery after hydration is complete
 * This prevents hydration mismatches by running only on client after initial render
 */
const initializeSessionRecovery = (nuxtApp) => {
  const supabase = useSupabaseClient();
    
  // Function to restore session from localStorage
  const restoreSession = async () => {
    try {
      // Use safe storage helper
      const storedSession = safeStorage.getItem('supabase-auth');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          if (parsed?.access_token && parsed?.refresh_token) {
            console.log('Safely restoring session from storage');
            // Set the session using stored tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: parsed.access_token,
              refresh_token: parsed.refresh_token
            });
            
            if (error) {
              console.error('Error restoring session after hydration:', error);
              safeStorage.removeItem('supabase-auth');
            } else if (data.session) {
              console.log('Session restored successfully after hydration');
              // Re-save with current timestamp to refresh expiry info
              safeStorage.setItem('supabase-auth', JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                user: data.session.user
              }));
            }
          }
        } catch (e) {
          console.error('Error parsing stored session during recovery:', e);
        }
      }
    } catch (error) {
      console.error('Error in session recovery plugin:', error);
    }
  };
  
  // Initial restore after a small delay
  setTimeout(() => {
    restoreSession();
  }, 100);
  
  // Set up a periodic check for session expiry
  let intervalId = null;
  
  const setupRefreshInterval = () => {
    // Clean up existing interval if any
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Check every 5 minutes
    intervalId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check if token is about to expire (within 30 minutes)
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const thirtyMinutesInSeconds = 30 * 60;
          
          if (expiresAt && (expiresAt - now < thirtyMinutesInSeconds)) {
            console.log('Session token close to expiry, refreshing in background');
            try {
              const { data, error } = await supabase.auth.refreshSession();
              if (error) {
                console.error('Error refreshing token in background:', error);
              } else if (data.session) {
                console.log('Session refreshed successfully in background');
                // Update storage with refreshed session
                safeStorage.setItem('supabase-auth', JSON.stringify({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                  expires_at: data.session.expires_at,
                  user: data.session.user
                }));
              }
            } catch (refreshError) {
              console.error('Exception during background token refresh:', refreshError);
            }
          }
        }
      } catch (error) {
        console.error('Error in session refresh interval:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };
  
  // Set up the interval
  setupRefreshInterval();
  
  // Clean up on unmount
  nuxtApp.hook('app:unmounted', () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
};