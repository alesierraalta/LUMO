import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import { serializeDecimal } from "../lib/utils";

/**
 * Tipo para crear un nuevo producto
 */
export type CreateProductInput = {
  name: string;
  description?: string;
  sku: string;
  cost?: number;
  price: number;
  margin?: number;
  categoryId?: string;
  imageUrl?: string;
};

/**
 * Tipo para actualizar un producto existente
 */
export type UpdateProductInput = {
  name?: string;
  description?: string;
  sku?: string;
  cost?: number;
  price?: number;
  margin?: number;
  categoryId?: string | null;
  imageUrl?: string;
  active?: boolean;
};

/**
 * Tipo para opciones de ordenamiento
 */
export type SortOrder = "asc" | "desc";

/**
 * Calcula el margen de ganancia como porcentaje
 */
function calculateMargin(cost: number, price: number): number {
  if (cost === 0 || price === 0) return 0;
  return ((price - cost) / cost) * 100;
}

/**
 * Obtiene todos los productos
 */
export async function getAllProducts(includeInactive = false) {
  const products = await prisma.product.findMany({
    where: includeInactive ? {} : { active: true },
    include: {
      category: true,
      inventory: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  
  return serializeDecimal(products);
}

/**
 * Obtiene un producto por su ID
 */
export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventory: true,
    },
  });
  
  return serializeDecimal(product);
}

/**
 * Obtiene productos por categoría
 */
export async function getProductsByCategory(categoryId: string) {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      active: true,
    },
    include: {
      category: true,
      inventory: true,
    },
  });
  
  return serializeDecimal(products);
}

/**
 * Obtiene productos por rango de margen
 */
export async function getProductsByMarginRange(minMargin: number, maxMargin: number, includeInactive = false) {
  const products = await prisma.product.findMany({
    where: {
      margin: {
        gte: minMargin,
        lte: maxMargin,
      },
      active: includeInactive ? undefined : true,
    },
    include: {
      category: true,
      inventory: true,
    },
    orderBy: {
      margin: "asc",
    },
  });
  
  return serializeDecimal(products);
}

/**
 * Ordena productos por margen
 */
export async function sortProductsByMargin(order: SortOrder = "asc", includeInactive = false) {
  const products = await prisma.product.findMany({
    where: includeInactive ? {} : { active: true },
    include: {
      category: true,
      inventory: true,
    },
    orderBy: {
      margin: order,
    },
  });
  
  return serializeDecimal(products);
}

/**
 * Busca productos por nombre, descripción o SKU
 */
export async function searchProducts(
  query: string, 
  options?: { 
    minMargin?: number; 
    maxMargin?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
  }
) {
  const searchTerm = query.trim();
  const { minMargin, maxMargin, sortBy, sortOrder } = options || {};
  
  // Construir la condición WHERE
  let where: any = {
    active: true,
  };
  
  // Agregar condiciones de búsqueda por texto si hay un término de búsqueda
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
      { sku: { contains: searchTerm, mode: "insensitive" } },
    ];
  }
  
  // Agregar filtros de margen si se especifican
  if (minMargin !== undefined || maxMargin !== undefined) {
    where.margin = {};
    
    if (minMargin !== undefined) {
      where.margin.gte = minMargin;
    }
    
    if (maxMargin !== undefined) {
      where.margin.lte = maxMargin;
    }
  }
  
  // Definir el ordenamiento
  const orderBy: any = {};
  
  // Si se especifica un campo de ordenamiento, usarlo
  if (sortBy) {
    orderBy[sortBy] = sortOrder || "asc";
  } else {
    // Por defecto, ordenar por nombre
    orderBy.name = "asc";
  }
  
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      inventory: true,
    },
    orderBy,
  });
  
  return serializeDecimal(products);
}

/**
 * Crea un nuevo producto
 */
