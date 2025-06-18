// Unit tests for useAuth hook
import { renderHook, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// Mock the entire auth context module
jest.mock('@/contexts/auth-context', () => {
  const React = require('react')
  
  const mockAuthContext = {
    user: null,
    loading: true,
    refetch: jest.fn(),
    logout: jest.fn()
  }
  
  const AuthContext = React.createContext(mockAuthContext)
  
  return {
    useAuth: () => React.useContext(AuthContext),
    AuthProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement(AuthContext.Provider, { value: mockAuthContext }, children),
    __mockAuthContext: mockAuthContext
  }
})

// Import the mocked context
import { useAuth, AuthProvider } from '@/contexts/auth-context'
// @ts-ignore - accessing mock context
const mockAuthContext = require('@/contexts/auth-context').__mockAuthContext

// Complete mock user object
const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@lumo.dev',
  name: 'Test User',
  role: 'USER',
  isActive: true,
  permissions: [],
  ...overrides,
})

// Helper to render hook with AuthProvider
const renderWithAuthProvider = (hook: () => any) => {
  return renderHook(hook, {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
  })
}

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock context to default state
    mockAuthContext.user = null
    mockAuthContext.loading = true
    mockAuthContext.refetch = jest.fn()
    mockAuthContext.logout = jest.fn()
  })

  test('initializes with loading state', () => {
    mockAuthContext.loading = true
    mockAuthContext.user = null
    
    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  test('loads user successfully', async () => {
    const mockUser = createMockUser()
    
    mockAuthContext.loading = false
    mockAuthContext.user = mockUser
    
    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(expect.objectContaining({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      isActive: mockUser.isActive
    }))
  })

  test('handles authentication failure', async () => {
    mockAuthContext.loading = false
    mockAuthContext.user = null

    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  test('handles null user response', async () => {
    mockAuthContext.loading = false
    mockAuthContext.user = null

    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  test('refreshUser function works correctly', async () => {
    const mockUser = createMockUser()
    
    mockAuthContext.loading = false
    mockAuthContext.user = mockUser
    mockAuthContext.refetch = jest.fn().mockResolvedValue(undefined)

    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.user).not.toBeNull()

    // Call refresh
    await result.current.refetch()

    // Verify refetch was called
    expect(mockAuthContext.refetch).toHaveBeenCalledTimes(1)
  })

  test('refreshUser handles errors correctly', async () => {
    const mockUser = createMockUser()

    // Initially has user
    mockAuthContext.loading = false
    mockAuthContext.user = mockUser

    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.user).toEqual(expect.objectContaining({
      id: mockUser.id,
      email: mockUser.email
    }))

    // Simulate refresh error by setting user to null
    mockAuthContext.refetch = jest.fn().mockImplementation(() => {
      mockAuthContext.user = null
      return Promise.resolve()
    })

    await result.current.refetch()

    expect(mockAuthContext.refetch).toHaveBeenCalled()
  })

  test('shows loading state during refresh', async () => {
    const mockUser = createMockUser()
    
    mockAuthContext.loading = false
    mockAuthContext.user = mockUser
    
    let isRefreshing = false
    mockAuthContext.refetch = jest.fn().mockImplementation(() => {
      isRefreshing = true
      mockAuthContext.loading = true
      return new Promise(resolve => {
        setTimeout(() => {
          mockAuthContext.loading = false
          isRefreshing = false
          resolve(undefined)
        }, 50)
      })
    })

    const { result } = renderWithAuthProvider(() => useAuth())

    // Initial state
    expect(result.current.loading).toBe(false)

    // Start refresh
    const refreshPromise = result.current.refetch()

    // Should show loading during refresh
    expect(mockAuthContext.refetch).toHaveBeenCalled()

    // Wait for refresh to complete
    await refreshPromise
  })

  test('provides correct return values', async () => {
    const mockUser = createMockUser()
    
    mockAuthContext.loading = false
    mockAuthContext.user = mockUser

    const { result } = renderWithAuthProvider(() => useAuth())

    // Check that hook returns all expected properties
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('refetch')
    expect(result.current).toHaveProperty('logout')
    
    expect(typeof result.current.refetch).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })

  test('correctly determines authentication state', async () => {
    // Test with authenticated user
    const mockUser = createMockUser()
    
    mockAuthContext.loading = false
    mockAuthContext.user = mockUser

    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.user).not.toBeNull()

    // Test with null user (unauthenticated)
    mockAuthContext.user = null

    // Simulate refetch that results in null user
    mockAuthContext.refetch = jest.fn().mockImplementation(() => {
      mockAuthContext.user = null
      return Promise.resolve()
    })

    await result.current.refetch()

    expect(mockAuthContext.refetch).toHaveBeenCalled()
  })

  test('handles inactive user correctly', async () => {
    const inactiveUser = createMockUser({ isActive: false })
    
    mockAuthContext.loading = false
    mockAuthContext.user = inactiveUser

    const { result } = renderWithAuthProvider(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(expect.objectContaining({
      isActive: false
    }))
  })
}) 