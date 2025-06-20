/**
 * Supabase Server-Only Client
 * - No realtime dependencies
 * - Server-side rendering compatible
 * - No browser-specific imports
 */

import { createClient } from '@supabase/supabase-js'

// Server-side Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Missing Supabase server configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
}

// Create server-only Supabase client without realtime
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // CRITICAL: Disable realtime to prevent module resolution errors
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },
    // Disable global settings that might cause SSR issues
    global: {
      headers: {},
    },
  })
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