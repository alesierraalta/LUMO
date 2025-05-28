import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LUMO - Sistema de Inventario',
  description: 'Sistema de gestión de inventario desarrollado con Next.js',
  keywords: ['inventario', 'gestión', 'productos', 'LUMO'],
  authors: [{ name: 'LUMO Team' }],
  creator: 'LUMO Team',
  publisher: 'LUMO',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    title: 'LUMO - Sistema de Inventario',
    description: 'Sistema de gestión de inventario desarrollado con Next.js',
    siteName: 'LUMO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LUMO - Sistema de Inventario',
    description: 'Sistema de gestión de inventario desarrollado con Next.js',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.className}>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900">
        {/* Global loading indicator */}
        <div id="global-loading" className="hidden fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando...</span>
          </div>
        </div>

        {/* Main application content */}
        <main id="main-content">
          {children}
        </main>

        {/* Global scripts and analytics can go here */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Hide loading indicator when page loads
              window.addEventListener('load', function() {
                const loading = document.getElementById('global-loading');
                if (loading) loading.classList.add('hidden');
              });
              
              // Simple error handler
              window.addEventListener('error', function(e) {
                console.error('Global error:', e.error);
              });
              
              // Performance monitoring
              window.addEventListener('load', function() {
                if ('performance' in window) {
                  const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                  console.log('Page load time:', loadTime + 'ms');
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
} 