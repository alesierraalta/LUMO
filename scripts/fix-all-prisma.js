#!/usr/bin/env node

/**
 * ULTRA-FAST PRISMA TO DB CONVERTER
 * Fixes all prisma references in one go
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing ALL prisma references...');

// Files to fix
const filesToFix = [
  'src/app/api/admin-setup/route.ts',
  'src/app/api/inventory/update-dates/route.ts', 
  'src/app/api/products/route.ts',
  'src/app/api/sales/report/route.ts',
  'src/app/api/sales/reports/route.ts',
  'src/app/api/sales/[id]/refund/route.ts',
  'src/app/api/simple-migrate/route.ts',
  'src/services/productService.ts',
  'src/lib/server-utils.ts',
  'src/lib/importService.ts'
];

let totalFixed = 0;

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace all prisma references
    content = content.replace(/await prisma\./g, 'await db.');
    content = content.replace(/prisma\.\$/g, 'db.$');
    content = content.replace(/prisma\?/g, 'db');
    
    // Add db import if not present and prisma was used
    if (originalContent.includes('prisma') && !content.includes('import db from')) {
      // Find import section and add db import
      const importRegex = /^(import.*from.*['"].*['"];?\s*\n)*/gm;
      const imports = content.match(importRegex) || [''];
      const lastImport = imports[imports.length - 1];
      
      if (!content.includes('import db from')) {
        content = content.replace(lastImport, lastImport + 'import db from "@/lib/db";\n');
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      totalFixed++;
    }
  }
});

console.log(`🎉 Fixed ${totalFixed} files!`);
console.log('🚀 Ready for build!'); 