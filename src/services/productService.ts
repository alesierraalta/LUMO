import { serializeDecimal } from '@/lib/utils';
import { db } from '@/lib/db-supabase';

const prisma = db;

/**
 * Tipo para crear un nuevo producto
 */
export type CreateProductInput = {
  name: string;
  description?: string;
  sku?: string;
  cost?: number;
  price?: number;
  categoryId?: string;
  locationId?: string;
  currentStock?: number;
  minLevel?: number;
  maxLevel?: number;
  barcode?: string;
  createdById: string;
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
  categoryId?: string | null;
  locationId?: string | null;
  isActive?: boolean;
  currentStock?: number;
  minLevel?: number;
  maxLevel?: number;
  barcode?: string;
};

/**
 * Tipo para opciones de ordenamiento
 */
export type SortOrder = "asc" | "desc";

// Validation functions
function validateSKU(sku: string): boolean {
  return sku.trim().length > 0;
}

function validateDecimalPlaces(value: number): boolean {
  const decimals = value.toString().split('.')[1];
  return !decimals || decimals.length <= 2;
}

function validateName(name: string): boolean {
  return name.length >= 1 && name.length <= 100;
}

function validateDescription(description: string | undefined): boolean {
  if (!description) return true;
  return description.length <= 500;
}

function validateQuantity(quantity: number | undefined): boolean {
  if (quantity === undefined) return true;
  return Number.isInteger(quantity) && quantity >= 0;
}

function validateMinLevel(level: number | undefined): boolean {
  if (level === undefined) return true;
  return Number.isInteger(level) && level >= 0;
}

/**
 * Obtiene todos los productos
 */
export async function getAllProducts(includeInactive = false) {
  const items = await prisma.inventoryItem.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      category: true,
      location: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Add calculated margin for each item
  const processedItems = items.map(item => ({
    ...item,
    margin: item.cost > 0 ? ((item.price - item.cost) / item.cost) * 100 : 0,
  }));
  
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
      location: true,
    },
  });
  
  if (!product) return null;

  // Add calculated margin
  const productWithMargin = {
    ...product,
    margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
  };
  
  return serializeDecimal(productWithMargin);
}

/**
 * Obtiene productos por categoría
 */
