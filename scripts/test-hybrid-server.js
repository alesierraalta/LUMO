#!/usr/bin/env node

/**
 * TEST HYBRID SERVER
 * Script para probar el servidor híbrido localmente antes del deploy
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 PRUEBA DEL SERVIDOR HÍBRIDO');
console.log('===============================');

const TEST_PORT = process.env.TEST_PORT || 3001;
const TEST_TIMEOUT = 30000; // 30 segundos

// Test endpoints to verify
const testEndpoints = [
  { path: '/health', expected: 'hybrid-emergency-nextjs' },
  { path: '/api/health', expected: 'hybrid server operational' },
  { path: '/', expected: 'LUMO Inventory System' },
  { path: '/emergency-dashboard', expected: 'Dashboard Básico' },
  { path: '/login', expected: 'Iniciar Sesión' }
];

let serverProcess = null;
let testsPassed = 0;
let totalTests = testEndpoints.length;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 Ejecutando pruebas de endpoints...\n');
  
  for (const test of testEndpoints) {
    try {
      console.log(`📍 Probando ${test.path}...`);
      
      const response = await makeRequest(test.path);
      
      if (response.statusCode === 200) {
        if (response.data.includes(test.expected)) {
          console.log(`   ✅ ÉXITO - Status: ${response.statusCode}, Contiene: "${test.expected}"`);
          testsPassed++;
        } else {
          console.log(`   ⚠️ PARCIAL - Status: ${response.statusCode}, No contiene: "${test.expected}"`);
          console.log(`   📄 Respuesta: ${response.data.substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ ERROR - Status: ${response.statusCode}`);
        console.log(`   📄 Respuesta: ${response.data.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 RESULTADOS DE PRUEBAS:');
  console.log(`   ✅ Exitosas: ${testsPassed}/${totalTests}`);
  console.log(`   ❌ Fallidas: ${totalTests - testsPassed}/${totalTests}`);
  console.log(`   📈 Tasa de éxito: ${Math.round((testsPassed / totalTests) * 100)}%`);
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El servidor híbrido está listo para producción.');
  } else if (testsPassed > 0) {
    console.log('\n⚠️ Algunas pruebas fallaron, pero el servidor funciona parcialmente.');
  } else {
    console.log('\n❌ Todas las pruebas fallaron. Revisar la configuración del servidor.');
  }
}

async function waitForServer() {
  console.log('⏳ Esperando que el servidor esté listo...');
  
  const maxAttempts = 15; // 30 segundos máximo
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await makeRequest('/health');
      if (response.statusCode === 200) {
        console.log('✅ Servidor listo para pruebas!');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    attempts++;
    console.log(`   Intento ${attempts}/${maxAttempts}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('❌ Timeout esperando el servidor');
  return false;
}

function startHybridServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando servidor híbrido...');
    
    // Check if hybrid-server.js exists
    const hybridServerPath = path.join(process.cwd(), 'hybrid-server.js');
    
    if (!fs.existsSync(hybridServerPath)) {
      reject(new Error('hybrid-server.js no encontrado'));
      return;
    }
    
    // Set test environment
    const env = {
      ...process.env,
      PORT: TEST_PORT,
      NODE_ENV: 'production'
    };
    
    serverProcess = spawn('node', ['hybrid-server.js'], {
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`📤 [SERVER] ${output.trim()}`);
      
      if (output.includes('Server running')) {
        resolve();
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.log(`📤 [SERVER-ERR] ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (error) => {
      reject(error);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`📴 Servidor terminó con código: ${code}`);
    });
    
    // Timeout for server start
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        resolve(); // Try anyway
      }
    }, 10000);
  });
}

function cleanup() {
  if (serverProcess && !serverProcess.killed) {
    console.log('\n🧹 Limpiando proceso del servidor...');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

async function main() {
  try {
    // Start hybrid server
    await startHybridServer();
    
    // Wait for server to be ready
    const isReady = await waitForServer();
    
    if (!isReady) {
      console.log('❌ El servidor no respondió a tiempo');
      process.exit(1);
    }
    
    // Run tests
    await runTests();
    
    console.log('\n✅ Pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  } finally {
    cleanup();
    setTimeout(() => process.exit(0), 2000);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n📴 Pruebas interrumpidas por el usuario');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📴 Pruebas terminadas');
  cleanup();
  process.exit(0);
});

// Run tests
main(); 