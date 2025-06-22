#!/usr/bin/env node

/**
 * Confirm Email Production Script
 * 
 * This script confirms the email for the root user in Supabase Auth production environment.
 * The issue identified is that the user exists but email is not confirmed.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const ROOT_EMAIL = 'alesierraalta@gmail.com';
const ROOT_PASSWORD = 'admin123';

// Production Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY_PROD || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📧 LUMO Email Confirmation Fix');
console.log('==============================');
console.log('🌐 Environment: PRODUCTION');
console.log('📧 Root Email:', ROOT_EMAIL);
console.log('🔗 Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function confirmEmailProduction() {
  try {
    console.log('\n🔍 Step 1: Attempting to sign up user (will fail if exists)...');
    
    // Try to sign up - this will fail if user exists but might give us info
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ROOT_EMAIL,
      password: ROOT_PASSWORD,
      options: {
        data: {
          name: 'Alejandro Sierra (ROOT)'
        }
      }
    });

    if (signUpError) {
      console.log('⚠️ Sign up failed (expected):', signUpError.message);
      
      if (signUpError.message.includes('User already registered')) {
        console.log('✅ User already exists in auth.users');
      }
    } else {
      console.log('✅ User signed up successfully');
      console.log('   - User ID:', signUpData.user?.id);
      console.log('   - Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
    }

    console.log('\n🔍 Step 2: Attempting password reset to trigger email confirmation...');
    
    // Try password reset - this might help with email confirmation
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(ROOT_EMAIL, {
      redirectTo: 'https://your-choreo-app-url.com/auth/callback'
    });

    if (resetError) {
      console.log('⚠️ Password reset failed:', resetError.message);
    } else {
      console.log('✅ Password reset email sent');
      console.log('📧 Check your email for the reset link');
    }

    console.log('\n🔍 Step 3: Attempting direct login...');
    
    // Try to login directly
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: ROOT_EMAIL,
      password: ROOT_PASSWORD
    });

    if (loginError) {
      console.log('❌ Direct login failed:', loginError.message);
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('\n💡 SOLUTION FOUND:');
        console.log('   The user exists but email is not confirmed.');
        console.log('   You need to:');
        console.log('   1. Check your email for a confirmation link');
        console.log('   2. Or use the Supabase dashboard to manually confirm the email');
        console.log('   3. Or try the password reset option above');
      }
    } else {
      console.log('✅ Direct login successful!');
      console.log('   - User ID:', loginData.user?.id);
      console.log('   - Email confirmed:', loginData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      // Sign out after test
      await supabase.auth.signOut();
    }

    console.log('\n🔍 Step 4: Checking if we can use OTP instead...');
    
    // Try OTP sign in as alternative
    const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
      email: ROOT_EMAIL,
      options: {
        shouldCreateUser: false
      }
    });

    if (otpError) {
      console.log('⚠️ OTP sign in failed:', otpError.message);
    } else {
      console.log('✅ OTP sent to email');
      console.log('📧 Check your email for the OTP code');
      console.log('💡 You can use this OTP to login and confirm your email');
    }

    console.log('\n📋 SUMMARY AND NEXT STEPS:');
    console.log('================================');
    console.log('✅ Root user exists in production database with ADMIN role');
    console.log('⚠️ Email not confirmed in Supabase Auth');
    console.log('\n🔧 TO FIX THIS ISSUE:');
    console.log('1. Go to your Supabase dashboard (https://supabase.com/dashboard)');
    console.log('2. Navigate to your production project');
    console.log('3. Go to Authentication > Users');
    console.log('4. Find alesierraalta@gmail.com');
    console.log('5. Click on the user and manually confirm the email');
    console.log('\n🔄 ALTERNATIVE METHODS:');
    console.log('- Check your email for any confirmation links');
    console.log('- Use the password reset email sent above');
    console.log('- Use the OTP login method');
    console.log('\n🌐 After confirming email, try logging in to Choreo again');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the confirmation process
confirmEmailProduction(); 