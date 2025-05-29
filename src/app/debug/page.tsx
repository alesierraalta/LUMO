'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface DebugData {
  timestamp: string;
  correlationId: string;
  environment: any;
  clerk: any;
  database: any;
  logging: any;
  choreo: any;
  connectivity: any;
  performance: any;
  healthSummary: any;
}

export default function DebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDebugData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status?.toLowerCase() === 'healthy' ? 'default' : 
                   status?.toLowerCase() === 'unhealthy' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando información de debug...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error al cargar debug</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDebugInfo} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!debugData) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug del Sistema</h1>
          <p className="text-muted-foreground">
            Información detallada del estado del sistema - {debugData.timestamp}
          </p>
        </div>
        <Button onClick={fetchDebugInfo} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(debugData.healthSummary?.overall)}
            Resumen de Salud del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span>Estado General:</span>
            {getStatusBadge(debugData.healthSummary?.overall)}
            <span className="text-sm text-muted-foreground">
              {debugData.healthSummary?.issueCount} problemas detectados
            </span>
          </div>
          
          {debugData.healthSummary?.issues?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600">Problemas Detectados:</h4>
              <ul className="list-disc list-inside space-y-1">
                {debugData.healthSummary.issues.map((issue: string, i: number) => (
                  <li key={i} className="text-sm text-red-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {debugData.healthSummary?.recommendations?.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="font-semibold text-blue-600">Recomendaciones:</h4>
              <ul className="list-disc list-inside space-y-1">
                {debugData.healthSummary.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-blue-600">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="clerk" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="clerk">Clerk/SSL</TabsTrigger>
          <TabsTrigger value="environment">Entorno</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
          <TabsTrigger value="choreo">Choreo</TabsTrigger>
          <TabsTrigger value="connectivity">Conectividad</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="clerk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Clerk y SSL</CardTitle>
              <CardDescription>Estado de la autenticación y corrección SSL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Clave Publicable</h4>
                  <div className="space-y-1">
                    <p>Existe: {debugData.clerk?.publishableKey?.exists ? '✅' : '❌'}</p>
                    <p>Tipo: {debugData.clerk?.publishableKey?.isProduction ? 'Producción' : 'Desarrollo'}</p>
                    <p className="text-sm text-muted-foreground">
                      {debugData.clerk?.publishableKey?.prefix}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">SSL Fix</h4>
                  <div className="space-y-1">
                    <p>Activo: {debugData.clerk?.sslFix?.active ? '✅' : '❌'}</p>
                    <p>Choreo Detectado: {debugData.clerk?.sslFix?.detectedChoreo ? '✅' : '❌'}</p>
                    <p className="text-sm text-muted-foreground">
                      {debugData.clerk?.sslFix?.strategy}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">URLs</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Problemática:</strong> {debugData.clerk?.urls?.problematic}</p>
                  <p><strong>Corregida:</strong> {debugData.clerk?.urls?.fixed}</p>
                  <p><strong>Dominio:</strong> {debugData.clerk?.urls?.domain}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Entorno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Sistema</h4>
                  <div className="space-y-1 text-sm">
                    <p>Runtime: {debugData.environment?.runtime}</p>
                    <p>NODE_ENV: {debugData.environment?.nodeEnv}</p>
                    <p>Choreo: {debugData.environment?.isChoreoDeployment ? '✅' : '❌'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Variables de Entorno</h4>
                  <div className="space-y-1 text-sm">
                    <p>Clerk Publishable: {debugData.environment?.envVars?.hasClerkPublishable ? '✅' : '❌'}</p>
                    <p>Clerk Secret: {debugData.environment?.envVars?.hasClerkSecret ? '✅' : '❌'}</p>
                    <p>Database URL: {debugData.environment?.envVars?.hasDatabaseUrl ? '✅' : '❌'}</p>
                    <p>Log Level: {debugData.environment?.envVars?.logLevel}</p>
                  </div>
                </div>
              </div>
              
              {debugData.environment?.processInfo && typeof debugData.environment.processInfo === 'object' && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Proceso</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <p>PID: {debugData.environment.processInfo.pid}</p>
                    <p>Uptime: {Math.round(debugData.environment.processInfo.uptime)}s</p>
                    <p>Platform: {debugData.environment.processInfo.platform}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(debugData.database?.status)}
                Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span>Estado:</span>
                  {getStatusBadge(debugData.database?.status)}
                </div>
                {debugData.database?.latency && (
                  <p>Latencia: {debugData.database.latency}ms</p>
                )}
                <p>Conexión: {debugData.database?.connection}</p>
                <p>Enhanced: {debugData.database?.enhanced ? '✅' : '❌'}</p>
                {debugData.database?.error && (
                  <p className="text-red-600">Error: {debugData.database.error}</p>
                )}
                {debugData.database?.reason && (
                  <p className="text-yellow-600">Razón: {debugData.database.reason}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="choreo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de Choreo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p>Detectado: {debugData.choreo?.detected ? '✅' : '❌'}</p>
                  <p>Hostname: {debugData.choreo?.hostname}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Deployment</h4>
                  <div className="space-y-1 text-sm">
                    <p>ID: {debugData.choreo?.deployment?.id}</p>
                    <p>Región: {debugData.choreo?.deployment?.region}</p>
                    <p>Entorno: {debugData.choreo?.deployment?.environment}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">SSL</h4>
                  <div className="space-y-1 text-sm">
                    <p>Problema: {debugData.choreo?.ssl?.issue}</p>
                    <p>Solución: {debugData.choreo?.ssl?.solution}</p>
                    <p>Estado: {debugData.choreo?.ssl?.status}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas de Conectividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(debugData.connectivity || {}).map(([url, status]: [string, any]) => (
                  <div key={url} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-mono">{url}</span>
                    <div className="flex items-center gap-2">
                      {status.accessible ? (
                        <Badge variant="default">✅ {status.status}</Badge>
                      ) : (
                        <Badge variant="destructive">❌ Error</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Tiempo de respuesta: {debugData.performance?.debugRequestTime}ms</p>
                <p>Timestamp del servidor: {debugData.performance?.serverTimestamp}</p>
                <p>Zona horaria: {debugData.performance?.timezone}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/debug', '_blank')}
            >
              Ver JSON Completo
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/clerk-debug', '_blank')}
            >
              Debug Específico de Clerk
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/health-advanced', '_blank')}
            >
              Salud Avanzada
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/debug/logs', '_blank')}
            >
              Ver Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 