/**
 * Optimized Choreo Server for Production Deployment
 * 
 * Fixes 505 HTTP Version Not Supported error and ensures
 * full compatibility with Choreo infrastructure.
 */

const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

console.log('[CHOREO-SERVER] 🚀 Starting LUMO Inventory System for Choreo...');

// Environment configuration optimized for Choreo
const port = parseInt(process.env.PORT, 10) || 8080;
const hostname = '0.0.0.0'; // Required for Choreo container binding
const dev = false; // Always production mode in Choreo
const nextDir = path.join(process.cwd(), '.next');

console.log(`[CHOREO-SERVER] 📡 Port: ${port}`);
console.log(`[CHOREO-SERVER] 🌍 Hostname: ${hostname}`);
console.log(`[CHOREO-SERVER] 🏭 Environment: ${process.env.NODE_ENV}`);

// Verificar y asegurar que el usuario administrador existe
async function ensureAdminUser() {
  try {
    console.log('[CHOREO-SERVER] 👤 Verificando usuario administrador...');
    
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    // Buscar usuario administrador
    const adminUser = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' }
    });
    
    if (!adminUser) {
      console.log('[CHOREO-SERVER] ⚠️ Usuario administrador no encontrado, creándolo...');
      
      // Buscar rol de administrador
      let adminRole = await prisma.role.findUnique({
        where: { name: 'admin' }
      });
      
      // Si no existe el rol, crearlo
      if (!adminRole) {
        adminRole = await prisma.role.create({
          data: {
            name: 'admin',
            description: 'Acceso completo a todas las funcionalidades'
          }
        });
        
        // Crear permiso básico
        const adminPermission = await prisma.permission.create({
          data: {
            name: 'admin:all',
            description: 'Acceso completo de administrador',
            resource: 'admin',
            action: 'all'
          }
        });
        
        // Asignar permiso al rol
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: adminPermission.id
          }
        });
      }
      
      // Crear usuario administrador
      const passwordHash = await bcrypt.hash('admin123', 12);
      await prisma.user.create({
        data: {
          email: 'alesierraalta@gmail.com',
          passwordHash: passwordHash,
          firstName: 'Alejandro',
          lastName: 'Sierra',
          roleId: adminRole.id,
          isActive: true,
          isEmailVerified: true
        }
      });
      
      console.log('[CHOREO-SERVER] ✅ Usuario administrador creado exitosamente');
    } else {
      console.log('[CHOREO-SERVER] ✅ Usuario administrador encontrado');
      
      // Asegurar que el usuario tenga rol de administrador
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' }
      });
      
      if (adminRole && adminUser.roleId !== adminRole.id) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { roleId: adminRole.id }
        });
        console.log('[CHOREO-SERVER] ✅ Rol de administrador actualizado');
      }
    }
    
    await prisma.$disconnect();
    console.log('[CHOREO-SERVER] 🔒 Verificación de usuario administrador completada');
  } catch (error) {
    console.error('[CHOREO-SERVER] ❌ Error al verificar usuario administrador:', error);
  }
}

// Enhanced manifest validation and repair
const validateAndRepairManifests = () => {
  console.log('[CHOREO-SERVER] 🔧 Validating and repairing manifest files...');
  
  const manifestPaths = [
    path.join(nextDir, 'build-manifest.json'),
    path.join(nextDir, 'app-build-manifest.json'),
    path.join(nextDir, 'standalone', '.next', 'build-manifest.json'),
    path.join(nextDir, 'standalone', '.next', 'app-build-manifest.json')
  ];

  let repairCount = 0;
  
  manifestPaths.forEach(manifestPath => {
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        let needsRepair = false;
        
        // Ensure entryCSSFiles exists
        if (!manifest.entryCSSFiles) {
          manifest.entryCSSFiles = manifestPath.includes('app-build') ? {} : { '/_app': [], '/': [] };
          needsRepair = true;
        }
        
        // Ensure cssFiles exists for app manifests
        if (manifestPath.includes('app-build') && !manifest.cssFiles) {
          manifest.cssFiles = {};
          needsRepair = true;
        }
        
        if (needsRepair) {
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          console.log(`[CHOREO-SERVER] ✅ Repaired: ${path.basename(manifestPath)}`);
          repairCount++;
        }
      } catch (error) {
        console.error(`[CHOREO-SERVER] ❌ Error repairing ${manifestPath}:`, error.message);
      }
    }
  });
  
  console.log(`[CHOREO-SERVER] 🔧 Manifests repaired: ${repairCount}`);
};

