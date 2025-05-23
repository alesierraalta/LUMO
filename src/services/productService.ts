import { prisma } from "../lib/prisma";
import type { Prisma } from "../generated/prisma";
import { serializeDecimal, calculateMargin, calculatePrice } from "../lib/utils";

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
  // Inventory fields
  quantity?: number;
  minStockLevel?: number;
  location?: string;
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
  // Inventory fields
  quantity?: number;
  minStockLevel?: number;
  location?: string;
};

/**
 * Tipo para opciones de ordenamiento
 */
export type SortOrder = "asc" | "desc";

// Validation functions
function validateSKU(sku: string): boolean {
  // Remove the regex validation and just make sure it's not empty
  return sku.trim().length > 0;
}

function validateDecimalPlaces(value: number): boolean {
  const decimals = value.toString().split('.')[1];
  return !decimals || decimals.length <= 2;
}

function validateImageUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  } catch {
    return false;
  }
}

function validateName(name: string): boolean {
  return name.length >= 1 && name.length <= 100;
}

function validateDescription(description: string | undefined): boolean {
  if (!description) return true;
  return description.length <= 500;
}

// Add inventory validation functions
function validateQuantity(quantity: number | undefined): boolean {
  if (quantity === undefined) return true;
  return Number.isInteger(quantity) && quantity >= 0;
}

function validateMinStockLevel(level: number | undefined): boolean {
  if (level === undefined) return true;
  return Number.isInteger(level) && level >= 0;
}

function validateLocation(location: string | undefined): boolean {
  if (!location) return true;
  return location.length <= 100;
}

/**
 * Obtiene todos los productos
 */
export async function getAllProducts(includeInactive = false) {
  // Use raw SQL to avoid Prisma client validation issues
  let items;
  
  if (includeInactive) {
    items = await prisma.$queryRaw`
      SELECT i.*, c.name as category_name, c.id as category_id, c.description as category_description
      FROM inventory_items i
      LEFT JOIN categories c ON i."categoryId" = c.id
      ORDER BY i."createdAt" DESC
    `;
  } else {
    items = await prisma.$queryRaw`
      SELECT i.*, c.name as category_name, c.id as category_id, c.description as category_description
      FROM inventory_items i
      LEFT JOIN categories c ON i."categoryId" = c.id
      WHERE i.active = true
      ORDER BY i."createdAt" DESC
    `;
  }

  // Process the raw items to add the category relationship
  const processedItems = (items as any[]).map(item => {
    // Ensure dates are properly formatted
    const createdAt = item.createdAt ? item.createdAt.toISOString() : null;
    const updatedAt = item.updatedAt ? item.updatedAt.toISOString() : null;
    
    return {
      ...item,
      createdAt,
      updatedAt,
      category: item.category_id ? {
        id: item.category_id,
        name: item.category_name,
        description: item.category_description
      } : null
    };
  });
  
  return serializeDecimal(processedItems);
}

/**
 * Obtiene un producto por su ID
 */
export async function getProductById(id: string) {
  const product = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
  
  return serializeDecimal(product);
}

/**
 * Obtiene productos por categoría
 */
