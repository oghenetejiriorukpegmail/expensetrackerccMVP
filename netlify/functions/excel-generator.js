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
      
      // Add any dynamic content via LLM integration for variables with llm. prefix
      // This will be processed via OpenRouter API with Qwen 3 model
      try {
        // OpenRouter API integration
        const generateLLMContent = async (prompt) => {
          console.log('Generating content with OpenRouter API using Qwen 3 model');
          console.log('Prompt:', prompt);
          
          // Use provided OpenRouter API key
          const openRouterApiKey = "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";
          
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
                "model": "qwen/qwen3-235b-a22b:free",
                "messages": [
                  {
                    "role": "system",
                    "content": "You are a professional financial assistant helping generate concise, clear summaries for expense reports. Keep your responses brief, factual, and professional."
                  },
                  {
                    "role": "user",
                    "content": prompt
                  }
                ]
              })
            });
          
            if (!response.ok) {
              throw new Error(`OpenRouter API returned status ${response.status}`);
            }
          
            const data = await response.json();
            console.log('OpenRouter API response:', JSON.stringify(data, null, 2));
            
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
              return data.choices[0].message.content.trim();
            }
            
            throw new Error('Unexpected response format from OpenRouter API');
          } catch (error) {
            console.error('Error calling OpenRouter API:', error);
            throw error;
          }
        };
        
        // Generate expense summary using LLM
        let expenseSummaryPrompt = '';
        let categorySummaryPrompt = '';
        
        if (tripData) {
          // Trip-specific prompt
          expenseSummaryPrompt = `Generate a concise 1-2 sentence summary of expenses for a business trip with the following details:
- Trip name: ${tripData.name}
- Trip location: ${tripData.location || 'N/A'}
- Trip dates: ${tripData.start_date || 'N/A'} to ${tripData.end_date || 'N/A'}
- Total expenses: ${formatCurrency(totalExpenses)}
- Number of expenses: ${expenses.length}
- Common descriptions: ${expenseDescriptions.slice(0, 3).map(ed => ed.description).join(', ')}${expenseDescriptions.length > 3 ? '...' : ''}

Format it as a professional expense report summary.`;

          // Category prompt for trip
          categorySummaryPrompt = `Analyze the breakdown of expenses for a business trip with these category totals:
- Accommodation: ${formatCurrency(expenseTypeAmount['accommodation'] || 0)}
- Transportation: ${formatCurrency(expenseTypeAmount['transportation'] || 0)}
- Meals: ${formatCurrency(expenseTypeAmount['meals'] || 0)}
- Entertainment: ${formatCurrency(expenseTypeAmount['entertainment'] || 0)}
- Other: ${formatCurrency(expenseTypeAmount['other'] || 0)}
- Common descriptions: ${expenseDescriptions.slice(0, 3).map(ed => ed.description).join(', ')}${expenseDescriptions.length > 3 ? '...' : ''}

Provide a brief 1-2 sentence analysis highlighting the main expense categories and any notable spending patterns.`;
        } else {
          // Date range prompt
          const dateRangeText = startDate && endDate 
            ? `from ${startDate} to ${endDate}` 
            : startDate 
              ? `from ${startDate}` 
              : endDate 
                ? `until ${endDate}` 
                : "for all recorded periods";
          
          expenseSummaryPrompt = `Generate a concise 1-2 sentence summary of expenses for a report with the following details:
- Date range: ${dateRangeText}
- Total expenses: ${formatCurrency(totalExpenses)}
- Number of expenses: ${expenses.length}
- Common descriptions: ${expenseDescriptions.slice(0, 3).map(ed => ed.description).join(', ')}${expenseDescriptions.length > 3 ? '...' : ''}

Format it as a professional expense report summary.`;

          // Category prompt for date range
          categorySummaryPrompt = `Analyze the breakdown of expenses ${dateRangeText} with these category totals:
- Accommodation: ${formatCurrency(expenseTypeAmount['accommodation'] || 0)}
- Transportation: ${formatCurrency(expenseTypeAmount['transportation'] || 0)}
- Meals: ${formatCurrency(expenseTypeAmount['meals'] || 0)}
- Entertainment: ${formatCurrency(expenseTypeAmount['entertainment'] || 0)}
- Other: ${formatCurrency(expenseTypeAmount['other'] || 0)}
- Common descriptions: ${expenseDescriptions.slice(0, 3).map(ed => ed.description).join(', ')}${expenseDescriptions.length > 3 ? '...' : ''}

Provide a brief 1-2 sentence analysis highlighting the main expense categories and any notable spending patterns.`;
        }
        
        // Get LLM responses
        const [expenseSummary, categorySummary] = await Promise.all([
          generateLLMContent(expenseSummaryPrompt),
          generateLLMContent(categorySummaryPrompt)
        ]);
        
        // Store the LLM-generated content in variables
        variables['llm.report.summary'] = expenseSummary;
        variables['llm.categories.analysis'] = categorySummary;
        
        // Add additional trip-specific content if relevant
        if (tripData) {
          variables['llm.trip.summary'] = expenseSummary;
        } else {
          variables['llm.expenses.summary'] = expenseSummary;
        }
        
        // Add description summary
        if (expenseDescriptions.length > 0) {
          // Generate a description summary for all expenses
          const descriptionSummaryPrompt = `Based on these expense descriptions:
${expenseDescriptions.map((ed, i) => `${i+1}. ${ed.description} (${ed.amount})`).join('\n')}

Create a concise 1-2 sentence summary of what these expenses represent collectively. Focus on patterns and purpose.`;
          
          try {
            const descriptionSummary = await generateLLMContent(descriptionSummaryPrompt);
            variables['llm.description.summary'] = descriptionSummary;
          } catch (error) {
            console.error('Error generating description summary:', error);
            variables['llm.description.summary'] = `Summary of ${expenses.length} expenses including ${expenseDescriptions.slice(0, 3).map(ed => ed.description).join(', ')}${expenseDescriptions.length > 3 ? '...' : ''}.`;
          }
        }
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
      
      console.log('Generated template variables:', JSON.stringify(variables, null, 2));
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