import { NextRequest, NextResponse } from 'next/server'
import { getCustomSupabaseClient } from '@/lib/supabase-custom-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Logout endpoint called')
    
    // Create Supabase client for server-side operations
    const supabase = getCustomSupabaseClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Supabase logout error:', error)
      // Don't fail completely - continue with cleanup
    } else {
      console.log('✅ Supabase logout successful')
    }

    // Create response
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear all auth-related cookies
    const authCookies = [
      'auth-token',
      'supabase-auth-token',
      'sb-access-token',
      'sb-refresh-token'
    ]

    authCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    // Also clear any Supabase cookies that might exist
    const supabaseCookiePattern = /^sb-.*-auth-token/
    request.cookies.getAll().forEach(cookie => {
      if (supabaseCookiePattern.test(cookie.name)) {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
      }
    })

    console.log('✅ Logout completed successfully')
    return response

  } catch (error) {
    console.error('❌ Logout error:', error)
    
    // Even if there's an error, return success to allow client-side cleanup
    const response = NextResponse.json(
      { message: 'Logged out (with cleanup)' },
      { status: 200 }
    )

    // Clear cookies anyway
    response.cookies.set('auth-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response
  }
}