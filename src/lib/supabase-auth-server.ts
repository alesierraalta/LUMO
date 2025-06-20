/**
 * Supabase Server-Side Authentication
 * - Uses next/headers for cookie management
 * - Server Components and API routes only
 * - Middleware compatible
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Supabase configuration with resilient fallbacks for build-time
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Only throw error at runtime, not during build
if (typeof window !== 'undefined' && (!supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder'))) {
  console.log('✅ Supabase configuration loaded successfully')
} else if (process.env.NODE_ENV === 'production' && supabaseUrl.includes('placeholder')) {
  console.warn('⚠️ Using placeholder Supabase configuration - ensure environment variables are set')
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

// Permission helpers for server-side
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
}

export const isManager = (user: User | null): boolean => {
  return user?.role === 'MANAGER' || isAdmin(user)
}

// Get Supabase token for server-side API calls
export const getSupabaseToken = async (): Promise<string | null> => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('❌ Error getting Supabase token:', error)
    return null
  }
}

// Cookie management functions for API routes
export const setAuthCookie = async (token: string) => {
  const cookieStore = await cookies()
  cookieStore.set('supabase-auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export const clearAuthCookies = async () => {
  const cookieStore = await cookies()
  cookieStore.delete('supabase-auth-token')
  cookieStore.delete('sb-access-token')
  cookieStore.delete('supabase.auth.token')
} 