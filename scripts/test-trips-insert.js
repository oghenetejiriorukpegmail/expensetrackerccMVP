// Test that we can now insert a trip with a UUID user_id
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// First, get a user ID from the profiles table
const getUserIdQuery = {
  action: 'query',
  query: `SELECT id FROM profiles LIMIT 1;`
};

const getUserIdFile = path.join(__dirname, 'get_userid.json');
fs.writeFileSync(getUserIdFile, JSON.stringify(getUserIdQuery));

let userId;
try {
  console.log('Getting a user ID from the profiles table...');
  const userIdResult = execSync(`cat ${getUserIdFile} | supabase-mcp-claude`, {
    env: process.env
  });
  
  console.log('User ID query result:', userIdResult.toString());
  
  // Try to parse the JSON response
  try {
    const userData = JSON.parse(userIdResult.toString());
    if (userData && userData.data && userData.data.length > 0) {
      userId = userData.data[0].id;
      console.log('Found user ID:', userId);
    } else {
      // Generate a random UUID for testing
      userId = uuidv4();
      console.log('No user found, using a random UUID for testing:', userId);
    }
  } catch (parseError) {
    // Generate a random UUID for testing
    userId = uuidv4();
    console.log('Error parsing user data, using a random UUID for testing:', userId);
  }
} catch (error) {
  console.error('Error getting user ID:', error.message);
  // Generate a random UUID for testing
  userId = uuidv4();
  console.log('Using a random UUID for testing:', userId);
} finally {
  // Clean up
  if (fs.existsSync(getUserIdFile)) {
    fs.unlinkSync(getUserIdFile);
  }
}

// Now test inserting a trip with this UUID
const tripInsertQuery = {
  action: 'query',
  query: `
    INSERT INTO trips (user_id, name, description, status)
    VALUES ('${userId}', 'Test Trip', 'Created to test UUID compatibility', 'planned')
    RETURNING *;
  `
};

const insertTripFile = path.join(__dirname, 'insert_trip.json');
fs.writeFileSync(insertTripFile, JSON.stringify(tripInsertQuery));

try {
  console.log('Inserting a test trip with UUID user_id...');
  const insertResult = execSync(`cat ${insertTripFile} | supabase-mcp-claude`, {
    env: process.env
  });
  
  console.log('Trip insert result:', insertResult.toString());
} catch (error) {
  console.error('Error inserting trip:', error.message);
} finally {
  // Clean up
  if (fs.existsSync(insertTripFile)) {
    fs.unlinkSync(insertTripFile);
  }
}