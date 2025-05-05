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

// Import hydration helpers
import { runAfterHydration } from '~/utils/hydration-helpers';
import { defineNuxtPlugin } from '#imports';

// Handle lockdown CSP and hydration
if (process.client) {
  // Wait until after hydration to run any browser-specific code
  runAfterHydration(() => {
    console.log('Running post-hydration initialization');

    // Define a meta tag to attempt to handle CSP issues
    if (typeof document !== 'undefined') {
      // Add a meta tag to handle lockdown CSP issues
      const metaTag = document.createElement('meta');
      metaTag.httpEquiv = 'Content-Security-Policy';
      metaTag.content = "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: *; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: *; connect-src 'self' *;";
      document.head.appendChild(metaTag);
      
      // Fix all links to improve navigation reliability
      const fixNavigation = () => {
        // Fix dashboard links
        const dashboardLinks = document.querySelectorAll('a[href="/dashboard"]');
        dashboardLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/dashboard';
          });
        });
        
        // Fix NuxtLink components that might be causing issues
        document.querySelectorAll('a[href^="/"]').forEach(link => {
          // Don't modify links that already have event listeners
          if (!(link as any).__navFixed) {
            // Mark as fixed to avoid duplicating
            (link as any).__navFixed = true;
            
            // Original href
            const href = link.getAttribute('href');
            if (!href) return;
            
            link.addEventListener('click', (e) => {
              // Special handling for certain paths
              if (href === '/dashboard' || href.startsWith('/trips') || 
                  href.startsWith('/expenses') || href.startsWith('/reports')) {
                e.preventDefault();
                window.location.href = href;
              }
            });
          }
        });
      };
      
      // Run immediately and also set up a mutation observer for dynamically added links
      fixNavigation();
      
      // Add an observer to catch new links
      const observer = new MutationObserver(() => {
        fixNavigation();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  });
}

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