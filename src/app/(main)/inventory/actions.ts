'use server'

/**
 * Inventory Server Actions
 * Maneja todas las operaciones de base de datos para inventario
 * Evita imports directos de db en páginas
 */

export async function getInventoryData(searchParams?: {
  search?: string;
  category?: string;
  location?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  try {
    // Importación dinámica de db para evitar ejecución durante build
    const { db } = await import('@/lib/db-supabase');
    
    // Build where clause
    const where: any = {};
    
    if (searchParams?.search) {
      where.OR = [
        { name: { contains: searchParams.search } },
        { sku: { contains: searchParams.search } },
        { description: { contains: searchParams.search } },
      ];
    }
    
    if (searchParams?.category) {
      where.categoryId = searchParams.category;
    }
    
    if (searchParams?.location) {
      where.locationId = searchParams.location;
    }
    
    if (searchParams?.status) {
      if (searchParams.status === 'low-stock') {
        where.quantity = { lte: 10 }; // Assuming 10 is low stock threshold
      } else if (searchParams.status === 'out-of-stock') {
        where.quantity = { lte: 0 };
      }
    }

    // Build order clause
    const orderBy: any = {};
    if (searchParams?.sortBy) {
      orderBy[searchParams.sortBy] = searchParams?.sortOrder || 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const [items, categories, locations] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        include: {
          category: true,
          location: true,
        },
        orderBy,
      }),
      db.category.findMany({
        orderBy: { name: 'asc' }
      }),
      db.location.findMany({
        orderBy: { name: 'asc' }
      })
    ]);

    return {
      items,
      categories,
      locations,
      error: null
    };
  } catch (error) {
    console.error('Error loading inventory data:', error);
    return {
      items: [],
      categories: [],
      locations: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 