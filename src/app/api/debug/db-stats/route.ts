import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    // Verificar que el usuario es administrador
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    // @ts-ignore - Esta función está definida en nuestro CustomPrismaClient pero no en los tipos
    const queryStats = prisma.getQueryStats ? prisma.getQueryStats() : [];
    
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
      system: systemStats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de BD:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
} 