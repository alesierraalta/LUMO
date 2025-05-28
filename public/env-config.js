// Auto-generated client environment configuration
// This file ensures NEXT_PUBLIC environment variables are available client-side
window.__NEXT_ENV__ = {
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_d2lubmluZy13YWxsYWJ5LTUuY2xlcmsuYWNjb3VudHMuZGV2JA",
  "NEXT_PUBLIC_SKIP_CLERK_AUTH": "false",
  "NODE_ENV": "production"
};

// Polyfill process.env for client-side access
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_d2lubmluZy13YWxsYWJ5LTUuY2xlcmsuYWNjb3VudHMuZGV2JA",
  "NEXT_PUBLIC_SKIP_CLERK_AUTH": "false",
  "NODE_ENV": "production"
} };
}
