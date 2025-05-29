// Auto-generated client environment configuration
// This file ensures NEXT_PUBLIC environment variables are available client-side
window.__NEXT_ENV__ = {
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL": "/dashboard",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL": "/dashboard",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_d2lubmluZy13YWxsYWJ5LTUuY2xlcmsuYWNjb3VudHMuZGV2JA",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL": "/sign-in",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL": "/sign-up",
  "NEXT_PUBLIC_STACK_PROJECT_ID": "****************************",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY": "****************************************",
  "NODE_ENV": "production"
};

// Polyfill process.env for client-side access
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL": "/dashboard",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL": "/dashboard",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_d2lubmluZy13YWxsYWJ5LTUuY2xlcmsuYWNjb3VudHMuZGV2JA",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL": "/sign-in",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL": "/sign-up",
  "NEXT_PUBLIC_STACK_PROJECT_ID": "****************************",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY": "****************************************",
  "NODE_ENV": "production"
} };
}

// Client-side environment configuration for Choreo deployment
(function() {
  'use strict';
  
  console.log('[ENV-CONFIG] Loading environment configuration...');
  
  // Check if we're running on Choreo
  const isChoreoEnvironment = window.location.hostname.includes('.choreoapps.dev');
  
  if (isChoreoEnvironment) {
    console.log('[ENV-CONFIG] Choreo environment detected');
    
    // Override Clerk configuration for SSL certificate issues
    if (window.Clerk) {
      console.log('[ENV-CONFIG] Configuring Clerk for Choreo SSL compatibility');
      
      // Force Clerk to use the official CDN instead of subdomain
      window.Clerk.configure({
        domain: 'js.clerk.com',
        clerkJSUrl: 'https://js.clerk.com/v1/clerk.js'
      });
    } else {
      // Set up configuration for when Clerk loads
      window.__clerkConfig = {
        domain: 'js.clerk.com',
        clerkJSUrl: 'https://js.clerk.com/v1/clerk.js'
      };
    }
  }
  
  // Environment variables configuration
  const envConfig = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_SKIP_CLERK_AUTH: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH || 'false',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  console.log('[ENV-PROVIDER] Environment configuration already loaded:', envConfig);
  
  // Merge with process.env for client-side access
  if (typeof window !== 'undefined') {
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    Object.assign(window.process.env, envConfig);
    console.log('[ENV-PROVIDER] Environment variables merged to process.env');
  }
  
  console.log('[ENV-PROVIDER] Environment provider ready');
})();
