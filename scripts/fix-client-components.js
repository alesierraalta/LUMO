/**
 * This script adds 'use client' directive to components that need it
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking components that need "use client" directive...');

// List of component files that need to be marked as client components
const clientComponentPaths = [
  'src/components/inventory/DuplicateDetector.tsx',
  // Add more paths here if needed
];

// Function to add 'use client' directive if missing
function addUseClientDirective(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if 'use client' directive is already present
  if (content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"')) {
    console.log(`✅ File already has 'use client' directive: ${filePath}`);
    return false;
  }
  
  // Add 'use client' directive at the top of the file
  content = "'use client';\n\n" + content;
  fs.writeFileSync(filePath, content);
  console.log(`✅ Added 'use client' directive to: ${filePath}`);
  return true;
}

// Process each file
let fixedCount = 0;
for (const filePath of clientComponentPaths) {
  if (addUseClientDirective(filePath)) {
    fixedCount++;
  }
}

console.log(`✅ Fixed ${fixedCount} components`);
console.log('🚀 Client components ready!'); 