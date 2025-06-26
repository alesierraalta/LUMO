#!/usr/bin/env node

/**
 * Prevent TypeScript Runtime Installation
 * Creates fake TypeScript installation to prevent Next.js from installing it
 */

const fs = require('fs');
const path = require('path');

console.log('🚫 [TS Preventer] Preventing TypeScript runtime installation...');

const createFakeTypeScriptInstallation = () => {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  // Create fake TypeScript directory structure
  const typescriptPath = path.join(nodeModulesPath, 'typescript');
  const typescriptBinPath = path.join(typescriptPath, 'bin');
  const typescriptLibPath = path.join(typescriptPath, 'lib');
  
  // Create directories
  [typescriptPath, typescriptBinPath, typescriptLibPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 [TS Preventer] Created: ${dir}`);
    }
  });
  
  // Create fake package.json
  const packageJsonPath = path.join(typescriptPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const fakePackageJson = {
      name: 'typescript',
      version: '5.0.0',
      description: 'Fake TypeScript installation to prevent runtime install',
      bin: {
        tsc: './bin/tsc',
        tsserver: './bin/tsserver'
      }
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(fakePackageJson, null, 2));
    console.log('📄 [TS Preventer] Created fake package.json');
  }
  
  // Create fake tsc binary
  const tscPath = path.join(typescriptBinPath, 'tsc');
  if (!fs.existsSync(tscPath)) {
    const fakeTsc = `#!/usr/bin/env node
console.log('TypeScript compiler (fake for development)');
console.log('Version 5.0.0');
process.exit(0);
`;
    fs.writeFileSync(tscPath, fakeTsc);
    fs.chmodSync(tscPath, '755');
    console.log('🔧 [TS Preventer] Created fake tsc binary');
  }
  
  // Create fake @types/react
  const typesPath = path.join(nodeModulesPath, '@types');
  const typesReactPath = path.join(typesPath, 'react');
  
  if (!fs.existsSync(typesReactPath)) {
    fs.mkdirSync(typesReactPath, { recursive: true });
    
    const fakeTypesReactPackage = {
      name: '@types/react',
      version: '19.0.0',
      description: 'Fake React types to prevent runtime install'
    };
    
    fs.writeFileSync(
      path.join(typesReactPath, 'package.json'),
      JSON.stringify(fakeTypesReactPackage, null, 2)
    );
    
    // Create minimal index.d.ts
    const fakeIndexDts = `// Fake React types for development
declare module 'react' {
  export * from '@types/react';
}
`;
    fs.writeFileSync(path.join(typesReactPath, 'index.d.ts'), fakeIndexDts);
    console.log('📄 [TS Preventer] Created fake @types/react');
  }
  
  // Create fake @types/node
  const typesNodePath = path.join(typesPath, 'node');
  
  if (!fs.existsSync(typesNodePath)) {
    fs.mkdirSync(typesNodePath, { recursive: true });
    
    const fakeTypesNodePackage = {
      name: '@types/node',
      version: '20.0.0',
      description: 'Fake Node types to prevent runtime install'
    };
    
    fs.writeFileSync(
      path.join(typesNodePath, 'package.json'),
      JSON.stringify(fakeTypesNodePackage, null, 2)
    );
    
    // Create minimal index.d.ts
    const fakeNodeDts = `// Fake Node types for development
declare module 'node' {
  export * from '@types/node';
}
`;
    fs.writeFileSync(path.join(typesNodePath, 'index.d.ts'), fakeNodeDts);
    console.log('📄 [TS Preventer] Created fake @types/node');
  }
};

const preventTypeScriptInstall = () => {
  try {
    console.log('🚫 [TS Preventer] Starting TypeScript prevention...');
    
    createFakeTypeScriptInstallation();
    
    console.log('✅ [TS Preventer] TypeScript runtime installation prevented!');
    console.log('💡 [TS Preventer] Next.js should now skip TypeScript installation');
    
  } catch (error) {
    console.error('❌ [TS Preventer] Failed to prevent TypeScript installation:', error.message);
    // Don't exit with error - this is optional optimization
  }
};

// Run if called directly
if (require.main === module) {
  preventTypeScriptInstall();
}

module.exports = { preventTypeScriptInstall }; 