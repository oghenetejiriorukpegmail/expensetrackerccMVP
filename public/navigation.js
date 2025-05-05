/**
 * Global navigation helper script
 * This script is loaded outside the Vue application to fix navigation issues
 */
(function() {
  // Wait for DOM to be fully loaded
  function initNavigation() {
    // Exit if no document or window
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    
    console.log('Initializing global navigation helpers');
    
    // Patch history.pushState to make it more reliable
    const originalPushState = history.pushState;
    history.pushState = function(state, title, url) {
      // Call original implementation
      const result = originalPushState.apply(this, arguments);
      
      // Dispatch navigation event
      const navEvent = new PopStateEvent('popstate', { state: state });
      window.dispatchEvent(navEvent);
      
      return result;
    };
    
    // Add a click handler to all navigation links
    function fixLinks() {
      document.querySelectorAll('a[href^="/"]').forEach(function(link) {
        // Skip already processed links
        if (link.__navFixed) return;
        link.__navFixed = true;
        
        // Add click handler
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          
          // Skip if no href
          if (!href) return;
          
          // Handle special cases
          if (href === '/dashboard' || 
              href.startsWith('/trips') || 
              href.startsWith('/expenses') || 
              href.startsWith('/reports')) {
            e.preventDefault();
            console.log('Global navigation handler: Navigating to', href);
            window.location.href = href;
          }
        });
      });
    }
    
    // Fix links on load
    fixLinks();
    
    // Also set up observer for new links
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function() {
        fixLinks();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    // Add special handlers for dashboard links
    function forceNavigation(path) {
      window.location.href = path;
    }
    
    // Expose navigation helper globally
    window.__expenseTrackerNavigation = {
      navigateTo: forceNavigation,
      toDashboard: function() {
        forceNavigation('/dashboard');
      }
    };
    
    // Check if we need to recover from a broken navigation
    if (window.location.pathname === '/' && localStorage.getItem('supabase-auth')) {
      // Try to auto-navigate to dashboard if user is logged in
      console.log('User is logged in but on homepage, auto-redirecting to dashboard');
      setTimeout(function() {
        forceNavigation('/dashboard');
      }, 1000);
    }
  }
  
  // Run on load
  if (document.readyState === 'complete') {
    initNavigation();
  } else {
    window.addEventListener('load', initNavigation);
  }
})();