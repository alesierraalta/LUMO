# Complete Environment Variables for Choreo Deployment

## Required Secrets in Choreo Dashboard

Configure these **exactly** in your Choreo component → Settings → Secrets:

### Authentication (Critical - Causing Current Error)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_clkXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Database (Required)
```bash
DATABASE_URL=postgresql://username:password@host:port/database
# OR for PostgreSQL with connection pooling:
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database?pgbouncer=true&connect_timeout=15
```

### Application Configuration (Optional but Recommended)
```bash
NEXT_PUBLIC_SKIP_CLERK_AUTH=false
NEXT_PUBLIC_APP_VERSION=${GITHUB_SHA}
NODE_ENV=production
```

### Optional Third-Party Services (If Used)
```bash
# Stack Auth (if using)
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_client_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key
```

## All Variables Set in choreo.yaml

These are automatically set by the platform:
```yaml
# Build-time variables (in build section)
NEXT_PUBLIC_SKIP_CLERK_AUTH: "true"  # Temporarily for build
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_dummy-key-for-build"
CLERK_SECRET_KEY: "sk_test_dummy-key-for-build"

# Runtime variables (in env section)
NODE_ENV: production
NEXT_PUBLIC_APP_VERSION: ${GITHUB_SHA}
NEXT_PUBLIC_SKIP_CLERK_AUTH: "false"
# Plus all secrets from secretRef
```

## Variables Set by Choreo Platform
```bash
PORT=8080                    # Automatically set by platform
CHOREO_PROJECT=your_project  # Set by platform
GITHUB_SHA=commit_hash       # Set by platform during build
```

## Verification Commands

### Check Health Endpoint
```bash
curl https://your-choreo-url/api/health
```

### Expected Response (Healthy)
```json
{
  "status": "ok",
  "auth_config": {
    "clerk_auth_enabled": true,
    "clerk_publishable_key_set": true,
    "clerk_secret_key_set": true,
    "clerk_publishable_key_prefix": "pk_live_clk...",
    "clerk_secret_key_prefix": "sk_live_...",
    "port": "8080",
    "skip_clerk_auth": "false"
  }
}
```

### Expected Response (With Issues)
```json
{
  "status": "error",
  "auth_config": {
    "clerk_publishable_key_set": false,
    "clerk_secret_key_set": false,
    "clerk_publishable_key_prefix": "MISSING",
    "clerk_secret_key_prefix": "MISSING"
  }
}
```

---
**Critical**: The middleware error indicates NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not reaching the runtime environment. 