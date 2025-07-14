"use client";

import { useState } from 'react';
import { Sidebar, MobileNav } from '@/components/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { redirect } from 'next/navigation';
import { DebugToggle } from '@/components/debug-dashboard';
import browserCompatibility from '@/lib/browser-compatibility';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  if (!loading && !user) {
    redirect('/login');
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-2">
            <MobileNav />
            <h1 className="font-semibold">LUMO</h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      {/* Debug Dashboard - Only visible in development */}
      <DebugToggle />
    </div>
  );
} 