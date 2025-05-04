// Example Netlify function to generate Excel reports
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
    const { tripId, templateUrl } = JSON.parse(event.body);
    
    if (!tripId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Trip ID is required' }),
      };
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get trip data
    const { data: tripData, error: tripError } = await supabase
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
    
    // Get expenses for the trip
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId);
    
    if (expensesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch expenses' }),
      };
    }
    
    // Get mileage records for the trip
    const { data: mileageRecords, error: mileageError } = await supabase
      .from('mileage_records')
      .select('*')
      .eq('trip_id', tripId);
    
    if (mileageError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch mileage records' }),
      };
    }
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // If a template URL is provided, try to use it as a base
    if (templateUrl) {
      try {
        const response = await fetch(templateUrl);
        const templateBuffer = await response.arrayBuffer();
        await workbook.xlsx.load(templateBuffer);
      } catch (error) {
        console.error('Failed to load template:', error);
        // Continue with a new workbook if template loading fails
        workbook.addWorksheet('Trip Summary');
        workbook.addWorksheet('Expenses');
        workbook.addWorksheet('Mileage');
      }
    } else {
      // Create default worksheets
      workbook.addWorksheet('Trip Summary');
      workbook.addWorksheet('Expenses');
      workbook.addWorksheet('Mileage');
    }
    
    // Get worksheets
    const summarySheet = workbook.getWorksheet('Trip Summary') || workbook.addWorksheet('Trip Summary');
    const expensesSheet = workbook.getWorksheet('Expenses') || workbook.addWorksheet('Expenses');
    const mileageSheet = workbook.getWorksheet('Mileage') || workbook.addWorksheet('Mileage');
    
    // Fill summary sheet
    summarySheet.columns = [
      { header: 'Trip Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Location', key: 'location', width: 30 },
    ];
    
    summarySheet.addRow({
      name: tripData.name,
      description: tripData.description || '',
      status: tripData.status,
      startDate: tripData.start_date || '',
      endDate: tripData.end_date || '',
      location: tripData.location || '',
    });
    
    // Add expense totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Expenses', '', '', '', '', `$${totalExpenses.toFixed(2)}`]);
    
    // Add mileage totals
    const totalMileage = mileageRecords.reduce((sum, record) => sum + parseFloat(record.distance), 0);
    summarySheet.addRow(['Total Mileage', '', '', '', '', `${totalMileage.toFixed(1)} miles`]);
    
    // Fill expenses sheet
    expensesSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Location', key: 'location', width: 25 },
    ];
    
    expenses.forEach(expense => {
      expensesSheet.addRow({
        date: expense.date,
        type: expense.expense_type,
        vendor: expense.vendor || '',
        description: expense.description || '',
        amount: parseFloat(expense.amount),
        currency: expense.currency,
        location: expense.location || '',
      });
    });
    
    // Format amounts as currency
    expensesSheet.getColumn('amount').numFmt = '$#,##0.00';
    
    // Fill mileage sheet
    mileageSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Start Odometer', key: 'startOdometer', width: 15 },
      { header: 'End Odometer', key: 'endOdometer', width: 15 },
      { header: 'Distance', key: 'distance', width: 15 },
      { header: 'Purpose', key: 'purpose', width: 40 },
    ];
    
    mileageRecords.forEach(record => {
      mileageSheet.addRow({
        date: record.date,
        startOdometer: parseFloat(record.start_odometer),
        endOdometer: parseFloat(record.end_odometer),
        distance: parseFloat(record.distance),
        purpose: record.purpose || '',
      });
    });
    
    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Return the Excel file
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Trip-${tripData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-Report.xlsx"`,
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate Excel report' }),
    };
  }
};