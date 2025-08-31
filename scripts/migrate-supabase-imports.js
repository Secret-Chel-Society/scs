const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update @supabase/auth-helpers-nextjs imports
    const oldImports = [
      'createServerComponentClient',
      'createClientComponentClient', 
      'createRouteHandlerClient',
      'createMiddlewareClient'
    ];
    
    oldImports.forEach(importName => {
      const oldPattern = new RegExp(`import\\s*{\\s*${importName}\\s*}\\s*from\\s*["']@supabase/auth-helpers-nextjs["']`, 'g');
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, `import { ${importName} } from '@supabase/ssr'`);
        updated = true;
        console.log(`Updated ${importName} import in ${filePath}`);
      }
    });
    
    // Update crypto imports to use Node.js built-in
    const cryptoPattern = /import\s+crypto\s+from\s+["']crypto["']/g;
    if (cryptoPattern.test(content)) {
      content = content.replace(cryptoPattern, 'import crypto from "node:crypto"');
      updated = true;
      console.log(`Updated crypto import in ${filePath}`);
    }
    
    // Update randomBytes import
    const randomBytesPattern = /import\s*{\s*randomBytes\s*}\s*from\s*["']crypto["']/g;
    if (randomBytesPattern.test(content)) {
      content = content.replace(randomBytesPattern, 'import { randomBytes } from "node:crypto"');
      updated = true;
      console.log(`Updated randomBytes import in ${filePath}`);
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('Starting Supabase import migration...');

const projectRoot = process.cwd();
const files = findFiles(projectRoot);

let updatedCount = 0;
files.forEach(file => {
  if (updateImports(file)) {
    updatedCount++;
  }
});

console.log(`\nMigration complete! Updated ${updatedCount} files.`);
console.log('\nNext steps:');
console.log('1. Run: pnpm install');
console.log('2. Test your application locally');
console.log('3. Deploy to Vercel');
