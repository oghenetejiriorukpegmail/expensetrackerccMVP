// Global auth plugin
import { safeStorage } from '~/utils/hydration-helpers';

export default defineNuxtPlugin((nuxtApp) => {
  // Add global middleware
  addRouteMiddleware('global-auth', async (to) => {
    // Skip middleware for auth pages and home page
    if (to.path.startsWith('/auth') || to.path === '/') {
      return;
    }
    
    // Skip for server-side rendering
    if (process.server) {
      return;
    }
    
    // Get the Supabase client
    const supabase = useSupabaseClient();
    
    try {
      // First, try to load session from storage using our safer wrapper
      // This is a safety mechanism in case the Supabase client's session state is lost
      const storedSession = safeStorage.getItem('supabase-auth');
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession?.access_token && parsedSession?.refresh_token) {
            // Only show this message once per session, not on every navigation
            const hasShownRestoreMessage = sessionStorage.getItem('session-restore-shown');
            if (!hasShownRestoreMessage) {
              console.log('Found session in storage, restoring...');
              sessionStorage.setItem('session-restore-shown', 'true');
            }
            
            // Try to set the session with stored tokens
            const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: parsedSession.access_token,
              refresh_token: parsedSession.refresh_token
            });
            
            if (setSessionError) {
              console.error('Error restoring session:', setSessionError);
              // Continue to regular session check
            } else if (setSessionData.session) {
              // Successfully restored, continue with route
              return;
            }
          }
        } catch (parseError) {
          console.error('Error parsing stored session:', parseError);
        }
      }
      
      // Check if session exists using Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session in global middleware, redirecting to login');
        return navigateTo('/auth/login');
      }
      
      // Ensure session is saved to storage for redundancy
      safeStorage.setItem('supabase-auth', JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user
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
          return navigateTo('/auth/login');
        }
        console.log('Session refreshed successfully');
        
        // Update storage with refreshed session
        if (data.session) {
          safeStorage.setItem('supabase-auth', JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: data.session.user
          }));
        }
      }
    } catch (err) {
      console.error('Error in global auth middleware:', err);
      return navigateTo('/auth/login');
    }
  }, { global: true });
});