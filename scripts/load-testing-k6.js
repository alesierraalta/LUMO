/**
 * Load Testing Script using k6
 * 
 * Installation:
 * - Windows: choco install k6
 * - Mac: brew install k6
 * - Linux: sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
 *          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
 *          sudo apt-get update
 *          sudo apt-get install k6
 * 
 * Usage:
 * k6 run scripts/load-testing-k6.js
 * k6 run --vus 10 --duration 30s scripts/load-testing-k6.js
 * k6 run --out cloud scripts/load-testing-k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Métricas personalizadas
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const categoryListDuration = new Trend('category_list_duration');
const inventoryCreateDuration = new Trend('inventory_create_duration');

// Configuración de entorno
const ENV = __ENV.TEST_ENV || 'development';
const BASE_URL = ENV === 'production' 
  ? 'https://lumo-woad.vercel.app' 
  : 'http://localhost:3000';

// Credenciales de prueba
const TEST_USERS = [
  { email: 'admin@test.com', password: 'admin123456', role: 'admin' },
  { email: 'user@test.com', password: 'user123456', role: 'user' }
];

// Configuración de escenarios
export const options = {
  scenarios: {
    // Escenario 1: Carga constante
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      startTime: '0s',
      tags: { scenario: 'constant' }
    },
    
    // Escenario 2: Rampa gradual
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 }
      ],
      startTime: '2m',
      tags: { scenario: 'ramping' }
    },
    
    // Escenario 3: Picos de tráfico
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '10s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 5 },
        { duration: '10s', target: 0 }
      ],
      startTime: '4m',
      tags: { scenario: 'spike' }
    },
    
    // Escenario 4: Prueba de estrés
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 }
      ],
      startTime: '5m',
      tags: { scenario: 'stress' }
    }
  },
  
  // Umbrales de rendimiento
  thresholds: {
    // Métricas HTTP
    http_req_duration: [
      'p(95)<500',  // 95% de requests bajo 500ms
      'p(99)<1000'  // 99% de requests bajo 1s
    ],
    http_req_failed: ['rate<0.1'], // Menos del 10% de errores
    
    // Métricas personalizadas
    errors: ['rate<0.05'], // Menos del 5% de errores
    login_duration: ['p(95)<800'],
    category_list_duration: ['p(95)<400'],
    inventory_create_duration: ['p(95)<600']
  },
  
  // Configuración de salida
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  summaryTimeUnit: 'ms'
};

// Configuración de usuario
export function setup() {
  console.log(`🚀 Starting load test against ${ENV} environment`);
  console.log(`📍 Base URL: ${BASE_URL}`);
  
  // Verificar que el servidor esté disponible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  check(healthCheck, {
    'Server is reachable': (r) => r.status === 200
  });
  
  if (healthCheck.status !== 200) {
    throw new Error(`Server not reachable at ${BASE_URL}`);
  }
  
  return { baseUrl: BASE_URL };
}

// Escenario principal
export default function(data) {
  const scenario = __ENV.SCENARIO || 'mixed';
  
  switch (scenario) {
    case 'auth':
      authenticationFlow();
      break;
    case 'browse':
      browsingFlow();
      break;
    case 'admin':
      adminFlow();
      break;
    case 'mixed':
    default:
      // Distribución realista de usuarios
      const random = Math.random();
      if (random < 0.3) {
        authenticationFlow();
      } else if (random < 0.7) {
        browsingFlow();
      } else {
        adminFlow();
      }
  }
  
  sleep(randomIntBetween(1, 3));
}

// Flujo de autenticación
function authenticationFlow() {
  const user = TEST_USERS[randomIntBetween(0, TEST_USERS.length - 1)];
  
  // Login
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password
    }),
    {
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'k6-load-test'
      },
      tags: { flow: 'authentication' }
    }
  );
  loginDuration.add(Date.now() - loginStart);
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined
  });
  
  errorRate.add(!loginSuccess);
  
  if (loginSuccess) {
    const token = loginRes.json('token');
    
    // Verificar token
    const meRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'k6-load-test'
      },
      tags: { flow: 'authentication' }
    });
    
    check(meRes, {
      'token valid': (r) => r.status === 200,
      'user data returned': (r) => r.json('user') !== undefined
    });
  }
}

// Flujo de navegación (usuario sin autenticar o básico)
function browsingFlow() {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { flow: 'browsing' }
  });
  
  check(healthRes, {
    'health check ok': (r) => r.status === 200
  });
  
  // Listar categorías (público o con auth básica)
  const catStart = Date.now();
  const categoriesRes = http.get(`${BASE_URL}/api/categories`, {
    tags: { flow: 'browsing' }
  });
  categoryListDuration.add(Date.now() - catStart);
  
  const catSuccess = check(categoriesRes, {
    'categories loaded': (r) => r.status === 200 || r.status === 401
  });
  
  errorRate.add(!catSuccess && categoriesRes.status >= 500);
  
  // Si se permite acceso público, navegar por categorías
  if (categoriesRes.status === 200) {
    const categories = categoriesRes.json('categories');
    if (categories && categories.length > 0) {
      const randomCat = categories[randomIntBetween(0, Math.min(categories.length - 1, 5))];
      
      // Ver detalles de categoría
      http.get(`${BASE_URL}/api/categories/${randomCat.id}`, {
        tags: { flow: 'browsing' }
      });
      
      // Buscar en categorías
      http.get(`${BASE_URL}/api/categories/search?q=test`, {
        tags: { flow: 'browsing' }
      });
    }
  }
}

// Flujo de administrador
function adminFlow() {
  // Primero autenticarse como admin
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: TEST_USERS[0].email, // Admin
      password: TEST_USERS[0].password
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { flow: 'admin' }
    }
  );
  
  if (loginRes.status !== 200) {
    errorRate.add(1);
    return;
  }
  
  const token = loginRes.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-test'
  };
  
  // Crear categoría
  const categoryName = `Load Test Category ${Date.now()}_${__VU}`;
  const createCatRes = http.post(
    `${BASE_URL}/api/categories`,
    JSON.stringify({
      name: categoryName,
      description: 'Created by k6 load test'
    }),
    {
      headers: authHeaders,
      tags: { flow: 'admin', operation: 'create_category' }
    }
  );
  
  const catCreated = check(createCatRes, {
    'category created': (r) => r.status === 201
  });
  
  if (catCreated) {
    const categoryId = createCatRes.json('id');
    
    // Crear item de inventario
    const invStart = Date.now();
    const createInvRes = http.post(
      `${BASE_URL}/api/inventory`,
      JSON.stringify({
        name: `Load Test Item ${Date.now()}_${__VU}`,
        sku: `K6-${Date.now()}-${__VU}`,
        categoryId: categoryId,
        currentStock: randomIntBetween(10, 100),
        minStockLevel: 10,
        unitCost: randomIntBetween(10, 50),
        unitPrice: randomIntBetween(60, 150),
        description: 'Created by k6 load test'
      }),
      {
        headers: authHeaders,
        tags: { flow: 'admin', operation: 'create_inventory' }
      }
    );
    inventoryCreateDuration.add(Date.now() - invStart);
    
    const invCreated = check(createInvRes, {
      'inventory item created': (r) => r.status === 201
    });
    
    if (invCreated) {
      const itemId = createInvRes.json('id');
      
      // Ajustar stock
      http.post(
        `${BASE_URL}/api/inventory/${itemId}/add-stock`,
        JSON.stringify({
          quantity: randomIntBetween(5, 20),
          notes: 'k6 load test stock adjustment'
        }),
        {
          headers: authHeaders,
          tags: { flow: 'admin', operation: 'adjust_stock' }
        }
      );
      
      // Limpiar - eliminar item
      sleep(1);
      http.del(`${BASE_URL}/api/inventory/${itemId}`, {
        headers: authHeaders,
        tags: { flow: 'admin', operation: 'cleanup' }
      });
    }
    
    // Limpiar - eliminar categoría
    sleep(1);
    http.del(`${BASE_URL}/api/categories/${categoryId}`, {
      headers: authHeaders,
      tags: { flow: 'admin', operation: 'cleanup' }
    });
  }
  
  // Operaciones de lectura adicionales
  http.get(`${BASE_URL}/api/users`, {
    headers: authHeaders,
    tags: { flow: 'admin', operation: 'list_users' }
  });
  
  http.get(`${BASE_URL}/api/inventory?page=1&limit=20`, {
    headers: authHeaders,
    tags: { flow: 'admin', operation: 'list_inventory' }
  });
}

// Limpieza después de las pruebas
export function teardown(data) {
  console.log('✅ Load test completed');
  
  // Aquí podrías agregar lógica para limpiar datos de prueba
  // o enviar notificaciones
}

// Función para manejar métricas personalizadas
export function handleSummary(data) {
  const now = new Date().toISOString();
  const env = ENV;
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    [`./load-test-results/summary-${env}-${now}.json`]: JSON.stringify(data, null, 2),
    [`./load-test-results/summary-${env}-${now}.html`]: htmlReport(data)
  };
}

// Función helper para generar reporte HTML
function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Results - ${ENV}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
        .pass { color: green; }
        .fail { color: red; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <h1>Load Test Results - ${ENV} Environment</h1>
    <p>Test completed at: ${new Date().toLocaleString()}</p>
    
    <h2>Summary</h2>
    <div class="metric">
        <strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}<br>
        <strong>Failed Requests:</strong> ${data.metrics.http_req_failed.values.passes}<br>
        <strong>Average Response Time:</strong> ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms<br>
        <strong>95th Percentile:</strong> ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    </div>
    
    <h2>Custom Metrics</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Average</th>
            <th>Min</th>
            <th>Max</th>
            <th>P95</th>
        </tr>
        <tr>
            <td>Login Duration</td>
            <td>${data.metrics.login_duration?.values.avg?.toFixed(2) || 'N/A'}ms</td>
            <td>${data.metrics.login_duration?.values.min?.toFixed(2) || 'N/A'}ms</td>
            <td>${data.metrics.login_duration?.values.max?.toFixed(2) || 'N/A'}ms</td>
            <td>${data.metrics.login_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms</td>
        </tr>
        <tr>
            <td>Category List Duration</td>
            <td>${data.metrics.category_list_duration?.values.avg?.toFixed(2) || 'N/A'}ms</td>
            <td>${data.metrics.category_list_duration?.values.min?.toFixed(2) || 'N/A'}ms</td>
            <td>${data.metrics.category_list_duration?.values.max?.toFixed(2) || 'N/A'}ms</td>
            <td>${data.metrics.category_list_duration?.values['p(95)']?.toFixed(2) || 'N/A'}ms</td>
        </tr>
    </table>
    
    <h2>Thresholds</h2>
    ${Object.entries(data.metrics).map(([key, metric]) => {
        if (metric.thresholds) {
            const passed = Object.values(metric.thresholds).every(t => t.ok);
            return `<div class="metric ${passed ? 'pass' : 'fail'}">
                <strong>${key}:</strong> ${passed ? 'PASSED' : 'FAILED'}
            </div>`;
        }
        return '';
    }).join('')}
</body>
</html>
  `;
}

// Importar utilidad de resumen de texto
function textSummary(data, options) {
  // Implementación simplificada del resumen de texto
  let summary = '\n=== LOAD TEST SUMMARY ===\n';
  summary += `Environment: ${ENV}\n`;
  summary += `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  summary += `Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += '========================\n';
  return summary;
}