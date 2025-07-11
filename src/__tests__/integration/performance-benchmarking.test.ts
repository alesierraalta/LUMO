/**
 * Suite de pruebas de benchmarking de rendimiento
 * Establece métricas base para operaciones críticas
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { makeRequest, ENVIRONMENTS } from './vercel-production-validation.test';
import fs from 'fs';
import path from 'path';

// Configuración de entorno
const testMode = process.env.TEST_MODE || 'development';
const currentEnv = ENVIRONMENTS[testMode === 'production' ? 'production' : 'development'];

// Umbrales de rendimiento (en milisegundos)
const PERFORMANCE_THRESHOLDS = {
  auth: {
    login: 500,
    register: 800,
    tokenValidation: 200
  },
  api: {
    simpleGet: 300,
    complexQuery: 800,
    createOperation: 600,
    updateOperation: 500,
    deleteOperation: 400,
    bulkOperation: 2000
  },
  database: {
    singleQuery: 100,
    joinQuery: 300,
    aggregation: 500
  }
};

// Estructura para almacenar resultados
interface BenchmarkResult {
  operation: string;
  environment: string;
  timestamp: string;
  metrics: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    samples: number;
  };
  threshold: number;
  passed: boolean;
}

const benchmarkResults: BenchmarkResult[] = [];

// Función helper para calcular percentiles
function calculatePercentile(arr: number[], percentile: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// Función para ejecutar múltiples iteraciones de una operación
async function benchmarkOperation(
  name: string,
  operation: () => Promise<any>,
  iterations: number = 50,
  threshold: number
): Promise<BenchmarkResult> {
  const times: number[] = [];
  let errors = 0;

  console.log(`\n🏃 Benchmarking: ${name} (${iterations} iterations)`);

  for (let i = 0; i < iterations; i++) {
    try {
      const start = Date.now();
      await operation();
      const duration = Date.now() - start;
      times.push(duration);
      
      // Mostrar progreso cada 10 iteraciones
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${iterations}`);
      }
    } catch (error) {
      errors++;
      console.error(`  Error in iteration ${i + 1}:`, error);
    }
  }

  // Calcular métricas
  const successfulRuns = times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = calculatePercentile(times, 50);
  const p95 = calculatePercentile(times, 95);
  const p99 = calculatePercentile(times, 99);
  const passed = avg <= threshold;

  const result: BenchmarkResult = {
    operation: name,
    environment: currentEnv.name,
    timestamp: new Date().toISOString(),
    metrics: {
      min,
      max,
      avg,
      p50,
      p95,
      p99,
      samples: successfulRuns
    },
    threshold,
    passed
  };

  console.log(`
  📊 Results for ${name}:
    - Min: ${min}ms
    - Max: ${max}ms
    - Avg: ${avg.toFixed(2)}ms
    - P50: ${p50}ms
    - P95: ${p95}ms
    - P99: ${p99}ms
    - Success rate: ${((successfulRuns / iterations) * 100).toFixed(1)}%
    - Threshold: ${threshold}ms
    - Status: ${passed ? '✅ PASS' : '❌ FAIL'}
  `);

  benchmarkResults.push(result);
  return result;
}

describe('⚡ Performance Benchmarking Suite', () => {
  let adminToken: string;
  let testCategoryId: string;
  let testInventoryIds: string[] = [];

  beforeAll(async () => {
    console.log(`\n🚀 Starting Performance Benchmarking on ${currentEnv.name}`);
    console.log(`📍 Base URL: ${currentEnv.baseUrl}`);
    
    // Obtener token de admin
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123456'
      })
    });

    if (loginResponse.status === 200) {
      adminToken = loginResponse.data.token;
      console.log('✅ Admin authentication successful');
    } else {
      throw new Error('Failed to authenticate admin user');
    }

    // Crear categoría de prueba
    const categoryResponse = await makeRequest('/api/categories', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Benchmark Category ${Date.now()}`,
        description: 'Category for performance benchmarking'
      })
    });

    if (categoryResponse.status === 201) {
      testCategoryId = categoryResponse.data.id;
    }
  });

  afterAll(async () => {
    console.log('\n🧹 Cleaning up benchmark data...');
    
    // Limpiar items de inventario
    for (const itemId of testInventoryIds) {
      try {
        await makeRequest(`/api/inventory/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
      } catch (error) {
        // Ignorar errores de limpieza
      }
    }

    // Limpiar categoría
    if (testCategoryId) {
      try {
        await makeRequest(`/api/categories/${testCategoryId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
      } catch (error) {
        // Ignorar errores de limpieza
      }
    }

    // Guardar resultados en archivo
    const resultsPath = path.join(process.cwd(), 'benchmark-results');
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    const filename = `benchmark-${currentEnv.name.toLowerCase()}-${Date.now()}.json`;
    const filepath = path.join(resultsPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify({
      environment: currentEnv.name,
      timestamp: new Date().toISOString(),
      results: benchmarkResults
    }, null, 2));

    console.log(`\n📄 Benchmark results saved to: ${filepath}`);

    // Generar resumen
    generateBenchmarkSummary();
  });

  describe('🔐 Authentication Benchmarks', () => {
    it('should benchmark login performance', async () => {
      const result = await benchmarkOperation(
        'User Login',
        async () => {
          const response = await makeRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: 'admin@test.com',
              password: 'admin123456'
            })
          });
          if (response.status !== 200) {
            throw new Error(`Login failed with status ${response.status}`);
          }
        },
        30,
        PERFORMANCE_THRESHOLDS.auth.login
      );

      expect(result.passed).toBe(true);
    });

    it('should benchmark token validation', async () => {
      const result = await benchmarkOperation(
        'Token Validation',
        async () => {
          const response = await makeRequest('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (response.status !== 200) {
            throw new Error(`Token validation failed with status ${response.status}`);
          }
        },
        50,
        PERFORMANCE_THRESHOLDS.auth.tokenValidation
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('📊 API Endpoint Benchmarks', () => {
    it('should benchmark simple GET operations', async () => {
      const result = await benchmarkOperation(
        'GET /api/categories',
        async () => {
          const response = await makeRequest('/api/categories', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (response.status !== 200) {
            throw new Error(`GET failed with status ${response.status}`);
          }
        },
        50,
        PERFORMANCE_THRESHOLDS.api.simpleGet
      );

      expect(result.passed).toBe(true);
    });

    it('should benchmark complex queries with filters', async () => {
      const result = await benchmarkOperation(
        'Complex Query with Pagination',
        async () => {
          const response = await makeRequest(
            '/api/inventory?page=1&limit=20&sort=name&order=asc&category=' + testCategoryId,
            {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            }
          );
          if (response.status !== 200) {
            throw new Error(`Query failed with status ${response.status}`);
          }
        },
        40,
        PERFORMANCE_THRESHOLDS.api.complexQuery
      );

      expect(result.passed).toBe(true);
    });

    it('should benchmark CREATE operations', async () => {
      const result = await benchmarkOperation(
        'POST /api/inventory',
        async () => {
          const response = await makeRequest('/api/inventory', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({
              name: `Benchmark Item ${Date.now()}`,
              sku: `BENCH-${Date.now()}`,
              categoryId: testCategoryId,
              currentStock: 100,
              minStockLevel: 10,
              unitCost: 25.00,
              unitPrice: 50.00
            })
          });
          if (response.status !== 201) {
            throw new Error(`Create failed with status ${response.status}`);
          }
          testInventoryIds.push(response.data.id);
        },
        30,
        PERFORMANCE_THRESHOLDS.api.createOperation
      );

      expect(result.passed).toBe(true);
    });

    it('should benchmark UPDATE operations', async () => {
      // Crear un item para actualizar
      const createResponse = await makeRequest('/api/inventory', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Update Benchmark Item',
          sku: `UPDATE-${Date.now()}`,
          categoryId: testCategoryId,
          currentStock: 50,
          minStockLevel: 5,
          unitCost: 10.00,
          unitPrice: 20.00
        })
      });

      const itemId = createResponse.data.id;
      testInventoryIds.push(itemId);

      const result = await benchmarkOperation(
        'PUT /api/inventory/:id',
        async () => {
          const response = await makeRequest(`/api/inventory/${itemId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({
              currentStock: Math.floor(Math.random() * 100),
              unitPrice: Math.random() * 100
            })
          });
          if (response.status !== 200) {
            throw new Error(`Update failed with status ${response.status}`);
          }
        },
        40,
        PERFORMANCE_THRESHOLDS.api.updateOperation
      );

      expect(result.passed).toBe(true);
    });

    it('should benchmark DELETE operations', async () => {
      // Crear items para eliminar
      const itemsToDelete: string[] = [];
      for (let i = 0; i < 30; i++) {
        const response = await makeRequest('/api/inventory', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify({
            name: `Delete Item ${i}`,
            sku: `DEL-${Date.now()}-${i}`,
            categoryId: testCategoryId,
            currentStock: 10,
            minStockLevel: 1,
            unitCost: 5.00,
            unitPrice: 10.00
          })
        });
        itemsToDelete.push(response.data.id);
      }

      const result = await benchmarkOperation(
        'DELETE /api/inventory/:id',
        async () => {
          const itemId = itemsToDelete.pop();
          if (!itemId) {
            throw new Error('No items to delete');
          }
          const response = await makeRequest(`/api/inventory/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (response.status !== 200) {
            throw new Error(`Delete failed with status ${response.status}`);
          }
        },
        30,
        PERFORMANCE_THRESHOLDS.api.deleteOperation
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('🚀 Concurrent Operations Benchmarks', () => {
    it('should benchmark concurrent read operations', async () => {
      const concurrentReads = 5;
      
      const result = await benchmarkOperation(
        `Concurrent Reads (${concurrentReads} parallel)`,
        async () => {
          const promises = Array.from({ length: concurrentReads }, () =>
            makeRequest('/api/inventory', {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            })
          );
          
          const responses = await Promise.all(promises);
          const allSuccessful = responses.every(r => r.status === 200);
          if (!allSuccessful) {
            throw new Error('Some concurrent reads failed');
          }
        },
        20,
        PERFORMANCE_THRESHOLDS.api.complexQuery * 2
      );

      expect(result.passed).toBe(true);
    });

    it('should benchmark mixed concurrent operations', async () => {
      const result = await benchmarkOperation(
        'Mixed Concurrent Operations',
        async () => {
          const operations = [
            // Read
            makeRequest('/api/categories', {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            }),
            // Create
            makeRequest('/api/inventory', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${adminToken}` },
              body: JSON.stringify({
                name: `Concurrent Item ${Date.now()}`,
                sku: `CONC-${Date.now()}`,
                categoryId: testCategoryId,
                currentStock: 50,
                minStockLevel: 5,
                unitCost: 15.00,
                unitPrice: 30.00
              })
            }).then(r => {
              if (r.status === 201) testInventoryIds.push(r.data.id);
              return r;
            }),
            // Search
            makeRequest('/api/categories/search?q=Benchmark', {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            })
          ];

          const responses = await Promise.all(operations);
          const allSuccessful = responses.every(r => r.status < 400);
          if (!allSuccessful) {
            throw new Error('Some concurrent operations failed');
          }
        },
        20,
        PERFORMANCE_THRESHOLDS.api.bulkOperation
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('📈 Load Pattern Benchmarks', () => {
    it('should benchmark burst traffic pattern', async () => {
      console.log('\n🌊 Simulating burst traffic pattern...');
      
      const burstSize = 20;
      const delayBetweenBursts = 1000;
      const numberOfBursts = 3;
      
      const burstResults: number[] = [];

      for (let burst = 0; burst < numberOfBursts; burst++) {
        console.log(`  Burst ${burst + 1}/${numberOfBursts}`);
        
        const start = Date.now();
        const promises = Array.from({ length: burstSize }, () =>
          makeRequest('/api/health', {})
        );
        
        await Promise.all(promises);
        const duration = Date.now() - start;
        burstResults.push(duration);
        
        console.log(`    Completed in ${duration}ms`);
        
        if (burst < numberOfBursts - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBursts));
        }
      }

      const avgBurstTime = burstResults.reduce((a, b) => a + b, 0) / burstResults.length;
      console.log(`  Average burst completion time: ${avgBurstTime.toFixed(2)}ms`);
      
      expect(avgBurstTime).toBeLessThan(2000);
    });

    it('should benchmark sustained load pattern', async () => {
      console.log('\n📊 Simulating sustained load pattern...');
      
      const duration = 10000; // 10 seconds
      const requestInterval = 100; // Request every 100ms
      const startTime = Date.now();
      let requestCount = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];

      while (Date.now() - startTime < duration) {
        const requestStart = Date.now();
        try {
          const response = await makeRequest('/api/categories', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (response.status === 200) {
            responseTimes.push(Date.now() - requestStart);
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
        requestCount++;
        
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const errorRate = (errorCount / requestCount) * 100;

      console.log(`
  📊 Sustained Load Results:
    - Total requests: ${requestCount}
    - Successful: ${responseTimes.length}
    - Errors: ${errorCount} (${errorRate.toFixed(2)}%)
    - Average response time: ${avgResponseTime.toFixed(2)}ms
      `);

      expect(errorRate).toBeLessThan(5);
      expect(avgResponseTime).toBeLessThan(500);
    });
  });

  describe('🎯 Edge Case Performance', () => {
    it('should benchmark large payload handling', async () => {
      // Crear un payload grande
      const largeDescription = 'x'.repeat(10000); // 10KB de texto
      
      const result = await benchmarkOperation(
        'Large Payload Create',
        async () => {
          const response = await makeRequest('/api/categories', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({
              name: `Large Category ${Date.now()}`,
              description: largeDescription
            })
          });
          if (response.status !== 201) {
            throw new Error(`Create with large payload failed: ${response.status}`);
          }
        },
        10,
        PERFORMANCE_THRESHOLDS.api.createOperation * 2
      );

      expect(result.passed).toBe(true);
    });

    it('should benchmark deep query filtering', async () => {
      const result = await benchmarkOperation(
        'Deep Query with Multiple Filters',
        async () => {
          const response = await makeRequest(
            `/api/inventory?page=1&limit=50&sort=name&order=asc&category=${testCategoryId}&minStock=10&maxStock=100&search=Benchmark`,
            {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            }
          );
          if (response.status !== 200) {
            throw new Error(`Deep query failed: ${response.status}`);
          }
        },
        30,
        PERFORMANCE_THRESHOLDS.api.complexQuery * 1.5
      );

      expect(result.passed).toBe(true);
    });
  });
});

// Función para generar resumen de benchmarks
function generateBenchmarkSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 BENCHMARK SUMMARY');
  console.log('='.repeat(60));
  
  const passed = benchmarkResults.filter(r => r.passed).length;
  const failed = benchmarkResults.filter(r => !r.passed).length;
  const total = benchmarkResults.length;
  
  console.log(`\nEnvironment: ${currentEnv.name}`);
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Benchmarks:');
    benchmarkResults
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.operation}: ${r.metrics.avg.toFixed(2)}ms (threshold: ${r.threshold}ms)`);
      });
  }
  
  console.log('\n🏆 Top 5 Fastest Operations:');
  benchmarkResults
    .sort((a, b) => a.metrics.avg - b.metrics.avg)
    .slice(0, 5)
    .forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.operation}: ${r.metrics.avg.toFixed(2)}ms`);
    });
  
  console.log('\n🐌 Top 5 Slowest Operations:');
  benchmarkResults
    .sort((a, b) => b.metrics.avg - a.metrics.avg)
    .slice(0, 5)
    .forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.operation}: ${r.metrics.avg.toFixed(2)}ms`);
    });
  
  console.log('\n' + '='.repeat(60));
}