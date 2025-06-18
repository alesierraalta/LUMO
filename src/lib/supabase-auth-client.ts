/**
 * Supabase Client-Side Authentication
 * - No server imports (next/headers)
 * - Browser and client components only
 * - React Context compatible
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase client configuration. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
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