/**
 * @jest-environment node
 */

// Mock auth-server before importing anything else
jest.mock('@/lib/auth-server', () => ({
  getCurrentUser: jest.fn(async () => {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleId: 'test-role-id',
      isActive: true
    };
  }),
  getCurrentUserFromToken: jest.fn(async (token) => {
    console.log('🔧 MOCK getCurrentUserFromToken called with token:', token?.substring(0, 50) + '...');
    
    if (!token || token.length < 10) {
      console.log('🔧 MOCK getCurrentUserFromToken: Invalid or missing token');
      return null;
    }
    
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleId: 'test-role-id',
      isActive: true
    };
    console.log('🔧 MOCK getCurrentUserFromToken: Returning mock user:', mockUser);
    return mockUser;
  }),
  getTokenFromRequest: jest.fn((request) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('🔧 MOCK getTokenFromRequest: Found token in Authorization header:', token?.substring(0, 50) + '...');
      return token;
    }
    return null;
  }),
  hashPassword: jest.fn(async (password) => password),
  isAdmin: jest.fn((user) => user?.role === 'ADMIN'),
  isManager: jest.fn((user) => user?.role === 'MANAGER' || user?.role === 'ADMIN'),
  clearAuth: jest.fn(async () => {})
}));

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { POST as createUserHandler } from '@/app/api/users/route';
import { setupTestDatabase, cleanupTestDatabase, disconnectDatabase, generateTestJWT, createTestUser } from '../setup/test-utilities';
import { NextRequest } from 'next/server';

/**
 * Integration tests for User creation validation errors
 */
describe('User API Validation Error Cases', () => {
  beforeAll(async () => { await setupTestDatabase(); });
  afterAll(async () => { await cleanupTestDatabase(); await disconnectDatabase(); });
  beforeEach(async () => { await cleanupTestDatabase(); });

  describe('POST /api/users - missing fields', () => {
    it('returns 400 when missing required fields (authenticated)', async () => {
      const adminUser = await createTestUser({ email: 'admin@test.com' });
      const token = generateTestJWT({ userId: adminUser.id, email: adminUser.email });
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const invalidBodies = [
        {},
        { name: 'Test User' },
        { email: 'test@example.com' },
        { password: 'password123' },
        { roleId: 'role-id' },
      ];
      for (const bodyObj of invalidBodies) {
        const request = new NextRequest('http://localhost/api/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyObj),
        });
        const response = await createUserHandler(request);
        expect(response.status).toBe(400);
      }
    });
  });
});
