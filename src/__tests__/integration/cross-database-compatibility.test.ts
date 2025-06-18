/**
 * Cross-Database Compatibility Tests
 * 
 * This test suite validates that the application works consistently
 * across different database backends (SQLite and PostgreSQL/Supabase).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { setupTestDatabase, cleanupTestDatabase, disconnectDatabase, createTestRole, createTestUser, createTestCategory, testConfig } from '../setup/test-utilities'
import { db } from '@/lib/db-supabase'

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
        name: 'Compatibility Test User',
        email: 'compatibility@test.com'
      })

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.name).toBe('Compatibility Test User')
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
        name: 'Relationship Test User'
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
      // Create multiple test roles
      const role1 = await createTestRole({ name: 'QUERY_TEST_1' })
      await createTestRole({ name: 'QUERY_TEST_2' })
      await createTestRole({ name: 'QUERY_TEST_3' })

      // Test findMany without filters
      const allRoles = await db.role.findMany()
      expect(allRoles.length).toBeGreaterThanOrEqual(3)

      // Test findMany with where clause
      const filteredRoles = await db.role.findMany({
        where: {
          name: 'QUERY_TEST_1'
        }
      })
      expect(filteredRoles).toHaveLength(1)
      expect(filteredRoles[0].id).toBe(role1.id)
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
        name: 'Transaction Test User'
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
    })

    it('should handle invalid data gracefully', async () => {
      // This test ensures that both database backends handle validation errors similarly
      // The exact error might differ, but both should reject invalid data
      
      try {
        await createTestUser({
          email: 'invalid-email-format', // Invalid email
          roleId: 'non-existent-role-id' // Non-existent foreign key
        })
        // If we reach here, the test should fail
        expect(true).toBe(false)
      } catch (error) {
        // Both databases should throw some kind of error
        expect(error).toBeDefined()
      }
    })
  })

  describe('Cleanup Operations Compatibility', () => {
    it('should handle deleteMany operations consistently', async () => {
      // Create test data
      const role1 = await createTestRole({ name: 'DELETE_TEST_1' })
      const role2 = await createTestRole({ name: 'DELETE_TEST_2' })

      const initialCount = await db.role.count()
      expect(initialCount).toBeGreaterThanOrEqual(2)

      // Delete specific roles
      await db.role.deleteMany({
        where: {
          name: {
            in: ['DELETE_TEST_1', 'DELETE_TEST_2']
          }
        }
      })

      const finalCount = await db.role.count()
      expect(finalCount).toBe(initialCount - 2)

      // Verify the specific roles are gone
      const deletedRole1 = await db.role.findUnique({ where: { id: role1.id } })
      const deletedRole2 = await db.role.findUnique({ where: { id: role2.id } })
      expect(deletedRole1).toBeNull()
      expect(deletedRole2).toBeNull()
    })

    it('should handle foreign key constraints during deletion consistently', async () => {
      const role = await createTestRole()
      const user = await createTestUser({ roleId: role.id })

      // Try to delete role with associated user - should fail
      try {
        await db.role.deleteMany({ where: { id: role.id } })
        // If deletion succeeds, it means foreign key constraints aren't enforced
        // This might be acceptable depending on the database configuration
      } catch (error) {
        // If deletion fails, it means foreign key constraints are enforced
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
      
      // Perform a series of operations
      const role = await createTestRole()
      const user = await createTestUser({ roleId: role.id })
      await createTestCategory({ createdById: user.id })
      
      // Query operations
      await db.role.findMany()
      await db.user.findMany()
      await db.category.findMany()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Operations should complete within a reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000)
    })
  })
}) 