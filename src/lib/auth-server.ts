import { cookies } from 'next/headers';
import { getCurrentUserFromToken } from './auth-simple';
import { createSupabaseServer } from './supabase-server';

const COOKIE_NAME = 'auth-token';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Get current user from Supabase server-side
export const getCurrentUser = async (): Promise<any> => {
  console.log('🔍 getCurrentUser: Starting authentication check...');
  
  try {
    // Try Supabase authentication first
    const cookieStore = await cookies();
    console.log('🔍 getCurrentUser: Got cookie store');
    
    // Log all available cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('🔍 getCurrentUser: Available cookies:', allCookies.map(c => c.name).join(', '));
    
    // FIXED: Use optimized Supabase server client
    const supabase = await createSupabaseServer();
    console.log('🔍 getCurrentUser: Created optimized Supabase server client');

    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('🔍 getCurrentUser: Session check result:');
    console.log('  - Error:', error?.message || 'none');
    console.log('  - Session exists:', !!session);
    console.log('  - User exists:', !!session?.user);
    
    if (!error && session?.user) {
      console.log('✅ getCurrentUser: Valid session found');
      console.log('  - User ID:', session.user.id);
      console.log('  - Email:', session.user.email);
      
      // Get additional user data directly from database (no internal fetch)
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

      console.log('✅ getCurrentUser: Returning user object:', JSON.stringify(user, null, 2));
      return user;
    }

    console.log('⚠️ getCurrentUser: No Supabase session, trying legacy JWT...');
    
    // Fallback to legacy JWT system
    const authToken = cookieStore.get(COOKIE_NAME)?.value;
    if (authToken) {
      console.log('🔍 getCurrentUser: Found legacy auth token, checking...');
      const legacyUser = await getCurrentUserFromToken(authToken);
      if (legacyUser) {
        console.log('✅ getCurrentUser: Legacy user found:', JSON.stringify(legacyUser, null, 2));
        return legacyUser;
      } else {
        console.log('❌ getCurrentUser: Legacy token invalid');
      }
    } else {
      console.log('❌ getCurrentUser: No legacy auth token found');
    }

    console.log('❌ getCurrentUser: No valid authentication found, returning null');
    return null;
  } catch (error) {
    console.error('❌ getCurrentUser: Error occurred:', error);
    console.error('❌ getCurrentUser: Stack trace:', error.stack);
    return null;
  }
};

// Set auth cookie (legacy support)
export const setAuthCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
  });
};

// Clear auth cookie (legacy support)
export const clearAuthCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}; 