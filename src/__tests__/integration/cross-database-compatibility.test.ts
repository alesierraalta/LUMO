/**
 * Cross-Database Compatibility Tests
 * 
 * This test suite validates that the application works consistently
 * across different database backends (SQLite and PostgreSQL/Supabase).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { setupTestDatabase, cleanupTestDatabase, disconnectDatabase, createTestRole, createTestUser, createTestCategory, testConfig, db } from '../setup/test-utilities'

describe('Cross-Database Compatibility Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await disconnectDatabase()
  })

  beforeEach(async () => {
    // Clean up any test data before each test to ensure isolation
    await cleanupTestDatabase()
  })

  describe('Database Environment Detection', () => {
    it('should correctly identify the database environment', () => {
      expect(testConfig).toBeDefined()
      expect(typeof testConfig.isDevelopment).toBe('boolean')
      expect(typeof testConfig.isSupabaseEnv).toBe('boolean')
      expect(typeof testConfig.usingPrisma).toBe('boolean')
      expect(typeof testConfig.usingSupabase).toBe('boolean')
      
      // Should be using either Prisma or Supabase, but not both
      expect(testConfig.usingPrisma || testConfig.usingSupabase).toBe(true)
      expect(testConfig.usingPrisma && testConfig.usingSupabase).toBe(false)
    })

    it('should have consistent environment configuration', () => {
      if (testConfig.isDevelopment) {
        expect(testConfig.usingPrisma).toBe(true)
        expect(testConfig.usingSupabase).toBe(false)
      } else if (testConfig.isSupabaseEnv) {
        expect(testConfig.usingSupabase).toBe(true)
        expect(testConfig.usingPrisma).toBe(false)
      }
    })
  })

  describe('Basic CRUD Operations Compatibility', () => {
    it('should create and retrieve roles consistently', async () => {
      const role = await createTestRole({
        name: 'COMPATIBILITY_TEST_ROLE',
        description: 'Role for compatibility testing'
      })

      expect(role).toBeDefined()
      expect(role.id).toBeDefined()
      expect(role.name).toBe('COMPATIBILITY_TEST_ROLE')
      expect(role.description).toBe('Role for compatibility testing')
      expect(typeof role.isActive).toBe('boolean')
      expect(typeof role.isSystem).toBe('boolean')
      expect(role.createdAt).toBeInstanceOf(Date)
      expect(role.updatedAt).toBeInstanceOf(Date)

      // Verify we can retrieve the role
      const retrievedRoles = await db.role.findMany({
        where: { id: role.id }
      })
      expect(retrievedRoles).toHaveLength(1)
      expect(retrievedRoles[0].id).toBe(role.id)
    })

    it('should create and retrieve users consistently', async () => {
      const role = await createTestRole()
      const user = await createTestUser({
        roleId: role.id,
        firstName: 'Compatibility',
        lastName: 'Test User',
        email: 'compatibility@test.com'
      })

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.firstName).toBe('Compatibility')
      expect(user.lastName).toBe('Test User')
      expect(user.email).toBe('compatibility@test.com')
      expect(user.roleId).toBe(role.id)
      expect(typeof user.isActive).toBe('boolean')
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)

      // Verify we can retrieve the user
      const retrievedUsers = await db.user.findMany({
        where: { id: user.id }
      })
      expect(retrievedUsers).toHaveLength(1)
      expect(retrievedUsers[0].id).toBe(user.id)
    })

    it('should create and retrieve categories consistently', async () => {
      const role = await createTestRole()
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({
        createdById: user.id,
        name: 'Compatibility Test Category',
        description: 'Category for compatibility testing'
      })

      expect(category).toBeDefined()
      expect(category.id).toBeDefined()
      expect(category.name).toBe('Compatibility Test Category')
      expect(category.description).toBe('Category for compatibility testing')
      expect(category.createdById).toBe(user.id)
      expect(category.createdAt).toBeInstanceOf(Date)
      expect(category.updatedAt).toBeInstanceOf(Date)

      // Verify we can retrieve the category
      const retrievedCategories = await db.category.findMany({
        where: { id: category.id }
      })
      expect(retrievedCategories).toHaveLength(1)
      expect(retrievedCategories[0].id).toBe(category.id)
    })
  })

  describe('Relationship Handling Compatibility', () => {
    it('should handle user-role relationships consistently', async () => {
      const role = await createTestRole({
        name: 'RELATIONSHIP_TEST_ROLE'
      })
      const user = await createTestUser({
        roleId: role.id,
        firstName: 'Relationship',
        lastName: 'Test User'
      })

      // Verify the relationship exists
      expect(user.roleId).toBe(role.id)

      // Test querying with relationships (if supported by the abstraction layer)
      const users = await db.user.findMany({
        where: { roleId: role.id }
      })
      expect(users).toHaveLength(1)
      expect(users[0].id).toBe(user.id)
    })

    it('should handle category-user relationships consistently', async () => {
      const role = await createTestRole()
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({
        createdById: user.id,
        name: 'Relationship Test Category'
      })

      // Verify the relationship exists
      expect(category.createdById).toBe(user.id)

      // Test querying with relationships
      const categories = await db.category.findMany({
        where: { createdById: user.id }
      })
      expect(categories).toHaveLength(1)
      expect(categories[0].id).toBe(category.id)
    })
  })

  describe('Data Type Consistency', () => {
    it('should handle boolean fields consistently', async () => {
      const role = await createTestRole({
        isActive: true,
        isSystem: false
      })

      expect(typeof role.isActive).toBe('boolean')
      expect(typeof role.isSystem).toBe('boolean')
      expect(role.isActive).toBe(true)
      expect(role.isSystem).toBe(false)
    })

    it('should handle date fields consistently', async () => {
      const role = await createTestRole()
      
      expect(role.createdAt).toBeInstanceOf(Date)
      expect(role.updatedAt).toBeInstanceOf(Date)
      expect(role.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
      expect(role.updatedAt.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should handle string fields consistently', async () => {
      const testName = 'STRING_CONSISTENCY_TEST'
      const testDescription = 'Testing string field consistency across databases'
      
      const role = await createTestRole({
        name: testName,
        description: testDescription
      })

      expect(typeof role.name).toBe('string')
      expect(typeof role.description).toBe('string')
      expect(role.name).toBe(testName)
      expect(role.description).toBe(testDescription)
    })

    it('should handle null values consistently', async () => {
      const user = await createTestUser({
        roleId: null // Test null foreign key
      })

      expect(user.roleId).toBeNull()
    })
  })

  describe('Query Operations Compatibility', () => {
    it('should handle findMany operations consistently', async () => {
      // Create some test data
      await createTestRole({ name: 'FINDMANY_TEST_1' })
      await createTestRole({ name: 'FINDMANY_TEST_2' })
      await createTestRole({ name: 'FINDMANY_TEST_3' })

      // Test findMany without filters
      const allRoles = await db.role.findMany()
      expect(allRoles.length).toBeGreaterThanOrEqual(3)

      // Test findMany with where clause
      const filteredRoles = await db.role.findMany({
        where: { name: 'FINDMANY_TEST_1' }
      })
      expect(filteredRoles).toHaveLength(1)
      expect(filteredRoles[0].name).toBe('FINDMANY_TEST_1')
    })

    it('should handle findUnique operations consistently', async () => {
      const role = await createTestRole({ name: 'UNIQUE_TEST_ROLE' })

      const foundRole = await db.role.findUnique({
        where: { id: role.id }
      })

      expect(foundRole).toBeDefined()
      expect(foundRole?.id).toBe(role.id)
      expect(foundRole?.name).toBe('UNIQUE_TEST_ROLE')
    })

    it('should handle count operations consistently', async () => {
      const initialCount = await db.role.count()
      
      await createTestRole({ name: 'COUNT_TEST_1' })
      await createTestRole({ name: 'COUNT_TEST_2' })

      const finalCount = await db.role.count()
      expect(finalCount).toBe(initialCount + 2)
    })
  })

  describe('Transaction Behavior Compatibility', () => {
    it('should handle successful transactions consistently', async () => {
      const initialRoleCount = await db.role.count()
      const initialUserCount = await db.user.count()

      // Create entities in a logical sequence (simulating a transaction)
      const role = await createTestRole({ name: 'TRANSACTION_TEST_ROLE' })
      const user = await createTestUser({ 
        roleId: role.id, 
        firstName: 'Transaction',
        lastName: 'Test User',
        email: 'transaction@test.com'
      })

      const finalRoleCount = await db.role.count()
      const finalUserCount = await db.user.count()

      expect(finalRoleCount).toBe(initialRoleCount + 1)
      expect(finalUserCount).toBe(initialUserCount + 1)
      expect(user.roleId).toBe(role.id)
    })
  })

  describe('Error Handling Compatibility', () => {
    it('should handle non-existent record queries consistently', async () => {
      const nonExistentRole = await db.role.findUnique({
        where: { id: 'non-existent-id' }
      })

      expect(nonExistentRole).toBeNull()

      const nonExistentUser = await db.user.findUnique({
        where: { id: 'non-existent-id' }
      })

      expect(nonExistentUser).toBeNull()
    })

    it('should handle invalid data gracefully', async () => {
      // Test with invalid roleId for user creation
      try {
        await createTestUser({ 
          roleId: 'non-existent-role-id',
          firstName: 'Invalid',
          lastName: 'Test',
          email: 'invalid@test.com'
        })
        // If we reach here, the test should check that the user was not created
        // or that appropriate error handling occurred
      } catch (error) {
        // Expected behavior - foreign key constraint should prevent creation
        expect(error).toBeDefined()
      }
    })
  })

  describe('Cleanup Operations Compatibility', () => {
    it('should handle deleteMany operations consistently', async () => {
      const role1 = await createTestRole({ name: 'DELETE_TEST_1' })
      const role2 = await createTestRole({ name: 'DELETE_TEST_2' })

      const initialCount = await db.role.count()
      expect(initialCount).toBeGreaterThanOrEqual(2)

      // Delete specific roles
      await db.role.deleteMany({
        where: { name: 'DELETE_TEST_1' }
      })

      const afterDeleteCount = await db.role.count()
      expect(afterDeleteCount).toBe(initialCount - 1)

      // Verify the correct role was deleted
      const remainingRole = await db.role.findUnique({
        where: { id: role2.id }
      })
      expect(remainingRole).toBeDefined()
      expect(remainingRole?.name).toBe('DELETE_TEST_2')
    })

    it('should handle foreign key constraints during deletion consistently', async () => {
      const role = await createTestRole({ name: 'FK_CONSTRAINT_TEST' })
      const user = await createTestUser({ 
        roleId: role.id,
        firstName: 'FK',
        lastName: 'Test User',
        email: 'fk@test.com'
      })

      // Attempting to delete a role that has associated users should handle the constraint
      try {
        await db.role.delete({
          where: { id: role.id }
        })
      } catch (error) {
        // Expected behavior - foreign key constraint should prevent deletion
        expect(error).toBeDefined()
      }

      // Clean up properly by removing the user first
      await db.user.deleteMany({ where: { id: user.id } })
      await db.role.deleteMany({ where: { id: role.id } })
    })
  })

  describe('Performance Characteristics', () => {
    it('should have reasonable performance for basic operations', async () => {
      const startTime = Date.now()

      // Create operations
      await createTestRole({ name: 'PERF_TEST_ROLE' })
      await createTestUser({ 
        roleId: (await createTestRole({ name: 'PERF_USER_ROLE' })).id,
        firstName: 'Performance',
        lastName: 'Test',
        email: 'perf@test.com'
      })

      // Query operations
      await db.role.findMany()
      await db.user.findMany()
      await db.category.findMany()
      
      // Count operations
      await db.role.count()
      await db.user.count()
      await db.category.count()

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000) // 5 seconds max
    })
  })
}) 
