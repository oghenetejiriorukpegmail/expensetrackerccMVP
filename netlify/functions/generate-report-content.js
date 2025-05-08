// Netlify function to generate dynamic report content using OpenRouter AI
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
    const { 
      dynamicFields,
      expenseData,
      mileageData,
      tripData,
      existingVariables
    } = JSON.parse(event.body);
    
    if (!dynamicFields || !Array.isArray(dynamicFields) || dynamicFields.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dynamic fields array is required' }),
      };
    }
    
    // Generate all the required content
    const contentMap = {};
    
    // Create batches of requests to reduce API calls
    // Group related fields together for better context
    const reportContentFields = dynamicFields.filter(field => 
      field.includes('report') || field.includes('summary') || field === 'llm.trip.summary'
    );
    
    const categoryFields = dynamicFields.filter(field => 
      field.includes('categor') || field.includes('analysis')
    );
    
    const descriptionFields = dynamicFields.filter(field => 
      field.includes('description')
    );
    
    // Generate each content type as needed
    const contentPromises = [];
    
    if (reportContentFields.length > 0) {
      contentPromises.push(generateReportSummary(
        reportContentFields, 
        expenseData, 
        mileageData, 
        tripData, 
        existingVariables
      ));
    }
    
    if (categoryFields.length > 0) {
      contentPromises.push(generateCategoryAnalysis(
        categoryFields,
        expenseData,
        existingVariables
      ));
    }
    
    if (descriptionFields.length > 0) {
      contentPromises.push(generateDescriptionSummary(
        descriptionFields,
        expenseData
      ));
    }
    
    // Execute all content generation in parallel
    const contentResults = await Promise.all(contentPromises);
    
    // Merge all content into a single map
    contentResults.forEach(result => {
      Object.assign(contentMap, result);
    });
    
    // Return the dynamic content
    return {
      statusCode: 200,
      body: JSON.stringify({ content: contentMap }),
    };
  } catch (error) {
    console.error('Error generating report content:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to generate report content: ${error.message}` }),
    };
  }
};

/**
 * Generates report summary content
 */
async function generateReportSummary(fields, expenseData, mileageData, tripData, existingVariables) {
  console.log('Generating report summary content with OpenRouter API');
  
  // Format data for the prompt
  const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
  const totalMileage = mileageData.reduce((sum, record) => sum + record.distance, 0);
  
  // Create a prompt based on whether we have trip data
  let prompt = '';
  
  if (tripData) {
    // Trip-specific prompt
    prompt = `Generate a concise professional business report summary with the following details:
- Trip name: ${tripData.name}
- Trip location: ${tripData.location || 'N/A'}
- Trip dates: ${tripData.startDate || 'N/A'} to ${tripData.endDate || 'N/A'}
- Total expenses: ${formatCurrency(totalExpenses)}
- Number of expenses: ${expenseData.length}
- Common descriptions: ${expenseData.slice(0, 3).map(e => e.description).join(', ')}${expenseData.length > 3 ? '...' : ''}
- Total mileage: ${totalMileage.toFixed(1)} miles

Create a JSON object with the following fields:
${fields.map(field => `- "${field}": A concise 1-2 sentence professional summary focusing on this trip's purpose and expenses`).join('\\n')}

IMPORTANT: Return ONLY a valid JSON object with these fields and nothing else.`;
  } else {
    // Date range prompt
    const dateRangeText = existingVariables['date.range'] || "for the covered period";
    
    prompt = `Generate a concise professional business report summary with the following details:
- Date range: ${dateRangeText}
- Total expenses: ${formatCurrency(totalExpenses)}
- Number of expenses: ${expenseData.length}
- Common descriptions: ${expenseData.slice(0, 3).map(e => e.description).join(', ')}${expenseData.length > 3 ? '...' : ''}
- Total mileage: ${totalMileage.toFixed(1)} miles

Create a JSON object with the following fields:
${fields.map(field => `- "${field}": A concise 1-2 sentence professional summary focusing on the expense overview`).join('\\n')}

IMPORTANT: Return ONLY a valid JSON object with these fields and nothing else.`;
  }
  
  // Call OpenRouter API
  return await callOpenRouterAPI(prompt);
}

/**
 * Generates category analysis content
 */
async function generateCategoryAnalysis(fields, expenseData, existingVariables) {
  console.log('Generating category analysis content with OpenRouter API');
  
  // Calculate expense type totals
  const expensesByType = {};
  expenseData.forEach(expense => {
    if (!expensesByType[expense.type]) {
      expensesByType[expense.type] = 0;
    }
    expensesByType[expense.type] += expense.amount;
  });
  
  // Format expense categories for the prompt
  const categoryBreakdown = Object.entries(expensesByType)
    .map(([type, amount]) => `- ${type}: ${formatCurrency(amount)}`)
    .join('\\n');
  
  const prompt = `Analyze this breakdown of business expenses by category:
${categoryBreakdown}

Create a JSON object with the following fields:
${fields.map(field => `- "${field}": A professional 1-2 sentence analysis of expense categories, identifying patterns and notable spending areas`).join('\\n')}

IMPORTANT: Return ONLY a valid JSON object with these fields and nothing else.`;
  
  // Call OpenRouter API
  return await callOpenRouterAPI(prompt);
}

/**
 * Generates description summary content
 */
async function generateDescriptionSummary(fields, expenseData) {
  console.log('Generating description summary content with OpenRouter API');
  
  // Format expense descriptions for the prompt
  const expenseDescriptions = expenseData
    .map((expense, i) => `${i+1}. ${expense.description || `Expense at ${expense.vendor || 'unknown vendor'}`} (${formatCurrency(expense.amount)})`)
    .join('\\n');
  
  const prompt = `Based on these business expense descriptions:
${expenseDescriptions}

Create a JSON object with the following fields:
${fields.map(field => `- "${field}": A concise 1-2 sentence professional summary of what these expenses represent collectively, focusing on business purpose`).join('\\n')}

IMPORTANT: Return ONLY a valid JSON object with these fields and nothing else.`;
  
  // Call OpenRouter API
  return await callOpenRouterAPI(prompt);
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

/**
 * Calls OpenRouter API with the given prompt
 */
async function callOpenRouterAPI(prompt) {
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
    console.error('Error calling OpenRouter API:', error);
    
    // Return empty content on error
    return {};
  }
}