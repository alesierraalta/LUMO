import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner"
import { UserNav } from "@/components/auth/UserNav";
import { AuthErrorBoundary } from "@/components/auth/ErrorBoundary";
import { AppClerkProvider } from "@/components/auth/clerk-provider-config";
import { EnvProvider } from "@/components/providers/env-provider";
import Script from "next/script";

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
      <head>
        {/* Load environment configuration before any other scripts */}
        <script src="/env-config.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EnvProvider>
          <ThemeProvider defaultTheme="system">
            <AuthErrorBoundary>
              <AppClerkProvider>
                {children}
              </AppClerkProvider>
            </AuthErrorBoundary>
          </ThemeProvider>
        </EnvProvider>
        <Toaster />
      </body>
    </html>
  );
}
