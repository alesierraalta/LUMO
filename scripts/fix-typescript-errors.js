#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/db-supabase.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of the problematic type checking
const oldPattern = /} else if \(key === 'id' && typeof value === 'object' && value\.not\) {/g;
const newPattern = "} else if (key === 'id' && typeof value === 'object' && value && 'not' in value) {";

content = content.replace(oldPattern, newPattern);

// Replace all instances of value.not with (value as any).not
const oldValuePattern = /query = query\.neq\('id', value\.not\);/g;
const newValuePattern = "query = query.neq('id', (value as any).not);";

content = content.replace(oldValuePattern, newValuePattern);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed TypeScript errors in db-supabase.ts'); 