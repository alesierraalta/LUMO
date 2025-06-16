import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { 
  db, 
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

  beforeEach(async () => {
    // Clean up any test data before each test to ensure isolation
    await cleanupTestDatabase()
  })

  describe('User Management Integration', () => {
    it('should create and manage users correctly', async () => {
      const users = await db.user.findMany()
      expect(users).toBeDefined()
      expect(Array.isArray(users)).toBe(true)
    })

    it('should create new users', async () => {
      // First create a role for the user
      const testRole = {
        id: `test-role-${Date.now()}`,
        name: `TEST_ROLE_${Date.now()}`,
        description: 'Role for user creation test',
        isSystem: false,
        isActive: true
      }
      
      const createdRole = await db.role.create(testRole)
      expect(createdRole).toBeDefined()
      
      // Now create user with the created role
      const newUser = {
        id: `test-user-${Date.now()}`,
        email: `testuser${Date.now()}@test.lumo.dev`,
        name: 'Test Integration User',
        password: 'testpassword123',
        roleId: createdRole.id,
        isActive: true
      }

      const created = await db.user.create(newUser)
      expect(created).toBeDefined()
      expect(created.email).toBe(newUser.email)
      expect(created.name).toBe(newUser.name)
      expect(created.roleId).toBe(createdRole.id)
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