import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    
    // Get user agent and IP for security tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      undefined;

    // Authenticate user
    const authResult = await authenticateUser(email, password, userAgent, ipAddress);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    console.log(`[Login API] Successful login for user: ${email}`);
    console.log(`[Login API] Token generated: ${authResult.token ? 'YES' : 'NO'}`);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.user!.id,
        email: authResult.user!.email,
        firstName: authResult.user!.firstName,
        lastName: authResult.user!.lastName,
        role: authResult.user!.role.name,
        isEmailVerified: authResult.user!.isEmailVerified,
      },
      message: 'Login successful',
      redirectUrl: '/dashboard',
    });

    // Set authentication cookie with improved options
    if (authResult.token) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      };
      
      console.log(`[Login API] Setting cookie with options:`, cookieOptions);
      response.cookies.set('auth-token', authResult.token, cookieOptions);
      
      // Verify cookie was set
      const setCookieHeader = response.headers.get('set-cookie');
      console.log(`[Login API] Set-Cookie header:`, setCookieHeader);
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 