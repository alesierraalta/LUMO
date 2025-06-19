import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth-context";

// Disable static generation for all pages
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "LUMO - Sistema de Gestión de Inventario",
  description: "Sistema avanzado de gestión de inventario con seguimiento en tiempo real y analítica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className="antialiased min-h-screen bg-background font-sans"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              {children}
              <Toaster />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
