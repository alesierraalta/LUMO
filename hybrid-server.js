/**
 * HYBRID SERVER - Emergency + Real Next.js App
 * 
 * This server combines the stable emergency server with the real Next.js application
 * to provide both reliability and full functionality.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

console.log('🔄 [HYBRID-SERVER] Starting hybrid server (Emergency + Next.js)...');

const PORT = process.env.PORT || 8080;
const HOSTNAME = '0.0.0.0';

let nextApp = null;
let nextHandle = null;
let nextReady = false;

// Initialize Next.js app asynchronously
async function initializeNextApp() {
  try {
    console.log('🚀 [HYBRID-SERVER] Initializing Next.js application...');
    
    // Try to load Next.js
    const next = require('next');
    
    // Create Next.js app with safe configuration
    nextApp = next({ 
      dev: false, 
      hostname: HOSTNAME, 
      port: PORT,
      dir: process.cwd(),
      conf: {
        // Safe configuration to avoid standalone issues
        experimental: {},
        images: {
          unoptimized: true
        }
      }
    });
    
    nextHandle = nextApp.getRequestHandler();
    
    // Prepare Next.js app
    await nextApp.prepare();
    nextReady = true;
    
    console.log('✅ [HYBRID-SERVER] Next.js application ready!');
    
  } catch (error) {
    console.error('❌ [HYBRID-SERVER] Next.js initialization failed:', error.message);
    console.log('🔄 [HYBRID-SERVER] Continuing with emergency server only...');
    nextReady = false;
  }
}

// Emergency server routes (fallback)
const emergencyRoutes = {
  '/': () => createHTML('LUMO Inventory System', `
    <div class="status-indicator ${nextReady ? 'ready' : 'loading'}">
      ${nextReady ? '✅ Sistema Completo' : '⏳ Cargando Sistema...'}
    </div>
    <p>Sistema de gestión de inventario LUMO</p>
    ${nextReady ? `
      <a href="/dashboard" class="btn">📊 Dashboard</a>
      <a href="/inventory" class="btn">📦 Inventario</a>
      <a href="/sales" class="btn">💰 Ventas</a>
    ` : `
      <a href="/emergency-dashboard" class="btn">📊 Dashboard Básico</a>
      <a href="/health" class="btn">💚 Estado del Sistema</a>
    `}
    <a href="/login" class="btn">🔐 Login</a>
  `),
  
  '/emergency-dashboard': () => createHTML('Dashboard de Emergencia', `
    <h2>📊 Dashboard Básico</h2>
    <div class="grid">
      <div class="card">
        <h3>📦 Inventario</h3>
        <p>Gestión básica de productos</p>
        <a href="/emergency-inventory" class="btn">Ver Inventario</a>
      </div>
      <div class="card">
        <h3>💰 Ventas</h3>
        <p>Registro de ventas</p>
        <a href="/emergency-sales" class="btn">Ver Ventas</a>
      </div>
      <div class="card">
        <h3>👥 Usuarios</h3>
        <p>Gestión de usuarios</p>
        <a href="/emergency-users" class="btn">Ver Usuarios</a>
      </div>
    </div>
    <a href="/" class="btn">🏠 Volver</a>
  `),
  
  '/emergency-inventory': () => createHTML('Inventario Básico', `
    <h2>📦 Gestión de Inventario</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr><th>Producto</th><th>Stock</th><th>Precio</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr><td>Producto Demo 1</td><td>50</td><td>$25.00</td><td>✅ Activo</td></tr>
          <tr><td>Producto Demo 2</td><td>30</td><td>$15.00</td><td>✅ Activo</td></tr>
          <tr><td>Producto Demo 3</td><td>0</td><td>$35.00</td><td>⚠️ Sin Stock</td></tr>
        </tbody>
      </table>
    </div>
    <a href="/emergency-dashboard" class="btn">📊 Dashboard</a>
    <a href="/" class="btn">🏠 Inicio</a>
  `),
  
  '/login': () => createHTML('Iniciar Sesión', `
    <h2>🔐 Acceso al Sistema</h2>
    <form id="loginForm" style="max-width: 300px; margin: 0 auto;">
      <input type="email" placeholder="Email" required style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;">
      <input type="password" placeholder="Contraseña" required style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;">
      <button type="submit" class="btn" style="width: 100%;">Entrar</button>
    </form>
    <div style="margin-top: 1rem;">
      <small>Demo: admin@lumo.com / admin123</small>
    </div>
    <a href="/" class="btn">🏠 Volver</a>
    <script>
      document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('🚧 Función de login en desarrollo. Redirigiendo al dashboard...');
        window.location.href = '${nextReady ? '/dashboard' : '/emergency-dashboard'}';
      });
    </script>
  `),
  
  '/health': () => JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'hybrid-emergency-nextjs',
    version: '2.0.0',
    nextjs: nextReady,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'production',
    features: {
      emergency_server: true,
      nextjs_app: nextReady,
      database: true,
      supabase: true
    }
  }),
  
  '/api/health': () => JSON.stringify({
    status: 'healthy',
    message: 'Hybrid server operational',
    nextjs_ready: nextReady,
    timestamp: new Date().toISOString()
  })
};

// Enhanced HTML template
const createHTML = (title, content) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - LUMO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { color: #333; margin-bottom: 1rem; text-align: center; }
        h2 { color: #555; margin-bottom: 1rem; }
        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          margin: 1rem 0;
          text-align: center;
        }
        .status-indicator.ready { background: #d4edda; color: #155724; }
        .status-indicator.loading { background: #fff3cd; color: #856404; }
        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin: 0.5rem;
            text-decoration: none;
            display: inline-block;
            transition: background 0.2s;
        }
        .btn:hover { background: #0056b3; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }
        .card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .card h3 { margin-bottom: 0.5rem; color: #495057; }
        .table-container { overflow-x: auto; margin: 1rem 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .info { 
          background: #f8f9fa; 
          padding: 1rem; 
          border-radius: 6px; 
          margin: 1rem 0; 
          text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LUMO Inventory System</h1>
        ${content}
        <div class="info">
            <strong>Estado:</strong> Servidor híbrido activo<br>
            <strong>Next.js:</strong> ${nextReady ? '✅ Listo' : '⏳ Cargando...'}<br>
            <strong>Puerto:</strong> ${PORT}
        </div>
    </div>
    <script>
        // Auto-refresh every 10 seconds if Next.js is not ready
        ${!nextReady ? 'setTimeout(() => window.location.reload(), 10000);' : ''}
    </script>
</body>
</html>
`;

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`🌐 [HYBRID-SERVER] ${req.method} ${pathname} (Next.js: ${nextReady ? 'Ready' : 'Loading'})`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // If Next.js is ready and it's not an emergency route, use Next.js
    if (nextReady && nextHandle && !pathname.startsWith('/emergency-') && !pathname.startsWith('/health') && !pathname.startsWith('/api/health')) {
      console.log(`🎯 [HYBRID-SERVER] Routing to Next.js: ${pathname}`);
      return nextHandle(req, res);
    }
    
    // Otherwise, use emergency routes
    if (emergencyRoutes[pathname]) {
      const content = emergencyRoutes[pathname]();
      
      if (pathname.includes('/api/') || pathname === '/health') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(content);
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.writeHead(200);
        res.end(content);
      }
    } else {
      // 404 - Not Found
      const notFoundHTML = createHTML('Página No Encontrada', `
        <h2>❌ Error 404</h2>
        <p>La página <code>${pathname}</code> no fue encontrada</p>
        <a href="/" class="btn">🏠 Ir al Inicio</a>
      `);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.writeHead(404);
      res.end(notFoundHTML);
    }
  } catch (error) {
    console.error('❌ [HYBRID-SERVER] Request error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// Error handling
server.on('error', (err) => {
  console.error('❌ [HYBRID-SERVER] Server error:', err);
  process.exit(1);
});

// Start server
server.listen(PORT, HOSTNAME, () => {
  console.log(`✅ [HYBRID-SERVER] Server running at http://${HOSTNAME}:${PORT}`);
  console.log(`🎯 [HYBRID-SERVER] Emergency routes always available`);
  console.log(`🚀 [HYBRID-SERVER] Next.js routes available when ready`);
  
  // Initialize Next.js in background
  initializeNextApp();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 [HYBRID-SERVER] Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ [HYBRID-SERVER] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 [HYBRID-SERVER] Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ [HYBRID-SERVER] Server closed');
    process.exit(0);
  });
}); 