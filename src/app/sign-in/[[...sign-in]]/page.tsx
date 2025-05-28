"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { shouldSkipAuth } from '@/lib/clerk-config';

export default function SignInPage() {
  const router = useRouter();
  const skipAuth = shouldSkipAuth();

  useEffect(() => {
    // Si estamos en modo sin autenticación, redirigir al dashboard
    if (skipAuth) {
      router.push('/dashboard');
    }
  }, [router, skipAuth]);

  // En modo sin autenticación, mostrar un mensaje de carga
  if (skipAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Modo de desarrollo sin autenticación</h1>
        <p className="text-gray-500 mb-8">Redirigiendo al dashboard...</p>
      </div>
    );
  }

  // En modo con autenticación, mostrar el componente SignIn de Clerk
  return (
    <div className="w-full max-w-md p-4">
      <SignIn />
    </div>
  );
} 