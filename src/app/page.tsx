"use client";

import { redirect } from "next/navigation";
import { useUser, ClerkProvider } from "@clerk/nextjs";
import { useEffect } from "react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

// Inner component that uses Clerk hooks
function HomeContent() {
  const { isLoaded, isSignedIn } = useUser();
  
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      redirect("/dashboard");
    } else if (isLoaded && !isSignedIn) {
      redirect("/sign-in");
    }
  }, [isLoaded, isSignedIn]);

  // Show loading until redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// Main component with proper ClerkProvider wrapping
export default function Home() {
  // Check if we should skip Clerk authentication (used during build)
  const skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';

  if (skipClerkAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Authentication bypassed for build process</p>
        </div>
      </div>
    );
  }

  // Wrap with ClerkProvider for production use
  return (
    <ClerkProvider>
      <HomeContent />
    </ClerkProvider>
  );
}
