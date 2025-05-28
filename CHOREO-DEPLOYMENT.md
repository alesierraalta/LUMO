# LUMO Choreo Deployment Guide

## 🚀 Deployment Fixes Applied

### ✅ Issue Resolution: 505 HTTP Version Not Supported

**Root Cause**: Incompatibility between Next.js server configuration and Choreo's infrastructure expectations.

**Solutions Implemented**:

### 1. **Choreo-Optimized Server** (`choreo-server.js`)
- ✅ HTTP/1.1 compatibility enforcement
- ✅ Proper port binding to `0.0.0.0:8080`
- ✅ Enhanced health check endpoints (`/health`, `/api/health`)
- ✅ Manifest validation and CSS file creation
- ✅ CORS headers for cross-origin requests
- ✅ Graceful error handling for CSS-related issues

### 2. **Updated Dockerfile**
- ✅ Uses `choreo-server.js` instead of generic `server.js`
- ✅ Proper `.next` artifact copying
- ✅ Health check endpoint configuration
- ✅ Signal handling with `dumb-init`

### 3. **Enhanced Health Monitoring**
- ✅ `/api/health` - Comprehensive health status
- ✅ `/api/test` - Basic connectivity testing
- ✅ Real-time manifest validation
- ✅ System resource monitoring

### 4. **CSS Manifest Fixes**
- ✅ Automatic `entryCSSFiles` repair
- ✅ Fallback CSS file creation
- ✅ Standalone mode compatibility

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Build completes without errors
- [ ] Manifest files exist with proper structure
- [ ] CSS files are generated
- [ ] Health endpoints respond correctly

### Choreo Configuration
- [ ] Use `start:choreo` script in package.json
- [ ] Dockerfile uses `choreo-server.js`
- [ ] Port 8080 is exposed and bound to `0.0.0.0`
- [ ] Health check points to `/api/health`

### Environment Variables
```bash
NODE_ENV=production
PORT=8080
HOSTNAME=0.0.0.0
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
```

## 🧪 Testing Endpoints

### Health Check
```bash
curl https://your-choreo-url.choreoapps.dev/api/health
```
**Expected Response**: `{"status":"healthy",...}`

### Basic Connectivity
```bash
curl https://your-choreo-url.choreoapps.dev/api/test
```
**Expected Response**: `{"status":"server-responding",...}`

### Root Application
```bash
curl https://your-choreo-url.choreoapps.dev/
```
**Expected Response**: HTML content (no 505 error)

## 🔧 Troubleshooting

### Still Getting 505 Error?

1. **Check Choreo Configuration**:
   - Ensure startup command uses `npm run start:choreo`
   - Verify port is set to 8080
   - Check environment variables are set

2. **Verify Build Artifacts**:
   ```bash
   ls -la .next/build-manifest.json
   ls -la .next/app-build-manifest.json
   ls -la .next/standalone/server.js
   ```

3. **Test Locally**:
   ```bash
   npm run start:choreo
   curl http://localhost:8080/api/health
   ```

4. **Debug with Script**:
   ```bash
   node debug-choreo.js
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| 505 HTTP Version Not Supported | Use `choreo-server.js` in Dockerfile |
| CSS files not loading | Run manifest validator before startup |
| Health check failing | Verify `/api/health` endpoint is accessible |
| CORS errors | Check CORS headers in `choreo-server.js` |

## 📁 File Structure

```
/app
├── choreo-server.js          # Choreo-optimized server
├── server.js                 # General production server  
├── scripts/
│   └── manifest-validator.js # CSS manifest repair
├── app/api/
│   ├── health/route.ts       # Health check endpoint
│   └── test/route.ts         # Test endpoint
├── Dockerfile                # Updated for Choreo
└── package.json              # With start:choreo script
```

## ⚡ Performance Optimizations

- **Standalone Mode**: Uses Next.js standalone output for reduced container size
- **CSS Chunking**: Strict CSS chunking for proper asset loading
- **Health Monitoring**: Comprehensive health checks for uptime monitoring
- **Error Recovery**: Graceful handling of CSS and manifest errors

## 🔄 Deployment Process

1. **Build**: `npm run build`
2. **Validate**: `npm run prebuild` / `npm run postbuild`
3. **Deploy**: Choreo uses `npm run start:choreo`
4. **Monitor**: Check `/api/health` for status

## 📈 Success Metrics

- ✅ Server starts without errors
- ✅ Health endpoint returns 200 status
- ✅ No 505 HTTP errors
- ✅ CSS files load correctly
- ✅ Application is accessible via Choreo URL

---

**Last Updated**: 2025-05-28  
**Status**: Ready for Production Deployment 