'use server'

/**
 * Categories Server Actions
 * Maneja todas las operaciones de base de datos para categorías
 * Evita imports directos de db en páginas
 */

export async function getCategoriesData() {
  try {
    // Importación dinámica de db para evitar ejecución durante build
    const { db } = await import('@/lib/db-supabase');
    
    const categories = await db.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return {
      categories,
      error: null
    };
  } catch (error) {
    console.error('Error loading categories:', error);
    return {
      categories: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteCategory(id: string) {
  try {
    const { db } = await import('@/lib/db-supabase');
    
    await db.category.delete({
      where: { id }
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 