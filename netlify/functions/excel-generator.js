// Netlify function to generate Excel reports
const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const { tripId, startDate, endDate, templateUrl } = JSON.parse(event.body);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let tripData = null;
    let expenses = [];
    let mileageRecords = [];
    let reportTitle = 'Expense Report';
    let filename = 'expense-report';
    
    // If tripId is provided, fetch trip-specific data
    if (tripId) {
      // Get trip data
      const { data: tripResult, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (tripError) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Trip not found' }),
        };
      }
      
      tripData = tripResult;
      reportTitle = `Expense Report: ${tripData.name}`;
      filename = `Trip-${tripData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-Report`;
      
      // Get expenses for the trip
      const { data: expensesResult, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId);
      
      if (expensesError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch expenses' }),
        };
      }
      
      expenses = expensesResult;
      
      // Get mileage records for the trip
      const { data: mileageResult, error: mileageError } = await supabase
        .from('mileage_records')
        .select('*')
        .eq('trip_id', tripId);
      
      if (mileageError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch mileage records' }),
        };
      }
      
      mileageRecords = mileageResult;
    }
    // Otherwise, use date range filtering if provided
    else if (startDate || endDate) {
      let expensesQuery = supabase.from('expenses').select('*');
      let mileageQuery = supabase.from('mileage_records').select('*');
      
      // Apply date filters if specified
      if (startDate) {
        expensesQuery = expensesQuery.gte('date', startDate);
        mileageQuery = mileageQuery.gte('date', startDate);
      }
      
      if (endDate) {
        expensesQuery = expensesQuery.lte('date', endDate);
        mileageQuery = mileageQuery.lte('date', endDate);
      }
      
      // Fetch expenses and mileage with date filters
      const [expensesResponse, mileageResponse] = await Promise.all([
        expensesQuery,
        mileageQuery
      ]);
      
      if (expensesResponse.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch expenses' }),
        };
      }
      
      if (mileageResponse.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch mileage records' }),
        };
      }
      
      expenses = expensesResponse.data;
      mileageRecords = mileageResponse.data;
      
      // Create title and filename based on date range
      let dateRangeText = '';
      if (startDate && endDate) {
        dateRangeText = `${startDate} to ${endDate}`;
      } else if (startDate) {
        dateRangeText = `From ${startDate}`;
      } else if (endDate) {
        dateRangeText = `Until ${endDate}`;
      }
      
      reportTitle = `Expense Report: ${dateRangeText}`;
      filename = `Expenses-${dateRangeText.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    }
    // Fetch all expenses and mileage if no filters provided
    else {
      const [expensesResponse, mileageResponse] = await Promise.all([
        supabase.from('expenses').select('*'),
        supabase.from('mileage_records').select('*')
      ]);
      
      if (expensesResponse.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch expenses' }),
        };
      }
      
      if (mileageResponse.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch mileage records' }),
        };
      }
      
      expenses = expensesResponse.data;
      mileageRecords = mileageResponse.data;
      reportTitle = 'All Expenses';
      filename = 'All-Expenses-Report';
    }
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker';
    workbook.lastModifiedBy = 'Expense Tracker';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // If a template URL is provided, try to use it as a base
    if (templateUrl) {
      try {
        console.log('Loading Excel template from URL:', templateUrl);
        
        // Fetch the template from Supabase if it's a storage URL
        if (templateUrl.includes('supabase') || templateUrl.includes('storage')) {
          // Extract the file path from the URL
          const storageUrl = new URL(templateUrl);
          const pathParts = storageUrl.pathname.split('/');
          const bucket = pathParts[pathParts.indexOf('object') + 1] || 'templates';
          const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');
          
          console.log('Downloading template from Supabase storage:', bucket, filePath);
          
          // Download the template file from Supabase storage
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(filePath);
          
          if (error) {
            throw new Error(`Failed to download template: ${error.message}`);
          }
          
          if (!data) {
            throw new Error('Template file not found');
          }
          
          // Load the template
          const templateBuffer = await data.arrayBuffer();
          await workbook.xlsx.load(templateBuffer);
          console.log('Successfully loaded template from Supabase storage');
        } else {
          // Regular fetch for other URLs
          const response = await fetch(templateUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.statusText}`);
          }
          
          const templateBuffer = await response.arrayBuffer();
          await workbook.xlsx.load(templateBuffer);
          console.log('Successfully loaded template from URL');
        }
      } catch (error) {
        console.error('Failed to load template:', error);
        // Continue with a new workbook if template loading fails
        workbook.addWorksheet('Summary');
        workbook.addWorksheet('Expenses');
        workbook.addWorksheet('Mileage');
      }
    } else {
      // Create default worksheets
      workbook.addWorksheet('Summary');
      workbook.addWorksheet('Expenses');
      workbook.addWorksheet('Mileage');
    }
    
    // Get worksheets (or create them if they don't exist)
    let summarySheet = workbook.getWorksheet('Summary') || workbook.getWorksheet('Trip Summary');
    let expensesSheet = workbook.getWorksheet('Expenses');
    let mileageSheet = workbook.getWorksheet('Mileage');
    
    // If using a template but sheets don't exist, create them
    if (!summarySheet) {
      console.log('Creating Summary worksheet');
      summarySheet = workbook.addWorksheet('Summary');
    }
    
    if (!expensesSheet) {
      console.log('Creating Expenses worksheet');
      expensesSheet = workbook.addWorksheet('Expenses');
    }
    
    if (!mileageSheet) {
      console.log('Creating Mileage worksheet');
      mileageSheet = workbook.addWorksheet('Mileage');
    }
    
    // Clear sheets carefully - only remove content, not the sheet itself
    // Check if sheets have content before clearing
    if (summarySheet.rowCount > 0) {
      console.log(`Clearing Summary sheet with ${summarySheet.rowCount} rows`);
      summarySheet.spliceRows(1, summarySheet.rowCount);
    }
    
    if (expensesSheet.rowCount > 0) {
      console.log(`Clearing Expenses sheet with ${expensesSheet.rowCount} rows`);
      expensesSheet.spliceRows(1, expensesSheet.rowCount);
    }
    
    if (mileageSheet.rowCount > 0) {
      console.log(`Clearing Mileage sheet with ${mileageSheet.rowCount} rows`);
      mileageSheet.spliceRows(1, mileageSheet.rowCount);
    }
    
    // Setup Summary sheet
    console.log('Setting up Summary sheet columns');
    summarySheet.columns = [
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Value', key: 'value', width: 30 },
    ];
    
    // Add report title - double check we're adding rows correctly
    console.log('Adding data to Summary sheet');
    const titleRow = summarySheet.addRow({ description: 'Report', value: reportTitle });
    const dateRow = summarySheet.addRow({ description: 'Generated Date', value: new Date().toISOString().split('T')[0] });
    
    // Verify rows were added
    console.log(`Added row count: ${summarySheet.rowCount}`);
    console.log(`Row 1 data: ${JSON.stringify(summarySheet.getRow(1).values)}`);
    console.log(`Row 2 data: ${JSON.stringify(summarySheet.getRow(2).values)}`);
    
    // Add trip details if available
    if (tripData) {
      summarySheet.addRow({ description: 'Trip Name', value: tripData.name });
      if (tripData.description) {
        summarySheet.addRow({ description: 'Trip Description', value: tripData.description });
      }
      if (tripData.status) {
        summarySheet.addRow({ description: 'Trip Status', value: tripData.status });
      }
      if (tripData.start_date) {
        summarySheet.addRow({ description: 'Trip Start Date', value: tripData.start_date });
      }
      if (tripData.end_date) {
        summarySheet.addRow({ description: 'Trip End Date', value: tripData.end_date });
      }
      if (tripData.location) {
        summarySheet.addRow({ description: 'Trip Location', value: tripData.location });
      }
    } else {
      // Add date range details
      if (startDate) {
        summarySheet.addRow({ description: 'Start Date', value: startDate });
      }
      if (endDate) {
        summarySheet.addRow({ description: 'End Date', value: endDate });
      }
    }
    
    summarySheet.addRow({}); // Empty row for spacing
    
    // Add expense totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    summarySheet.addRow({ description: 'Total Expense Count', value: expenses.length });
    summarySheet.addRow({ description: 'Total Expenses', value: totalExpenses.toFixed(2) });
    
    // Add mileage totals
    const totalMileage = mileageRecords.reduce((sum, record) => sum + parseFloat(record.distance), 0);
    summarySheet.addRow({ description: 'Total Mileage Count', value: mileageRecords.length });
    summarySheet.addRow({ description: 'Total Distance', value: `${totalMileage.toFixed(1)} miles` });
    
    // Calculate mileage cost (assuming rate of $0.58 per mile)
    const mileageRate = 0.58; // Default rate
    const mileageCost = totalMileage * mileageRate;
    summarySheet.addRow({ description: 'Mileage Rate', value: `$${mileageRate.toFixed(2)}/mile` });
    summarySheet.addRow({ description: 'Mileage Cost', value: mileageCost.toFixed(2) });
    
    // Add grand total
    summarySheet.addRow({}); // Empty row for spacing
    summarySheet.addRow({ description: 'GRAND TOTAL', value: (totalExpenses + mileageCost).toFixed(2) });
    
    // Format the summary amounts as currency
    for (let i = 8; i <= 13; i++) {
      if (i !== 9 && i !== 10) { // Skip non-currency cells
        const cell = summarySheet.getCell(`B${i}`);
        cell.numFmt = '$#,##0.00';
      }
    }
    
    // Style header row
    const headerRow = summarySheet.getRow(1);
    headerRow.font = { bold: true };
    
    // Style the total row
    const totalRow = summarySheet.getRow(13);
    totalRow.font = { bold: true };
    
    // Fill expenses sheet
    console.log('Setting up Expenses sheet columns');
    expensesSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Trip', key: 'tripName', width: 25 },
    ];
    
    // Add header row explicitly to ensure it's present
    console.log('Adding header row to Expenses sheet');
    expensesSheet.addRow(['Date', 'Type', 'Vendor', 'Description', 'Amount', 'Currency', 'Location', 'Trip']);
    
    // If we're not filtering by trip, also fetch trip names for each expense
    let expenseTrips = {};
    if (!tripId && expenses.length > 0) {
      const tripIds = [...new Set(expenses.map(e => e.trip_id))];
      const { data: tripsData } = await supabase
        .from('trips')
        .select('id, name')
        .in('id', tripIds);
      
      if (tripsData) {
        expenseTrips = tripsData.reduce((acc, trip) => {
          acc[trip.id] = trip.name;
          return acc;
        }, {});
      }
    }
    
    // Add expenses to the sheet
    console.log(`Adding ${expenses.length} expenses to the Expenses sheet`);
    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];
      try {
        // Create a safe row object with well-defined values
        const rowData = {
          date: expense.date || new Date().toISOString().split('T')[0],
          type: expense.expense_type || 'other',
          vendor: expense.vendor || '',
          description: expense.description || '',
          amount: expense.amount ? parseFloat(expense.amount) : 0,
          currency: expense.currency || 'USD',
          location: expense.location || '',
          tripName: tripId ? tripData.name : (expenseTrips[expense.trip_id] || ''),
        };
        
        // Add row and log
        const addedRow = expensesSheet.addRow(rowData);
        console.log(`Added expense ${i+1}/${expenses.length}`);
      } catch (err) {
        console.error(`Error adding expense row ${i+1}:`, err);
      }
    }
    
    // Format amounts as currency
    expensesSheet.getColumn('amount').numFmt = '$#,##0.00';
    
    // Style expenses header row
    const expensesHeaderRow = expensesSheet.getRow(1);
    expensesHeaderRow.font = { bold: true };
    
    // Fill mileage sheet
    console.log('Setting up Mileage sheet columns');
    mileageSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Start Odometer', key: 'startOdometer', width: 15 },
      { header: 'End Odometer', key: 'endOdometer', width: 15 },
      { header: 'Distance (miles)', key: 'distance', width: 15 },
      { header: 'Purpose', key: 'purpose', width: 40 },
      { header: 'Cost', key: 'cost', width: 15 },
      { header: 'Trip', key: 'tripName', width: 25 },
    ];
    
    // Add header row explicitly to ensure it's present
    console.log('Adding header row to Mileage sheet');
    mileageSheet.addRow(['Date', 'Start Odometer', 'End Odometer', 'Distance (miles)', 'Purpose', 'Cost', 'Trip']);
    
    // If we're not filtering by trip, also fetch trip names for each mileage record
    let mileageTrips = {};
    if (!tripId && mileageRecords.length > 0) {
      const tripIds = [...new Set(mileageRecords.map(m => m.trip_id))];
      const { data: tripsData } = await supabase
        .from('trips')
        .select('id, name')
        .in('id', tripIds);
      
      if (tripsData) {
        mileageTrips = tripsData.reduce((acc, trip) => {
          acc[trip.id] = trip.name;
          return acc;
        }, {});
      }
    }
    
    // Add mileage records to the sheet
    console.log(`Adding ${mileageRecords.length} mileage records to the Mileage sheet`);
    for (let i = 0; i < mileageRecords.length; i++) {
      const record = mileageRecords[i];
      try {
        // Parse values safely, defaulting to 0 if NaN
        const startOdometer = record.start_odometer ? parseFloat(record.start_odometer) : 0;
        const endOdometer = record.end_odometer ? parseFloat(record.end_odometer) : 0;
        const distance = record.distance ? parseFloat(record.distance) : (endOdometer - startOdometer);
        const cost = distance * mileageRate;
        
        // Create a safe row object with well-defined values
        const rowData = {
          date: record.date || new Date().toISOString().split('T')[0],
          startOdometer: startOdometer,
          endOdometer: endOdometer,
          distance: distance,
          purpose: record.purpose || '',
          cost: cost,
          tripName: tripId ? tripData.name : (mileageTrips[record.trip_id] || ''),
        };
        
        // Add row and log
        const addedRow = mileageSheet.addRow(rowData);
        console.log(`Added mileage record ${i+1}/${mileageRecords.length}`);
      } catch (err) {
        console.error(`Error adding mileage row ${i+1}:`, err);
      }
    }
    
    // Format mileage cost as currency
    mileageSheet.getColumn('cost').numFmt = '$#,##0.00';
    
    // Style mileage header row
    const mileageHeaderRow = mileageSheet.getRow(1);
    mileageHeaderRow.font = { bold: true };
    
    // Generate Excel buffer
    console.log('Generating Excel buffer...');
    try {
      // Check if sheets have data
      console.log(`Sheets summary: Summary (${summarySheet.rowCount} rows), Expenses (${expensesSheet.rowCount} rows), Mileage (${mileageSheet.rowCount} rows)`);
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      console.log(`Generated Excel buffer of size: ${buffer.byteLength} bytes`);
      
      if (!buffer || buffer.byteLength === 0) {
        throw new Error('Generated Excel buffer is empty');
      }
      
      // Return the Excel file
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (err) {
      console.error('Error generating Excel buffer:', err);
      throw new Error(`Failed to generate Excel file: ${err.message}`);
    }
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate Excel report' }),
    };
  }
};