# Environment Variable Security

## Overview
This document outlines the security improvements made to ensure Clerk API keys are only obtained through environment variables and never hardcoded.

## Changes Made

### 1. Removed Hardcoded API Keys
- **File**: `src/lib/clerk-config.ts`
- **Change**: Removed hardcoded fallback keys `pk_test_Y2xlcmsuY2hvcmVvYXBwcy5kZXYk` and similar
- **Now**: Only uses environment variables with proper validation

### 2. Enhanced Environment Variable Validation
- **File**: `src/lib/env-validation.ts` (NEW)
- **Features**:
  - Type-safe environment variable validation
  - Proper error messages when keys are missing
  - Format validation (keys must start with `pk_` or `sk_`)
  - Support for authentication bypass mode

### 3. Updated Setup Script
- **File**: `create-env-local.js`
- **Change**: Removed hardcoded fallback keys
- **Now**: Only uses environment variables, fails gracefully when none are provided

## Environment Variables Required

### Development
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_dev_key_here
CLERK_SECRET_KEY=sk_test_your_dev_secret_here
```

### Production
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_prod_key_here
CLERK_SECRET_KEY=sk_live_your_prod_secret_here
```

### Bypass Authentication (Development Only)
```bash
NEXT_PUBLIC_SKIP_CLERK_AUTH=true
```

## Security Benefits

1. **No Hardcoded Secrets**: Prevents accidental exposure of API keys in version control
2. **Explicit Configuration**: Forces explicit configuration of authentication
3. **Environment Separation**: Clear separation between development and production keys
4. **Validation**: Proper validation ensures keys are in correct format
5. **Fail-Safe**: Application fails to start if auth is enabled but keys are missing

## Migration Guide

### For Existing Installations
1. Ensure your `.env.local` file contains valid Clerk API keys
2. Remove any references to dummy or placeholder keys
3. If you don't have real keys, set `NEXT_PUBLIC_SKIP_CLERK_AUTH=true` for development

### For New Installations
1. Follow the setup guide in `CLERK_SETUP.md`
2. Obtain real API keys from Clerk dashboard
3. Configure environment variables properly

## Error Handling

### Missing Keys Error
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required.
Please set this variable in your .env.local file or set NEXT_PUBLIC_SKIP_CLERK_AUTH=true to disable authentication.
```

### Invalid Format Error
```
Invalid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY format: "invalid_key".
Clerk publishable keys should start with "pk_".
```

## Best Practices

1. **Never commit API keys** to version control
2. **Use different keys** for development and production
3. **Regularly rotate keys** in production
4. **Use environment-specific keys** for staging environments
5. **Enable authentication bypass** only for development

## Files Modified

- `src/lib/clerk-config.ts` - Removed hardcoded keys, added validation
- `src/lib/env-validation.ts` - New validation utility
- `create-env-local.js` - Removed hardcoded fallbacks
- `docs/ENVIRONMENT-SECURITY.md` - This documentation

## Testing

To test the changes:

1. **With valid keys**: Application should start normally
2. **Without keys**: Application should fail with clear error message
3. **With auth disabled**: Application should start with auth bypass
4. **With invalid format**: Application should fail with format error

## Docker Considerations

The Dockerfile already properly handles environment variables:
- Build stage uses dummy keys for building
- Runtime stage requires real keys for production
- Validation ensures keys are provided when auth is enabled 