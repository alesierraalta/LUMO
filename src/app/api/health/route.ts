import { NextRequest, NextResponse } from "next/server";

/**
 * Health check endpoint to verify application status
 * Returns basic environment configuration status (without exposing secrets)
 */
export async function GET(request: NextRequest) {
  try {
    // Check critical environment variables (redacted for security)
    const envStatus = {
      clerk_auth_enabled: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH !== 'true',
      clerk_publishable_key_set: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      clerk_secret_key_set: !!process.env.CLERK_SECRET_KEY,
      clerk_publishable_key_valid: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_dummy-key-for-build',
      // Don't include the actual keys in the response
    };

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      auth_config: envStatus,
    }, { status: 200 });
  } catch (error) {
    console.error("Health check error:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 