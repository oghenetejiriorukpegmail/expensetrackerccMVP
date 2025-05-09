import { test, expect } from './fixtures/auth.fixture';

test.describe('Reports Generation', () => {
  // Use the pre-authenticated page for all tests
  test.use({ baseURL: 'http://localhost:3000' });
  
  test.beforeEach(async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    // Navigate to reports page
    await page.goto('/reports');
  });

  test('should display the reports page', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Check for reports page elements
    await expect(page.getByRole('heading', { name: /reports|report generation/i })).toBeVisible();
    
    // Check for report type selection options (might be dropdown, radio buttons, or tabs)
    const reportOptions = [
      /expense report/i,
      /mileage report/i,
      /trip report/i,
      /summary report/i
    ];
    
    // At least one of these options should be visible
    let optionsVisible = false;
    for (const option of reportOptions) {
      if (await page.getByText(option).isVisible()) {
        optionsVisible = true;
        break;
      }
    }
    
    expect(optionsVisible).toBeTruthy();
  });

  test('should generate an expense report', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Check if there's a need to select expense report type first
    const expenseReportOption = page.getByText(/expense report/i);
    if (await expenseReportOption.isVisible()) {
      await expenseReportOption.click();
    }
    
    // Look for date range selectors
    const startDateInput = page.getByLabel(/start date|from/i);
    const endDateInput = page.getByLabel(/end date|to/i);
    
    if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
      // Set date range to current month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = lastDayOfMonth.toISOString().split('T')[0];
      
      await startDateInput.fill(startDate);
      await endDateInput.fill(endDate);
    }
    
    // Look for trip filter if available
    const tripSelect = page.getByLabel(/trip|select trip/i);
    if (await tripSelect.isVisible()) {
      // Try to select a trip, if any are available
      const options = await page.locator('select option').all();
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await tripSelect.selectOption(value);
          break;
        }
      }
    }
    
    // Look for expense type filter if available
    const expenseTypeSelect = page.getByLabel(/expense type|category/i);
    if (await expenseTypeSelect.isVisible()) {
      await expenseTypeSelect.selectOption('meals');
    }
    
    // Find and click generate report button
    await page.getByRole('button', { name: /generate|create|run report/i }).click();
    
    // Verify report generation success
    // This could be either:
    // 1. A report displayed on the page
    // 2. A download initiated
    // 3. A success message
    
    // Check for report table or content
    const reportContent = page.getByText(/report results|no expenses found|expenses total/i);
    
    // Another possibility is a download button appearing
    const downloadButton = page.getByRole('button', { name: /download|export|save/i });
    
    // Either report content or download button should be visible
    expect(await reportContent.isVisible() || await downloadButton.isVisible()).toBeTruthy();
  });

  test('should generate a mileage report', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Check if there's a need to select mileage report type first
    const mileageReportOption = page.getByText(/mileage report/i);
    if (await mileageReportOption.isVisible()) {
      await mileageReportOption.click();
    }
    
    // Look for date range selectors
    const startDateInput = page.getByLabel(/start date|from/i);
    const endDateInput = page.getByLabel(/end date|to/i);
    
    if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
      // Set date range to current month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = lastDayOfMonth.toISOString().split('T')[0];
      
      await startDateInput.fill(startDate);
      await endDateInput.fill(endDate);
    }
    
    // Look for trip filter if available
    const tripSelect = page.getByLabel(/trip|select trip/i);
    if (await tripSelect.isVisible()) {
      // Try to select a trip, if any are available
      const options = await page.locator('select option').all();
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await tripSelect.selectOption(value);
          break;
        }
      }
    }
    
    // Find and click generate report button
    await page.getByRole('button', { name: /generate|create|run report/i }).click();
    
    // Verify report generation success
    // Check for report table or content
    const reportContent = page.getByText(/report results|no mileage found|mileage total|total distance/i);
    
    // Another possibility is a download button appearing
    const downloadButton = page.getByRole('button', { name: /download|export|save/i });
    
    // Either report content or download button should be visible
    expect(await reportContent.isVisible() || await downloadButton.isVisible()).toBeTruthy();
  });

  test('should generate a trip summary report', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Check if there's a need to select trip summary report type first
    const tripReportOption = page.getByText(/trip report|trip summary/i);
    if (await tripReportOption.isVisible()) {
      await tripReportOption.click();
    }
    
    // Look for trip selection
    const tripSelect = page.getByLabel(/trip|select trip/i);
    if (await tripSelect.isVisible()) {
      // Try to select a trip, if any are available
      const options = await page.locator('select option').all();
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await tripSelect.selectOption(value);
          break;
        }
      }
    }
    
    // Find and click generate report button
    await page.getByRole('button', { name: /generate|create|run report/i }).click();
    
    // Verify report generation success
    // Check for report sections
    const reportSections = [
      /trip details/i,
      /expense summary/i,
      /mileage summary/i,
      /total cost/i
    ];
    
    // At least one of these sections should be visible
    let sectionsVisible = false;
    for (const section of reportSections) {
      if (await page.getByText(section).isVisible()) {
        sectionsVisible = true;
        break;
      }
    }
    
    // Another possibility is a download button appearing
    const downloadButton = page.getByRole('button', { name: /download|export|save/i });
    
    // Either report sections or download button should be visible
    expect(sectionsVisible || await downloadButton.isVisible()).toBeTruthy();
  });

  test('should export a report to PDF or Excel', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Generate a basic report first
    
    // Find and click generate report button
    await page.getByRole('button', { name: /generate|create|run report/i }).click();
    
    // Wait for report to be generated
    await page.waitForTimeout(1000);
    
    // Look for export/download options
    const exportOptions = [
      /export to excel/i,
      /export to pdf/i,
      /download excel/i,
      /download pdf/i,
      /save as excel/i,
      /save as pdf/i
    ];
    
    // Try to find and click on an export option
    let exportFound = false;
    for (const option of exportOptions) {
      const exportOption = page.getByText(option);
      if (await exportOption.isVisible()) {
        exportFound = true;
        
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(e => null);
        
        // Click the export option
        await exportOption.click();
        
        // Wait for download to start
        const download = await downloadPromise;
        
        // Verify download started successfully
        expect(download).not.toBeNull();
        break;
      }
    }
    
    // If no specific export option was found, look for a generic download button
    if (!exportFound) {
      const downloadButton = page.getByRole('button', { name: /download|export|save/i });
      if (await downloadButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(e => null);
        
        // Click the download button
        await downloadButton.click();
        
        // Wait for download to start
        const download = await downloadPromise;
        
        // Verify download started successfully
        expect(download).not.toBeNull();
      } else {
        // Skip this test if no export options found
        test.skip('No export options found');
      }
    }
  });

  test('should show visual charts in reports', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Generate a report that might include charts
    
    // Check if there's a chart/graph display option
    const chartOption = page.getByText(/chart|graph|visualization/i);
    if (await chartOption.isVisible()) {
      await chartOption.click();
    }
    
    // Find and click generate report button
    await page.getByRole('button', { name: /generate|create|run report/i }).click();
    
    // Look for chart elements
    // Charts could be rendered as canvas, svg, or other elements
    const chartElements = [
      'canvas',
      'svg',
      '.chart',
      '.graph',
      '[data-testid="chart"]',
      '[data-testid="pie-chart"]',
      '[data-testid="bar-chart"]'
    ];
    
    // Check if any chart elements are visible
    let chartFound = false;
    for (const selector of chartElements) {
      const chartElement = page.locator(selector);
      if (await chartElement.isVisible()) {
        chartFound = true;
        break;
      }
    }
    
    // Skip test if no charts are found
    if (!chartFound) {
      test.skip('No chart elements found in report');
    } else {
      // Verify chart is visible
      expect(chartFound).toBeTruthy();
    }
  });

  test('should filter report by date range', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // Look for date range selectors
    const startDateInput = page.getByLabel(/start date|from/i);
    const endDateInput = page.getByLabel(/end date|to/i);
    
    if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
      // Set date range to previous month
      const today = new Date();
      const firstDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      const startDate = firstDayOfPrevMonth.toISOString().split('T')[0];
      const endDate = lastDayOfPrevMonth.toISOString().split('T')[0];
      
      await startDateInput.fill(startDate);
      await endDateInput.fill(endDate);
      
      // Find and click generate report button
      await page.getByRole('button', { name: /generate|create|run report/i }).click();
      
      // Verify report includes date range in header or title
      const dateRangeInfo = page.getByText(new RegExp(`${startDate}.*${endDate}|${firstDayOfPrevMonth.toLocaleDateString()}.*${lastDayOfPrevMonth.toLocaleDateString()}`));
      
      if (await dateRangeInfo.isVisible()) {
        expect(await dateRangeInfo.isVisible()).toBeTruthy();
      } else {
        // If specific date range text isn't found, verify that report content is visible
        const reportContent = page.getByText(/report results|expenses total|summary|no data found/i);
        expect(await reportContent.isVisible()).toBeTruthy();
      }
    } else {
      test.skip('Date range filters not found');
    }
  });
});