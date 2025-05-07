"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Home, Settings } from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
}

const SidebarLink = ({ href, icon: Icon, title }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-secondary"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </Link>
  );
};

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-card text-card-foreground border-r border-border h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-xl">App de Inventario</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <SidebarLink href="/" icon={Home} title="Inicio" />
        <SidebarLink href="/dashboard" icon={BarChart3} title="Panel" />
        <SidebarLink href="/inventory" icon={Boxes} title="Inventario" />
        <SidebarLink href="/settings" icon={Settings} title="Configuración" />
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Gestión de Inventario v1.0
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <div className="md:hidden flex justify-between items-center p-4 border-b border-border bg-card">
      <h2 className="font-semibold text-lg">App de Inventario</h2>
      <nav className="flex space-x-2">
        <Link href="/" className="p-2 hover:bg-secondary rounded-md">
          <Home className="h-5 w-5" />
        </Link>
        <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-md">
          <BarChart3 className="h-5 w-5" />
        </Link>
        <Link href="/inventory" className="p-2 hover:bg-secondary rounded-md">
          <Boxes className="h-5 w-5" />
        </Link>
        <Link href="/settings" className="p-2 hover:bg-secondary rounded-md">
          <Settings className="h-5 w-5" />
        </Link>
      </nav>
    </div>
  );
} 