// Netlify function to preprocess Excel templates before report generation
const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY || "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";

/**
 * Preprocesses an Excel template and saves analysis results to Supabase
 * This avoids timeout issues by preprocessing templates in advance
 */
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
    const { templateUrl, userId } = JSON.parse(event.body);
    
    if (!templateUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Template URL is required' }),
      };
    }

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Download the template
    let templateBuffer;
    console.log('Loading Excel template from URL:', templateUrl);
    
    try {
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
    } catch (error) {
      console.error('Error downloading template:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to download template: ${error.message}` }),
      };
    }

    // Load the workbook
    let workbook;
    try {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBuffer);
      console.log(`Template loaded with ${workbook.worksheets.length} worksheets`);
    } catch (error) {
      console.error('Error loading workbook:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to load template as Excel file: ${error.message}` }),
      };
    }
    
    // Extract variables from the template
    const templateAnalysis = await analyzeTemplate(workbook);
    
    // Generate a schema based on variable analysis using AI
    const schema = await generateSchemaFromAnalysis(templateAnalysis);
    
    // Store the analysis results in Supabase for later use
    try {
      // Check if there's an existing analysis for this template
      const { data: existingAnalysis, error: lookupError } = await supabase
        .from('template_analysis')
        .select('id')
        .eq('template_url', templateUrl)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (lookupError) {
        console.error('Error checking for existing analysis:', lookupError);
      }
      
      // Update or insert the analysis
      const analysisData = {
        user_id: userId,
        template_url: templateUrl,
        analysis: templateAnalysis,
        schema: schema,
        processed_at: new Date().toISOString(),
      };
      
      let saveResult;
      if (existingAnalysis?.id) {
        // Update existing record
        saveResult = await supabase
          .from('template_analysis')
          .update(analysisData)
          .eq('id', existingAnalysis.id);
      } else {
        // Insert new record
        saveResult = await supabase
          .from('template_analysis')
          .insert(analysisData);
      }
      
      if (saveResult.error) {
        throw new Error(`Failed to save template analysis: ${saveResult.error.message}`);
      }
      
      console.log('Successfully saved template analysis to database');
    } catch (dbError) {
      console.error('Error saving template analysis to database:', dbError);
      // Continue even if saving fails - we'll return the analysis directly
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        analysis: templateAnalysis,
        schema: schema
      }),
    };
  } catch (error) {
    console.error('Error preprocessing template:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to preprocess template: ${error.message}` }),
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