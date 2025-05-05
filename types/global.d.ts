/**
 * Global TypeScript definitions for the application
 */

// Extend Window interface with our custom navigation helper
interface Window {
  __expenseTrackerNavigation?: {
    navigateTo: (path: string) => void;
    toDashboard: () => void;
  };
}

// Extend Element interface to track navigation fix status
interface Element {
  __navFixed?: boolean;
}