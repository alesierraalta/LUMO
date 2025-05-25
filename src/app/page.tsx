"use client";

import { redirect } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Home() {
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
