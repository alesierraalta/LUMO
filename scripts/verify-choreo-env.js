#!/usr/bin/env node

/**
 * Choreo Environment Variables Verification Script
 * Checks if all required environment variables are properly configured
 */

console.log('🔍 CHOREO ENVIRONMENT VARIABLES VERIFICATION\n');

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY', 
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalVars = [
  'CHOREO_DEPLOYMENT'
];

let allGood = true;

console.log('📋 REQUIRED VARIABLES:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'MISSING';
  
  console.log(`${status} ${varName}: ${display}`);
  
  if (!value) {
    allGood = false;
  }
});

console.log('\n📋 OPTIONAL VARIABLES:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const display = value || 'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
});

console.log('\n🎯 CHOREO CONFIGURATION INSTRUCTIONS:');
console.log('Add these environment variables in Choreo Console:');
console.log('');
console.log('SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co');
console.log('SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4');
console.log('NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4');
console.log('JWT_SECRET=tu_jwt_secret_super_seguro_aqui_32_chars_minimum');
console.log('NODE_ENV=production');
console.log('CHOREO_DEPLOYMENT=true');

if (allGood) {
  console.log('\n🎉 ALL REQUIRED VARIABLES ARE CONFIGURED!');
  process.exit(0);
} else {
  console.log('\n❌ MISSING REQUIRED VARIABLES - DEPLOYMENT WILL FAIL');
  console.log('Please configure the missing variables in Choreo Console');
  process.exit(1);
} 