import type { Metadata } from "next";
import "../globals.css";
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
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
} 