/**
 * Integration Test Template for LUMO
 * 
 * This template follows LUMO's integration testing patterns:
 * - Database operations testing
 * - API endpoint testing
 * - Service layer testing
 * - Dual database support (Prisma/Supabase)
 */

import { db, deleteTestUser } from '../test-setup';
import request from 'supertest';
import { NextRequest } from 'next/server';

// Import the API handler or service being tested
import { POST as createHandler } from '@/app/api/endpoint/route';
import { ServiceClass } from '@/services/service-class';

describe('API Endpoint Integration Tests', () => {
  // Test data
  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER'
  };

  const testRole = {
    name: 'TEST_ROLE',
    isSystem: false,
    isActive: true
  };

  beforeEach(async () => {
    // Clean up test data before each test
    await deleteTestUser(testUser.email);
    await db.role.deleteMany({
      where: { name: testRole.name }
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await deleteTestUser(testUser.email);
    await db.role.deleteMany({
      where: { name: testRole.name }
    });
  });

  describe('POST /api/endpoint', () => {
    it('creates new resource with valid data', async () => {
      // Arrange
      const requestData = {
        name: 'Test Resource',
        description: 'Test Description'
      };

      const request = new NextRequest('http://localhost:3000/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await createHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe(requestData.name);
      expect(responseData.data.id).toBeDefined();
    });

    it('returns validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        // Missing required fields
        description: 'Test Description'
      };

      const request = new NextRequest('http://localhost:3000/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      // Act
      const response = await createHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('validation');
    });

    it('handles database errors gracefully', async () => {
      // Arrange
      const requestData = {
        name: 'Test Resource',
        description: 'Test Description'
      };

      // Mock database error
      const originalCreate = db.resource.create;
      db.resource.create = jest.fn().mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      // Act
      const response = await createHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Internal server error');

      // Restore original function
      db.resource.create = originalCreate;
    });
  });

  describe('GET /api/endpoint', () => {
    it('returns list of resources', async () => {
      // Arrange
      const createdResource = await db.resource.create({
        data: {
          name: 'Test Resource',
          description: 'Test Description'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/endpoint', {
        method: 'GET'
      });

      // Act
      const response = await getHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].id).toBe(createdResource.id);

      // Cleanup
      await db.resource.delete({ where: { id: createdResource.id } });
    });

    it('returns empty array when no resources exist', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/endpoint', {
        method: 'GET'
      });

      // Act
      const response = await getHandler(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(0);
    });
  });
});

describe('Service Layer Integration Tests', () => {
  let service;

  beforeEach(async () => {
    // Initialize service
    service = new ServiceClass();
    
    // Clean up test data
    await deleteTestUser(testUser.email);
  });

  afterEach(async () => {
    // Clean up test data
    await deleteTestUser(testUser.email);
  });

  describe('createUser', () => {
    it('creates user with valid data', async () => {
      // Arrange
      const userData = {
        email: testUser.email,
        name: testUser.name,
        role: testUser.role
      };

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.email).toBe(userData.email);
      expect(result.data.id).toBeDefined();

      // Verify in database
      const dbUser = await db.user.findUnique({
        where: { email: userData.email }
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser.name).toBe(userData.name);
    });

    it('prevents duplicate email creation', async () => {
      // Arrange
      await db.user.create({
        data: testUser
      });

      // Act
      const result = await service.createUser(testUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('updateUser', () => {
    it('updates existing user', async () => {
      // Arrange
      const createdUser = await db.user.create({
        data: testUser
      });

      const updateData = {
        name: 'Updated Name'
      };

      // Act
      const result = await service.updateUser(createdUser.id, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);

      // Verify in database
      const dbUser = await db.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(dbUser.name).toBe(updateData.name);
    });

    it('returns error for non-existent user', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const updateData = { name: 'Updated Name' };

      // Act
      const result = await service.updateUser(nonExistentId, updateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});

describe('Database Operations', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  describe('User CRUD operations', () => {
    it('performs complete CRUD cycle', async () => {
      // Create
      const createdUser = await db.user.create({
        data: testUser
      });
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(testUser.email);

      // Read
      const foundUser = await db.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe(testUser.email);

      // Update
      const updatedUser = await db.user.update({
        where: { id: createdUser.id },
        data: { name: 'Updated Name' }
      });
      expect(updatedUser.name).toBe('Updated Name');

      // Delete
      await db.user.delete({
        where: { id: createdUser.id }
      });

      const deletedUser = await db.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('Relationship operations', () => {
    it('creates user with role relationship', async () => {
      // Arrange
      const createdRole = await db.role.create({
        data: testRole
      });

      // Act
      const createdUser = await db.user.create({
        data: {
          ...testUser,
          roleId: createdRole.id
        },
        include: {
          role: true
        }
      });

      // Assert
      expect(createdUser.role).toBeTruthy();
      expect(createdUser.role.name).toBe(testRole.name);

      // Cleanup
      await db.user.delete({ where: { id: createdUser.id } });
      await db.role.delete({ where: { id: createdRole.id } });
    });
  });

  describe('Transaction operations', () => {
    it('handles transaction rollback on error', async () => {
      // Arrange
      const userData1 = { ...testUser, email: 'user1@test.com' };
      const userData2 = { ...testUser, email: 'user2@test.com' };

      // Act & Assert
      await expect(
        db.$transaction(async (tx) => {
          await tx.user.create({ data: userData1 });
          // This should cause the transaction to rollback
          await tx.user.create({ data: userData2 });
          throw new Error('Simulated error');
        })
      ).rejects.toThrow('Simulated error');

      // Verify rollback - no users should exist
      const users = await db.user.findMany({
        where: {
          email: { in: [userData1.email, userData2.email] }
        }
      });
      expect(users).toHaveLength(0);
    });
  });
});

/**
 * Integration Test Best Practices:
 * 
 * 1. Test Real Interactions:
 *    - Database operations
 *    - API endpoints
 *    - Service layer methods
 *    - External service integrations
 * 
 * 2. Data Management:
 *    - Create test data within tests
 *    - Clean up after each test
 *    - Use unique identifiers
 *    - Avoid shared test data
 * 
 * 3. Error Scenarios:
 *    - Test validation errors
 *    - Test database constraints
 *    - Test network failures
 *    - Test timeout scenarios
 * 
 * 4. Performance Considerations:
 *    - Keep tests focused and fast
 *    - Use transactions when possible
 *    - Minimize database operations
 *    - Parallel test execution safe
 * 
 * 5. Environment Handling:
 *    - Support both Prisma and Supabase
 *    - Use environment-specific configurations
 *    - Handle connection failures gracefully
 */ 