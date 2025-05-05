/**
 * Client-only plugin to fix navigation issues
 */
import { setupNavigationFixes } from '~/utils/navigation-helpers';
import { runAfterHydration } from '~/utils/hydration-helpers';

export default defineNuxtPlugin({
  name: 'navigation-fix',
  enforce: 'post', // Run after other plugins
  setup() {
    // Only run on client
    if (process.server) return;
    
    // Wait for hydration to complete to avoid issues
    runAfterHydration(() => {
      // Set up navigation fixes
      const observer = setupNavigationFixes();
      
      // Clean up on app unmount
      if (observer) {
        const nuxtApp = useNuxtApp();
        nuxtApp.hook('app:unmounted', () => {
          observer.disconnect();
        });
      }
    });
  }
});