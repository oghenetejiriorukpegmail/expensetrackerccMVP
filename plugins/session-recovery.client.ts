// Client-only plugin to ensure session recovery after hydration
import { useSupabaseClient, useSupabaseUser } from '#imports';

export default defineNuxtPlugin({
  name: 'session-recovery',
  enforce: 'pre', // Run before other plugins
  
  async setup(nuxtApp) {
    // Only run in client
    if (process.server) return;
    
    const supabase = useSupabaseClient();
    
    // Function to restore session from localStorage
    const restoreSession = async () => {
      try {
        if (typeof localStorage !== 'undefined') {
          const storedSession = localStorage.getItem('supabase-auth');
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession);
              if (parsed?.access_token && parsed?.refresh_token) {
                console.log('Hydration complete: Restoring session from localStorage');
                // Set the session using stored tokens
                const { data, error } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token
                });
                
                if (error) {
                  console.error('Error restoring session after hydration:', error);
                  localStorage.removeItem('supabase-auth');
                } else if (data.session) {
                  console.log('Session restored successfully after hydration');
                }
              }
            } catch (e) {
              console.error('Error parsing stored session during recovery:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error in session recovery plugin:', error);
      }
    };
    
    // Listen for hydration complete
    nuxtApp.hook('app:mounted', async () => {
      console.log('App mounted, checking session');
      await restoreSession();
    });
    
    // Also set up a periodic check for session expiry
    if (typeof window !== 'undefined') {
      // Check every 5 minutes
      const intervalId = setInterval(async () => {
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
                // Update localStorage with refreshed session
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('supabase-auth', JSON.stringify({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: data.session.expires_at,
                    user: data.session.user
                  }));
                }
              }
            } catch (refreshError) {
              console.error('Exception during background token refresh:', refreshError);
            }
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      // Clean up on unmount
      nuxtApp.hook('app:unmounted', () => {
        clearInterval(intervalId);
      });
    }
  }
});