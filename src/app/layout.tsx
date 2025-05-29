import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner"
import { UserNav } from "@/components/auth/UserNav";
import { AuthErrorBoundary } from "@/components/auth/ErrorBoundary";
import { AppClerkProvider } from "@/components/auth/clerk-provider-config";
import { EnvProvider } from '@/components/providers/env-provider';
import Script from "next/script";
import { clerkAppearance, getClerkConfig } from '@/lib/clerk-config';
import ClerkSSLFix from '@/components/clerk-ssl-fix';

// Disable static generation for all pages
export const dynamic = 'force-dynamic';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LUMO - Sistema de Inventario",
  description: "Sistema completo de gestión de inventario con análisis financiero",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkConfig = getClerkConfig();
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preload Clerk JS from official CDN */}
        <link 
          rel="preload" 
          href="https://js.clerk.com/v1/clerk.js" 
          as="script" 
          crossOrigin="anonymous"
        />
        {/* Environment configuration */}
        <script src="/env-config.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <ClerkSSLFix />
        <EnvProvider>
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
            appearance={clerkAppearance}
          >
            <ThemeProvider defaultTheme="system">
              <div className="relative flex min-h-screen flex-col">
                {children}
              </div>
              <Toaster />
            </ThemeProvider>
          </ClerkProvider>
        </EnvProvider>
      </body>
    </html>
  );
}
