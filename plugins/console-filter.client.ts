/**
 * Client-only plugin to filter console messages
 * This helps with suppressing the lockdown-install.js warnings
 */
export default defineNuxtPlugin({
  name: 'console-filter',
  enforce: 'pre', // Run before other plugins to filter as early as possible
  
  setup() {
    if (process.server) return;
    
    // Only safe to run on client side
    if (typeof window !== 'undefined') {
      // Wait for document to be fully loaded to avoid hydration mismatches
      if (document.readyState === 'complete') {
        setupConsoleFilter();
      } else {
        window.addEventListener('load', setupConsoleFilter, { once: true });
      }
    }
  }
});

const setupConsoleFilter = () => {
  // Suppress specific console warnings
  // Wait a bit to ensure this happens after hydration
  setTimeout(() => {
    // Keep reference to original console methods
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    // List of patterns to filter out
    const patterns = [
      'Removing unpermitted intrinsics',
      'Multiple GoTrueClient instances detected',
      'Hydration completed but contains mismatches'
    ];
    
    // Replace console methods with filtered versions
    console.log = function(...args) {
      if (shouldFilter(args, patterns)) return;
      return originalConsoleLog.apply(console, args);
    };
    
    console.warn = function(...args) {
      if (shouldFilter(args, patterns)) return;
      return originalConsoleWarn.apply(console, args);
    };
    
    console.error = function(...args) {
      if (shouldFilter(args, patterns)) return;
      return originalConsoleError.apply(console, args);
    };
    
    // Small utility to check if message contains any of the filter patterns
    function shouldFilter(args, patterns) {
      if (!args.length || typeof args[0] !== 'string') return false;
      
      const message = args[0];
      return patterns.some(pattern => message.includes(pattern));
    }
  }, 500);
};