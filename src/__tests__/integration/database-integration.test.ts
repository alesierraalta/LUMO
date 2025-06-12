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
    it('should create and manage users correctly', async () => {
      const users = await db.user.findMany()
      expect(users).toBeDefined()
      expect(Array.isArray(users)).toBe(true)
    })

    it('should create new users', async () => {
      const newUser = {
        id: `test-user-${Date.now()}`,
        email: `testuser${Date.now()}@test.lumo.dev`,
        name: 'Test Integration User',
        password: 'testpassword123',
        roleId: 'test-role-id',
        isActive: true
      }

      const created = await db.user.create(newUser)
      expect(created).toBeDefined()
      expect(created.email).toBe(newUser.email)
      expect(created.name).toBe(newUser.name)
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

  describe('Basic Database Operations', () => {
    it('should handle database connections', async () => {
      // Test that basic operations work without errors
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