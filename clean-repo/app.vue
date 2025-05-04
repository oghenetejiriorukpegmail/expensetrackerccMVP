<template>
  <div>
    <NuxtLayout>
      <!-- Explicitly use NuxtPage component for Nuxt routing -->
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// Import animations
import '~/assets/css/animations.css';

// Global auth state initialization
import { useUserStore } from '~/stores/userStore';
import { useSupabaseClient, onMounted, onUnmounted } from '#imports';

const supabase = useSupabaseClient();
const userStore = useUserStore();

// Initialize auth state on app load
const initAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('Session found on app load, initializing user profile');
      await userStore.fetchProfile();
    }
  } catch (error) {
    console.error('Error initializing auth state:', error);
  }
};

// Run once on app mount
onMounted(() => {
  initAuth();
  
  // Set up auth state change listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session) {
        // Wait a short time to ensure auth state is fully propagated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          // Use the same Supabase client instance to ensure auth state consistency
          await userStore.fetchProfile(supabase);
        } catch (error) {
          console.error('Error fetching profile on auth change:', error);
        }
      }
    }
    
    if (event === 'SIGNED_OUT') {
      userStore.resetState();
    }
  });
  
  // Clean up subscription on unmount
  onUnmounted(() => {
    subscription.unsubscribe();
  });
});

// Auth middleware is applied through the Nuxt configuration
</script>

<style>
/* Modern focus styles for better accessibility */
:focus-visible {
  outline: 2px solid var(--primary-color, #0ea5e9);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.dark ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Smooth transitions for color mode changes */
* {
  transition: background-color 0.3s, border-color 0.3s, color 0.3s;
}
</style>