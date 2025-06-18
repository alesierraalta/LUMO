const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/db-supabase.ts');

console.log('🔧 Fixing deleteMany methods in db-supabase.ts...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // Pattern 1: Fix the gt('id', '') pattern to use neq
  const gtPattern = /query = query\.gt\('id', ''\);/g;
  if (content.match(gtPattern)) {
    content = content.replace(gtPattern, "query = query.neq('id', '00000000-0000-0000-0000-000000000000');");
    changes++;
    console.log('✅ Fixed gt pattern to use neq');
  }

  // Pattern 2: Fix the "not equal filtering not supported" error
  const notSupportedPattern = /throw new Error\('not equal filtering not supported in this context'\);/g;
  if (content.match(notSupportedPattern)) {
    content = content.replace(notSupportedPattern, "query = query.neq('id', value.not);");
    changes++;
    console.log('✅ Fixed not equal filtering error');
  }

  // Pattern 3: Fix any remaining "not equal filtering not supported" variations
  const notSupportedPattern2 = /\/\/ Since Supabase doesn't have direct 'not equal', we'll skip this record[\s\S]*?throw new Error\('not equal filtering not supported in this context'\);/g;
  if (content.match(notSupportedPattern2)) {
    content = content.replace(notSupportedPattern2, "query = query.neq('id', value.not);");
    changes++;
    console.log('✅ Fixed detailed not equal filtering error');
  }

  // Write the fixed content back
  fs.writeFileSync(filePath, content);
  
  console.log(`✅ Fixed ${changes} patterns in db-supabase.ts`);
  console.log('🎉 All deleteMany methods should now work correctly');
  
} catch (error) {
  console.error('❌ Error fixing deleteMany methods:', error);
  process.exit(1);
} 