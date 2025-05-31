'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function MovementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Movements page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center border-b pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Error en Movimientos de Inventario
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="p-3 bg-amber-50 rounded-full inline-flex mx-auto">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Lo sentimos, ocurrió un error al cargar los datos de movimientos de inventario.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-slate-100 rounded text-xs text-left overflow-auto max-h-32">
                <p className="font-medium">Error:</p>
                <p className="text-red-600">{error.message}</p>
                {error.stack && (
                  <>
                    <p className="font-medium mt-2">Stack:</p>
                    <pre className="text-xs whitespace-pre-wrap">
                      {error.stack.split('\n').slice(0, 3).join('\n')}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4 pt-2">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Intentar nuevamente
          </Button>
          
          <Button asChild variant="default">
            <Link href="/inventory" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Volver a Inventario
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 