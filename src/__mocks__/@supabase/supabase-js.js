// Mock for @supabase/supabase-js
// Use a global object to persist data across mock resets
if (!global.__mockSupabaseData) {
  global.__mockSupabaseData = {
    categories: [],
    inventoryItems: [],
    users: [],
    roles: [],
    stockMovements: []
  };
}

let mockCategories = global.__mockSupabaseData.categories;
let mockInventoryItems = global.__mockSupabaseData.inventoryItems;
let mockUsers = global.__mockSupabaseData.users;
let mockRoles = global.__mockSupabaseData.roles;
let mockStockMovements = global.__mockSupabaseData.stockMovements;

// ✅ CRITICAL FIX: Add missing validateConstraints function
const validateConstraints = (data, tableName) => {
  if (!data) {
    throw new Error('Data is required');
  }

  switch (tableName) {
    case 'roles':
      if (!data.name) {
        throw new Error('Role name is required');
      }
      // Check for duplicate role names
      const existingRole = mockRoles.find(role => role.name === data.name);
      if (existingRole) {
        throw new Error(`Duplicate role name: ${data.name}`);
      }
      break;
    case 'users':
      if (!data.email) {
        throw new Error('User email is required');
      }
      // Check for duplicate user emails
      const existingUser = mockUsers.find(user => user.email === data.email);
      if (existingUser) {
        throw new Error(`Duplicate user email: ${data.email}`);
      }
      // Check if role exists when creating user with roleId
      if (data.role_id || data.roleId) {
        const roleId = data.role_id || data.roleId;
        const roleExists = mockRoles.find(role => role.id === roleId);
        if (!roleExists) {
          throw new Error(`Foreign key constraint failed: Role ${roleId} does not exist`);
        }
      }
      break;
    case 'categories':
      if (!data.name) {
        throw new Error('Category name is required');
      }
      // Check for duplicate category names
      const existingCategory = mockCategories.find(category => category.name === data.name);
      if (existingCategory) {
        throw new Error(`Duplicate category name: ${data.name}`);
      }
      // Check if user exists when creating category with created_by_id
      if (data.created_by_id || data.createdById) {
        const userId = data.created_by_id || data.createdById;
        const userExists = mockUsers.find(user => user.id === userId);
        if (!userExists) {
          throw new Error(`Foreign key constraint failed: User ${userId} does not exist`);
        }
      }
      break;
    case 'inventory_items':
      if (!data.name) {
        throw new Error('Product name is required');
      }
      if (!data.sku) {
        throw new Error('Product SKU is required');
      }
      // Check if category exists when creating inventory item with category_id
      if (data.category_id || data.categoryId) {
        const categoryId = data.category_id || data.categoryId;
        const categoryExists = mockCategories.find(cat => cat.id === categoryId);
        if (!categoryExists) {
          throw new Error(`Foreign key constraint failed: Category ${categoryId} does not exist`);
        }
      }
      break;
    case 'stock_movements':
      if (!data.type) {
        throw new Error('Stock movement type is required');
      }
      if (data.quantity === undefined || data.quantity === null) {
        throw new Error('Stock movement quantity is required');
      }
      // Check if inventory item exists when creating stock movement
      if (data.inventory_item_id || data.inventoryItemId) {
        const itemId = data.inventory_item_id || data.inventoryItemId;
        const itemExists = mockInventoryItems.find(item => item.id === itemId);
        if (!itemExists) {
          throw new Error(`Foreign key constraint failed: Inventory item ${itemId} does not exist`);
        }
      }
      break;
  }
};

