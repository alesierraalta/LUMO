'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode, useEffect } from 'react';
import { 
  getClerkPublishableKey, 
  clerkAppearance,
  shouldSkipAuth,
  isDevEnvironment 
} from '@/lib/clerk-config';

interface AppClerkProviderProps {
  children: ReactNode;
}

export function AppClerkProvider({ children }: AppClerkProviderProps) {
  // Si estamos en modo de omitir autenticación, no usar Clerk
  if (shouldSkipAuth()) {
    return <>{children}</>;
  }

  // Obtener la clave pública según el entorno
  const publishableKey = getClerkPublishableKey();
  
  // Mostrar información detallada en la consola para depuración
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(
        `Clerk configurado en modo: ${isDevEnvironment() ? 'DESARROLLO' : 'PRODUCCIÓN'}`,
        `\nPublishable Key: ${publishableKey.substring(0, 15)}...`
      );
    }
  }, [publishableKey]);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
} 