// Authentication middleware to manage user sessions
import { useUserStore } from '~/stores/userStore';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware for auth pages and home
  if (to.path.startsWith('/auth') || to.path === '/') {
    return;
  }
  
  // Skip for server-side rendering to avoid hydration issues
  if (process.server) {
    return;
  }
  
  const supabase = useSupabaseClient();
  const userStore = useUserStore();
  
  try {
    // First check if we have a profile already loaded in the store
    // which indicates a valid session from a previous check
    if (userStore.profile) {
      return; // User is already authenticated
    }

    // Otherwise, check if a session exists
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth middleware error:', error);
      return navigateTo('/auth/login');
    }
    
    if (!session) {
      console.log('No active session, redirecting to login');
      return navigateTo('/auth/login');
    }
    
    // Attempt to refresh token if it exists but might be about to expire
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const tenMinutesInSeconds = 10 * 60;
    
    if (expiresAt && (expiresAt - now < tenMinutesInSeconds)) {
      console.log('Session token close to expiry, refreshing...');
      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Error refreshing token:', refreshError);
          return navigateTo('/auth/login');
        }
      } catch (refreshError) {
        console.error('Exception during token refresh:', refreshError);
      }
    }
    
    // Session exists but no profile, fetch it now
    try {
      await userStore.fetchProfile(supabase);
      console.log('Profile loaded in middleware');
    } catch (profileError) {
      console.error('Error fetching profile in middleware:', profileError);
      return navigateTo('/auth/login');
    }
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    return navigateTo('/auth/login');
  }
});