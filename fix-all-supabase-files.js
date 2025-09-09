const fs = require('fs');
const path = require('path');

// Get all files that need to be fixed
const filesToFix = [
  'app/news/daily-recap/page.tsx',
  'app/api/webhooks/supabase/user-confirmed/route.ts',
  'app/api/verify-account/route.ts',
  'app/api/teams/route.ts',
  'app/api/team-chat/messages/route.ts',
  'app/api/player-signups/route.ts',
  'app/api/manual-verify/route.ts',
  'app/api/livestream/data/route.ts',
  'app/api/discord/sync-player-role/route.ts',
  'app/api/discord/retry-failed-syncs/route.ts',
  'app/api/direct-verify/route.ts',
  'app/api/debug/daily-recaps/route.ts',
  'app/api/daily-recap/saved/route.ts',
  'app/api/daily-recap/save/route.ts',
  'app/api/daily-recap/route.ts',
  'app/api/cron/process-expired-bans/route.ts',
  'app/api/auth/webhook/user-confirmed/route.ts',
  'app/api/auth/verify/route.ts',
  'app/api/auth/verify-email/route.ts',
  'app/api/auth/verify-email-debug/route.ts',
  'app/api/auth/manual-create-user/route.ts',
  'app/api/auth/handle-pkce-token/route.ts',
  'app/api/auth/fresh-verify/route.ts',
  'app/api/auth/create-player/route.ts',
  'app/api/auth/connect-discord-registration/route.ts',
  'app/api/auth/check-user-exists/route.ts',
  'app/api/admin/unban-user/route.ts',
  'app/api/admin/sync-missing-users/route.ts',
  'app/api/admin/run-migration/verification-logs/route.ts',
  'app/api/admin/fix-orphaned-user/route.ts',
  'app/api/admin/fix-orphaned-auth-user/route.ts',
  'app/api/admin/find-orphaned-users/route.ts',
  'app/api/admin/find-orphaned-auth-users/route.ts',
  'app/api/admin/delete-user-complete/route.ts',
  'app/api/admin/bidding-recap/route.ts',
  'app/api/admin/ban-user/route.ts'
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
    
    // Pattern 1: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    const pattern1 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*,\s*\{([^}]*)\}\s*\)/g;
    
    // Pattern 2: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const pattern2 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\)/g;
    
    // Pattern 3: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    const pattern3 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*""\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*""\s*,\s*\{([^}]*)\}\s*\)/g;
    
    // Pattern 4: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    const pattern4 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*""\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*""\s*\)/g;
    
    // Pattern 5: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const pattern5 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\)/g;
    
    // Pattern 6: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    const pattern6 = /const\s+(\w+)\s*=\s*createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*,\s*\{([^}]*)\}\s*\)/g;
    
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
    
    // Fix pattern 5
    content = content.replace(pattern5, (match, varName) => {
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
    
    // Fix pattern 6
    content = content.replace(pattern6, (match, varName, config) => {
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
console.log('🔧 Fixing ALL Supabase environment variable issues...\n');

filesToFix.forEach(filePath => {
  fixFile(filePath);
});

console.log('\n✅ All files processed!');
