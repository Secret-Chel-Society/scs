const fs = require('fs');
const path = require('path');

// Get all remaining files that need to be fixed
const filesToFix = [
  'app/api/admin/run-migration/token-system/route.ts',
  'app/api/admin/run-migration/waiver-priority-table/route.ts',
  'app/api/admin/run-migration/verification-function/route.ts',
  'app/api/admin/run-migration/trades-table-structure/route.ts',
  'app/api/admin/run-migration/function-exists-function/route.ts',
  'app/api/admin/run-migration/fix-waiver-priority/route.ts',
  'app/api/admin/run-migration/fix-team-managers-rls/route.ts',
  'app/api/admin/run-migration/fix-season-numbers/route.ts',
  'app/api/admin/run-migration/fix-season-id-type/route.ts',
  'app/api/admin/run-migration/fix-discord-connections/route.ts',
  'app/api/admin/run-migration/ensure-verification-tokens/route.ts',
  'app/api/admin/run-migration/ensure-season-numbers/route.ts',
  'app/api/admin/run-migration/add-ea-match-data/route.ts',
  'app/api/admin/run-migration/route.ts'
];

// Function to fix a single file
function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const pattern1 = /const\s+(\w+)\s*=\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!/g;
    
    // Pattern 2: const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const pattern2 = /const\s+(\w+)\s*=\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*""/g;
    
    // Pattern 3: process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const pattern3 = /process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*""/g;
    
    // Fix pattern 1
    content = content.replace(pattern1, (match, varName) => {
      modified = true;
      return `const ${varName} = process.env.NEXT_PUBLIC_SUPABASE_URL`;
    });
    
    // Fix pattern 2
    content = content.replace(pattern2, (match, varName) => {
      modified = true;
      return `const ${varName} = process.env.NEXT_PUBLIC_SUPABASE_URL`;
    });
    
    // Fix pattern 3
    content = content.replace(pattern3, (match) => {
      modified = true;
      return `process.env.NEXT_PUBLIC_SUPABASE_URL`;
    });
    
    // Now fix the createClient calls
    const createClientPattern = /const\s+(\w+)\s*=\s*createClient\(\s*(\w+)\s*,\s*(\w+)\s*\)/g;
    content = content.replace(createClientPattern, (match, varName, urlVar, keyVar) => {
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
    
    // Add null check to POST/PUT/DELETE/GET functions
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
console.log('🔧 Fixing remaining Supabase environment variable issues...\n');

filesToFix.forEach(filePath => {
  fixFile(filePath);
});

console.log('\n✅ All files processed!');
