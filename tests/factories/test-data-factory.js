/**
 * TEST DATA FACTORY
 * 
 * Generates safe test data with proper prefixes to prevent accidental deletion of production data.
 * All generated data includes TEST_ or DEBUG_ prefixes for safety.
 */

const { TEST_CONFIG } = require('../config/test-config');

class TestDataFactory {
  constructor() {
    this.testCounter = 0;
    this.createdTestData = {
      products: [],
      categories: [],
      locations: [],
      users: [],
      inventory: []
    };
  }

  /**
   * Generate unique test ID with timestamp and counter
   */
  generateTestId() {
    this.testCounter++;
    const timestamp = Date.now();
    return `${timestamp}_${this.testCounter}`;
  }

  /**
   * Generate test category data
   */
  generateTestCategory(overrides = {}) {
    const testId = this.generateTestId();
    const category = {
      name: `${TEST_CONFIG.SAFE_PREFIXES.CATEGORIES}Category_${testId}`,
      description: `Test category description for testing purposes - ${testId}`,
      color: '#FF6B6B',
      icon: 'package',
      is_active: true,
      created_at: new Date().toISOString(),
      ...overrides
    };

    this.createdTestData.categories.push(category);
    return category;
  }

  /**
   * Generate test location data
   */
  generateTestLocation(overrides = {}) {
    const testId = this.generateTestId();
    const location = {
      name: `${TEST_CONFIG.SAFE_PREFIXES.LOCATIONS}Location_${testId}`,
      description: `Test location for testing purposes - ${testId}`,
      address: `Test Address ${testId}, Test City, Test Country`,
      is_active: true,
      created_at: new Date().toISOString(),
      ...overrides
    };

    this.createdTestData.locations.push(location);
    return location;
  }

  /**
   * Generate test product data
   */
  generateTestProduct(categoryId = null, overrides = {}) {
    const testId = this.generateTestId();
    const product = {
      name: `${TEST_CONFIG.SAFE_PREFIXES.PRODUCTS}Product_${testId}`,
      description: `Test product description for comprehensive testing - ${testId}`,
      sku: `TEST-SKU-${testId}`,
      barcode: `TEST-BARCODE-${testId}`,
      price: Math.floor(Math.random() * 10000) + 1000, // Random price between 10.00 and 100.00
      cost: Math.floor(Math.random() * 5000) + 500,    // Random cost between 5.00 and 50.00
      category_id: categoryId,
      min_stock: Math.floor(Math.random() * 10) + 5,   // Random min stock between 5-15
      max_stock: Math.floor(Math.random() * 100) + 50, // Random max stock between 50-150
      unit: 'unit',
      weight: Math.floor(Math.random() * 1000) + 100,  // Random weight between 100-1100g
      dimensions: `${Math.floor(Math.random() * 20) + 10}x${Math.floor(Math.random() * 20) + 10}x${Math.floor(Math.random() * 20) + 10}`,
      is_active: true,
      created_at: new Date().toISOString(),
      ...overrides
    };

    this.createdTestData.products.push(product);
    return product;
  }

  /**
   * Generate test user data
   */
  generateTestUser(role = 'employee', overrides = {}) {
    const testId = this.generateTestId();
    
    // Map role names to role IDs (standard mapping)
    const roleMapping = {
      'admin': 1,
      'manager': 2,
      'employee': 3
    };
    
    const user = {
      name: `TestUser_${testId}`,
      email: `testuser${testId}@testdomain.com`,
      password: 'TestPassword123!',
      roleId: roleMapping[role] || 3, // Default to employee role ID
      isActive: true,
      ...overrides
    };

    this.createdTestData.users.push(user);
    return user;
  }

  /**
   * Generate test inventory item data
   */
  generateTestInventoryItem(productId, locationId, overrides = {}) {
    const testId = this.generateTestId();
    const inventoryItem = {
      product_id: productId,
      location_id: locationId,
      quantity: Math.floor(Math.random() * 100) + 10, // Random quantity between 10-110
      reserved_quantity: Math.floor(Math.random() * 5), // Random reserved between 0-5
      last_counted_at: new Date().toISOString(),
      notes: `${TEST_CONFIG.SAFE_PREFIXES.INVENTORY}Test inventory item - ${testId}`,
      created_at: new Date().toISOString(),
      ...overrides
    };

    this.createdTestData.inventory.push(inventoryItem);
    return inventoryItem;
  }

  /**
   * Generate complete test dataset with relationships
   */
  async generateCompleteTestDataset(options = {}) {
    const {
      categoriesCount = 3,
      locationsCount = 2,
      productsCount = 10,
      usersCount = 5,
      inventoryItemsCount = 15
    } = options;

    console.log('🏭 Generating complete test dataset...');
    
    const dataset = {
      categories: [],
      locations: [],
      products: [],
      users: [],
      inventory: []
    };

    // Generate categories
    for (let i = 0; i < categoriesCount; i++) {
      dataset.categories.push(this.generateTestCategory());
    }

    // Generate locations
    for (let i = 0; i < locationsCount; i++) {
      dataset.locations.push(this.generateTestLocation());
    }

    // Generate users with different roles
    const roles = ['admin', 'manager', 'employee'];
    for (let i = 0; i < usersCount; i++) {
      const role = roles[i % roles.length];
      dataset.users.push(this.generateTestUser(role));
    }

    // Generate products (some with categories, some without)
    for (let i = 0; i < productsCount; i++) {
      const categoryId = i < categoriesCount ? dataset.categories[i % categoriesCount].id : null;
      dataset.products.push(this.generateTestProduct(categoryId));
    }

    // Generate inventory items
    for (let i = 0; i < inventoryItemsCount; i++) {
      const productId = dataset.products[i % dataset.products.length].id;
      const locationId = dataset.locations[i % dataset.locations.length].id;
      dataset.inventory.push(this.generateTestInventoryItem(productId, locationId));
    }

    console.log(`✅ Generated test dataset:
    - Categories: ${dataset.categories.length}
    - Locations: ${dataset.locations.length}
    - Products: ${dataset.products.length}
    - Users: ${dataset.users.length}
    - Inventory Items: ${dataset.inventory.length}`);

    return dataset;
  }

