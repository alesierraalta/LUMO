"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, LogIn, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarInitial } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export function UserButton() {
  const { user, loading, refetch } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Mostrar loading inmediatamente
      toast.loading('Cerrando sesión...');

      // Intentar logout por API primero
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Limpiar localStorage también
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('auth-user');
          localStorage.clear(); // Limpiar todo por seguridad
        }
        
        await refetch(); // Refresh the auth context
        toast.dismiss();
        toast.success('Sesión cerrada exitosamente');
        
        // Redireccionar y refrescar
        router.push('/login');
        setTimeout(() => {
          window.location.href = '/login'; // Fallback para asegurar redirección
        }, 100);
      } else {
        throw new Error('API logout failed');
      }
    } catch (error) {
      console.error('❌ Error en logout por API, usando fallback:', error);
      
      // Fallback: limpiar todo localmente y redireccionar
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpiar cookies manualmente
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      toast.dismiss();
      toast.success('Sesión cerrada (modo local)');
      
      // Forzar redirección
      window.location.href = '/login';
    }
  };

  const getUserInitials = (name?: string | null, email?: string) => {
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (name?: string | null, email?: string) => {
    return name || email || 'User';
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="default" size="sm">
        <Link href="/login">
          <LogIn className="h-4 w-4 mr-2" />
          Iniciar sesión
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarInitial>{getUserInitials(user.name, user.email)}</AvatarInitial>
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName(user.name, user.email)}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 