import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { isBuildTime, safeDbOperation, getEnvironmentInfo } from '@/lib/build-time-guards';

export async function GET() {
  try {
    // During build time, return a placeholder response
    if (isBuildTime()) {
      return NextResponse.json({
        buildTime: true,
        message: 'Database stats are only available at runtime',
        environment: getEnvironmentInfo()
      });
    }

    // Only import and use Prisma at runtime
    const { prisma } = await import('@/lib/prisma');
    
    // Verificar que el usuario es administrador
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    // Safe database operations with fallbacks
    const queryStats = await safeDbOperation(async () => {
      // @ts-ignore - Esta función está definida en nuestro CustomPrismaClient pero no en los tipos
      return prisma.getQueryStats ? prisma.getQueryStats() : [];
    }, []);
    
    // Obtener estadísticas de cache
    const cacheStats = {
      cacheSize: globalThis.queryCache ? globalThis.queryCache.stats.keys : 0,
      hits: globalThis.queryCache ? globalThis.queryCache.stats.hits : 0,
      misses: globalThis.queryCache ? globalThis.queryCache.stats.misses : 0,
      hitRate: globalThis.queryCache ? 
        (globalThis.queryCache.stats.hits / 
          (globalThis.queryCache.stats.hits + globalThis.queryCache.stats.misses) * 100 || 0).toFixed(2) : 0
    };
    
    // Obtener estadísticas del sistema
    const memoryUsage = process.memoryUsage();
    const systemStats = {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
      uptime: Math.floor(process.uptime()),
      databaseConnected: !!globalThis.prismaConnected
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      queries: queryStats,
      cache: cacheStats,
      system: systemStats,
      environment: getEnvironmentInfo()
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de BD:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener estadísticas',
        environment: getEnvironmentInfo()
      },
      { status: 500 }
    );
  }
} 