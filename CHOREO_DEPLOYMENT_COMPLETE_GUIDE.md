# 🚀 CHOREO DEPLOYMENT COMPLETE GUIDE v2.0
## LUMO Inventory Management System - Enhanced with Timeout Prevention

> **UPDATED:** Enhanced with timeout prevention system to fix the 27-second failure issue

## 📋 PREREQUISITES

Before starting, ensure you have:
- ✅ Choreo account with deployment access
- ✅ GitHub repository with LUMO code
- ✅ Supabase project configured
- ✅ All environment variables ready

## 🔧 ENHANCED CONFIGURATION FILES

### 1. choreo.yaml (UPDATED - Timeout Prevention)
```yaml
apiVersion: core.choreo.dev/v1beta1
kind: Component
metadata:
  name: lumo
  description: LUMO Inventory Management System
spec:
  type: web-application
  
  # Build Configuration
  build:
    buildType: dockerfile
    dockerfilePath: ./Dockerfile
    
  # Container Configuration  
  container:
    image: lumo:latest
    
  # Environment Variables
  env:
    - name: NODE_ENV
      value: "production"
    - name: APP_NAME
      value: "LUMO"
    - name: APP_VERSION
      value: "1.0.0"
    - name: CHOREO_ENVIRONMENT
      value: "Production"
    - name: FORCE_SUPABASE
      value: "true"
    - name: NEXT_TELEMETRY_DISABLED
      value: "1"
    - name: PORT
      value: "8081"
    - name: STARTUP_TIMEOUT
      value: "60"
      
  # Secrets (configurar en Choreo Console)
  secrets:
    - name: NEXT_PUBLIC_SUPABASE_URL
    - name: NEXT_PUBLIC_SUPABASE_ANON_KEY
    - name: SUPABASE_URL
    - name: SUPABASE_KEY
    - name: JWT_SECRET
    - name: DATABASE_URL
    - name: NEXTAUTH_SECRET
    - name: NEXTAUTH_URL
    
  # Endpoints
  endpoints:
    - name: lumo-app
      service:
        name: lumo
        port: 8080
      context: /
      schemaFilePath: openapi.yaml
      
  # Health Checks - OPTIMIZED FOR TIMEOUT PREVENTION
  probes:
    readiness:
      httpGet:
        path: /api/health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 15
      timeoutSeconds: 10
      failureThreshold: 5
      
    liveness:
      httpGet:
        path: /api/health
        port: 8080
      initialDelaySeconds: 60
      periodSeconds: 30
      timeoutSeconds: 15
      failureThreshold: 3
      
    startup:
      httpGet:
        path: /api/health
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 20
      
  # Resource Configuration - INCREASED FOR STABILITY
  resources:
    requests:
      memory: "6Gi"
      cpu: "3000m"
    limits:
      memory: "12Gi"
      cpu: "6000m"
      
  # Scaling Configuration
  scaling:
    minReplicas: 1
    maxReplicas: 3
    targetCPUUtilizationPercentage: 80
```

### 2. Enhanced start.sh (Timeout Prevention)
**KEY FEATURES:**
- ✅ 60-second startup timeout with retry logic
- ✅ Enhanced environment validation
- ✅ Graceful error handling
- ✅ Performance optimizations

### 3. Enhanced lumo-static-server.js (Multi-Attempt Startup)
**KEY FEATURES:**
- ✅ 3 startup attempts with 2-second delays
- ✅ Health check monitoring every 5 seconds
- ✅ Graceful shutdown handling
- ✅ Enhanced error recovery

## 🎯 EXACT SECRET VALUES

Copy these EXACT values into Choreo Console > Secrets:

### Production Environment Secrets:
```
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3NDM2MjYsImV4cCI6MjA1MDMxOTYyNn0.UOJ-F1nBzKOKNjjz6eSJzxhwGr7r5lOdqJGfC8-KSYQ
SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3NDM2MjYsImV4cCI6MjA1MDMxOTYyNn0.UOJ-F1nBzKOKNjjz6eSJzxhwGr7r5lOdqJGfC8-KSYQ
JWT_SECRET=pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==
DATABASE_URL=postgresql://postgres.ubjujxtvlubxowsphvuk:Theale05042013$$@aws-0-us-east-2.pooler.supabase.com:6543/postgres
NEXTAUTH_SECRET=pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==
NEXTAUTH_URL=https://lumo-1615540597.choreoapis.dev
```

## 🚀 DEPLOYMENT STEPS

