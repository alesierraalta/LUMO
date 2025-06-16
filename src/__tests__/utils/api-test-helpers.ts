// Mock Request and Headers for Node.js test environment
if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    constructor(public url: string, public init: RequestInit = {}) {}
  } as unknown as typeof Request
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class MockHeaders {
    private headers: Map<string, string> = new Map()
    
    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value))
        } else if (init instanceof Headers) {
          // Handle Headers instance
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key, value))
        }
      }
    }
    
    set(key: string, value: string) {
      this.headers.set(key.toLowerCase(), value)
    }
    
    get(key: string) {
      return this.headers.get(key.toLowerCase()) || null
    }
    
    has(key: string) {
      return this.headers.has(key.toLowerCase())
    }
    
    delete(key: string) {
      this.headers.delete(key.toLowerCase())
    }
    
    forEach(callback: (value: string, key: string) => void) {
      this.headers.forEach(callback)
    }
  } as unknown as typeof Headers
}

// Mock URL for Node.js test environment if needed
if (typeof global.URL === 'undefined') {
  const MockURLSearchParams = class {
    private params: Map<string, string> = new Map()
    
    set(key: string, value: string) {
      this.params.set(key, value)
    }
    
    get(key: string) {
      return this.params.get(key) || null
    }
    
    has(key: string) {
      return this.params.has(key)
    }
    
    delete(key: string) {
      this.params.delete(key)
    }
    
    forEach(callback: (value: string, key: string) => void) {
      this.params.forEach(callback)
    }
  }
  
  global.URLSearchParams = MockURLSearchParams as unknown as typeof URLSearchParams
  
  global.URL = class MockURL {
    public searchParams: URLSearchParams
    
    constructor(public href: string, _base?: string) {
      this.searchParams = new MockURLSearchParams() as unknown as URLSearchParams
    }
    
    toString() {
      return this.href
    }
  } as unknown as typeof URL
}

/**
 * API Test Helpers for comprehensive API route testing
 */

export interface ApiTestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
  searchParams?: Record<string, string>
  cookies?: Record<string, string>
}

export interface ApiTestResponse {
  status: number
  data: unknown
  headers: Headers
  ok: boolean
}

/**
 * Create a mock NextRequest for testing API routes
 */
export const createMockRequest = (url: string, options: ApiTestOptions = {}): Record<string, unknown> => {
  // This function is designed to work in test environment
  // Return a mock object that satisfies the NextRequest interface
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    searchParams = {},
    cookies = {}
  } = options

  // Create a mock request object
  const mockRequest = {
    url: url,
    method,
    headers: new Map(Object.entries({
      'Content-Type': 'application/json',
      ...customHeaders
    })),
    body: body && method !== 'GET' ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
    searchParams: new Map(Object.entries(searchParams)),
    cookies: new Map(Object.entries(cookies)),
    json: async () => body,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body)
  }

  return mockRequest
}

/**
 * Execute an API route handler and return formatted response
 */
export const executeApiRoute = async (
  handler: Function,
  request: any,
  params?: Record<string, any>
): Promise<ApiTestResponse> => {
  try {
    const response = await handler(request, { params })
    
    let data: any
    try {
      data = await response.json()
    } catch {
      data = await response.text()
    }

    return {
      status: response.status,
      data,
      headers: response.headers,
      ok: response.ok
    }
  } catch (error) {
    throw new Error(`API route execution failed: ${error}`)
  }
}

/**
 * Create authenticated request with JWT token
 */
export const createAuthenticatedRequest = (
  url: string,
  token: string,
  options: ApiTestOptions = {}
): any => {
  return createMockRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  })
}

/**
 * Test data factories for common API testing scenarios
 */
