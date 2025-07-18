/**
 * COMPREHENSIVE CRUD OPERATIONS TEST SUITE
 * 
 * Tests all Create, Read, Update, Delete operations for every entity type.
 * Specifically designed to prevent issues like DELETE functionality failures.
 * Uses safe test data with proper prefixes to avoid affecting production data.
 */

const { TEST_CONFIG } = require('../config/test-config');
const TestDataFactory = require('../factories/test-data-factory');

class CrudTestSuite {
  constructor(apiClient, logger) {
    this.apiClient = apiClient;
    this.logger = logger;
    this.dataFactory = new TestDataFactory();
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
    this.createdEntities = {
      products: [],
      categories: [],
      locations: [],
      users: [],
      inventory: []
    };
  }

  /**
   * Execute comprehensive CRUD tests for all entities
   */
  async runAllCrudTests() {
    this.logger.info('🚀 Starting comprehensive CRUD operations testing...');
    
    const entities = ['categories', 'locations', 'products', 'users', 'inventory'];
    
    for (const entity of entities) {
      this.logger.info(`\n📋 Testing CRUD operations for: ${entity.toUpperCase()}`);
      
      try {
        await this.testEntityCrud(entity);
      } catch (error) {
        this.logger.error(`❌ CRUD test failed for ${entity}:`, error);
        this.recordError(`CRUD test failed for ${entity}`, error);
      }
    }

    return this.getTestSummary();
  }

  /**
   * Test CRUD operations for a specific entity type
   */
  async testEntityCrud(entityType) {
    const testData = this.dataFactory.generateCrudTestData(entityType);
    let createdEntity = null;

    try {
      // TEST CREATE OPERATION
      this.logger.info(`  ➕ Testing CREATE for ${entityType}...`);
      createdEntity = await this.testCreate(entityType, testData.create);
      
      if (createdEntity && createdEntity.id) {
        // Normalize entity type for tracking (ensure it's plural)
        const trackingKey = entityType.endsWith('s') ? entityType : entityType + 's';
        if (!this.createdEntities[trackingKey]) {
          this.createdEntities[trackingKey] = [];
        }
        this.createdEntities[trackingKey].push(createdEntity);
        this.recordSuccess(`CREATE ${entityType}`, `Successfully created ${entityType} with ID: ${createdEntity.id}`);
        
        // TEST READ OPERATION
        this.logger.info(`  👁️  Testing READ for ${entityType}...`);
        await this.testRead(entityType, createdEntity.id);
        
        // TEST UPDATE OPERATION
        this.logger.info(`  ✏️  Testing UPDATE for ${entityType}...`);
        await this.testUpdate(entityType, createdEntity.id, testData.update);
        
        // TEST PARTIAL UPDATE OPERATION
        this.logger.info(`  📝 Testing PARTIAL UPDATE for ${entityType}...`);
        await this.testPartialUpdate(entityType, createdEntity.id, testData.partialUpdate);
        
        // TEST DELETE OPERATION (CRITICAL - this was the main issue)
        this.logger.info(`  🗑️  Testing DELETE for ${entityType}...`);
        await this.testDelete(entityType, createdEntity.id);
        
        // Remove from tracking since it's deleted
        this.createdEntities[entityType + 's'] = this.createdEntities[entityType + 's']
          .filter(entity => entity.id !== createdEntity.id);
        
      } else {
        throw new Error(`Failed to create ${entityType} - no ID returned`);
      }
      
    } catch (error) {
      this.logger.error(`❌ CRUD operation failed for ${entityType}:`, error);
      this.recordError(`CRUD operation for ${entityType}`, error);
      
      // If entity was created but later operations failed, try to clean it up
      if (createdEntity && createdEntity.id) {
        try {
          await this.forceDelete(entityType, createdEntity.id);
        } catch (cleanupError) {
          this.logger.error(`Failed to cleanup ${entityType} ${createdEntity.id}:`, cleanupError);
        }
      }
    }
  }

  /**
   * Test CREATE operation
   */
  async testCreate(entityType, testData) {
    const endpoint = this.getApiEndpoint(entityType);
    
    try {
      const response = await this.apiClient.post(endpoint, testData);
      
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`CREATE failed with status ${response.status}: ${response.statusText}`);
      }
      
      // Handle different API response structures
      let createdEntity = response.data;
      
