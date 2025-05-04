// This script sets up the testing environment and validates that all
// configurations are in place before running the tests.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check that vitest.config.ts exists
if (!fs.existsSync(path.join(__dirname, 'vitest.config.ts'))) {
  console.error('Error: vitest.config.ts not found');
  process.exit(1);
}

// Check that the test directory exists
if (!fs.existsSync(path.join(__dirname, 'test'))) {
  console.error('Error: test directory not found');
  process.exit(1);
}

// Check for necessary dependencies
try {
  // Read package.json
  const packageJsonRaw = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
  const packageJson = JSON.parse(packageJsonRaw);
  const devDependencies = packageJson.devDependencies || {};
  
  let installCommands = [];
  
  if (!devDependencies['@vitejs/plugin-vue']) {
    installCommands.push('npm install --save-dev @vitejs/plugin-vue');
  }
  
  if (!devDependencies['@vue/test-utils']) {
    installCommands.push('npm install --save-dev @vue/test-utils');
  }
  
  if (!devDependencies['jsdom']) {
    installCommands.push('npm install --save-dev jsdom');
  }
  
  // Install each dependency separately to avoid conflicts
  for (const cmd of installCommands) {
    console.log(`Running: ${cmd}`);
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (err) {
      console.warn(`Warning: Failed to install dependency: ${err.message}`);
    }
  }
  
  // Update package.json scripts if needed
  let updated = false;
  
  if (!packageJson.scripts.test || packageJson.scripts.test === 'vitest') {
    packageJson.scripts.test = 'vitest run';
    updated = true;
  }
  
  if (!packageJson.scripts['test:watch']) {
    packageJson.scripts['test:watch'] = 'vitest';
    updated = true;
  }
  
  if (!packageJson.scripts['test:coverage']) {
    packageJson.scripts['test:coverage'] = 'vitest run --coverage';
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(
      path.join(__dirname, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('Updated package.json scripts for testing');
  }
  
} catch (error) {
  console.error('Error checking or installing dependencies:', error);
  process.exit(1);
}

console.log('Test setup complete! You can now run:');
console.log('  npm test            - Run tests once');
console.log('  npm run test:watch  - Run tests in watch mode');
console.log('  npm run test:coverage - Run tests with coverage report');