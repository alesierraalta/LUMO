# Choreo DNS Resolution Troubleshooting

## Issue Description
Error: `getaddrinfo EAI_AGAIN app.choreo.dev`

This error occurs in Choreo's internal build system when it tries to update deployment status.

## Root Cause
- DNS resolution failure in Choreo's build infrastructure
- The error is in `configurable-generation-status-update.js` (Choreo's internal script)
- NOT caused by your application code

## Solutions

### 1. Use Simplified Configuration
```bash
# Use the simplified choreo.yaml
cp choreo-simple.yaml choreo.yaml
```

### 2. Use Alternative Dockerfile
```bash
# Use the DNS-safe Dockerfile
cp Dockerfile.simple Dockerfile
```

### 3. Retry Deployment
- DNS issues are often temporary
- Try redeploying after 30-60 minutes
- Check Choreo status page for infrastructure issues

### 4. Contact Choreo Support
If the issue persists:
- Report the DNS resolution error
- Include the full error log
- Mention the `configurable-generation-status-update.js` script

## Monitoring Commands
```bash
# Check deployment status
node scripts/monitor-choreo-deployment.js

# Test DNS resolution
nslookup app.choreo.dev

# Verify application health
curl https://your-app.choreoapps.dev/api/health
```
