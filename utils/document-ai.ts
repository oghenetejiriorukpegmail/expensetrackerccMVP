import { ExtractedReceipt } from './ai-processing';
import { useRuntimeConfig } from '#app';
import { getGoogleAccessToken } from './google-auth';

/**
 * Process a receipt image with Google Document AI
 * @param imageBase64 Base64 string of the receipt image
 * @returns Extracted receipt data
 * @throws Error if processing fails
 */
export async function processReceiptWithDocumentAI(
  imageBase64: string
): Promise<ExtractedReceipt> {
  const config = useRuntimeConfig();
  
  // Prepare the image data
  let base64Data = imageBase64;
  let mimeType = 'image/jpeg'; // Default mime type
  
  if (base64Data.includes('base64,')) {
    // Extract mime type from the data URL if available
    const matches = base64Data.match(/^data:([^;]+);base64,/);
    if (matches && matches.length > 1) {
      mimeType = matches[1];
      // Mime type detected from data URL
    }
    
    // Extract the base64 content
    base64Data = base64Data.split('base64,')[1];
  }
  
  // Validate the base64 data
  if (!base64Data || base64Data.trim() === '') {
    throw new Error('Empty or invalid base64 data provided');
  }
  
  // Check if data length is a valid base64 length (multiple of 4)
  const paddingNeeded = (4 - (base64Data.length % 4)) % 4;
  if (paddingNeeded > 0) {
    // Adding padding characters to base64 data
    base64Data += '='.repeat(paddingNeeded);
  }
  
  // Document AI processor URL using runtime config with defaults
  const projectId = config.public.googleProjectId || 'gen-lang-client-0754899926';
  
  // The processor ID should be obtained from Google Cloud Console > Document AI > Processors
  // Do NOT use the private_key_id as the processor ID
  const processorId = config.public.googleProcessorId;
  
  if (!processorId) {
    console.error('Document AI processor ID is not configured. Please set GOOGLE_PROCESSOR_ID environment variable.');
    throw new Error('Document AI processor ID is not configured');
  }
  
  // Format according to latest documentation
  const location = 'us'; // Change this if using a different region
  const processorUrl = `https://us-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;
  
  try {
    console.log('Getting authentication token for Document AI...');
    // Get OAuth2 token
    const accessToken = await getGoogleAccessToken();
    
    // Check if we got a fallback token
    if (accessToken === 'FALLBACK_AI_PROVIDER') {
      console.log('Using fallback AI provider instead of Document AI');
      throw new Error('FALLBACK_AI_REQUESTED');
    }
    
    if (!accessToken) {
      throw new Error('Failed to get Google authentication token');
    }
    
    console.log('Sending request to Document AI...', { projectId, processorId });
    
    // Use the mime type we detected earlier
    console.log(`Sending request to Document AI with mime type: ${mimeType}`);
    
    // Prepare request according to latest documentation
    const response = await fetch(processorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        rawDocument: {
          content: base64Data,
          mimeType: mimeType
        },
        // Add processing options for better results
        processOptions: {
          // For OCR-based processing
          ocrConfig: {
            enableImageQualityScores: true
          }
        }
      })
    });
    
    if (!response.ok) {
      // Try to parse error response as JSON first
      let errorMessage = `Document AI failed: ${response.status} ${response.statusText}`;
      let errorDetails = '';
      
      try {
        const errorJson = await response.json();
        console.error('Document AI error response:', JSON.stringify(errorJson, null, 2));
        
        // Extract more detailed error information if available
        if (errorJson.error) {
          errorMessage = `Document AI error: ${errorJson.error.message || errorJson.error}`;
          errorDetails = errorJson.error.details || JSON.stringify(errorJson.error);
        }
      } catch (parseError) {
        // If not JSON, get raw text
        const errorText = await response.text();
        console.error('Document AI error response (text):', errorText);
        errorDetails = errorText;
      }
      
      // Add detailed information about potential solutions based on status code and error messages
      if (response.status === 400) {
        errorDetails += '\nThis may be due to invalid request format, check your processor ID and document format.';
        
        // Specific handling for the "Invalid image content" error
        if (errorMessage.includes('Invalid image content')) {
          errorDetails += `\n\nInvalid image content error typically occurs when:
1. The image format is not supported (try JPEG or PNG)
2. The image dimensions are too large or too small
3. The image resolution is too high or too low
4. The image is corrupted or improperly encoded
5. The base64 encoding is malformed

Try using a different image or converting the current image to a standard format like JPEG.`;
        }
      } else if (response.status === 401 || response.status === 403) {
        errorDetails += '\nAuthentication or permission error. Check your service account credentials and permissions.';
      } else if (response.status === 404) {
        errorDetails += '\nProcessor not found. Verify the processor ID exists in your Google Cloud project.';
      } else if (response.status >= 500) {
        errorDetails += '\nServer error from Google Document AI. This may be a temporary issue, retry later.';
      }
      
      throw new Error(`${errorMessage}\n${errorDetails}`);
    }
    
    const data = await response.json();
    // Document AI response received
    
    // Extract document entities
    const document = data.document;
    
    // Handle different processor versions that might have different response structures
    const entities = document.entities || document.entityMentions || [];
    
    // Map to our ExtractedReceipt format
    const extractedData: ExtractedReceipt = {
      confidence: document.textChangeProbs?.[0] || document.pages?.[0]?.imageQualityScores?.qualityScore || 0.7
    };
    
    // Process entities from the document
    
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
    
    // Process entities with more flexible matching
    console.log('===== Starting entity processing =====');
    console.log('Entity map keys:', Object.keys(entityMap));
    console.log('=================================');
    
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
          
          // If by the end of processing we still don't have a total, 
          // it will be copied from amount in the fallback section
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
    
    console.log('Extracted receipt data:', extractedData);
    return extractedData;
  } catch (error) {
    console.error('Error processing receipt with Document AI:', error);
    throw error;
  }
}

/**
 * Map receipt type to expense type
 */
function mapReceiptTypeToExpenseType(receiptType: string): string {
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
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
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
 * Make an educated guess about expense type based on vendor name
 */
function guessExpenseTypeFromVendor(vendor: string): string {
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

/**
 * Extract location information from receipt text
 * @param text The full text of the receipt
 * @returns A location object or string
 */
function extractLocationFromText(text: string): { city: string, state: string, country: string } | string {
  console.log('Attempting to extract location from full text');
  
  // Common US city+state patterns like "San Francisco, CA" or "New York, NY"
  const cityStatePattern = /([A-Z][a-zA-Z\.\s]+),\s*([A-Z]{2})/g;
  let cityStateMatches = Array.from(text.matchAll(cityStatePattern));
  
  // If we found city/state pairs
  if (cityStateMatches.length > 0) {
    console.log(`Found ${cityStateMatches.length} city/state patterns in text`);
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
    console.log(`Found city name in text: ${cityMatch[1]}`);
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
 * @param text The full text of the receipt
 * @returns The extracted total amount or null if not found
 */
function extractTotalFromText(text: string): number | null {
  console.log('Extracting total from text');

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
      console.log(`Matched total pattern: ${pattern} with value: ${match[1]}`);
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
          console.log(`Found total on line ${i} and value ${numericValue} on next line`);
          return numericValue;
        }
      }
    }
  }

  // As a last resort, look for any currency values with CA$ prefix (Uber specific)
  const caMatch = text.match(/CA\$(\d+[.,]\d{2})/);
  if (caMatch && caMatch[1]) {
    console.log(`Found CA$ amount: ${caMatch[1]}`);
    return extractNumericValue(caMatch[1]);
  }

  console.log('No total found in text');
  return null;
}

/**
 * Extract numeric value from string, handling various formats
 * @param value String that potentially contains a number
 * @returns Extracted number or null if not found
 */
function extractNumericValue(value: string): number | null {
  if (!value) return null;
  
  // Check for common currency patterns first, especially with currency codes like CA$
  const currencyMatch = value.match(/(?:[A-Z]{1,3}\$|\$|€|£)?([\d,.]+)/);
  if (currencyMatch && currencyMatch[1]) {
    const cleanedValue = currencyMatch[1].replace(/,/g, '.');  // Replace commas with dots
    const numericValue = parseFloat(cleanedValue);
    if (!isNaN(numericValue)) {
      console.log(`Extracted currency value: ${numericValue} from "${value}"`);
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
      console.log(`Extracted generic numeric value: ${numericValue} from "${value}"`);
      return numericValue;
    }
  }
  
  // Last attempt - try to find any number-like pattern
  const lastMatch = value.match(/(\d+[.,]\d+)/);
  if (lastMatch && lastMatch[0]) {
    const numericValue = parseFloat(lastMatch[0].replace(',', '.'));
    if (!isNaN(numericValue)) {
      console.log(`Last resort match: ${numericValue} from "${value}"`);
      return numericValue;
    }
  }
  
  return null;
}