"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useAppAuth } from "@/components/auth/auth-provider";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Home() {
  // Check if we should skip Clerk authentication (used during build)
  const skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';

  if (skipClerkAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">LUMO Inventory</h1>
          <p className="text-muted-foreground">Authentication bypassed for development</p>
          <div className="mt-4">
            <a 
              href="/dashboard" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 inline-block"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <HomeContent />;
}

// Component that uses our auth context instead of direct Clerk hooks
function HomeContent() {
  const { isLoaded, isSignedIn } = useAppAuth();
  
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
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
