import type { Metadata } from "next";
import "../globals.css";
import { ReactNode } from "react";
import { shouldSkipAuth } from "@/lib/clerk-config";

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
  // Ya no necesitamos envolver en ClerkProvider aquí,
  // ya que el layout principal (app/layout.tsx) ya usa AppClerkProvider
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
} 