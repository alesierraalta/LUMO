import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define which routes are public
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)", 
  "/sign-up(.*)",
  "/api/(.*)auth(.*)"
]);

// Apply middleware with custom verification
export default clerkMiddleware(async (auth, req) => {
  // If the user is trying to access the root, allow
  // (the root page will handle the redirection based on authentication)
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }
  
  // If it's a public route, allow
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // If not authenticated, redirect to sign-in
  try {
    // Protect the route
    await auth.protect();
    return NextResponse.next();
  } catch (error) {
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