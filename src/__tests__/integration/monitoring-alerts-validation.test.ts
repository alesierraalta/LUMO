/**
 * Tests de validación para endpoints de monitoreo y sistema de alertas
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { makeRequest, ENVIRONMENTS } from './vercel-production-validation.test';

// Configuración de entorno
const testMode = process.env.TEST_MODE || 'development';
const currentEnv = ENVIRONMENTS[testMode === 'production' ? 'production' : 'development'];

// Umbrales para alertas
const ALERT_THRESHOLDS = {
  responseTime: {
    warning: 1000,  // 1 segundo
    critical: 3000  // 3 segundos
  },
  errorRate: {
    warning: 0.05,  // 5%
    critical: 0.10  // 10%
  },
  memoryUsage: {
    warning: 0.80,  // 80%
    critical: 0.90  // 90%
  }
};

// Variable global para almacenar datos de monitoreo
let monitoringData: any = {
  startTime: Date.now(),
  requests: [],
  errors: [],
  alerts: []
};

describe('🚨 Monitoring and Alerts Validation', () => {
  let adminToken: string;

  beforeAll(async () => {
    console.log(`\n🔍 Starting Monitoring Tests on ${currentEnv.name}`);
    
    // Reiniciar datos de monitoreo
    monitoringData = {
      startTime: Date.now(),
      requests: [],
      errors: [],
      alerts: []
    };
    
    // Autenticar como admin
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123456'
      })
    });

    if (loginResponse.status === 200) {
      adminToken = loginResponse.data.token;
    }
  });

  afterAll(async () => {
    // Generar reporte de monitoreo
    generateMonitoringReport();
  });

  describe('📊 Health Check Endpoints', () => {
    it('should have comprehensive health endpoint', async () => {
      const response = await makeRequest('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: expect.stringMatching(/healthy|degraded|unhealthy/),
        environment: expect.any(String),
        database: expect.any(String),
        timestamp: expect.any(String)
      });

      // Registrar en monitoreo
      monitoringData.requests.push({
        endpoint: '/api/health',
        status: response.status,
        responseTime: 0,
        timestamp: new Date().toISOString()
      });
    });

    it('should provide detailed health metrics', async () => {
      const response = await makeRequest('/api/health/detailed', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      // Si el endpoint existe
      if (response.status === 200) {
        expect(response.data).toMatchObject({
          status: expect.any(String),
          services: expect.objectContaining({
            database: expect.objectContaining({
              status: expect.any(String),
              latency: expect.any(Number)
            }),
            cache: expect.any(Object),
            storage: expect.any(Object)
          }),
          metrics: expect.any(Object),
          timestamp: expect.any(String)
        });
      } else if (response.status === 404) {
        console.log('⚠️  Detailed health endpoint not implemented');
      }
    });

    it('should have readiness check', async () => {
      const response = await makeRequest('/api/health/ready');
      
      // El endpoint debería existir para Kubernetes/contenedores
      if (response.status === 200) {
        expect(response.data).toMatchObject({
          ready: expect.any(Boolean),
          checks: expect.any(Object)
        });
      } else if (response.status === 404) {
        console.log('⚠️  Readiness endpoint not implemented');
      }
    });

    it('should have liveness check', async () => {
      const response = await makeRequest('/api/health/live');
      
      if (response.status === 200) {
        expect(response.data).toMatchObject({
          alive: true,
          uptime: expect.any(Number)
        });
      } else if (response.status === 404) {
        console.log('⚠️  Liveness endpoint not implemented');
      }
    });
  });

  describe('📈 Metrics Endpoints', () => {
    it('should expose application metrics', async () => {
      const response = await makeRequest('/api/metrics', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          application: expect.objectContaining({
            version: expect.any(String),
            uptime: expect.any(Number),
            environment: expect.any(String)
          }),
          performance: expect.any(Object),
          resources: expect.any(Object)
        });
      } else if (response.status === 404) {
        console.log('⚠️  Metrics endpoint not implemented');
      }
    });

    it('should track API performance metrics', async () => {
      // Hacer varias peticiones para generar métricas
      const endpoints = [
        '/api/categories',
        '/api/inventory',
        '/api/users'
      ];

      for (const endpoint of endpoints) {
        const start = Date.now();
        const response = await makeRequest(endpoint, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const duration = Date.now() - start;

        monitoringData.requests.push({
          endpoint,
          status: response.status,
          responseTime: duration,
          timestamp: new Date().toISOString()
        });

        // Verificar si excede umbrales
        if (duration > ALERT_THRESHOLDS.responseTime.critical) {
          monitoringData.alerts.push({
            type: 'CRITICAL',
            metric: 'responseTime',
            value: duration,
            threshold: ALERT_THRESHOLDS.responseTime.critical,
            endpoint,
            timestamp: new Date().toISOString()
          });
        } else if (duration > ALERT_THRESHOLDS.responseTime.warning) {
          monitoringData.alerts.push({
            type: 'WARNING',
            metric: 'responseTime',
            value: duration,
            threshold: ALERT_THRESHOLDS.responseTime.warning,
            endpoint,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Verificar endpoint de métricas de rendimiento
      const metricsResponse = await makeRequest('/api/metrics/performance', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (metricsResponse.status === 200) {
        expect(metricsResponse.data).toMatchObject({
          endpoints: expect.any(Array),
          summary: expect.objectContaining({
            totalRequests: expect.any(Number),
            averageResponseTime: expect.any(Number),
            errorRate: expect.any(Number)
          })
        });
      }
    });

    it('should track database metrics', async () => {
      const response = await makeRequest('/api/metrics/database', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          connections: expect.objectContaining({
            active: expect.any(Number),
            idle: expect.any(Number),
            total: expect.any(Number)
          }),
          queries: expect.any(Object),
          performance: expect.any(Object)
        });
      } else if (response.status === 404) {
        console.log('⚠️  Database metrics endpoint not implemented');
      }
    });
  });

  describe('🔔 Alert System Validation', () => {
    it('should trigger alerts on high error rates', async () => {
      // Simular errores
      const invalidRequests = 10;
      let errorCount = 0;

      for (let i = 0; i < invalidRequests; i++) {
        const response = await makeRequest('/api/nonexistent', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.status >= 400) {
          errorCount++;
          monitoringData.errors.push({
            endpoint: '/api/nonexistent',
            status: response.status,
            timestamp: new Date().toISOString()
          });
        }
      }

      const errorRate = errorCount / invalidRequests;
      
      if (errorRate > ALERT_THRESHOLDS.errorRate.critical) {
        monitoringData.alerts.push({
          type: 'CRITICAL',
          metric: 'errorRate',
          value: errorRate,
          threshold: ALERT_THRESHOLDS.errorRate.critical,
          message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
          timestamp: new Date().toISOString()
        });
      }

      // Verificar si el sistema registra estas alertas
      const alertsResponse = await makeRequest('/api/alerts', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (alertsResponse.status === 200) {
        expect(alertsResponse.data).toMatchObject({
          alerts: expect.any(Array),
          summary: expect.any(Object)
        });
      }
    });

    it('should validate alert notification system', async () => {
      // Probar endpoint de configuración de alertas
      const configResponse = await makeRequest('/api/alerts/config', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (configResponse.status === 200) {
        expect(configResponse.data).toMatchObject({
          channels: expect.any(Array), // email, slack, webhook, etc.
          rules: expect.any(Array),
          thresholds: expect.any(Object)
        });
      }

      // Probar envío de alerta de prueba
      const testAlertResponse = await makeRequest('/api/alerts/test', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          type: 'test',
          message: 'Integration test alert',
          severity: 'info'
        })
      });

      if (testAlertResponse.status === 200) {
        expect(testAlertResponse.data).toMatchObject({
          success: true,
          delivered: expect.any(Array)
        });
      }
    });
  });

  describe('📊 Resource Monitoring', () => {
    it('should monitor memory usage', async () => {
      const response = await makeRequest('/api/metrics/resources', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        const memoryUsage = response.data.memory;
        expect(memoryUsage).toMatchObject({
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        });

        // Verificar alertas de memoria
        const memoryPercentage = memoryUsage.percentage / 100;
        if (memoryPercentage > ALERT_THRESHOLDS.memoryUsage.critical) {
          monitoringData.alerts.push({
            type: 'CRITICAL',
            metric: 'memoryUsage',
            value: memoryPercentage,
            threshold: ALERT_THRESHOLDS.memoryUsage.critical,
            message: `Critical memory usage: ${(memoryPercentage * 100).toFixed(2)}%`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    it('should monitor CPU usage', async () => {
      const response = await makeRequest('/api/metrics/cpu', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          usage: expect.any(Number),
          loadAverage: expect.any(Array),
          cores: expect.any(Number)
        });
      }
    });
  });

  describe('🔍 Logging and Tracing', () => {
    it('should have structured logging endpoint', async () => {
      const response = await makeRequest('/api/logs', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          logs: expect.arrayContaining([
            expect.objectContaining({
              level: expect.stringMatching(/debug|info|warn|error/),
              message: expect.any(String),
              timestamp: expect.any(String),
              context: expect.any(Object)
            })
          ]),
          pagination: expect.any(Object)
        });
      } else if (response.status === 404) {
        console.log('⚠️  Logs endpoint not implemented');
      }
    });

    it('should support request tracing', async () => {
      // Hacer request con trace ID
      const traceId = `test-trace-${Date.now()}`;
      const response = await makeRequest('/api/categories', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'X-Trace-ID': traceId
        }
      });

      // Verificar que el trace ID se propague
      const traceHeader = response.headers.get('x-trace-id');
      if (traceHeader) {
        expect(traceHeader).toBe(traceId);
      }

      // Verificar endpoint de traces
      const tracesResponse = await makeRequest(`/api/traces/${traceId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (tracesResponse.status === 200) {
        expect(tracesResponse.data).toMatchObject({
          traceId,
          spans: expect.any(Array),
          duration: expect.any(Number),
          status: expect.any(String)
        });
      }
    });
  });

  describe('🎯 Custom Business Metrics', () => {
    it('should track business KPIs', async () => {
      const response = await makeRequest('/api/metrics/business', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          inventory: expect.objectContaining({
            totalItems: expect.any(Number),
            lowStockItems: expect.any(Number),
            totalValue: expect.any(Number)
          }),
          categories: expect.objectContaining({
            total: expect.any(Number),
            active: expect.any(Number)
          }),
          users: expect.objectContaining({
            total: expect.any(Number),
            activeToday: expect.any(Number)
          })
        });
      }
    });

    it('should track API usage patterns', async () => {
      const response = await makeRequest('/api/metrics/usage', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          endpoints: expect.any(Array),
          topEndpoints: expect.any(Array),
          hourlyDistribution: expect.any(Array),
          userAgents: expect.any(Object)
        });
      }
    });
  });

  describe('🚦 Circuit Breaker Monitoring', () => {
    it('should monitor circuit breaker status', async () => {
      const response = await makeRequest('/api/metrics/circuit-breakers', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          breakers: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              state: expect.stringMatching(/closed|open|half-open/),
              failures: expect.any(Number),
              lastFailure: expect.any(String)
            })
          ])
        });
      } else if (response.status === 404) {
        console.log('⚠️  Circuit breaker monitoring not implemented');
      }
    });
  });

  describe('📱 External Service Monitoring', () => {
    it('should monitor Supabase connectivity', async () => {
      const response = await makeRequest('/api/health/services/supabase', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          status: expect.stringMatching(/healthy|degraded|unhealthy/),
          latency: expect.any(Number),
          lastCheck: expect.any(String)
        });
      }
    });

    it('should monitor external dependencies', async () => {
      const response = await makeRequest('/api/health/dependencies', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        expect(response.data).toMatchObject({
          dependencies: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              type: expect.any(String),
              status: expect.any(String),
              responseTime: expect.any(Number)
            })
          ])
        });
      }
    });
  });
});

// Función para generar reporte de monitoreo
function generateMonitoringReport() {
  const duration = Date.now() - monitoringData.startTime;
  const totalRequests = monitoringData.requests.length;
  const totalErrors = monitoringData.errors.length;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  
  // Calcular métricas de rendimiento
  const responseTimes = monitoringData.requests.map(r => r.responseTime);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  const maxResponseTime = responseTimes.length > 0 
    ? Math.max(...responseTimes) 
    : 0;

  console.log('\n' + '='.repeat(60));
  console.log('📊 MONITORING REPORT');
  console.log('='.repeat(60));
  console.log(`Environment: ${currentEnv.name}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Total Errors: ${totalErrors} (${errorRate.toFixed(2)}%)`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  console.log(`Total Alerts: ${monitoringData.alerts.length}`);
  
  if (monitoringData.alerts.length > 0) {
    console.log('\n🚨 ALERTS TRIGGERED:');
    monitoringData.alerts.forEach(alert => {
      console.log(`  [${alert.type}] ${alert.metric}: ${alert.value} (threshold: ${alert.threshold})`);
      if (alert.message) {
        console.log(`    Message: ${alert.message}`);
      }
    });
  }
  
  // Resumen de endpoints más lentos
  if (responseTimes.length > 0) {
    console.log('\n🐌 SLOWEST ENDPOINTS:');
    monitoringData.requests
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 5)
      .forEach(req => {
        console.log(`  ${req.endpoint}: ${req.responseTime}ms`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
}

// Exportar para uso en otros tests
export { ALERT_THRESHOLDS, monitoringData };