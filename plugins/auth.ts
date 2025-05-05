// Auth session helper plugin
import { safeStorage } from '~/utils/hydration-helpers';
import { useUserStore } from '~/stores/userStore';

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    const userStore = useUserStore();
    
    // Track if we're currently refreshing to prevent recursion
    let isRefreshing = false;
    
    // Initialize session refresher - no longer using global middleware
    const refreshSession = async () => {
      // Prevent recursive calls
      if (isRefreshing) {
        console.log('Already refreshing session, skipping');
        return;
      }
      
      try {
        isRefreshing = true;
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
          
          // Only load the profile if we don't have one already
          if (!userStore.profile) {
            console.log('Loading user profile after session refresh');
            await userStore.fetchProfile(supabase);
          }
        }
      } catch (err) {
        console.error('Error in session refresh:', err);
      } finally {
        isRefreshing = false;
      }
    };
    
    // Run the session refresher on initial load
    refreshSession();
    
    // Set up interval to check and refresh session
    const refreshInterval = setInterval(refreshSession, 5 * 60 * 1000); // Every 5 minutes
    
    const supabase = useSupabaseClient();
    
    // Track if we're currently processing an auth state change to prevent recursion
    let isProcessingAuthChange = false;
    
    // Handle auth state changes (especially for OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        // Prevent recursive calls
        if (isProcessingAuthChange) {
          console.log('Already processing auth change, skipping');
          return;
        }
        
        // Only process SIGNED_IN once per page load
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (session) {
            try {
              isProcessingAuthChange = true;
              
              // If user profile already exists, don't reload it
              if (!userStore.profile) {
                // If signed in with OAuth provider, we need to ensure the profile is created
                console.log('User signed in, updating profile');
                await userStore.fetchProfile(supabase);
              }
              
              // Check if this is an OAuth redirect
              const url = new URL(window.location.href);
              const hasAuthParams = url.hash.includes('access_token') || 
                                  url.searchParams.has('access_token') || 
                                  url.searchParams.has('code');
              
              // If we detect OAuth parameters and user is authenticated but not on dashboard
              if (hasAuthParams && !window.location.pathname.includes('/dashboard')) {
                console.log('Detected OAuth redirect, navigating to dashboard');
                window.location.href = '/dashboard';
              }
            } finally {
              isProcessingAuthChange = false;
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear user state
          userStore.resetState();
        }
      }
    );
    
    // Clean up on app unmount
    nuxtApp.hook('app:unmounted', () => {
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    });
  }
});