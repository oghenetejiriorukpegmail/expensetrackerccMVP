// Test Google Document AI authentication
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verify environment variables are set
console.log('Environment Variables:');
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID);
console.log('GOOGLE_PROCESSOR_ID:', process.env.GOOGLE_PROCESSOR_ID);
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Set (hidden for security)' : 'Not set');

// Check if the credentials file exists
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'google_document_ai.json');

console.log(`\nChecking for credentials file at: ${credentialsPath}`);
if (fs.existsSync(credentialsPath)) {
  console.log('Credentials file exists.');
  
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Credentials file contents:');
    console.log(JSON.stringify({
      type: credentials.type,
      project_id: credentials.project_id,
      processor_id: credentials.processor_id
    }, null, 2));
  } catch (error) {
    console.error('Error reading credentials file:', error.message);
  }
} else {
  console.error('Credentials file does not exist.');
  
  // Create default credentials file
  try {
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID || '498473173877',
      processor_id: process.env.GOOGLE_PROCESSOR_ID || '83f27e6e66c0e400'
    };
    
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    console.log(`Created default credentials file at ${credentialsPath}`);
  } catch (error) {
    console.error('Error creating credentials file:', error.message);
  }
}

console.log('\nGoogle Document AI API Configuration:');
console.log(`Project ID: ${process.env.GOOGLE_PROJECT_ID || '498473173877'}`);
console.log(`Processor ID: ${process.env.GOOGLE_PROCESSOR_ID || '83f27e6e66c0e400'}`);

console.log('\nSimulating OAuth2 token generation:');
console.log('For a full implementation, you would need to:');
console.log('1. Create a service account in Google Cloud Console');
console.log('2. Download the service account key (JSON)');
console.log('3. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the key file path');
console.log('4. Use the google-auth-library to generate a JWT token');
console.log('5. Exchange the JWT for an access token');

// Mock token generation
console.log('\nMock token generation:');
console.log('access_token: mock-token');
console.log('token_type: Bearer');
console.log('expires_in: 3600');

console.log('\nTest complete.');