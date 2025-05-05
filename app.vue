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

// Import animations only
import { useRouter, onMounted } from '#imports';

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