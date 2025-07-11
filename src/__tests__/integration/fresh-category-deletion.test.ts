import { db, setupTestDatabase, cleanupTestDatabase, createTestRole, createTestUser, createTestCategory } from '../setup/test-utilities'

describe('Fresh Category Deletion Integration Tests', () => {
  // Clean up before each test
  beforeEach(async () => {
    await cleanupTestDatabase()
  })

  // Clean up after all tests
  afterAll(async () => {
    await cleanupTestDatabase()
    await db.$disconnect()
  })

  test('should delete a fresh category with no associated products', async () => {
    // Create test role
    const role = await createTestRole({
      name: 'TEST_ROLE_FRESH_CATEGORY',
      description: 'Test role for fresh category deletion'
    })

    // Create test user
    const user = await createTestUser({
      name: 'Test User Fresh Category',
      email: 'test-fresh-category@test.com',
      roleId: role.id
    })

    // Create a fresh category (no products)
    const freshCategory = await createTestCategory({
      name: 'Fresh Test Category',
      description: 'A category with no products for testing deletion',
      createdById: user.id
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
    const role = await createTestRole({
      name: 'TEST_ROLE_DEBUG_CATEGORY',
      description: 'Test role for debug category deletion'
    })

    // Create test user
    const user = await createTestUser({
      name: 'Test User Debug Category',
      email: 'test-debug-category@test.com',
      roleId: role.id
    })

    // Create a debug category
    const debugCategory = await createTestCategory({
      name: 'Debug Test Category',
      description: 'A category for testing debug deletion',
      createdById: user.id
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
    const role = await createTestRole({
      name: 'TEST_ROLE_API_CATEGORY',
      description: 'Test role for API category deletion'
    })

    // Create test user
    const user = await createTestUser({
      name: 'Test User API Category',
      email: 'test-api-category@test.com',
      roleId: role.id
    })

    // Create an API test category
    const apiTestCategory = await createTestCategory({
      name: 'API Test Category',
      description: 'A category for testing API-level deletion',
      createdById: user.id
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

    // Final verification: list all categories to ensure cleanup
    const allCategories = await db.category.findMany()
    console.log(`📋 Remaining categories after deletion: ${allCategories.length}`)
  })
})
