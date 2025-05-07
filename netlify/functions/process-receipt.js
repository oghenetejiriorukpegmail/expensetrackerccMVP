// Actual Document AI receipt processing function
const { GoogleAuth } = require('google-auth-library');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    
    console.log('Received Document AI receipt processing request');
    
    // Extract image data
    let imageData = body.imageData;
    if (!imageData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'No image data provided' })
      };
    }
    
    console.log(`Received image data of length: ${imageData.length}`);
    
    // Set initial MIME type
    let mimeType = 'image/jpeg';  // Default MIME type
    let originalImageFormat = 'unknown';
    let originalDataLength = imageData.length;
    let isPDF = false;
    
    // Check if the content has a data URL prefix
    if (imageData.startsWith('data:')) {
      console.log('Content has data URL prefix, extracting info');
      // Extract mime type from the data URL
      const matches = imageData.match(/^data:([^;]+);base64,/);
      if (matches && matches.length > 1) {
        mimeType = matches[1].toLowerCase();
        originalImageFormat = mimeType.split('/')[1] || 'unknown';
        console.log(`Detected MIME type from prefix: ${mimeType}, format: ${originalImageFormat}`);
        
        // Check if this is a PDF specifically
        if (mimeType === 'application/pdf' || originalImageFormat === 'pdf') {
          console.log('PDF document detected, using application/pdf MIME type');
          mimeType = 'application/pdf';
          originalImageFormat = 'pdf';
          isPDF = true;
        }
        
        // Try to detect PDF content based on signature
        if (!isPDF && imageData.length > 100) {
          // Look for PDF signature in the Base64 header
          // %PDF- in base64 often starts with "JVBER" or similar patterns
          const sampleHeader = imageData.substring(0, 100);
          if (sampleHeader.includes('JVBER') || 
              sampleHeader.includes('JVBERi0') || 
              sampleHeader.startsWith('0M8R') ||  // PDF artifact
              mimeType.includes('pdf')) {
            console.log('PDF content detected based on signature, using application/pdf MIME type');
            mimeType = 'application/pdf';
            originalImageFormat = 'pdf';
            isPDF = true;
          }
        }
      }
      
      // Extract the base64 content
      imageData = imageData.split('base64,')[1];
      console.log(`Extracted base64 data of length: ${imageData.length}`);
    }
    
    // Check for PDF header in binary content (additional detection layer)
    if (!isPDF && imageData.length > 10) {
      try {
        // Decode a small portion to check for PDF signature
        const headerBytes = Buffer.from(imageData.substring(0, 30), 'base64').toString();
        if (headerBytes.startsWith('%PDF-') || headerBytes.includes('%PDF-')) {
          console.log('PDF content detected from content header');
          mimeType = 'application/pdf';
          originalImageFormat = 'pdf';
          isPDF = true;
        }
      } catch (e) {
        console.log('Could not inspect content header, continuing with detected mime type');
      }
    }
    
    // For images (non-PDFs), use a reliable MIME type
    if (!isPDF && mimeType !== 'application/pdf') {
      // Improve compatibility by using a standard image format
      console.log('Using standardized image MIME type for Document AI compatibility');
      mimeType = 'image/png';
    }
    
    console.log(`Final MIME type for Document AI: ${mimeType}`);
    
    // Validate the base64 data
    try {
      // Check if the string contains only valid base64 characters
      const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(imageData);
      if (!isValidBase64) {
        console.warn('Base64 data contains invalid characters, cleaning up...');
        imageData = imageData.replace(/[^A-Za-z0-9+/=]/g, '');
      }
      
      // Check if the length is valid for base64 (multiple of 4)
      const paddingNeeded = (4 - (imageData.length % 4)) % 4;
      if (paddingNeeded > 0) {
        console.log(`Adding ${paddingNeeded} padding characters to base64 data`);
        imageData += '='.repeat(paddingNeeded);
      }
      
      // Validate by attempting to decode a small sample
      try {
        const testSample = imageData.substring(0, 100);
        Buffer.from(testSample, 'base64');
        console.log('Base64 validation passed for sample');
      } catch (e) {
        console.error('Base64 validation failed:', e.message);
        throw new Error('Invalid base64 encoding');
      }
    } catch (error) {
      console.error('Base64 validation error:', error);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid base64 image data',
          details: error.message
        })
      };
    }
    
    // Get credentials from environment variables
    let credentials;
    if (process.env.GOOGLE_CREDENTIALS) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      } catch (e) {
        console.error('Failed to parse GOOGLE_CREDENTIALS:', e);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid Google credentials' })
        };
      }
    } else {
      console.error('No GOOGLE_CREDENTIALS environment variable found');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Google credentials not configured' })
      };
    }
    
    // Define scopes needed for Document AI
    const SCOPES = [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/cloud-vision'
    ];
    
    // Get the project ID and processor ID
    const projectId = process.env.GOOGLE_PROJECT_ID || credentials.project_id;
    const processorId = process.env.GOOGLE_PROCESSOR_ID;
    const location = 'us'; // Default location for Document AI
    
    if (!projectId) {
      console.error('No Google project ID available');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Google project ID not configured' })
      };
    }
    
    if (!processorId) {
      console.error('No Google processor ID available');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Google processor ID not configured' })
      };
    }
    
    console.log(`Using Google Document AI with Project ID: ${projectId}, Processor ID: ${processorId}`);
    
    try {
      // Create a GoogleAuth instance
      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: SCOPES
      });
      
      // Get client and access token
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      
      if (!tokenResponse.token) {
        throw new Error('Failed to get access token');
      }
      
      const accessToken = tokenResponse.token;
      
      // Document AI processor URL
      const processorUrl = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;
      
      console.log(`Final MIME type: ${mimeType}, base64 length: ${imageData.length}`);
      
      // Try to solve the invalid image content error by ensuring PDF format
      // as it's more reliable in Document AI than some image formats
      let requestBody;
      try {
        // Different processing options based on document type
        if (mimeType === 'application/pdf') {
          console.log('Creating request for PDF document processing');
          // PDF-specific processing options
          requestBody = {
            rawDocument: {
              content: imageData,
              mimeType: mimeType
            },
            // PDF-specific processing options
            processOptions: {
              // For PDF documents
              ocrConfig: {
                enableImageQualityScores: true
              }
              // Remove layoutConfig with unsupported parameters
            }
          };
        } else {
          console.log('Creating request for image document processing');
          // Image-specific processing options
          requestBody = {
            rawDocument: {
              content: imageData,
              mimeType: mimeType
            },
            // Add detailed processing options for better results with images
            processOptions: {
              // Enhanced OCR settings
              ocrConfig: {
                enableImageQualityScores: true,
                advancedOcrOptions: "enable_symbol_recognition=true;enable_image_quality_scores=true"
              }
              // Remove layout config with unsupported parameters
            }
          };
        }
        
      } catch (formatError) {
        console.error('Error preparing request body:', formatError);
        throw new Error(`Failed to prepare document request: ${formatError.message}`);
      }
      
      // Send request to Document AI
      console.log('Sending request to Document AI...');
      
      const response = await fetch(processorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        let errorMessage = `Document AI failed: ${response.status} ${response.statusText}`;
        let errorDetails = '';
        let invalidImageError = false;
        
        try {
          const errorJson = await response.json();
          console.error('Document AI error response:', JSON.stringify(errorJson, null, 2));
          
          // Extract more detailed error information if available
          if (errorJson.error) {
            errorMessage = `Document AI error: ${errorJson.error.message || errorJson.error}`;
            errorDetails = errorJson.error.details || JSON.stringify(errorJson.error);
            
            // Check specifically for "Invalid image content" error
            if (errorJson.error.message === 'Invalid image content') {
              invalidImageError = true;
              console.log('Detected "Invalid image content" error from Document AI');
              
              // Log detailed information for debugging
              console.log(`Image format: ${originalImageFormat}, MIME type: ${mimeType}, Data length: ${imageData.length}`);
              
              // For invalid image content errors, we can try different things:
              // 1. Try a different MIME type
              // 2. Return a fallback receipt
              // For now, we'll use the fallback approach since it's most reliable
            }
          }
        } catch (parseError) {
          // If not JSON, get raw text
          const errorText = await response.text();
          console.error('Document AI error response (text):', errorText);
          errorDetails = errorText;
          
          // Check if the error text contains the invalid image content error
          if (errorText.includes('Invalid image content')) {
            invalidImageError = true;
            console.log('Detected "Invalid image content" error from Document AI in text response');
          }
        }
        
        // If we got an invalid image error, try to generate a fallback response
        if (invalidImageError) {
          console.log('Providing fallback receipt data for invalid image content error');
          
          // Try to determine if this is a format issue
          let detailedReason = "Document AI could not process the content";
          let vendorName = "Unknown Vendor";
          
          // Provide specific information based on detected format
          if (isPDF) {
            detailedReason = "Document AI could not process this PDF. It may be encrypted, damaged, or in an unsupported format.";
            vendorName = "PDF Receipt";
          } else if (originalImageFormat === 'unknown') {
            detailedReason = "The uploaded file couldn't be processed. Please try a different image format like JPG or PNG.";
            vendorName = "Receipt";
          } else if (originalImageFormat === 'png' || originalImageFormat === 'jpeg' || originalImageFormat === 'jpg') {
            detailedReason = `The ${originalImageFormat.toUpperCase()} image couldn't be processed. Try a clearer image or a different format.`;
            vendorName = `${originalImageFormat.toUpperCase()} Receipt`;
          } else {
            detailedReason = `The ${originalImageFormat} format is not well supported. Try converting to JPG or PNG.`;
            vendorName = `${originalImageFormat} Receipt`;
          }
          
          // Create a more informative fallback receipt response
          const fallbackReceipt = {
            vendor: vendorName,
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            confidence: 0.1,
            currency: 'USD',
            expenseType: 'other',
            location: { city: '', state: '', country: '' },
            items: [],
            total: 0,
            taxAmount: 0,
            _fallback: true,
            _fallbackReason: detailedReason,
            _userMessage: "The receipt couldn't be automatically processed. Please enter the details manually.",
            _technicalDetails: {
              error: 'INVALID_IMAGE_CONTENT',
              imageFormat: originalImageFormat,
              mimeType: mimeType,
              isPDF: isPDF,
              dataLength: imageData.length,
              timestamp: new Date().toISOString()
            }
          };
          
          return {
            statusCode: 200, // Return 200 to prevent app breaking
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              receipt: fallbackReceipt,
              message: 'Document AI could not process the image. Using fallback data.'
            })
          };
        }
        
        // For other errors, return the error status and details
        return {
          statusCode: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: errorMessage,
            details: errorDetails
          })
        };
      }
      
      // Process Document AI response
      const docAiResponse = await response.json();
      console.log('Received Document AI response');
      
      // Extract document entities
      const document = docAiResponse.document;
      
      // Handle different processor versions that might have different response structures
      const entities = document.entities || document.entityMentions || [];
      
      // Log the raw entities for debugging
      console.log('Document AI entities:', JSON.stringify(entities, null, 2));
      
      // Process the entities to extract receipt data
      const processedReceipt = processDocumentAIEntities(document, entities);
      
      // Generate a description directly using OpenRouter API
      let description = null;
      try {
        // Use the Netlify function for description generation by passing the processed receipt data
        const descriptionResponse = await fetch('/.netlify/functions/test-receipt-description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentAiData: processedReceipt
          })
        });
        
        if (descriptionResponse.ok) {
          const descriptionData = await descriptionResponse.json();
          description = descriptionData.description;
          console.log('Generated description from Document AI data:', description);
        } else {
          console.error('Failed to generate description:', await descriptionResponse.text());
        }
      } catch (descError) {
        console.error('Error generating description:', descError);
        // Don't fail the whole request if description generation fails
      }
      
      // Return the processed receipt with description
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receipt: processedReceipt,
          message: 'Receipt processed successfully with Document AI',
          description: description,
          // Include flag for backward compatibility
          generateDescription: description === null
        })
      };
    } catch (authError) {
      console.error('Error authenticating with Google:', authError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to authenticate with Google Document AI', 
          details: authError.message 
        })
      };
    }
  } catch (error) {
    console.error('Error processing receipt:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to process receipt',
        details: error.message
      })
    };
  }
};

