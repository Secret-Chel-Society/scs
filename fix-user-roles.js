// Simple script to fix user roles constraint
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'sql', 'migrations', 'fix_user_roles_constraint.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Execute the SQL using psql
console.log('Running SQL migration to fix user roles constraint...');
try {
  // Get database connection string from environment variables
  const databaseUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('Database URL not found in environment variables');
  }

  // Execute the SQL using psql
  execSync(`psql "${databaseUrl}" -c "${sql.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}"`, {
    stdio: 'inherit',
    shell: true
  });
  
  console.log('Successfully fixed user roles constraint!');
} catch (error) {
  console.error('Error executing SQL:', error.message);
  process.exit(1);
}
