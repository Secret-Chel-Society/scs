const fs = require('fs');
const path = require('path');

// List of files that need to be fixed
const filesToFix = [
  'app/api/admin/run-migration/rls-season-registrations/route.ts',
  'app/api/admin/run-migration/forum-tables/route.ts',
  'app/api/admin/run-migration/ensure-discord-tables/route.ts',
  'app/api/admin/run-migration/discord-users-table/route.ts',
  'app/api/admin/run-migration/discord-sync-failures-table/route.ts'
];

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    const pattern1 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*,\s*\{([^}]*)\}\s*\)/g;
    
    // Pattern 2: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const pattern2 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\)/g;
    
    // Pattern 3: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    const pattern3 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*""\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*""\s*,\s*\{([^}]*)\}\s*\)/g;
    
    // Pattern 4: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    const pattern4 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*""\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*""\s*\)/g;
    
    let modified = false;
    
    // Fix pattern 1
    content = content.replace(pattern1, (match, varName, config) => {
      modified = true;
      return `// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const ${varName} = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {${config}})
  : null`;
    });
    
    // Fix pattern 2
    content = content.replace(pattern2, (match, varName) => {
      modified = true;
      return `// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const ${varName} = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null`;
    });
    
    // Fix pattern 3
    content = content.replace(pattern3, (match, varName, config) => {
      modified = true;
      return `// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const ${varName} = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {${config}})
  : null`;
    });
    
    // Fix pattern 4
    content = content.replace(pattern4, (match, varName) => {
      modified = true;
      return `// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured')
}

const ${varName} = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null`;
    });
    
    // Add null check to POST/PUT/DELETE functions
    if (modified) {
      // Find the first function that uses the supabase client
      const functionPattern = /export\s+async\s+function\s+(POST|PUT|DELETE|GET)\s*\([^)]*\)\s*\{/g;
      const functionMatch = functionPattern.exec(content);
      
      if (functionMatch) {
        const functionStart = functionMatch.index;
        const functionName = functionMatch[1];
        const varName = content.match(/const\s+(\w+)\s*=\s*supabaseUrl/)?.[1] || 'supabase';
        
        // Find the opening brace of the function
        let braceCount = 0;
        let pos = functionStart;
        while (pos < content.length) {
          if (content[pos] === '{') {
            braceCount++;
            if (braceCount === 1) {
              // Found the opening brace, insert null check
              const insertPos = pos + 1;
              const nullCheck = `
    if (!${varName}) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        },
        { status: 500 },
      )
    }

`;
              content = content.slice(0, insertPos) + nullCheck + content.slice(insertPos);
              break;
            }
          }
          pos++;
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⚠️  No changes needed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
console.log('🔧 Fixing Supabase environment variable issues...\n');

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fixFile(filePath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✅ All files processed!');
