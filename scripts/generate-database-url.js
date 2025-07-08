#!/usr/bin/env node

/**
 * Generate DATABASE_URL with different format options
 */

const password = 'Theale05042013$$';
const encodedPassword = encodeURIComponent(password);
const projectRef = 'ubjujxtvlubxowsphvuk';

console.log('🔑 DATABASE_URL Generator - Multiple Options');
console.log('===========================================');
console.log('');
console.log('Original password:', password);
console.log('Encoded password:', encodedPassword);
console.log('');
console.log('📋 DATABASE_URL Options to Try:');
console.log('');

console.log('Option 1 (Pooler - Transaction Mode):');
console.log(`DATABASE_URL=postgres://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`);
console.log('');

console.log('Option 2 (Pooler - Session Mode):');
console.log(`DATABASE_URL=postgres://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-2.pooler.supabase.com:5432/postgres`);
console.log('');

console.log('Option 3 (Direct Database Connection):');
console.log(`DATABASE_URL=postgres://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`);
console.log('');

console.log('Option 4 (Alternative Format):');
console.log(`DATABASE_URL=postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`);
console.log('');

console.log('🔧 Troubleshooting Steps:');
console.log('1. Try Option 1 first (recommended for Vercel)');
console.log('2. If Option 1 fails, try Option 2');
console.log('3. If pooler fails, try Option 3 (direct connection)');
console.log('4. Make sure to redeploy after each change');
console.log('5. Check Vercel deployment logs for specific errors');
console.log('6. Verify environment variable is set in Production environment');
console.log('');
console.log('📊 Current Status Check:');
console.log('- Supabase Project: ACTIVE_HEALTHY');
console.log('- Region: us-east-2');
console.log('- Database Version: 15.8.1.094');
console.log('- Issue: DATABASE_URL configuration or format problem'); 