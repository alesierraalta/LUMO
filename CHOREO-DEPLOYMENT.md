# LUMO Choreo Deployment Guide

## 🚀 Deployment Fixes Applied

### ✅ Issue Resolution: 505 HTTP Version Not Supported ➜ RESUELTO ✅
### ✅ Issue Resolution: 404 Page Not Found ➜ RESUELTO ✅

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
- ✅ `/api/urls` - **NUEVO** - Directorio completo de URLs disponibles
- ✅ Real-time manifest validation
- ✅ System resource monitoring

### 4. **CSS Manifest Fixes**
- ✅ Automatic `entryCSSFiles` repair
- ✅ Fallback CSS file creation
- ✅ Standalone mode compatibility

### 5. **Homepage and Navigation** 🆕
- ✅ Página principal funcional (`/`)
- ✅ Dashboard con navegación intuitiva
- ✅ Enlaces directos a funcionalidades principales
- ✅ Interfaz en español optimizada

## 📋 Deployment Checklist

### Pre-Deployment
- [x] Build completes without errors
- [x] Manifest files exist with proper structure
- [x] CSS files are generated
- [x] Health endpoints respond correctly
- [x] Homepage loads without 404 error

### Choreo Configuration
- [x] Use `start:choreo` script in package.json
- [x] Dockerfile uses `choreo-server.js`
- [x] Port 8080 is exposed and bound to `0.0.0.0`
- [x] Health check points to `/api/health`

### Environment Variables
```bash
NODE_ENV=production
PORT=8080
HOSTNAME=0.0.0.0
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
```

## 🧪 Testing Endpoints

### Homepage (Nuevo)
```bash
curl https://your-choreo-url.choreoapps.dev/
```
**Expected Response**: HTML dashboard con interfaz LUMO

### URL Directory (Nuevo)
```bash
curl https://your-choreo-url.choreoapps.dev/api/urls
```
**Expected Response**: `{"status":"success","endpoints":{...}}`

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

## 🎯 Rutas Disponibles Ahora

### 🏠 Aplicación Principal
- **`/`** - Dashboard principal con navegación
- **`/inventory`** - Gestión de inventario (por implementar)
- **`/products`** - Catálogo de productos (por implementar)
- **`/analytics`** - Reportes y análisis (por implementar)
- **`/settings`** - Configuración (por implementar)

### 🔗 API Endpoints
- **`/api/health`** - Estado completo del sistema
- **`/api/test`** - Prueba básica de conectividad
- **`/api/urls`** - Directorio de todas las URLs disponibles
- **`/api/manifest-status`** - Estado de manifiestos CSS

## 🔧 Troubleshooting

### Still Getting 404 Error?

1. **Verificar que la página principal existe**:
   ```bash
   curl https://your-choreo-url.choreoapps.dev/
   ```

2. **Comprobar directorio de URLs**:
   ```bash
   curl https://your-choreo-url.choreoapps.dev/api/urls
   ```

3. **Revisar logs de servidor**:
   - Buscar errores de renderizado de React
   - Verificar que Tailwind CSS está cargando

### Common Issues

| Issue | Solution |
|-------|----------|
| 505 HTTP Version Not Supported | ✅ RESUELTO - Usar `choreo-server.js` |
| 404 Page Not Found | ✅ RESUELTO - Homepage implementada |
| CSS files not loading | Run manifest validator before startup |
| Health check failing | Verify `/api/health` endpoint is accessible |
| CORS errors | Check CORS headers in `choreo-server.js` |

## 📁 File Structure

```
/app
├── page.tsx                  # 🆕 Homepage principal
├── choreo-server.js          # Choreo-optimized server
├── server.js                 # General production server  
├── scripts/
│   └── manifest-validator.js # CSS manifest repair
├── app/api/
│   ├── health/route.ts       # Health check endpoint
│   ├── test/route.ts         # Test endpoint
│   └── urls/route.ts         # 🆕 URL directory endpoint
├── Dockerfile                # Updated for Choreo
└── package.json              # With start:choreo script
```

## ⚡ Performance Optimizations

- **Standalone Mode**: Uses Next.js standalone output for reduced container size
- **CSS Chunking**: Strict CSS chunking for proper asset loading
- **Health Monitoring**: Comprehensive health checks for uptime monitoring
- **Error Recovery**: Graceful handling of CSS and manifest errors
- **Spanish Interface**: Optimized UI for Spanish-speaking users

## 🔄 Deployment Process

1. **Build**: `npm run build`
2. **Validate**: `npm run prebuild` / `npm run postbuild`
3. **Deploy**: Choreo uses `npm run start:choreo`
4. **Monitor**: Check `/api/health` for status
5. **Navigate**: Visit `/` for main dashboard

## 📈 Success Metrics

- ✅ Server starts without errors
- ✅ Health endpoint returns 200 status
- ✅ No 505 HTTP errors
- ✅ No 404 errors on homepage
- ✅ CSS files load correctly
- ✅ Application is accessible via Choreo URL
- ✅ Dashboard displays properly
- ✅ API directory is functional

## 🎉 Status Actual

| Endpoint | Status | Descripción |
|----------|--------|-------------|
| `/` | ✅ FUNCIONAL | Dashboard principal con interfaz LUMO |
| `/api/health` | ✅ FUNCIONAL | Estado completo del sistema |
| `/api/test` | ✅ FUNCIONAL | Prueba de conectividad |
| `/api/urls` | ✅ FUNCIONAL | Directorio de URLs disponibles |

---

**Last Updated**: 2025-05-28  
**Status**: ✅ **TOTALMENTE FUNCIONAL** - Sin errores 404 o 505 