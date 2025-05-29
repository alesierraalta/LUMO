import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LUMO Inventory Management System",
  description: "Advanced inventory management system with real-time tracking and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkConfig = getClerkConfig();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload Clerk script via our proxy to prevent subdomain issues */}
        <link
          rel="preload"
          href="/api/clerk-proxy/v1/clerk.js"
          as="script"
          crossOrigin="anonymous"
        />
        
        {/* Custom Clerk configuration script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Override Clerk's automatic domain detection
              window.__clerk_frontend_api = 'lumo-clerk-proxy';
              window.__clerk_domain_override = true;
              
              // Prevent Clerk from generating problematic subdomain URLs
              if (typeof window !== 'undefined') {
                const originalCreateElement = document.createElement.bind(document);
                document.createElement = function(tagName) {
                  const element = originalCreateElement(tagName);
                  
                  if (tagName.toLowerCase() === 'script') {
                    const originalSetAttribute = element.setAttribute.bind(element);
                    element.setAttribute = function(name, value) {
                      if (name === 'src' && value && value.includes('clerk') && value.includes('.choreoapps.dev')) {
                        console.log('[CLERK-CONFIG] Blocking problematic script URL:', value);
                        return originalSetAttribute('src', '/api/clerk-proxy/v1/clerk.js');
                      }
                      return originalSetAttribute(name, value);
                    };
                  }
                  
                  return element;
                };
                
                console.log('[CLERK-CONFIG] Custom Clerk configuration loaded');
              }
            `,
          }}
        />
        {/* Environment configuration */}
        <script src="/env-config.js" async></script>
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-background font-sans`}
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
            </ThemeProvider>
          </ClerkProvider>
        </EnvProvider>
      </body>
    </html>
  );
}