/**
 * Process Document AI entities into a structured receipt
 * @param {Object} document The Document AI document object
 * @param {Array} entities The entities extracted from the document
 * @returns {Object} Structured receipt data
 */
function processDocumentAIEntities(document, entities) {
  // Build a map of known entity types for flexible handling
  const entityMap = {
    // Common vendor entity types
    vendor: ['supplier_name', 'merchant_name', 'vendor_name', 'store_name', 'restaurant_name', 'business_name', 'company_name', 'payee', 'recipient_name'],
    
    // Common amount entity types
    amount: ['total_amount', 'invoice_total', 'price', 'grand_total', 'receipt_total', 'subtotal', 'amount_due', 'payment_amount', 'amount_paid', 'total_price', 'total_cost', 'total_due', 'balance_due', 'transaction_amount', 'total'],
    
    // Common date entity types
    date: ['purchase_date', 'receipt_date', 'invoice_date', 'transaction_date', 'date', 'payment_date', 'service_date', 'bill_date'],
    
    // Common currency entity types
    currency: ['currency', 'currency_code', 'price_currency'],
    
    // Common address entity types
    address: ['supplier_address', 'merchant_address', 'store_address', 'address', 'business_address', 'location_address', 'vendor_address', 'company_address', 'restaurant_address', 'service_location'],
    
    // Common location entity types (separate from full address)
    location: ['location', 'city', 'store_location', 'service_location', 'business_location', 'state', 'country'],
    
    // Common receipt type entity types
    type: ['receipt_type', 'expense_category', 'purchase_category', 'transaction_type', 'payment_type', 'expense_type'],
    
    // Common tax entity types
    tax: ['tax_amount', 'vat_amount', 'tax', 'vat', 'gst', 'sales_tax', 'tax_total']
  };
  
  // Initialize receipt object with default confidence
  const extractedData = {
    confidence: document.textChangeProbs?.[0] || document.pages?.[0]?.imageQualityScores?.qualityScore || 0.7
  };
  
  // Process entities
  for (const entity of entities) {
    // Different processor versions might have different property names
    const entityType = entity.type || entity.entityType || '';
    const normalizedValue = entity.normalizedValue?.text || entity.textAnchor?.content || entity.mentionText || '';
    const confidence = entity.confidence || 0;
    
    // If no value, skip this entity
    if (!normalizedValue) {
      continue;
    }
    
    console.log(`Processing entity type "${entityType}" with value "${normalizedValue}" (confidence: ${confidence})`);
    
    // Check each entity category
    if (entityMap.vendor.includes(entityType)) {
      console.log(`Found vendor: ${normalizedValue}`);
      extractedData.vendor = normalizedValue;
    }
    else if (entityMap.amount.includes(entityType)) {
      // Try to extract numeric value, handling different formats
      const numericValue = extractNumericValue(normalizedValue);
      if (numericValue !== null) {
        console.log(`Found amount: ${numericValue} from "${normalizedValue}" with type "${entityType}"`);
        
        // Handle different amount types more specifically
        if (entityType === 'total_amount' || entityType === 'grand_total' || entityType === 'receipt_total' || entityType === 'invoice_total') {
          console.log(`Setting total to ${numericValue} from "${normalizedValue}" (${entityType})`);
          extractedData.total = numericValue;
          
          // If no amount is set yet, also use this as the main amount
          if (extractedData.amount === undefined) {
            extractedData.amount = numericValue;
          }
        } 
        // If not a total but we have no amount yet, use this as amount
        else if (extractedData.amount === undefined) {
          extractedData.amount = numericValue;
        }
      }
    }
    else if (entityMap.date.includes(entityType)) {
      console.log(`Found date: ${normalizedValue}`);
      extractedData.date = normalizedValue;
    }
    else if (entityMap.currency.includes(entityType)) {
      console.log(`Found currency: ${normalizedValue}`);
      extractedData.currency = normalizedValue;
    }
    else if (entityMap.address.includes(entityType)) {
      console.log(`Found address: ${normalizedValue}`);
      
      // Enhanced location extraction
      try {
        // Create location object if it doesn't exist
        if (!extractedData.location || typeof extractedData.location === 'string') {
          extractedData.location = { 
            city: '',
            state: '',
            country: ''
          };
        }
        
        // Different patterns for address parsing
        // Try common formats: "street, city, state zip" or "street, city, state, country"
        const addressParts = normalizedValue.split(',').map(part => part.trim());
        console.log(`Address parts after split:`, addressParts);
        
        if (addressParts.length >= 2) {
          // Assign parts based on position and patterns
          // For US/Canada addresses: "street, city, state zip"
          if (addressParts.length === 3) {
            // Extract city from second part
            extractedData.location.city = addressParts[1];
            
            // Try to extract state from third part (may include zip code)
            const stateZipPart = addressParts[2];
            // Check if this part has a state abbreviation pattern or state name
            const stateMatch = stateZipPart.match(/([A-Z]{2})/);
            if (stateMatch) {
              extractedData.location.state = stateMatch[1];
            } else {
              // Just use everything before any numbers as the state
              const stateOnly = stateZipPart.replace(/\d+/g, '').trim();
              extractedData.location.state = stateOnly;
            }
            
            // Default country for 3-part address is usually US
            extractedData.location.country = 'US';
          } 
          // For international: "street, city, state, country"
          else if (addressParts.length >= 4) {
            extractedData.location.city = addressParts[1];
            extractedData.location.state = addressParts[2];
            extractedData.location.country = addressParts[3];
          } 
          // For simple: "street, city"
          else if (addressParts.length === 2) {
            extractedData.location.city = addressParts[1];
          }
          
          console.log(`Extracted location object:`, extractedData.location);
        } else {
          // Fallback - store full address as string
          console.log(`Using full address as location string: ${normalizedValue}`);
          extractedData.location = normalizedValue;
        }
      } catch (error) {
        console.error(`Error parsing address: ${error.message}`);
        // If anything fails, fallback to using the full string
        extractedData.location = normalizedValue;
      }
    }
    else if (entityMap.type.includes(entityType)) {
      const expenseType = mapReceiptTypeToExpenseType(normalizedValue);
      console.log(`Found expense type: ${expenseType} from "${normalizedValue}"`);
      extractedData.expenseType = expenseType;
    }
    else if (entityMap.tax.includes(entityType)) {
      const numericValue = extractNumericValue(normalizedValue);
      if (numericValue !== null) {
        console.log(`Found tax amount: ${numericValue} from "${normalizedValue}"`);
        extractedData.taxAmount = numericValue;
      }
    }
    else if (entityMap.location.includes(entityType)) {
      console.log(`Found location entity: ${normalizedValue}`);
      
      // If we already have a location object, enhance it
      if (extractedData.location && typeof extractedData.location === 'object') {
        if (entityType === 'city') {
          extractedData.location.city = normalizedValue;
        } else if (entityType === 'state') {
          extractedData.location.state = normalizedValue;
        } else if (entityType === 'country') {
          extractedData.location.country = normalizedValue;
        } else {
          // For generic location entities, prefer city
          if (!extractedData.location.city) {
            extractedData.location.city = normalizedValue;
          }
        }
        console.log(`Updated location object:`, extractedData.location);
      } 
      // If we don't have a location yet, create one
      else {
        if (entityType === 'city') {
          extractedData.location = { city: normalizedValue, state: '', country: '' };
        } else if (entityType === 'state') {
          extractedData.location = { city: '', state: normalizedValue, country: '' };
        } else if (entityType === 'country') {
          extractedData.location = { city: '', state: '', country: normalizedValue };
        } else {
          // For generic location entities, use as city
          extractedData.location = { city: normalizedValue, state: '', country: '' };
        }
        console.log(`Created new location object:`, extractedData.location);
      }
    }
    else if (entityType === 'line_item') {
      // Handle line items if present
      if (!extractedData.items) {
        extractedData.items = [];
      }
      
      // Extract line item details
      const item = {
        name: normalizedValue
      };
      
      // Try to find price and quantity in properties
      if (entity.properties) {
        for (const prop of entity.properties) {
          if (prop.type === 'line_item_price' || prop.type === 'price') {
            const price = extractNumericValue(prop.mentionText);
            if (price !== null) {
              item.price = price;
            }
          }
          else if (prop.type === 'line_item_quantity' || prop.type === 'quantity') {
            const quantity = extractNumericValue(prop.mentionText);
            if (quantity !== null) {
              item.quantity = quantity;
            }
          }
        }
      }
      
      extractedData.items.push(item);
    }
  }
  
  // Apply fallbacks and defaults
  
  // Fallbacks for missing data
  if (!extractedData.vendor && document.text) {
    // Try to extract vendor from first few lines
    const lines = document.text.split('\n').slice(0, 3);
    if (lines.length > 0) {
      extractedData.vendor = lines[0].trim();
      console.log(`Applied fallback vendor from first line: ${extractedData.vendor}`);
    }
  }
  
  // If dates are in different format, normalize them
  if (extractedData.date && typeof extractedData.date === 'string') {
    extractedData.date = normalizeDate(extractedData.date);
    console.log(`Normalized date to: ${extractedData.date}`);
  }
  
  // Make educated guess for expense type if not found
  if (!extractedData.expenseType && extractedData.vendor) {
    extractedData.expenseType = guessExpenseTypeFromVendor(extractedData.vendor);
    console.log(`Applied fallback expense type based on vendor: ${extractedData.expenseType}`);
  }
  
  // Try to extract total from text directly if it's missing
  if (extractedData.total === undefined && document.text) {
    console.log("Attempting to extract total from raw text as fallback");
    const extractedTotal = extractTotalFromText(document.text);
    if (extractedTotal !== null) {
      extractedData.total = extractedTotal;
      console.log(`Extracted total from raw text: ${extractedData.total}`);
      
      // Also set amount if it's missing
      if (extractedData.amount === undefined) {
        extractedData.amount = extractedTotal;
        console.log(`Also applied extracted total to amount: ${extractedData.amount}`);
      }
    }
  }
  
  // Ensure we have a total cost - if missing, copy from amount
  if (extractedData.total === undefined && extractedData.amount !== undefined) {
    extractedData.total = extractedData.amount;
    console.log(`Applied fallback total from amount: ${extractedData.total}`);
  }
  
  // If we still don't have a location, try to extract from the full text
  if (!extractedData.location) {
    console.log(`No location found, attempting to extract from full text`);
    extractedData.location = extractLocationFromText(document.text || '');
    console.log(`Extracted location from text:`, extractedData.location);
  }
  
  // Ensure location exists as an object even if empty
  if (!extractedData.location) {
    extractedData.location = { city: '', state: '', country: '' };
    console.log(`Created empty location object as fallback`);
  } else if (typeof extractedData.location === 'string') {
    // Convert string location to object if needed
    const locationString = extractedData.location;
    extractedData.location = { 
      city: locationString,
      state: '',
      country: ''
    };
    console.log(`Converted string location to object:`, extractedData.location);
  }
  
  // Add default currency if missing
  if (!extractedData.currency) {
    extractedData.currency = 'USD';
  }
  
  // Add default expense type if missing
  if (!extractedData.expenseType) {
    extractedData.expenseType = 'other';
  }
  
  // Add empty items array if missing
  if (!extractedData.items) {
    extractedData.items = [];
  }
  
  console.log('Final extracted receipt data:', extractedData);
  return extractedData;
}

