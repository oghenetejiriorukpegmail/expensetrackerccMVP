// Netlify function to generate Excel reports with AI-powered template analysis
const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY || "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";

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
    
    // Helper function to process variables in templates using regex pattern matching
    const processVariables = (text, variables) => {
      if (!text || typeof text !== 'string') return text;
      
      // Check if there are variables to process (using mustache-like syntax {{variable}})
      if (!text.includes('{{')) return text;
      
      // Replace variables with their values
      return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
        const trimmedVar = variable.trim();
        // Return the variable value or keep the original syntax if variable not found
        return variables[trimmedVar] !== undefined ? variables[trimmedVar] : match;
      });
    };
    
    // Process an entire worksheet, looking for variables to substitute
    const processWorksheet = (worksheet, variables) => {
      console.log(`Processing variables in worksheet: ${worksheet.name}`);
      
      // Iterate through all cells in the worksheet
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (cell.type === ExcelJS.ValueType.String && cell.text) {
            const originalValue = cell.text;
            const processedValue = processVariables(originalValue, variables);
            
            // Only update if something changed
            if (originalValue !== processedValue) {
              console.log(`Replacing variable in ${worksheet.name} [${rowNumber},${colNumber}]: "${originalValue}" → "${processedValue}"`);
              cell.value = processedValue;
            }
          }
        });
      });
    };
    
    // Create a new Excel workbook
    let workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker';
    workbook.lastModifiedBy = 'Expense Tracker';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Use a completely different approach for templates
    let isUsingTemplate = false;
    let templateAnalysis = null;
    let templateSchema = null;
    
    // If a template URL is provided, try to use it as a base
    if (templateUrl) {
      try {
        console.log('Loading Excel template from URL:', templateUrl);
        
        let templateBuffer;
        
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
          
          // Get the buffer
          templateBuffer = await data.arrayBuffer();
          console.log('Successfully downloaded template from Supabase storage');
        } else {
          // Regular fetch for other URLs
          const response = await fetch(templateUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.statusText}`);
          }
          
          templateBuffer = await response.arrayBuffer();
          console.log('Successfully downloaded template from URL');
        }
        
        // Load a fresh workbook from the template instead of using the existing one
        if (templateBuffer && templateBuffer.byteLength > 0) {
          // Create a new workbook from the template
          console.log('Creating new workbook from template buffer');
          workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(templateBuffer);
          
          // Set metadata
          workbook.creator = 'Expense Tracker';
          workbook.lastModifiedBy = 'Expense Tracker';
          workbook.created = new Date();
          workbook.modified = new Date();
          
          console.log(`Template loaded with ${workbook.worksheets.length} worksheets`);
          workbook.worksheets.forEach((sheet, i) => {
            console.log(`  Sheet ${i+1}: ${sheet.name} (${sheet.rowCount} rows)`);
          });
          
          isUsingTemplate = true;
          
          // Analyze the template to extract variables and structure
          templateAnalysis = await analyzeTemplate(workbook);
          
          if (templateAnalysis) {
            console.log('Template analysis complete:', 
              `${templateAnalysis.variables.length} variables found,`,
              `${templateAnalysis.worksheets.length} worksheets analyzed`);
          }
        } else {
          throw new Error('Template buffer is empty');
        }
      } catch (error) {
        console.error('Failed to load template:', error);
        console.log('Falling back to default workbook');
        
        // Continue with a new workbook if template loading fails
        workbook = new ExcelJS.Workbook();
        workbook.creator = 'Expense Tracker';
        workbook.lastModifiedBy = 'Expense Tracker';
        workbook.created = new Date();
        workbook.modified = new Date();
        
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
    
    // Initialize worksheet variables
    let summarySheet = null;
    let expensesSheet = null;
    let mileageSheet = null;

    // Build variable data for template processing
    const buildTemplateVariables = async () => {
      console.log('Building template variables for substitution');
      
      // Get today's date in various formats
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const dateFormatted = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Format functions for currency and numbers
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };
      
      const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 2
        }).format(num);
      };
      
      // Calculate totals
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const totalMileage = mileageRecords.reduce((sum, record) => sum + parseFloat(record.distance), 0);
      const mileageRate = 0.58; // Default rate, could be fetched from user settings
      const mileageCost = totalMileage * mileageRate;
      const grandTotal = totalExpenses + mileageCost;
      
      // Count expense types
      const expenseTypeCount = {};
      expenses.forEach(expense => {
        const type = expense.expense_type || 'other';
        expenseTypeCount[type] = (expenseTypeCount[type] || 0) + 1;
      });
      
      // Calculate expense type totals
      const expenseTypeAmount = {};
      expenses.forEach(expense => {
        const type = expense.expense_type || 'other';
        expenseTypeAmount[type] = (expenseTypeAmount[type] || 0) + parseFloat(expense.amount);
      });
      
      // Create expense descriptions
      const expenseDescriptions = expenses.map(expense => {
        return {
          id: expense.id,
          description: expense.description || `Expense at ${expense.vendor || 'unknown vendor'}`,
          vendor: expense.vendor || '',
          amount: formatCurrency(expense.amount),
          type: expense.expense_type || 'other',
          date: expense.date || ''
        };
      });
      
      // Build base variables object
      const variables = {
        // Date information
        'date': dateStr,
        'date.formatted': dateFormatted,
        'date.year': now.getFullYear().toString(),
        'date.month': (now.getMonth() + 1).toString(),
        'date.day': now.getDate().toString(),
        
        // Report information
        'report.title': reportTitle,
        'report.filename': filename,
        
        // Trip information (if applicable)
        'trip.name': tripData?.name || 'All Expenses',
        'trip.description': tripData?.description || '',
        'trip.location': tripData?.location || '',
        'trip.status': tripData?.status || '',
        'trip.start_date': tripData?.start_date || '',
        'trip.end_date': tripData?.end_date || '',
        
        // Counts and totals
        'expenses.count': expenses.length.toString(),
        'expenses.total': formatNumber(totalExpenses),
        'expenses.total.currency': formatCurrency(totalExpenses),
        
        'mileage.count': mileageRecords.length.toString(),
        'mileage.total.distance': formatNumber(totalMileage),
        'mileage.total.cost': formatCurrency(mileageCost),
        'mileage.rate': mileageRate.toString(),
        
        'grand_total': formatNumber(grandTotal),
        'grand_total.currency': formatCurrency(grandTotal),
        
        // For each expense type
        'expenses.accommodation.count': (expenseTypeCount['accommodation'] || 0).toString(),
        'expenses.transportation.count': (expenseTypeCount['transportation'] || 0).toString(),
        'expenses.meals.count': (expenseTypeCount['meals'] || 0).toString(),
        'expenses.entertainment.count': (expenseTypeCount['entertainment'] || 0).toString(),
        'expenses.business.count': (expenseTypeCount['business'] || 0).toString(),
        'expenses.office.count': (expenseTypeCount['office'] || 0).toString(),
        'expenses.other.count': (expenseTypeCount['other'] || 0).toString(),
        
        'expenses.accommodation.total': formatCurrency(expenseTypeAmount['accommodation'] || 0),
        'expenses.transportation.total': formatCurrency(expenseTypeAmount['transportation'] || 0),
        'expenses.meals.total': formatCurrency(expenseTypeAmount['meals'] || 0),
        'expenses.entertainment.total': formatCurrency(expenseTypeAmount['entertainment'] || 0),
        'expenses.business.total': formatCurrency(expenseTypeAmount['business'] || 0),
        'expenses.office.total': formatCurrency(expenseTypeAmount['office'] || 0),
        'expenses.other.total': formatCurrency(expenseTypeAmount['other'] || 0),
        
        // Description variables
        'expenses.descriptions': expenseDescriptions.map(ed => ed.description).join('; '),
      };
      
      // Add individual expense descriptions with index
      expenseDescriptions.forEach((ed, index) => {
        variables[`expense.${index+1}.description`] = ed.description;
        variables[`expense.${index+1}.vendor`] = ed.vendor;
        variables[`expense.${index+1}.amount`] = ed.amount;
        variables[`expense.${index+1}.type`] = ed.type;
        variables[`expense.${index+1}.date`] = ed.date;
      });
      
      // For templates, potentially generate template-specific variables based on analysis
      if (isUsingTemplate && templateAnalysis && templateAnalysis.variables.length > 0) {
        // Generate a schema for the template if we haven't already
        if (!templateSchema) {
          templateSchema = await generateSchemaFromAnalysis(templateAnalysis);
          console.log('Generated schema from template analysis');
        }
        
        // Only attempt to generate dynamic content if we have a schema with dynamic content fields
        if (templateSchema && templateSchema.dynamicContent && templateSchema.dynamicContent.length > 0) {
          try {
            // Generate dynamic content based on the template schema
            const dynamicContent = await generateDynamicContent(
              templateSchema,
              expenses,
              mileageRecords,
              tripData,
              variables
            );
            
            // Merge dynamic content into the variables
            Object.assign(variables, dynamicContent);
            console.log('Added AI-generated dynamic content to template variables');
          } catch (error) {
            console.error('Error generating dynamic content:', error);
            // Continue with the variables we have - will use fallbacks
          }
        }
      } else {
        // Add any dynamic content via LLM integration for variables with llm. prefix
        // This will be processed via OpenRouter API with Qwen 3 model
        try {
          // Use OpenRouter API to generate report summaries
          const dynamicContent = await generateDynamicContent({
            dynamicContent: [
              'llm.report.summary',
              'llm.categories.analysis',
              'llm.description.summary'
            ]
          }, expenses, mileageRecords, tripData, variables);
          
          // Merge dynamic content into variables
          Object.assign(variables, dynamicContent);
        } catch (error) {
          console.error('Error generating LLM content:', error);
          
          // Provide fallback values
          // Trip summary fallback
          const tripSummaryFallback = tripData 
            ? `This report covers expenses for trip "${tripData.name}" with a total of ${expenses.length} expenses amounting to ${formatCurrency(totalExpenses)}.`
            : `This report covers all expenses with a total of ${expenses.length} entries amounting to ${formatCurrency(totalExpenses)}.`;
          
          // Category analysis fallback
          const topCategory = Object.entries(expenseTypeAmount)
            .sort(([, a], [, b]) => b - a)[0] || ['other', 0];
          
          const categoryAnalysisFallback = `The largest expense category is ${topCategory[0]} at ${formatCurrency(topCategory[1])}, representing ${Math.round((topCategory[1] / totalExpenses) * 100)}% of total expenses.`;
          
          // Set fallback values
          variables['llm.report.summary'] = tripSummaryFallback;
          variables['llm.categories.analysis'] = categoryAnalysisFallback;
          variables['llm.trip.summary'] = tripSummaryFallback;
          variables['llm.expenses.summary'] = tripSummaryFallback;
          
          // Description summary fallback
          const descriptionSummaryFallback = `Summary of ${expenses.length} expenses including ${expenseDescriptions.slice(0, 3).map(ed => ed.description).join(', ')}${expenseDescriptions.length > 3 ? '...' : ''}.`;
          variables['llm.description.summary'] = descriptionSummaryFallback;
        }
      }
      
      console.log('Generated template variables:', Object.keys(variables).length);
      return variables;
    };
    
    // Special handling for templates
    if (isUsingTemplate) {
        console.log('Using template workbook, finding worksheets to use');
        
        // Process template variables first - need to do this before clearing content
        // This allows for preserving variables in header rows
        const templateVariables = await buildTemplateVariables();
        
        // Process all worksheets for variable substitution
        console.log('Processing variable substitution in all worksheets');
        workbook.worksheets.forEach(sheet => {
            processWorksheet(sheet, templateVariables);
        });
        
        // Find the most appropriate sheets to use in the template
        // For a template, we want to be more flexible and use whatever sheets are there
        const worksheets = workbook.worksheets;
        console.log(`Template has ${worksheets.length} worksheets`);
        
        // First, try to find exact matches
        summarySheet = workbook.getWorksheet('Summary') || workbook.getWorksheet('Trip Summary');
        expensesSheet = workbook.getWorksheet('Expenses');
        mileageSheet = workbook.getWorksheet('Mileage');
        
        // If not found, try to find containing these names
        if (!summarySheet) {
            for (const sheet of worksheets) {
                if (sheet.name.toLowerCase().includes('summary') || 
                    sheet.name.toLowerCase().includes('overview') ||
                    sheet.name.toLowerCase().includes('report')) {
                    summarySheet = sheet;
                    console.log(`Found summary sheet: ${sheet.name}`);
                    break;
                }
            }
        }
        
        if (!expensesSheet) {
            for (const sheet of worksheets) {
                if (sheet.name.toLowerCase().includes('expense') || 
                    sheet.name.toLowerCase().includes('cost') ||
                    sheet.name.toLowerCase().includes('spend')) {
                    expensesSheet = sheet;
                    console.log(`Found expenses sheet: ${sheet.name}`);
                    break;
                }
            }
        }
        
        if (!mileageSheet) {
            for (const sheet of worksheets) {
                if (sheet.name.toLowerCase().includes('mile') || 
                    sheet.name.toLowerCase().includes('travel') ||
                    sheet.name.toLowerCase().includes('trip')) {
                    mileageSheet = sheet;
                    console.log(`Found mileage sheet: ${sheet.name}`);
                    break;
                }
            }
        }
        
        // If we still don't have our required sheets, use what we have or create new ones
        if (!summarySheet && worksheets.length > 0) {
            summarySheet = worksheets[0]; // Use the first sheet
            console.log(`Using first sheet for summary: ${summarySheet.name}`);
        } else if (!summarySheet) {
            summarySheet = workbook.addWorksheet('Summary');
            console.log('Created new Summary sheet');
        }
        
        if (!expensesSheet && worksheets.length > 1) {
            expensesSheet = worksheets[1]; // Use the second sheet
            console.log(`Using second sheet for expenses: ${expensesSheet.name}`);
        } else if (!expensesSheet) {
            expensesSheet = workbook.addWorksheet('Expenses');
            console.log('Created new Expenses sheet');
        }
        
        if (!mileageSheet && worksheets.length > 2) {
            mileageSheet = worksheets[2]; // Use the third sheet
            console.log(`Using third sheet for mileage: ${mileageSheet.name}`);
        } else if (!mileageSheet) {
            mileageSheet = workbook.addWorksheet('Mileage');
            console.log('Created new Mileage sheet');
        }
        
        // Now clear the content but preserve any custom formatting
        if (summarySheet.rowCount > 0) {
            // Keep the first row (headers) if it exists and looks like headers
            const firstRowValues = summarySheet.getRow(1).values;
            const hasHeaders = firstRowValues && firstRowValues.length > 1;
            
            if (hasHeaders) {
                console.log(`Preserving header in ${summarySheet.name} and clearing ${summarySheet.rowCount-1} data rows`);
                if (summarySheet.rowCount > 1) {
                    summarySheet.spliceRows(2, summarySheet.rowCount - 1);
                }
            } else {
                console.log(`Clearing all ${summarySheet.rowCount} rows in ${summarySheet.name}`);
                summarySheet.spliceRows(1, summarySheet.rowCount);
            }
        }
        
        if (expensesSheet.rowCount > 0) {
            // Keep the first row (headers) if it exists and looks like headers
            const firstRowValues = expensesSheet.getRow(1).values;
            const hasHeaders = firstRowValues && firstRowValues.length > 1;
            
            if (hasHeaders) {
                console.log(`Preserving header in ${expensesSheet.name} and clearing ${expensesSheet.rowCount-1} data rows`);
                if (expensesSheet.rowCount > 1) {
                    expensesSheet.spliceRows(2, expensesSheet.rowCount - 1);
                }
            } else {
                console.log(`Clearing all ${expensesSheet.rowCount} rows in ${expensesSheet.name}`);
                expensesSheet.spliceRows(1, expensesSheet.rowCount);
            }
        }
        
        if (mileageSheet.rowCount > 0) {
            // Keep the first row (headers) if it exists and looks like headers
            const firstRowValues = mileageSheet.getRow(1).values;
            const hasHeaders = firstRowValues && firstRowValues.length > 1;
            
            if (hasHeaders) {
                console.log(`Preserving header in ${mileageSheet.name} and clearing ${mileageSheet.rowCount-1} data rows`);
                if (mileageSheet.rowCount > 1) {
                    mileageSheet.spliceRows(2, mileageSheet.rowCount - 1);
                }
            } else {
                console.log(`Clearing all ${mileageSheet.rowCount} rows in ${mileageSheet.name}`);
                mileageSheet.spliceRows(1, mileageSheet.rowCount);
            }
        }
    } else {
        // Regular approach for non-templates
        console.log('Using standard workbook, setting up worksheets');
        
        // Get worksheets (or create them if they don't exist)
        summarySheet = workbook.getWorksheet('Summary') || workbook.getWorksheet('Trip Summary');
        expensesSheet = workbook.getWorksheet('Expenses');
        mileageSheet = workbook.getWorksheet('Mileage');
        
        // If sheets don't exist, create them
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
        
        // Clear sheets
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
    }
    
    // For non-template or when we need to add standard content to template
    if (!isUsingTemplate || (isUsingTemplate && (!templateAnalysis || templateAnalysis.variables.length === 0))) {
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
    }

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
    
    // Add expenses to the sheet if it's not a template or if we need to populate a table
    if (!isUsingTemplate || (isUsingTemplate && (!templateAnalysis || templateAnalysis.hasExpenseTable))) {
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
    }
    
    // Fill mileage sheet if needed
    if (!isUsingTemplate || (isUsingTemplate && (!templateAnalysis || templateAnalysis.hasMileageTable))) {
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
    }
    
    // For templates, do a final pass to replace any variables that might have been missed
    if (isUsingTemplate) {
      // Build variables again to ensure all are available
      const templateVariables = await buildTemplateVariables();
      
      // Process all worksheets for variable substitution
      workbook.worksheets.forEach(sheet => {
          processWorksheet(sheet, templateVariables);
      });
    }
    
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

/**
 * Analyzes an Excel workbook to extract variables and structure
 * @param {ExcelJS.Workbook} workbook The Excel workbook to analyze
 * @returns {Object} Analysis of the template structure and variables
 */
async function analyzeTemplate(workbook) {
  const analysis = {
    worksheets: [],
    variables: [],
    sections: [],
    detectedDataTypes: {},
    hasHeaderRow: false,
    hasSummarySection: false,
    hasExpenseTable: false,
    hasMileageTable: false,
    complexity: 'simple', // simple, moderate, complex
  };
  
  // Regular expression to find variable placeholders (like {{variable_name}})
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  // Process each worksheet
  workbook.worksheets.forEach(worksheet => {
    console.log(`Analyzing worksheet: ${worksheet.name}`);
    
    const worksheetAnalysis = {
      name: worksheet.name,
      rowCount: worksheet.rowCount,
      colCount: worksheet.columnCount,
      variables: [],
      tableSections: [],
      staticSections: [],
    };
    
    // Helper to detect if a row looks like a header
    const isHeaderRow = (row) => {
      if (!row || !row.values || row.values.length <= 1) return false;
      
      // Check if cells have bold formatting or text that looks like headers
      let headerTextCount = 0;
      let boldCellCount = 0;
      
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        // Check for bold formatting
        if (cell.font && cell.font.bold) {
          boldCellCount++;
        }
        
        // Check for header-like text
        if (cell.value && typeof cell.value === 'string') {
          const headerKeywords = ['date', 'amount', 'expense', 'description', 'total', 'vendor', 'type', 'category', 'name', 'id'];
          const cellText = cell.value.toLowerCase();
          if (headerKeywords.some(keyword => cellText.includes(keyword))) {
            headerTextCount++;
          }
        }
      });
      
      // If more than 50% of non-empty cells are bold or contain header-like text, consider it a header
      const nonEmptyCells = row.cellCount;
      return (boldCellCount / nonEmptyCells > 0.5) || (headerTextCount / nonEmptyCells > 0.3);
    };
    
    // Look for table structures
    let currentTableSection = null;
    let headerRowFound = false;
    
    // Analyze each row in the worksheet
    worksheet.eachRow((row, rowNumber) => {
      // Check if this looks like a header row for a table
      if (isHeaderRow(row)) {
        headerRowFound = true;
        analysis.hasHeaderRow = true;
        
        // Start a new table section
        currentTableSection = {
          type: 'table',
          startRow: rowNumber,
          endRow: rowNumber, // Will be updated if we find more rows
          headers: [],
          variablesInTable: []
        };
        
        // Extract header values
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          currentTableSection.headers.push({
            column: colNumber,
            text: cell.text || `Column ${colNumber}`,
          });
        });
        
        worksheetAnalysis.tableSections.push(currentTableSection);
      }
      // Otherwise, check for variables
      else {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          // Look for variables in cell content
          if (cell.value && typeof cell.value === 'string') {
            let match;
            const cellVariables = [];
            
            // Reset regex
            variableRegex.lastIndex = 0;
            
            // Find all variables in this cell
            while ((match = variableRegex.exec(cell.value)) !== null) {
              const varName = match[1].trim();
              cellVariables.push(varName);
              
              // Add to the global list if not already there
              if (!analysis.variables.find(v => v.name === varName)) {
                analysis.variables.push({
                  name: varName,
                  occurrences: 1,
                  locations: [`${worksheet.name}!${colNumber},${rowNumber}`]
                });
              } else {
                // Update the existing entry
                const existingVar = analysis.variables.find(v => v.name === varName);
                existingVar.occurrences++;
                existingVar.locations.push(`${worksheet.name}!${colNumber},${rowNumber}`);
              }
              
              // Add to worksheet list
              if (!worksheetAnalysis.variables.includes(varName)) {
                worksheetAnalysis.variables.push(varName);
              }
              
              // If we're in a table section, add to the table variables
              if (currentTableSection) {
                if (!currentTableSection.variablesInTable.includes(varName)) {
                  currentTableSection.variablesInTable.push(varName);
                }
                
                // Update the table end row
                currentTableSection.endRow = rowNumber;
              }
            }
          }
        });
      }
    });
    
    // Infer data types for variables based on naming conventions
    analysis.variables.forEach(variable => {
      const name = variable.name.toLowerCase();
      
      // Infer data type based on variable name
      if (name.includes('date') || name.endsWith('_at') || name.endsWith('_date')) {
        analysis.detectedDataTypes[variable.name] = 'date';
      } else if (name.includes('amount') || name.includes('total') || name.includes('cost') || name.includes('price')) {
        analysis.detectedDataTypes[variable.name] = 'currency';
      } else if (name.includes('count') || name.includes('number') || name.includes('qty') || name.includes('quantity')) {
        analysis.detectedDataTypes[variable.name] = 'number';
      } else if (name.startsWith('is_') || name.includes('has_') || name.includes('enabled') || name.includes('active')) {
        analysis.detectedDataTypes[variable.name] = 'boolean';
      } else {
        analysis.detectedDataTypes[variable.name] = 'string';
      }
    });
    
    // Check for specific sections based on analysis
    analysis.hasExpenseTable = analysis.variables.some(v => 
      v.name.includes('expense') || v.name.includes('vendor') || v.name.includes('amount')
    );
    
    analysis.hasMileageTable = analysis.variables.some(v => 
      v.name.includes('mileage') || v.name.includes('distance') || v.name.includes('odometer')
    );
    
    analysis.hasSummarySection = analysis.variables.some(v => 
      v.name.includes('summary') || v.name.includes('total') || v.name.includes('grand_total')
    );
    
    // Determine complexity based on the number of variables and tables
    if (analysis.variables.length > 20 || worksheetAnalysis.tableSections.length > 2) {
      analysis.complexity = 'complex';
    } else if (analysis.variables.length > 10) {
      analysis.complexity = 'moderate';
    }
    
    // Add this worksheet's analysis to the overall analysis
    analysis.worksheets.push(worksheetAnalysis);
  });
  
  return analysis;
}

/**
 * Uses OpenRouter AI to analyze template structure and suggest schema
 * @param {Object} templateAnalysis The analysis of the template
 * @returns {Object} Generated schema for the template
 */
async function generateSchemaFromAnalysis(templateAnalysis) {
  console.log('Generating schema with OpenRouter API using Qwen 3 model');
  
  // Convert the analysis to a simplified format for the AI
  const simplifiedAnalysis = {
    variables: templateAnalysis.variables.map(v => v.name),
    dataTypes: templateAnalysis.detectedDataTypes,
    hasExpenseTable: templateAnalysis.hasExpenseTable,
    hasMileageTable: templateAnalysis.hasMileageTable,
    hasSummarySection: templateAnalysis.hasSummarySection,
    complexity: templateAnalysis.complexity
  };
  
  // Create a prompt for the AI to analyze
  const prompt = `Analyze this Excel template structure and determine what data needs to be collected and populated in the report:

${JSON.stringify(simplifiedAnalysis, null, 2)}

Based on the template variables above, create a structured schema that defines:
1. What data needs to be collected from the expense system
2. What data should be dynamically generated via AI
3. How the data should be organized and formatted

Return a JSON structure with:
- requiredFields: Data fields that must be collected from the database
- dynamicContent: Fields that should be generated with AI (descriptions, summaries, etc.)
- dataStructure: How data should be organized (tables, single values, etc.)

ONLY return valid JSON without any explanations or markdown formatting.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://expense-tracker.app", 
        "X-Title": "Expense Tracker",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "qwen/qwen3-8b:free",
        "messages": [
          {
            "role": "system",
            "content": "You are a data structure and report template analysis assistant. Your task is to analyze Excel template variables and determine what data needs to be collected and how it should be organized. Respond with structured JSON only, no explanations."
          },
          {
            "role": "user",
            "content": prompt
          }
        ],
        "temperature": 0.2,
        "response_format": { "type": "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      try {
        const schema = JSON.parse(content);
        return schema;
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError);
        throw new Error('Failed to parse AI-generated schema');
      }
    }
    
    throw new Error('Unexpected response format from OpenRouter API');
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    
    // Return a default schema if AI fails
    return {
      requiredFields: templateAnalysis.variables.map(v => v.name),
      dynamicContent: templateAnalysis.variables
        .filter(v => v.name.includes('summary') || v.name.includes('description'))
        .map(v => v.name),
      dataStructure: {
        tables: templateAnalysis.hasExpenseTable ? ['expenses'] : [],
        dynamicTables: templateAnalysis.hasExpenseTable ? ['expenses'] : [], 
        singleValues: templateAnalysis.variables
          .filter(v => v.name.includes('total') || v.name.includes('count'))
          .map(v => v.name)
      }
    };
  }
}

