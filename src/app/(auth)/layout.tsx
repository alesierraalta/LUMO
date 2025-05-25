import type { Metadata } from "next";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

// Disable static generation for auth pages
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Autenticación - Sistema de Inventario",
  description: "Acceda a su cuenta del sistema de gestión de inventario",
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  // For Docker builds, we may need to skip Clerk authentication
  const skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
  
  if (skipClerkAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <ClerkProvider>
      <div className="min-h-screen flex items-center justify-center">
        {children}
      </div>
    </ClerkProvider>
  );
} 