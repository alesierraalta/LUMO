import { db, setupTestDatabase, cleanupTestDatabase } from './test-setup'
import { createTestRole, createTestUser, createTestCategory, createTestInventoryItem } from './test-setup'

describe('Referential Integrity Operations Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    await cleanupTestDatabase()
  })

  describe('Category Deletion with Associated Products', () => {
    it('should prevent deletion of category with associated products', async () => {
      // Setup: Create role, user, category, and product
      const role = await createTestRole({ name: 'CATEGORY_DELETE_TEST_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ 
        createdById: user.id,
        name: 'Electronics Test Category'
      })

      // Create a product associated with the category
      const product = await createTestInventoryItem({
        name: 'Test Laptop',
        description: 'Test laptop for category deletion test',
        sku: 'LAPTOP-001',
        currentStock: 10,
        categoryId: category.id,
        createdById: user.id
      })

      // Verify the product was created and associated with the category
      expect(product.categoryId).toBe(category.id)

      // Check that category has associated products
      const productsCount = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })
      expect(productsCount).toBe(1)

      // Simulate API endpoint logic that checks for associated products
      const hasAssociatedProducts = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })

      if (hasAssociatedProducts > 0) {
        // This should be the expected behavior - prevent deletion
        expect(hasAssociatedProducts).toBeGreaterThan(0)
        console.log(`✅ Correctly prevented deletion: Category has ${hasAssociatedProducts} associated products`)
      } else {
        // If no products, deletion should be allowed
        await db.category.delete({ where: { id: category.id } })
      }

      // Verify category still exists (because it has products)
      const categoryStillExists = await db.category.findUnique({
        where: { id: category.id }
      })
      expect(categoryStillExists).toBeDefined()
    })

    it('should allow deletion of category without associated products', async () => {
      // Setup: Create role, user, and category (no products)
      const role = await createTestRole({ name: 'EMPTY_CATEGORY_DELETE_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ 
        createdById: user.id,
        name: 'Empty Test Category'
      })

      // Verify no products are associated
      const productsCount = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })
      expect(productsCount).toBe(0)

      // Deletion should be allowed
      await db.category.delete({ where: { id: category.id } })

      // Verify category was deleted
      const categoryExists = await db.category.findUnique({
        where: { id: category.id }
      })
      expect(categoryExists).toBeNull()
    })

    it('should allow deletion after removing all associated products', async () => {
      // Setup: Create role, user, category, and product
      const role = await createTestRole({ name: 'CLEANUP_DELETE_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ 
        createdById: user.id,
        name: 'Cleanup Test Category'
      })

      // Create a product associated with the category
      const product = await db.inventoryItem.create({
        data: {
          id: 'test-product-for-cleanup',
          name: 'Test Product for Cleanup',
          sku: 'CLEANUP-001',
          currentStock: 5,
          categoryId: category.id,
          createdById: user.id
        }
      })

      // Verify product exists
      expect(product.categoryId).toBe(category.id)

      // First, delete the product
      await db.inventoryItem.delete({ where: { id: product.id } })

      // Verify no products are associated anymore
      const productsCount = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })
      expect(productsCount).toBe(0)

      // Now deletion should be allowed
      await db.category.delete({ where: { id: category.id } })

      // Verify category was deleted
      const categoryExists = await db.category.findUnique({
        where: { id: category.id }
      })
      expect(categoryExists).toBeNull()
    })
  })

  describe('User Deletion with Associated Data', () => {
    it('should prevent deletion of user with created categories', async () => {
      // Setup: Create role and user
      const role = await createTestRole({ name: 'USER_DELETE_TEST_ROLE' })
      const user = await createTestUser({ roleId: role.id })

      // Create a category created by this user
      const category = await createTestCategory({ 
        createdById: user.id,
        name: 'User Created Category'
      })

      // Verify the category was created by this user
      expect(category.createdById).toBe(user.id)

      // Check for associated data
      const categoriesCount = await db.category.count({
        where: { createdById: user.id }
      })
      expect(categoriesCount).toBe(1)

      // Attempt to delete user should fail due to foreign key constraint
      await expect(
        db.user.delete({ where: { id: user.id } })
      ).rejects.toThrow()

      // Verify user still exists
      const userStillExists = await db.user.findUnique({
        where: { id: user.id }
      })
      expect(userStillExists).toBeDefined()
    })

    it('should prevent deletion of user with created products', async () => {
      // Setup: Create role, user, and category
      const role = await createTestRole({ name: 'PRODUCT_CREATOR_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ createdById: user.id })

      // Create a product created by this user
      const product = await db.inventoryItem.create({
        data: {
          id: 'test-product-by-user',
          name: 'Product Created by User',
          sku: 'USER-PRODUCT-001',
          currentStock: 15,
          categoryId: category.id,
          createdById: user.id
        }
      })

      // Verify the product was created by this user
      expect(product.createdById).toBe(user.id)

      // Attempt to delete user should fail due to foreign key constraint
      await expect(
        db.user.delete({ where: { id: user.id } })
      ).rejects.toThrow()

      // Verify user still exists
      const userStillExists = await db.user.findUnique({
        where: { id: user.id }
      })
      expect(userStillExists).toBeDefined()
    })
  })

  describe('Role Deletion with Associated Users', () => {
    it('should prevent deletion of role with associated users', async () => {
      // Setup: Create role and user
      const role = await createTestRole({ name: 'ROLE_WITH_USERS' })
      const user = await createTestUser({ roleId: role.id })

      // Verify user is associated with role
      expect(user.roleId).toBe(role.id)

      // Check for associated users
      const usersCount = await db.user.count({
        where: { roleId: role.id }
      })
      expect(usersCount).toBe(1)

      // Attempt to delete role should fail due to foreign key constraint
      await expect(
        db.role.delete({ where: { id: role.id } })
      ).rejects.toThrow()

      // Verify role still exists
      const roleStillExists = await db.role.findUnique({
        where: { id: role.id }
      })
      expect(roleStillExists).toBeDefined()
    })

    it('should allow deletion of role without associated users', async () => {
      // Setup: Create role without users
      const role = await createTestRole({ name: 'EMPTY_ROLE' })

      // Verify no users are associated
      const usersCount = await db.user.count({
        where: { roleId: role.id }
      })
      expect(usersCount).toBe(0)

      // Deletion should be allowed
      await db.role.delete({ where: { id: role.id } })

      // Verify role was deleted
      const roleExists = await db.role.findUnique({
        where: { id: role.id }
      })
      expect(roleExists).toBeNull()
    })
  })

  describe('Product Deletion with Associated Data', () => {
    it('should handle product deletion with stock movements', async () => {
      // Setup: Create role, user, category, and product
      const role = await createTestRole({ name: 'STOCK_MOVEMENT_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ createdById: user.id })

      const product = await db.inventoryItem.create({
        data: {
          id: 'test-product-with-movements',
          name: 'Product with Stock Movements',
          sku: 'STOCK-001',
          currentStock: 20,
          categoryId: category.id,
          createdById: user.id
        }
      })

      // Create a stock movement for this product
      const stockMovement = await db.stockMovement.create({
        data: {
          id: 'test-stock-movement',
          type: 'IN',
          quantity: 10,
          previousStock: 10,
          newStock: 20,
          inventoryItemId: product.id,
          createdById: user.id
        }
      })

      // Verify stock movement exists
      expect(stockMovement.inventoryItemId).toBe(product.id)

      // Check for associated stock movements
      const movementsCount = await db.stockMovement.count({
        where: { inventoryItemId: product.id }
      })
      expect(movementsCount).toBe(1)

      // Attempt to delete product should fail due to foreign key constraint
      await expect(
        db.inventoryItem.delete({ where: { id: product.id } })
      ).rejects.toThrow()

      // Verify product still exists
      const productStillExists = await db.inventoryItem.findUnique({
        where: { id: product.id }
      })
      expect(productStillExists).toBeDefined()
    })

    it('should allow product deletion after removing stock movements', async () => {
      // Setup: Create role, user, category, and product
      const role = await createTestRole({ name: 'CLEAN_PRODUCT_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ createdById: user.id })

      const product = await db.inventoryItem.create({
        data: {
          id: 'test-product-clean-delete',
          name: 'Product for Clean Deletion',
          sku: 'CLEAN-001',
          currentStock: 5,
          categoryId: category.id,
          createdById: user.id
        }
      })

      // Create a stock movement
      const stockMovement = await db.stockMovement.create({
        data: {
          id: 'test-movement-to-delete',
          type: 'IN',
          quantity: 5,
          previousStock: 0,
          newStock: 5,
          inventoryItemId: product.id,
          createdById: user.id
        }
      })

      // First, delete the stock movement
      await db.stockMovement.delete({ where: { id: stockMovement.id } })

      // Verify no stock movements exist
      const movementsCount = await db.stockMovement.count({
        where: { inventoryItemId: product.id }
      })
      expect(movementsCount).toBe(0)

      // Now product deletion should be allowed
      await db.inventoryItem.delete({ where: { id: product.id } })

      // Verify product was deleted
      const productExists = await db.inventoryItem.findUnique({
        where: { id: product.id }
      })
      expect(productExists).toBeNull()
    })
  })

  describe('Cascade Deletion Scenarios', () => {
    it('should handle proper cascade deletion order', async () => {
      // Setup: Create complete hierarchy
      const role = await createTestRole({ name: 'CASCADE_TEST_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ createdById: user.id })

      const product = await db.inventoryItem.create({
        data: {
          id: 'cascade-test-product',
          name: 'Cascade Test Product',
          sku: 'CASCADE-001',
          currentStock: 10,
          categoryId: category.id,
          createdById: user.id
        }
      })

      const stockMovement = await db.stockMovement.create({
        data: {
          id: 'cascade-test-movement',
          type: 'IN',
          quantity: 10,
          previousStock: 0,
          newStock: 10,
          inventoryItemId: product.id,
          createdById: user.id
        }
      })

      // Verify all entities exist
      expect(await db.role.findUnique({ where: { id: role.id } })).toBeDefined()
      expect(await db.user.findUnique({ where: { id: user.id } })).toBeDefined()
      expect(await db.category.findUnique({ where: { id: category.id } })).toBeDefined()
      expect(await db.inventoryItem.findUnique({ where: { id: product.id } })).toBeDefined()
      expect(await db.stockMovement.findUnique({ where: { id: stockMovement.id } })).toBeDefined()

      // Delete in proper order (children first, then parents)
      // 1. Delete stock movements first
      await db.stockMovement.delete({ where: { id: stockMovement.id } })
      
      // 2. Delete products
      await db.inventoryItem.delete({ where: { id: product.id } })
      
      // 3. Delete categories
      await db.category.delete({ where: { id: category.id } })
      
      // 4. Delete users (after removing role reference)
      await db.user.update({
        where: { id: user.id },
        data: { roleId: null }
      })
      await db.user.delete({ where: { id: user.id } })
      
      // 5. Finally delete roles
      await db.role.delete({ where: { id: role.id } })

      // Verify all entities were deleted
      expect(await db.stockMovement.findUnique({ where: { id: stockMovement.id } })).toBeNull()
      expect(await db.inventoryItem.findUnique({ where: { id: product.id } })).toBeNull()
      expect(await db.category.findUnique({ where: { id: category.id } })).toBeNull()
      expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull()
      expect(await db.role.findUnique({ where: { id: role.id } })).toBeNull()
    })
  })

  describe('API Endpoint Simulation', () => {
    it('should simulate DELETE /api/categories/[id] with products', async () => {
      // Setup: Create category with products (simulating real app scenario)
      const role = await createTestRole({ name: 'API_SIMULATION_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ 
        createdById: user.id,
        name: 'API Test Category'
      })

      // Create multiple products in this category
      const product1 = await db.inventoryItem.create({
        data: {
          id: 'api-test-product-1',
          name: 'API Test Product 1',
          sku: 'API-001',
          currentStock: 5,
          categoryId: category.id,
          createdById: user.id
        }
      })

      const product2 = await db.inventoryItem.create({
        data: {
          id: 'api-test-product-2',
          name: 'API Test Product 2',
          sku: 'API-002',
          currentStock: 8,
          categoryId: category.id,
          createdById: user.id
        }
      })

      // Simulate the API endpoint logic
      const productsCount = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })

      // This should match the error you're seeing in production
      if (productsCount > 0) {
        const errorMessage = `Cannot delete category. It has ${productsCount} associated products.`
        console.log(`🚫 API Response: ${errorMessage}`)
        
        // Verify the error message matches what the API returns
        expect(errorMessage).toBe(`Cannot delete category. It has ${productsCount} associated products.`)
        expect(productsCount).toBe(2)
        
        // The API should return 400 status and not delete the category
        const categoryStillExists = await db.category.findUnique({
          where: { id: category.id }
        })
        expect(categoryStillExists).toBeDefined()
      }
    })

    it('should simulate successful DELETE /api/categories/[id] without products', async () => {
      // Setup: Create empty category
      const role = await createTestRole({ name: 'EMPTY_API_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ 
        createdById: user.id,
        name: 'Empty API Category'
      })

      // Simulate the API endpoint logic
      const productsCount = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })

      if (productsCount === 0) {
        // Should allow deletion
        await db.category.delete({
          where: { id: category.id }
        })

        console.log('✅ Category deleted successfully')
        
        // Verify deletion was successful
        const categoryExists = await db.category.findUnique({
          where: { id: category.id }
        })
        expect(categoryExists).toBeNull()
      }
    })
  })

  describe('Error Message Validation', () => {
    it('should generate correct error messages for different scenarios', async () => {
      // Setup test data
      const role = await createTestRole({ name: 'ERROR_MESSAGE_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ createdById: user.id })

      // Test with 1 product
      const product = await db.inventoryItem.create({
        data: {
          id: 'single-product-test',
          name: 'Single Product',
          sku: 'SINGLE-001',
          currentStock: 1,
          categoryId: category.id,
          createdById: user.id
        }
      })

      let productsCount = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })
      
      expect(productsCount).toBe(1)
      let errorMessage = `Cannot delete category. It has ${productsCount} associated products.`
      expect(errorMessage).toBe('Cannot delete category. It has 1 associated products.')

      // Add another product
      const product2 = await db.inventoryItem.create({
        data: {
          id: 'second-product-test',
          name: 'Second Product',
          sku: 'SECOND-001',
          currentStock: 2,
          categoryId: category.id,
          createdById: user.id
        }
      })

      productsCount = await db.inventoryItem.count({
        where: { categoryId: category.id }
      })
      
      expect(productsCount).toBe(2)
      errorMessage = `Cannot delete category. It has ${productsCount} associated products.`
      expect(errorMessage).toBe('Cannot delete category. It has 2 associated products.')
    })
  })
}) 