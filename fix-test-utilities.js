const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/__tests__/setup/test-utilities.ts');

console.log('🔧 Fixing deleteMany calls in test-utilities.ts...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // Pattern: Replace the complex { where: { id: { not: ... } } } pattern with { deleteAll: true }
  const deleteManyPattern = /deleteMany\(\{\s*where:\s*\{\s*id:\s*\{\s*not:\s*'[^']+'\s*\}\s*\}\s*\}\)/g;
  
  const matches = content.match(deleteManyPattern);
  if (matches) {
    content = content.replace(deleteManyPattern, 'deleteMany({ deleteAll: true })');
    changes = matches.length;
    console.log(`✅ Fixed ${changes} deleteMany calls`);
  }

  // Also fix the cleanupTestDatabase function calls
  const cleanupPattern = /await testDb\.(\w+)\.deleteMany\(\{\s*where:\s*\{\s*id:\s*\{\s*not:\s*'[^']+'\s*\}\s*\}\s*\}\)/g;
  
  const cleanupMatches = content.match(cleanupPattern);
  if (cleanupMatches) {
    content = content.replace(cleanupPattern, 'await testDb.$1.deleteMany({ deleteAll: true })');
    changes += cleanupMatches.length;
    console.log(`✅ Fixed ${cleanupMatches.length} cleanup deleteMany calls`);
  }

  // Write the fixed content back
  fs.writeFileSync(filePath, content);
  
  console.log(`✅ Total changes: ${changes} patterns fixed in test-utilities.ts`);
  console.log('🎉 All deleteMany calls should now work correctly');
  
} catch (error) {
  console.error('❌ Error fixing test utilities:', error);
  process.exit(1);
} 