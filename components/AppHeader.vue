<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm backdrop-blur-sm sticky top-0 z-50 bg-opacity-95 dark:bg-opacity-95 transition-all duration-300">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center py-3">
        <div class="flex items-center space-x-4">
          <NuxtLink to="/" class="flex items-center space-x-3 group">
            <span class="text-primary-600 dark:text-primary-400 transition-transform duration-500 transform group-hover:rotate-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"></path>
              </svg>
            </span>
            <span class="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent">Expense Tracker</span>
          </NuxtLink>
        </div>
        
        <nav class="hidden md:flex items-center space-x-1">
          <NuxtLink 
            v-if="supabaseUser"
            v-for="(link, index) in navLinks" 
            :key="link.to"
            :to="link.to" 
            class="relative px-4 py-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 overflow-hidden"
            :class="[`slide-in-top-${index + 1}`]"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          >
            <div class="flex items-center space-x-2">
              <component :is="link.icon" class="h-5 w-5" />
              <span>{{ link.text }}</span>
            </div>
            
            <!-- Animated underline effect -->
            <span class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 dark:bg-primary-400 transform scale-x-0 transition-transform origin-left group-hover:scale-x-100"></span>
          </NuxtLink>
        </nav>
        
        <div class="flex items-center space-x-3">
          <button 
            @click="toggleDarkMode"
            class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform duration-500 hover:rotate-12"
            :class="{ 'rotate-180': isDarkModeAnimating }"
          >
            <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          
          <div v-if="supabaseUser" class="relative">
            <button 
              @click="isUserMenuOpen = !isUserMenuOpen"
              class="flex items-center space-x-2 focus:outline-none hover:opacity-90 transition-opacity"
            >
              <span class="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ displayName }}
              </span>
              <div class="h-9 w-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-700 p-[2px] shadow-md">
                <div v-if="!profile?.avatar_url" class="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-primary-700 dark:text-primary-300">
                  <span>{{ userInitials }}</span>
                </div>
                <img 
                  v-else 
                  :src="profile.avatar_url" 
                  :alt="profile.full_name || 'User'"
                  class="h-full w-full rounded-full object-cover"
                />
              </div>
            </button>
            
            <div 
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-20 border border-gray-200 dark:border-gray-700 overflow-hidden fade-in origin-top-right"
            >
              <div class="p-3 border-b border-gray-200 dark:border-gray-700">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile?.full_name || supabaseUser.email }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ supabaseUser.email }}</p>
              </div>
              <NuxtLink 
                to="/settings"
                class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="isUserMenuOpen = false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </NuxtLink>
              <button 
                @click="handleLogout"
                class="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
          
          <button 
            v-if="!supabaseUser"
            @click="navigateTo('/auth/login')"
            class="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-medium py-2 px-4 rounded-lg shadow hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </div>
        
        <button 
          @click="toggleMobileMenu" 
          class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div 
        v-if="isMobileMenuOpen" 
        class="md:hidden py-3 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="space-y-1">
          <NuxtLink 
            v-if="supabaseUser"
            v-for="(link, index) in navLinks" 
            :key="link.to"
            :to="link.to" 
            class="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 slide-in-right"
            :style="`animation-delay: ${index * 0.05}s`"
            @click="isMobileMenuOpen = false"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          >
            <component :is="link.icon" class="h-5 w-5" />
            <span>{{ link.text }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSupabaseUser, useSupabaseClient, navigateTo } from '#imports';
import { useUserStore } from '~/stores/userStore';

const supabaseUser = useSupabaseUser();
const supabase = useSupabaseClient();
const userStore = useUserStore();

// Use clientOnly components for icons to avoid hydration mismatches
const DashboardIcon = defineComponent({
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    class: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    })
  ])
});

const TripsIcon = defineComponent({
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    class: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    })
  ])
});

const ExpensesIcon = defineComponent({
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    class: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    })
  ])
});

const MileageIcon = defineComponent({
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    class: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    })
  ])
});

const ReportsIcon = defineComponent({
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    class: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    })
  ])
});

// Define navigation links with icons
const navLinks = [
  {
    to: '/dashboard',
    text: 'Dashboard',
    icon: DashboardIcon
  },
  {
    to: '/trips',
    text: 'Trips',
    icon: TripsIcon
  },
  {
    to: '/expenses',
    text: 'Expenses',
    icon: ExpensesIcon
  },
  {
    to: '/mileage',
    text: 'Mileage',
    icon: MileageIcon
  },
  {
    to: '/reports',
    text: 'Reports',
    icon: ReportsIcon
  }
];

// State
const isDarkMode = ref(false);
const isDarkModeAnimating = ref(false);
const isMobileMenuOpen = ref(false);
const isUserMenuOpen = ref(false);

const profile = computed(() => userStore.profile);

// Add a stable display name that won't change during hydration
const displayName = computed(() => {
  return profile.value?.full_name || (supabaseUser.value?.email || '');
});

const userInitials = computed(() => {
  if (profile.value?.full_name) {
    return profile.value.full_name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  if (supabaseUser.value?.email) {
    return supabaseUser.value.email.charAt(0).toUpperCase();
  }
  
  return 'U';
});

// Check if dark mode is already enabled (from localStorage or system preference)
onMounted(() => {
  // Check if dark mode is preferred by the system
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Check if dark mode is stored in localStorage
  const storedDarkMode = localStorage.getItem('darkMode');
  
  // Set dark mode based on localStorage or system preference
  if (storedDarkMode === 'true' || (storedDarkMode === null && prefersDark)) {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  }
});

// Load user profile when authenticated
if (supabaseUser.value) {
  userStore.fetchProfile(supabase);
}

// Toggle dark mode with animation
const toggleDarkMode = () => {
  isDarkModeAnimating.value = true;
  
  // Toggle dark mode after a short delay for animation
  setTimeout(() => {
    isDarkMode.value = !isDarkMode.value;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDarkMode.value.toString());
    
    // Reset animation state
    setTimeout(() => {
      isDarkModeAnimating.value = false;
    }, 500);
  }, 150);
};

// Toggle mobile menu with animation
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Handle user logout
const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    userStore.resetState();
    isUserMenuOpen.value = false;
    navigateTo('/');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
</script>