### Step 1: Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "feat: enhanced timeout prevention system"
git push origin main
```

### Step 2: Choreo Console Configuration

1. **Go to Choreo Console:** https://console.choreo.dev
2. **Create/Update Component:**
   - Name: `lumo`
   - Type: Web Application
   - Repository: Your GitHub repo
   - Branch: `main`

3. **Configure Secrets:** 
   - Go to "Deploy" > "Configurations" > "Secrets"
   - Add ALL 8 secrets with EXACT values above
   - ⚠️ **CRITICAL:** Copy values exactly, no extra spaces

4. **Configure Environment Variables:**
   - All env vars are now in choreo.yaml
   - No manual configuration needed

### Step 3: Deploy

1. **Trigger Build:**
   - Go to "Deploy" tab
   - Click "Deploy"
   - Monitor build logs

2. **Expected Build Process:**
   ```
   ✅ Build: ~15-20 seconds
   ✅ Deployment: ~30-45 seconds  
   ✅ Health Checks: ~15-30 seconds
   ✅ Total: ~60-95 seconds
   ```

## 🎯 TIMEOUT PREVENTION FEATURES

### 1. **Enhanced Health Checks**
- **Startup Probe:** 20 attempts × 10s = 200s maximum
- **Readiness Probe:** 5 failures allowed before restart
- **Liveness Probe:** 3 failures with 30s intervals

### 2. **Resource Optimization**
- **Memory:** 6GB request, 12GB limit
- **CPU:** 3 cores request, 6 cores limit
- **Startup Timeout:** 60 seconds with retry logic

### 3. **Multi-Attempt Startup**
- **3 startup attempts** with 2-second delays
- **Health monitoring** every 5 seconds
- **Graceful shutdown** handling

## 🔍 VERIFICATION CHECKLIST

After deployment, verify:

### ✅ **Application Access**
- [ ] Main URL responds: `https://lumo-1615540597.choreoapis.dev`
- [ ] Health endpoint: `https://lumo-1615540597.choreoapis.dev/api/health`
- [ ] Login page loads: `https://lumo-1615540597.choreoapis.dev/login`

### ✅ **Configuration Status**
- [ ] No "placeholder" warnings in logs
- [ ] Environment variables detected as "present"
- [ ] Supabase configuration validated
- [ ] JWT authentication working

### ✅ **Performance Metrics**
- [ ] Startup time < 60 seconds
- [ ] Memory usage < 6GB
- [ ] CPU usage < 80%
- [ ] No timeout errors in logs

## 🚨 TROUBLESHOOTING

### If Still Getting 27-Second Timeout:

1. **Check Choreo Logs:**
   ```bash
   # Look for these patterns:
   - "Startup timeout after 60000ms"
   - "Retrying startup (2/3)"
   - "Health check failed"
   ```

2. **Increase Resources:**
   ```yaml
   resources:
     requests:
       memory: "8Gi"  # Increase from 6Gi
       cpu: "4000m"   # Increase from 3000m
   ```

3. **Extend Timeouts:**
   ```yaml
   env:
     - name: STARTUP_TIMEOUT
       value: "90"    # Increase from 60
   ```

### Common Issues:

1. **Secret Configuration:**
   - Verify ALL 8 secrets are configured
   - Check for extra spaces or newlines
   - Ensure values match exactly

2. **Build Failures:**
   - Check Dockerfile exists in root
   - Verify package.json has correct scripts
   - Ensure .next/standalone build exists

3. **Health Check Failures:**
   - Verify /api/health endpoint exists
   - Check port 8080 is accessible
   - Monitor startup logs for errors

## 📊 EXPECTED RESULTS

### ✅ **Success Indicators:**
```
🚀 [LUMO] Enhanced Static Server with Timeout Prevention - v2.0
⏱️  Startup timeout: 60000ms
🔄 Max startup attempts: 3
✅ [LUMO] Static server ready on port 8080
✅ [STANDALONE] Server started successfully
🏥 [STANDALONE] Health check passed
🎉 [LUMO] All services started successfully!
```

### ✅ **Performance Targets:**
- **Startup Time:** < 60 seconds
- **Memory Usage:** < 6GB
- **CPU Usage:** < 80%
- **Success Rate:** 99.9%

## 🎯 NEXT STEPS

After successful deployment:

1. **Monitor Performance:**
   - Check Choreo metrics dashboard
   - Monitor application logs
   - Verify user authentication

2. **Test Core Features:**
   - User login/logout
   - Inventory management
   - Database operations
   - API endpoints

3. **Production Readiness:**
   - Configure domain name
   - Set up monitoring alerts
   - Plan backup strategy
   - Document operational procedures

---

## 🏆 SUCCESS CRITERIA

**Deployment is successful when:**
- ✅ Application starts within 60 seconds
- ✅ No "Standalone server failed to start" errors
- ✅ Health checks pass consistently
- ✅ All environment variables validated
- ✅ User authentication working
- ✅ Database connectivity confirmed

**The enhanced timeout prevention system should eliminate the 27-second failure pattern and provide a stable, production-ready deployment.** 