# Clerk Authentication Setup Guide

## 🚨 IMPORTANT: Fix for "Failed to load Clerk" Error

If you're getting the error `Clerk: Failed to load Clerk`, it's because the hardcoded keys in `create-env-local.js` are invalid placeholder keys. Here's how to fix it:

## Quick Fix Options

### Option 1: Development Without Authentication
```bash
npm run dev:no-auth
```
This bypasses Clerk entirely and lets you develop without authentication.

### Option 2: Get Real Clerk Keys (Recommended)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Sign up/Login to your account
3. Create a new application or select existing one
4. Go to **API Keys** section
5. Copy your **Publishable Key** and **Secret Key**
6. Update `create-env-local.js` with your real keys

## Setting Up Real Clerk Keys

### 1. Create Clerk Account and Application
1. Visit [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application
4. Choose your preferred sign-in methods

### 2. Get Your Keys
From your Clerk Dashboard:
- **Development Instance**: 
  - Publishable Key: starts with `pk_test_`
  - Secret Key: starts with `sk_test_`
- **Production Instance**:
  - Publishable Key: starts with `pk_live_`
  - Secret Key: starts with `sk_live_`

### 3. Update Configuration

#### Method A: Update create-env-local.js (Recommended)
Replace the hardcoded keys in `create-env-local.js`:

```javascript
// Replace these lines in create-env-local.js:
const devKeys = {
  publishable: 'pk_test_YOUR_REAL_DEVELOPMENT_KEY_HERE',
  secret: 'sk_test_YOUR_REAL_DEVELOPMENT_SECRET_HERE'
};

const prodKeys = {
  publishable: 'pk_live_YOUR_REAL_PRODUCTION_KEY_HERE',
  secret: 'sk_live_YOUR_REAL_PRODUCTION_SECRET_HERE'
};
```

#### Method B: Use Environment Variables
Create a `.env.local` file manually:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_real_key_here
CLERK_SECRET_KEY=sk_test_your_real_secret_here
NEXT_PUBLIC_SKIP_CLERK_AUTH=false
```

## Current Key Format Issue

The current keys in the system are base64-encoded placeholder strings:
- `pk_test_Y2xlcmsuY2hvcmVvYXBwcy5kZXYk` (decodes to "clerk.choreoapps.dev$")
- These are NOT real Clerk keys and will cause authentication to fail

Real Clerk keys are much longer and contain actual cryptographic material.

## Testing Your Setup

### With Authentication:
```bash
npm run dev:clerk
```

### Without Authentication (Development):
```bash
npm run dev:no-auth
```

### With Production Keys:
```bash
npm run dev:prod-keys
```

## Available Scripts

- `npm run dev` - Use current .env.local configuration
- `npm run dev:clerk` - Development with authentication enabled
- `npm run dev:no-auth` - Development without authentication
- `npm run dev:prod-keys` - Development using production keys

## Environment-Based Configuration

The app automatically detects the environment and applies appropriate settings:

### Development Mode Features:
- Conditional Clerk loading based on `NEXT_PUBLIC_SKIP_CLERK_AUTH`
- Fallback authentication components
- Development-friendly error handling

### Production Mode Features:
- Full Clerk authentication required
- Production-grade security settings
- Domain-specific configurations

## Troubleshooting

### "Failed to load Clerk" Error
1. **Check your keys**: Ensure you're using real Clerk keys, not the placeholder ones
2. **Check network**: Ensure you can reach Clerk's servers
3. **Check domain**: Ensure your domain is configured in Clerk dashboard
4. **Use no-auth mode**: For development, use `npm run dev:no-auth`

### "useClerk can only be used within ClerkProvider" Error
This error occurs when:
1. Clerk hooks are used outside of `<ClerkProvider>`
2. Authentication is skipped but components still try to use Clerk
3. Configuration mismatch between client and server

The app includes fallback logic to handle these cases gracefully.

### Network Issues
If you're behind a firewall or proxy:
1. Ensure access to `*.clerk.dev` and `*.clerk.com`
2. Check if your environment blocks external authentication services
3. Consider using the no-auth development mode

## Security Notes

- Never commit real Clerk secret keys to version control
- Use environment variables for sensitive configuration
- The placeholder keys in this repository are intentionally invalid
- Development keys are safe to use in development environments
- Production keys should only be used in production environments

## Next Steps

1. **For Development**: Use `npm run dev:no-auth` to get started quickly
2. **For Authentication Testing**: Get real Clerk keys and update the configuration
3. **For Production**: Set up production Clerk instance with real domain

## Support

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Clerk Community Discord](https://discord.com/invite/b5rXHjb)

## Architecture Overview

```
src/
├── lib/
│   └── clerk-config.ts          # Environment detection and configuration
├── components/
│   └── auth/
│       └── clerk-provider-config.tsx  # Conditional Clerk provider
└── app/
    └── layout.tsx               # Root layout with AppClerkProvider
```

The system provides:
- **Environment Detection**: Automatically detects dev vs production
- **Conditional Loading**: Only loads Clerk when authentication is needed
- **Graceful Fallbacks**: Handles missing/invalid keys gracefully
- **Flexible Configuration**: Multiple development modes available 