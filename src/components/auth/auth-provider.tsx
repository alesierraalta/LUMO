"use client";

import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  isAdmin: boolean;
  userRole: string | null;
  syncingUser: boolean;
  syncError: string | null;
  retrySyncUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoaded: false,
  isSignedIn: null,
  userId: null,
  isAdmin: false,
  userRole: null,
  syncingUser: false,
  syncError: null,
  retrySyncUser: async () => {},
});

export const useAppAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Check if we should skip Clerk authentication
  const skipClerkAuth = process.env.NEXT_PUBLIC_SKIP_CLERK_AUTH === 'true';
  
  // Create state variables for auth state
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [syncingUser, setSyncingUser] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Default values for when Clerk is not available
  let isLoaded = true;
  let isSignedIn: boolean | null = false;
  let userId: string | null = null;
  let user: any = null;
  let signOut: any = async () => {};
  
  // Si skipClerkAuth es true, no intentamos usar los hooks de Clerk
  if (!skipClerkAuth) {
    try {
      // Use Clerk hooks inside a try/catch to handle potential errors
      const auth = useAuth();
      const userResult = useUser();
      const clerk = useClerk();
      
      isLoaded = auth.isLoaded;
      isSignedIn = auth.isSignedIn ?? false;
      userId = auth.userId ?? null;
      user = userResult.user;
      signOut = clerk.signOut;
    } catch (error: any) {
      console.error("Error using Clerk hooks:", error);
      // Usamos useState para no causar un bucle infinito de renderizaciones
      if (!authError) {
        setAuthError(error.message || "Failed to initialize authentication");
      }
    }
  }

  // Sync user with our database
  const syncUser = async () => {
    if (skipClerkAuth) {
      // En modo de desarrollo, simular un usuario admin
      setIsAdmin(true);
      setUserRole("admin");
      return;
    }
    
    if (!isLoaded || !isSignedIn || !userId) return;
    
    try {
      setSyncingUser(true);
      setSyncError(null);
      
      const response = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sync user");
      }

      const data = await response.json();
      
      if (data.success) {
        setUserRole(data.user?.role || null);
        setIsAdmin(data.user?.role === "admin");
        setShowErrorDialog(false);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error syncing user:", error);
      setSyncError(error.message || "Failed to sync user");
      setIsAdmin(false);
      setUserRole(null);
      setShowErrorDialog(true);
    } finally {
      setSyncingUser(false);
    }
  };

  const handleSignOut = () => {
    if (skipClerkAuth) {
      window.location.href = '/';
    } else {
      signOut().then(() => { window.location.href = '/'; });
    }
  };

  // Sync user when auth state changes
  useEffect(() => {
    if (!skipClerkAuth && isSignedIn) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, userId, user, skipClerkAuth]);

  // If skipping Clerk auth during build, provide a mock auth context
  if (skipClerkAuth) {
    return (
      <AuthContext.Provider value={{ 
        isLoaded: true, 
        isSignedIn: true, 
        userId: "mock-user-id", 
        isAdmin: true, 
        userRole: "admin", 
        syncingUser: false, 
        syncError: null, 
        retrySyncUser: async () => {} 
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Check for Clerk initialization errors
  if (authError) {
    return (
      <AuthContext.Provider value={{ 
        isLoaded: true, 
        isSignedIn: false, 
        userId: null, 
        isAdmin: false, 
        userRole: null, 
        syncingUser: false, 
        syncError: authError, 
        retrySyncUser: async () => {} 
      }}>
        {children}
        
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error de Autenticación
              </DialogTitle>
              <DialogDescription>
                Hubo un problema con el sistema de autenticación: {authError}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm">
              Este error puede ocurrir si las claves de API de autenticación no están configuradas correctamente.
              Por favor contacte al administrador del sistema.
            </p>
            <DialogFooter className="flex sm:justify-between">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AuthContext.Provider>
    );
  }

  // Otherwise use Clerk
  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        userId,
        isAdmin,
        userRole,
        syncingUser,
        syncError,
        retrySyncUser: syncUser,
      }}
    >
      {children}
      
      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error de Sincronización
            </DialogTitle>
            <DialogDescription>
              Hubo un problema sincronizando tu cuenta: {syncError}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Este error puede ocurrir si no tienes permisos suficientes o si hay un problema con tu cuenta.
            Puedes intentar nuevamente o cerrar sesión y contactar al administrador.
          </p>
          <DialogFooter className="flex sm:justify-between">
            <Button 
              variant="outline" 
              onClick={syncUser}
              disabled={syncingUser}
              className="gap-2"
            >
              {syncingUser ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Intentando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </>
              )}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="gap-2"
            >
              Cerrar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
} 