"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Settings, Menu, X, Users, Package, MapPin, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions-client";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  collapsed?: boolean;
  badge?: string;
}

const SidebarLink = ({ href, icon: Icon, title, collapsed = false, badge }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-md transition-colors relative",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? title : undefined}
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span>{title}</span>}
      {badge && !collapsed && (
        <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-1">
          {badge}
        </span>
      )}
    </Link>
  );
};

interface InventoryDropdownProps {
  collapsed: boolean;
  user: any;
}

const InventoryDropdown = ({ collapsed, user }: InventoryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const inventoryItems = [
    { href: "/inventory", icon: Package, title: "Productos", permission: "inventory:view" },
    { href: "/categories", icon: Tag, title: "Categorías", permission: "categories:view" },
    { href: "/locations", icon: MapPin, title: "Ubicaciones", permission: "locations:view" },
  ];

  const visibleItems = inventoryItems.filter(item => hasPermission(user, item.permission));
  const isInventoryActive = inventoryItems.some(item => pathname.startsWith(item.href));

  if (visibleItems.length === 0) return null;

  if (collapsed) {
    return (
      <div className="relative group">
        <button 
          className={cn(
            "flex items-center justify-center w-full px-2 py-3 rounded-md transition-colors",
            isInventoryActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
          )}
          title="Inventario"
        >
          <Package className="h-5 w-5" />
        </button>
        <div className="absolute left-full top-0 ml-2 w-48 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-2 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-md transition-colors text-left",
          isInventoryActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
        )}
      >
        <Package className="h-5 w-5" />
        <span>Inventario</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 ml-auto" />
        ) : (
          <ChevronRight className="h-4 w-4 ml-auto" />
        )}
      </button>
      
      {isOpen && (
        <div className="ml-8 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-md transition-colors text-sm",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface SidebarLinksProps {
  collapsed: boolean;
}

function SidebarLinks({ collapsed }: SidebarLinksProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Home - siempre visible */}
      <SidebarLink href="/" icon={Home} title="Inicio" collapsed={collapsed} />
      
      {/* Dashboard */}
      {hasPermission(user, 'dashboard:view') && (
        <SidebarLink href="/dashboard" icon={BarChart3} title="Dashboard" collapsed={collapsed} />
      )}
      
      {/* Inventario Dropdown */}
      <InventoryDropdown collapsed={collapsed} user={user} />
      
      {/* Separador para secciones administrativas */}
      {(hasPermission(user, 'users:view') || hasPermission(user, 'permissions:view') || hasPermission(user, 'settings:view')) && (
        <div className={cn("my-4", collapsed ? "border-t border-border mx-2" : "border-t border-border")}>
          {!collapsed && (
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-4 mb-2 px-1">
              Administración
            </div>
          )}
        </div>
      )}
      
      {/* Gestión de Usuarios */}
      {hasPermission(user, 'users:view') && (
        <SidebarLink href="/settings/users" icon={Users} title="Usuarios" collapsed={collapsed} />
      )}
      
      {/* Configuración */}
      {hasPermission(user, 'settings:view') && (
        <SidebarLink href="/settings" icon={Settings} title="Configuración" collapsed={collapsed} />
      )}
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user: currentUser, isLoading } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <aside className="hidden md:flex flex-col bg-card text-card-foreground border-r border-border h-screen sticky top-0 w-64">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-xl">LUMO</h2>
        </div>
        <div className="flex-1 p-4 space-y-2">
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            ))}
          </div>
        </div>
      </aside>
    );
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
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarLinks collapsed={collapsed} />
      </nav>
      
      <div className={cn("p-4 border-t border-border", collapsed && "text-center")}>
        {currentUser && !collapsed && (
          <div className="text-xs text-muted-foreground mb-1">
            {currentUser.name || currentUser.email}
          </div>
        )}
        {currentUser && !collapsed && (
          <div className="text-xs text-muted-foreground mb-2">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              currentUser.role === 'ADMIN' ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
              currentUser.role === 'MANAGER' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
              "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
            )}>
              {currentUser.role}
            </span>
          </div>
        )}
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
  const { user: currentUser, isLoading } = useAuth();
  
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
        {currentUser && (
          <div className="text-xs text-muted-foreground">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              currentUser.role === 'ADMIN' ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
              currentUser.role === 'MANAGER' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
              "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
            )}>
              {currentUser.role}
            </span>
          </div>
        )}
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
              <SidebarLinks collapsed={false} />
            </nav>
            
            {currentUser && (
              <div className="absolute bottom-4 left-4 right-4 border-t border-border pt-4">
                <div className="text-xs text-muted-foreground mb-1">
                  {currentUser.name || currentUser.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    currentUser.role === 'ADMIN' ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
                    currentUser.role === 'MANAGER' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
                    "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
                  )}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 