export async function getProductsByCategory(categoryId: string) {
  const products = await prisma.inventoryItem.findMany({
    where: {
      categoryId,
      active: true,
    },
    include: {
      category: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  
  return serializeDecimal(products);
}

/**
 * Obtiene productos por rango de margen
 */
export async function getProductsByMarginRange(minMargin: number, maxMargin: number, includeInactive = false) {
  const products = await prisma.inventoryItem.findMany({
    where: {
      margin: {
        gte: minMargin,
        lte: maxMargin,
      },
      active: includeInactive ? undefined : true,
    },
    include: {
      category: true,
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
  const products = await prisma.inventoryItem.findMany({
    where: includeInactive ? {} : { active: true },
    include: {
      category: true,
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
      { name: { contains: searchTerm } },
      { description: { contains: searchTerm } },
      { sku: { contains: searchTerm } },
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
  
  const products = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: true,
    },
    orderBy,
  });
  
  return serializeDecimal(products);
}

/**
 * Crea un nuevo producto
 */
export async function createProduct(productData: CreateProductInput) {
  // Validar nombre
  if (!validateName(productData.name)) {
    throw new Error('El nombre del producto es requerido y no puede exceder los 100 caracteres');
  }

  // Validar descripción
  if (productData.description && !validateDescription(productData.description)) {
    throw new Error('La descripción no puede exceder los 500 caracteres');
  }

  // Validar formato de SKU
  if (!validateSKU(productData.sku)) {
    throw new Error('El SKU es requerido');
  }

  // Validar decimales en precio y costo
  if (productData.cost && !validateDecimalPlaces(productData.cost)) {
    throw new Error('El costo debe tener máximo 2 decimales');
  }
  if (!validateDecimalPlaces(productData.price)) {
    throw new Error('El precio debe tener máximo 2 decimales');
  }

  // Validar rangos de valores
  if (productData.cost && productData.cost > 999999.99) {
    throw new Error('El costo no puede exceder los 999,999.99');
  }
  if (productData.price > 999999.99) {
    throw new Error('El precio no puede exceder los 999,999.99');
  }
  if (productData.margin && (productData.margin < 0 || productData.margin > 1000)) {
    throw new Error('El margen debe estar entre 0 y 1000%');
  }

  // Validar que el precio sea mayor que el costo
  if (productData.cost && productData.price <= productData.cost) {
    throw new Error('El precio de venta debe ser mayor que el costo');
  }

  // Validar URL de imagen
  if (productData.imageUrl && !validateImageUrl(productData.imageUrl)) {
    throw new Error('La URL de la imagen debe ser válida y terminar en una extensión de imagen válida (.jpg, .jpeg, .png, .gif, .webp)');
  }

  // Validar campos de inventario
  if (!validateQuantity(productData.quantity)) {
    throw new Error('La cantidad debe ser un número entero no negativo');
  }
  if (!validateMinStockLevel(productData.minStockLevel)) {
    throw new Error('El nivel mínimo de stock debe ser un número entero no negativo');
  }
  if (!validateLocation(productData.location)) {
    throw new Error('La ubicación no puede exceder los 100 caracteres');
  }

  // Verificar si el SKU ya existe
  const existingProduct = await prisma.inventoryItem.findUnique({
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

  // Preparar datos de inventario con valores predeterminados si no se proporcionan
  const quantity = productData.quantity !== undefined ? productData.quantity : 0;
  const minStockLevel = productData.minStockLevel !== undefined ? productData.minStockLevel : 5;
  const location = productData.location;

  // Usar una transacción para asegurar que la creación del producto y su inventario sean atómicas
  try {
  // Crear el producto
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.inventoryItem.create({
    data: {
      name: productData.name,
      description: productData.description,
      sku: productData.sku,
      cost,
      price,
      margin,
      categoryId: productData.categoryId,
      imageUrl: productData.imageUrl,
      quantity,
      minStockLevel,
      location,
    },
    include: {
      category: true,
    },
      });
      
      return newProduct;
  });

  return serializeDecimal(product);
  } catch (error: any) {
    // Capturar errores de la transacción
    console.error('Error al crear el producto:', error);
    throw new Error(error.message || 'Ha ocurrido un error al crear el producto');
  }
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(id: string, productData: UpdateProductInput) {
  // Validar nombre
  if (productData.name && !validateName(productData.name)) {
    throw new Error('El nombre del producto es requerido y no puede exceder los 100 caracteres');
  }

  // Validar descripción
  if (productData.description && !validateDescription(productData.description)) {
    throw new Error('La descripción no puede exceder los 500 caracteres');
  }

  // Validar formato de SKU si se está actualizando
  if (productData.sku && !validateSKU(productData.sku)) {
    throw new Error('El SKU es requerido');
  }

  // Validar decimales en precio y costo
  if (productData.cost !== undefined && !validateDecimalPlaces(productData.cost)) {
    throw new Error('El costo debe tener máximo 2 decimales');
  }
  if (productData.price !== undefined && !validateDecimalPlaces(productData.price)) {
    throw new Error('El precio debe tener máximo 2 decimales');
  }

  // Validar rangos de valores
  if (productData.cost !== undefined && productData.cost > 999999.99) {
    throw new Error('El costo no puede exceder los 999,999.99');
  }
  if (productData.price !== undefined && productData.price > 999999.99) {
    throw new Error('El precio no puede exceder los 999,999.99');
  }
  if (productData.margin !== undefined && (productData.margin < 0 || productData.margin > 1000)) {
    throw new Error('El margen debe estar entre 0 y 1000%');
  }

  // Validar que el precio sea mayor que el costo si ambos están definidos
  if (productData.price !== undefined && productData.cost !== undefined && productData.price <= productData.cost) {
    throw new Error('El precio de venta debe ser mayor que el costo');
  }

  // Validar URL de imagen
  if (productData.imageUrl && !validateImageUrl(productData.imageUrl)) {
    throw new Error('La URL de la imagen debe ser válida y terminar en una extensión de imagen válida (.jpg, .jpeg, .png, .gif, .webp)');
  }

  // Validar campos de inventario
  if (productData.quantity !== undefined && !validateQuantity(productData.quantity)) {
    throw new Error('La cantidad debe ser un número entero no negativo');
  }
  if (productData.minStockLevel !== undefined && !validateMinStockLevel(productData.minStockLevel)) {
    throw new Error('El nivel mínimo de stock debe ser un número entero no negativo');
  }
  if (productData.location !== undefined && !validateLocation(productData.location)) {
    throw new Error('La ubicación no puede exceder los 100 caracteres');
  }

  // Verificar si el producto existe
  const existingProduct = await prisma.inventoryItem.findUnique({
    where: { id }
  });

  if (!existingProduct) {
    throw new Error(`Producto con ID '${id}' no encontrado.`);
  }

  // Si se está actualizando el SKU, verificar que no esté en uso
  if (productData.sku && productData.sku !== existingProduct.sku) {
    const duplicateSku = await prisma.inventoryItem.findUnique({
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

  try {
    // Actualizar el producto
    const updatedProduct = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
    
    return serializeDecimal(updatedProduct);
  } catch (error: any) {
    console.error('Error al actualizar el producto:', error);
    throw new Error(error.message || 'Ha ocurrido un error al actualizar el producto');
  }
}

/**
 * Desactiva un producto (soft delete)
 */
export async function deactivateProduct(id: string) {
  // Verificar si el producto existe
  const existingProduct = await prisma.inventoryItem.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error(`Producto con ID '${id}' no encontrado.`);
  }

  const product = await prisma.inventoryItem.update({
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
  const existingProduct = await prisma.inventoryItem.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error(`Producto con ID '${id}' no encontrado.`);
  }

  // Al eliminar un producto, se eliminarán automáticamente sus registros de inventario relacionados
  // debido a la restricción onDelete: Cascade
  const product = await prisma.inventoryItem.delete({
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
        select: { inventory: true },
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
  // Use raw query since we need to compare two fields from the same record
  const products = await prisma.$queryRaw`
    SELECT * FROM inventory_items 
    WHERE quantity <= minStockLevel 
    AND active = true
    ORDER BY name ASC
  `;

  // Get category information for each product
  const productsWithCategories = await Promise.all(
    (products as any[]).map(async (product) => {
      const category = product.categoryId ? 
        await prisma.category.findUnique({ where: { id: product.categoryId } }) : 
        null;
      
      return {
        ...product,
        category
      };
    })
  );

  return serializeDecimal(productsWithCategories);
}

export async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  const { page = '1', limit = '12', search, category, minPrice, maxPrice, inStock } = searchParams;

  const where: Prisma.InventoryItemWhereInput = {};
  const conditions = [];

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search.toString() } },
        { sku: { contains: search.toString() } }
      ]
    });
  }

  if (category) {
    conditions.push({ categoryId: category.toString() });
  }

  if (minPrice) {
    conditions.push({ price: { gte: parseFloat(minPrice.toString()) } });
  }

  if (maxPrice) {
    conditions.push({ price: { lte: parseFloat(maxPrice.toString()) } });
  }

  if (inStock === 'true') {
    conditions.push({ quantity: { gt: 0 } });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const [products, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
      },
      skip: (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
      take: parseInt(limit.toString())
    }),
    prisma.inventoryItem.count({ where })
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