import { createClient } from '../lib/supabase/server';
import fs from 'fs';
import path from 'path';

async function fixUserRoles() {
  try {
    const supabase = createClient();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'sql', 'migrations', 'fix_user_roles_constraint.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Running SQL migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('Successfully fixed user roles constraint!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
fixUserRoles();
