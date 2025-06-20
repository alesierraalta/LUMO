/**
 * Supabase Server-Only Client
 * - No realtime dependencies
 * - Server-side rendering compatible
 * - No browser-specific imports
 */

import { getCustomSupabaseClient } from './supabase-custom-client'

// Server-side Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Missing Supabase server configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
}

// Create server-only Supabase client using our custom implementation
export const createServerSupabaseClient = () => {
  try {
    return getCustomSupabaseClient()
  } catch (error) {
    console.warn('⚠️ Custom Supabase server client creation failed:', error)
    
    // Return a minimal client for fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Client unavailable' } }),
        signOut: () => Promise.resolve({ error: null }),
        setSession: () => {},
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

// Server-side user interface
export interface ServerUser {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Server-side user fetching (for SSR)
export const getServerUser = async (accessToken?: string): Promise<ServerUser | null> => {
  try {
    const supabase = createServerSupabaseClient()
    
    if (accessToken) {
      // Set the auth token for the request
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      } as any)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Get user profile from database
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
    console.error('❌ Server Auth Error:', error)
    return null
  }
}

// Export default server client
export default createServerSupabaseClient 