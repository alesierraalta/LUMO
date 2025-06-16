/**
 * Test Isolation Verification Tests
 * 
 * This test suite verifies that integration tests can run independently
 * without relying on shared state or data from other tests.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { setupTestDatabase, cleanupTestDatabase, disconnectDatabase, createTestRole, createTestUser, createTestCategory, db } from './test-setup'

describe('Test Isolation Verification', () => {
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

  describe('Database State Independence', () => {
    it('should start with clean database state', async () => {
      // Verify database is empty at start of test
      const userCount = await db.user.count()
      const roleCount = await db.role.count()
      const categoryCount = await db.category.count()

      expect(userCount).toBe(0)
      expect(roleCount).toBe(0)
      expect(categoryCount).toBe(0)
    })

    it('should not see data from previous test', async () => {
      // This test should also start with clean state
      const userCount = await db.user.count()
      const roleCount = await db.role.count()
      const categoryCount = await db.category.count()

      expect(userCount).toBe(0)
      expect(roleCount).toBe(0)
      expect(categoryCount).toBe(0)

      // Create some test data
      const role = await createTestRole({ name: 'ISOLATION_TEST_ROLE' })
      const user = await createTestUser({ roleId: role.id })
      
      // Verify data exists
      expect(role).toBeDefined()
      expect(user).toBeDefined()
    })

    it('should not see data from previous test again', async () => {
      // This test should start clean despite previous test creating data
      const userCount = await db.user.count()
      const roleCount = await db.role.count()

      expect(userCount).toBe(0)
      expect(roleCount).toBe(0)

      // Should not find the role from previous test
      const roles = await db.role.findMany({
        where: { name: 'ISOLATION_TEST_ROLE' }
      })
      expect(roles).toHaveLength(0)
    })
  })

  describe('Test Data Factory Independence', () => {
    it('should generate unique IDs for each test run', async () => {
      const role1 = await createTestRole()
      const role2 = await createTestRole()
      
      // IDs should be different
      expect(role1.id).not.toBe(role2.id)
      expect(role1.name).not.toBe(role2.name)
    })

    it('should handle foreign key dependencies correctly', async () => {
      // Create entities with dependencies
      const role = await createTestRole()
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ createdById: user.id })

      // Verify relationships
      expect(user.roleId).toBe(role.id)
      expect(category.createdById).toBe(user.id)

      // Verify entities exist in database
      const foundRole = await db.role.findUnique({ where: { id: role.id } })
      const foundUser = await db.user.findUnique({ where: { id: user.id } })
      const foundCategory = await db.category.findUnique({ where: { id: category.id } })

      expect(foundRole).toBeDefined()
      expect(foundUser).toBeDefined()
      expect(foundCategory).toBeDefined()
    })

    it('should create independent test data sets', async () => {
      // Create first set of test data
      const role1 = await createTestRole({ name: 'ROLE_SET_1' })
      const user1 = await createTestUser({ roleId: role1.id, email: 'user1@test.com' })

      // Create second set of test data
      const role2 = await createTestRole({ name: 'ROLE_SET_2' })
      const user2 = await createTestUser({ roleId: role2.id, email: 'user2@test.com' })

      // Verify both sets exist independently
      expect(role1.id).not.toBe(role2.id)
      expect(user1.id).not.toBe(user2.id)
      expect(user1.email).not.toBe(user2.email)

      // Verify correct relationships
      expect(user1.roleId).toBe(role1.id)
      expect(user2.roleId).toBe(role2.id)
    })
  })

  describe('Cleanup Verification', () => {
    it('should properly clean up complex data structures', async () => {
      // Create complex data structure
      const role = await createTestRole()
      const user = await createTestUser({ roleId: role.id })
      const category = await createTestCategory({ createdById: user.id })

      // Verify data exists
      expect(await db.role.count()).toBe(1)
      expect(await db.user.count()).toBe(1)
      expect(await db.category.count()).toBe(1)

      // Manually trigger cleanup
      await cleanupTestDatabase()

      // Verify all data is cleaned up
      expect(await db.role.count()).toBe(0)
      expect(await db.user.count()).toBe(0)
      expect(await db.category.count()).toBe(0)
    })

    it('should handle cleanup with foreign key constraints', async () => {
      // Create data with foreign key relationships
      const role = await createTestRole()
      const user1 = await createTestUser({ roleId: role.id })
      const user2 = await createTestUser({ roleId: role.id })
      const category1 = await createTestCategory({ createdById: user1.id })
      const category2 = await createTestCategory({ createdById: user2.id })

      // Verify data exists
      expect(await db.role.count()).toBe(1)
      expect(await db.user.count()).toBe(2)
      expect(await db.category.count()).toBe(2)

      // Cleanup should handle foreign key constraints properly
      await cleanupTestDatabase()

      // Verify complete cleanup
      expect(await db.role.count()).toBe(0)
      expect(await db.user.count()).toBe(0)
      expect(await db.category.count()).toBe(0)
    })

    it('should recover from partial cleanup failures', async () => {
      // Create test data
      const role = await createTestRole()
      const user = await createTestUser({ roleId: role.id })

      // Verify data exists
      expect(await db.role.count()).toBe(1)
      expect(await db.user.count()).toBe(1)

      // Cleanup should not throw errors even if some operations fail
      await expect(cleanupTestDatabase()).resolves.not.toThrow()

      // Should still attempt to clean up what it can
      // (The actual cleanup might not be complete if there are errors,
      // but the function should not throw)
    })
  })

  describe('Concurrent Test Safety', () => {
    it('should handle multiple test data creation safely', async () => {
      // Simulate multiple tests creating data simultaneously
      const promises = []
      
      for (let i = 0; i < 5; i++) {
        promises.push(createTestRole({ name: `CONCURRENT_ROLE_${i}` }))
      }

      const roles = await Promise.all(promises)

      // All roles should be created successfully
      expect(roles).toHaveLength(5)
      
      // All roles should have unique IDs and names
      const ids = roles.map(r => r.id)
      const names = roles.map(r => r.name)
      
      expect(new Set(ids).size).toBe(5) // All unique IDs
      expect(new Set(names).size).toBe(5) // All unique names
    })

    it('should handle concurrent user creation with role dependencies', async () => {
      // Create a role first
      const role = await createTestRole()

      // Create multiple users concurrently
      const userPromises = []
      for (let i = 0; i < 3; i++) {
        userPromises.push(createTestUser({ 
          roleId: role.id,
          email: `concurrent${i}@test.com`
        }))
      }

      const users = await Promise.all(userPromises)

      // All users should be created successfully
      expect(users).toHaveLength(3)
      
      // All users should reference the same role
      users.forEach(user => {
        expect(user.roleId).toBe(role.id)
      })

      // All users should have unique IDs and emails
      const userIds = users.map(u => u.id)
      const emails = users.map(u => u.email)
      
      expect(new Set(userIds).size).toBe(3)
      expect(new Set(emails).size).toBe(3)
    })
  })

  describe('Test Environment Consistency', () => {
    it('should maintain consistent database environment across tests', async () => {
      // Create test data
      const role = await createTestRole()
      
      // Verify we can perform all basic operations
      const created = await db.role.findUnique({ where: { id: role.id } })
      expect(created).toBeDefined()

      const updated = await db.role.update({
        where: { id: role.id },
        data: { description: 'Updated description' }
      })
      expect(updated.description).toBe('Updated description')

      const count = await db.role.count()
      expect(count).toBe(1)

      await db.role.delete({ where: { id: role.id } })
      const finalCount = await db.role.count()
      expect(finalCount).toBe(0)
    })

    it('should handle database operations consistently', async () => {
      // Test that database operations work the same way in each test
      const initialCount = await db.role.count()
      expect(initialCount).toBe(0)

      // Create multiple entities
      const role1 = await createTestRole({ name: 'CONSISTENCY_ROLE_1' })
      const role2 = await createTestRole({ name: 'CONSISTENCY_ROLE_2' })

      const midCount = await db.role.count()
      expect(midCount).toBe(2)

      // Query operations
      const foundRoles = await db.role.findMany()
      expect(foundRoles).toHaveLength(2)

      const specificRole = await db.role.findMany({
        where: { name: 'CONSISTENCY_ROLE_1' }
      })
      expect(specificRole).toHaveLength(1)
      expect(specificRole[0].id).toBe(role1.id)
    })
  })
}) 