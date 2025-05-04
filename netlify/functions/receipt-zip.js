// Example Netlify function to create a ZIP file of receipts
const JSZip = require('jszip');
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
    const { tripId } = JSON.parse(event.body);
    
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
    
    // Get expenses with receipts for the trip
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .not('receipt_url', 'is', null);
    
    if (expensesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch expenses' }),
      };
    }
    
    if (expenses.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No receipts found for this trip' }),
      };
    }
    
    // Create a new ZIP file
    const zip = new JSZip();
    
    // Add a README file
    zip.file('README.txt', `Receipts for Trip: ${tripData.name}
Date: ${new Date().toISOString().split('T')[0]}
Total Receipts: ${expenses.length}

This ZIP file contains all receipts for the trip.
Each receipt is named with its date and vendor information.`);
    
    // Download and add each receipt to the ZIP
    const fetchPromises = expenses.map(async (expense) => {
      try {
        // Extract the file path from the receipt URL
        const receiptUrl = expense.receipt_url;
        const receiptPath = receiptUrl.split('/').pop();
        
        // Download the receipt file
        const { data, error } = await supabase.storage
          .from('receipts')
          .download(`expenses/${tripId}/${receiptPath}`);
        
        if (error) {
          console.error(`Failed to download receipt: ${receiptPath}`, error);
          return null;
        }
        
        // Generate a filename with date and vendor
        const dateStr = expense.date.replace(/-/g, '');
        const vendor = expense.vendor ? expense.vendor.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'unknown-vendor';
        const amount = expense.amount.toFixed(2).replace('.', '-');
        const filename = `${dateStr}_${vendor}_${amount}.${receiptPath.split('.').pop()}`;
        
        // Add the receipt to the ZIP
        const arrayBuffer = await data.arrayBuffer();
        zip.file(filename, arrayBuffer);
        
        return filename;
      } catch (error) {
        console.error(`Error processing receipt for expense ${expense.id}:`, error);
        return null;
      }
    });
    
    // Wait for all receipts to be processed
    await Promise.all(fetchPromises);
    
    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Return the ZIP file
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Trip-${tripData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-Receipts.zip"`,
      },
      body: zipBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error generating ZIP file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate receipts ZIP file' }),
    };
  }
};