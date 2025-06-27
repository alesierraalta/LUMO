
// FIXED BUILD DETECTION - Only trigger during actual build, not runtime
const isBuild = (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (typeof process !== 'undefined' && process.argv && process.argv.some(arg => arg.includes('next build')))
);

// RUNTIME SAFETY: Check for missing configuration but don't treat as build mode
const hasMissingConfig = (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
);

if (isBuild) {
  console.log('🏗️ BUILD MODE: Bypassing Supabase initialization');
} else if (hasMissingConfig) {
  console.log('⚠️ RUNTIME MODE: Missing Supabase configuration - using fallback client');
}

/**
 * Supabase Client-Side Authentication
 * - No server imports (next/headers)
 * - Browser and client components only
 * - React Context compatible
 * - Conditional realtime imports
 */

import { getCustomSupabaseClient } from './supabase-custom-client'

// Supabase configuration - RESILIENT: Handle missing env vars during build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only warn in runtime, not during build
if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('⚠️ Missing Supabase client configuration. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

// User interface matching your current structure
export interface User {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Client-side Supabase client using our custom implementation
export const createClientSupabaseClient = () => {
  try {
    return getCustomSupabaseClient()
  } catch (error) {
    console.warn('⚠️ Custom Supabase client creation failed, using fallback:', error)
    
    // Return a minimal client for fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Client unavailable' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Client unavailable' } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Client unavailable' } })
          })
        })
      })
    } as any
  }
}

// Client-side authentication functions
export const getClientUser = async (): Promise<User | null> => {
  try {
    const supabase = createClientSupabaseClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Get user profile from your users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role_id,
        is_active,
        created_at,
        updated_at,
        roles!inner (
          name
        )
      `)
      .eq('email', user.email)
      .single()
    
    if (profileError || !profile) {
      return null
    }
    
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: (profile.roles as any)?.name || 'USER',
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }
  } catch (error) {
    console.error('❌ Client Auth Error:', error)
    return null
  }
}

// Login function
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const supabase = createClientSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Get user profile
    const user = await getClientUser()
    
    return { success: true, user, data }
  } catch (error) {
    console.error('❌ Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

// Logout function
export const signOut = async () => {
  try {
    const supabase = createClientSupabaseClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Logout error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Logout error:', error)
    return false
  }
}

// Register function
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const supabase = createClientSupabaseClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('❌ Register error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

// Permission helpers for client-side
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
}

export const isManager = (user: User | null): boolean => {
  return user?.role === 'MANAGER' || isAdmin(user)
}

// Get Supabase token for client-side API calls
export const getSupabaseToken = async (): Promise<string | null> => {
  try {
    const supabase = createClientSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('❌ Error getting Supabase token:', error)
    return null
  }
} 