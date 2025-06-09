import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setAuthCookie } from '@/lib/auth-simple';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[Login API] Processing login request');
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      console.log('[Login API] Invalid input:', result.error.errors);
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: result.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    console.log(`[Login API] Login attempt for: ${email}`);
    
    // Get user agent and IP for security tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      undefined;

    // Authenticate user
    const authResult = await authenticateUser(email, password);

    if (!authResult.success) {
      // Traducir los mensajes de error para consistencia
      let errorMessage = authResult.error || 'Error de autenticación';
      if (authResult.error === 'Invalid email or password') {
        errorMessage = 'Correo electrónico o contraseña incorrectos';
      } else if (authResult.error === 'Authentication failed') {
        errorMessage = 'Autenticación fallida';
      } else if (authResult.error === 'Account is disabled') {
        errorMessage = 'La cuenta está desactivada';
      } else if (authResult.error === 'Account is temporarily locked') {
        errorMessage = 'La cuenta está temporalmente bloqueada';
      }

      return NextResponse.json(
        { error: errorMessage },
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
        name: authResult.user!.name,
        role: authResult.user!.role,
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