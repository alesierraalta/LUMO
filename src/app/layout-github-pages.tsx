'use client';

import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import { useClientSideOnly } from '@/lib/github-pages-config';
import { GitHubPagesAuthProvider } from '@/contexts/auth-context-github-pages';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({ subsets: ['latin'] });

export default function GitHubPagesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isGitHubPages = useClientSideOnly();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>LUMO - Sistema de Gestión de Inventario</title>
        <meta name="description" content="Sistema moderno de gestión de inventario con Next.js 15 y Supabase" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="ui-theme"
        >
          {isGitHubPages ? (
            <GitHubPagesAuthProvider>
              {children}
            </GitHubPagesAuthProvider>
          ) : (
            <AuthProvider>
              {children}
            </AuthProvider>
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
} 