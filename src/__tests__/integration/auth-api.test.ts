import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { NextRequest } from 'next/server'
import { disconnectDatabase, cleanupTestDatabase } from './test-setup'

// Import the actual API route handlers
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { GET as meHandler } from '@/app/api/auth/me/route'
import { POST as registerHandler } from '@/app/api/auth/register/route'

describe('Authentication API Integration Tests', () => {
  afterAll(async () => {
    await cleanupTestDatabase()
    await disconnectDatabase()
  })

  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
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
      }
    })
  })

  describe('GET /api/auth/me', () => {
    it('should reject requests without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET'
      })

      const response = await meHandler(request)
      expect(response.status).toBe(401)
    })

    it('should reject requests with invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Cookie': 'auth-token=invalid-token'
        }
      })

      const response = await meHandler(request)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/auth/register', () => {
    it('should validate required registration fields', async () => {
      const invalidRequests = [
        { email: '', password: 'password', name: 'Test' }, // Empty email
        { email: 'test@example.com', password: '', name: 'Test' }, // Empty password
        { email: 'test@example.com', password: 'password', name: '' }, // Empty name
        { password: 'password', name: 'Test' }, // Missing email
        { email: 'test@example.com', name: 'Test' }, // Missing password
        { email: 'test@example.com', password: 'password' } // Missing name
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
          name: 'Test User'
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
    })

    it('should return proper error format for missing auth', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET'
      })

      const response = await meHandler(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })
}) 