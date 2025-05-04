// Create a configuration file for the Supabase MCP
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/admin/expensetrackercc/.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join('/home/admin/.nvm/versions/node/v22.15.0/lib/node_modules/supabase-mcp/dist/esm/config.js');

// Create the config content
const configContent = `// MCP Configuration
export const supabaseConfig = {
  url: "${process.env.SUPABASE_URL}",
  anonKey: "${process.env.SUPABASE_ANON_KEY}",
  serviceRoleKey: "${process.env.SUPABASE_SERVICE_KEY}"
};

export const mcpConfig = {
  port: 3000,
  host: "localhost", 
  apiKey: "your-api-key"
};

export function validateConfig() {
  if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
    throw new Error("Missing required Supabase configuration.");
  }
  return true;
}
`;

// Write the config file
fs.writeFileSync(configPath, configContent, 'utf8');
console.log(`Supabase MCP config written to ${configPath}`);