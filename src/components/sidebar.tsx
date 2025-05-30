"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Settings, Menu, X, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  collapsed?: boolean;
}

interface UserPermissions {
  dashboard: boolean;
  inventory: boolean;
  settings: boolean;
  userManagement: boolean;
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
  permissions: UserPermissions;
}

function SidebarLinks({ collapsed, permissions }: SidebarLinksProps) {
  return (
    <>
      {permissions.dashboard && (
        <SidebarLink href="/dashboard" icon={BarChart3} title="Dashboard" collapsed={collapsed} />
      )}
      {permissions.inventory && (
        <SidebarLink href="/inventory" icon={Package} title="Inventory" collapsed={collapsed} />
      )}
      {permissions.settings && (
        <SidebarLink href="/settings" icon={Settings} title="Settings" collapsed={collapsed} />
      )}
      {permissions.userManagement && (
        <SidebarLink href="/settings/users" icon={Users} title="User Management" collapsed={collapsed} />
      )}
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>({
    dashboard: false,
    inventory: false,
    settings: false,
    userManagement: false,
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Get user permissions
    const loadUserPermissions = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.pageAccess || {
            dashboard: false,
            inventory: false,
            settings: false,
            userManagement: false,
          });
        }
      } catch (error) {
        console.error('Error loading user permissions:', error);
      }
    };

    loadUserPermissions();
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
        <SidebarLink href="/" icon={Home} title="Home" collapsed={collapsed} />
        <SidebarLinks collapsed={collapsed} permissions={permissions} />
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
  const [permissions, setPermissions] = useState<UserPermissions>({
    dashboard: false,
    inventory: false,
    settings: false,
    userManagement: false,
  });
  
  useEffect(() => {
    // Get user permissions
    const loadUserPermissions = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.pageAccess || {
            dashboard: false,
            inventory: false,
            settings: false,
            userManagement: false,
          });
        }
      } catch (error) {
        console.error('Error loading user permissions:', error);
      }
    };

    loadUserPermissions();
  }, []);
  
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
                <span>Home</span>
              </Link>
              
              {permissions.dashboard && (
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              )}
              
              {permissions.inventory && (
                <Link 
                  href="/inventory" 
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  <Package className="h-5 w-5" />
                  <span>Inventory</span>
                </Link>
              )}
              
              {permissions.settings && (
                <Link 
                  href="/settings" 
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
              )}
              
              {permissions.userManagement && (
                <Link 
                  href="/settings/users" 
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  <Users className="h-5 w-5" />
                  <span>User Management</span>
                </Link>
              )}
            </nav>
            
            <div className="absolute bottom-4 left-4 right-4 border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">LUMO v1.0</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 