/**
 * Extract numeric value from string, handling various formats
 */
function extractNumericValue(value) {
  if (!value) return null;
  
  // Check for common currency patterns first, especially with currency codes like CA$
  const currencyMatch = value.match(/(?:[A-Z]{1,3}\$|\$|€|£)?([\d,.]+)/);
  if (currencyMatch && currencyMatch[1]) {
    const cleanedValue = currencyMatch[1].replace(/,/g, '.');  // Replace commas with dots
    const numericValue = parseFloat(cleanedValue);
    if (!isNaN(numericValue)) {
      return numericValue;
    }
  }
  
  // If no currency pattern, try a more generic approach
  const numericMatch = value.replace(/[^\d.,\-]/g, '')
    .replace(/,/g, '.')  // Replace commas with dots for international formats
    .match(/([-]?\d+\.?\d*)/);
    
  if (numericMatch && numericMatch[0]) {
    const numericValue = parseFloat(numericMatch[0]);
    if (!isNaN(numericValue)) {
      return numericValue;
    }
  }
  
  // Last attempt - try to find any number-like pattern
  const lastMatch = value.match(/(\d+[.,]\d+)/);
  if (lastMatch && lastMatch[0]) {
    const numericValue = parseFloat(lastMatch[0].replace(',', '.'));
    if (!isNaN(numericValue)) {
      return numericValue;
    }
  }
  
  return null;
}