export async function getProductsByCategory(categoryId: string) {
  const products = await prisma.inventoryItem.findMany({
    where: {
      categoryId,
      isActive: true,
    },
    include: {
      category: true,
      location: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Add calculated margin for each item
  const processedProducts = products.map(product => ({
    ...product,
    margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
  }));
  
  return serializeDecimal(processedProducts);
}

/**
 * Obtiene productos por rango de margen calculado
 */
export async function getProductsByMarginRange(minMargin: number, maxMargin: number, includeInactive = false) {
  const products = await prisma.inventoryItem.findMany({
    where: {
      isActive: includeInactive ? undefined : true,
      cost: { gt: 0 }, // Only include items with cost > 0 for margin calculation
    },
    include: {
      category: true,
      location: true,
    },
  });

  // Filter by calculated margin and add margin field
  const filteredProducts = products
    .map(product => ({
      ...product,
      margin: ((product.price - product.cost) / product.cost) * 100,
    }))
    .filter(product => product.margin >= minMargin && product.margin <= maxMargin)
    .sort((a, b) => a.margin - b.margin);
  
  return serializeDecimal(filteredProducts);
}

/**
 * Busca productos por nombre, SKU o descripción
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
  const searchTerm = query.toLowerCase();
  
  const products = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: searchTerm } },
        { sku: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { barcode: { contains: searchTerm } },
      ],
    },
    include: {
      category: true,
      location: true,
    },
  });

  // Add calculated margin and apply filters
  let processedProducts = products.map(product => ({
    ...product,
    margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
  }));

  // Apply margin filters if provided
  if (options?.minMargin !== undefined && options?.maxMargin !== undefined) {
    processedProducts = processedProducts.filter(
      product => product.margin >= options.minMargin! && product.margin <= options.maxMargin!
    );
  }

  // Apply sorting
  if (options?.sortBy) {
    const sortOrder = options.sortOrder || 'asc';
    processedProducts.sort((a, b) => {
      const aValue = (a as any)[options.sortBy!];
      const bValue = (b as any)[options.sortBy!];
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });
  }
  
  return serializeDecimal(processedProducts);
}

/**
 * Crea un nuevo producto
 */
export async function createProduct(productData: CreateProductInput) {
  // Validation
  if (!validateName(productData.name)) {
    throw new Error("Product name must be between 1 and 100 characters");
  }
  
  if (productData.description && !validateDescription(productData.description)) {
    throw new Error("Product description must be 500 characters or less");
  }
  
  if (productData.sku && !validateSKU(productData.sku)) {
    throw new Error("Invalid SKU format");
  }
  
  if (productData.cost && !validateDecimalPlaces(productData.cost)) {
    throw new Error("Cost can have at most 2 decimal places");
  }
  
  if (!validateDecimalPlaces(productData.price || 0)) {
    throw new Error("Price can have at most 2 decimal places");
  }
  
  if (productData.currentStock && !validateQuantity(productData.currentStock)) {
    throw new Error("Current stock must be a non-negative integer");
  }
  
  if (productData.minLevel && !validateMinLevel(productData.minLevel)) {
    throw new Error("Minimum level must be a non-negative integer");
  }

  // Check for SKU uniqueness if provided
  if (productData.sku) {
    const existingSKU = await prisma.inventoryItem.findUnique({
      where: { sku: productData.sku },
    });
    
    if (existingSKU) {
      throw new Error("A product with this SKU already exists");
    }
  }

  const product = await prisma.inventoryItem.create({
    data: {
      name: productData.name,
      description: productData.description,
      sku: productData.sku,
      barcode: productData.barcode,
      currentStock: productData.currentStock || 0,
      minLevel: productData.minLevel || 0,
      maxLevel: productData.maxLevel,
      cost: productData.cost || 0,
      price: productData.price || 0,
      categoryId: productData.categoryId,
      locationId: productData.locationId,
      createdById: productData.createdById,
    },
    include: {
      category: true,
      location: true,
    },
  });

  // Add calculated margin
  const productWithMargin = {
    ...product,
    margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
  };
  
  return serializeDecimal(productWithMargin);
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(id: string, productData: UpdateProductInput) {
  // Validation
  if (productData.name && !validateName(productData.name)) {
    throw new Error("Product name must be between 1 and 100 characters");
  }
  
  if (productData.description && !validateDescription(productData.description)) {
    throw new Error("Product description must be 500 characters or less");
  }
  
  if (productData.sku && !validateSKU(productData.sku)) {
    throw new Error("Invalid SKU format");
  }
  
  if (productData.cost && !validateDecimalPlaces(productData.cost)) {
    throw new Error("Cost can have at most 2 decimal places");
  }
  
  if (productData.price && !validateDecimalPlaces(productData.price)) {
    throw new Error("Price can have at most 2 decimal places");
  }
  
  if (productData.currentStock && !validateQuantity(productData.currentStock)) {
    throw new Error("Current stock must be a non-negative integer");
  }
  
  if (productData.minLevel && !validateMinLevel(productData.minLevel)) {
    throw new Error("Minimum level must be a non-negative integer");
  }

  // Check for SKU uniqueness if updating SKU
  if (productData.sku) {
    const existingSKU = await prisma.inventoryItem.findFirst({
      where: { 
        sku: productData.sku,
        id: { not: id }
      },
    });
    
    if (existingSKU) {
      throw new Error("A product with this SKU already exists");
    }
  }

  const product = await prisma.inventoryItem.update({
    where: { id },
    data: productData,
    include: {
      category: true,
      location: true,
    },
  });

  // Add calculated margin
  const productWithMargin = {
    ...product,
    margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
  };
  
  return serializeDecimal(productWithMargin);
}

/**
 * Desactiva un producto
 */
export async function deactivateProduct(id: string) {
  const product = await prisma.inventoryItem.update({
    where: { id },
    data: { isActive: false },
    include: {
      category: true,
      location: true,
    },
  });

  // Add calculated margin
  const productWithMargin = {
    ...product,
    margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
  };
  
  return serializeDecimal(productWithMargin);
}

/**
 * Elimina un producto
 */
export async function deleteProduct(id: string) {
  await prisma.inventoryItem.delete({
    where: { id },
  });
  
  return { success: true };
}

/**
 * Obtiene todas las categorías
 */
export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { inventoryItems: true }
      }
    },
    orderBy: { name: 'asc' },
  });
  
  return serializeDecimal(categories);
}

/**
 * Crea una nueva categoría
 */
export async function createCategory(name: string, description?: string, createdById?: string) {
  if (!createdById) {
    throw new Error("createdById is required");
  }

  const category = await prisma.category.create({
    data: {
      name,
      description: description || "",
      createdById,
    },
  });
  
  return serializeDecimal(category);
}

/**
 * Actualiza una categoría
 */
export async function updateCategory(id: string, name: string, description?: string) {
  const category = await prisma.category.update({
    where: { id },
    data: { name, description },
  });
  
  return serializeDecimal(category);
}

/**
 * Elimina una categoría
 */
export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  return { success: true };
}

/**
 * Obtiene productos con stock bajo
 */
export async function getProductsWithLowStock() {
  // Get all active products
  const products = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: true,
      location: true,
    },
    orderBy: { currentStock: 'asc' },
  });

  // Filter products where currentStock is less than or equal to minLevel and add calculated margin
  const lowStockProducts = products
    .filter(product => product.currentStock <= product.minLevel)
    .map(product => ({
      ...product,
      margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
    }));
  
  return serializeDecimal(lowStockProducts);
}

/**
 * Obtiene productos con parámetros de búsqueda
 */
export async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const location = typeof searchParams.location === 'string' ? searchParams.location : undefined;
  const includeInactive = searchParams.includeInactive === 'true';

  const where: Prisma.InventoryItemWhereInput = {
    isActive: includeInactive ? undefined : true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (location) {
    where.locationId = location;
  }

  const products = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: true,
      location: true,
    },
    orderBy: { name: 'asc' },
  });

  // Add calculated margin for each item
  const processedProducts = products.map(product => ({
    ...product,
    margin: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
  }));

  return serializeDecimal(processedProducts);
} 