import { test, expect } from './fixtures/auth.fixture';

test.describe('Trip Management', () => {
  // Use the pre-authenticated page for all tests
  test.use({ baseURL: 'http://localhost:3000' });
  
  test.beforeEach(async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    // Navigate to trips page
    await page.goto('/trips');
  });

  test('should display the trips page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Check for trip page elements
    await expect(page.getByRole('heading', { name: /trips|trip list/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add|new|create trip/i })).toBeVisible();
  });

  test('should navigate to new trip form', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Click on the "New Trip" button
    await page.getByRole('link', { name: /add|new|create trip/i }).click();
    
    // Verify we're on the new trip page
    await expect(page).toHaveURL(/.*\/trips\/new/);
    
    // Check for form elements
    await expect(page.getByRole('heading', { name: /new trip|add trip/i })).toBeVisible();
    await expect(page.getByLabel(/name|trip name/i)).toBeVisible();
    await expect(page.getByLabel(/start date/i)).toBeVisible();
    await expect(page.getByLabel(/end date/i)).toBeVisible();
  });

  test('should create a new trip', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Navigate to new trip page
    await page.goto('/trips/new');
    
    // Generate a unique trip name
    const tripName = `Test Trip ${Date.now()}`;
    
    // Fill out the form
    await page.getByLabel(/name|trip name/i).fill(tripName);
    
    // Set start date to today
    const today = new Date();
    const startDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    await page.getByLabel(/start date/i).fill(startDate);
    
    // Set end date to next week
    today.setDate(today.getDate() + 7);
    const endDate = today.toISOString().split('T')[0];
    await page.getByLabel(/end date/i).fill(endDate);
    
    // Fill destination if available
    const destinationField = page.getByLabel(/destination/i);
    if (await destinationField.isVisible()) {
      await destinationField.fill('Test City');
    }
    
    // Fill purpose if available
    const purposeField = page.getByLabel(/purpose/i);
    if (await purposeField.isVisible()) {
      await purposeField.fill('Business Meeting');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Verify redirect to trips list or trip detail
    await expect(page.url()).toMatch(/.*\/trips(\/.+)?/);
    
    // Check for trip in list
    if (page.url().includes('/trips/')) {
      // We might be on a trip detail page
      await expect(page.getByText(tripName)).toBeVisible();
      
      // Navigate back to trips list
      await page.goto('/trips');
    }
    
    // Verify the new trip appears in the list
    await expect(page.getByText(tripName)).toBeVisible();
  });

  test('should validate trip form inputs', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Navigate to new trip page
    await page.goto('/trips/new');
    
    // Submit the form without filling required fields
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Expect validation messages
    await expect(page.getByText(/name is required|name.*required/i)).toBeVisible();
    await expect(page.getByText(/start date is required|start date.*required/i)).toBeVisible();
    
    // Test end date before start date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Fill start date as tomorrow
    await page.getByLabel(/start date/i).fill(tomorrowStr);
    
    // Fill end date as yesterday (before start date)
    await page.getByLabel(/end date/i).fill(yesterdayStr);
    
    // Fill name to pass that validation
    await page.getByLabel(/name|trip name/i).fill('Test Trip');
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Expect date validation error
    await expect(page.getByText(/end date.*after start date|invalid date range/i)).toBeVisible();
  });

  test('should navigate to trip details', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create a trip to view
    await page.goto('/trips/new');
    
    // Generate a unique trip name
    const tripName = `Detail Trip ${Date.now()}`;
    
    // Fill out the form with minimal required fields
    await page.getByLabel(/name|trip name/i).fill(tripName);
    
    // Set dates
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    await page.getByLabel(/start date/i).fill(startDate);
    
    today.setDate(today.getDate() + 7);
    const endDate = today.toISOString().split('T')[0];
    await page.getByLabel(/end date/i).fill(endDate);
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Go back to trips page if not already there
    if (!page.url().includes('/trips')) {
      await page.goto('/trips');
    }
    
    // Find and click on the trip's name or view details link
    await page.getByText(tripName).click();
    
    // Verify we're on the trip details page
    await expect(page.url()).toMatch(/.*\/trips\/.+/);
    
    // Check for trip details
    await expect(page.getByText(tripName)).toBeVisible();
    await expect(page.getByText(startDate)).toBeVisible();
  });

  test('should edit an existing trip', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create a trip to edit
    await page.goto('/trips/new');
    
    // Generate a unique trip name
    const originalName = `Edit Trip ${Date.now()}`;
    
    // Fill out the form with minimal required fields
    await page.getByLabel(/name|trip name/i).fill(originalName);
    
    // Set dates
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    await page.getByLabel(/start date/i).fill(startDate);
    
    today.setDate(today.getDate() + 7);
    const endDate = today.toISOString().split('T')[0];
    await page.getByLabel(/end date/i).fill(endDate);
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Go back to trips page
    await page.goto('/trips');
    
    // Find and click on the edit button/link for this trip
    const tripRow = page.getByText(originalName).first();
    await tripRow.isVisible();
    
    // Find edit button near this trip
    const editButtons = page.getByRole('link', { name: /edit/i }).all();
    const tripEditButton = (await editButtons)[0];
    await tripEditButton.click();
    
    // Verify we're on the edit page
    await expect(page.url()).toContain('/edit');
    
    // Update trip details
    const updatedName = `Updated Trip ${Date.now()}`;
    await page.getByLabel(/name|trip name/i).clear();
    await page.getByLabel(/name|trip name/i).fill(updatedName);
    
    // Update other fields if available
    const destinationField = page.getByLabel(/destination/i);
    if (await destinationField.isVisible()) {
      await destinationField.clear();
      await destinationField.fill('Updated City');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|update|submit/i }).click();
    
    // Verify redirect to trips list or trip detail
    await expect(page.url()).toMatch(/.*\/trips(\/.+)?/);
    
    // Navigate to trips list if needed
    if (!page.url().endsWith('/trips')) {
      await page.goto('/trips');
    }
    
    // Verify updated trip appears in the list
    await expect(page.getByText(updatedName)).toBeVisible();
    // Verify original name is gone
    await expect(page.getByText(originalName)).not.toBeVisible();
  });

  test('should delete a trip', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create a trip to delete
    await page.goto('/trips/new');
    
    // Generate a unique trip name
    const tripName = `Delete Trip ${Date.now()}`;
    
    // Fill out the form with minimal required fields
    await page.getByLabel(/name|trip name/i).fill(tripName);
    
    // Set dates
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    await page.getByLabel(/start date/i).fill(startDate);
    
    today.setDate(today.getDate() + 7);
    const endDate = today.toISOString().split('T')[0];
    await page.getByLabel(/end date/i).fill(endDate);
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Go back to trips page
    await page.goto('/trips');
    
    // Verify trip appears in the list
    await expect(page.getByText(tripName)).toBeVisible();
    
    // Find and click on the delete button for this trip
    const tripRow = page.getByText(tripName).first();
    await tripRow.isVisible();
    
    // Find the delete button near this trip
    const deleteButtons = page.getByRole('button', { name: /delete|remove/i }).all();
    const tripDeleteButton = (await deleteButtons)[0];
    
    // Click delete and handle confirmation if present
    await tripDeleteButton.click();
    
    // Check for confirmation dialog and confirm if it exists
    try {
      const confirmButton = page.getByRole('button', { name: /confirm|yes|ok/i });
      if (await confirmButton.isVisible({ timeout: 1000 })) {
        await confirmButton.click();
      }
    } catch (error) {
      // No confirmation dialog, continue
    }
    
    // Verify trip is removed from the list
    await expect(page.getByText(tripName)).not.toBeVisible({ timeout: 5000 });
  });

  test('should show trip expenses', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create a trip
    await page.goto('/trips/new');
    
    // Generate a unique trip name
    const tripName = `Trip Expenses ${Date.now()}`;
    
    // Fill out the form with minimal required fields
    await page.getByLabel(/name|trip name/i).fill(tripName);
    
    // Set dates
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    await page.getByLabel(/start date/i).fill(startDate);
    
    today.setDate(today.getDate() + 7);
    const endDate = today.toISOString().split('T')[0];
    await page.getByLabel(/end date/i).fill(endDate);
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Check if we're on trip details page
    if (page.url().includes('/trips/')) {
      // We're on trip details page, check for expenses section
      await expect(page.getByText(/expenses|no expenses yet/i)).toBeVisible();
      
      // Look for "Add Expense" button
      const addExpenseButton = page.getByRole('link', { name: /add expense/i });
      if (await addExpenseButton.isVisible()) {
        // Click to add an expense to this trip
        await addExpenseButton.click();
        
        // Verify we're on new expense page
        await expect(page.url()).toContain('/expenses/new');
        
        // Check if trip is pre-selected
        const tripSelect = page.getByLabel(/trip/i);
        const selectedValue = await tripSelect.inputValue();
        
        // If trip isn't pre-selected, select it
        if (!selectedValue) {
          // Find option containing our trip name
          const options = await page.locator('select[id="trip_id"] option').all();
          for (const option of options) {
            const text = await option.textContent();
            if (text && text.includes(tripName)) {
              const value = await option.getAttribute('value');
              await tripSelect.selectOption(value || '');
              break;
            }
          }
        }
        
        // Fill expense details
        await page.getByLabel(/expense type/i).selectOption('meals');
        await page.getByLabel(/vendor/i).fill('Trip Test Restaurant');
        await page.getByLabel(/amount/i).fill('78.90');
        await page.getByLabel(/currency/i).selectOption('USD');
        await page.getByLabel(/date/i).fill(startDate);
        
        // Submit the form
        await page.getByRole('button', { name: /save|submit|create/i }).click();
        
        // Navigate back to trip details
        await page.goto('/trips');
        await page.getByText(tripName).click();
        
        // Verify the expense appears in the trip details
        await expect(page.getByText('Trip Test Restaurant')).toBeVisible();
        await expect(page.getByText('78.90')).toBeVisible();
      }
    }
  });
});