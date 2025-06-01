'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

export default function MovementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar el error en la consola para depuración
    console.error('Error en la página de movimientos:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-12 flex flex-col items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-xl">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Ocurrió un error</h2>
        <p className="text-red-600 mb-6">
          {error.message || 'Error al cargar los datos de movimientos de inventario.'}
        </p>
        <Button 
          onClick={reset}
          className="flex items-center gap-2"
        >
          <RotateCw className="h-4 w-4" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
} 