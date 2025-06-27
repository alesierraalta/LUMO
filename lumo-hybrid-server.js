// LUMO Hybrid Server - Enhanced version for real Next.js app loading
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

console.log('🔄 [LUMO-HYBRID] Starting enhanced hybrid server...');

const PORT = process.env.PORT || 8080;
const HOSTNAME = '0.0.0.0';

let nextApp = null;
let nextHandle = null;
let nextReady = false;

// Check for standalone server
const standaloneServerPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
const hasStandaloneServer = fs.existsSync(standaloneServerPath);

console.log(`🔍 [LUMO-HYBRID] Standalone server: ${hasStandaloneServer ? '✅' : '❌'}`);

// Initialize Next.js
async function initializeNextApp() {
  try {
    console.log('🚀 [LUMO-HYBRID] Initializing Next.js...');
    
    const next = require('next');
    
    nextApp = next({ 
      dev: false,
      hostname: HOSTNAME,
      port: PORT,
      dir: process.cwd()
    });
    
    nextHandle = nextApp.getRequestHandler();
    await nextApp.prepare();
    
    nextReady = true;
    console.log('✅ [LUMO-HYBRID] Next.js ready!');
    
  } catch (error) {
    console.error('❌ [LUMO-HYBRID] Next.js failed:', error.message);
    nextReady = false;
  }
}

// Emergency routes
const emergencyRoutes = {
  '/': () => `
<!DOCTYPE html>
<html>
<head>
    <title>LUMO Inventory System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
        .status { padding: 10px; border-radius: 5px; margin: 20px 0; text-align: center; font-weight: bold; }
        .ready { background: #d4edda; color: #155724; }
        .loading { background: #fff3cd; color: #856404; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0056b3; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LUMO Inventory System</h1>
        <div class="status ${nextReady ? 'ready' : 'loading'}">
            ${nextReady ? '✅ Sistema LUMO Completo Listo' : '⏳ Cargando Sistema LUMO...'}
        </div>
        
        <h2>Sistema de Gestión de Inventario</h2>
        <p>Plataforma completa para el control y gestión de inventarios empresariales</p>
        
        <div class="grid">
            ${nextReady ? `
                <a href="/dashboard" class="btn">📊 Dashboard</a>
                <a href="/inventory" class="btn">📦 Inventario</a>
                <a href="/sales" class="btn">💰 Ventas</a>
                <a href="/categories" class="btn">🏷️ Categorías</a>
                <a href="/locations" class="btn">📍 Ubicaciones</a>
                <a href="/reports/low-stock" class="btn">📈 Reportes</a>
            ` : `
                <a href="/emergency-dashboard" class="btn">📊 Dashboard Básico</a>
                <a href="/health" class="btn">💚 Estado</a>
            `}
            <a href="/login" class="btn">🔐 Login</a>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Estado:</strong> ${nextReady ? 'Aplicación completa' : 'Modo emergencia'}<br>
            <strong>Next.js:</strong> ${nextReady ? '✅ Listo' : '⏳ Cargando'}<br>
            <strong>Standalone:</strong> ${hasStandaloneServer ? '✅ Disponible' : '❌ No disponible'}
        </div>
    </div>
    ${!nextReady ? '<script>setTimeout(() => window.location.reload(), 10000);</script>' : ''}
</body>
</html>
  `,
  
  '/health': () => JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'lumo-hybrid',
    nextjs: nextReady,
    standalone: hasStandaloneServer,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  }),
  
  '/api/health': () => JSON.stringify({
    status: 'healthy',
    message: 'LUMO hybrid server operational',
    nextjs_ready: nextReady,
    timestamp: new Date().toISOString()
  })
};

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`🌐 [LUMO-HYBRID] ${req.method} ${pathname} (Next.js: ${nextReady ? 'Ready' : 'Loading'})`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // If Next.js is ready and not emergency route, use Next.js
    if (nextReady && nextHandle && !pathname.startsWith('/emergency-') && !pathname.startsWith('/health') && !pathname.startsWith('/api/health')) {
      console.log(`🎯 [LUMO-HYBRID] Routing to Next.js: ${pathname}`);
      return nextHandle(req, res);
    }
    
    // Use emergency routes
    if (emergencyRoutes[pathname]) {
      const content = emergencyRoutes[pathname]();
      
      if (pathname.includes('/api/') || pathname === '/health') {
        res.setHeader('Content-Type', 'application/json');
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
      
      res.writeHead(200);
      res.end(content);
    } else {
      // 404
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.writeHead(404);
      res.end(`
        <html>
        <body style="font-family: Arial; margin: 40px; text-align: center;">
          <h2>❌ Página No Encontrada</h2>
          <p>La página <code>${pathname}</code> no existe</p>
          <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🏠 Inicio</a>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('❌ [LUMO-HYBRID] Request error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// Start server
server.listen(PORT, HOSTNAME, () => {
  console.log(`✅ [LUMO-HYBRID] LUMO Hybrid Server running at http://${HOSTNAME}:${PORT}`);
  console.log(`🎯 [LUMO-HYBRID] Emergency routes always available`);
  console.log(`🚀 [LUMO-HYBRID] Next.js routes available when ready`);
  
  // Initialize Next.js in background
  initializeNextApp();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 [LUMO-HYBRID] Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('📴 [LUMO-HYBRID] Shutting down gracefully...');
  server.close(() => process.exit(0));
}); 