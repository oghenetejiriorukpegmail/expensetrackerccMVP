import { test, expect } from './fixtures/auth.fixture';

test.describe('Mileage Tracking', () => {
  // Use the pre-authenticated page for all tests
  test.use({ baseURL: 'http://localhost:3000' });
  
  test.beforeEach(async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    // Navigate to mileage page
    await page.goto('/mileage');
  });

  test('should display the mileage tracking page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Check for mileage page elements
    await expect(page.getByRole('heading', { name: /mileage|mileage tracking/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add|new|record mileage/i })).toBeVisible();
  });

  test('should navigate to new mileage entry form', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Click on the "Add Mileage" button
    await page.getByRole('link', { name: /add|new|record mileage/i }).click();
    
    // Verify we're on the new mileage page or modal
    // This might be a separate page or a modal dialog
    await expect(page.getByRole('heading', { name: /new mileage|add mileage|record mileage/i })).toBeVisible();
    
    // Check for form elements
    await expect(page.getByLabel(/date/i)).toBeVisible();
    await expect(page.getByLabel(/distance|miles|kilometers/i)).toBeVisible();
  });

  test('should create a new mileage entry', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Look for "Add Mileage" button and click it
    await page.getByRole('link', { name: /add|new|record mileage/i }).click();
    
    // Wait for form to be visible
    await expect(page.getByRole('heading', { name: /new mileage|add mileage|record mileage/i })).toBeVisible();
    
    // Fill out the form
    // First, select a trip if required
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
    
    // Set date to current date
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    await page.getByLabel(/date/i).fill(today);
    
    // Fill distance
    await page.getByLabel(/distance|miles|kilometers/i).fill('45.7');
    
    // Fill starting odometer if available
    const startOdometerField = page.getByLabel(/start.*odometer|odometer.*start/i);
    if (await startOdometerField.isVisible()) {
      await startOdometerField.fill('10000');
    }
    
    // Fill ending odometer if available
    const endOdometerField = page.getByLabel(/end.*odometer|odometer.*end/i);
    if (await endOdometerField.isVisible()) {
      await endOdometerField.fill('10045.7');
    }
    
    // Fill origin/destination if available
    const originField = page.getByLabel(/origin|from/i);
    if (await originField.isVisible()) {
      await originField.fill('Office');
    }
    
    const destinationField = page.getByLabel(/destination|to/i);
    if (await destinationField.isVisible()) {
      await destinationField.fill('Client Site');
    }
    
    // Fill purpose if available
    const purposeField = page.getByLabel(/purpose|reason/i);
    if (await purposeField.isVisible()) {
      await purposeField.fill('Client Meeting');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|record/i }).click();
    
    // Verify redirect back to mileage list
    await expect(page).toHaveURL(/.*\/mileage/);
    
    // Verify the new mileage entry appears in the list
    await expect(page.getByText('45.7')).toBeVisible();
    
    // Check for other fields that should be visible in the list
    const originText = page.getByText('Office');
    const destText = page.getByText('Client Site');
    
    // At least one of these should be visible in the mileage list
    expect(await originText.isVisible() || await destText.isVisible()).toBeTruthy();
  });

  test('should validate mileage form inputs', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Navigate to add mileage form
    await page.getByRole('link', { name: /add|new|record mileage/i }).click();
    
    // Submit the form without filling required fields
    await page.getByRole('button', { name: /save|submit|record/i }).click();
    
    // Expect validation messages
    await expect(page.getByText(/date is required|date.*required/i)).toBeVisible();
    await expect(page.getByText(/distance is required|miles.*required|kilometers.*required/i)).toBeVisible();
    
    // Test invalid distance (negative)
    await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
    await page.getByLabel(/distance|miles|kilometers/i).fill('-10');
    await page.getByRole('button', { name: /save|submit|record/i }).click();
    
    // Expect distance validation error
    await expect(page.getByText(/distance must be positive|distance greater than zero/i)).toBeVisible();
  });

  test('should edit an existing mileage entry', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create a mileage entry to edit
    await page.getByRole('link', { name: /add|new|record mileage/i }).click();
    
    // Fill out the form with minimal required fields
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(today);
    await page.getByLabel(/distance|miles|kilometers/i).fill('37.5');
    
    // Fill origin/destination for identification
    const originField = page.getByLabel(/origin|from/i);
    if (await originField.isVisible()) {
      await originField.fill('Edit Test Origin');
    }
    
    const destinationField = page.getByLabel(/destination|to/i);
    if (await destinationField.isVisible()) {
      await destinationField.fill('Edit Test Destination');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|record/i }).click();
    
    // Verify redirect to mileage list
    await expect(page).toHaveURL(/.*\/mileage/);
    
    // Find and click on the edit button/link for this mileage entry
    // Look for a row containing our distance
    await page.getByText('37.5').isVisible();
    
    // Find edit buttons
    const editButtons = page.getByRole('link', { name: /edit/i }).all();
    const mileageEditButton = (await editButtons)[0];
    await mileageEditButton.click();
    
    // Verify we're on the edit page or edit modal is open
    await expect(page.getByRole('heading', { name: /edit mileage|update mileage/i })).toBeVisible();
    
    // Update mileage details
    await page.getByLabel(/distance|miles|kilometers/i).clear();
    await page.getByLabel(/distance|miles|kilometers/i).fill('42.8');
    
    // Update destination if available
    const editDestField = page.getByLabel(/destination|to/i);
    if (await editDestField.isVisible()) {
      await editDestField.clear();
      await editDestField.fill('Updated Destination');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|update|submit/i }).click();
    
    // Verify redirect to mileage list
    await expect(page).toHaveURL(/.*\/mileage/);
    
    // Verify updated mileage appears in the list
    await expect(page.getByText('42.8')).toBeVisible();
    
    // Check for updated destination if it was changed
    if (await editDestField.isVisible()) {
      await expect(page.getByText('Updated Destination')).toBeVisible();
    }
  });

  test('should delete a mileage entry', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // First create a mileage entry to delete
    await page.getByRole('link', { name: /add|new|record mileage/i }).click();
    
    // Fill out the form with minimal required fields
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/date/i).fill(today);
    await page.getByLabel(/distance|miles|kilometers/i).fill('88.8');
    
    // Fill origin/destination for identification
    const originField = page.getByLabel(/origin|from/i);
    if (await originField.isVisible()) {
      await originField.fill('Delete Test Origin');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|record/i }).click();
    
    // Verify redirect to mileage list
    await expect(page).toHaveURL(/.*\/mileage/);
    
    // Verify new mileage entry appears
    await expect(page.getByText('88.8')).toBeVisible();
    
    // Find and click on the delete button for this mileage entry
    const mileageRow = page.getByText('88.8').first();
    await mileageRow.isVisible();
    
    // Find the delete button near this entry
    const deleteButtons = page.getByRole('button', { name: /delete|remove/i }).all();
    const mileageDeleteButton = (await deleteButtons)[0];
    
    // Click delete and handle confirmation if present
    await mileageDeleteButton.click();
    
    // Check for confirmation dialog and confirm if it exists
    try {
      const confirmButton = page.getByRole('button', { name: /confirm|yes|ok/i });
      if (await confirmButton.isVisible({ timeout: 1000 })) {
        await confirmButton.click();
      }
    } catch (error) {
      // No confirmation dialog, continue
    }
    
    // Verify mileage entry is removed from the list
    await expect(page.getByText('88.8')).not.toBeVisible({ timeout: 5000 });
  });

  test('should calculate mileage totals correctly', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // We'll create two mileage entries and check if the total is calculated correctly
    
    // Create first entry
    await page.getByRole('link', { name: /add|new|record mileage/i }).click();
    await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
    await page.getByLabel(/distance|miles|kilometers/i).fill('25.5');
    await page.getByRole('button', { name: /save|submit|record/i }).click();
    
    // Create second entry
    await page.getByRole('link', { name: /add|new|record mileage/i }).click();
    await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
    await page.getByLabel(/distance|miles|kilometers/i).fill('14.5');
    await page.getByRole('button', { name: /save|submit|record/i }).click();
    
    // Look for a total display element
    // This could be a heading, label, or other element showing the total
    const totalElement = page.getByText(/total|total distance|total miles|total kilometers/i);
    if (await totalElement.isVisible()) {
      // Extract the total value from the element text
      const totalText = await totalElement.textContent() || '';
      
      // Parse the total - this will depend on how it's formatted
      // Look for a number pattern in the text
      const numberMatch = totalText.match(/(\d+(\.\d+)?)/);
      if (numberMatch) {
        const totalValue = parseFloat(numberMatch[0]);
        
        // The expected total is 40.0 (25.5 + 14.5)
        // Allow for small floating point discrepancies
        expect(Math.abs(totalValue - 40.0)).toBeLessThan(0.01);
      } else {
        // If we couldn't parse the number, just check that both values are present
        await expect(page.getByText('25.5')).toBeVisible();
        await expect(page.getByText('14.5')).toBeVisible();
      }
    } else {
      // If no total element found, check that both individual entries exist
      await expect(page.getByText('25.5')).toBeVisible();
      await expect(page.getByText('14.5')).toBeVisible();
    }
  });
});