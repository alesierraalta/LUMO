"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Home() {
  useEffect(() => {
    // For now, just redirect to dashboard
    // TODO: Add authentication check here
    redirect("/dashboard");
  }, []);

  // Show loading until redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
