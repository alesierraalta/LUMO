import { NextRequest, NextResponse } from "next/server";

/**
 * Health check endpoint to verify application status
 * Returns basic environment configuration status (without exposing secrets)
 */
export async function GET(request: NextRequest) {
  try {
    // Check critical environment variables (redacted for security)
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    
    const envStatus = {
      clerk_auth_enabled: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH !== 'true',
      clerk_publishable_key_set: !!publishableKey,
      clerk_secret_key_set: !!secretKey,
      clerk_publishable_key_valid: publishableKey !== 'pk_test_dummy-key-for-build',
      clerk_publishable_key_prefix: publishableKey ? publishableKey.substring(0, 15) + '...' : 'MISSING',
      clerk_secret_key_prefix: secretKey ? secretKey.substring(0, 15) + '...' : 'MISSING',
      // Environment debugging for deployment
      node_env: process.env.NODE_ENV,
      port: process.env.PORT || 'not set',
      skip_clerk_auth: process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH,
    };

    const status = envStatus.clerk_publishable_key_set && envStatus.clerk_secret_key_set ? "ok" : "error";
    const statusCode = status === "ok" ? 200 : 500;

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      auth_config: envStatus,
      message: status === "error" ? "Missing required Clerk environment variables" : "All systems operational"
    }, { status: statusCode });
  } catch (error) {
    console.error("Health check error:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 