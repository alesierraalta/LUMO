"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function RootPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // Si está autenticado, ir a la página principal de la app (dashboard)
        // El dashboard está dentro del grupo de rutas (main)
        router.push("/dashboard");
      } else {
        // Si no está autenticado, ir a la página de login
        router.push("/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Página de carga mientras se determina el estado de autenticación
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-lg text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
