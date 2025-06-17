/**
 * Supabase JWT Authentication System
 * - Uses native Supabase JWT tokens
 * - Works with both production and development databases
 * - Server and client compatible
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_KEY environment variables.')
}

// Server-side Supabase client with cookie support
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value
        },
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
        },
        removeItem: (key: string) => {
          cookieStore.delete(key)
        },
      },
    },
  })
}

// Client-side Supabase client
export const createClientSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
    },
  })
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

// Server-side authentication functions
export const getServerUser = async (): Promise<User | null> => {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('❌ Supabase Auth: No user found')
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
      console.log('❌ Supabase Auth: User profile not found')
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
    console.error('❌ Supabase Auth Error:', error)
    return null
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
}

// Logout function
export const signOut = async () => {
  const supabase = createClientSupabaseClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('❌ Logout error:', error)
    return false
  }
  
  return true
}

// Register function
export const signUpWithEmail = async (email: string, password: string, name: string) => {
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
}

// Utility functions
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'ADMIN'
}

export const isManager = (user: User | null): boolean => {
  return user?.role === 'MANAGER' || user?.role === 'ADMIN'
}

// Get JWT token (for API calls)
export const getSupabaseToken = async (): Promise<string | null> => {
  const supabase = createClientSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  return session?.access_token || null
} 