# 🐳 Docker Desktop Setup Guide for Choreo Testing

## Problem: Docker Desktop Not Running

If you see this error when running Choreo tests:
```
ERROR: error during connect: Head "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping": open //./pipe/dockerDesktopLinuxEngine: El sistema no puede encontrar el archivo especificado.
```

**This means Docker Desktop is not running.**

## ⚡ Quick Fix (2 minutes)

### Option 1: Use Our Automated Checker
```bash
npm run check:docker
```
This script will:
- ✅ Check if Docker is installed
- ✅ Check if Docker Desktop is running  
- 🚀 Automatically start Docker Desktop if needed
- 📋 Give you step-by-step instructions

### Option 2: Manual Steps

1. **Look for Docker Desktop in System Tray**
   - Check bottom-right corner of your screen
   - Look for a whale 🐳 icon

2. **If Not Found, Start Docker Desktop**
   - Press `Windows Key`
   - Type "Docker Desktop"
   - Click on Docker Desktop app
   - Wait 30-60 seconds for startup

3. **Verify Docker is Running**
   ```bash
   docker --version
   docker ps
   ```

## 🚀 After Docker is Running

### Safe Testing (Recommended)
```bash
npm run test:choreo:safe
```
This automatically checks Docker first, then runs the full test.

### Direct Testing
```bash
npm run test:choreo:full    # Full test (5-8 minutes)
npm run test:choreo:quick   # Quick test (2-3 minutes)
```

## 📦 If Docker Desktop is Not Installed

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop
   - Download for Windows
   - Install (requires restart)

2. **System Requirements**
   - Windows 10/11 64-bit
   - WSL 2 feature enabled
   - Virtualization enabled in BIOS

3. **After Installation**
   - Restart computer
   - Run `npm run check:docker`
   - Run `npm run test:choreo:safe`

## 🔧 Troubleshooting

### Docker Desktop Won't Start
- **Solution**: Restart your computer
- **Alternative**: Run as Administrator

### Docker Commands Not Found
- **Solution**: Add Docker to PATH during installation
- **Check**: Open new terminal after installation

### WSL 2 Issues
- **Solution**: Enable WSL 2 feature in Windows Features
- **Command**: `wsl --install` (as Administrator)

### Permission Issues
- **Solution**: Run terminal as Administrator
- **Alternative**: Add user to docker-users group

## 🎯 What the Tests Do

Our Choreo testing system validates:
- ✅ **Docker Build**: Creates production container
- ✅ **BUILD_ID**: Verifies Next.js standalone build
- ✅ **Environment**: Tests dev/prod configurations
- ✅ **Health Checks**: Validates application startup
- ✅ **Cleanup**: Removes test containers/images

## 📊 Expected Results

### Successful Test Output:
```
🧪 [Build Test] Starting Choreo build testing...
🏗️ [Build Test] Step 1: Building Docker image...
✅ [Build Test] Docker build completed successfully
✅ [Build Test] BUILD_ID found: abc123def456
✅ [Build Test] Standalone server.js found
✅ [Build Test] Health check passed
✅ [Build Test] Test completed successfully
```

### Test Benefits:
- 🚫 **Prevents failed Choreo deployments**
- ⏰ **Saves 10+ minutes per failed deploy**
- 🐛 **Enables local debugging**
- 💪 **Provides deployment confidence**

## 🆘 Still Having Issues?

1. **Run the Docker checker**: `npm run check:docker`
2. **Check Docker Desktop logs**: Right-click whale icon → Troubleshoot
3. **Restart Docker Desktop**: Right-click whale icon → Restart
4. **Restart computer**: Sometimes needed after installation

## 📋 Summary Commands

```bash
# Check Docker status
npm run check:docker

# Safe testing (checks Docker first)
npm run test:choreo:safe

# Quick test (2-3 minutes)
npm run test:choreo:quick

# Full test (5-8 minutes)  
npm run test:choreo:full
```

---

✅ **Once Docker Desktop is running, your Choreo tests will work perfectly!** 