#!/usr/bin/env node

/**
 * Test Custom Server Locally
 * Verifies that our custom server.js works correctly
 */

const http = require('http')

const testEndpoints = [
  { path: '/api/health', name: 'Health Check' },
  { path: '/api/test-simple', name: 'Test Simple' },
  { path: '/api/debug-choreo', name: 'Debug Choreo' },
  { path: '/', name: 'Root Path' }
]

async function testEndpoint(hostname, port, path, name) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const req = http.get(`http://${hostname}:${port}${path}`, (res) => {
      const responseTime = Date.now() - startTime
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        const result = {
          name,
          path,
          status: res.statusCode,
          responseTime: `${responseTime}ms`,
          success: res.statusCode >= 200 && res.statusCode < 300,
          contentType: res.headers['content-type'],
          dataPreview: data.substring(0, 100) + (data.length > 100 ? '...' : '')
        }
        resolve(result)
      })
    })
    
    req.on('error', (err) => {
      resolve({
        name,
        path,
        status: 'ERROR',
        responseTime: `${Date.now() - startTime}ms`,
        success: false,
        error: err.message
      })
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      resolve({
        name,
        path,
        status: 'TIMEOUT',
        responseTime: '5000ms+',
        success: false,
        error: 'Request timeout'
      })
    })
  })
}

async function main() {
  const hostname = process.env.HOSTNAME || 'localhost'
  const port = process.env.PORT || 8080
  
  console.log('🧪 [Test Custom Server] Starting endpoint tests...')
  console.log(`📍 Target: http://${hostname}:${port}`)
  console.log('=' * 50)
  
  const results = []
  
  for (const endpoint of testEndpoints) {
    console.log(`🔍 Testing ${endpoint.name} (${endpoint.path})...`)
    const result = await testEndpoint(hostname, port, endpoint.path, endpoint.name)
    results.push(result)
    
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.status} (${result.responseTime})`)
    } else {
      console.log(`❌ ${result.name}: ${result.status} (${result.responseTime})`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    }
  }
  
  console.log('=' * 50)
  console.log('📊 [Test Summary]')
  
  const successful = results.filter(r => r.success).length
  const total = results.length
  const successRate = ((successful / total) * 100).toFixed(1)
  
  console.log(`✅ Successful: ${successful}/${total} (${successRate}%)`)
  console.log(`❌ Failed: ${total - successful}/${total}`)
  
  if (successful === total) {
    console.log('🎉 All endpoints working correctly!')
    process.exit(0)
  } else {
    console.log('⚠️  Some endpoints failed')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
} 