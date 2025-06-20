'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, User, Settings, Shield } from 'lucide-react';

export default function DebugPermissionsPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-permissions');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Error fetching debug data:', error);
      setDebugData({ error: 'Failed to fetch debug data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  const criticalPermissions = [
    { id: 'users:view', label: 'Ver Usuarios', icon: User },
    { id: 'settings:view', label: 'Ver Configuración', icon: Settings },
    { id: 'permissions:view', label: 'Ver Permisos', icon: Shield },
  ];

  if (loading && !debugData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando información de permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug de Permisos</h1>
          <p className="text-muted-foreground">
            Información detallada sobre permisos del usuario actual en producción
          </p>
        </div>
        <Button onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Información de Debug del Servidor */}
      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Debug del Servidor</CardTitle>
            <CardDescription>
              Información detallada desde el servidor (actualizada: {new Date().toLocaleString()})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {debugData.error ? (
              <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                <p className="font-medium">Error:</p>
                <p>{debugData.error}</p>
                {debugData.message && <p className="text-sm mt-2">{debugData.message}</p>}
                {debugData.authError && <p className="text-sm mt-2">Auth Error: {debugData.authError}</p>}
                {debugData.dbError && <p className="text-sm mt-2">DB Error: {debugData.dbError}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Usuario en Base de Datos:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(debugData.user, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Permisos del Sidebar:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {Object.entries(debugData.sidebarPermissions || {}).map(([key, value]) => (
                      <Badge key={key} variant={value ? 'default' : 'secondary'}>
                        {key}: {value ? '✓' : '✗'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Diagnóstico:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {debugData.isAdmin ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Es Admin: {debugData.isAdmin ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {debugData.shouldShowUsers ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Debería mostrar Usuarios: {debugData.shouldShowUsers ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {debugData.shouldShowSettings ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Debería mostrar Configuración: {debugData.shouldShowSettings ? 'Sí' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Entorno:</h4>
                  <Badge variant="outline">{debugData.environment}</Badge>
                </div>

                {debugData.rolePermissions && (
                  <div>
                    <h4 className="font-medium mb-2">Permisos del Rol ({debugData.user?.role}):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {debugData.rolePermissions.map((permission: any) => (
                        <Badge key={permission.id} variant="outline" className="text-xs">
                          {permission.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instrucciones de Solución */}
      <Card>
        <CardHeader>
          <CardTitle>Posibles Soluciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h5 className="font-medium">Si no ves las opciones del sidebar:</h5>
              <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                <li>Verifica que tu rol sea ADMIN en la información de arriba</li>
                <li>Verifica que "Debería mostrar Usuarios" y "Debería mostrar Configuración" sean "Sí"</li>
                <li>Refresca la página principal (Ctrl+F5)</li>
                <li>Cierra sesión y vuelve a iniciar</li>
                <li>Verifica que isActive sea true</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium">Si el problema persiste:</h5>
              <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                <li>Tu usuario podría no tener rol ADMIN en la base de datos de producción</li>
                <li>Contacta al administrador del sistema</li>
                <li>Verifica la configuración de roles en Supabase</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Acceso */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Acceso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>URL de Debug:</strong> {window.location.origin}/debug-permissions</p>
            <p><strong>API Endpoint:</strong> {window.location.origin}/api/debug-permissions</p>
            <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 