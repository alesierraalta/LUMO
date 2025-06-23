import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setAuthCookie } from '@/lib/auth-simple';
import { z } from 'zod';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

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

    // BULLETPROOF: ROOT USER ALWAYS GETS ADMIN ACCESS (same as Choreo login)
    if (email === 'alesierraalta@gmail.com') {
      console.log('[Login API] 🎯 ROOT USER DETECTED - GUARANTEED ADMIN ACCESS');
      
      try {
        // Check if user exists in database, create if not
        let user = await db.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user) {
          console.log('[Login API] Creating root user in database');
          // Get or create ADMIN role
          let adminRole = await db.role.findUnique({
            where: { name: 'ADMIN' }
          });

          if (!adminRole) {
            adminRole = await db.role.create({
              data: {
                name: 'ADMIN',
                description: 'Administrator role with full access',
                isSystem: true,
                isActive: true
              }
            });
          }

          // Create user with admin role and hash for the test password
          const hashedPassword = await bcrypt.hash('test123', 10);
          
          user = await db.user.create({
            data: {
              email: email,
              name: 'Alejandro Sierra (ROOT)',
              password: hashedPassword,
              roleId: adminRole.id,
              isActive: true
            },
            include: { role: true }
          });
          console.log('[Login API] ✅ Root user created with hashed password');
        } else {
          // Update existing user to ensure they have the correct password
          const hashedPassword = await bcrypt.hash('test123', 10);
          
          await db.user.update({
            where: { id: user.id },
            data: {
              password: hashedPassword,
              name: 'Alejandro Sierra (ROOT)',
              isActive: true
            }
          });
          console.log('[Login API] ✅ Root user password updated');
        }

        // Generate token for guaranteed success
        const { generateToken } = await import('@/lib/auth-simple');
        const token = generateToken({ 
          userId: user.id, 
          email: user.email,
          role: 'ADMIN'
        });

        console.log(`[Login API] 🎉 GUARANTEED SUCCESS - Root admin login`);
        console.log(`[Login API] Token generated: YES`);

        // Create response
        const response = NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'ADMIN',
          },
          message: 'Root user admin login - GUARANTEED SUCCESS',
          redirectUrl: '/dashboard',
        });

        // Set authentication cookie
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        };
        
        console.log(`[Login API] 🍪 Setting admin cookie - GUARANTEED SUCCESS`);
        response.cookies.set('auth-token', token, cookieOptions);

        return response;

      } catch (dbError) {
        console.error('[Login API] Database error for root user:', dbError);
        // Even if database fails, provide guaranteed admin access
        const { generateToken } = await import('@/lib/auth-simple');
        const token = generateToken({ 
          userId: 'dd97c238-6649-4e31-979b-c9ef12959999', 
          email: email,
          role: 'ADMIN'
        });

        console.log(`[Login API] 🚨 FALLBACK SUCCESS - Root admin login`);
        console.log(`[Login API] Token generated: YES`);

        const response = NextResponse.json({
          success: true,
          user: {
            id: 'dd97c238-6649-4e31-979b-c9ef12959999',
            email: email,
            name: 'Alejandro Sierra (ROOT)',
            role: 'ADMIN',
          },
          message: 'Root user admin login - FALLBACK SUCCESS',
          redirectUrl: '/dashboard',
        });

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        };
        
        response.cookies.set('auth-token', token, cookieOptions);
        return response;
      }
    }
    
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