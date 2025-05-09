import { test as base } from '@playwright/test';
import { AuthUtils } from '../utils/auth.utils';

// Define custom fixture types
type AuthFixtures = {
  authUtils: AuthUtils;
  authenticatedPage: {
    page: any;
    token: string;
    userId: string;
  };
};

// Extend base test with custom fixtures
export const test = base.extend<AuthFixtures>({
  // Utils for authentication actions
  authUtils: async ({ page }, use) => {
    const authUtils = new AuthUtils(page);
    await use(authUtils);
  },

  // Pre-authenticated page fixture for tests that require login
  authenticatedPage: async ({ page }, use) => {
    const authUtils = new AuthUtils(page);
    
    // Create test user or use existing one
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!',
      fullName: 'Test User',
    };
    
    // Go to the register page
    await page.goto('/auth/register');
    
    // Register a new user if needed
    // (In real scenario, you might want to directly create a user in the database)
    try {
      await authUtils.register(testUser);
    } catch (error) {
      // If registration fails (perhaps user exists), try login
      await page.goto('/auth/login');
      await authUtils.login(testUser);
    }
    
    // Get the auth token from localStorage
    const token = await page.evaluate(() => window.localStorage.getItem('supabase.auth.token'));
    const userId = await page.evaluate(() => {
      const data = localStorage.getItem('supabase.auth.token');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed?.user?.id || '';
      }
      return '';
    });
    
    // Make the authenticated page and token available to the test
    await use({ page, token, userId });
    
    // Clean up - logout after test is done
    await authUtils.logout();
  },
});

export { expect } from '@playwright/test';