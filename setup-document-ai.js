// Setup Document AI credentials
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the credentials file if it doesn't exist
const credentialsPath = path.join(__dirname, 'google_document_ai.json');

if (!fs.existsSync(credentialsPath)) {
  console.log('Creating Document AI credentials file...');
  
  const credentials = {
    "type": "service_account",
    "project_id": process.env.GOOGLE_PROJECT_ID || "498473173877",
    "processor_id": process.env.GOOGLE_PROCESSOR_ID || "83f27e6e66c0e400"
  };
  
  fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
  console.log('Document AI credentials file created successfully.');
} else {
  console.log('Document AI credentials file already exists.');
}

// Set environment variables if not already set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
  console.log('Set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
}

if (!process.env.GOOGLE_PROJECT_ID) {
  process.env.GOOGLE_PROJECT_ID = "498473173877";
  console.log('Set GOOGLE_PROJECT_ID environment variable.');
}

if (!process.env.GOOGLE_PROCESSOR_ID) {
  process.env.GOOGLE_PROCESSOR_ID = "83f27e6e66c0e400";
  console.log('Set GOOGLE_PROCESSOR_ID environment variable.');
}

console.log('Document AI setup complete.');