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
  "NODE_ENV": "production",
  "NEXT_PUBLIC_SKIP_CLERK_AUTH": "true"
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
  "NODE_ENV": "production",
  "NEXT_PUBLIC_SKIP_CLERK_AUTH": "true"
} };
}
