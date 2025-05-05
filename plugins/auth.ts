// Global auth plugin
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
    
    const supabase = useSupabaseClient();
    
    try {
      // Check if session exists
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session in global middleware, redirecting to login');
        return navigateTo('/auth/login');
      }
      
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
      }
    } catch (err) {
      console.error('Error in global auth middleware:', err);
      return navigateTo('/auth/login');
    }
  }, { global: true });
});