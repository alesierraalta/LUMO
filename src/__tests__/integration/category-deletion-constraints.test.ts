import { describe, it, expect, beforeEach, afterAll } from '@jest/globals'
import { setupTestDatabase, cleanupTestDatabase, disconnectDatabase, db } from '../setup/test-utilities'

describe('Category Deletion Constraints Integration Tests', () => {
  // Clean up before each test
  beforeEach(async () => {
    await cleanupTestDatabase()
    await setupTestDatabase()
  })

  // Clean up after all tests
  afterAll(async () => {
    await cleanupTestDatabase()
    await disconnectDatabase()
  })

  it('should prevent deletion of category with associated products', async () => {
    // Create test role
    const role = await db.role.create({
      data: {
        name: `TEST_ROLE_CONSTRAINT_CATEGORY_${Date.now()}`,
        description: 'Test role for constraint category deletion',
        isSystem: false,
        isActive: true
      }
    })

    // Create test user
    const user = await db.user.create({
      data: {
        name: 'Test User Constraint Category',
        email: `test-constraint-category-${Date.now()}@test.com`,
        password: 'test123',
        roleId: role.id,
        isActive: true
      }
    })

    // Create a category
    const category = await db.category.create({
      data: {
        name: `Category with Products ${Date.now()}`,
        description: 'A category that has associated products',
        createdById: user.id
      }
    })

    // Create a product associated with this category
    const product = await db.inventoryItem.create({
      data: {
        name: 'Test Product',
        sku: `TEST-SKU-${Date.now()}`,
        description: 'A test product',
        categoryId: category.id,
        currentStock: 10,
        minStockLevel: 5,
        price: 100.00,
        cost: 80.00,
        location: 'Test Location',
        createdById: user.id
      }
    })

    // Verify the product is associated with the category
    const productsCount = await db.inventoryItem.count({
      where: {
        categoryId: category.id
      }
    })
    expect(productsCount).toBe(1)

    // Attempt to delete the category - should fail due to foreign key constraint
    await expect(
      db.category.delete({
        where: {
          id: category.id
        }
      })
    ).rejects.toThrow(/Cannot delete categories record .* because it is referenced by inventory/)
  })

  it('should allow deletion of category without associated products', async () => {
    // Create test role
    const role = await db.role.create({
      data: {
        name: `TEST_ROLE_EMPTY_CATEGORY_${Date.now()}`,
        description: 'Test role for empty category deletion',
        isSystem: false,
        isActive: true
      }
    })

    // Create test user
    const user = await db.user.create({
      data: {
        name: 'Test User Empty Category',
        email: `test-empty-category-${Date.now()}@test.com`,
        password: 'test123',
        roleId: role.id,
        isActive: true
      }
    })

    // Create an empty category (no products)
    const emptyCategory = await db.category.create({
      data: {
        name: `Empty Category ${Date.now()}`,
        description: 'A category with no products',
        createdById: user.id
      }
    })

    // Verify no products are associated
    const productsCount = await db.inventoryItem.count({
      where: {
        categoryId: emptyCategory.id
      }
    })
    expect(productsCount).toBe(0)

    // Delete the category - should succeed
    await db.category.delete({
      where: {
        id: emptyCategory.id
      }
    })

    // Verify category is deleted
    const categoryExists = await db.category.findUnique({
      where: {
        id: emptyCategory.id
      }
    })
    expect(categoryExists).toBeNull()
  })

  it('should handle cascade deletion scenario', async () => {
    // Create test role
    const role = await db.role.create({
      data: {
        name: `TEST_ROLE_CASCADE_CATEGORY_${Date.now()}`,
        description: 'Test role for cascade category deletion',
        isSystem: false,
        isActive: true
      }
    })

    // Create test user
    const user = await db.user.create({
      data: {
        name: 'Test User Cascade Category',
        email: `test-cascade-category-${Date.now()}@test.com`,
        password: 'test123',
        roleId: role.id,
        isActive: true
      }
    })

    // Create a category
    const category = await db.category.create({
      data: {
        name: `Cascade Test Category ${Date.now()}`,
        description: 'A category for testing cascade deletion',
        createdById: user.id
      }
    })

    // Create a product associated with this category
    const product = await db.inventoryItem.create({
      data: {
        name: 'Cascade Test Product',
        sku: `CASCADE-SKU-${Date.now()}`,
        description: 'A test product for cascade deletion',
        categoryId: category.id,
        currentStock: 5,
        minStockLevel: 2,
        price: 50.00,
        cost: 40.00,
        location: 'Cascade Location',
        createdById: user.id
      }
    })

    // Verify initial state
    let productsCount = await db.inventoryItem.count({
      where: {
        categoryId: category.id
      }
    })
    expect(productsCount).toBe(1)

    // First, delete the associated products manually (simulating cascade)
    await db.inventoryItem.deleteMany({
      where: {
        categoryId: category.id
      }
    })

    // Verify products are deleted
    productsCount = await db.inventoryItem.count({
      where: {
        categoryId: category.id
      }
    })
    expect(productsCount).toBe(0)

    // Now delete the category - should succeed
    await db.category.delete({
      where: {
        id: category.id
      }
    })

    // Verify category is deleted
    const categoryExists = await db.category.findUnique({
      where: {
        id: category.id
      }
    })
    expect(categoryExists).toBeNull()
  })
}) 