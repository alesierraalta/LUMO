'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@/components/user-button";
import { AuthDebugPanel } from "@/components/debug/auth-debug";
import { useState } from "react";

// Disable static generation for main layout
export const dynamic = 'force-dynamic';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
            <MobileNav />
            <div className="text-sm text-muted-foreground">
              Sistema de Inventario
            </div>
          </div>
          <main className="flex-1 overflow-auto p-4 bg-background">
            {children}
          </main>
        </div>
      </div>
      
      {/* Debug panel - only in development */}
      {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
    </AuthProvider>
  );
} 