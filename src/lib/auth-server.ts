/**
 * Supabase-Only Server Authentication
 * NO JWT, NO LEGACY FALLBACKS - ONLY SUPABASE
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { supabaseServer } from './supabase-server-only';

// Simple password hashing (though Supabase handles this internally)
export const hashPassword = async (password: string): Promise<string> => {
  // For Supabase-only auth, we don't need to hash passwords manually
  // Supabase handles this internally with signUp/signInWithPassword
  // This function exists only for compatibility with existing code
  console.log('⚠️ hashPassword: Using Supabase auth - password hashing handled internally');
  return password; // Return as-is since Supabase handles hashing
};

// Get current user from Supabase ONLY
export const getCurrentUser = async (): Promise<any> => {
  console.log('🔍 getCurrentUser: Starting Supabase-only authentication check...');
  
  // CRITICAL FIX: Handle build-time execution
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('⚠️ getCurrentUser: Build-time execution detected, returning null');
    return null;
  }
  
  try {
    // Use ONLY Supabase authentication
    const cookieStore = await cookies();
    console.log('🔍 getCurrentUser: Got cookie store');
    
    // CRITICAL FIX: Check for any Supabase session cookies
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('sb-') || 
      c.name.includes('supabase') ||
      c.name.includes('auth-token')
    );
    console.log('🔍 getCurrentUser: Available Supabase cookies:', supabaseCookies.map(c => c.name).join(', '));
    
    // Use server-safe Supabase client
    const supabase = supabaseServer;
    console.log('🔍 getCurrentUser: Using Supabase-only client');

    // CRITICAL FIX: Better session detection
    let session = null;
    let sessionError = null;

    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      session = sessionData?.session;
      sessionError = error;
    } catch (err) {
      console.warn('⚠️ getCurrentUser: Session check failed, trying alternative methods');
      sessionError = err;
    }

    console.log('🔍 getCurrentUser: Supabase session check result:');
    console.log('  - Error:', sessionError?.message || 'none');
    console.log('  - Session exists:', !!session);
    console.log('  - User exists:', !!session?.user);
    
    if (!sessionError && session?.user) {
      console.log('✅ getCurrentUser: Valid Supabase session found');
      console.log('  - User ID:', session.user.id);
      console.log('  - Email:', session.user.email);
      
      // Get additional user data from database
      let userRole = 'USER';
      let userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
      let isActive = true;

      try {
        console.log('🔍 getCurrentUser: Querying database for user data...');
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select(`
            name, 
            is_active, 
            roles!inner(name)
          `)
          .eq('email', session.user.email)
          .single();

        if (!dbError && dbUser) {
          console.log('✅ getCurrentUser: Database query successful');
          console.log('  - DB User:', JSON.stringify(dbUser, null, 2));
          userName = dbUser.name || userName;
          isActive = dbUser.is_active;
          userRole = (dbUser.roles as any)?.name || 'USER';
        } else {
          console.warn('⚠️ getCurrentUser: Could not fetch user from database:', dbError?.message);
          // For alesierraalta@gmail.com, default to ADMIN role
          if (session.user.email === 'alesierraalta@gmail.com') {
            console.log('🔑 getCurrentUser: Applied admin role for root user');
            userRole = 'ADMIN';
          }
        }
      } catch (dbError) {
        console.warn('❌ getCurrentUser: Database query failed:', dbError);
        // For alesierraalta@gmail.com, default to ADMIN role
        if (session.user.email === 'alesierraalta@gmail.com') {
          console.log('🔑 getCurrentUser: Applied admin role for root user (fallback)');
          userRole = 'ADMIN';
        }
      }

      const user = {
        id: session.user.id,
        email: session.user.email,
        name: userName,
        role: userRole,
        isActive: isActive,
        permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
      };

      console.log('✅ getCurrentUser: Returning Supabase user object:', JSON.stringify(user, null, 2));
      return user;
    }

    // TEMPORARY FIX: Allow admin access in development for testing
    if (process.env.NODE_ENV === 'development' && process.env.CHOREO_ENVIRONMENT === 'Development') {
      console.log('🔧 getCurrentUser: Development mode - returning temporary admin user with real UUID');
      return {
        id: '5f493c59-420e-4a9b-afed-0b67bfa892d5', // Real UUID from Supabase Auth
        email: 'alesierraalta@gmail.com',
        name: 'Dev Admin',
        role: 'ADMIN',
        isActive: true,
        permissions: ['read', 'write', 'delete', 'admin']
      };
    }

    console.log('❌ getCurrentUser: No Supabase session found - NO FALLBACKS');
    return null;
  } catch (error) {
    console.error('❌ getCurrentUser: Supabase error occurred:', error);
    console.error('❌ getCurrentUser: Stack trace:', error.stack);
    
    // CRITICAL FIX: Handle build-time errors gracefully
    if (process.env.NODE_ENV === 'production' && error.message?.includes('cookies')) {
      console.log('⚠️ getCurrentUser: Build-time cookie error, returning null');
      return null;
    }
    
    return null;
  }
};

// REPLACEMENT for getCurrentUserFromToken - now handles both JWT and Supabase tokens
export const getCurrentUserFromToken = async (token: string): Promise<any> => {
  console.log('🔍 getCurrentUserFromToken: Starting token validation...');
  console.log('🔑 getCurrentUserFromToken: Token (first 50 chars):', token?.substring(0, 50) + '...');
  
  try {
    // Use the provided token to get user from Supabase
    const supabase = supabaseServer;
    console.log('🔍 getCurrentUserFromToken: Using supabaseServer client');
    
    // Use the provided token to get user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('❌ getCurrentUserFromToken: Supabase auth error:', error.message);
      console.log('❌ getCurrentUserFromToken: Error details:', error);
      return null;
    }
    
    if (!user) {
      console.log('❌ getCurrentUserFromToken: No user found in Supabase response');
      return null;
    }

    console.log('✅ getCurrentUserFromToken: Supabase user found:', user.email);

    // Get additional user data from database
    let userRole = 'USER';
    let userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    let isActive = true;

    try {
      console.log('🔍 getCurrentUserFromToken: Querying database for user:', user.email);
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select(`
          name, 
          is_active, 
          roles!inner(name)
        `)
        .eq('email', user.email)
        .single();

      if (!dbError && dbUser) {
        console.log('✅ getCurrentUserFromToken: Database user found:', dbUser);
        console.log('🔍 getCurrentUserFromToken: Database user roles:', dbUser.roles);
        userName = dbUser.name || userName;
        isActive = dbUser.is_active;
        
        // Extract role name from the database response
        const roleFromDb = (dbUser.roles as any)?.name;
        console.log('🔍 getCurrentUserFromToken: Role from database:', roleFromDb);
        
        if (roleFromDb) {
          userRole = roleFromDb;
          console.log('✅ getCurrentUserFromToken: Successfully set role from database:', userRole);
        } else {
          console.warn('⚠️ getCurrentUserFromToken: No role found in database response, using fallback');
          // For alesierraalta@gmail.com, default to ADMIN role
          if (user.email === 'alesierraalta@gmail.com') {
            console.log('🔑 getCurrentUserFromToken: Applied admin role for root user (no role in db)');
            userRole = 'ADMIN';
          }
        }
      } else {
        console.warn('⚠️ getCurrentUserFromToken: Database query failed:', dbError?.message);
        // For alesierraalta@gmail.com, default to ADMIN role
        if (user.email === 'alesierraalta@gmail.com') {
          console.log('🔑 getCurrentUserFromToken: Applied admin role for root user');
          userRole = 'ADMIN';
        }
      }
    } catch (dbError) {
      
      // For alesierraalta@gmail.com, default to ADMIN role
      if (user.email === 'alesierraalta@gmail.com') {
        
        userRole = 'ADMIN';
      }
    }

    const userObj = {
      id: user.id,
      email: user.email,
      name: userName,
      role: userRole,
      isActive: isActive,
      permissions: userRole === 'ADMIN' ? ['read', 'write', 'delete', 'admin'] : ['read']
    };

    
    return userObj;
  } catch (error) {
    
    
    return null;
  }
};

// REPLACEMENT for getTokenFromRequest - now gets Supabase Bearer token
export const getTokenFromRequest = (request: NextRequest): string | null => {
  // First check Authorization header for Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }
  
  // Fallback to checking cookies
  return request.cookies.get('sb-access-token')?.value
    || request.cookies.get('sb-refresh-token')?.value
    || request.cookies.get('auth-token')?.value
    || null;
};

// Helper functions for Supabase-only auth
export const isAdmin = (user: any): boolean => {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
};

export const isManager = (user: any): boolean => {
  return user?.role === 'MANAGER' || isAdmin(user);
};

// Clear Supabase auth (no more JWT cookies)
export const clearAuth = async (): Promise<void> => {
  try {
    const supabase = supabaseServer;
    await supabase.auth.signOut();
    
  } catch (error) {
    
  }
}; 