export async function createProduct(productData: CreateProductInput) {
  // Verificar si el SKU ya existe
  const existingProduct = await prisma.product.findUnique({
    where: { sku: productData.sku },
  });

  if (existingProduct) {
    throw new Error(`El SKU '${productData.sku}' ya está en uso.`);
  }

  // Calcular el margen si no se proporciona
  const cost = productData.cost || 0;
  const price = productData.price;
  const margin = productData.margin !== undefined ? 
    productData.margin : 
    calculateMargin(cost, price);

  // Crear el producto
  const product = await prisma.product.create({
    data: {
      name: productData.name,
      description: productData.description,
      sku: productData.sku,
      cost,
      price,
      margin,
      categoryId: productData.categoryId,
      imageUrl: productData.imageUrl,
      inventory: {
        create: {
          quantity: 0,
          minStockLevel: 5,
        },
      },
    },
    include: {
      category: true,
      inventory: true,
    },
  });

  return serializeDecimal(product);
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(id: string, productData: UpdateProductInput) {
  // Verificar si el producto existe
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error(`Producto con ID '${id}' no encontrado.`);
  }

  // Si se está actualizando el SKU, verificar que no esté en uso
  if (productData.sku && productData.sku !== existingProduct.sku) {
    const duplicateSku = await prisma.product.findUnique({
      where: { sku: productData.sku },
    });

    if (duplicateSku) {
      throw new Error(`El SKU '${productData.sku}' ya está en uso.`);
    }
  }

  // Preparar los datos para actualizar, calculando el margen si se modificó el costo o precio
  let updateData = { ...productData };

  // Si se actualiza el precio o el costo, recalcular el margen
  if ((productData.cost !== undefined || productData.price !== undefined) && productData.margin === undefined) {
    const newCost = productData.cost !== undefined ? productData.cost : Number(existingProduct.cost);
    const newPrice = productData.price !== undefined ? productData.price : Number(existingProduct.price);
    updateData.margin = calculateMargin(newCost, newPrice);
  }

  // Actualizar el producto
  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      inventory: true,
    },
  });
  
  return serializeDecimal(product);
}

/**
 * Desactiva un producto (soft delete)
 */
export async function deactivateProduct(id: string) {
  // Verificar si el producto existe
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error(`Producto con ID '${id}' no encontrado.`);
  }

  const product = await prisma.product.update({
    where: { id },
    data: { active: false },
  });
  
  return serializeDecimal(product);
}

/**
 * Elimina permanentemente un producto
 */
export async function deleteProduct(id: string) {
  // Verificar si el producto existe
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error(`Producto con ID '${id}' no encontrado.`);
  }

  // Al eliminar un producto, se eliminarán automáticamente sus registros de inventario relacionados
  // debido a la restricción onDelete: Cascade
  const product = await prisma.product.delete({
    where: { id },
  });
  
  return serializeDecimal(product);
}

/**
 * Obtiene todas las categorías
 */
export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
  
  return categories;
}

/**
 * Crea una nueva categoría
 */
export async function createCategory(name: string, description?: string) {
  return prisma.category.create({
    data: {
      name,
      description,
    },
  });
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategory(id: string, name: string, description?: string) {
  return prisma.category.update({
    where: { id },
    data: {
      name,
      description,
    },
  });
}

/**
 * Elimina una categoría
 */
export async function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
  });
}

export async function getProductsWithLowStock() {
  const products = await prisma.product.findMany({
    where: {
      inventory: {
        quantity: {
          lte: prisma.inventoryItem.fields.minStockLevel
        }
      }
    },
    include: {
      inventory: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return serializeDecimal(products);
}

export async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  const { page = '1', limit = '12', search, category, minPrice, maxPrice, inStock } = searchParams;

  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search.toString(), mode: 'insensitive' } },
          { sku: { contains: search.toString(), mode: 'insensitive' } }
        ]
      } : {},
      category ? { categoryId: category.toString() } : {},
      minPrice ? { price: { gte: parseFloat(minPrice.toString()) } } : {},
      maxPrice ? { price: { lte: parseFloat(maxPrice.toString()) } } : {},
      inStock === 'true' ? { inventory: { quantity: { gt: 0 } } } : {},
    ]
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: true
      },
      orderBy: {
        name: 'asc'
      },
      skip: (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
      take: parseInt(limit.toString())
    }),
    prisma.product.count({ where })
  ]);

  return {
    products: serializeDecimal(products),
    pagination: {
      total,
      pages: Math.ceil(total / parseInt(limit.toString())),
      currentPage: parseInt(page.toString()),
      perPage: parseInt(limit.toString())
    }
  };
} 