#!/usr/bin/env node

/**
 * LUMO Authentication Provider Fix Verification
 * Tests that AuthProvider is properly configured in the application layout
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LUMO Authentication Provider Fix Verification');
console.log('=' .repeat(60));

// Test 1: Check if AuthProvider is imported in main layout
console.log('\n1. Checking AuthProvider import in main layout...');
const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');

if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('import { AuthProvider }')) {
    console.log('✅ AuthProvider import found in layout.tsx');
  } else {
    console.log('❌ AuthProvider import missing in layout.tsx');
    process.exit(1);
  }
  
  if (layoutContent.includes('<AuthProvider>')) {
    console.log('✅ AuthProvider wrapper found in layout.tsx');
  } else {
    console.log('❌ AuthProvider wrapper missing in layout.tsx');
    process.exit(1);
  }
} else {
  console.log('❌ Main layout file not found');
  process.exit(1);
}

// Test 2: Check AuthProvider implementation
console.log('\n2. Checking AuthProvider implementation...');
const authContextPath = path.join(process.cwd(), 'src/contexts/auth-context.tsx');

if (fs.existsSync(authContextPath)) {
  const authContent = fs.readFileSync(authContextPath, 'utf8');
  
  if (authContent.includes('export function AuthProvider')) {
    console.log('✅ AuthProvider function exported');
  } else {
    console.log('❌ AuthProvider function not found');
    process.exit(1);
  }
  
  if (authContent.includes('export function useAuth')) {
    console.log('✅ useAuth hook exported');
  } else {
    console.log('❌ useAuth hook not found');
    process.exit(1);
  }
  
  if (authContent.includes('throw new Error(\'useAuth must be used within an AuthProvider\')')) {
    console.log('✅ Proper error handling for missing provider');
  } else {
    console.log('❌ Missing error handling for provider context');
    process.exit(1);
  }
} else {
  console.log('❌ Auth context file not found');
  process.exit(1);
}

// Test 3: Check login page usage
console.log('\n3. Checking login page useAuth usage...');
const loginPath = path.join(process.cwd(), 'src/app/(auth)/login/page.tsx');

if (fs.existsSync(loginPath)) {
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  
  if (loginContent.includes('import { useAuth }')) {
    console.log('✅ useAuth import found in login page');
  } else {
    console.log('❌ useAuth import missing in login page');
    process.exit(1);
  }
  
  if (loginContent.includes('const { refetch } = useAuth()')) {
    console.log('✅ useAuth hook properly used in login page');
  } else {
    console.log('❌ useAuth hook not properly used in login page');
    process.exit(1);
  }
} else {
  console.log('❌ Login page file not found');
  process.exit(1);
}

// Test 4: Verify layout structure
console.log('\n4. Verifying layout provider hierarchy...');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Check proper nesting: ThemeProvider > AuthProvider > div
const hasThemeProvider = layoutContent.includes('<ThemeProvider');
const hasAuthProvider = layoutContent.includes('<AuthProvider>');
const themeIndex = layoutContent.indexOf('<ThemeProvider');
const authIndex = layoutContent.indexOf('<AuthProvider>');

if (hasThemeProvider && hasAuthProvider && themeIndex < authIndex) {
  console.log('✅ Proper provider hierarchy: ThemeProvider > AuthProvider');
} else {
  console.log('❌ Incorrect provider hierarchy');
  process.exit(1);
}

console.log('\n🎉 Authentication Provider Fix Verification Complete!');
console.log('✅ All checks passed - AuthProvider should now work correctly');
console.log('\nNext steps:');
console.log('1. Restart the development server');
console.log('2. Navigate to http://localhost:3000/login');
console.log('3. Verify no "useAuth must be used within an AuthProvider" errors');
console.log('4. Test login functionality');

process.exit(0); 