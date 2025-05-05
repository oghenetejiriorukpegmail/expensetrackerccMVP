// Authentication middleware to manage user sessions
import { useUserStore } from '~/stores/userStore';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware for auth pages and home
  if (to.path.startsWith('/auth') || to.path === '/') {
    return;
  }
  
  // Skip for server-side rendering
  if (process.server) {
    return;
  }
  
  const supabase = useSupabaseClient();
  
  try {
    // Simpler session check - just verify a session exists
    const { data } = await supabase.auth.getSession();
    
    if (!data.session) {
      console.log('No active session, redirecting to login');
      return navigateTo('/auth/login');
    }
    
    // Session exists, allow navigation
    return;
    
  } catch (err) {
    console.error('Auth error:', err);
    return navigateTo('/auth/login');
  }
});