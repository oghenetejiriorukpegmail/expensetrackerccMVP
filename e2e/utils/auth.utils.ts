import { Page } from '@playwright/test';

export type TestUser = {
  email: string;
  password: string;
  fullName?: string;
};

export class AuthUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Register a new user
   */
  async register(user: TestUser): Promise<void> {
    // Navigate to register page if not already there
    if (!this.page.url().includes('/auth/register')) {
      await this.page.goto('/auth/register');
    }

    // Fill out registration form
    await this.page.getByLabel('Email').fill(user.email);
    await this.page.getByLabel('Password').fill(user.password);
    
    if (user.fullName) {
      await this.page.getByLabel(/Full Name|Name/i).fill(user.fullName);
    }
    
    // Submit the form
    await this.page.getByRole('button', { name: /register|sign up/i }).click();
    
    // Wait for navigation or successful registration indicator
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Login with existing user credentials
   */
  async login(user: TestUser): Promise<void> {
    // Navigate to login page if not already there
    if (!this.page.url().includes('/auth/login')) {
      await this.page.goto('/auth/login');
    }

    // Fill out login form
    await this.page.getByLabel('Email').fill(user.email);
    await this.page.getByLabel('Password').fill(user.password);
    
    // Submit the form
    await this.page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for navigation to dashboard after successful login
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    // Find and click the logout button/link
    // This might be in a dropdown menu or sidebar
    try {
      // First try to look for a user menu that might need to be opened
      const userMenuButton = this.page.getByRole('button', { name: /account|profile|user/i });
      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();
      }
      
      // Look for logout button/link
      const logoutButton = this.page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await this.page.waitForURL('/auth/login');
        return;
      }
      
      // If button not found by role, try by text content
      const logoutLink = this.page.getByText(/logout|sign out/i);
      if (await logoutLink.isVisible()) {
        await logoutLink.click();
        await this.page.waitForURL('/auth/login');
        return;
      }
    } catch (error) {
      console.warn('Could not find logout button through UI. Clearing storage instead.');
      // Fallback: clear localStorage to force logout
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.page.goto('/auth/login');
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => window.localStorage.getItem('supabase.auth.token'));
    return !!token;
  }
}