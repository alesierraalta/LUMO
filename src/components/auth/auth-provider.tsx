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
  const { isLoaded, isSignedIn: clerkIsSignedIn, userId: clerkUserId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [syncingUser, setSyncingUser] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  
  // Convert potentially undefined values to required types
  const isSignedIn = clerkIsSignedIn === undefined ? null : clerkIsSignedIn;
  const userId = clerkUserId || null;

  // Sync user with our database
  const syncUser = async () => {
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
    signOut(() => { window.location.href = '/'; });
  };

  // Sync user when auth state changes
  useEffect(() => {
    syncUser();
  }, [isLoaded, isSignedIn, userId, user]);

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