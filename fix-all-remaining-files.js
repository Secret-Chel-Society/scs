const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip if file doesn't contain createClient
    if (!content.includes('createClient')) {
      return;
    }
    
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
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Find all TypeScript files
console.log('🔍 Finding all TypeScript files...');
const allFiles = findTsFiles('.');
console.log(`Found ${allFiles.length} TypeScript files`);

// Filter files that likely contain Supabase client creation
const supabaseFiles = allFiles.filter(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('createClient') && content.includes('process.env.NEXT_PUBLIC_SUPABASE_URL');
  } catch (error) {
    return false;
  }
});

console.log(`Found ${supabaseFiles.length} files with Supabase client creation`);

// Fix all files
console.log('🔧 Fixing ALL remaining Supabase environment variable issues...\n');

supabaseFiles.forEach(filePath => {
  fixFile(filePath);
});

console.log('\n✅ All files processed!');
