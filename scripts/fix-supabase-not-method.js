#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Supabase query.not() method calls...');

const filePath = path.join(__dirname, '../src/lib/db-supabase.ts');

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('📁 Reading:', filePath);
  
  // Track changes
  let changeCount = 0;
  
  // Fix query.not('id', 'eq', value) -> query.neq('id', value)
  const notPattern = /query\.not\('([^']+)',\s*'eq',\s*([^)]+)\)/g;
  content = content.replace(notPattern, (match, field, value) => {
    changeCount++;
    console.log(`  ✅ Fixed: query.not('${field}', 'eq', ${value}) -> query.neq('${field}', ${value})`);
    return `query.neq('${field}', ${value})`;
  });
  
  // Also fix any other variations
  const notPattern2 = /query\s*=\s*query\.not\(/g;
  if (notPattern2.test(content)) {
    console.log('⚠️  Found additional query.not patterns that need manual review');
  }
  
  if (changeCount > 0) {
    // Write the fixed content back
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${changeCount} instances of query.not() method calls`);
    console.log('💾 File updated successfully');
  } else {
    console.log('ℹ️  No query.not() method calls found to fix');
  }
  
  console.log('🎉 Supabase method fix completed!');
  
} catch (error) {
  console.error('❌ Error fixing Supabase methods:', error.message);
  process.exit(1);
} 