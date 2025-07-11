/**
 * Tests específicos para validar la sincronización entre
 * ambientes de desarrollo y producción
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';
import { makeRequest, ENVIRONMENTS } from './vercel-production-validation.test';

// Configuración para ambos ambientes
const DEV_ENV = ENVIRONMENTS.development;
const PROD_ENV = ENVIRONMENTS.production;

// Datos de prueba para sincronización
const SYNC_TEST_DATA = {
  category: {
    name: 'SYNC_TEST_CATEGORY_' + Date.now(),
    description: 'Categoría para pruebas de sincronización cross-env'
  },
  inventory: {
    name: 'SYNC_TEST_ITEM_' + Date.now(),
    description: 'Item para pruebas de sincronización',
    sku: 'SYNC-' + Date.now(),
    quantity: 100,
    min_quantity: 10,
    location: 'TEST-LOC',
    unit_price: 99.99
  }
};

describe('🔄 Environment Synchronization Validation Tests', () => {
  let devAdminToken: string;
  let prodAdminToken: string;
  let devCategoryId: string;
  let prodCategoryId: string;
  
  // Credenciales de admin para ambos ambientes
  const ADMIN_CREDENTIALS = {
    email: 'admin@test.com',
    password: 'admin123456'
  };

  beforeAll(async () => {
    console.log('🚀 Iniciando tests de sincronización cross-environment...');
    
    // Autenticar en ambiente de desarrollo
    const devLoginResponse = await makeRequest(
      `${DEV_ENV.baseUrl}/api/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify(ADMIN_CREDENTIALS)
      }
    );
    
    if (devLoginResponse.status === 200) {
      devAdminToken = devLoginResponse.data.access_token || devLoginResponse.data.token;
      console.log('✅ Autenticación exitosa en DESARROLLO');
    }
    
    // Autenticar en ambiente de producción
    const prodLoginResponse = await makeRequest(
      `${PROD_ENV.baseUrl}/api/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify(ADMIN_CREDENTIALS)
      }
    );
    
    if (prodLoginResponse.status === 200) {
      prodAdminToken = prodLoginResponse.data.access_token || prodLoginResponse.data.token;
      console.log('✅ Autenticación exitosa en PRODUCCIÓN');
    }
  });

  afterAll(async () => {
    console.log('🧹 Limpiando datos de prueba...');
    
    // Limpiar categorías creadas en desarrollo
    if (devCategoryId && devAdminToken) {
      await makeRequest(
        `${DEV_ENV.baseUrl}/api/categories/${devCategoryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${devAdminToken}`
          }
        }
      );
    }
    
    // Limpiar categorías creadas en producción
    if (prodCategoryId && prodAdminToken) {
      await makeRequest(
        `${PROD_ENV.baseUrl}/api/categories/${prodCategoryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${prodAdminToken}`
          }
        }
      );
    }
  });

  describe('📊 Data Consistency Tests', () => {
    it('should maintain data integrity across environments', async () => {
      // Skip si no tenemos tokens para ambos ambientes
      if (!devAdminToken || !prodAdminToken) {
        console.log('⚠️ Skipping: No se pudo autenticar en ambos ambientes');
        return;
      }

      // Crear categoría en desarrollo
      const devCreateResponse = await makeRequest(
        `${DEV_ENV.baseUrl}/api/categories`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${devAdminToken}`
          },
          body: JSON.stringify(SYNC_TEST_DATA.category)
        }
      );

      expect(devCreateResponse.status).toBe(201);
      const devCategory = devCreateResponse.data;
      devCategoryId = devCategory.id;

      // Crear categoría idéntica en producción
      const prodCreateResponse = await makeRequest(
        `${PROD_ENV.baseUrl}/api/categories`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${prodAdminToken}`
          },
          body: JSON.stringify(SYNC_TEST_DATA.category)
        }
      );

      expect(prodCreateResponse.status).toBe(201);
      const prodCategory = prodCreateResponse.data;
      prodCategoryId = prodCategory.id;

      // Verificar que los datos sean consistentes (excepto IDs y timestamps)
      expect(devCategory.name).toBe(prodCategory.name);
      expect(devCategory.description).toBe(prodCategory.description);
      expect(devCategory.user_id).toBeTruthy();
      expect(prodCategory.user_id).toBeTruthy();
    });

    it('should handle concurrent operations across environments', async () => {
      if (!devAdminToken || !prodAdminToken) {
        console.log('⚠️ Skipping: No se pudo autenticar en ambos ambientes');
        return;
      }

      const concurrentCategories = Array.from({ length: 5 }, (_, i) => ({
        name: `CONCURRENT_CAT_${Date.now()}_${i}`,
        description: `Concurrent test category ${i}`
      }));

      // Crear categorías concurrentemente en ambos ambientes
      const devPromises = concurrentCategories.map(cat =>
        makeRequest(`${DEV_ENV.baseUrl}/api/categories`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${devAdminToken}` },
          body: JSON.stringify(cat)
        })
      );

      const prodPromises = concurrentCategories.map(cat =>
        makeRequest(`${PROD_ENV.baseUrl}/api/categories`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${prodAdminToken}` },
          body: JSON.stringify(cat)
        })
      );

      const devResults = await Promise.all(devPromises);
      const prodResults = await Promise.all(prodPromises);

      // Verificar que todas las operaciones fueron exitosas
      devResults.forEach(response => {
        expect(response.status).toBe(201);
      });

      prodResults.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Limpiar categorías creadas
      const devCategories = devResults.map(r => r.data);
      const prodCategories = prodResults.map(r => r.data);

      // Eliminar categorías de prueba
      await Promise.all([
        ...devCategories.map(cat =>
          makeRequest(`${DEV_ENV.baseUrl}/api/categories/${cat.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${devAdminToken}` }
          })
        ),
        ...prodCategories.map(cat =>
          makeRequest(`${PROD_ENV.baseUrl}/api/categories/${cat.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${prodAdminToken}` }
          })
        )
      ]);
    });
  });

  describe('🔍 Environment Comparison Tests', () => {
    it('should compare API response times between environments', async () => {
      if (!devAdminToken || !prodAdminToken) {
        console.log('⚠️ Skipping: No se pudo autenticar en ambos ambientes');
        return;
      }

      const iterations = 10;
      const devTimes: number[] = [];
      const prodTimes: number[] = [];

      // Medir tiempos de respuesta para operaciones GET
      for (let i = 0; i < iterations; i++) {
        // Desarrollo
        const devStart = Date.now();
        const devResponse = await makeRequest(
          `${DEV_ENV.baseUrl}/api/categories`,
          {
            headers: { 'Authorization': `Bearer ${devAdminToken}` }
          }
        );
        devTimes.push(Date.now() - devStart);
        expect(devResponse.status).toBe(200);

        // Producción
        const prodStart = Date.now();
        const prodResponse = await makeRequest(
          `${PROD_ENV.baseUrl}/api/categories`,
          {
            headers: { 'Authorization': `Bearer ${prodAdminToken}` }
          }
        );
        prodTimes.push(Date.now() - prodStart);
        expect(prodResponse.status).toBe(200);
      }

      // Calcular estadísticas
      const devAvg = devTimes.reduce((a, b) => a + b, 0) / devTimes.length;
      const prodAvg = prodTimes.reduce((a, b) => a + b, 0) / prodTimes.length;
      const devMin = Math.min(...devTimes);
      const devMax = Math.max(...devTimes);
      const prodMin = Math.min(...prodTimes);
      const prodMax = Math.max(...prodTimes);

      console.log(`
📊 Comparación de Rendimiento:
  DESARROLLO:
    - Promedio: ${devAvg.toFixed(2)}ms
    - Mínimo: ${devMin}ms
    - Máximo: ${devMax}ms
  
  PRODUCCIÓN:
    - Promedio: ${prodAvg.toFixed(2)}ms
    - Mínimo: ${prodMin}ms
    - Máximo: ${prodMax}ms
  
  Diferencia: ${Math.abs(devAvg - prodAvg).toFixed(2)}ms
      `);

      // Verificar que los tiempos sean razonables
      expect(devAvg).toBeLessThan(5000); // < 5 segundos
      expect(prodAvg).toBeLessThan(5000); // < 5 segundos
    });

    it('should validate schema consistency across environments', async () => {
      if (!devAdminToken || !prodAdminToken) {
        console.log('⚠️ Skipping: No se pudo autenticar en ambos ambientes');
        return;
      }

      // Crear item de prueba en ambos ambientes
      const testItem = {
        ...SYNC_TEST_DATA.inventory,
        category_id: devCategoryId || null
      };

      // Desarrollo
      const devItemResponse = await makeRequest(
        `${DEV_ENV.baseUrl}/api/inventory`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${devAdminToken}` },
          body: JSON.stringify(testItem)
        }
      );

      // Producción
      const prodItemResponse = await makeRequest(
        `${PROD_ENV.baseUrl}/api/inventory`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${prodAdminToken}` },
          body: JSON.stringify({
            ...testItem,
            category_id: prodCategoryId || null
          })
        }
      );

      if (devItemResponse.status === 201 && prodItemResponse.status === 201) {
        const devItem = devItemResponse.data;
        const prodItem = prodItemResponse.data;

        // Verificar que ambos objetos tengan las mismas propiedades
        const devKeys = Object.keys(devItem).sort();
        const prodKeys = Object.keys(prodItem).sort();

        expect(devKeys).toEqual(prodKeys);

        // Verificar tipos de datos
        devKeys.forEach(key => {
          if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'category_id' && key !== 'user_id') {
            expect(typeof devItem[key]).toBe(typeof prodItem[key]);
          }
        });

        // Limpiar items creados
        await makeRequest(
          `${DEV_ENV.baseUrl}/api/inventory/${devItem.id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${devAdminToken}` }
          }
        );

        await makeRequest(
          `${PROD_ENV.baseUrl}/api/inventory/${prodItem.id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${prodAdminToken}` }
          }
        );
      }
    });
  });

  describe('🚨 Error Handling Consistency', () => {
    it('should return consistent error responses across environments', async () => {
      // Probar sin autenticación
      const devUnauthResponse = await makeRequest(
        `${DEV_ENV.baseUrl}/api/categories`,
        { method: 'POST', body: JSON.stringify({}) }
      );

      const prodUnauthResponse = await makeRequest(
        `${PROD_ENV.baseUrl}/api/categories`,
        { method: 'POST', body: JSON.stringify({}) }
      );

      expect(devUnauthResponse.status).toBe(401);
      expect(prodUnauthResponse.status).toBe(401);

      // Probar con datos inválidos
      if (devAdminToken && prodAdminToken) {
        const invalidData = { invalid: 'data' };

        const devInvalidResponse = await makeRequest(
          `${DEV_ENV.baseUrl}/api/categories`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${devAdminToken}` },
            body: JSON.stringify(invalidData)
          }
        );

        const prodInvalidResponse = await makeRequest(
          `${PROD_ENV.baseUrl}/api/categories`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${prodAdminToken}` },
            body: JSON.stringify(invalidData)
          }
        );

        expect(devInvalidResponse.status).toBe(400);
        expect(prodInvalidResponse.status).toBe(400);
      }
    });

    it('should handle rate limiting consistently', async () => {
      if (!devAdminToken || !prodAdminToken) {
        console.log('⚠️ Skipping: No se pudo autenticar en ambos ambientes');
        return;
      }

      // Hacer múltiples requests rápidas
      const rapidRequests = 20;
      const devResponses: number[] = [];
      const prodResponses: number[] = [];

      // Desarrollo
      const devPromises = Array.from({ length: rapidRequests }, () =>
        makeRequest(`${DEV_ENV.baseUrl}/api/categories`, {
          headers: { 'Authorization': `Bearer ${devAdminToken}` }
        })
      );

      // Producción
      const prodPromises = Array.from({ length: rapidRequests }, () =>
        makeRequest(`${PROD_ENV.baseUrl}/api/categories`, {
          headers: { 'Authorization': `Bearer ${prodAdminToken}` }
        })
      );

      const devResults = await Promise.all(devPromises);
      const prodResults = await Promise.all(prodPromises);

      devResults.forEach(r => devResponses.push(r.status));
      prodResults.forEach(r => prodResponses.push(r.status));

      // Contar respuestas exitosas vs rate limited
      const devSuccess = devResponses.filter(s => s === 200).length;
      const prodSuccess = prodResponses.filter(s => s === 200).length;
      const devRateLimited = devResponses.filter(s => s === 429).length;
      const prodRateLimited = prodResponses.filter(s => s === 429).length;

      console.log(`
🚦 Rate Limiting Comparison:
  DESARROLLO: ${devSuccess} exitosas, ${devRateLimited} rate limited
  PRODUCCIÓN: ${prodSuccess} exitosas, ${prodRateLimited} rate limited
      `);

      // Verificar que al menos algunas requests fueron exitosas
      expect(devSuccess).toBeGreaterThan(0);
      expect(prodSuccess).toBeGreaterThan(0);
    });
  });

  describe('🔐 Security Validation Across Environments', () => {
    it('should enforce same security policies', async () => {
      // Intentar SQL injection en ambos ambientes
      const sqlInjectionPayload = {
        name: "'; DROP TABLE categories; --",
        description: 'Test SQL injection'
      };

      if (devAdminToken && prodAdminToken) {
        const devInjectionResponse = await makeRequest(
          `${DEV_ENV.baseUrl}/api/categories`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${devAdminToken}` },
            body: JSON.stringify(sqlInjectionPayload)
          }
        );

        const prodInjectionResponse = await makeRequest(
          `${PROD_ENV.baseUrl}/api/categories`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${prodAdminToken}` },
            body: JSON.stringify(sqlInjectionPayload)
          }
        );

        // Verificar que ambos ambientes manejen el payload de forma segura
        // (ya sea rechazándolo o escapándolo correctamente)
        if (devInjectionResponse.status === 201 && prodInjectionResponse.status === 201) {
          const devCategory = devInjectionResponse.data;
          const prodCategory = prodInjectionResponse.data;

          // El nombre debe estar escapado/sanitizado
          expect(devCategory.name).toBe(sqlInjectionPayload.name);
          expect(prodCategory.name).toBe(sqlInjectionPayload.name);

          // Limpiar
          await makeRequest(
            `${DEV_ENV.baseUrl}/api/categories/${devCategory.id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${devAdminToken}` }
            }
          );

          await makeRequest(
            `${PROD_ENV.baseUrl}/api/categories/${prodCategory.id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${prodAdminToken}` }
            }
          );
        }
      }
    });

    it('should validate CORS policies', async () => {
      // Probar CORS headers
      const devCorsResponse = await makeRequest(
        `${DEV_ENV.baseUrl}/api/health`,
        {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'POST'
          }
        }
      );

      const prodCorsResponse = await makeRequest(
        `${PROD_ENV.baseUrl}/api/health`,
        {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'POST'
          }
        }
      );

      // Verificar headers CORS
      const devCorsHeaders = devCorsResponse.headers.get('access-control-allow-origin');
      const prodCorsHeaders = prodCorsResponse.headers.get('access-control-allow-origin');

      console.log(`
🔒 CORS Configuration:
  DESARROLLO: ${devCorsHeaders || 'No CORS headers'}
  PRODUCCIÓN: ${prodCorsHeaders || 'No CORS headers'}
      `);

      // Ambos deben tener políticas CORS consistentes
      if (devCorsHeaders && prodCorsHeaders) {
        expect(devCorsHeaders).toBe(prodCorsHeaders);
      }
    });
  });

  describe('📈 Load and Stress Testing Comparison', () => {
    it('should handle similar load patterns', async () => {
      if (!devAdminToken || !prodAdminToken) {
        console.log('⚠️ Skipping: No se pudo autenticar en ambos ambientes');
        return;
      }

      const batchSize = 10;
      const batches = 3;

      console.log(`\n🏃 Ejecutando prueba de carga: ${batchSize * batches} requests en ${batches} lotes`);

      for (let batch = 0; batch < batches; batch++) {
        console.log(`  Lote ${batch + 1}/${batches}...`);

        // Crear requests para ambos ambientes
        const devBatchPromises = Array.from({ length: batchSize }, (_, i) =>
          makeRequest(`${DEV_ENV.baseUrl}/api/inventory`, {
            headers: { 'Authorization': `Bearer ${devAdminToken}` }
          }).then(r => ({ env: 'dev', status: r.status, time: Date.now() }))
        );

        const prodBatchPromises = Array.from({ length: batchSize }, (_, i) =>
          makeRequest(`${PROD_ENV.baseUrl}/api/inventory`, {
            headers: { 'Authorization': `Bearer ${prodAdminToken}` }
          }).then(r => ({ env: 'prod', status: r.status, time: Date.now() }))
        );

        const batchResults = await Promise.all([
          ...devBatchPromises,
          ...prodBatchPromises
        ]);

        const devSuccessRate = batchResults
          .filter(r => r.env === 'dev' && r.status === 200).length / batchSize * 100;
        const prodSuccessRate = batchResults
          .filter(r => r.env === 'prod' && r.status === 200).length / batchSize * 100;

        console.log(`    ✅ Desarrollo: ${devSuccessRate}% exitosas`);
        console.log(`    ✅ Producción: ${prodSuccessRate}% exitosas`);

        // Esperar un poco entre lotes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    });
  });
});

// Exportar utilidades para otros tests
export { DEV_ENV, PROD_ENV, SYNC_TEST_DATA };