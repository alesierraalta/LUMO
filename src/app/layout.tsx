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
  // For Docker builds, we may need to skip Clerk authentication
  const skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
  
  // Create the content that will be rendered
  const content = (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="system">
          <AuthErrorBoundary>
            {skipClerkAuth ? (
              // Direct render without Clerk auth context
              <AuthProvider>
                {children}
              </AuthProvider>
            ) : (
              // Use AuthProvider which depends on ClerkProvider
              <AuthProvider>
                {children}
              </AuthProvider>
            )}
          </AuthErrorBoundary>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );

  // Always wrap with ClerkProvider, but with appropriate options
  // This ensures that the ClerkProvider context is always available
  // but authentication can be optionally disabled
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {content}
    </ClerkProvider>
  );
}
