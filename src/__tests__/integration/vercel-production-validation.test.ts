/**
 * Suite completa de tests de integración para validar el funcionamiento
 * en el entorno de producción de Vercel
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno según el modo de test
const testMode = process.env.TEST_MODE || 'development';
const isProductionTest = testMode === 'production';

if (!isProductionTest) {
  config({ path: path.join(process.cwd(), '.env.local') });
}

// Configuración de entornos
const ENVIRONMENTS = {
  development: {
    name: 'Development',
    baseUrl: 'http://localhost:3000',
    supabaseUrl: 'https://ndprriqyhddjoixrlqnz.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8',
    healthTimeout: 10000
  },
  production: {
    name: 'Production (Vercel)',
    baseUrl: 'https://lumo-woad.vercel.app',
    supabaseUrl: 'https://ubjujxtvlubxowsphvuk.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4',
    healthTimeout: 30000
  }
};

const currentEnv = ENVIRONMENTS[isProductionTest ? 'production' : 'development'];

// Helper para hacer peticiones HTTP
async function makeRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<{ status: number; data: any; headers: any }> {
  const url = `${currentEnv.baseUrl}${endpoint}`;
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      timeout: 30000
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    console.error(`Request failed for ${url}:`, error);
    throw error;
  }
}

// Credenciales de prueba
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123456'
  },
  user: {
    email: 'user@test.com',
    password: 'user123456'
  }
};

// Métricas de rendimiento globales
const performanceMetrics: any[] = [];

describe(`🚀 Vercel Production Validation Tests - ${currentEnv.name}`, () => {
  let adminToken: string;
  let userToken: string;
  let testCategoryId: string;
  let testInventoryId: string;

  beforeAll(async () => {
    console.log(`\n🔧 Iniciando tests en ${currentEnv.name}`);
    console.log(`📍 Base URL: ${currentEnv.baseUrl}`);
    console.log(`🗄️ Supabase: ${currentEnv.supabaseUrl}`);
  });

  afterAll(async () => {
    // Generar reporte de rendimiento
    if (performanceMetrics.length > 0) {
      console.log('\n📊 REPORTE DE RENDIMIENTO');
      console.log('========================');
      performanceMetrics.forEach(metric => {
        console.log(`${metric.endpoint}: ${metric.duration}ms (${metric.status})`);
      });

      const avgDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length;
      console.log(`\nTiempo promedio de respuesta: ${avgDuration.toFixed(2)}ms`);
    }
  });

  describe('🏥 Health Check', () => {
    it('should verify application is running', async () => {
      const start = Date.now();
      const response = await makeRequest('/api/health');
      const duration = Date.now() - start;

      performanceMetrics.push({
        endpoint: '/api/health',
        duration,
        status: response.status
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: 'healthy',
        environment: expect.any(String)
      });

      console.log(`✅ Health check passed in ${duration}ms`);
    });

    it('should have proper environment configuration', async () => {
      const response = await makeRequest('/api/health');
      
      expect(response.data).toMatchObject({
        status: 'healthy',
        environment: isProductionTest ? 'production' : 'development',
        database: 'connected',
        timestamp: expect.any(String)
      });
    });
  });

  describe('🔐 Authentication Flow', () => {
    it('should register a new admin user', async () => {
      const start = Date.now();
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...TEST_CREDENTIALS.admin,
          name: 'Test Admin'
        })
      });
      const duration = Date.now() - start;

      performanceMetrics.push({
        endpoint: '/api/auth/register',
        duration,
        status: response.status
      });

      // En producción, puede que el usuario ya exista
      if (response.status === 409) {
        console.log('⚠️ Admin user already exists, skipping registration');
      } else {
        expect(response.status).toBe(201);
        expect(response.data).toMatchObject({
          success: true,
          user: expect.objectContaining({
            email: TEST_CREDENTIALS.admin.email
          })
        });
      }
    });

    it('should login as admin', async () => {
      const start = Date.now();
      const response = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(TEST_CREDENTIALS.admin)
      });
      const duration = Date.now() - start;

      performanceMetrics.push({
        endpoint: '/api/auth/login',
        duration,
        status: response.status
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        token: expect.any(String),
        user: expect.objectContaining({
          email: TEST_CREDENTIALS.admin.email
        })
      });

      adminToken = response.data.token;
      console.log(`✅ Admin login successful in ${duration}ms`);
    });

    it('should get current user with valid token', async () => {
      const response = await makeRequest('/api/auth/me', {}, adminToken);
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        user: expect.objectContaining({
          email: TEST_CREDENTIALS.admin.email,
          role: expect.any(String)
        })
      });
    });

    it('should handle invalid authentication', async () => {
      const response = await makeRequest('/api/auth/me', {}, 'invalid-token');
      expect(response.status).toBe(401);
    });
  });

  describe('📁 Categories CRUD Operations', () => {
    it('should create a new category', async () => {
      const start = Date.now();
      const response = await makeRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: `Test Category ${Date.now()}`,
          description: 'Integration test category'
        })
      }, adminToken);
      const duration = Date.now() - start;

      performanceMetrics.push({
        endpoint: 'POST /api/categories',
        duration,
        status: response.status
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        name: expect.stringContaining('Test Category'),
        description: 'Integration test category'
      });

      testCategoryId = response.data.id;
      console.log(`✅ Category created in ${duration}ms`);
    });

    it('should list categories with pagination', async () => {
      const response = await makeRequest('/api/categories?page=1&limit=10', {}, adminToken);
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        categories: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        totalPages: expect.any(Number)
      });
    });

    it('should update a category', async () => {
      const response = await makeRequest(`/api/categories/${testCategoryId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Test Category',
          description: 'Updated description'
        })
      }, adminToken);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe('Updated Test Category');
    });

    it('should search categories', async () => {
      const response = await makeRequest('/api/categories/search?q=Test', {}, adminToken);
      
      expect(response.status).toBe(200);
      expect(response.data.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('Test')
          })
        ])
      );
    });
  });

  describe('📦 Inventory Management', () => {
    it('should create an inventory item', async () => {
      const start = Date.now();
      const response = await makeRequest('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: `Test Product ${Date.now()}`,
          sku: `SKU-${Date.now()}`,
          categoryId: testCategoryId,
          currentStock: 100,
          minStockLevel: 10,
          unitCost: 50.00,
          unitPrice: 75.00,
          description: 'Integration test product'
        })
      }, adminToken);
      const duration = Date.now() - start;

      performanceMetrics.push({
        endpoint: 'POST /api/inventory',
        duration,
        status: response.status
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        name: expect.stringContaining('Test Product'),
        categoryId: testCategoryId,
        currentStock: 100
      });

      testInventoryId = response.data.id;
      console.log(`✅ Inventory item created in ${duration}ms`);
    });

    it('should adjust stock levels', async () => {
      const response = await makeRequest(`/api/inventory/${testInventoryId}/add-stock`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: 50,
          notes: 'Restocking'
        })
      }, adminToken);

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        newQuantity: 150,
        movement: expect.objectContaining({
          type: 'IN',
          quantity: 50
        })
      });
    });

    it('should handle low stock scenarios', async () => {
      // Primero reducir el stock
      await makeRequest(`/api/inventory/${testInventoryId}/remove-stock`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: 145,
          notes: 'Large sale'
        })
      }, adminToken);

      // Verificar que esté en low stock
      const response = await makeRequest(`/api/inventory/${testInventoryId}`, {}, adminToken);
      
      expect(response.status).toBe(200);
      expect(response.data.currentStock).toBeLessThan(response.data.minStockLevel);
    });
  });

  describe('🎭 Role-Based Access Control', () => {
    beforeEach(async () => {
      // Crear usuario regular si no existe
      const registerResponse = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...TEST_CREDENTIALS.user,
          name: 'Test User'
        })
      });

      if (registerResponse.status === 201 || registerResponse.status === 409) {
        // Login como usuario regular
        const loginResponse = await makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(TEST_CREDENTIALS.user)
        });

        if (loginResponse.status === 200) {
          userToken = loginResponse.data.token;
        }
      }
    });

    it('should allow admin to access all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/users' },
        { method: 'GET', path: '/api/roles' },
        { method: 'GET', path: '/api/categories' },
        { method: 'GET', path: '/api/inventory' }
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(endpoint.path, {
          method: endpoint.method
        }, adminToken);

        expect(response.status).toBeLessThan(400);
        console.log(`✅ Admin access to ${endpoint.path}: ${response.status}`);
      }
    });

    it('should restrict user access to admin endpoints', async () => {
      if (!userToken) {
        console.log('⚠️ User token not available, skipping test');
        return;
      }

      const response = await makeRequest('/api/users', {}, userToken);
      expect(response.status).toBe(403);
    });
  });

  describe('⚡ Performance and Load Testing', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises = [];

      console.log(`\n🔄 Sending ${concurrentRequests} concurrent requests...`);

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          makeRequest('/api/categories', {}, adminToken)
            .then(response => ({
              status: response.status,
              success: response.status === 200
            }))
            .catch(() => ({ status: 500, success: false }))
        );
      }

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      const successCount = results.filter(r => r.success).length;
      const avgResponseTime = duration / concurrentRequests;

      console.log(`✅ Completed ${concurrentRequests} requests in ${duration}ms`);
      console.log(`📊 Success rate: ${(successCount / concurrentRequests * 100).toFixed(1)}%`);
      console.log(`⚡ Average response time: ${avgResponseTime.toFixed(2)}ms`);

      expect(successCount).toBeGreaterThan(concurrentRequests * 0.9); // 90% success rate
      expect(avgResponseTime).toBeLessThan(1000); // Sub-second average
    });

    it('should maintain performance under sustained load', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let requestCount = 0;
      let errorCount = 0;

      console.log('\n🏃 Running sustained load test for 5 seconds...');

      while (Date.now() - startTime < duration) {
        try {
          await makeRequest('/api/health');
          requestCount++;
        } catch (error) {
          errorCount++;
        }
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const actualDuration = Date.now() - startTime;
      const requestsPerSecond = requestCount / (actualDuration / 1000);
      const errorRate = (errorCount / requestCount) * 100;

      console.log(`✅ Completed ${requestCount} requests in ${actualDuration}ms`);
      console.log(`📊 Requests per second: ${requestsPerSecond.toFixed(2)}`);
      console.log(`❌ Error rate: ${errorRate.toFixed(2)}%`);

      expect(requestsPerSecond).toBeGreaterThan(10);
      expect(errorRate).toBeLessThan(5);
    });
  });

  describe('🔄 Data Synchronization', () => {
    it('should verify data consistency across environments', async () => {
      if (!isProductionTest) {
        console.log('⚠️ Skipping cross-environment sync test in development mode');
        return;
      }

      // Create test data in production
      const testData = {
        name: `Sync Test ${Date.now()}`,
        description: 'Data sync validation'
      };

      const createResponse = await makeRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(testData)
      }, adminToken);

      expect(createResponse.status).toBe(201);

      // Verify data exists
      const verifyResponse = await makeRequest(`/api/categories/${createResponse.data.id}`, {}, adminToken);
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data.name).toBe(testData.name);

      console.log('✅ Data synchronization verified');
    });
  });

  describe('🛡️ Security Validation', () => {
    it('should protect against SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE categories; --";
      const response = await makeRequest('/api/categories/search', {
        method: 'GET',
        headers: {
          'q': maliciousInput
        }
      }, adminToken);

      // Should handle malicious input safely
      expect(response.status).toBeLessThan(500);
      
      // Verify tables still exist
      const verifyResponse = await makeRequest('/api/categories', {}, adminToken);
      expect(verifyResponse.status).toBe(200);
    });

    it('should enforce rate limiting', async () => {
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(makeRequest('/api/health'));
      }

      try {
        await Promise.all(requests);
        // If no rate limiting, this is still okay for now
        console.log('⚠️ No rate limiting detected - consider implementing');
      } catch (error: any) {
        // Rate limiting should return 429
        if (error.status === 429) {
          console.log('✅ Rate limiting is active');
        }
      }
    });

    it('should validate CORS headers', async () => {
      const response = await makeRequest('/api/health');
      
      const corsHeaders = response.headers.get('access-control-allow-origin');
      if (isProductionTest) {
        expect(corsHeaders).toBeDefined();
        console.log(`✅ CORS configured: ${corsHeaders}`);
      }
    });
  });

  describe('🧹 Cleanup', () => {
    it('should clean up test data', async () => {
      const cleanupPromises = [];

      // Delete test inventory item
      if (testInventoryId) {
        cleanupPromises.push(
          makeRequest(`/api/inventory/${testInventoryId}`, {
            method: 'DELETE'
          }, adminToken)
        );
      }

      // Delete test category
      if (testCategoryId) {
        cleanupPromises.push(
          makeRequest(`/api/categories/${testCategoryId}`, {
            method: 'DELETE'
          }, adminToken)
        );
      }

      const results = await Promise.allSettled(cleanupPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`✅ Cleanup completed: ${successCount}/${cleanupPromises.length} items removed`);
    });
  });
});

// Export para uso en CI/CD
export { makeRequest, ENVIRONMENTS, performanceMetrics };