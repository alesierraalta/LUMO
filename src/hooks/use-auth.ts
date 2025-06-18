/**
 * Authentication Hook
 * Re-exports the useAuth hook from AuthContext for backward compatibility
 */

export { useAuth } from '@/contexts/auth-context'

// Also export the AuthProvider for convenience
export { AuthProvider } from '@/contexts/auth-context' 