/**
 * Extract location information from receipt text
 */
function extractLocationFromText(text) {
  // Common US city+state patterns like "San Francisco, CA" or "New York, NY"
  const cityStatePattern = /([A-Z][a-zA-Z\.\s]+),\s*([A-Z]{2})/g;
  let cityStateMatches = Array.from(text.matchAll(cityStatePattern));
  
  // If we found city/state pairs
  if (cityStateMatches.length > 0) {
    // Take the first match as the most likely location
    const [_, city, state] = cityStateMatches[0];
    return {
      city: city.trim(),
      state: state.trim(),
      country: 'US' // Assume US for state abbreviations
    };
  }
  
  // Try to find city names from a predefined list of major cities
  const majorCities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'San Francisco', 'Seattle', 'Denver', 'Boston', 'Las Vegas', 'Detroit', 'Atlanta',
    'London', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Vancouver', 'Berlin',
    'Madrid', 'Rome', 'Amsterdam', 'Dubai', 'Singapore', 'Hong Kong', 'Miami'
  ];
  
  // Create a regex that matches any of these cities
  const cityRegex = new RegExp(`\\b(${majorCities.join('|')})\\b`, 'i');
  const cityMatch = text.match(cityRegex);
  
  if (cityMatch) {
    return {
      city: cityMatch[1],
      state: '',
      country: ''
    };
  }
  
  // If we can't extract structured location data, return a blank object
  return {
    city: '',
    state: '',
    country: ''
  };
}

