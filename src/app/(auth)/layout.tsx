import type { Metadata } from "next";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Autenticación - Sistema de Inventario",
  description: "Acceda a su cuenta del sistema de gestión de inventario",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div className="h-screen bg-background">
        {children}
      </div>
    </ClerkProvider>
  );
} 