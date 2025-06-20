#!/usr/bin/env node

/**
 * Custom Next.js Server for Choreo Deployment
 * Handles routing and ensures all requests are properly served
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Load environment variables
const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT, 10) || 8080

console.log('🚀 [Custom Server] Starting LUMO server...')
console.log(`📍 Environment: ${process.env.NODE_ENV}`)
console.log(`🌐 Hostname: ${hostname}`)
console.log(`🔌 Port: ${port}`)

// Create Next.js app
const app = next({ 
  dev, 
  hostname, 
  port,
  // Use standalone build in production
  dir: dev ? '.' : '.next/standalone'
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      console.log(`📥 [${new Date().toISOString()}] ${req.method} ${pathname}`)

      // Handle health check specifically
      if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          server: 'custom-next-server',
          port: port,
          environment: process.env.NODE_ENV
        }))
        return
      }

      // Handle test endpoint specifically  
      if (pathname === '/api/test-simple') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'success',
          message: 'LUMO Server is running correctly!',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'unknown',
          port: port,
          version: '1.0.0',
          server: 'custom-next-server'
        }))
        return
      }

      // Handle root path
      if (pathname === '/') {
        console.log('🏠 [Custom Server] Serving root path')
      }

      // Let Next.js handle all other requests
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('❌ [Custom Server] Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })
  .once('error', (err) => {
    console.error('❌ [Custom Server] Server error:', err)
    process.exit(1)
  })
  .listen(port, hostname, () => {
    console.log(`✅ [Custom Server] Ready on http://${hostname}:${port}`)
    console.log(`🎯 [Custom Server] Health check: http://${hostname}:${port}/api/health`)
    console.log(`🧪 [Custom Server] Test endpoint: http://${hostname}:${port}/api/test-simple`)
  })
})
