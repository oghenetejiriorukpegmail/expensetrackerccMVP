// This script prepares the Google credentials for Netlify functions
const fs = require('fs');
const path = require('path');

console.log('Setting up Google credentials for Netlify functions...');

try {
  // Check if the Google credentials file exists
  const credentialsPath = path.resolve(process.cwd(), 'google_document_ai.json');
  
  if (fs.existsSync(credentialsPath)) {
    console.log('Found Google credentials file at:', credentialsPath);
    
    // Read the credentials file
    const credentials = fs.readFileSync(credentialsPath, 'utf8');
    
    // Create a Netlify environment variable file if it doesn't exist
    const envFilePath = path.resolve(process.cwd(), '.env');
    
    // Check if existing .env file
    let envContent = '';
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, 'utf8');
    }
    
    // Add the Google credentials as an environment variable if it doesn't exist
    if (!envContent.includes('GOOGLE_CREDENTIALS=')) {
      console.log('Adding Google credentials to .env file');
      const credentialsJSON = JSON.stringify(JSON.parse(credentials));
      
      // Add the credentials to the .env file
      fs.appendFileSync(
        envFilePath, 
        `\nGOOGLE_CREDENTIALS=${credentialsJSON}\n`
      );
      
      console.log('Added Google credentials to .env file');
    } else {
      console.log('Google credentials already exists in .env file');
    }
    
    // Also copy the credentials to the functions directory for bundling
    const functionsPath = path.resolve(process.cwd(), 'netlify/functions/google_document_ai.json');
    fs.copyFileSync(credentialsPath, functionsPath);
    console.log('Copied Google credentials to functions directory');
  } else {
    console.warn('Google credentials file not found at:', credentialsPath);
    console.warn('Netlify functions will need GOOGLE_CREDENTIALS env var to work correctly');
  }
  
  console.log('Google credentials setup complete');
} catch (error) {
  console.error('Error setting up Google credentials:', error);
}