"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Menu, X, LogOut, Settings, User as UserIcon, BarChart3, Package, ShoppingCart, Users, MapPin, Tag, FileText, AlertTriangle, TrendingUp, Archive, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission, hasAnyPermission } from '@/lib/permissions-client';

interface SidebarLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon: Icon, title, badge, collapsed, onClick }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ${
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{title}</span>
          {badge && <Badge variant="secondary" className="ml-auto">{badge}</Badge>}
        </>
      )}
    </Link>
  );
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onClose, className }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background border-r ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Inventario</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {user && (
          <>
            {/* Dashboard */}
            {hasPermission(user as any, 'dashboard:view') && (
              <SidebarLink href="/dashboard" icon={BarChart3} title="Dashboard" collapsed={collapsed} onClick={handleLinkClick} />
            )}

            {/* Inventory Section */}
            {hasAnyPermission(user as any, ['inventory:read', 'inventory:write']) && (
              <>
                <SidebarLink href="/inventory" icon={Package} title="Inventario" collapsed={collapsed} onClick={handleLinkClick} />
                {hasPermission(user as any, 'inventory:write') && (
                  <SidebarLink href="/inventory/add" icon={UserPlus} title="Agregar Producto" collapsed={collapsed} onClick={handleLinkClick} />
                )}
              </>
            )}

            {/* Sales Section */}
            {hasAnyPermission(user as any, ['sales:read', 'sales:write']) && (
              <>
                <SidebarLink href="/sales" icon={ShoppingCart} title="Ventas" collapsed={collapsed} onClick={handleLinkClick} />
                {hasPermission(user as any, 'sales:write') && (
                  <SidebarLink href="/inventory/sales/new" icon={UserPlus} title="Nueva Venta" collapsed={collapsed} onClick={handleLinkClick} />
                )}
              </>
            )}

            <Separator className="my-2" />

            {/* Management Section */}
            {hasAnyPermission(user as any, ['categories:read', 'locations:read', 'users:read']) && (
              <>
                {hasPermission(user as any, 'categories:read') && (
                  <SidebarLink href="/categories" icon={Tag} title="Categorías" collapsed={collapsed} onClick={handleLinkClick} />
                )}
                {hasPermission(user as any, 'locations:read') && (
                  <SidebarLink href="/locations" icon={MapPin} title="Ubicaciones" collapsed={collapsed} onClick={handleLinkClick} />
                )}
                {hasPermission(user as any, 'users:read') && (
                  <SidebarLink href="/settings/users" icon={Users} title="Usuarios" collapsed={collapsed} onClick={handleLinkClick} />
                )}
              </>
            )}

            <Separator className="my-2" />

            {/* Reports Section */}
            {hasPermission(user as any, 'reports:read') && (
              <>
                <SidebarLink href="/reports/low-stock" icon={AlertTriangle} title="Stock Bajo" collapsed={collapsed} onClick={handleLinkClick} />
                <SidebarLink href="/reports/sales" icon={TrendingUp} title="Reporte Ventas" collapsed={collapsed} onClick={handleLinkClick} />
                <SidebarLink href="/reports/inventory" icon={FileText} title="Reporte Inventario" collapsed={collapsed} onClick={handleLinkClick} />
              </>
            )}
          </>
        )}
      </nav>

      {/* User Section */}
      {user && (
        <div className="p-4 border-t">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any).avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <SidebarLink 
              href="/settings/profile" 
              icon={Settings} 
              title="Configuración" 
              collapsed={collapsed}
              onClick={handleLinkClick}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={`w-full justify-start gap-3 px-3 py-2 h-auto text-muted-foreground hover:text-foreground hover:bg-accent ${
                collapsed ? 'px-2' : ''
              }`}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-background border-r shadow-lg">
            <Sidebar 
              collapsed={false} 
              onToggle={() => {}} 
              onClose={() => setIsOpen(false)}
              className="border-0"
            />
          </div>
        </div>
      )}
    </>
  );
} 