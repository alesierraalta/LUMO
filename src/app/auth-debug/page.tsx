'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface DebugInfo {
  success: boolean;
  authenticated?: boolean;
  user?: any;
  error?: string;
  debug?: any;
}

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug-auth');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({
        success: false,
        error: 'Error de conexión: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthMe = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      console.log('Auth/me response:', data);
      alert(`Auth/me result: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Auth/me error:', error);
      alert(`Auth/me error: ${error}`);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug de Autenticación</h1>
        
        <div className="space-y-4">
          <Button onClick={checkAuth} disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Verificar Autenticación'}
          </Button>

          <Button onClick={checkAuthMe} variant="outline">
            Probar /api/auth/me
          </Button>

          {debugInfo && (
            <div className="bg-white p-6 rounded-lg border shadow">
              <h2 className="text-xl font-semibold mb-4">Resultado del Debug</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Estado: </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    debugInfo.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.success ? 'EXITOSO' : 'ERROR'}
                  </span>
                </div>

                {debugInfo.authenticated !== undefined && (
                  <div>
                    <span className="font-medium">Autenticado: </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      debugInfo.authenticated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {debugInfo.authenticated ? 'SÍ' : 'NO'}
                    </span>
                  </div>
                )}

                {debugInfo.user && (
                  <div>
                    <span className="font-medium">Usuario: </span>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      <div>Email: {debugInfo.user.email}</div>
                      <div>Nombre: {debugInfo.user.name || 'N/A'}</div>
                      <div>Rol: {debugInfo.user.role}</div>
                      <div>Activo: {debugInfo.user.isActive ? 'Sí' : 'No'}</div>
                    </div>
                  </div>
                )}

                {debugInfo.error && (
                  <div>
                    <span className="font-medium text-red-600">Error: </span>
                    <div className="mt-1 p-3 bg-red-50 text-red-700 rounded text-sm">
                      {debugInfo.error}
                    </div>
                  </div>
                )}

                {debugInfo.debug && (
                  <div>
                    <span className="font-medium">Debug Info: </span>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                      <pre>{JSON.stringify(debugInfo.debug, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Información del Entorno</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>URL actual: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
              <div>Cookies disponibles: {typeof document !== 'undefined' ? document.cookie.split(';').length : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 