export const testDataFactories = {
  user: (overrides: Partial<any> = {}) => ({
    id: `test-user-${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    password: 'testpassword123',
    isActive: true,
    ...overrides
  }),

  role: (overrides: Partial<any> = {}) => ({
    id: `test-role-${Date.now()}`,
    name: `TEST_ROLE_${Date.now()}`,
    description: 'Test Role',
    isSystem: false,
    isActive: true,
    ...overrides
  }),

  category: (overrides: Partial<any> = {}) => ({
    id: `test-category-${Date.now()}`,
    name: `Test Category ${Date.now()}`,
    description: 'Test Category Description',
    ...overrides
  }),

  inventoryItem: (overrides: Partial<any> = {}) => ({
    id: `test-item-${Date.now()}`,
    name: `Test Item ${Date.now()}`,
    description: 'Test inventory item',
    sku: `SKU-${Date.now()}`,
    currentStock: 100,
    minStockLevel: 10,
    cost: 50.00,
    price: 75.00,
    ...overrides
  }),

  location: (overrides: Partial<any> = {}) => ({
    id: `test-location-${Date.now()}`,
    name: `Test Location ${Date.now()}`,
    description: 'Test location',
    isActive: true,
    ...overrides
  })
}

/**
 * API response assertion helpers
 */
export const apiAssertions = {
  expectSuccess: (response: ApiTestResponse, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus)
    expect(response.ok).toBe(true)
  },

  expectError: (response: ApiTestResponse, expectedStatus = 400) => {
    expect(response.status).toBe(expectedStatus)
    expect(response.ok).toBe(false)
    expect(response.data).toHaveProperty('error')
  },

  expectValidationError: (response: ApiTestResponse) => {
    expect(response.status).toBe(400)
    expect(response.data).toHaveProperty('error')
    expect(response.data.error).toContain('validation')
  },

  expectUnauthorized: (response: ApiTestResponse) => {
    expect(response.status).toBe(401)
    expect(response.data).toHaveProperty('error')
  },

  expectForbidden: (response: ApiTestResponse) => {
    expect(response.status).toBe(403)
    expect(response.data).toHaveProperty('error')
  },

  expectNotFound: (response: ApiTestResponse) => {
    expect(response.status).toBe(404)
    expect(response.data).toHaveProperty('error')
  }
}

/**
 * Database test helpers
 */
export const dbTestHelpers = {
  /**
   * Clean up test data by pattern
   */
  cleanupByPattern: async (db: any, pattern: string) => {
    const tables = ['inventoryItem', 'stockMovement', 'sale', 'saleItem', 'user', 'category', 'role', 'location']
    
    for (const table of tables) {
      if (db[table]?.deleteMany) {
        await db[table].deleteMany({
          where: {
            OR: [
              { id: { contains: pattern } },
              { name: { contains: pattern } },
              { email: { contains: pattern } }
            ]
          }
        })
      }
    }
  },

  /**
   * Create test data with relationships
   */
  createTestDataSet: async (db: any) => {
    // Create role first
    const role = await db.role.create({
      data: testDataFactories.role()
    })

    // Create user with role
    const user = await db.user.create({
      data: testDataFactories.user({ roleId: role.id })
    })

    // Create category with user
    const category = await db.category.create({
      data: testDataFactories.category({ createdById: user.id })
    })

    // Create location
    const location = await db.location.create({
      data: testDataFactories.location()
    })

    // Create inventory item
    const inventoryItem = await db.inventoryItem.create({
      data: testDataFactories.inventoryItem({
        categoryId: category.id,
        locationId: location.id,
        createdById: user.id
      })
    })

    return {
      role,
      user,
      category,
      location,
      inventoryItem
    }
  }
}

/**
 * Performance testing utilities
 */
export const performanceHelpers = {
  /**
   * Measure API response time
   */
  measureResponseTime: async (apiCall: () => Promise<any>): Promise<{ result: any, duration: number }> => {
    const start = performance.now()
    const result = await apiCall()
    const end = performance.now()
    
    return {
      result,
      duration: end - start
    }
  },

  /**
   * Run performance benchmark
   */
  benchmark: async (
    name: string,
    apiCall: () => Promise<any>,
    iterations = 10
  ): Promise<{ name: string, avgDuration: number, minDuration: number, maxDuration: number }> => {
    const durations: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const { duration } = await performanceHelpers.measureResponseTime(apiCall)
      durations.push(duration)
    }
    
    return {
      name,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    }
  },

  /**
   * Assert performance thresholds
   */
  expectPerformance: (duration: number, maxDuration: number) => {
    expect(duration).toBeLessThan(maxDuration)
  }
}

/**
 * Mock factories for external services
 */
export const mockFactories = {
  /**
   * Mock fetch responses
   */
  mockFetchResponse: (data: any, status = 200, ok = true) => {
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data))
    } as Response)
  },

  /**
   * Mock database responses
   */
  mockDbResponse: (data: any) => {
    return {
      create: jest.fn().mockResolvedValue(data),
      findMany: jest.fn().mockResolvedValue([data]),
      findUnique: jest.fn().mockResolvedValue(data),
      update: jest.fn().mockResolvedValue(data),
      delete: jest.fn().mockResolvedValue(data),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 })
    }
  }
}

/**
 * Test environment helpers
 */
export const testEnvHelpers = {
  /**
   * Set up test environment variables
   */
  setupTestEnv: (envVars: Record<string, string>) => {
    const originalEnv = { ...process.env }
    
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value
    })
    
    return () => {
      // Restore original environment
      Object.keys(envVars).forEach(key => {
        if (originalEnv[key] !== undefined) {
          process.env[key] = originalEnv[key]
        } else {
          delete process.env[key]
        }
      })
    }
  },

  /**
   * Mock console methods for testing
   */
  mockConsole: () => {
    const originalConsole = { ...console }
    
    console.log = jest.fn()
    console.error = jest.fn()
    console.warn = jest.fn()
    console.info = jest.fn()
    
    return () => {
      Object.assign(console, originalConsole)
    }
  }
}

// Test to make Jest recognize this as a test file
describe('API Test Helpers', () => {
  it('should export test utilities', () => {
    expect(testDataFactories).toBeDefined()
    expect(apiAssertions).toBeDefined()
    expect(dbTestHelpers).toBeDefined()
    expect(performanceHelpers).toBeDefined()
    expect(mockFactories).toBeDefined()
    expect(testEnvHelpers).toBeDefined()
  })
})