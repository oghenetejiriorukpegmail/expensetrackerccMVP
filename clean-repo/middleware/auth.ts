// Authentication middleware to manage user sessions
import { useUserStore } from '~/stores/userStore';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware for auth pages
  if (to.path.startsWith('/auth') || to.path === '/') {
    return;
  }
  
  // Skip for server-side rendering
  if (process.server) {
    return;
  }
  
  const supabase = useSupabaseClient();
  const userStore = useUserStore();
  
  try {
    // Check if session exists
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth middleware error:', error);
      return navigateTo('/auth/login');
    }
    
    if (!session) {
      console.log('No active session, redirecting to login');
      return navigateTo('/auth/login');
    }
    
    // Session exists, check if profile is loaded
    if (!userStore.profile) {
      console.log('Session exists but no profile loaded, fetching profile');
      try {
        await userStore.fetchProfile(supabase);
        console.log('Profile loaded in middleware');
      } catch (profileError) {
        console.error('Error fetching profile in middleware:', profileError);
        return navigateTo('/auth/login');
      }
    }
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    return navigateTo('/auth/login');
  }
});