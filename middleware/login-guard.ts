// Login guard middleware to prevent authenticated users from accessing login page
export default defineNuxtRouteMiddleware(async (to) => {
  // Only apply to auth pages
  if (!to.path.startsWith('/auth')) {
    return;
  }
  
  // Skip for server-side rendering
  if (process.server) {
    return;
  }
  
  const supabase = useSupabaseClient();
  
  try {
    // Check if session exists
    const { data } = await supabase.auth.getSession();
    
    if (data.session) {
      console.log('User already authenticated, redirecting to dashboard');
      return navigateTo('/dashboard');
    }
    
    // No session, allow access to auth pages
    return;
  } catch (err) {
    console.error('Login guard error:', err);
    // If there's an error checking the session, allow access to auth pages
    return;
  }
});