/**
 * Generates dynamic content for template variables using AI
 * @param {Object} schema Template schema 
 * @param {Array} expenses List of expenses
 * @param {Array} mileageRecords List of mileage records
 * @param {Object} tripData Trip data (if applicable)
 * @param {Object} variables Already mapped variables
 * @returns {Object} Additional dynamically generated content variables
 */
async function generateDynamicContent(schema, expenses, mileageRecords, tripData, existingVariables) {
  console.log('Generating dynamic content with OpenRouter API');
  
  // If there are no dynamic content fields, return an empty object
  if (!schema.dynamicContent || schema.dynamicContent.length === 0) {
    return {};
  }
  
  try {
    // Format data for the prompt
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalMileage = mileageRecords.reduce((sum, record) => sum + parseFloat(record.distance), 0);
    
    // Create a prompt based on whether we have trip data
    let prompt = '';
    
    if (tripData) {
      // Trip-specific prompt
      prompt = `Generate concise professional business report content with the following details:
- Trip name: ${tripData.name}
- Trip location: ${tripData.location || 'N/A'}
- Trip dates: ${tripData.start_date || 'N/A'} to ${tripData.end_date || 'N/A'}
- Total expenses: ${formatCurrency(totalExpenses)}
- Number of expenses: ${expenses.length}
- Common descriptions: ${expenses.slice(0, 3).map(e => e.description || `Expense at ${e.vendor || 'unknown vendor'}`).join(', ')}${expenses.length > 3 ? '...' : ''}
- Total mileage: ${totalMileage.toFixed(1)} miles

Create a JSON object with the following fields:
${schema.dynamicContent.map(field => `- "${field}": A concise 1-2 sentence professional summary related to this field`).join('\n')}

IMPORTANT: Return ONLY a valid JSON object with these fields and nothing else.`;
    } else {
      // Date range prompt
      const dateRangeText = "for the covered period";
      
      prompt = `Generate concise professional business report content with the following details:
- Date range: ${dateRangeText}
- Total expenses: ${formatCurrency(totalExpenses)}
- Number of expenses: ${expenses.length}
- Common descriptions: ${expenses.slice(0, 3).map(e => e.description || `Expense at ${e.vendor || 'unknown vendor'}`).join(', ')}${expenses.length > 3 ? '...' : ''}
- Total mileage: ${totalMileage.toFixed(1)} miles

Create a JSON object with the following fields:
${schema.dynamicContent.map(field => `- "${field}": A concise 1-2 sentence professional summary related to this field`).join('\n')}

IMPORTANT: Return ONLY a valid JSON object with these fields and nothing else.`;
    }
    
    // Calculate expense type totals for additional context
    const expensesByType = {};
    expenses.forEach(expense => {
      if (!expensesByType[expense.expense_type]) {
        expensesByType[expense.expense_type] = 0;
      }
      expensesByType[expense.expense_type] += parseFloat(expense.amount);
    });
    
    // Add expense category breakdown if we have any categories to report
    if (Object.keys(expensesByType).length > 0) {
      prompt += `\n\nExpense categories:
${Object.entries(expensesByType)
  .map(([type, amount]) => `- ${type}: ${formatCurrency(amount)}`)
  .join('\n')}`;
    }

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://expense-tracker.app", 
        "X-Title": "Expense Tracker",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "qwen/qwen3-8b:free",
        "messages": [
          {
            "role": "system",
            "content": "You are a professional financial assistant helping generate concise, clear content for expense reports. You respond with ONLY valid JSON objects, without any explanations or markdown formatting."
          },
          {
            "role": "user",
            "content": prompt
          }
        ],
        "temperature": 0.3,
        "response_format": { "type": "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const content = data.choices[0].message.content;
      
      try {
        // Parse the JSON response
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError);
        throw new Error('Failed to parse AI-generated content');
      }
    }
    
    throw new Error('Unexpected response format from OpenRouter API');
  } catch (error) {
    console.error('Error generating dynamic content:', error);
    
    // Provide fallback values for common dynamic fields
    const dynamicContent = {};
    
    if (schema.dynamicContent.includes('llm.report.summary')) {
      dynamicContent['llm.report.summary'] = tripData 
        ? `This report covers expenses for trip "${tripData.name}" with a total of ${expenses.length} expenses amounting to ${formatCurrency(expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}.`
        : `This report covers all expenses with a total of ${expenses.length} entries amounting to ${formatCurrency(expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}.`;
    }
    
    if (schema.dynamicContent.includes('llm.categories.analysis')) {
      // Find top category
      const expensesByType = {};
      expenses.forEach(expense => {
        const type = expense.expense_type || 'other';
        expensesByType[type] = (expensesByType[type] || 0) + parseFloat(expense.amount);
      });
      
      const entries = Object.entries(expensesByType);
      const topCategory = entries.length > 0 
        ? entries.sort(([, a], [, b]) => b - a)[0] 
        : ['other', 0];
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const percentage = totalExpenses > 0 ? Math.round((topCategory[1] / totalExpenses) * 100) : 0;
      
      dynamicContent['llm.categories.analysis'] = `The largest expense category is ${topCategory[0]} at ${formatCurrency(topCategory[1])}, representing ${percentage}% of total expenses.`;
    }
    
    if (schema.dynamicContent.includes('llm.description.summary')) {
      const descriptions = expenses.slice(0, 3).map(e => e.description || `Expense at ${e.vendor || 'unknown vendor'}`);
      dynamicContent['llm.description.summary'] = `Summary of ${expenses.length} expenses including ${descriptions.join(', ')}${expenses.length > 3 ? '...' : '.'}`;
    }
    
    // For all other requested fields, provide a generic fallback
    schema.dynamicContent.forEach(field => {
      if (!dynamicContent[field]) {
        dynamicContent[field] = `This report contains ${expenses.length} expenses and ${mileageRecords.length} mileage records. Total expenses: ${formatCurrency(expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}.`;
      }
    });
    
    return dynamicContent;
  }
}

/**
 * Formats a number as currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}