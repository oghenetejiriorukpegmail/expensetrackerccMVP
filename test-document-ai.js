// Test Document AI integration
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run setup
import('./setup-document-ai.js').catch(err => console.error('Error importing setup:', err));

// Verify environment variables are set
console.log('Environment Variables:');
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID);
console.log('GOOGLE_PROCESSOR_ID:', process.env.GOOGLE_PROCESSOR_ID);
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Set (hidden for security)' : 'Not set');

// Check if the credentials file exists
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'google_document_ai.json');
if (fs.existsSync(credentialsPath)) {
  console.log(`Credentials file exists at: ${credentialsPath}`);
  
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Credentials file contents:');
    console.log(JSON.stringify({
      ...credentials,
      // Redact any sensitive fields for security
      private_key: credentials.private_key ? '[REDACTED]' : undefined,
      private_key_id: credentials.private_key_id ? '[REDACTED]' : undefined,
    }, null, 2));
  } catch (error) {
    console.error('Error reading credentials file:', error.message);
  }
} else {
  console.error(`Credentials file does not exist at: ${credentialsPath}`);
}

console.log('\nDocument AI Configuration Test:');
console.log(`Project ID: ${process.env.GOOGLE_PROJECT_ID || '498473173877'}`);
console.log(`Processor ID: ${process.env.GOOGLE_PROCESSOR_ID || '83f27e6e66c0e400'}`);

console.log('\nAPI URL that will be used:');
const projectId = process.env.GOOGLE_PROJECT_ID || '498473173877';
const processorId = process.env.GOOGLE_PROCESSOR_ID || '83f27e6e66c0e400';
const processorUrl = `https://us-documentai.googleapis.com/v1/projects/${projectId}/locations/us/processors/${processorId}:process`;
console.log(processorUrl);

console.log('\nTest complete.');