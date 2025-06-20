'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Shield, User, AlertTriangle } from 'lucide-react';

export default function FixRootRolePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  const checkCurrentStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/fix-root-user-role');
      const data = await response.json();
      setCurrentStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
      setCurrentStatus({ success: false, error: 'Failed to check status' });
    } finally {
      setChecking(false);
    }
  };

  const fixRootRole = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/fix-root-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(data);
      
      // Actualizar el estado actual después de la corrección
      if (data.success) {
        await checkCurrentStatus();
      }
    } catch (error) {
      console.error('Error fixing role:', error);
      setResult({ success: false, error: 'Failed to fix role' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔧 Corrección de Rol de Usuario Root</h1>
        <p className="text-muted-foreground">
          Esta página te permite corregir el rol de tu usuario root de USER a ADMIN para acceder a todas las funciones del sidebar.
        </p>
      </div>

      {/* Estado Actual */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Estado Actual del Usuario
          </CardTitle>
          <CardDescription>
            Verifica el rol actual de tu usuario root
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={checkCurrentStatus} 
              disabled={checking}
              variant="outline"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Estado
                </>
              )}
            </Button>
          </div>

          {currentStatus && (
            <div className="space-y-3">
              {currentStatus.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>Email:</strong> {currentStatus.user?.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Rol Actual:</strong>
                    <Badge variant={currentStatus.user?.role === 'ADMIN' ? 'default' : 'destructive'}>
                      {currentStatus.user?.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Estado:</strong>
                    <Badge variant={currentStatus.user?.is_active ? 'default' : 'secondary'}>
                      {currentStatus.user?.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  {currentStatus.needsUpdate && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>¡Necesita actualización a ADMIN!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>Error: {currentStatus.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Corrección de Rol */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Corregir Rol a ADMIN
          </CardTitle>
          <CardDescription>
            Actualiza tu rol de USER a ADMIN para acceder al sidebar completo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">¿Qué hace esta corrección?</h4>
              <ul className="text-sm space-y-1">
                <li>• Actualiza tu rol de USER a ADMIN en la base de datos</li>
                <li>• Te permite ver las opciones "Usuarios" y "Configuración" en el sidebar</li>
                <li>• Mantiene tu cuenta activa y funcional</li>
                <li>• Es seguro y reversible</li>
              </ul>
            </div>

            <Button 
              onClick={fixRootRole} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Corrigiendo Rol...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Corregir Rol a ADMIN
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado de la Corrección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-semibold">{result.message}</span>
                  </div>
                  
                  {result.instructions && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Próximos pasos:</h4>
                      <ol className="text-sm space-y-1">
                        {result.instructions.map((instruction: string, index: number) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">Detalles del usuario:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Email:</strong> {result.user?.email}</div>
                      <div><strong>Rol:</strong> <Badge>{result.user?.role}</Badge></div>
                      <div><strong>Activo:</strong> {result.user?.is_active ? 'Sí' : 'No'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Error: {result.error}</span>
                  </div>
                  {result.details && (
                    <div className="text-sm text-gray-600">
                      Detalles: {result.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 