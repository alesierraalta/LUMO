import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@/components/user-button";
import { AuthDebugPanel } from "@/components/debug/auth-debug";

// Disable static generation for main layout
export const dynamic = 'force-dynamic';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
            <MobileNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserButton />
              <ModeToggle />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
      
      {/* Debug panel - only in development */}
      {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
    </AuthProvider>
  );
} 