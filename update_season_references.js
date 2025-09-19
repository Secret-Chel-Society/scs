// Update Season References in Application Code
// This script helps identify and update hardcoded season references

const CORRECT_SEASON_ID = 'fc808734-ff25-4f4b-9644-855ea0ea4b93';
const CORRECT_SEASON_NAME = 'SCSHL Season 1';

// Common patterns to search for in the codebase
const searchPatterns = [
    // Look for hardcoded season IDs
    /season_id['"]\s*:\s*['"][^'"]+['"]/g,
    /seasonId['"]\s*:\s*['"][^'"]+['"]/g,
    /season['"]\s*:\s*['"][^'"]+['"]/g,
    
    // Look for season names
    /season_name['"]\s*:\s*['"][^'"]+['"]/g,
    /seasonName['"]\s*:\s*['"][^'"]+['"]/g,
    
    // Look for active season references
    /is_active['"]\s*:\s*true/g,
    /isActive['"]\s*:\s*true/g,
    
    // Look for season queries
    /\.eq\(['"]season_id['"],\s*['"][^'"]+['"]/g,
    /\.eq\(['"]seasonId['"],\s*['"][^'"]+['"]/g,
];

// Files to check for season references
const filesToCheck = [
    'app/management/page.tsx',
    'app/api/free-agents/route.ts',
    'app/api/teams/route.ts',
    'app/api/players/route.ts',
    'app/api/matches/route.ts',
    'app/api/bidding/route.ts',
    'lib/team-utils.ts',
    'lib/season-utils.ts',
    'components/management/team-availability-tab.tsx',
    'components/management/salary-progress.tsx',
    'components/management/roster-progress.tsx',
];

console.log('Season Reference Update Helper');
console.log('==============================');
console.log(`Correct Season ID: ${CORRECT_SEASON_ID}`);
console.log(`Correct Season Name: ${CORRECT_SEASON_NAME}`);
console.log('');
console.log('Search patterns to look for:');
searchPatterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern}`);
});
console.log('');
console.log('Files to check:');
filesToCheck.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
});
console.log('');
console.log('Run this in your terminal to search for season references:');
console.log('grep -r "season" app/ --include="*.ts" --include="*.tsx" | grep -v node_modules');
console.log('');
console.log('Or use this PowerShell command on Windows:');
console.log('Get-ChildItem -Path app/ -Recurse -Include *.ts,*.tsx | Select-String -Pattern "season"');
