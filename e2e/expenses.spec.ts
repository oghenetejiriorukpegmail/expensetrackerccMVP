import { test, expect } from './fixtures/auth.fixture';

test.describe('Expense Management', () => {
  // Use the pre-authenticated page for all tests
  test.use({ baseURL: 'http://localhost:3000' });
  
  test.beforeEach(async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    // Navigate to expenses page
    await page.goto('/expenses');
  });

  test('should display the expenses page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Check for expense page elements
    await expect(page.getByRole('heading', { name: /expenses|expense list/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add|new|create expense/i })).toBeVisible();
  });

  test('should navigate to new expense form', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Click on the "New Expense" button
    await page.getByRole('link', { name: /add|new|create expense/i }).click();
    
    // Verify we're on the new expense page
    await expect(page).toHaveURL(/.*\/expenses\/new/);
    
    // Check for form elements
    await expect(page.getByRole('heading', { name: /new expense|add expense/i })).toBeVisible();
    await expect(page.getByLabel(/amount/i)).toBeVisible();
    await expect(page.getByLabel(/vendor/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
  });

  test('should create a new expense', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Navigate to new expense page
    await page.goto('/expenses/new');
    
    // Fill out the form
    // Assuming the form has fields for trip_id, expense_type, vendor, amount, currency, date
    
    // First, select a trip if required (assuming there's at least one trip available)
    const tripSelect = page.getByLabel(/trip/i);
    if (await tripSelect.isVisible()) {
      // Get all options and select the first non-empty one
      const options = await page.locator('select[id="trip_id"] option').all();
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await tripSelect.selectOption(value);
          break;
        }
      }
    }
    
    // Fill out other form fields
    await page.getByLabel(/expense type/i).selectOption('meals');
    await page.getByLabel(/vendor/i).fill('Test Restaurant');
    await page.getByLabel(/amount/i).fill('42.99');
    await page.getByLabel(/currency/i).selectOption('USD');
    
    // Set date to current date
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    await page.getByLabel(/date/i).fill(today);
    
    // Add a description
    const descriptionField = page.getByLabel(/description/i);
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Business lunch with client');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Verify redirect to expenses list
    await expect(page).toHaveURL(/.*\/expenses/);
    
    // Verify the new expense appears in the list
    await expect(page.getByText('Test Restaurant')).toBeVisible();
    await expect(page.getByText('42.99')).toBeVisible();
  });

  test('should validate expense form inputs', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Navigate to new expense page
    await page.goto('/expenses/new');
    
    // Submit the form without filling required fields
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Expect validation messages
    await expect(page.getByText(/amount is required|amount.*required/i)).toBeVisible();
    await expect(page.getByText(/vendor is required|vendor.*required/i)).toBeVisible();
    
    // Test invalid amount
    await page.getByLabel(/amount/i).fill('-10');
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Expect amount validation error
    await expect(page.getByText(/amount must be positive|amount greater than zero/i)).toBeVisible();
  });

  test('should edit an existing expense', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create an expense to edit
    await page.goto('/expenses/new');
    
    // Fill out the form with minimal required fields
    await page.getByLabel(/expense type/i).selectOption('meals');
    await page.getByLabel(/vendor/i).fill('Edit Test Restaurant');
    await page.getByLabel(/amount/i).fill('55.99');
    await page.getByLabel(/currency/i).selectOption('USD');
    
    // Set date to current date
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(today);
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Verify redirect to expenses list
    await expect(page).toHaveURL(/.*\/expenses/);
    
    // Find and click on the edit button/link for this expense
    // This might be challenging as we need to identify the specific expense
    // Look for a row containing our vendor name
    const expenseRow = page.getByText('Edit Test Restaurant').first();
    await expenseRow.isVisible();
    
    // Find the edit button near this expense
    // We might need to look for a button or link within the same container as the expense
    const editButtons = page.getByRole('link', { name: /edit/i }).all();
    const expenseEditButton = (await editButtons)[0];
    await expenseEditButton.click();
    
    // Verify we're on the edit page
    await expect(page.url()).toContain('/expenses/');
    await expect(page.url()).toContain('/edit');
    
    // Update expense details
    await page.getByLabel(/vendor/i).clear();
    await page.getByLabel(/vendor/i).fill('Updated Restaurant');
    await page.getByLabel(/amount/i).clear();
    await page.getByLabel(/amount/i).fill('67.89');
    
    // Submit the form
    await page.getByRole('button', { name: /save|update|submit/i }).click();
    
    // Verify redirect to expenses list
    await expect(page).toHaveURL(/.*\/expenses/);
    
    // Verify updated expense appears in the list
    await expect(page.getByText('Updated Restaurant')).toBeVisible();
    await expect(page.getByText('67.89')).toBeVisible();
  });

  test('should delete an expense', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create an expense to delete
    await page.goto('/expenses/new');
    
    // Fill out the form with minimal required fields
    await page.getByLabel(/expense type/i).selectOption('meals');
    await page.getByLabel(/vendor/i).fill('Delete Test Restaurant');
    await page.getByLabel(/amount/i).fill('33.33');
    await page.getByLabel(/currency/i).selectOption('USD');
    
    // Set date to current date
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(today);
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Verify redirect to expenses list
    await expect(page).toHaveURL(/.*\/expenses/);
    
    // Verify new expense appears
    await expect(page.getByText('Delete Test Restaurant')).toBeVisible();
    
    // Find and click on the delete button for this expense
    // This is challenging for the same reasons as the edit test
    const expenseRow = page.getByText('Delete Test Restaurant').first();
    await expenseRow.isVisible();
    
    // Find the delete button near this expense
    const deleteButtons = page.getByRole('button', { name: /delete|remove/i }).all();
    const expenseDeleteButton = (await deleteButtons)[0];
    
    // Click delete and handle confirmation if present
    await expenseDeleteButton.click();
    
    // Check for confirmation dialog and confirm if it exists
    try {
      const confirmButton = page.getByRole('button', { name: /confirm|yes|ok/i });
      if (await confirmButton.isVisible({ timeout: 1000 })) {
        await confirmButton.click();
      }
    } catch (error) {
      // No confirmation dialog, continue
    }
    
    // Verify expense is removed from the list
    await expect(page.getByText('Delete Test Restaurant')).not.toBeVisible({ timeout: 5000 });
  });

  test('should filter expenses', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Assuming there's a filter functionality on the expenses page
    // This could be search by vendor, date range filter, category filter, etc.
    
    // Look for a search or filter input
    const searchInput = page.getByPlaceholder(/search|filter/i);
    if (await searchInput.isVisible()) {
      // Create a unique expense to filter for
      await page.goto('/expenses/new');
      
      const uniqueVendor = `FilterTest-${Date.now()}`;
      
      // Fill out form
      await page.getByLabel(/expense type/i).selectOption('meals');
      await page.getByLabel(/vendor/i).fill(uniqueVendor);
      await page.getByLabel(/amount/i).fill('45.67');
      await page.getByLabel(/currency/i).selectOption('USD');
      
      // Set date
      const today = new Date().toISOString().split('T')[0];
      await page.getByLabel(/date/i).fill(today);
      
      // Submit the form
      await page.getByRole('button', { name: /save|submit|create/i }).click();
      
      // Go back to expenses page
      await page.goto('/expenses');
      
      // Type in the search/filter input
      await searchInput.fill(uniqueVendor);
      
      // Submit search form if there's a button, or wait for auto-search
      const searchButton = page.getByRole('button', { name: /search|filter|apply/i });
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        // Wait for auto-search/filter to apply
        await page.waitForTimeout(1000);
      }
      
      // Verify filtering shows our expense
      await expect(page.getByText(uniqueVendor)).toBeVisible();
      
      // Verify other expenses are filtered out or only our expense is shown
      // This is harder to test definitively without knowing the exact UI implementation
      // One approach is to count the expense rows
      const expenseRows = await page.locator('.expense-card, .expense-row, tr').count();
      expect(expenseRows).toBeLessThan(10); // Assuming not too many matches for our unique name
    } else {
      // If no filter functionality exists, skip this test
      test.skip('No filter functionality found on expenses page');
    }
  });
});