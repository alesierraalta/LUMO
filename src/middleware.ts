import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define which routes are public
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)", 
  "/sign-up(.*)",
  "/api/(.*)auth(.*)",
  "/api/health"  // Always allow health checks
]);

// Define API routes that should be protected but handle their own authentication
const isApiRoute = createRouteMatcher(["/api(.*)"]);

// Apply middleware with custom verification and fallback
export default clerkMiddleware(async (auth, req) => {
  // Check if we should skip Clerk authentication (used during build)
  const skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
  
  // If skipping auth, bypass checks
  if (skipClerkAuth) {
    return NextResponse.next();
  }
  
  // If the user is trying to access the root, allow
  // (the root page will handle the redirection based on authentication)
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }
  
  // If it's a public route, allow
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // If it's an API route, let it handle its own authentication
  if (isApiRoute(req)) {
    return NextResponse.next();
  }
  
  try {
    // Protect the route
    await auth.protect();
    return NextResponse.next();
  } catch (error) {
    // For deployment/debugging, add more detailed error logging
    console.error("Clerk authentication error:", error);
    
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}; 