"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, Server, BarChart, XCircle } from "lucide-react";
import { toast } from "sonner";

// Tipos para las estadísticas
interface QueryStat {
  query: string;
  count: number;
  totalTimeMs: number;
  avgTimeMs: number;
}

interface CacheStats {
  cacheSize: number;
  hits: number;
  misses: number;
  hitRate: string | number;
}

interface SystemStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  uptime: number;
  databaseConnected: boolean;
}

interface DbStats {
  timestamp: string;
  queries: QueryStat[];
  cache: CacheStats;
  system: SystemStats;
}

export default function DatabaseStatsClient() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/db-stats');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching database stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al obtener estadísticas', {
        description: err instanceof Error ? err.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  // Efecto para la carga inicial y refresco automático
  useEffect(() => {
    fetchStats();
    
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(fetchStats, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  // Formatear tiempo legible
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error al cargar estadísticas</h3>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Button onClick={fetchStats} variant="outline">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            onClick={fetchStats} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            {autoRefresh ? 'Detener' : 'Auto'} Refresco
          </Button>
        </div>
        
        {stats && (
          <div className="text-sm text-muted-foreground">
            Última actualización: {new Date(stats.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {!stats ? (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Cargando estadísticas...</p>
        </div>
      ) : (
        <Tabs defaultValue="queries" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="queries">
              <Database className="h-4 w-4 mr-2" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="cache">
              <BarChart className="h-4 w-4 mr-2" />
              Caché
            </TabsTrigger>
            <TabsTrigger value="system">
              <Server className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="queries" className="space-y-4">
            <Table>
              <TableCaption>Estadísticas de consultas a la base de datos</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Consulta</TableHead>
                  <TableHead className="text-center">Ejecuciones</TableHead>
                  <TableHead className="text-center">Tiempo Total (ms)</TableHead>
                  <TableHead className="text-center">Tiempo Promedio (ms)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.queries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No hay consultas registradas aún
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.queries
                    .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
                    .map((query, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{query.query}</TableCell>
                        <TableCell className="text-center">{query.count}</TableCell>
                        <TableCell className="text-center">{query.totalTimeMs}</TableCell>
                        <TableCell className="text-center">{query.avgTimeMs}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Tamaño de Caché</div>
                <div className="text-3xl font-bold">{stats.cache.cacheSize}</div>
                <div className="text-xs text-muted-foreground mt-1">objetos en caché</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Tasa de Aciertos</div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold">{stats.cache.hitRate}%</div>
                </div>
                <Progress value={Number(stats.cache.hitRate)} className="h-2 mt-2" />
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Aciertos</div>
                <div className="text-3xl font-bold">{stats.cache.hits}</div>
                <div className="text-xs text-muted-foreground mt-1">consultas aceleradas</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Fallos</div>
                <div className="text-3xl font-bold">{stats.cache.misses}</div>
                <div className="text-xs text-muted-foreground mt-1">consultas completas</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Estado de Conexión</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-3 w-3 rounded-full ${stats.system.databaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="font-medium">
                    {stats.system.databaseConnected ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Tiempo de Actividad</div>
                <div className="text-3xl font-bold">{formatUptime(stats.system.uptime)}</div>
                <div className="text-xs text-muted-foreground mt-1">desde el último reinicio</div>
              </div>
              
              <div className="p-4 border rounded-lg col-span-2">
                <div className="text-sm font-medium mb-2">Uso de Memoria</div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <div>Heap Usado</div>
                      <div>{stats.system.heapUsed} MB</div>
                    </div>
                    <Progress value={(stats.system.heapUsed / stats.system.heapTotal) * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <div>Heap Total</div>
                      <div>{stats.system.heapTotal} MB</div>
                    </div>
                    <Progress value={100} className="h-2 bg-muted" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <div>RSS (Resident Set Size)</div>
                      <div>{stats.system.rss} MB</div>
                    </div>
                    <Progress 
                      value={(stats.system.rss / (stats.system.heapTotal * 2)) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 