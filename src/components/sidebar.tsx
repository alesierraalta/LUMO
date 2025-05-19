"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Home, Settings, Menu, X, Users, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppAuth } from "@/components/auth/auth-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  collapsed?: boolean;
}

const SidebarLink = ({ href, icon: Icon, title, collapsed = false }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? title : undefined}
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span>{title}</span>}
    </Link>
  );
};

interface SidebarLinksProps {
  collapsed: boolean;
}

function SidebarLinks({ collapsed }: SidebarLinksProps) {
  const { isAdmin, syncingUser, syncError } = useAppAuth();
  
  return (
    <>
      <SidebarLink href="/dashboard" icon={BarChart3} title="Panel" collapsed={collapsed} />
      <SidebarLink href="/inventory" icon={Boxes} title="Inventario" collapsed={collapsed} />
      <SidebarLink href="/settings" icon={Settings} title="Configuración" collapsed={collapsed} />
      
      {/* Admin-only links */}
      {isAdmin && (
        <SidebarLink href="/settings/users" icon={Users} title="Usuarios" collapsed={collapsed} />
      )}
      
      {/* Sync status */}
      {syncingUser && !collapsed && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Sincronizando usuario...</span>
        </div>
      )}
      
      {syncError && !collapsed && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Error de sincronización</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{syncError}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isLoaded } = useAppAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-card text-card-foreground border-r border-border h-screen sticky top-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && <h2 className="font-semibold text-xl">LUMO</h2>}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-1 rounded-md hover:bg-secondary transition-colors ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <SidebarLink href="/" icon={Home} title="Inicio" collapsed={collapsed} />
        {isLoaded ? (
          <SidebarLinks collapsed={collapsed} />
        ) : (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </nav>
      
      <div className={cn("p-4 border-t border-border", collapsed && "text-center")}>
        <div className="text-xs text-muted-foreground">
          {!collapsed && "LUMO v1.0"}
          {collapsed && "v1.0"}
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, isLoaded, syncingUser, syncError } = useAppAuth();
  
  return (
    <>
      <div className="md:hidden flex justify-between items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-secondary rounded-md"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-lg">LUMO</h2>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute top-0 left-0 w-64 h-full bg-card border-r border-border p-4 animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
              <h2 className="font-semibold text-xl">LUMO</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-secondary transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="space-y-2">
              <Link 
                href="/" 
                className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                onClick={() => setIsOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span>Inicio</span>
              </Link>
              
              {isLoaded ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Panel</span>
                  </Link>
                  <Link 
                    href="/inventory" 
                    className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    <Boxes className="h-5 w-5" />
                    <span>Inventario</span>
                  </Link>
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Configuración</span>
                  </Link>
                  
                  {/* Admin-only links */}
                  {isAdmin && (
                    <Link 
                      href="/settings/users" 
                      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                      onClick={() => setIsOpen(false)}
                    >
                      <Users className="h-5 w-5" />
                      <span>Usuarios</span>
                    </Link>
                  )}
                  
                  {/* Sync status */}
                  {syncingUser && (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sincronizando usuario...</span>
                    </div>
                  )}
                  
                  {syncError && (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>Error: {syncError}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </nav>
            
            <div className="absolute bottom-4 left-4 right-4 text-xs text-muted-foreground text-center pt-2 border-t border-border">
              LUMO v1.0
            </div>
          </div>
        </div>
      )}
    </>
  );
} 