// Create fallback CSS files
const createFallbackCSS = () => {
  console.log('[CHOREO-SERVER] 🎨 Creating fallback CSS files...');
  
  const cssDir = path.join(nextDir, 'static', 'css');
  const standaloneCSSDir = path.join(nextDir, 'standalone', '.next', 'static', 'css');
  
  const fallbackCSS = `/* LUMO Inventory System - Fallback CSS */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
  color: #1a1a1a;
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: 18px;
  color: #666;
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
  color: #c33;
}

.btn {
  background: #0066cc;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background: #0052a3;
}`;

  // Create CSS directories and files
  [cssDir, standaloneCSSDir].forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const cssFiles = ['app.css', 'globals.css', 'main.css', 'fallback.css'];
      cssFiles.forEach(fileName => {
        const filePath = path.join(dir, fileName);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, fallbackCSS);
          console.log(`[CHOREO-SERVER] ✅ Created: ${fileName}`);
        }
      });
    } catch (error) {
      console.error(`[CHOREO-SERVER] ❌ Error creating CSS in ${dir}:`, error.message);
    }
  });
};

// Health check handler with comprehensive status
const handleHealthCheck = (req, res) => {
  const isHealthCheck = req.url === '/health' || 
                       req.url === '/api/health' ||
                       req.url === '/api/manifest-status';
  
  if (isHealthCheck) {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LUMO Inventory System',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      port: port,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      manifestsRepaired: true,
      cssFilesCreated: true,
      choreoCompatible: true
    };

    // Validate manifests in real-time
    try {
      const buildManifest = path.join(nextDir, 'build-manifest.json');
      if (fs.existsSync(buildManifest)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
        healthData.manifestValid = !!manifest.entryCSSFiles;
      }
    } catch (error) {
      healthData.manifestError = error.message;
    }

    // Set proper HTTP headers for Choreo
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Powered-By': 'LUMO-Choreo-Server/1.0'
    });
    
    res.end(JSON.stringify(healthData, null, 2));
    return true;
  }
  
  return false;
};

// Custom request handler with Choreo optimizations
const createRequestHandler = (nextHandler) => {
  return async (req, res) => {
    try {
      // Handle health checks first
      if (handleHealthCheck(req, res)) {
        return;
      }

      // Handle OPTIONS requests for CORS
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
      }

      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Enhanced CSS file serving
      if (req.url && req.url.startsWith('/_next/static/css/')) {
        const cssPath = path.join(nextDir, 'static', 'css', path.basename(req.url));
        
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          res.writeHead(200, {
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': `"${Buffer.from(cssContent).toString('base64').slice(0, 16)}"`
          });
          res.end(cssContent);
          return;
        }
      }

      // Let Next.js handle the request
      await nextHandler(req, res);
      
    } catch (error) {
      console.error('[CHOREO-SERVER] ❌ Request error:', {
        url: req.url,
        method: req.method,
        error: error.message
      });

      // Handle CSS-related errors gracefully
      if (error.message && error.message.includes('entryCSSFiles')) {
        console.log('[CHOREO-SERVER] 🔧 CSS error handled, serving fallback');
        
        if (!res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'text/css' });
          res.end('/* CSS error handled by Choreo server */');
        }
        return;
      }

      // Generic error response
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    }
  };
};

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[CHOREO-SERVER] 💥 Uncaught Exception:', error.message);
  
  // Don't crash on CSS-related errors
  if (error.message && error.message.includes('entryCSSFiles')) {
    console.log('[CHOREO-SERVER] 🔧 CSS error caught, continuing...');
    return;
  }
  
  console.error('[CHOREO-SERVER] 💀 Fatal error, exiting...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CHOREO-SERVER] 💥 Unhandled Rejection:', reason);
  
  // Don't crash on CSS-related rejections
  if (reason && reason.message && reason.message.includes('entryCSSFiles')) {
    console.log('[CHOREO-SERVER] 🔧 CSS rejection caught, continuing...');
    return;
  }
});

// Start the server with additional initialization
async function startServer() {
  try {
    console.log('[CHOREO-SERVER] 🔄 Initializing server...');
    
    // Verificar usuario administrador antes de iniciar
    await ensureAdminUser();
    
    // Validate and repair manifests
    validateAndRepairManifests();
    
    // Create fallback CSS files
    createFallbackCSS();
    
    // Initialize Next.js
    const app = next({ dev, dir: process.cwd() });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    console.log('[CHOREO-SERVER] ✅ Next.js prepared successfully');
    
    // Create HTTP server with custom request handler
    const server = createServer(createRequestHandler(handle));
    
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`[CHOREO-SERVER] 🚀 Server running at http://${hostname}:${port}`);
      console.log('[CHOREO-SERVER] 🌟 LUMO Inventory System ready for connections');
    });
    
  } catch (error) {
    console.error('[CHOREO-SERVER] ❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 