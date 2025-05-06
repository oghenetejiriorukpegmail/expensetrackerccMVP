// CommonJS file to setup Netlify functions during build
const fs = require('fs');
const path = require('path');

// Create functions directory if it doesn't exist
const functionsDir = path.join(__dirname, '.netlify', 'functions-internal');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
  console.log('Created functions directory', functionsDir);
}

// List the Netlify functions and copy them
const sourceDir = path.join(__dirname, 'netlify', 'functions');
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  console.log('Found Netlify functions:', files);
  
  // Copy all function files
  files.forEach((file) => {
    if (file.endsWith('.js')) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(functionsDir, file);
      
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied function: ${file}`);
    }
  });
  
  console.log('All functions copied successfully');
} else {
  console.warn('Netlify functions directory not found:', sourceDir);
}

// Everything was successful
console.log('Netlify functions setup completed');