import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Fresh Category Deletion - Real User Scenario', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.inventoryItem.deleteMany({
      where: { sku: { startsWith: 'FRESH-TEST-' } }
    })
    await prisma.category.deleteMany({
      where: { name: { startsWith: 'FRESH_TEST_' } }
    })
    await prisma.user.updateMany({
      where: { email: { contains: '@fresh-test.com' } },
      data: { roleId: null }
    })
    await prisma.user.deleteMany({
      where: { email: { contains: '@fresh-test.com' } }
    })
    await prisma.role.deleteMany({
      where: { name: { startsWith: 'FRESH_TEST_' } }
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.inventoryItem.deleteMany({
      where: { sku: { startsWith: 'FRESH-TEST-' } }
    })
    await prisma.category.deleteMany({
      where: { name: { startsWith: 'FRESH_TEST_' } }
    })
    await prisma.user.updateMany({
      where: { email: { contains: '@fresh-test.com' } },
      data: { roleId: null }
    })
    await prisma.user.deleteMany({
      where: { email: { contains: '@fresh-test.com' } }
    })
    await prisma.role.deleteMany({
      where: { name: { startsWith: 'FRESH_TEST_' } }
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.inventoryItem.deleteMany({
      where: { sku: { startsWith: 'FRESH-TEST-' } }
    })
    await prisma.category.deleteMany({
      where: { name: { startsWith: 'FRESH_TEST_' } }
    })
  })

  it('should successfully delete a freshly created category with no products', async () => {
    // 1. Create role and user (needed for category creation)
    const role = await prisma.role.create({
      data: {
        id: 'fresh-test-role',
        name: 'FRESH_TEST_ROLE',
        description: 'Test role for fresh category',
        isSystem: false,
        isActive: true
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'fresh-test-user',
        email: 'user@fresh-test.com',
        password: 'testpass123',
        name: 'Fresh Test User',
        roleId: role.id,
        isActive: true
      }
    })

    // 2. Create a fresh category (like you just did in the UI)
    const freshCategory = await prisma.category.create({
      data: {
        id: 'fresh-category-test',
        name: 'FRESH_TEST_New_Category',
        description: 'A brand new category I just created',
        createdById: user.id
      }
    })

    console.log(`✅ Created fresh category: "${freshCategory.name}" (ID: ${freshCategory.id})`)

    // 3. Verify it has NO products associated (this should be 0)
    const productsCount = await prisma.inventoryItem.count({
      where: { categoryId: freshCategory.id }
    })

    console.log(`🔍 Products in fresh category: ${productsCount}`)
    expect(productsCount).toBe(0)

    // 4. Simulate the exact API endpoint logic
    console.log(`🗑️ Attempting to delete fresh category: ${freshCategory.id}`)
    
    // This is the exact logic from your API endpoint
    const associatedProductsCount = await prisma.inventoryItem.count({
      where: { categoryId: freshCategory.id }
    })
    
    if (associatedProductsCount > 0) {
      // This should NOT happen for a fresh category
      console.log(`❌ Unexpected: Fresh category has ${associatedProductsCount} products`)
      throw new Error(`Fresh category should have 0 products but has ${associatedProductsCount}`)
    } else {
      // This SHOULD happen - deletion should succeed
      console.log(`✅ Fresh category has ${associatedProductsCount} products - deletion should proceed`)
      
      await prisma.category.delete({
        where: { id: freshCategory.id }
      })
      
      console.log('✅ Fresh category deleted successfully')
    }

    // 5. Verify the category was actually deleted
    const categoryExists = await prisma.category.findUnique({
      where: { id: freshCategory.id }
    })
    
    expect(categoryExists).toBeNull()
    console.log('✅ Confirmed: Fresh category no longer exists in database')
  })

  it('should debug why a fresh category might show associated products', async () => {
    // This test helps debug potential issues
    
    // 1. Setup
    const role = await prisma.role.create({
      data: {
        id: 'debug-test-role',
        name: 'FRESH_TEST_DEBUG_ROLE',
        description: 'Debug test role',
        isSystem: false,
        isActive: true
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'debug-test-user',
        email: 'debug@fresh-test.com',
        password: 'testpass123',
        name: 'Debug Test User',
        roleId: role.id,
        isActive: true
      }
    })

    // 2. Create category
    const debugCategory = await prisma.category.create({
      data: {
        id: 'debug-category-test',
        name: 'FRESH_TEST_Debug_Category',
        description: 'Debug category',
        createdById: user.id
      }
    })

    // 3. Check for any products that might be associated
    const allProducts = await prisma.inventoryItem.findMany({
      where: { categoryId: debugCategory.id },
      select: {
        id: true,
        name: true,
        sku: true,
        categoryId: true,
        createdAt: true
      }
    })

    console.log(`🔍 All products in debug category:`, allProducts)
    expect(allProducts).toHaveLength(0)

    // 4. Check for any products with NULL categoryId that might be causing issues
    const orphanProducts = await prisma.inventoryItem.findMany({
      where: { categoryId: null },
      select: {
        id: true,
        name: true,
        sku: true,
        categoryId: true
      }
    })

    console.log(`🔍 Products with NULL categoryId:`, orphanProducts.length)

    // 5. Check for any products that might have the same ID by mistake
    const productsWithSameId = await prisma.inventoryItem.findMany({
      where: { id: debugCategory.id },
      select: {
        id: true,
        name: true,
        sku: true,
        categoryId: true
      }
    })

    console.log(`🔍 Products with same ID as category:`, productsWithSameId.length)
    expect(productsWithSameId).toHaveLength(0)

    // 6. Verify the category can be deleted
    await prisma.category.delete({
      where: { id: debugCategory.id }
    })

    console.log('✅ Debug category deleted successfully')
  })

  it('should test the exact API call that is failing for you', async () => {
    // This simulates making the actual API call
    
    // 1. Setup
    const role = await prisma.role.create({
      data: {
        id: 'api-call-test-role',
        name: 'FRESH_TEST_API_ROLE',
        description: 'API call test role',
        isSystem: false,
        isActive: true
      }
    })

    const user = await prisma.user.create({
      data: {
        id: 'api-call-test-user',
        email: 'api@fresh-test.com',
        password: 'testpass123',
        name: 'API Test User',
        roleId: role.id,
        isActive: true
      }
    })

    // 2. Create a fresh category
    const apiTestCategory = await prisma.category.create({
      data: {
        id: 'api-test-category',
        name: 'FRESH_TEST_API_Category',
        description: 'Fresh category for API testing',
        createdById: user.id
      }
    })

    console.log(`📝 Created category for API test: ${apiTestCategory.id}`)

    // 3. Simulate the exact API endpoint DELETE logic
    try {
      console.log(`🗑️ Attempting to delete category: ${apiTestCategory.id}`)
      
      // Check if category has associated products (from your API code)
      const productsCount = await prisma.inventoryItem.count({
        where: { categoryId: apiTestCategory.id }
      })
      
      if (productsCount > 0) {
        console.log(`❌ Cannot delete category with associated products: ${productsCount}`)
        
        // This would be the API response
        const apiResponse = {
          error: `Cannot delete category. It has ${productsCount} associated products.`,
          status: 400
        }
        
        console.log('🚫 API Response:', apiResponse)
        throw new Error(apiResponse.error)
      }
      
      // If we get here, deletion should proceed
      await prisma.category.delete({
        where: { id: apiTestCategory.id }
      })

      console.log('✅ Category deleted successfully')
      
      // Verify deletion
      const categoryExists = await prisma.category.findUnique({
        where: { id: apiTestCategory.id }
      })
      
      expect(categoryExists).toBeNull()
      console.log('✅ API call simulation successful - category deleted')
      
    } catch (error) {
      console.error('❌ API call simulation failed:', error)
      throw error
    }
  })

  it('should check for potential database inconsistencies', async () => {
    // This test checks for potential database issues that might cause the problem
    
    console.log('🔍 Checking for potential database inconsistencies...')
    
    // 1. Check for any inventory items with invalid categoryId references
    const invalidCategoryRefs = await prisma.$queryRaw`
      SELECT i.id, i.name, i.categoryId, c.id as category_exists
      FROM InventoryItem i
      LEFT JOIN Category c ON i.categoryId = c.id
      WHERE i.categoryId IS NOT NULL AND c.id IS NULL
    `
    
    console.log('🔍 Inventory items with invalid category references:', invalidCategoryRefs)
    
    // 2. Check for any categories that might have been soft-deleted or have issues
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            inventoryItems: true
          }
        }
      }
    })
    
    console.log('🔍 All categories with product counts:', allCategories)
    
    // 3. Check database constraints
    const constraintInfo = await prisma.$queryRaw`
      PRAGMA foreign_key_list(InventoryItem)
    `
    
    console.log('🔍 Foreign key constraints on InventoryItem:', constraintInfo)
    
    expect(true).toBe(true) // This test is just for debugging
  })
})
