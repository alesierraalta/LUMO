/**
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { disconnectDatabase, cleanupTestDatabase, setupTestDatabase, createTestRole, createTestUser, db } from '../setup/test-utilities'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => null),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(() => [])
  }))
}))

// Import the actual API route handlers
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { GET as meHandler } from '@/app/api/auth/me/route'
import { POST as registerHandler } from '@/app/api/auth/register/route'

describe('Authentication API Integration Tests', () => {
  let testRoleId: string
  let testUserId: string

  beforeAll(async () => {
    await setupTestDatabase()
    
    // Create a test role
    const role = await createTestRole({
      name: 'USER',
      description: 'Default user role'
    })
    testRoleId = role.id
  })

  afterAll(async () => {
    await cleanupTestDatabase()
    await disconnectDatabase()
  })

  beforeEach(async () => {
    // Clean up users before each test
    await db.user.deleteMany()
    
    // Create a test user for login tests
    const hashedPassword = await bcrypt.hash('testpassword123', 10)
    const user = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      roleId: testRoleId
    })
    testUserId = user.id
  })

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const response = await loginHandler(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('test@example.com')
      
      // Verify the token is valid
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'test-secret-key') as any
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.userId).toBe(testUserId)
    })

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const response = await loginHandler(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Invalid credentials')
    })

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'anypassword'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const response = await loginHandler(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Invalid credentials')
    })

    it('should validate required fields', async () => {
      const invalidRequests = [
        { email: '', password: 'password' }, // Empty email
        { email: 'test@example.com', password: '' }, // Empty password
        { password: 'password' }, // Missing email
        { email: 'test@example.com' } // Missing password
      ]

      for (const loginData of invalidRequests) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginData)
        })

        const response = await loginHandler(request)
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toBe('Email and password are required')
      }
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      // Generate a valid token
      const token = jwt.sign(
        { userId: testUserId, email: 'test@example.com', roleId: testRoleId },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      )

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `auth-token=${token}`
        }
      })

      // Mock the cookies function to return our token
      const { cookies } = require('next/headers')
      cookies.mockImplementation(() => ({
        get: (name: string) => name === 'auth-token' ? { value: token } : null,
        getAll: () => [{ name: 'auth-token', value: token }]
      }))

      const response = await meHandler(request)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('test@example.com')
    })

    it('should reject requests without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET'
      })

      // Mock the cookies function to return no token
      const { cookies } = require('next/headers')
      cookies.mockImplementation(() => ({
        get: () => null,
        getAll: () => []
      }))

      const response = await meHandler(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject requests with invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Cookie': 'auth-token=invalid-token'
        }
      })

      // Mock the cookies function to return invalid token
      const { cookies } = require('next/headers')
      cookies.mockImplementation(() => ({
        get: (name: string) => name === 'auth-token' ? { value: 'invalid-token' } : null,
        getAll: () => [{ name: 'auth-token', value: 'invalid-token' }]
      }))

      const response = await meHandler(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const response = await registerHandler(request)
      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data).toHaveProperty('message')
      expect(data.message).toBe('User registered successfully')
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('newuser@example.com')
      
      // Verify user was created in database
      const createdUser = await db.user.findUnique({
        where: { email: 'newuser@example.com' }
      })
      expect(createdUser).toBeTruthy()
      expect(createdUser?.email).toBe('newuser@example.com')
    })

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com', // Already exists
        password: 'password123',
        firstName: 'Duplicate',
        lastName: 'User'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const response = await registerHandler(request)
      expect(response.status).toBe(409) // Conflict status for duplicate
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('User already exists')
    })

    it('should validate required registration fields', async () => {
      const invalidRequests = [
        { email: '', password: 'password', firstName: 'Test', lastName: 'User' }, // Empty email
        { email: 'newtest@example.com', password: '', firstName: 'Test', lastName: 'User' }, // Empty password
        { password: 'password', firstName: 'Test', lastName: 'User' }, // Missing email
        { email: 'newtest@example.com', firstName: 'Test', lastName: 'User' }, // Missing password
      ]

      for (const userData of invalidRequests) {
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })

        const response = await registerHandler(request)
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toBe('Email and password are required')
      }
    })

    it('should accept optional name fields', async () => {
      const validRequests = [
        { email: 'test1@example.com', password: 'password', firstName: '', lastName: 'User' }, // Empty firstName
        { email: 'test2@example.com', password: 'password', firstName: 'Test', lastName: '' }, // Empty lastName
        { email: 'test3@example.com', password: 'password' }, // Missing firstName and lastName
        { email: 'test4@example.com', password: 'password', name: 'Test User' }, // Using name instead
      ]

      for (const userData of validRequests) {
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })

        const response = await registerHandler(request)
        expect(response.status).toBe(201)
        
        const data = await response.json()
        expect(data).toHaveProperty('message')
        expect(data.message).toBe('User registered successfully')
      }
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        'invalid@',
        '@invalid.com',
        'invalid.email',
        'invalid@email'
      ]

      for (const email of invalidEmails) {
        const userData = {
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        }

        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })

        const response = await registerHandler(request)
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data).toHaveProperty('error')
        // The actual error message might vary, but it should be a 400 error
      }
    })
  })

  describe('API Response Format', () => {
    it('should return proper error format for invalid login', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      })

      const response = await loginHandler(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })

    it('should return proper error format for missing auth', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET'
      })

      // Mock the cookies function to return no token
      const { cookies } = require('next/headers')
      cookies.mockImplementation(() => ({
        get: () => null,
        getAll: () => []
      }))

      const response = await meHandler(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })
  })
})