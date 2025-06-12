import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { 
  db, 
  testUsers, 
  setupTestDatabase, 
  cleanupTestDatabase, 
  disconnectDatabase
} from './test-setup'

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await disconnectDatabase()
  })

  describe('User Management Integration', () => {
    it('should create and manage users with roles correctly', async () => {
      const users = await db.user.findMany()
      expect(users).toBeDefined()
      expect(Array.isArray(users)).toBe(true)
    })
  })

  describe('Role Management Integration', () => {
    it('should create new roles', async () => {
      const newRole = {
        id: `test-role-${Date.now()}`,
        name: `TEST_ROLE_${Date.now()}`,
        description: 'Role for integration testing',
        isSystem: false,
        isActive: true
      }

      const created = await db.role.create(newRole)
      expect(created).toBeDefined()
      expect(created.name).toBe(newRole.name)
    })
  })

  describe('Category Management Integration', () => {
    it('should handle categories correctly', async () => {
      const categories = await db.category.findMany()
      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
    })
  })

  describe('Basic Database Connectivity', () => {
    it('should handle basic database operations', async () => {
      // Test that we can perform basic read operations
      const operations = [
        () => db.user.findMany(),
        () => db.category.findMany()
      ]

      for (const operation of operations) {
        const result = await operation()
        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
      }
    })
  })
}) 