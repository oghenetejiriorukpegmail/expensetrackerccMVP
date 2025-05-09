import { test, expect } from './fixtures/auth.fixture';

test.describe('Authentication flows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the home page for each test
    await page.goto('/');
  });

  test('should navigate to login page from home', async ({ page }) => {
    // Look for a login link on the home page and click it
    await page.getByRole('link', { name: /login|sign in/i }).click();
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });

  test('should navigate to register page from home', async ({ page }) => {
    // Look for a register link on the home page and click it
    await page.getByRole('link', { name: /register|sign up/i }).click();
    
    // Verify we're on the register page
    await expect(page).toHaveURL(/.*\/auth\/register/);
    await expect(page.getByRole('heading', { name: /register|sign up|create account/i })).toBeVisible();
  });

  test('should allow user registration with valid details', async ({ page, authUtils }) => {
    // Generate a unique email for testing
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    // Navigate to register page
    await page.goto('/auth/register');
    
    // Register with test user data
    await authUtils.register({
      email: uniqueEmail,
      password: 'TestPassword123!',
      fullName: 'Test User'
    });
    
    // After registration, we should be redirected to the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify we're logged in by checking for dashboard elements
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
  });

  test('should display validation errors for invalid registration', async ({ page }) => {
    // Navigate to register page
    await page.goto('/auth/register');
    
    // Submit with invalid data (empty fields)
    await page.getByRole('button', { name: /register|sign up/i }).click();
    
    // Expect validation messages
    await expect(page.getByText(/email is required|invalid email/i)).toBeVisible();
    await expect(page.getByText(/password is required|invalid password/i)).toBeVisible();
    
    // Try with invalid password format
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('weak');
    await page.getByRole('button', { name: /register|sign up/i }).click();
    
    // Expect password validation message
    await expect(page.getByText(/password must be at least|stronger password|password requirements/i)).toBeVisible();
  });

  test('should allow user login with valid credentials', async ({ page, authUtils }) => {
    // Generate a unique email for testing
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      fullName: 'Test User'
    };
    
    // First register the user
    await page.goto('/auth/register');
    await authUtils.register(testUser);
    
    // Logout to prepare for login test
    await authUtils.logout();
    
    // Log in with the same credentials
    await page.goto('/auth/login');
    await authUtils.login(testUser);
    
    // After login, we should be redirected to the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify we're logged in by checking for dashboard elements
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
  });

  test('should display error for invalid login credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Try to login with invalid credentials
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Expect error message
    await expect(page.getByText(/invalid credentials|user not found|incorrect password/i)).toBeVisible();
    
    // Verify we're still on the login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('should redirect to login when accessing protected page while logged out', async ({ page }) => {
    // Try to access a protected page directly
    await page.goto('/dashboard');
    
    // Expect to be redirected to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('should successfully logout', async ({ page, authUtils }) => {
    // Register and login
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      fullName: 'Test User'
    };
    
    await page.goto('/auth/register');
    await authUtils.register(testUser);
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Logout
    await authUtils.logout();
    
    // Verify we're redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Try to access a protected page after logout
    await page.goto('/dashboard');
    
    // Expect to be redirected to login again
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
  
  // Test pre-authenticated fixture
  test('should use pre-authenticated page fixture', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Navigate to the dashboard
    await page.goto('/dashboard');
    
    // We should stay on the dashboard (not redirected) since we're authenticated
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify dashboard content is visible
    await expect(page.getByText(/dashboard|expenses|trips/i)).toBeVisible();
  });
});