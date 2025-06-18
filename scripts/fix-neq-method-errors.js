#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing neq method errors in Supabase database interface...');

const dbSupabaseFile = path.join(__dirname, '../src/lib/db-supabase.ts');

try {
  let content = fs.readFileSync(dbSupabaseFile, 'utf8');
  
  console.log('📖 Original content length:', content.length);
  
  // Replace all instances of query.neq with query.not('id', 'eq', value)
  // This is the correct Supabase syntax for "not equal"
  const neqRegex = /query\s*=\s*query\.neq\('([^']+)',\s*([^)]+)\)/g;
  
  let matches = 0;
  content = content.replace(neqRegex, (match, column, value) => {
    matches++;
    console.log(`🔄 Replacing: ${match}`);
    console.log(`   Column: ${column}, Value: ${value}`);
    return `query = query.not('${column}', 'eq', ${value})`;
  });
  
  console.log(`✅ Fixed ${matches} neq method calls`);
  
  // Write the updated content
  fs.writeFileSync(dbSupabaseFile, content, 'utf8');
  
  console.log('✅ Successfully updated db-supabase.ts');
  console.log('📝 Updated content length:', content.length);
  
} catch (error) {
  console.error('❌ Error fixing neq method errors:', error);
  process.exit(1);
} 