      // Extract entity from nested response structure
      if (createdEntity.success) {
        if (createdEntity.user) {
          createdEntity = createdEntity.user;
        } else if (createdEntity.location) {
          createdEntity = createdEntity.location;
        } else if (createdEntity.data) {
          createdEntity = createdEntity.data;
        } else if (createdEntity.category) {
          createdEntity = createdEntity.category;
        } else if (createdEntity.product) {
          createdEntity = createdEntity.product;
        }
      }
      
      // Validate response structure
      if (!createdEntity.id) {
        throw new Error('CREATE response missing required ID field');
      }
      
      // Validate that test data was properly saved
      this.validateCreatedEntity(entityType, testData, createdEntity);
      
      this.recordSuccess(`CREATE ${entityType}`, `Entity created with ID: ${createdEntity.id}`);
      return createdEntity;
      
    } catch (error) {
      this.recordError(`CREATE ${entityType}`, error);
      throw error;
    }
  }

  /**
   * Test READ operation
   */
  async testRead(entityType, entityId) {
    const endpoint = `${this.getApiEndpoint(entityType)}/${entityId}`;
    
    try {
      const response = await this.apiClient.get(endpoint);
      
      if (response.status !== 200) {
        throw new Error(`READ failed with status ${response.status}: ${response.statusText}`);
      }
      
      const entity = response.data;
      
      if (!entity || entity.id !== entityId) {
        throw new Error(`READ returned invalid data - expected ID ${entityId}, got ${entity?.id}`);
      }
      
      this.recordSuccess(`READ ${entityType}`, `Successfully retrieved entity with ID: ${entityId}`);
      return entity;
      
    } catch (error) {
      this.recordError(`READ ${entityType}`, error);
      throw error;
    }
  }

  /**
   * Test UPDATE operation
   */
  async testUpdate(entityType, entityId, updateData) {
    const endpoint = `${this.getApiEndpoint(entityType)}/${entityId}`;
    
    try {
      const response = await this.apiClient.put(endpoint, updateData);
      
      if (response.status !== 200) {
        throw new Error(`UPDATE failed with status ${response.status}: ${response.statusText}`);
      }
      
      const updatedEntity = response.data;
      
      // Validate that updates were applied
      this.validateUpdatedEntity(entityType, updateData, updatedEntity);
      
      this.recordSuccess(`UPDATE ${entityType}`, `Successfully updated entity with ID: ${entityId}`);
      return updatedEntity;
      
    } catch (error) {
      this.recordError(`UPDATE ${entityType}`, error);
      throw error;
    }
  }

  /**
   * Test PARTIAL UPDATE operation
   */
  async testPartialUpdate(entityType, entityId, partialUpdateData) {
    const endpoint = `${this.getApiEndpoint(entityType)}/${entityId}`;
    
    try {
      const response = await this.apiClient.patch(endpoint, partialUpdateData);
      
      if (response.status !== 200) {
        throw new Error(`PARTIAL UPDATE failed with status ${response.status}: ${response.statusText}`);
      }
      
      const updatedEntity = response.data;
      
      // Validate that partial updates were applied
      Object.keys(partialUpdateData).forEach(key => {
        if (updatedEntity[key] !== partialUpdateData[key]) {
          throw new Error(`PARTIAL UPDATE failed - ${key} not updated correctly`);
        }
      });
      
      this.recordSuccess(`PARTIAL UPDATE ${entityType}`, `Successfully partially updated entity with ID: ${entityId}`);
      return updatedEntity;
      
    } catch (error) {
      this.recordError(`PARTIAL UPDATE ${entityType}`, error);
      throw error;
    }
  }

  /**
   * Test DELETE operation - CRITICAL TEST
   * This is the main operation that was failing before
   */
  async testDelete(entityType, entityId) {
    const endpoint = `${this.getApiEndpoint(entityType)}/${entityId}`;
    
    try {
      // First, verify the entity exists
      const preDeleteResponse = await this.apiClient.get(endpoint);
      if (preDeleteResponse.status !== 200) {
        throw new Error(`Entity ${entityId} does not exist before DELETE test`);
      }
      
      // Perform DELETE operation
      const deleteResponse = await this.apiClient.delete(endpoint);
      
      if (deleteResponse.status !== 200 && deleteResponse.status !== 204) {
        throw new Error(`DELETE failed with status ${deleteResponse.status}: ${deleteResponse.statusText}`);
      }
      
      // Verify entity is actually deleted
      try {
        const postDeleteResponse = await this.apiClient.get(endpoint);
        if (postDeleteResponse.status === 200) {
          throw new Error('Entity still exists after DELETE operation');
        }
      } catch (error) {
        // Expected - entity should not be found after deletion
        if (error.response && error.response.status === 404) {
          // This is expected - entity was successfully deleted
        } else {
          throw error;
        }
      }
      
      this.recordSuccess(`DELETE ${entityType}`, `Successfully deleted entity with ID: ${entityId}`);
      
    } catch (error) {
      this.recordError(`DELETE ${entityType}`, error);
      throw error;
    }
  }

  /**
   * Force delete an entity (for cleanup purposes)
   */
  async forceDelete(entityType, entityId) {
    const endpoint = `${this.getApiEndpoint(entityType)}/${entityId}`;
    
    try {
      await this.apiClient.delete(endpoint);
      this.logger.info(`🧹 Force deleted ${entityType} with ID: ${entityId}`);
    } catch (error) {
      this.logger.warn(`⚠️  Failed to force delete ${entityType} ${entityId}:`, error.message);
    }
  }

  /**
   * Get API endpoint for entity type
   */
  getApiEndpoint(entityType) {
    // Handle both singular and plural entity types
    const normalizedType = entityType.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
    
    const endpoints = {
      'product': '/api/products',
      'category': '/api/categories',
      'location': '/api/locations',
      'user': '/api/users',
      'inventory': '/api/inventory'
    };
    
    // First try exact match, then try normalized singular form
    return endpoints[entityType] || endpoints[normalizedType] || `/api/${normalizedType}s`;
  }

  /**
   * Validate created entity matches test data
   */
  validateCreatedEntity(entityType, testData, createdEntity) {
    const requiredFields = this.getRequiredFields(entityType);
    
    requiredFields.forEach(field => {
      if (testData[field] && createdEntity[field] !== testData[field]) {
        throw new Error(`CREATE validation failed - ${field} mismatch: expected ${testData[field]}, got ${createdEntity[field]}`);
      }
    });
  }

  /**
   * Validate updated entity matches update data
   */
  validateUpdatedEntity(entityType, updateData, updatedEntity) {
    Object.keys(updateData).forEach(key => {
      if (updatedEntity[key] !== updateData[key]) {
        throw new Error(`UPDATE validation failed - ${key} not updated: expected ${updateData[key]}, got ${updatedEntity[key]}`);
      }
    });
  }

  /**
   * Get required fields for validation
   */
  getRequiredFields(entityType) {
    // Handle both singular and plural entity types
    const normalizedType = entityType.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
    
    const fieldMaps = {
      'product': ['name', 'sku'],
      'category': ['name'],
      'location': ['name'],
      'user': ['name', 'email'],
      'inventory': ['name', 'sku', 'currentStock']
    };
    
    return fieldMaps[entityType] || fieldMaps[normalizedType] || ['name'];
  }

  /**
   * Record successful test
   */
  recordSuccess(operation, message) {
    this.testResults.passed++;
    this.testResults.details.push({
      type: 'SUCCESS',
      operation,
      message,
      timestamp: new Date().toISOString()
    });
    this.logger.info(`✅ ${operation}: ${message}`);
  }

  /**
   * Record test error
   */
  recordError(operation, error) {
    this.testResults.failed++;
    this.testResults.errors.push({
      operation,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    this.testResults.details.push({
      type: 'ERROR',
      operation,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    this.logger.error(`❌ ${operation}: ${error.message}`);
  }

  /**
   * Clean up any remaining test entities
   */
  async cleanup() {
    this.logger.info('🧹 Starting CRUD test cleanup...');
    
    for (const [entityType, entities] of Object.entries(this.createdEntities)) {
      if (entities.length > 0) {
        this.logger.info(`Cleaning up ${entities.length} ${entityType}...`);
        
        for (const entity of entities) {
          try {
            await this.forceDelete(entityType.slice(0, -1), entity.id); // Remove 's' from plural
          } catch (error) {
            this.logger.warn(`Failed to cleanup ${entityType} ${entity.id}:`, error.message);
          }
        }
      }
    }
    
    this.logger.info('✅ CRUD test cleanup completed');
  }

  /**
   * Get test results summary
   */
  getTestSummary() {
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? (this.testResults.passed / total * 100).toFixed(2) : 0;
    
    return {
      total,
      passed: this.testResults.passed,
      failed: this.testResults.failed,
      successRate: `${successRate}%`,
      errors: this.testResults.errors,
      details: this.testResults.details,
      createdEntities: this.createdEntities
    };
  }
}

module.exports = CrudTestSuite;