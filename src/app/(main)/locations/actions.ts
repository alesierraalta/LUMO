'use server'

/**
 * Locations Server Actions
 * Maneja todas las operaciones de base de datos para ubicaciones
 * Evita imports directos de db en páginas
 */

export async function getLocationsData() {
  try {
    // Importación dinámica de db para evitar ejecución durante build
    const { db } = await import('@/lib/db-supabase');
    
    const locations = await db.location.findMany({
      include: {
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      locations,
      error: null
    };
  } catch (error) {
    console.error('Error loading locations:', error);
    return {
      locations: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 