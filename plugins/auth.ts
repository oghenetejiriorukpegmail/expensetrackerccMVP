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
    } catch (err) {
      console.error('Error in global auth middleware:', err);
      return navigateTo('/auth/login');
    }
  }, { global: true });
});