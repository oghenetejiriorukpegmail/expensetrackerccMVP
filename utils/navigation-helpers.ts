/**
 * Utilities to help with navigation and routing
 */
import { navigateTo } from '#imports';

/**
 * Enhanced navigation helper that ensures proper client-side navigation
 * Helps prevent hydration issues and CSP problems with navigation
 * 
 * @param path Path to navigate to
 * @param options Navigation options
 */
export const safeNavigate = (path: string, options?: any) => {
  // Only run in client
  if (typeof window === 'undefined') return;
  
  // Wait a tick to ensure hydration is complete
  setTimeout(() => {
    try {
      // Use a direct push to router if available
      if (typeof window.__NUXT__?.state?.router !== 'undefined') {
        // Router is available, use it directly
        window.__NUXT__.state.router.push(path);
        return;
      }
    } catch (e) {
      console.error('Error during direct router navigation:', e);
    }
    
    // Fallback to normal navigation
    navigateTo(path, options);
  }, 10);
};

/**
 * Fix for <a> links to ensure they properly navigate
 * Attaches click event handlers to links to ensure proper navigation
 */
export const fixAnchorLinks = () => {
  // Only run in client
  if (typeof window === 'undefined') return;
  
  // Wait for DOM to be fully loaded
  setTimeout(() => {
    const links = document.querySelectorAll('a[href^="/"]');
    
    links.forEach(link => {
      // Skip links that already have event listeners
      if ((link as any).__navFixed) return;
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const href = link.getAttribute('href');
        if (href) {
          safeNavigate(href);
        }
      });
      
      // Mark as fixed
      (link as any).__navFixed = true;
    });
  }, 100);
};

/**
 * Apply event listeners to fix navigation issues
 * Call this after hydration is complete
 */
export const setupNavigationFixes = () => {
  // Only run in client
  if (typeof window === 'undefined') return;
  
  // Fix anchor links on load
  fixAnchorLinks();
  
  // Also set up a mutation observer to fix new links as they appear
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        fixAnchorLinks();
      }
    });
  });
  
  // Start observing the document
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Return the observer to allow cleanup
  return observer;
};