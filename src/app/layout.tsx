import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner"
import { ClerkProvider } from "@clerk/nextjs";
import { UserNav } from "@/components/auth/UserNav";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthErrorBoundary } from "@/components/auth/ErrorBoundary";
import { AppClerkProvider } from "@/components/auth/clerk-provider-config";

// Disable static generation for all pages
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUMO",
  description: "Una aplicación moderna para gestión de inventario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="system">
          <AuthErrorBoundary>
            <AppClerkProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </AppClerkProvider>
          </AuthErrorBoundary>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
