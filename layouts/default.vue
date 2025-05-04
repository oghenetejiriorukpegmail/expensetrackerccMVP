<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
    <AppHeader />
    
    <div class="container mx-auto px-4 py-6">
      <div v-if="supabaseUser" class="fade-in">
        <slot />
      </div>
      <div v-else class="flex flex-col items-center justify-center min-h-[70vh] fade-in">
        <div class="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 border border-gray-200 dark:border-gray-700">
          <div class="text-center mb-8">
            <div class="inline-block p-3 bg-primary-100 dark:bg-primary-900 rounded-full mb-4 pop-in">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white slide-in-bottom">
              Welcome to Expense Tracker
            </h2>
            <p class="text-gray-500 dark:text-gray-400 slide-in-bottom" style="animation-delay: 0.1s">
              Please sign in to access your account
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { useSupabaseUser } from '#imports';

const supabaseUser = useSupabaseUser();
</script>