// Helper to generate mock data based on entity type
const generateMockData = (tableName, overrides = {}) => {
  const baseData = {
    id: overrides.id || `mock-id-${Date.now()}-${Math.random()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  switch (tableName) {
    case 'categories':
      // Transform API fields to database fields
      const categoryOverrides = { ...overrides };
      if (categoryOverrides.createdById) {
        categoryOverrides.created_by_id = categoryOverrides.createdById;
        delete categoryOverrides.createdById;
      }
      
      return {
        ...baseData,
        name: 'Mock Category',
        description: 'Mock Description',
        created_by_id: 'mock-user-id',
        ...categoryOverrides
      };
    case 'inventory_items':
      // Transform API fields to database fields
      const inventoryOverrides = { ...overrides };
      if (inventoryOverrides.categoryId) {
        inventoryOverrides.category_id = inventoryOverrides.categoryId;
        delete inventoryOverrides.categoryId;
      }
      if (inventoryOverrides.createdById) {
        inventoryOverrides.created_by_id = inventoryOverrides.createdById;
        delete inventoryOverrides.createdById;
      }
      if (inventoryOverrides.minStockLevel !== undefined) {
        inventoryOverrides.min_stock_level = inventoryOverrides.minStockLevel;
        delete inventoryOverrides.minStockLevel;
      }
      if (inventoryOverrides.unitPrice !== undefined) {
        inventoryOverrides.unit_price = inventoryOverrides.unitPrice;
        delete inventoryOverrides.unitPrice;
      }
      if (inventoryOverrides.unitCost !== undefined) {
        inventoryOverrides.unit_cost = inventoryOverrides.unitCost;
        delete inventoryOverrides.unitCost;
      }
      
      return {
        ...baseData,
        name: 'Mock Product',
        sku: `SKU-${Date.now()}`,
        description: 'Mock Product Description',
        category_id: 'mock-category-id',
        quantity: 10,
        min_stock_level: 5,
        unit_price: 100.00,
        location: 'Mock Location',
        created_by_id: 'mock-user-id',
        ...inventoryOverrides
      };
    case 'users':
      // Transform API fields to database fields
      const userOverrides = { ...overrides };
      if (userOverrides.roleId) {
        userOverrides.role_id = userOverrides.roleId;
        delete userOverrides.roleId;
      }
      if (userOverrides.isActive !== undefined) {
        userOverrides.is_active = userOverrides.isActive;
        delete userOverrides.isActive;
      }
      if (userOverrides.firstName) {
        userOverrides.first_name = userOverrides.firstName;
        delete userOverrides.firstName;
      }
      if (userOverrides.lastName) {
        userOverrides.last_name = userOverrides.lastName;
        delete userOverrides.lastName;
      }
      
      return {
        ...baseData,
        name: 'Mock User',
        email: `mock-${Date.now()}@test.com`,
        password: 'mock-password',
        role_id: 'mock-role-id',
        is_active: true,
        ...userOverrides
      };
    case 'roles':
      // Transform API fields to database fields
      const roleOverrides = { ...overrides };
      console.log('🔄 ROLE OVERRIDES INPUT:', JSON.stringify(roleOverrides, null, 2));
      
      // Ensure boolean fields are properly transformed
      if (roleOverrides.isActive !== undefined) {
        roleOverrides.is_active = Boolean(roleOverrides.isActive);
        delete roleOverrides.isActive;
      }
      if (roleOverrides.isSystem !== undefined) {
        roleOverrides.is_system = Boolean(roleOverrides.isSystem);
        delete roleOverrides.isSystem;
      }
      
      console.log('🔄 ROLE OVERRIDES TRANSFORMED:', JSON.stringify(roleOverrides, null, 2));
      
      const roleData = {
        ...baseData,
        name: 'Mock Role',
        description: 'Mock Role Description',
        is_system: false,
        is_active: true,
        ...roleOverrides
      };
      
      console.log('🔄 FINAL ROLE DATA:', JSON.stringify(roleData, null, 2));
      return roleData;
    case 'stock_movements':
      // Transform API fields to database fields
      const movementOverrides = { ...overrides };
      if (movementOverrides.inventoryItemId) {
        movementOverrides.inventory_item_id = movementOverrides.inventoryItemId;
        delete movementOverrides.inventoryItemId;
      }
      if (movementOverrides.createdById) {
        movementOverrides.created_by_id = movementOverrides.createdById;
        delete movementOverrides.createdById;
      }
      if (movementOverrides.previousQuantity !== undefined) {
        movementOverrides.previous_quantity = movementOverrides.previousQuantity;
        delete movementOverrides.previousQuantity;
      }
      if (movementOverrides.newQuantity !== undefined) {
        movementOverrides.new_quantity = movementOverrides.newQuantity;
        delete movementOverrides.newQuantity;
      }
      
      return {
        ...baseData,
        inventory_item_id: 'mock-inventory-item-id',
        type: 'STOCK_IN',
        quantity: 10,
        previous_quantity: 0,
        new_quantity: 10,
        notes: 'Mock stock movement',
        created_by_id: 'mock-user-id',
        ...movementOverrides
      };
    default:
      return {
        ...baseData,
        ...overrides
      };
  }
};

// Create a chainable query builder
const createQueryBuilder = (tableName) => {
  let query = {
    tableName,
    selectFields: '*',
    whereConditions: [],
    orConditions: [],
    orderBy: null,
    isCount: false,
    isHead: false,
    isSingle: false,
    operation: null
  };

  const builder = {
    select: jest.fn((fields = '*', options = {}) => {
      query.selectFields = fields;
      query.isCount = options.count === 'exact';
      query.isHead = options.head === true;
      return builder;
    }),

    insert: jest.fn((data) => {
      console.log('🔍 INSERT METHOD CALLED with data:', JSON.stringify(data, null, 2));
      console.log('🔍 DATA TYPE:', typeof data);
      console.log('🔍 DATA.data EXISTS:', !!(data && data.data));
      
      // ✅ CRITICAL FIX: Handle Prisma-style parameter format { data: userData }
      const actualData = data && data.data ? data.data : data;
      console.log('🔍 ACTUAL DATA after format fix:', JSON.stringify(actualData, null, 2));
      console.log('🔍 ACTUAL DATA TYPE:', typeof actualData);
      console.log('🔍 ACTUAL DATA.name:', actualData?.name);
      console.log('🔍 TABLE NAME:', tableName);
      
      if (!actualData) {
        throw new Error('Data is required for insert operation');
      }

      // ✅ CRITICAL DEBUG: Check if this is a role and log the name field
      if (tableName === 'roles') {
        console.log('🔍 ROLE CREATION DEBUG:');
        console.log('  - actualData.name:', actualData.name);
        console.log('  - Has name property:', 'name' in actualData);
        console.log('  - All keys:', Object.keys(actualData));
        console.log('  - All values:', Object.values(actualData));
      }

      // Store insert data in query for later execution
      query.insertData = actualData;
      query.operation = 'insert';

      // ✅ CRITICAL FIX: Return chainable object instead of Promise
      return {
        select: jest.fn((fields = '*') => {
          query.selectFields = fields;
          return {
            single: jest.fn(async () => {
              // Execute the insert operation with proper constraint validation and field handling
              try {
                // ✅ ENHANCED CONSTRAINT VALIDATION: Check for duplicates BEFORE creation
                let mockData;
                switch (tableName) {
                  case 'categories':
                    mockData = mockCategories;
                    break;
                  case 'inventory_items':
                    mockData = mockInventoryItems;
                    break;
                  case 'users':
                    mockData = mockUsers;
                    break;
                  case 'roles':
                    mockData = mockRoles;
                    break;
                  case 'stock_movements':
                    mockData = mockStockMovements;
                    break;
                  default:
                    throw new Error(`Table ${tableName} not found`);
                }

                // ✅ CRITICAL: STRICT constraint validation - let validateConstraints detect duplicates properly

                // ✅ CRITICAL FIX: Handle constraint validation with STRICT enforcement
                try {
                  validateConstraints(actualData, tableName);
                } catch (error) {
                  console.error('❌ CONSTRAINT VALIDATION ERROR:', error.message);
                  // ✅ CRITICAL: Always throw constraint errors - do NOT generate unique data
                  return { data: null, error: { message: error.message } };
                }

                // Generate mock data with proper field handling
                const mockItem = generateMockData(tableName, actualData);
                
                console.log('🔍 GENERATED MOCK ITEM:', JSON.stringify(mockItem, null, 2));
                
                // ✅ CRITICAL: Ensure required fields are present
                if (tableName === 'roles' && !mockItem.name) {
                  mockItem.name = actualData.name || `ROLE_${Date.now()}`;
                }
                if (tableName === 'users' && !mockItem.email) {
                  mockItem.email = actualData.email || `user_${Date.now()}@test.com`;
                }
                
                // Add to mock database
                mockData.push(mockItem);
                
                console.log(`✅ ITEM ADDED to ${tableName}:`, mockItem.id);
                console.log(`📊 TOTAL COUNT in ${tableName}:`, mockData.length);

                return { data: mockItem, error: null };
              } catch (error) {
                console.error('❌ INSERT ERROR:', error.message);
                return { data: null, error: { message: error.message } };
              }
            })
          };
        }),
        // For cases where .select() isn't called, provide direct execution
        then: jest.fn((resolve, reject) => {
          // Execute insert without select
          const promise = new Promise(async (res) => {
            try {
              // Similar logic as above but simplified
              let mockData;
              switch (tableName) {
                case 'categories':
                  mockData = mockCategories;
                  break;
                case 'inventory_items':
                  mockData = mockInventoryItems;
                  break;
                case 'users':
                  mockData = mockUsers;
                  break;
                case 'roles':
                  mockData = mockRoles;
                  break;
                case 'stock_movements':
                  mockData = mockStockMovements;
                  break;
                default:
                  throw new Error(`Table ${tableName} not found`);
              }

              const mockItem = generateMockData(tableName, actualData);
              mockData.push(mockItem);
              res({ data: mockItem, error: null });
            } catch (error) {
              res({ data: null, error: { message: error.message } });
            }
          });
          return promise.then(resolve, reject);
        })
      };
    }),

    update: jest.fn((data) => {
      return {
        eq: jest.fn((field, value) => ({
          select: jest.fn(() => ({
            single: jest.fn(() => {
              try {
                // Validate foreign key constraints for updates
                const validateUpdateConstraints = (updateData, tableName) => {
                  switch (tableName) {
                    case 'users':
                      // Check if role exists when updating roleId (using database field names)
                      const roleId = updateData.role_id;
                      if (roleId && !mockRoles.find(role => role.id === roleId)) {
                        throw new Error(`Foreign key constraint failed: Role ${roleId} does not exist`);
                      }
                      break;
                    case 'categories':
                      // Check if user exists when updating created_by_id
                      const createdById = updateData.created_by_id;
                      if (createdById && !mockUsers.find(user => user.id === createdById)) {
                        throw new Error(`Foreign key constraint failed: User ${createdById} does not exist`);
                      }
                      break;
                    case 'inventory_items':
                      // Check if category exists when updating category_id
                      const categoryId = updateData.category_id;
                      if (categoryId && !mockCategories.find(cat => cat.id === categoryId)) {
                        throw new Error(`Foreign key constraint failed: Category ${categoryId} does not exist`);
                      }
                      break;
                  }
                };

                // Validate constraints before updating
                try {
                  validateUpdateConstraints(data, query.tableName);
                } catch (constraintError) {
                  // Return error response instead of throwing
                  return Promise.resolve({ 
                    data: null, 
                    error: {
                      message: constraintError.message,
                      code: 'CONSTRAINT_VIOLATION',
                      details: constraintError.message
                    }
                  });
                }

                // Find the item to update in the appropriate table
                let targetTable;
                switch (query.tableName) {
                  case 'categories':
                    targetTable = mockCategories;
                    break;
                  case 'inventory_items':
                    targetTable = mockInventoryItems;
                    break;
                  case 'users':
                    targetTable = mockUsers;
                    break;
                  case 'roles':
                    targetTable = mockRoles;
                    break;
                  case 'stock_movements':
                    targetTable = mockStockMovements;
                    break;
                  default:
                    targetTable = [];
                }
                
                // Find the existing item
                const existingItem = targetTable.find(item => item[field] === value);
                if (existingItem) {
                  // Update only the specified fields, preserving others
                  const updatedItem = {
                    ...existingItem,
                    ...data,
                    updated_at: new Date().toISOString()
                  };
                  
                  // Update the item in the table
                  const index = targetTable.findIndex(item => item[field] === value);
                  if (index !== -1) {
                    targetTable[index] = updatedItem;
                  }
                  
                  // Return the updated item in the expected format
                  let responseData = {
                    id: updatedItem.id,
                    name: updatedItem.name,
                    description: updatedItem.description,
                    createdAt: updatedItem.created_at ? new Date(updatedItem.created_at) : new Date(),
                    updatedAt: updatedItem.updated_at ? new Date(updatedItem.updated_at) : new Date(),
                    createdById: updatedItem.created_by_id
                  };
                  
                  // Add table-specific fields with robust field mapping
                  if (query.tableName === 'users') {
                    responseData.email = updatedItem.email;
                    responseData.password = updatedItem.password;
                    responseData.firstName = updatedItem.first_name;
                    responseData.lastName = updatedItem.last_name;
                    // Handle both database format (role_id) and API format (roleId)
                    console.log('🔍 USER FIELD MAPPING DEBUG:', {
                      itemId: updatedItem.id,
                      role_id: updatedItem.role_id,
                      roleId: updatedItem.roleId,
                      finalRoleId: updatedItem.role_id || updatedItem.roleId
                    });
                    responseData.roleId = updatedItem.role_id || updatedItem.roleId;
                    // Handle both database format (is_active) and API format (isActive) with explicit boolean conversion
                    responseData.isActive = updatedItem.is_active !== undefined ? Boolean(updatedItem.is_active) : (updatedItem.isActive !== undefined ? Boolean(updatedItem.isActive) : true);
                  } else if (query.tableName === 'roles') {
                    responseData.permissions = updatedItem.permissions || [];
                    // Handle both database format (is_system, is_active) and API format (isSystem, isActive)
                    responseData.isSystem = updatedItem.is_system !== undefined ? updatedItem.is_system : updatedItem.isSystem;
                    responseData.isActive = updatedItem.is_active !== undefined ? updatedItem.is_active : updatedItem.isActive;
                  }
                  
                  return Promise.resolve({ 
                    data: responseData, 
                    error: null 
                  });
                }
                
                // If item not found, return null
                return Promise.resolve({ data: null, error: null });
              } catch (error) {
                // Return error response instead of rejecting
                return Promise.resolve({ 
                  data: null, 
                  error: {
                    message: error.message,
                    code: 'UNEXPECTED_ERROR',
                    details: error.message
                  }
                });
              }
            })
          }))
        }))
      };
    }),

    delete: jest.fn(() => {
      query.operation = 'delete';
      return builder;
    }),

    deleteMany: jest.fn(() => {
      query.operation = 'deleteMany';
      return builder;
    }),

    // Add method to set deleteAll flag
    setDeleteAll: jest.fn(() => {
      query.deleteAllFlag = true;
      query.operation = 'deleteMany';
      return builder;
    }),

    eq: jest.fn((field, value) => {
      query.whereConditions.push({ field, operator: 'eq', value });
      return builder;
    }),

    neq: jest.fn((field, value) => {
      query.whereConditions.push({ field, operator: 'neq', value });
      return builder;
    }),

    not: jest.fn((field, operator, value) => {
      // Handle the three-parameter syntax: .not('id', 'eq', 'value')
      // This negates the condition, so 'eq' becomes 'neq'
      let negatedOperator;
      if (operator === 'eq') {
        negatedOperator = 'neq';
      } else if (operator === 'neq') {
        negatedOperator = 'eq';
      } else {
        // For other operators, we'll use the original logic
        negatedOperator = 'neq';
      }
      query.whereConditions.push({ field, operator: negatedOperator, value });
      return builder;
    }),

    contains: jest.fn((field, value) => {
      query.whereConditions.push({ field, operator: 'contains', value });
      return builder;
    }),

    ilike: jest.fn((field, pattern) => {
      // Handle ilike patterns like %value%
      let value = pattern;
      if (pattern.startsWith('%') && pattern.endsWith('%')) {
        value = pattern.slice(1, -1); // Remove % from both ends
      }
      query.whereConditions.push({ field, operator: 'contains', value });
      return builder;
    }),

    in: jest.fn((field, values) => {
      // Handle 'in' operator for checking if field value is in an array of values
      query.whereConditions.push({ field, operator: 'in', value: values });
      return builder;
    }),

    or: jest.fn((conditions) => {
      console.log('🔍 OR CONDITIONS RECEIVED:', JSON.stringify(conditions, null, 2));
      
      // Handle string format like "name.ilike.%Kitchen%,description.ilike.%tools%"
      if (typeof conditions === 'string') {
        const conditionParts = conditions.split(',');
        const parsedConditions = [];
        
        conditionParts.forEach(part => {
          const match = part.match(/(\w+)\.ilike\.%(.+)%/);
          if (match) {
            const [, field, value] = match;
            parsedConditions.push({
              field,
              operator: 'contains',
              value
            });
          }
        });
        
        query.orConditions.push(parsedConditions);
      } else {
        // Handle object format
        query.orConditions.push(conditions);
      }
      
      return builder;
    }),

    gte: jest.fn((field, value) => {
      query.whereConditions.push({ field, operator: 'gte', value });
      return builder;
    }),

    lte: jest.fn((field, value) => {
      query.whereConditions.push({ field, operator: 'lte', value });
      return builder;
    }),

    limit: jest.fn((count) => {
      query.limit = count;
      return builder;
    }),

    range: jest.fn((start, end) => {
      query.range = { start, end };
      return builder;
    }),

    order: jest.fn((field, options = {}) => {
      query.orderBy = { field, ascending: options.ascending !== false };
      return builder;
    }),

    single: jest.fn(() => {
      query.isSingle = true;
      return executeQuery(query);
    }),

    then: jest.fn((callback) => {
      return executeQuery(query).then(callback);
    })
  };

  // Make the builder thenable so it can be awaited directly
  builder.then = jest.fn((callback) => {
    return executeQuery(query).then(callback);
  });

  return builder;
};

// Execute the built query
const executeQuery = (query) => {
  // Handle DELETE and DELETEMANY operations with constraint checking
  if (query.operation === 'delete' || query.operation === 'deleteMany') {
    console.log(`🔍 EXECUTE ${query.operation.toUpperCase()}: Attempting to delete from ${query.tableName}`);
    
    const checkDeleteConstraints = (itemToDelete, tableName) => {
      switch (tableName) {
        case 'categories':
          // Check if category has associated inventory items (using database field names)
          const hasInventoryItems = mockInventoryItems.some(item => item.category_id === itemToDelete.id);
          if (hasInventoryItems) {
            throw new Error(`Foreign key constraint violation: Foreign key constraint violation: Cannot delete category: it has associated inventory items`);
          }
          break;
        case 'users':
          // Check if user has created categories (using database field names)
          const hasCreatedCategories = mockCategories.some(cat => cat.created_by_id === itemToDelete.id);
          if (hasCreatedCategories) {
            throw new Error(`Foreign key constraint violation: Cannot delete user: it has created categories`);
          }
          // Check if user has created inventory items (using database field names)
          const hasCreatedItems = mockInventoryItems.some(item => item.created_by_id === itemToDelete.id);
          if (hasCreatedItems) {
            throw new Error(`Foreign key constraint violation: Cannot delete user: it has created inventory items`);
          }
          break;
        case 'roles':
          // Check if role has associated users (using database field names)
          const hasUsers = mockUsers.some(user => user.role_id === itemToDelete.id);
          if (hasUsers) {
            throw new Error(`Foreign key constraint violation: Cannot delete role: it has associated users`);
          }
          break;
        case 'inventory_items':
          // Check if inventory item has stock movements (using database field names)
          const hasStockMovements = mockStockMovements.some(movement => movement.inventory_item_id === itemToDelete.id);
          if (hasStockMovements) {
            throw new Error(`Foreign key constraint violation: Cannot delete inventory item: it has stock movements`);
          }
          break;
      }
    };

    return new Promise((resolve, reject) => {
      try {
        // Get the appropriate table
        let targetTable;
        switch (query.tableName) {
          case 'categories':
            targetTable = mockCategories;
            break;
          case 'inventory_items':
            targetTable = mockInventoryItems;
            break;
          case 'users':
            targetTable = mockUsers;
            break;
          case 'roles':
            targetTable = mockRoles;
            break;
          case 'stock_movements':
            targetTable = mockStockMovements;
            break;
          default:
            console.log(`⚠️ EXECUTE DELETE: Unknown table ${query.tableName}`);
            resolve({ error: null });
            return;
        }

        // For deleteMany with no conditions, delete all items
        let itemsToDelete;
        if (query.operation === 'deleteMany' && query.whereConditions.length === 0) {
          // Check if deleteAll flag is provided when no conditions are specified
          if (!query.deleteAllFlag) {
            console.log(`💥 EXECUTE DELETEMANY: No conditions and no deleteAll flag specified`);
            resolve({ 
              error: { 
                message: 'No conditions specified',
                code: 'INVALID_OPERATION',
                details: 'deleteMany operation requires conditions or deleteAll: true flag'
              } 
            });
            return;
          }
          itemsToDelete = [...targetTable]; // Delete all items
        } else if (query.whereConditions.length > 0) {
          // Apply where conditions to find items to delete
          itemsToDelete = targetTable.filter(item => {
            return query.whereConditions.every(condition => {
              if (condition.operator === 'eq') {
                return item[condition.field] === condition.value;
              } else if (condition.operator === 'neq') {
                return item[condition.field] !== condition.value;
              } else if (condition.operator === 'in') {
                return Array.isArray(condition.value) && condition.value.includes(item[condition.field]);
              }
              return true;
            });
          });

          console.log(`🎯 EXECUTE ${query.operation.toUpperCase()}: Found ${itemsToDelete.length} items to delete`);

          // Check if any items were found to delete (only for single delete)
          if (itemsToDelete.length === 0 && query.operation === 'delete') {
            console.log(`💥 EXECUTE DELETE: No items found to delete`);
            resolve({ 
              error: { 
                message: 'Record not found',
                code: 'RECORD_NOT_FOUND',
                details: 'No record found with the specified criteria'
              } 
            });
            return;
          }
        } else {
          // Only single delete operations require conditions, deleteMany can delete all
          if (query.operation === 'delete') {
            console.log(`💥 EXECUTE DELETE: No conditions specified for single delete`);
            resolve({ 
              error: { 
                message: 'No conditions specified',
                code: 'INVALID_OPERATION',
                details: 'Delete operation requires conditions'
              } 
            });
            return;
          } else {
            // deleteMany with no conditions - delete all items
            itemsToDelete = [...targetTable];
            console.log(`🎯 EXECUTE DELETEMANY: Deleting ALL ${itemsToDelete.length} items (no conditions)`);
          }
        }

        // Check constraints for each item - return error instead of throwing
        for (const item of itemsToDelete) {
          console.log(`🔒 EXECUTE DELETE: Checking constraints for item:`, item);
          try {
            checkDeleteConstraints(item, query.tableName);
          } catch (constraintError) {
            console.log(`💥 EXECUTE DELETE: Constraint violation:`, constraintError.message);
            // Return error response instead of throwing
            resolve({ 
              error: { 
                message: constraintError.message,
                code: 'FOREIGN_KEY_VIOLATION',
                details: constraintError.message
              } 
            });
            return;
          }
        }

        console.log(`✅ EXECUTE DELETE: All constraints passed, proceeding with deletion`);

        // Remove the items
        itemsToDelete.forEach(itemToDelete => {
          const index = targetTable.findIndex(item => item.id === itemToDelete.id);
          if (index !== -1) {
            targetTable.splice(index, 1);
          }
        });

        console.log(`🗑️ EXECUTE DELETE: ${itemsToDelete.length} items removed successfully`);

        resolve({ error: null });
      } catch (error) {
        console.log(`💥 EXECUTE DELETE: Unexpected error:`, error.message);
        resolve({ 
          error: { 
            message: error.message,
            code: 'UNEXPECTED_ERROR',
            details: error.message
          } 
        });
      }
    });
  }

  // Get the appropriate data based on table name
  let mockData;
  switch (query.tableName) {
    case 'categories':
      mockData = mockCategories;
      break;
    case 'inventory_items':
      mockData = mockInventoryItems;
      break;
    case 'users':
      mockData = mockUsers;
      break;
    case 'roles':
      mockData = mockRoles;
      break;
    case 'stock_movements':
      mockData = mockStockMovements;
      break;
    default:
      mockData = [];
  }

  let results = [...mockData];

  // Apply WHERE conditions first
  if (query.whereConditions.length > 0) {
    results = results.filter(item => {
      return query.whereConditions.every(condition => {
        if (condition.operator === 'eq') {
          return item[condition.field] === condition.value;
        } else if (condition.operator === 'neq') {
          return item[condition.field] !== condition.value;
        } else if (condition.operator === 'contains') {
          const fieldValue = item[condition.field];
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
          }
          return false;
        } else if (condition.operator === 'in') {
          return Array.isArray(condition.value) && condition.value.includes(item[condition.field]);
        } else if (condition.operator === 'gte') {
          const itemDate = new Date(item[condition.field]);
          const conditionDate = new Date(condition.value);
          return itemDate >= conditionDate;
        } else if (condition.operator === 'lte') {
          const itemDate = new Date(item[condition.field]);
          const conditionDate = new Date(condition.value);
          return itemDate <= conditionDate;
        }
        return true;
      });
    });
  }

  // Handle count queries AFTER applying filters
  if (query.isCount) {
    return Promise.resolve({ count: results.length, error: null });
  }

  // Apply OR conditions (this should work even if no WHERE conditions)
  if (query.orConditions.length > 0) {
    const orResults = [];
    
    // Start with the full table if there were no WHERE conditions
    const searchBase = query.whereConditions.length > 0 ? results : mockData;
    
    query.orConditions.forEach((orCondition) => {
      // Handle array of conditions (parsed from string format)
      if (Array.isArray(orCondition)) {
        const matchingItems = searchBase.filter(item => {
          return orCondition.some(condition => {
            if (condition.operator === 'contains') {
              const fieldValue = item[condition.field];
              if (typeof fieldValue === 'string') {
                return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
              }
            }
            return false;
          });
        });
        
        matchingItems.forEach(item => {
          if (!orResults.some(existing => existing.id === item.id)) {
            orResults.push(item);
          }
        });
      } else {
        // Handle object format (legacy)
        const matchingItems = searchBase.filter(item => {
          const matches = Object.keys(orCondition).some(field => {
            const condition = orCondition[field];
            
            if (condition.contains) {
              const fieldValue = item[field];
              
              if (typeof fieldValue === 'string') {
                const result = fieldValue.toLowerCase().includes(condition.contains.toLowerCase());
                return result;
              }
            }
            return false;
          });
          
          return matches;
        });
        
        matchingItems.forEach(item => {
          if (!orResults.some(existing => existing.id === item.id)) {
            orResults.push(item);
          }
        });
      }
    });
    
    results = orResults;
  }

  // Apply ordering
  if (query.orderBy) {
    results.sort((a, b) => {
      const aVal = a[query.orderBy.field] || '';
      const bVal = b[query.orderBy.field] || '';
      const comparison = aVal.localeCompare(bVal);
      return query.orderBy.ascending ? comparison : -comparison;
    });
  }

  // Apply pagination
  if (query.range) {
    results = results.slice(query.range.start, query.range.end + 1);
  } else if (query.limit) {
    results = results.slice(0, query.limit);
  }

  // Transform results to match expected format
  console.log('🔧 TRANSFORMING RESULTS for table:', query.tableName, 'Results count:', results.length);
  console.log('🔍 QUERY TABLENAME TYPE:', typeof query.tableName, 'VALUE:', JSON.stringify(query.tableName));
  if (results.length > 0) {
    console.log('🔧 FIRST RESULT RAW:', JSON.stringify(results[0], null, 2));
  }
  
  // ✅ DEBUG: Check if this is a users table query with more detailed logging
  if (query.tableName === 'users') {
    console.log('🎯 USERS TABLE DETECTED - Field mapping should occur');
  } else {
    console.log('🔍 TABLE NAME:', query.tableName, '- Not users table');
    console.log('🔍 TABLE NAME COMPARISON: "users" === "' + query.tableName + '":', "users" === query.tableName);
  }
  
  results = results.map(item => {
    // Handle date parsing more robustly
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date();
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const baseItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      createdAt: parseDate(item.created_at || item.createdAt),
      updatedAt: parseDate(item.updated_at || item.updatedAt),
      createdById: item.created_by_id || item.createdById
    };

    // Add table-specific fields with robust field mapping
    if (query.tableName === 'categories') {
      const inventoryCount = mockInventoryItems.filter(invItem => invItem.category_id === item.id).length;
      baseItem._count = { inventoryItems: inventoryCount };
    } else if (query.tableName === 'users') {
      console.log('🔍 USERS TABLE - PRE-MAPPING ITEM:', JSON.stringify(item, null, 2));
      
      baseItem.email = item.email;
      baseItem.password = item.password;
      baseItem.firstName = item.first_name || item.firstName;
      baseItem.lastName = item.last_name || item.lastName;
      
      // ✅ CRITICAL FIX: Enhanced roleId field mapping with comprehensive fallback logic
      const roleId = item.role_id || item.roleId;
      if (roleId !== undefined && roleId !== null && roleId !== '') {
        baseItem.roleId = roleId;
        console.log('🎯 ROLE MAPPING SUCCESS - baseItem.roleId set to:', baseItem.roleId, 'from source:', item.role_id ? 'role_id' : 'roleId');
      } else {
        console.log('⚠️ WARNING: No valid roleId found in item:', JSON.stringify(item, null, 2));
        console.log('⚠️ WARNING: item.role_id:', item.role_id, 'item.roleId:', item.roleId);
        // Set to null explicitly rather than undefined to maintain consistent data types
        baseItem.roleId = null;
      }
      
      // Handle both database format (is_active) and API format (isActive) with explicit boolean conversion
      baseItem.isActive = item.is_active !== undefined ? Boolean(item.is_active) : (item.isActive !== undefined ? Boolean(item.isActive) : true);
    } else if (query.tableName === 'roles') {
      // ✅ CRITICAL FIX: Ensure all role fields are properly mapped
      baseItem.name = item.name;
      baseItem.description = item.description;
      baseItem.permissions = item.permissions || [];
      // Handle both database format (is_system, is_active) and API format (isSystem, isActive)
      baseItem.isSystem = item.is_system !== undefined ? Boolean(item.is_system) : (item.isSystem !== undefined ? Boolean(item.isSystem) : false);
      baseItem.isActive = item.is_active !== undefined ? Boolean(item.is_active) : (item.isActive !== undefined ? Boolean(item.isActive) : true);
      
      console.log('🎯 ROLE FIELDS MAPPED - name:', baseItem.name, 'description:', baseItem.description);
    } else if (query.tableName === 'inventory_items') {
      baseItem.sku = item.sku;
      baseItem.quantity = item.quantity;
      baseItem.minStockLevel = item.min_stock_level;
      baseItem.location = item.location;
      baseItem.cost = item.cost;
      baseItem.price = item.price;
      baseItem.margin = item.margin;
      baseItem.categoryId = item.category_id;
    } else if (query.tableName === 'stock_movements') {
      baseItem.type = item.type;
      baseItem.quantity = item.quantity;
      baseItem.notes = item.notes;
      baseItem.inventoryItemId = item.inventory_item_id;
    }

    console.log('🔧 TRANSFORMED ITEM for table:', query.tableName, 'Result:', JSON.stringify(baseItem, null, 2));
    return baseItem;
  });

  // Return single or multiple
  if (query.isSingle) {
    return Promise.resolve({ 
      data: results.length > 0 ? results[0] : null, 
      error: null 
    });
  }

  return Promise.resolve({ data: results, error: null });
};

const mockSupabaseClient = {
  from: jest.fn((tableName) => createQueryBuilder(tableName)),
  
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
  
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
      download: jest.fn(() => Promise.resolve({ data: null, error: null })),
      remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
};

// Global cleanup function for tests
const resetMockDatabase = () => {
  // Clear all arrays completely (including default data)
  mockUsers.length = 0;
  mockRoles.length = 0;
  mockCategories.length = 0;
  mockInventoryItems.length = 0;
  mockStockMovements.length = 0;
  
  // Also clear the global reference (should be the same arrays)
  global.__mockSupabaseData.users.length = 0;
  global.__mockSupabaseData.roles.length = 0;
  global.__mockSupabaseData.categories.length = 0;
  global.__mockSupabaseData.inventoryItems.length = 0;
  global.__mockSupabaseData.stockMovements.length = 0;
  
  // Database cleared successfully
};

const createClient = jest.fn(() => mockSupabaseClient);

module.exports = {
  createClient,
  resetMockDatabase,
  __esModule: true,
  default: { createClient },
}; 
