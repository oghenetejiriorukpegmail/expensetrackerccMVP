// Netlify function to generate Excel reports with AI-powered template analysis
const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const { 
  findTableHeaderRow, 
  mapTableColumns, 
  getColumnLetter, 
  getColumnIndex 
} = require('./table-detection-helpers.cjs');

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
    const { tripId, startDate, endDate, templateUrl, userId: requestUserId } = JSON.parse(event.body);
    
    // Log the request with the user ID if it's provided
    console.log('Report request parameters:', { tripId, startDate, endDate, hasTemplate: !!templateUrl, requestUserId });
    
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
      
      // Log the variable substitution process for debugging
      console.log(`Processing variables in text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      
      // Replace variables with their values - handle complex cases where variables might be embedded in text
      let result = text;
      let variablesReplaced = false;
      
      try {
        // Use split and join for more reliable handling of special characters
        // This is more reliable than regex replace for complex patterns
        const parts = result.split(/(\{\{[^}]+\}\})/g);
        
        // Count the number of potential variable parts (those that match the pattern)
        const matchCount = parts.filter(part => part.match(/^\{\{[^}]+\}\}$/)).length;
        console.log(`  Found ${matchCount} potential variable pattern(s) in text using split method`);
        
        // Process each part - if it's a variable pattern, replace it
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          
          // Check if this part is a variable pattern
          if (part.match(/^\{\{[^}]+\}\}$/)) {
            // Extract variable name without braces
            const varName = part.substring(2, part.length - 2).trim();
            
            // Check if variable exists in our variables object
            if (variables[varName] !== undefined) {
              // Replace this part with the variable value
              const replacement = variables[varName].toString();
              parts[i] = replacement;
              console.log(`  Replacing {{${varName}}} with "${replacement}"`);
              variablesReplaced = true;
            } else {
              console.log(`  Variable {{${varName}}} not found, keeping as is`);
            }
          }
        }
        
        // Join all parts back together
        if (variablesReplaced) {
          result = parts.join('');
        }
      } catch (error) {
        console.error('Error during variable processing:', error);
        
        // Fall back to the previous regex-based approach
        console.log('  Falling back to regex-based variable replacement');
        
        // Extract all variable patterns from the text
        const variableMatches = text.match(/\{\{([^}]+)\}\}/g) || [];
        
        if (variableMatches.length > 0) {
          console.log(`  Found ${variableMatches.length} variable pattern(s) using regex fallback`);
          
          // Process each variable match
          variableMatches.forEach(match => {
            // Extract variable name without braces
            const varName = match.substring(2, match.length - 2).trim();
            
            // Check if variable exists in our variables object
            if (variables[varName] !== undefined) {
              // Do a global replace for this specific variable
              const regex = new RegExp(escapeRegExp(match), 'g');
              
              // If the variable is embedded in a larger string (like ____{{date.formatted}}____)
              // we need to handle it carefully to preserve the surrounding text
              const replacement = variables[varName].toString();
              result = result.replace(regex, replacement);
              
              console.log(`  Replacing {{${varName}}} with "${replacement}" (fallback method)`);
              variablesReplaced = true;
            } else {
              console.log(`  Variable {{${varName}}} not found, keeping as is`);
            }
          });
        }
      }
      
      // If we replaced something, log the result
      if (variablesReplaced) {
        console.log(`  Result: "${result.substring(0, 30)}${result.length > 30 ? '...' : ''}"`);
      }
      
      return result;
    };
    
    // Helper function to escape special regex characters in a string
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    };
    
    // Process an entire worksheet, looking for variables to substitute
    const processWorksheet = (worksheet, variables) => {
      console.log(`Processing variables in worksheet: ${worksheet.name}`);
      
      // Count of variables found and replaced
      let varCount = 0;
      let replacedCount = 0;
      let cellsWithVarsCount = 0;
      
      // Also handle direct replacement of cell values that exactly match a variable name (without braces)
      // This is for scenarios where someone might have typed just "date.formatted" instead of "{{date.formatted}}"
      const directReplacementVariables = {};
      Object.keys(variables).forEach(key => {
        // Only add it if it's not already in braces
        directReplacementVariables[key] = variables[key];
        
        // Also add a version without dots
        if (key.includes('.')) {
          const simplifiedKey = key.replace(/\./g, '_');
          directReplacementVariables[simplifiedKey] = variables[key];
        }
      });
      
      // Iterate through all cells in the worksheet
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (cell.type === ExcelJS.ValueType.String && cell.text) {
            const originalValue = cell.text;
            let processed = false;
            let processedValue = originalValue;
            
            // Case 1: Check if the cell contains any variables with braces {{var}}
            if (originalValue.includes('{{')) {
              cellsWithVarsCount++;
              varCount += (originalValue.match(/\{\{([^}]+)\}\}/g) || []).length;
              processedValue = processVariables(originalValue, variables);
              processed = true;
            } 
            // Case 2: Check if the cell text exactly matches a variable name without braces
            else if (directReplacementVariables[originalValue.trim()]) {
              processedValue = directReplacementVariables[originalValue.trim()].toString();
              varCount++;
              processed = true;
              console.log(`Direct variable match in ${worksheet.name} [${rowNumber},${colNumber}]: "${originalValue}" → "${processedValue}"`);
            }
            // Case 3: Check for variable names without braces but embedded in text
            else {
              // Try to match against known variable names without braces
              let hasDirectReplacement = false;
              Object.keys(directReplacementVariables).forEach(varName => {
                // Only try to replace full words, not partial matches
                const varPattern = new RegExp(`\\b${escapeRegExp(varName)}\\b`, 'g');
                if (varPattern.test(originalValue)) {
                  hasDirectReplacement = true;
                  processedValue = originalValue.replace(
                    varPattern, 
                    directReplacementVariables[varName].toString()
                  );
                  varCount++;
                  processed = true;
                  console.log(`Embedded variable without braces in ${worksheet.name} [${rowNumber},${colNumber}]: "${originalValue}" → "${processedValue}"`);
                }
              });
            }
            
            // Only update if something changed
            if (processed && originalValue !== processedValue) {
              replacedCount++;
              console.log(`Replacing variable in ${worksheet.name} [${rowNumber},${colNumber}]: "${originalValue}" → "${processedValue}"`);
              
              // Preserve the cell's style and format by creating a Rich Text value
              // This prevents issues with shared cell formats
              try {
                // For complex cells, we need to handle rich text carefully
                if (cell.value && typeof cell.value === 'object' && cell.value.richText) {
                  // Create a new rich text object with our processed value
                  const newRichText = [{ text: processedValue }];
                  cell.value = { richText: newRichText };
                } else {
                  // For simple string cells
                  cell.value = processedValue;
                }
              } catch (formatError) {
                // Fall back to simple string replacement if rich text handling fails
                console.warn(`Could not preserve formatting in ${worksheet.name} [${rowNumber},${colNumber}]:`, formatError.message);
                cell.value = processedValue;
              }
            }
          }
        });
      });
      
      console.log(`${worksheet.name}: Found ${cellsWithVarsCount} cells with variables (${varCount} total variables), replaced ${replacedCount}`);
      
      // Check for any unreplaced variables
      if (varCount > replacedCount) {
        console.log(`WARNING: Some variables in ${worksheet.name} were not replaced. Check the variable names.`);
      }
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
          
          // Try to load pre-processed template analysis from Supabase
          try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            
            if (userId) {
              console.log('Looking for pre-processed template analysis');
              const { data: analysisData, error: analysisError } = await supabase
                .from('template_analysis')
                .select('*')
                .eq('template_url', templateUrl)
                .eq('user_id', userId)
                .maybeSingle();
              
              if (analysisError) {
                console.error('Error fetching template analysis:', analysisError);
              } else if (analysisData) {
                console.log('Found pre-processed template analysis');
                templateAnalysis = analysisData.analysis;
                templateSchema = analysisData.schema;
              }
            }
          } catch (analysisError) {
            console.error('Error loading pre-processed analysis:', analysisError);
          }
          
          // If no pre-processed analysis was found, trigger preprocessing for next time
          // but continue with basic template processing for now
          if (!templateAnalysis) {
            console.log('No pre-processed analysis found, using basic template processing');
            // Trigger template preprocessing in the background
            try {
              const { data: userData } = await supabase.auth.getUser();
              const userId = userData?.user?.id;
              
              if (userId) {
                // Don't await this - let it run in background
                fetch('/.netlify/functions/preprocess-template', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    templateUrl,
                    userId
                  })
                }).catch(err => console.error('Error triggering template preprocessing:', err));
                
                console.log('Triggered template preprocessing for future use');
              }
            } catch (error) {
              console.error('Error triggering preprocessing:', error);
            }
            
            // For now, just look for variable placeholders without full analysis
            const placeholders = findBasicVariablePlaceholders(workbook);
            console.log(`Found ${placeholders.length} basic variable placeholders`);
            
            templateAnalysis = {
              variables: placeholders.map(name => ({ name, occurrences: 1 })),
              hasExpenseTable: true,
              hasMileageTable: true,
              worksheets: []
            };
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
      
      // Fetch user profile for user variables
      let userProfile = null;
      try {
        // Priority 1: Use the userId passed directly in the request if available
        // This is the most reliable way to get the correct user
        if (requestUserId) {
          console.log('Using user ID provided in request:', requestUserId);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', requestUserId)
            .single();
            
          if (profileError) {
            console.warn('Error fetching profile from request userId:', profileError.message);
          } else if (profileData) {
            userProfile = profileData;
            console.log('Using profile from request userId:', profileData.full_name);
            
            // Since we found the profile from the request, we can stop here
            console.log('Successfully retrieved profile from request');
          } else {
            console.warn('No profile found for request user ID:', requestUserId);
          }
        }
        
        // Priority 2: Use auth.getUser() if we don't have a profile yet
        if (!userProfile) {
          try {
            console.log('Attempting to get current user from auth context...');
            const { data: userData } = await supabase.auth.getUser();
            
            if (userData?.user?.id) {
              console.log('Found current user in auth context:', userData.user.id);
              
              // Fetch the profile for the current user
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userData.user.id)
                .single();
                
              if (profileError) {
                console.warn('Error fetching current user profile:', profileError.message);
              } else if (profileData) {
                userProfile = profileData;
                console.log('Using current user profile:', profileData.full_name);
                
                // Since we found the current user's profile, we can stop here
                console.log('Successfully retrieved current user profile');
              } else {
                console.warn('No profile found for current user ID:', userData.user.id);
              }
            } else {
              console.warn('No current user data available from auth.getUser()');
            }
          } catch (authError) {
            console.warn('Error getting current user from auth:', authError.message);
          }
        }
        
        // Only proceed with fallbacks if we couldn't get the current user's profile
        if (!userProfile) {
          console.log('Falling back to trip/expense data to find user profile...');
          let userId = null;
          
          // Priority 2: Try to get user ID from trip data
          if (tripId) {
            const { data: tripUserData } = await supabase
              .from('trips')
              .select('user_id')
              .eq('id', tripId)
              .single();
              
            if (tripUserData?.user_id) {
              userId = tripUserData.user_id;
              console.log('Using user ID from trip:', userId);
            }
          } 
          
          // Priority 3: Try expense data
          if (!userId && expenses.length > 0) {
            // Create a frequency map of user_ids to find the most common one
            // This is more reliable than just taking the first one
            const userIdCounts = {};
            
            for (const expense of expenses) {
              if (expense.user_id) {
                userIdCounts[expense.user_id] = (userIdCounts[expense.user_id] || 0) + 1;
              }
            }
            
            // Find the most frequent user_id
            let maxCount = 0;
            for (const [id, count] of Object.entries(userIdCounts)) {
              if (count > maxCount) {
                maxCount = count;
                userId = id;
              }
            }
            
            if (userId) {
              console.log('Using most frequent user ID from expenses:', userId);
            }
          }
          
          // Priority 4: Try mileage data
          if (!userId && mileageRecords.length > 0) {
            for (const record of mileageRecords) {
              if (record.user_id) {
                userId = record.user_id;
                console.log('Using user ID from mileage record:', userId);
                break;
              }
            }
          }
          
          // Verify the user ID is valid
          const isValidUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
          
          if (isValidUUID) {
            console.log(`Fetching profile for valid user ID: ${userId}`);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
              
            if (profileError) {
              console.warn('Error fetching profile:', profileError.message);
            } else if (profileData) {
              userProfile = profileData;
              console.log('Found fallback user profile:', profileData.full_name);
            } else {
              console.warn('No profile found for user ID:', userId);
            }
          } else {
            console.warn('Could not find a valid user ID in the data');
          }
          
          // Only use this as a last resort - try to get the request user from headers
          if (!userProfile && event.headers) {
            try {
              console.log('Attempting to extract user from request headers...');
              
              // Try to get Authorization header
              const authHeader = event.headers.authorization || event.headers.Authorization;
              if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const { data, error } = await supabase.auth.getUser(token);
                
                if (error) {
                  console.warn('Error getting user from token:', error.message);
                } else if (data?.user?.id) {
                  console.log('Found user from request token:', data.user.id);
                  
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                    
                  if (profileData) {
                    userProfile = profileData;
                    console.log('Found user profile from request token:', profileData.full_name);
                  }
                }
              }
            } catch (headerError) {
              console.warn('Error extracting user from headers:', headerError.message);
            }
          }
        }
      } catch (profileError) {
        console.warn('Could not fetch user profile for variables:', profileError.message);
      }
      
      // Hard-coded fallback values for demo/testing - prefer no profile to wrong profile
      if (!userProfile) {
        console.log('Using hard-coded fallback for user profile');
        userProfile = {
          full_name: 'Current User',
          email: 'user@example.com'
        };
      }
      
      console.log('Final user profile data:', userProfile ? JSON.stringify(userProfile) : 'Not found');
      
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
        
        // User information variables - with fallbacks if profile not found
        'user.full_name': userProfile?.full_name || 'User',
        'user.email': userProfile?.email || userProfile?.id || 'user@example.com',
      };
      
      // Add individual expense descriptions with index
      expenseDescriptions.forEach((ed, index) => {
        variables[`expense.${index+1}.description`] = ed.description;
        variables[`expense.${index+1}.vendor`] = ed.vendor;
        variables[`expense.${index+1}.amount`] = ed.amount;
        variables[`expense.${index+1}.type`] = ed.type;
        variables[`expense.${index+1}.date`] = ed.date;
      });
      
      // Prepare fallback values for dynamic content
      // Trip summary fallback
      const tripSummaryFallback = tripData 
        ? `This report covers expenses for trip "${tripData.name}" with a total of ${expenses.length} expenses amounting to ${formatCurrency(totalExpenses)}.`
        : `This report covers all expenses with a total of ${expenses.length} entries amounting to ${formatCurrency(totalExpenses)}.`;
      
      // Category analysis fallback
      const topCategory = Object.entries(expenseTypeAmount)
        .sort(([, a], [, b]) => b - a)[0] || ['other', 0];
      
      const categoryAnalysisFallback = `The largest expense category is ${topCategory[0]} at ${formatCurrency(topCategory[1])}, representing ${Math.round((topCategory[1] / totalExpenses) * 100)}% of total expenses.`;
      
      // Description summary fallback
      const descriptionSummaryFallback = `Summary of ${expenses.length} expenses including ${expenseDescriptions.slice(0, 3).map(ed => ed.description).join(', ')}${expenseDescriptions.length > 3 ? '...' : ''}.`;
      
      // Add fallback values immediately, so they're available even if AI generation fails
      variables['llm.report.summary'] = tripSummaryFallback;
      variables['llm.categories.analysis'] = categoryAnalysisFallback;
      variables['llm.trip.summary'] = tripSummaryFallback;
      variables['llm.expenses.summary'] = tripSummaryFallback;
      variables['llm.description.summary'] = descriptionSummaryFallback;
    
      // If we have template schema with dynamic content fields, try to generate better content
      let needsDynamicContent = false;
      let dynamicFields = [];
      
      if (isUsingTemplate && templateSchema && templateSchema.dynamicContent && templateSchema.dynamicContent.length > 0) {
        dynamicFields = templateSchema.dynamicContent;
        needsDynamicContent = true;
      } else if (templateAnalysis && templateAnalysis.variables) {
        // Check if the template uses any of our special llm. variables
        const llmVars = templateAnalysis.variables
          .filter(v => v.name.startsWith('llm.'))
          .map(v => v.name);
          
        if (llmVars.length > 0) {
          dynamicFields = llmVars;
          needsDynamicContent = true;
        } else {
          // Default set of dynamic fields for standard reports
          dynamicFields = [
            'llm.report.summary',
            'llm.categories.analysis', 
            'llm.description.summary'
          ];
          
          // Only try to generate if we have enough data to make it worthwhile
          needsDynamicContent = expenses.length >= 3;
        }
      }
      
      // Try to generate dynamic content without blocking the report generation
      if (needsDynamicContent) {
        // No need to await this - we already have fallbacks
        generateDynamicContent({
          dynamicContent: dynamicFields
        }, expenses, mileageRecords, tripData, variables)
          .then(dynamicContent => {
            // If we got content, merge it
            if (dynamicContent && Object.keys(dynamicContent).length > 0) {
              Object.assign(variables, dynamicContent);
              console.log('Added AI-generated dynamic content to template variables');
            }
          })
          .catch(error => {
            console.error('Error generating dynamic content:', error);
            // We already have fallbacks, so no need to do anything here
          });
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
    
    // For templates, analyze existing structure and map columns for expense and mileage data
    let expenseTableInfo = null;
    let mileageTableInfo = null;
    
    if (isUsingTemplate) {
      console.log('Analyzing template structure for expense and mileage tables');
      
      // Look for sheets and tables with expense data
      workbook.worksheets.forEach(sheet => {
        // Skip if we've already found the tables
        if (expenseTableInfo && mileageTableInfo) return;
        
        console.log(`Scanning worksheet "${sheet.name}" for expense and mileage tables`);
        
        // Find the first row that looks like an expense header
        const expenseHeaderRow = findTableHeaderRow(sheet, [
          'date', 'expense', 'amount', 'cost', 'currency', 'price', 'type', 'vendor', 'description', 'discreption'
        ]);
        
        if (expenseHeaderRow && !expenseTableInfo) {
          console.log(`Found expense table header at row ${expenseHeaderRow.rowNumber} in sheet "${sheet.name}"`);
          expenseTableInfo = {
            sheet,
            headerRow: expenseHeaderRow.rowNumber,
            columns: mapTableColumns(sheet, expenseHeaderRow.rowNumber, {
              date: ['date', 'expense date', 'transaction date'],
              amount: ['amount', 'cost', 'price', 'total', 'value', 'expense amount'],
              currency: ['currency', 'currency code'],
              description: ['description', 'details', 'expense description', 'notes', 'purpose', 'discreption'],
              vendor: ['vendor', 'merchant', 'payee', 'supplier', 'store'],
              expenseType: ['type', 'category', 'expense type'],
              location: ['location', 'place']
            })
          };
          
          console.log('Expense table column mapping:', expenseTableInfo.columns);
        }
        
        // Find the first row that looks like a mileage header
        const mileageHeaderRow = findTableHeaderRow(sheet, [
          'mileage', 'odometer', 'distance', 'miles', 'kilometers', 'km', 'trip'
        ]);
        
        if (mileageHeaderRow && !mileageTableInfo) {
          console.log(`Found mileage table header at row ${mileageHeaderRow.rowNumber} in sheet "${sheet.name}"`);
          mileageTableInfo = {
            sheet,
            headerRow: mileageHeaderRow.rowNumber,
            columns: mapTableColumns(sheet, mileageHeaderRow.rowNumber, {
              date: ['date', 'travel date', 'trip date'],
              distance: ['distance', 'miles', 'kilometers', 'km', 'total distance'],
              startOdometer: ['start', 'start odometer', 'beginning', 'odometer start'],
              endOdometer: ['end', 'end odometer', 'finish', 'odometer end'],
              purpose: ['purpose', 'reason', 'description', 'details', 'notes']
            })
          };
          
          console.log('Mileage table column mapping:', mileageTableInfo.columns);
        }
      });
    }
    
    // Add expenses to the sheet if it's not a template or if we need to populate a table
    if (isUsingTemplate && expenseTableInfo && expenses.length > 0) {
      // Use the detected expense table structure in the template
      console.log(`Filling expense table starting at row ${expenseTableInfo.headerRow + 1} with ${expenses.length} expenses`);
      
      // Start filling data right after the header row
      let currentRow = expenseTableInfo.headerRow + 1;
      
      // Add expense data to the sheet using the mapped columns
      for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        try {
          // Create a row for this expense
          let rowData = {};
          
          // Map the expense data to the columns we found in the template
          if (expenseTableInfo.columns.date) {
            rowData[expenseTableInfo.columns.date] = expense.date || new Date().toISOString().split('T')[0];
          }
          
          if (expenseTableInfo.columns.amount) {
            rowData[expenseTableInfo.columns.amount] = expense.amount ? parseFloat(expense.amount) : 0;
          }
          
          if (expenseTableInfo.columns.currency) {
            rowData[expenseTableInfo.columns.currency] = expense.currency || 'USD';
          }
          
          if (expenseTableInfo.columns.description) {
            rowData[expenseTableInfo.columns.description] = expense.description || '';
          }
          
          if (expenseTableInfo.columns.vendor) {
            rowData[expenseTableInfo.columns.vendor] = expense.vendor || '';
          }
          
          if (expenseTableInfo.columns.expenseType) {
            rowData[expenseTableInfo.columns.expenseType] = expense.expense_type || '';
          }
          
          if (expenseTableInfo.columns.location) {
            rowData[expenseTableInfo.columns.location] = expense.location || '';
          }
          
          // Add the row to the sheet
          const row = expenseTableInfo.sheet.getRow(currentRow);
          
          // Set each cell value
          Object.entries(rowData).forEach(([colKey, value]) => {
            try {
              // Handle columns defined by letter
              if (isNaN(colKey)) {
                const colIndex = getColumnIndex(colKey);
                row.getCell(colIndex).value = value;
              } else {
                // Handle columns defined by number
                row.getCell(parseInt(colKey)).value = value;
              }
            } catch (cellError) {
              console.warn(`Error setting cell value for column ${colKey}:`, cellError.message);
            }
          });
          
          // Format for amount if it's a number
          try {
            if (expenseTableInfo.columns.amount) {
              const amountCell = isNaN(expenseTableInfo.columns.amount) 
                ? row.getCell(getColumnIndex(expenseTableInfo.columns.amount))
                : row.getCell(parseInt(expenseTableInfo.columns.amount));
                
              amountCell.numFmt = '$#,##0.00';
            }
          } catch (formatError) {
            console.warn('Error formatting amount cell:', formatError.message);
          }
          
          // Move to the next row
          currentRow++;
          console.log(`Added expense ${i+1}/${expenses.length} to template table`);
        } catch (err) {
          console.error(`Error adding expense row ${i+1} to template:`, err);
        }
      }
    } else if (!isUsingTemplate || (isUsingTemplate && (!templateAnalysis || templateAnalysis.hasExpenseTable))) {
      // Use standard approach for non-templates or when no table structure is found
      console.log(`Adding ${expenses.length} expenses to the Expenses sheet (standard approach)`);
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
      
      // Format amounts as currency - safely with error checking
      try {
        // Check if column exists before trying to format it
        if (expensesSheet.getColumnKey('amount')) {
          expensesSheet.getColumn('amount').numFmt = '$#,##0.00';
        } else {
          // Try to find amount column by position (5th column typically)
          try {
            expensesSheet.getColumn(5).numFmt = '$#,##0.00';
          } catch (formatError) {
            console.warn('Could not format amount column:', formatError.message);
          }
        }
      } catch (columnError) {
        console.warn('Could not access column by key:', columnError.message);
      }
      
      // Style expenses header row - safely with error checking
      try {
        const expensesHeaderRow = expensesSheet.getRow(1);
        if (expensesHeaderRow) {
          expensesHeaderRow.font = { bold: true };
        }
      } catch (rowError) {
        console.warn('Could not style header row:', rowError.message);
      }
    }
    
    // Fill mileage sheet if needed
    if (isUsingTemplate && mileageTableInfo && mileageRecords.length > 0) {
      // Use the detected mileage table structure in the template
      console.log(`Filling mileage table starting at row ${mileageTableInfo.headerRow + 1} with ${mileageRecords.length} records`);
      
      // Start filling data right after the header row
      let currentRow = mileageTableInfo.headerRow + 1;
      
      // Add mileage data to the sheet using the mapped columns
      for (let i = 0; i < mileageRecords.length; i++) {
        const record = mileageRecords[i];
        try {
          // Parse values safely, defaulting to 0 if NaN
          const startOdometer = record.start_odometer ? parseFloat(record.start_odometer) : 0;
          const endOdometer = record.end_odometer ? parseFloat(record.end_odometer) : 0;
          const distance = record.distance ? parseFloat(record.distance) : (endOdometer - startOdometer);
          const cost = distance * mileageRate;
          
          // Create a row for this mileage record
          let rowData = {};
          
          // Map the mileage data to the columns we found in the template
          if (mileageTableInfo.columns.date) {
            rowData[mileageTableInfo.columns.date] = record.date || new Date().toISOString().split('T')[0];
          }
          
          if (mileageTableInfo.columns.distance) {
            rowData[mileageTableInfo.columns.distance] = distance;
          }
          
          if (mileageTableInfo.columns.startOdometer) {
            rowData[mileageTableInfo.columns.startOdometer] = startOdometer;
          }
          
          if (mileageTableInfo.columns.endOdometer) {
            rowData[mileageTableInfo.columns.endOdometer] = endOdometer;
          }
          
          if (mileageTableInfo.columns.purpose) {
            rowData[mileageTableInfo.columns.purpose] = record.purpose || '';
          }
          
          // Add the row to the sheet
          const row = mileageTableInfo.sheet.getRow(currentRow);
          
          // Set each cell value
          Object.entries(rowData).forEach(([colKey, value]) => {
            try {
              // Handle columns defined by letter
              if (isNaN(colKey)) {
                const colIndex = getColumnIndex(colKey);
                row.getCell(colIndex).value = value;
              } else {
                // Handle columns defined by number
                row.getCell(parseInt(colKey)).value = value;
              }
            } catch (cellError) {
              console.warn(`Error setting cell value for column ${colKey}:`, cellError.message);
            }
          });
          
          // Move to the next row
          currentRow++;
          console.log(`Added mileage record ${i+1}/${mileageRecords.length} to template table`);
        } catch (err) {
          console.error(`Error adding mileage row ${i+1} to template:`, err);
        }
      }
    } else if (!isUsingTemplate || (isUsingTemplate && (!templateAnalysis || templateAnalysis.hasMileageTable))) {
      // Use standard approach for non-templates or when no table structure is found
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
      
      // Format mileage cost as currency - safely with error checking
      try {
        // Check if column exists before trying to format it
        if (mileageSheet.getColumnKey('cost')) {
          mileageSheet.getColumn('cost').numFmt = '$#,##0.00';
        } else {
          // Try to find cost column by position (6th column typically)
          try {
            mileageSheet.getColumn(6).numFmt = '$#,##0.00';
          } catch (formatError) {
            console.warn('Could not format cost column:', formatError.message);
          }
        }
      } catch (columnError) {
        console.warn('Could not access column by key:', columnError.message);
      }
      
      // Style mileage header row - safely with error checking
      try {
        const mileageHeaderRow = mileageSheet.getRow(1);
        if (mileageHeaderRow) {
          mileageHeaderRow.font = { bold: true };
        }
      } catch (rowError) {
        console.warn('Could not style header row:', rowError.message);
      }
    }
    
    // For templates, do a final pass to replace any variables that might have been missed
    if (isUsingTemplate) {
      console.log('Doing final pass of variable substitution');
      
      // Build variables again to ensure all are available
      const templateVariables = await buildTemplateVariables();
      
      // Log some important variables to help debug
      console.log('Final template variables check:');
      console.log('- user.full_name:', templateVariables['user.full_name']);
      console.log('- user.email:', templateVariables['user.email']);
      console.log('- date.formatted:', templateVariables['date.formatted']);
      console.log('- trip.name:', templateVariables['trip.name']);
      console.log('- report.title:', templateVariables['report.title']);
      
      // Special test for embedded variables like ____{{date.formatted}}____
      console.log('Testing embedded variable substitution');
      const embeddedTest = "____{{date.formatted}}____";
      const processedTest = processVariables(embeddedTest, templateVariables);
      console.log(`Test with embedded variables: "${embeddedTest}" -> "${processedTest}"`);
      
      // Special test for multiple variables in the same cell
      const multipleTest = "Date: {{date.formatted}} | User: {{user.full_name}}";
      const processedMultipleTest = processVariables(multipleTest, templateVariables);
      console.log(`Test with multiple variables: "${multipleTest}" -> "${processedMultipleTest}"`);
      
      // Special test for text with slight variations but containing the variable
      const customTextTest = "Today is {{date.formatted}} - Report by {{user.full_name}}";
      const processedCustomTest = processVariables(customTextTest, templateVariables);
      console.log(`Test with custom text: "${customTextTest}" -> "${processedCustomTest}"`);
      
      // Special test for the problematic case with underscores
      const underscoreTest = "_____ {{date.formatted}}________";
      const processedUnderscoreTest = processVariables(underscoreTest, templateVariables);
      console.log(`Test with underscores: "${underscoreTest}" -> "${processedUnderscoreTest}"`);
      
      // Special test for variables without braces
      const withoutBracesTest = "Date formatted: date.formatted";
      // Create a synthetic cell-like object to test the full worksheet processing logic
      const testCell = { 
        type: ExcelJS.ValueType.String, 
        text: withoutBracesTest,
        value: withoutBracesTest
      };
      const testRow = {
        eachCell: (opts, callback) => callback(testCell, 1)
      };
      const testWorksheet = {
        name: "TEST_SHEET",
        eachRow: (opts, callback) => callback(testRow, 1)
      };
      
      console.log("Testing variable replacement without braces:");
      processWorksheet(testWorksheet, templateVariables);
      
      // Process all worksheets for variable substitution - do THREE passes to ensure all nested variables are replaced
      console.log('Performing multiple passes to ensure all variables are replaced');
      
      // First pass
      workbook.worksheets.forEach(sheet => {
          processWorksheet(sheet, templateVariables);
      });
      
      // Second pass - sometimes variables are inside other variables or formatting changes
      console.log('Second pass of variable substitution');
      workbook.worksheets.forEach(sheet => {
          processWorksheet(sheet, templateVariables);
      });
      
      // Final pass - catch any stragglers
      console.log('Final pass of variable substitution');
      workbook.worksheets.forEach(sheet => {
          processWorksheet(sheet, templateVariables);
      });
    }
    
    // Generate Excel buffer
    console.log('Generating Excel buffer...');
    try {
      // Safely get row counts with error handling
      let summaryRows = 0, expensesRows = 0, mileageRows = 0;
      try { summaryRows = summarySheet.rowCount; } catch (e) { console.warn('Could not get summary row count', e.message); }
      try { expensesRows = expensesSheet.rowCount; } catch (e) { console.warn('Could not get expenses row count', e.message); }
      try { mileageRows = mileageSheet.rowCount; } catch (e) { console.warn('Could not get mileage row count', e.message); }
      
      console.log(`Sheets summary: Summary (${summaryRows} rows), Expenses (${expensesRows} rows), Mileage (${mileageRows} rows)`);
      
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
      
      // For debugging, check worksheet structure
      try {
        console.log('Workbook structure:', workbook.worksheets.map(ws => ({ 
          name: ws.name, 
          columnCount: ws.columnCount,
          rowCount: ws.rowCount,
          definedNames: workbook.definedNames.getNames(ws.name)
        })));
      } catch (debugErr) {
        console.error('Error inspecting workbook:', debugErr);
      }
      
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
 * Basic function to find variable placeholders in a workbook
 * Simpler and faster than full analysis, but less detailed
 * @param {ExcelJS.Workbook} workbook The workbook to scan
 * @returns {string[]} List of variable placeholder names
 */
function findBasicVariablePlaceholders(workbook) {
  const variables = new Set();
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  // Process each worksheet
  workbook.worksheets.forEach(worksheet => {
    // Scan each row and cell for variables
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        // Look for variables in cell content
        if (cell.value && typeof cell.value === 'string') {
          let match;
          
          // Reset regex
          variableRegex.lastIndex = 0;
          
          // Find all variables in this cell
          while ((match = variableRegex.exec(cell.value)) !== null) {
            const varName = match[1].trim();
            variables.add(varName);
          }
        }
      });
    });
  });
  
  return Array.from(variables);
}

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