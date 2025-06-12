// Unit tests for useAuth hook
import { renderHook, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useAuth } from '../use-auth'
import { getCurrentUser } from '@/lib/auth-client'

// Mock the auth client
jest.mock('@/lib/auth-client')

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

// Complete mock user object matching the User interface
const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@lumo.dev',
  name: 'Test User',
  role: 'USER',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
})

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('initializes with loading state', () => {
    mockGetCurrentUser.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('loads user successfully', async () => {
    const mockUser = createMockUser()
    mockGetCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1)
  })

  test('handles authentication failure', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Authentication failed'))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('handles null user response', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('refreshUser function works correctly', async () => {
    const mockUser = createMockUser()
    mockGetCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1)

    // Call refresh
    result.current.refreshUser()

    // Should call getCurrentUser again
    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalledTimes(2)
    })
  })

  test('refreshUser handles errors correctly', async () => {
    const mockUser = createMockUser()

    // First call succeeds
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)

    const { result } = renderHook(() => useAuth())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)

    // Second call (refresh) fails
    mockGetCurrentUser.mockRejectedValueOnce(new Error('Refresh failed'))

    result.current.refreshUser()

    // Wait for refresh to complete and state to be reset
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Give additional time for state update
    await waitFor(() => {
      expect(result.current.user).toBeNull()
    })
    
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('shows loading state during refresh', async () => {
    const mockUser = createMockUser()
    mockGetCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Mock a slow refresh
    mockGetCurrentUser.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
    )

    result.current.refreshUser()

    // Should show loading state immediately
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    // Wait for refresh to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  test('provides correct return values', async () => {
    const mockUser = createMockUser()
    mockGetCurrentUser.mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Check that hook returns all expected properties
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('refreshUser')
    
    expect(typeof result.current.refreshUser).toBe('function')
  })

  test('correctly determines authentication state', async () => {
    // Test with authenticated user
    const mockUser = createMockUser()
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)

    const { result, rerender } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    // Test with null user (unauthenticated)
    mockGetCurrentUser.mockResolvedValueOnce(null)
    result.current.refreshUser()

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  test('handles inactive user correctly', async () => {
    const inactiveUser = createMockUser({ isActive: false })
    mockGetCurrentUser.mockResolvedValue(inactiveUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(inactiveUser)
    expect(result.current.isAuthenticated).toBe(true) // Still authenticated, just inactive
  })
}) 