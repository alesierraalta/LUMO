import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeWithFallback, getClientStatus, testAllConnectionMethods } from '@/lib/prisma-enhanced';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const generateToken = (payload: { userId: string; email: string; roleId: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DURATION}s` });
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[Enhanced Login API] Processing login request with P6001 protection');
    
    // Get client status before starting
    const clientStatus = getClientStatus();
    console.log('[Enhanced Login API] Client status:', clientStatus);
    
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      console.log('[Enhanced Login API] Invalid input:', result.error.errors);
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    console.log(`[Enhanced Login API] Login attempt for: ${email}`);
    
    // Get user agent and IP for security tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      undefined;

    // Authenticate user using enhanced client with P6001 fallback
    const authResult = await executeWithFallback(async (client) => {
      console.log('[Enhanced Login API] Using Prisma client with fallback protection');
      
      // Find user with role and permissions
      const user = await client.user.findUnique({
        where: { email },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        console.log(`[Enhanced Login API] User not found for email: ${email}`);
        return { success: false, error: 'Invalid email or password' };
      }

      if (!user.isActive) {
        console.log(`[Enhanced Login API] Inactive account for email: ${email}`);
        return { success: false, error: 'Account is disabled' };
      }

      // Check for account lockout
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        console.log(`[Enhanced Login API] Account locked for email: ${email}`);
        return { success: false, error: 'Account is temporarily locked' };
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      
      if (!isPasswordValid) {
        console.log(`[Enhanced Login API] Invalid password for email: ${email}`);
        // Increment login attempts
        const attempts = user.loginAttempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes
        
        await client.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: attempts,
            lockedUntil: lockUntil,
          },
        });
        
        return { success: false, error: 'Invalid email or password' };
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0 || user.lockedUntil) {
        await client.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });
      } else {
        await client.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        });
      }

      // Generate token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email,
        roleId: user.roleId
      });
      
      // Create session
      const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);
      
      await client.userSession.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
          userAgent,
          ipAddress,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        token
      };
      
    }, 'Enhanced User Authentication');

    if (!authResult.success) {
      // Translate error messages for consistency
      let errorMessage = authResult.error || 'Authentication error';
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

    const executionTime = Date.now() - startTime;
    console.log(`[Enhanced Login API] Successful login for user: ${email} (${executionTime}ms)`);
    console.log(`[Enhanced Login API] Token generated: ${authResult.token ? 'YES' : 'NO'}`);

    // Get final client status
    const finalClientStatus = getClientStatus();
    console.log('[Enhanced Login API] Final client status:', finalClientStatus);

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
      executionTime,
      clientStatus: finalClientStatus,
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
      
      console.log(`[Enhanced Login API] Setting cookie with options:`, cookieOptions);
      response.cookies.set('auth-token', authResult.token, cookieOptions);
      
      // Verify cookie was set
      const setCookieHeader = response.headers.get('set-cookie');
      console.log(`[Enhanced Login API] Set-Cookie header:`, setCookieHeader);
    }

    return response;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[Enhanced Login API] Login error:', error);
    
    // Test all connection methods if we get an error
    console.log('[Enhanced Login API] Testing all connection methods due to error...');
    try {
      const connectionTests = await testAllConnectionMethods();
      console.log('[Enhanced Login API] Connection test results:', connectionTests);
    } catch (testError) {
      console.error('[Enhanced Login API] Connection tests also failed:', testError);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        executionTime,
        clientStatus: getClientStatus()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check for enhanced login route
  try {
    const clientStatus = getClientStatus();
    const connectionTests = await testAllConnectionMethods();
    
    return NextResponse.json({
      status: 'Enhanced Login API Ready',
      clientStatus,
      connectionTests,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Enhanced Login API Health Check Failed',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 