/**
 * Extract a total amount from receipt text
 */
function extractTotalFromText(text) {
  // Common patterns for total in receipts
  const patterns = [
    // Pattern for "Total: $X.XX" or "Total $X.XX"
    /Total(?:\s*:)?\s+(?:[A-Z]{1,3}\$|\$|€|£)?(\d+[.,]\d{2})/i,
    
    // Pattern for "Total CA$X.XX" (Uber specific)
    /Total\s+CA\$(\d+[.,]\d{2})/i,
    
    // Pattern for "Total: X.XX currency"
    /Total(?:\s*:)?\s+(\d+[.,]\d{2})/i,
    
    // Pattern for "TOTAL X.XX"
    /TOTAL\s+(\d+[.,]\d{2})/i,
    
    // Pattern for "Grand Total: $X.XX"
    /Grand\s+Total(?:\s*:)?\s+(?:[A-Z]{1,3}\$|\$|€|£)?(\d+[.,]\d{2})/i,
    
    // Pattern for lines containing both "total" and a price
    /.*total.*?(?:[A-Z]{1,3}\$|\$|€|£)?(\d+[.,]\d{2}).*/i
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return extractNumericValue(match[1]);
    }
  }

  // If no match with patterns, try simple scan for "$X.XX" or "X.XX" after word "Total"
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^total$/i) || line.match(/^total\s*:/i)) {
      // Check the next line for a numeric value
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const numericValue = extractNumericValue(nextLine);
        if (numericValue !== null) {
          return numericValue;
        }
      }
    }
  }

  // As a last resort, look for any currency values with CA$ prefix (Uber specific)
  const caMatch = text.match(/CA\$(\d+[.,]\d{2})/);
  if (caMatch && caMatch[1]) {
    return extractNumericValue(caMatch[1]);
  }

  return null;
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr) {
  // Try to parse the date
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  } catch (e) {
    console.error('Error parsing date:', e);
  }
  
  // If date parsing fails, try to handle common formats
  // MM/DD/YYYY
  const mmddyyyy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mmddyyyy) {
    const [_, month, day, year] = mmddyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    const [_, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Return the original string if no patterns match
  return dateStr;
}

/**
 * Map receipt type to expense type
 */
function mapReceiptTypeToExpenseType(receiptType) {
  const type = receiptType.toLowerCase();
  
  if (type.includes('restaurant') || type.includes('food') || type.includes('meal')) {
    return 'meals';
  }
  
  if (type.includes('hotel') || type.includes('lodging') || type.includes('accommod')) {
    return 'accommodation';
  }
  
  if (type.includes('transport') || type.includes('uber') || type.includes('taxi') || 
      type.includes('train') || type.includes('flight')) {
    return 'transportation';
  }
  
  if (type.includes('entertain') || type.includes('movie') || type.includes('show')) {
    return 'entertainment';
  }
  
  if (type.includes('office') || type.includes('supplies')) {
    return 'office';
  }
  
  if (type.includes('business')) {
    return 'business';
  }
  
  return 'other';
}

/**
 * Make an educated guess about expense type based on vendor name
 */
function guessExpenseTypeFromVendor(vendor) {
  const v = vendor.toLowerCase();
  
  // Restaurants and food
  if (v.includes('restaurant') || v.includes('cafe') || v.includes('coffee') || 
      v.includes('pizza') || v.includes('food') || v.includes('bakery') ||
      v.includes('mcdonald') || v.includes('subway') || v.includes('starbucks')) {
    return 'meals';
  }
  
  // Hotels and accommodation
  if (v.includes('hotel') || v.includes('inn') || v.includes('lodge') || 
      v.includes('marriott') || v.includes('hilton') || v.includes('airbnb')) {
    return 'accommodation';
  }
  
  // Transportation
  if (v.includes('airline') || v.includes('air') || v.includes('taxi') || 
      v.includes('uber') || v.includes('lyft') || v.includes('train') ||
      v.includes('rental') || v.includes('hertz') || v.includes('avis')) {
    return 'transportation';
  }
  
  // Entertainment
  if (v.includes('cinema') || v.includes('theater') || v.includes('theatre') || 
      v.includes('ticket') || v.includes('entertainment')) {
    return 'entertainment';
  }
  
  // Office supplies
  if (v.includes('office') || v.includes('staples') || v.includes('paper') || 
      v.includes('supplies') || v.includes('depot')) {
    return 'office';
  }
  
  // Default to other
  return 'other';
}