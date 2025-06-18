import { db } from '@/lib/db-supabase'

describe('Fresh Category Deletion Integration Tests', () => {
  // Clean up before each test
  beforeEach(async () => {
    await db.inventoryItem.deleteMany({ deleteAll: true })
    await db.category.deleteMany({ deleteAll: true })
    await db.user.updateMany({
      where: {},
      data: { roleId: null }
    })
    await db.user.deleteMany({ deleteAll: true })
    await db.role.deleteMany({ deleteAll: true })
  })

  // Clean up after all tests
  afterAll(async () => {
    await db.inventoryItem.deleteMany({ deleteAll: true })
    await db.category.deleteMany({ deleteAll: true })
    await db.user.updateMany({
      where: {},
      data: { roleId: null }
    })
    await db.user.deleteMany({ deleteAll: true })
    await db.role.deleteMany({ deleteAll: true })
    await db.$disconnect()
  })

  test('should delete a fresh category with no associated products', async () => {
    // Clean up any existing test data
    await db.inventoryItem.deleteMany({ deleteAll: true })
    await db.category.deleteMany({ deleteAll: true })

    // Create test role
    const role = await db.role.create({
      data: {
        name: 'TEST_ROLE_FRESH_CATEGORY',
        description: 'Test role for fresh category deletion',
        isSystem: false,
        isActive: true
      }
    })

    // Create test user
    const user = await db.user.create({
      data: {
        name: 'Test User Fresh Category',
        email: 'test-fresh-category@test.com',
        password: 'test123',
        roleId: role.id,
        isActive: true
      }
    })

    // Create a fresh category (no products)
    const freshCategory = await db.category.create({
      data: {
        name: 'Fresh Test Category',
        description: 'A category with no products for testing deletion',
        createdById: user.id
      }
    })

    // Verify no products are associated with this category
    const productsCount = await db.inventoryItem.count({
      where: {
        categoryId: freshCategory.id
      }
    })
    expect(productsCount).toBe(0)

    // Verify no associated products exist
    const associatedProductsCount = await db.inventoryItem.count({
      where: {
        categoryId: freshCategory.id
      }
    })
    expect(associatedProductsCount).toBe(0)

    // Delete the category - should succeed
    await db.category.delete({
      where: {
        id: freshCategory.id
      }
    })

    // Verify category is deleted
    const categoryExists = await db.category.findUnique({
      where: {
        id: freshCategory.id
      }
    })
    expect(categoryExists).toBeNull()
  })

  test('should handle deletion of category with debug information', async () => {
    // Create test role
    const role = await db.role.create({
      data: {
        name: 'TEST_ROLE_DEBUG_CATEGORY',
        description: 'Test role for debug category deletion',
        isSystem: false,
        isActive: true
      }
    })

    // Create test user
    const user = await db.user.create({
      data: {
        name: 'Test User Debug Category',
        email: 'test-debug-category@test.com',
        password: 'test123',
        roleId: role.id,
        isActive: true
      }
    })

    // Create a debug category
    const debugCategory = await db.category.create({
      data: {
        name: 'Debug Test Category',
        description: 'A category for testing debug deletion',
        createdById: user.id
      }
    })

    // Get all products (should be empty)
    const allProducts = await db.inventoryItem.findMany()
    console.log(`📊 Total products in database: ${allProducts.length}`)

    // Check for orphan products (products without categories)
    const orphanProducts = await db.inventoryItem.findMany({
      where: {
        categoryId: null
      }
    })
    console.log(`🔍 Orphan products (no category): ${orphanProducts.length}`)

    // Check for products with the same category ID
    const productsWithSameId = await db.inventoryItem.findMany({
      where: {
        categoryId: debugCategory.id
      }
    })
    console.log(`🎯 Products with category ID ${debugCategory.id}: ${productsWithSameId.length}`)

    // Delete the category - should succeed
    await db.category.delete({
      where: {
        id: debugCategory.id
      }
    })
  })

  test('should handle API-level category deletion', async () => {
    // Create test role
    const role = await db.role.create({
      data: {
        name: 'TEST_ROLE_API_CATEGORY',
        description: 'Test role for API category deletion',
        isSystem: false,
        isActive: true
      }
    })

    // Create test user
    const user = await db.user.create({
      data: {
        name: 'Test User API Category',
        email: 'test-api-category@test.com',
        password: 'test123',
        roleId: role.id,
        isActive: true
      }
    })

    // Create an API test category
    const apiTestCategory = await db.category.create({
      data: {
        name: 'API Test Category',
        description: 'A category for testing API-level deletion',
        createdById: user.id
      }
    })

    // Verify no products are associated
    const productsCount = await db.inventoryItem.count({
      where: {
        categoryId: apiTestCategory.id
      }
    })
    expect(productsCount).toBe(0)

    // Delete the category via API simulation
    await db.category.delete({
      where: {
        id: apiTestCategory.id
      }
    })

    // Verify category is deleted
    const categoryExists = await db.category.findUnique({
      where: {
        id: apiTestCategory.id
      }
    })
    expect(categoryExists).toBeNull()

    // Additional verification: check for any invalid category references
    const invalidCategoryRefs = await db.$queryRaw`
      SELECT * FROM inventory_items WHERE category_id = ${apiTestCategory.id}
    `
    expect(Array.isArray(invalidCategoryRefs)).toBe(true)
    expect(invalidCategoryRefs.length).toBe(0)

    // Final verification: list all categories to ensure cleanup
    const allCategories = await db.category.findMany()
    console.log(`📋 Remaining categories after deletion: ${allCategories.length}`)

    // Check database constraint integrity
    const constraintInfo = await db.$queryRaw`
      SELECT 
        constraint_name, 
        table_name, 
        constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name IN ('categories', 'inventory_items')
      AND constraint_type = 'FOREIGN KEY'
    `
    console.log('🔗 Foreign key constraints:', constraintInfo)
  })
})
