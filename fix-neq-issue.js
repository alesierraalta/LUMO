const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/db-supabase.ts');

console.log('🔧 Fixing neq method issue in db-supabase.ts...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // Pattern 1: Replace neq with not.eq pattern for deleteAll
  const neqDeleteAllPattern = /query = query\.neq\('id', '00000000-0000-0000-0000-000000000000'\);/g;
  if (content.match(neqDeleteAllPattern)) {
    content = content.replace(neqDeleteAllPattern, "query = query.not('id', 'eq', '00000000-0000-0000-0000-000000000000');");
    changes++;
    console.log('✅ Fixed neq deleteAll pattern to use not.eq');
  }

  // Pattern 2: Replace neq with not.eq pattern for value.not
  const neqValueNotPattern = /query = query\.neq\('id', value\.not\);/g;
  if (content.match(neqValueNotPattern)) {
    content = content.replace(neqValueNotPattern, "query = query.not('id', 'eq', value.not);");
    changes++;
    console.log('✅ Fixed neq value.not pattern to use not.eq');
  }

  // Write the fixed content back
  fs.writeFileSync(filePath, content);
  
  console.log(`✅ Fixed ${changes} neq patterns in db-supabase.ts`);
  console.log('🎉 All deleteMany methods should now work with real Supabase client');
  
} catch (error) {
  console.error('❌ Error fixing neq issue:', error);
  process.exit(1);
} 