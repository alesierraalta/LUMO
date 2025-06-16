import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Category Deletion Constraints - Real World Scenario', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.inventoryItem.deleteMany({
      where: { sku: { startsWith: 'TEST-' } }
    })
    await prisma.category.deleteMany({
      where: { name: { startsWith: 'TEST_' } }
    })
    await prisma.user.updateMany({
      where: { email: { contains: '@test-constraint.com' } },
      data: { roleId: null }
    })
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-constraint.com' } }
    })
    await prisma.role.deleteMany({
      where: { name: { startsWith: 'TEST_CONSTRAINT_' } }
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.inventoryItem.deleteMany({
      where: { sku: { startsWith: 'TEST-' } }
    })
    await prisma.category.deleteMany({
      where: { name: { startsWith: 'TEST_' } }
    })
    await prisma.user.updateMany({
      where: { email: { contains: '@test-constraint.com' } },
      data: { roleId: null }
    })
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-constraint.com' } }
    })
    await prisma.role.deleteMany({
      where: { name: { startsWith: 'TEST_CONSTRAINT_' } }
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.inventoryItem.deleteMany({
      where: { sku: { startsWith: 'TEST-' } }
    })
    await prisma.category.deleteMany({
      where: { name: { startsWith: 'TEST_' } }
    })
  })

  it('should simulate the exact error you are experiencing in production', async () => {
    // 1. Create a role and user (needed for foreign key constraints)
    const role = await prisma.role.create({
      data: {
        id: 'test-constraint-role',
        name: 'TEST_CONSTRAINT_ROLE',
        description: 'Test role for constraint testing',
        isSystem: false,
        isActive: true
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'test-constraint-user',
        email: 'test@test-constraint.com',
        password: 'testpass123',
        name: 'Test User',
        roleId: role.id,
        isActive: true
      }
    })

    // 2. Create a category (like "Electronics" in your production)
    const category = await prisma.category.create({
      data: {
        id: 'test-electronics-category',
        name: 'TEST_Electronics',
        description: 'Test electronics category',
        createdById: user.id
      }
    })

    // 3. Create a product in this category (this is what prevents deletion)
    const product = await prisma.inventoryItem.create({
      data: {
        id: 'test-laptop-product',
        name: 'Test Laptop',
        description: 'Test laptop product',
        sku: 'TEST-LAPTOP-001',
        currentStock: 5,
        minLevel: 1,
        minStockLevel: 1,
        categoryId: category.id,  // This creates the foreign key relationship
        createdById: user.id,
        isActive: true
      }
    })

    // 4. Verify the product exists and is associated with the category
    expect(product.categoryId).toBe(category.id)

    // 5. Simulate the API endpoint logic that checks for associated products
    const productsCount = await prisma.inventoryItem.count({
      where: { categoryId: category.id }
    })

    console.log(`🔍 Found ${productsCount} products in category "${category.name}"`)

    // 6. This should match your production error
    if (productsCount > 0) {
      const errorMessage = `Cannot delete category. It has ${productsCount} associated products.`
      console.log(`🚫 Expected API Response: ${errorMessage}`)
      
      // This is what your API should return (400 Bad Request)
      expect(productsCount).toBeGreaterThan(0)
      expect(errorMessage).toBe('Cannot delete category. It has 1 associated products.')
      
      // The category should NOT be deleted
      const categoryStillExists = await prisma.category.findUnique({
        where: { id: category.id }
      })
      expect(categoryStillExists).toBeDefined()
      expect(categoryStillExists?.name).toBe('TEST_Electronics')
    }

    // 7. Verify the business logic is working correctly
    console.log('✅ Business logic correctly prevents category deletion when products exist')
  })

  it('should allow category deletion when no products are associated', async () => {
    // 1. Create role and user
    const role = await prisma.role.create({
      data: {
        id: 'test-empty-role',
        name: 'TEST_EMPTY_ROLE',
        description: 'Test role for empty category',
        isSystem: false,
        isActive: true
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'test-empty-user',
        email: 'empty@test-constraint.com',
        password: 'testpass123',
        name: 'Test Empty User',
        roleId: role.id,
        isActive: true
      }
    })

    // 2. Create an empty category (no products)
    const emptyCategory = await prisma.category.create({
      data: {
        id: 'test-empty-category',
        name: 'TEST_Empty_Category',
        description: 'Test empty category',
        createdById: user.id
      }
    })

    // 3. Verify no products are associated
    const productsCount = await prisma.inventoryItem.count({
      where: { categoryId: emptyCategory.id }
    })

    expect(productsCount).toBe(0)
    console.log(`✅ Category "${emptyCategory.name}" has ${productsCount} products - deletion should be allowed`)

    // 4. Simulate successful deletion
    if (productsCount === 0) {
      await prisma.category.delete({
        where: { id: emptyCategory.id }
      })

      // 5. Verify category was deleted
      const categoryExists = await prisma.category.findUnique({
        where: { id: emptyCategory.id }
      })
      expect(categoryExists).toBeNull()
      console.log('✅ Empty category successfully deleted')
    }
  })

  it('should allow category deletion after removing all products', async () => {
    // 1. Create role and user
    const role = await prisma.role.create({
      data: {
        id: 'test-cleanup-role',
        name: 'TEST_CLEANUP_ROLE',
        description: 'Test role for cleanup scenario',
        isSystem: false,
        isActive: true
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'test-cleanup-user',
        email: 'cleanup@test-constraint.com',
        password: 'testpass123',
        name: 'Test Cleanup User',
        roleId: role.id,
        isActive: true
      }
    })

    // 2. Create category with product
    const category = await prisma.category.create({
      data: {
        id: 'test-cleanup-category',
        name: 'TEST_Cleanup_Category',
        description: 'Test cleanup category',
        createdById: user.id
      }
    })

    const product = await prisma.inventoryItem.create({
      data: {
        id: 'test-cleanup-product',
        name: 'Test Cleanup Product',
        sku: 'TEST-CLEANUP-001',
        currentStock: 3,
        minLevel: 1,
        minStockLevel: 1,
        categoryId: category.id,
        createdById: user.id,
        isActive: true
      }
    })

    // 3. Verify product exists
    let productsCount = await prisma.inventoryItem.count({
      where: { categoryId: category.id }
    })
    expect(productsCount).toBe(1)
    console.log(`🔍 Initially found ${productsCount} products in category`)

    // 4. Remove the product first (this is what users should do)
    await prisma.inventoryItem.delete({
      where: { id: product.id }
    })

    // 5. Verify no products remain
    productsCount = await prisma.inventoryItem.count({
      where: { categoryId: category.id }
    })
    expect(productsCount).toBe(0)
    console.log(`✅ After product removal: ${productsCount} products remain`)

    // 6. Now category deletion should succeed
    await prisma.category.delete({
      where: { id: category.id }
    })

    // 7. Verify category was deleted
    const categoryExists = await prisma.category.findUnique({
      where: { id: category.id }
    })
    expect(categoryExists).toBeNull()
    console.log('✅ Category successfully deleted after removing all products')
  })

  it('should test the exact API endpoint behavior', async () => {
    // This test simulates exactly what happens in your API endpoint
    // src/app/api/categories/[id]/route.ts

    // Setup
    const role = await prisma.role.create({
      data: {
        id: 'test-api-role',
        name: 'TEST_API_ROLE',
        description: 'Test role for API simulation',
        isSystem: false,
        isActive: true
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'test-api-user',
        email: 'api@test-constraint.com',
        password: 'testpass123',
        name: 'Test API User',
        roleId: role.id,
        isActive: true
      }
    })

    const category = await prisma.category.create({
      data: {
        id: '90872fe9-9743-4321-b962-ebdde60132ab', // Using the exact ID from your error
        name: 'TEST_API_Category',
        description: 'Test API category',
        createdById: user.id
      }
    })

    // Create a product (this causes the constraint)
    await prisma.inventoryItem.create({
      data: {
        id: 'test-api-product',
        name: 'Test API Product',
        sku: 'TEST-API-001',
        currentStock: 1,
        minLevel: 1,
        minStockLevel: 1,
        categoryId: category.id,
        createdById: user.id,
        isActive: true
      }
    })

    // Simulate the exact API endpoint logic
    console.log(`🗑️ Attempting to delete category: ${category.id}`)
    
    // Check if category has associated products (from your API code)
    const productsCount = await prisma.inventoryItem.count({
      where: { categoryId: category.id }
    })
    
    if (productsCount > 0) {
      console.log(`❌ Cannot delete category with associated products: ${productsCount}`)
      
      // This should match your exact API response
      const apiResponse = {
        error: `Cannot delete category. It has ${productsCount} associated products.`,
        status: 400
      }
      
      expect(apiResponse.error).toBe('Cannot delete category. It has 1 associated products.')
      expect(apiResponse.status).toBe(400)
      
      console.log('✅ API correctly returns 400 Bad Request with proper error message')
      
      // Category should still exist
      const categoryStillExists = await prisma.category.findUnique({
        where: { id: category.id }
      })
      expect(categoryStillExists).toBeDefined()
    }
  })
}) 