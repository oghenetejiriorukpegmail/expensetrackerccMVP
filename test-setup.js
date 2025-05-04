// This script sets up the testing environment and validates that all
// configurations are in place before running the tests.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  // Check if @vitejs/plugin-vue is installed
  const packageJson = require('./package.json');
  const devDependencies = packageJson.devDependencies || {};
  
  if (!devDependencies['@vitejs/plugin-vue']) {
    console.log('Installing @vitejs/plugin-vue for testing...');
    execSync('npm install --save-dev @vitejs/plugin-vue', { stdio: 'inherit' });
  }
  
  if (!devDependencies['@vue/test-utils']) {
    console.log('Installing @vue/test-utils for component testing...');
    execSync('npm install --save-dev @vue/test-utils', { stdio: 'inherit' });
  }
  
  if (!devDependencies['jsdom']) {
    console.log('Installing jsdom for testing DOM interactions...');
    execSync('npm install --save-dev jsdom', { stdio: 'inherit' });
  }
  
  if (!devDependencies['@vitest/coverage-v8']) {
    console.log('Installing @vitest/coverage-v8 for test coverage...');
    execSync('npm install --save-dev @vitest/coverage-v8', { stdio: 'inherit' });
  }
  
} catch (error) {
  console.error('Error checking or installing dependencies:', error);
  process.exit(1);
}

// Update package.json scripts if needed
try {
  const packageJson = require('./package.json');
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
  
  if (!packageJson.scripts['test:ui']) {
    packageJson.scripts['test:ui'] = 'vitest --ui';
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
  console.error('Error updating package.json:', error);
  process.exit(1);
}

console.log('Test setup complete! You can now run:');
console.log('  npm test            - Run tests once');
console.log('  npm run test:watch  - Run tests in watch mode');
console.log('  npm run test:coverage - Run tests with coverage report');