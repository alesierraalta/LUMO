import { createBrowserClient } from '@supabase/ssr'

// Centralized Supabase client configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
}

// Create browser client with proper cookie configuration
export function createSupabaseBrowser() {
  return createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return document.cookie
            .split(';')
            .map(cookie => cookie.trim().split('='))
            .filter(([name]) => name)
            .map(([name, value]) => ({ name, value: decodeURIComponent(value || '') }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              path: '/',
              maxAge: 60 * 60 * 24 * 7, // 7 days
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
              ...options
            }
            
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            if (cookieOptions.path) cookieString += `; Path=${cookieOptions.path}`
            if (cookieOptions.maxAge) cookieString += `; Max-Age=${cookieOptions.maxAge}`
            if (cookieOptions.sameSite) cookieString += `; SameSite=${cookieOptions.sameSite}`
            if (cookieOptions.secure) cookieString += `; Secure`
            if (cookieOptions.httpOnly) cookieString += `; HttpOnly`
            
            document.cookie = cookieString
            
            console.log('🍪 Supabase: Setting cookie:', name, 'with options:', cookieOptions)
          })
        },
      },
    }
  )
} 