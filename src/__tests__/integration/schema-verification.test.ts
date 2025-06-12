/**
 * @jest-environment node
 */

import { setupTestDatabase, cleanupTestDatabase, disconnectDatabase, createTestRole } from './test-setup'

describe('Schema Verification Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await disconnectDatabase()
  })

  test('should create role with correct schema', async () => {
    const role = await createTestRole({
      id: 'verify-role-id',
      name: 'VERIFY_ROLE',
      description: 'Verification Role'
    })

    expect(role).toBeDefined()
    expect(role.id).toBe('verify-role-id')
    expect(role.name).toBe('VERIFY_ROLE')
    expect(role.description).toBe('Verification Role')
    expect(role.isActive).toBe(true)
    expect(role.isSystem).toBe(false)
  })

  test('should verify basic schema structure', async () => {
    // Test that we can create a role without foreign key dependencies
    const basicRole = await createTestRole({
      id: `basic-role-${Date.now()}`,
      name: `BASIC_ROLE_${Date.now()}`,
      description: 'Basic role for schema verification'
    })

    expect(basicRole).toBeDefined()
    expect(basicRole.name).toContain('BASIC_ROLE_')
    expect(basicRole.description).toBe('Basic role for schema verification')
    expect(typeof basicRole.isActive).toBe('boolean')
    expect(typeof basicRole.isSystem).toBe('boolean')
  })
}) 