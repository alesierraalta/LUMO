/**
 * EMERGENCY STANDALONE SERVER
 * 
 * This is a pure HTTP server that bypasses Next.js completely
 * to resolve the standalone configuration issues in Choreo.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

console.log('🚨 [EMERGENCY-SERVER] Starting emergency standalone server...');

const PORT = process.env.PORT || 8080;
const HOSTNAME = '0.0.0.0';

// Basic HTML template
const createHTML = (title, content) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
        }
        h1 { color: #333; margin-bottom: 1rem; }
        .status { color: #28a745; font-weight: 600; margin: 1rem 0; }
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
        }
        .btn:hover { background: #0056b3; }
        .info { background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LUMO Inventory System</h1>
        <div class="status">✅ Sistema Operativo</div>
        ${content}
        <div class="info">
            <strong>Estado:</strong> Servidor de emergencia activo<br>
            <strong>Versión:</strong> Emergency v1.0<br>
            <strong>Puerto:</strong> ${PORT}
        </div>
    </div>
    <script>
        // Auto-refresh every 30 seconds to check for updates
        setTimeout(() => window.location.reload(), 30000);
    </script>
</body>
</html>
`;

// Routes
const routes = {
    '/': () => createHTML('Dashboard', `
        <p>Bienvenido al sistema de inventario LUMO</p>
        <a href="/dashboard" class="btn">📊 Dashboard</a>
        <a href="/login" class="btn">🔐 Login</a>
        <a href="/health" class="btn">💚 Health Check</a>
    `),
    
    '/dashboard': () => createHTML('Dashboard', `
        <h2>📊 Dashboard</h2>
        <p>Panel de control del inventario</p>
        <a href="/" class="btn">🏠 Inicio</a>
        <a href="/inventory" class="btn">📦 Inventario</a>
    `),
    
    '/login': () => createHTML('Login', `
        <h2>🔐 Iniciar Sesión</h2>
        <p>Sistema de autenticación</p>
        <div style="margin: 1rem 0;">
            <input type="email" placeholder="Email" style="width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <input type="password" placeholder="Password" style="width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <button class="btn" style="width: 100%;">Entrar</button>
        </div>
        <a href="/" class="btn">🏠 Volver</a>
    `),
    
    '/inventory': () => createHTML('Inventario', `
        <h2>📦 Gestión de Inventario</h2>
        <p>Lista de productos y stock</p>
        <a href="/dashboard" class="btn">📊 Dashboard</a>
        <a href="/" class="btn">🏠 Inicio</a>
    `),
    
    '/health': () => JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'emergency-standalone',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'production'
    }),
    
    '/api/health': () => JSON.stringify({
        status: 'healthy',
        message: 'Emergency server operational',
        timestamp: new Date().toISOString()
    })
};

// Create server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log(`🌐 [EMERGENCY-SERVER] ${req.method} ${pathname}`);
    
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
    
    // Route handling
    if (routes[pathname]) {
        const content = routes[pathname]();
        
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
});

// Error handling
server.on('error', (err) => {
    console.error('❌ [EMERGENCY-SERVER] Server error:', err);
    process.exit(1);
});

// Start server
server.listen(PORT, HOSTNAME, () => {
    console.log(`✅ [EMERGENCY-SERVER] Server running at http://${HOSTNAME}:${PORT}`);
    console.log(`🎯 [EMERGENCY-SERVER] Routes available:`);
    console.log(`   - http://${HOSTNAME}:${PORT}/`);
    console.log(`   - http://${HOSTNAME}:${PORT}/dashboard`);
    console.log(`   - http://${HOSTNAME}:${PORT}/login`);
    console.log(`   - http://${HOSTNAME}:${PORT}/health`);
    console.log(`   - http://${HOSTNAME}:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 [EMERGENCY-SERVER] Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ [EMERGENCY-SERVER] Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 [EMERGENCY-SERVER] Received SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('✅ [EMERGENCY-SERVER] Server closed');
        process.exit(0);
    });
}); 