  /**
   * Generate test data for specific CRUD operation testing
   */
  generateCrudTestData(entityType) {
    const testId = this.generateTestId();
    
    // Handle both singular and plural entity types
    const normalizedType = entityType.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
    
    switch (normalizedType) {
      case 'product':
        return {
          create: this.generateTestProduct(),
          update: {
            name: `${TEST_CONFIG.SAFE_PREFIXES.PRODUCTS}Updated_Product_${testId}`,
            description: `Updated test product description - ${testId}`,
            price: 2500
          },
          partialUpdate: {
            price: 3000
          }
        };

      case 'categorie':
      case 'category':
        return {
          create: this.generateTestCategory(),
          update: {
            name: `${TEST_CONFIG.SAFE_PREFIXES.CATEGORIES}Updated_Category_${testId}`,
            description: `Updated test category description - ${testId}`,
            color: '#00FF00'
          },
          partialUpdate: {
            color: '#0000FF'
          }
        };

      case 'location':
        return {
          create: this.generateTestLocation(),
          update: {
            name: `${TEST_CONFIG.SAFE_PREFIXES.LOCATIONS}Updated_Location_${testId}`,
            description: `Updated test location description - ${testId}`,
            address: `Updated Test Address ${testId}`
          },
          partialUpdate: {
            address: `Partially Updated Address ${testId}`
          }
        };

      case 'user':
        return {
          create: this.generateTestUser(),
          update: {
            name: `UpdatedTestUser_${testId}`,
            roleId: 2 // manager role ID
          },
          partialUpdate: {
            roleId: 1 // admin role ID
          }
        };

      case 'inventory':
        return {
          create: {
            name: `${TEST_CONFIG.SAFE_PREFIXES.INVENTORY}Item_${testId}`,
            description: `Test inventory item description - ${testId}`,
            sku: `TEST-INV-SKU-${testId}`,
            barcode: `TEST-INV-BARCODE-${testId}`,
            currentStock: Math.floor(Math.random() * 100) + 10,
            minStockLevel: Math.floor(Math.random() * 10) + 5,
            unitCost: Math.floor(Math.random() * 5000) + 500,
            unitPrice: Math.floor(Math.random() * 10000) + 1000,
            categoryId: null, // Will be set during test if needed
            locationId: null, // Will be set during test if needed
            isActive: true
          },
          update: {
            name: `${TEST_CONFIG.SAFE_PREFIXES.INVENTORY}Updated_Item_${testId}`,
            description: `Updated test inventory item description - ${testId}`,
            currentStock: Math.floor(Math.random() * 200) + 50,
            unitPrice: Math.floor(Math.random() * 15000) + 2000
          },
          partialUpdate: {
            currentStock: Math.floor(Math.random() * 150) + 25,
            unitPrice: Math.floor(Math.random() * 12000) + 1500
          }
        };

      default:
        throw new Error(`Unknown entity type: ${entityType} (normalized: ${normalizedType}). Supported types: products, categories, locations, users, inventory`);
    }
  }

  /**
   * Validate that all generated data has safe prefixes
   */
  validateTestDataSafety() {
    const errors = [];
    
    // Check categories
    this.createdTestData.categories.forEach((category, index) => {
      if (!category.name.startsWith(TEST_CONFIG.SAFE_PREFIXES.CATEGORIES)) {
        errors.push(`Category ${index} does not have safe prefix: ${category.name}`);
      }
    });

    // Check products
    this.createdTestData.products.forEach((product, index) => {
      if (!product.name.startsWith(TEST_CONFIG.SAFE_PREFIXES.PRODUCTS)) {
        errors.push(`Product ${index} does not have safe prefix: ${product.name}`);
      }
      if (!product.sku.startsWith('TEST-')) {
        errors.push(`Product ${index} SKU does not have safe prefix: ${product.sku}`);
      }
    });

    // Check locations
    this.createdTestData.locations.forEach((location, index) => {
      if (!location.name.startsWith(TEST_CONFIG.SAFE_PREFIXES.LOCATIONS)) {
        errors.push(`Location ${index} does not have safe prefix: ${location.name}`);
      }
    });

    // Check users
    this.createdTestData.users.forEach((user, index) => {
      if (!user.email.startsWith(TEST_CONFIG.SAFE_PREFIXES.USERS)) {
        errors.push(`User ${index} email does not have safe prefix: ${user.email}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Test data safety validation failed:\n${errors.join('\n')}`);
    }

    return true;
  }

  /**
   * Get summary of created test data
   */
  getCreatedDataSummary() {
    return {
      categories: this.createdTestData.categories.length,
      products: this.createdTestData.products.length,
      locations: this.createdTestData.locations.length,
      users: this.createdTestData.users.length,
      inventory: this.createdTestData.inventory.length,
      total: Object.values(this.createdTestData).reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  /**
   * Clear all created test data tracking
   */
  clearCreatedDataTracking() {
    this.createdTestData = {
      products: [],
      categories: [],
      locations: [],
      users: [],
      inventory: []
    };
    this.testCounter = 0;
  }
}

module.exports = TestDataFactory;