# Choreo Network Troubleshooting Guide

## Overview

This guide addresses network connectivity issues during Choreo deployments, specifically focusing on npm installation failures with `ECONNRESET` errors.

## Common Network Issues

### 1. Connection Reset Errors
- **Error**: `npm error code ECONNRESET`
- **Cause**: Network connection interrupted during package download
- **Impact**: Complete deployment failure

### 2. DNS Resolution Issues
- **Error**: `getaddrinfo ENOTFOUND registry.npmjs.org`
- **Cause**: DNS server cannot resolve npm registry
- **Impact**: Cannot reach package registry

### 3. Proxy/Firewall Blocking
- **Error**: `connect ETIMEDOUT` or `socket hang up`
- **Cause**: Corporate firewall or proxy blocking npm traffic
- **Impact**: Packages cannot be downloaded

### 4. Registry Timeouts
- **Error**: `fetch timeout`
- **Cause**: Slow network or registry overload
- **Impact**: Partial downloads fail

## Implemented Solutions

### 1. Enhanced .npmrc Configuration

Our `.npmrc` file includes comprehensive network resilience settings:

```ini
# Network Resilience Settings
fetch-retries=5
fetch-retry-factor=2
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
fetch-timeout=300000

# Connection Settings
maxsockets=15
network-timeout=300000

# Registry Configuration
registry=https://registry.npmjs.org/
```

### 2. Network Resilience Script

The `scripts/choreo-network-fix.js` script provides:

- **DNS Configuration**: Sets reliable DNS servers
- **Registry Health Check**: Tests multiple npm registries
- **Timeout Configuration**: Optimizes network timeouts
- **Proxy Detection**: Automatically configures proxy settings
- **Cache Optimization**: Cleans and verifies npm cache
- **Connectivity Testing**: Validates network access

### 3. Build Retry System

The `scripts/choreo-build-retry.bat` script implements:

- **Retry Logic**: Up to 3 attempts with 30-second delays
- **Progressive Fixes**: Applies network fixes before each retry
- **Detailed Logging**: Comprehensive error reporting
- **Success Tracking**: Monitors retry success rates

## Usage Instructions

### Quick Fix (Windows)
```bash
# Run the comprehensive retry script
npm run choreo:build-retry
```

### Step-by-Step Fix
```bash
# 1. Apply network resilience fixes
npm run choreo:network-fix

# 2. Clear npm cache
npm cache clean --force

# 3. Test connectivity
npm ping

# 4. Install dependencies with retries
npm ci --no-optional --no-audit
```

### Manual Configuration
```bash
# Configure npm for network resilience
npm config set fetch-retries 5
npm config set fetch-timeout 300000
npm config set network-timeout 300000
npm config set maxsockets 15
```

## Troubleshooting Steps

### Step 1: Verify Network Connectivity
```bash
# Test basic connectivity
ping registry.npmjs.org
ping github.com
ping google.com

# Test npm registry access
npm ping
```

### Step 2: Check DNS Resolution
```bash
# Test DNS resolution
nslookup registry.npmjs.org
nslookup github.com
```

### Step 3: Proxy Configuration
```bash
# Check proxy settings
npm config get proxy
npm config get https-proxy

# Set proxy if needed
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

### Step 4: Alternative Registries
```bash
# Try alternative registries
npm config set registry https://registry.yarnpkg.com/
npm config set registry https://npm.pkg.github.com/

# Reset to default
npm config set registry https://registry.npmjs.org/
```

## Choreo-Specific Considerations

### Build Environment
- **Container**: Runs in isolated Docker container
- **Network**: Limited outbound connectivity
- **DNS**: May use different DNS servers
- **Proxy**: Corporate proxy settings may apply

### Optimization for Choreo
1. **Minimize Dependencies**: Remove unnecessary packages
2. **Use .npmrc**: Configure network settings in repository
3. **Cache Strategy**: Leverage npm cache effectively
4. **Retry Logic**: Implement robust retry mechanisms

## Monitoring and Diagnostics

### Build Logs Analysis
Look for these patterns in Choreo build logs:
- `npm error code ECONNRESET` - Connection reset
- `npm error network aborted` - Network failure
- `fetch timeout` - Registry timeout
- `socket hang up` - Connection dropped

### Success Metrics
- **Build Time**: Should complete in <5 minutes
- **Retry Count**: Should succeed within 3 attempts
- **Error Rate**: <5% network-related failures
- **Cache Hit**: >80% packages from cache

## Prevention Strategies

### 1. Dependency Management
```json
{
  "scripts": {
    "postinstall": "npm audit fix --force",
    "preinstall": "npm run choreo:network-fix"
  }
}
```

### 2. CI/CD Integration
```yaml
# .github/workflows/choreo-deploy.yml
- name: Prepare for Choreo
  run: |
    npm run choreo:network-fix
    npm ci --no-optional --no-audit
```

### 3. Health Checks
```bash
# Add to deployment pipeline
npm run choreo:network-fix
npm ping
npm ci --dry-run
```

## Emergency Procedures

### If All Retries Fail
1. **Check Choreo Status**: Verify platform availability
2. **Contact Support**: Report infrastructure issues
3. **Alternative Deployment**: Use manual deployment methods
4. **Rollback**: Deploy previous working version

### Temporary Workarounds
```bash
# Use yarn instead of npm
yarn install --network-timeout 300000

# Use pnpm with retry
pnpm install --retry 5

# Manual package installation
npm install --save-exact package-name
```

## Reporting Issues

### Information to Include
1. **Error Logs**: Complete npm error output
2. **Network Report**: From `choreo-network-fix.js`
3. **Environment**: Node.js/npm versions
4. **Timing**: When the error occurred
5. **Retry Results**: How many attempts were made

### Log Files
- `logs/network-diagnostic.json` - Network configuration
- `logs/build-success-report.json` - Success metrics
- `logs/build-failure-report.json` - Failure analysis

## Best Practices

### 1. Proactive Monitoring
- Run network tests before deployment
- Monitor npm registry status
- Track build success rates

### 2. Configuration Management
- Keep .npmrc in version control
- Document network requirements
- Test configuration changes

### 3. Incident Response
- Have rollback procedures ready
- Monitor deployment health
- Communicate issues promptly

## Related Documentation

- [Choreo Deployment Guide](./CHOREO-DEPLOYMENT.md)
- [Network Configuration](../config/development.js)
- [Build Scripts](../scripts/README.md)
- [Monitoring Setup](./MONITORING.md)

## Support Contacts

- **Choreo Support**: [Choreo Documentation](https://wso2.com/choreo/docs/)
- **npm Support**: [npm Status](https://status.npmjs.org/)
- **Network Team**: Internal IT support for proxy/firewall issues 