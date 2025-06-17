import { serializeDecimal } from '@/lib/utils';
import { StockStatus } from '@/lib/inventory-utils';
import { StockMovementInput } from "@/lib/inventory-utils";
import { db, supabase } from '@/lib/db-supabase';

// Movement types enum
enum MovementType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  INITIAL = 'INITIAL'
}

/**
 * Obtiene todos los elementos de inventario
 */
export async function getAllInventoryItems() {
  const items = await db.inventoryItem.findMany({
    include: {
      category: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  return serializeDecimal(items);
}

/**
 * Obtiene un elemento de inventario por ID
 */
export async function getInventoryItemById(id: string) {
  const item = await db.inventoryItem.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
        },
      locationRelation: {
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
        },
      },
    },
  });
  return serializeDecimal(item);
}

/**
 * Obtiene un elemento de inventario por SKU
 */
export async function getInventoryItemBySku(sku: string) {
  const items = await db.inventoryItem.findMany({
    where: {
      OR: [
        { sku: { contains: sku, mode: 'insensitive' } },
        { name: { contains: sku, mode: 'insensitive' } },
      ],
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
        },
      locationRelation: {
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
        },
      },
    },
    take: 10,
  });
  return serializeDecimal(items);
}

/**
 * Actualiza el nivel mínimo de stock de un producto
 */
export async function updateMinStockLevel(inventoryItemId: string, minLevel: number) {
  return db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { minStockLevel: minLevel },
  });
}

/**
 * Actualiza la ubicación de un producto
 */
export async function updateItemLocation(inventoryItemId: string, location: string) {
  // First, get the item to check current location  
  const item = await db.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    select: { location: true, name: true },
  });

  return db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { 
      location,
      lastUpdated: new Date(),
    },
  });
}

/**
 * Agrega stock a un producto
 */
export async function addStock(inventoryItemId: string, quantity: number, notes?: string, createdBy?: string) {
  if (quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0");
  }

  // Note: Supabase doesn't have transactions like Prisma, so we'll handle this sequentially
  // In a production environment, you might want to use Supabase's RPC functions for atomic operations
  
  // Obtener el producto actual
  const currentItem = await db.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!currentItem) {
    throw new Error("Producto no encontrado");
  }

  // Calcular nueva cantidad
  const newQuantity = currentItem.quantity + quantity;

  // Actualizar el producto
  const updatedItem = await db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: {
      quantity: newQuantity,
      lastUpdated: new Date(),
    },
  });

  // Crear movimiento de stock
  await db.stockMovement.create({
    data: {
      inventoryItemId,
      quantity,
      type: MovementType.STOCK_IN,
      notes: notes || `Stock añadido: ${quantity}`,
      createdBy,
    },
  });

  return serializeDecimal(updatedItem);
}

/**
 * Remueve stock de un producto
 */
export async function removeStock(inventoryItemId: string, quantity: number, notes?: string, createdBy?: string) {
  if (quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0");
  }

  // Obtener el producto actual
  const currentItem = await db.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!currentItem) {
    throw new Error("Producto no encontrado");
  }

  // Verificar que hay suficiente stock
  if (currentItem.quantity < quantity) {
    throw new Error(
      `Stock insuficiente. Disponible: ${currentItem.quantity}, Solicitado: ${quantity}`
    );
  }

  // Calcular nueva cantidad
  const newQuantity = currentItem.quantity - quantity;

  // Actualizar el producto
  const updatedItem = await db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: {
      quantity: newQuantity,
      lastUpdated: new Date(),
    },
  });

  // Crear movimiento de stock
  await db.stockMovement.create({
    data: {
      inventoryItemId,
      quantity: -quantity, // Negativo para indicar salida
      type: MovementType.STOCK_OUT,
      notes: notes || `Stock removido: ${quantity}`,
      createdBy,
    },
  });

  return serializeDecimal(updatedItem);
}

/**
 * Ajusta el stock de un producto a una cantidad específica
 */
export async function adjustStock(inventoryItemId: string, newQuantity: number, notes?: string, createdBy?: string) {
  if (newQuantity < 0) {
    throw new Error("La cantidad no puede ser negativa");
  }

  // Obtener el producto actual
  const currentItem = await db.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!currentItem) {
    throw new Error("Producto no encontrado");
  }

  const difference = newQuantity - currentItem.quantity;

  // Actualizar el producto
  const updatedItem = await db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: {
      quantity: newQuantity,
      lastUpdated: new Date(),
    },
  });

  // Crear movimiento de stock
  await db.stockMovement.create({
    data: {
      inventoryItemId,
      quantity: difference,
      type: MovementType.ADJUSTMENT,
      notes: notes || `Ajuste de stock: ${currentItem.quantity} → ${newQuantity}`,
      createdBy,
    },
  });

  return serializeDecimal(updatedItem);
}

/**
 * Obtiene el historial de movimientos de stock para un producto
 */
export async function getStockMovementHistory(inventoryItemId: string, limit?: number) {
  const movements = await db.stockMovement.findMany({
    where: { inventoryItemId },
    orderBy: { createdAt: 'desc' },
    take: limit || 50,
    include: {
      inventoryItem: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
  });
  return serializeDecimal(movements);
}

/**
 * Obtiene todos los movimientos de stock con filtros opcionales
 */
export async function getAllStockMovements(params?: {
  limit?: number;
  page?: number;
  type?: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "INITIAL" | "all";
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  search?: string;
  sort?: string;
}) {
  const {
    limit = 50,
    page = 1,
    type = "all",
    startDate,
    endDate,
    categoryId,
    search,
    sort = "createdAt_desc"
  } = params || {};

  const skip = (page - 1) * limit;
  const [sortField, sortOrder] = sort.split('_');

  // Build where clause
  const where: any = {};

  if (type !== "all") {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (search) {
    where.OR = [
      { notes: { contains: search, mode: 'insensitive' } },
      { inventoryItem: { name: { contains: search, mode: 'insensitive' } } },
      { inventoryItem: { sku: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (categoryId) {
    where.inventoryItem = {
      categoryId: categoryId
    };
  }

  const [movements, total] = await Promise.all([
    db.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: sortOrder },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    db.stockMovement.count({ where })
  ]);

  return {
    movements: serializeDecimal(movements),
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Obtiene productos con stock bajo
 */
export async function getLowStockItems() {
  // Get all inventory items and filter in JavaScript since Supabase doesn't support column comparisons easily
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      category:categories(id, name)
    `)
    .order('quantity', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching low stock items:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Filter items where quantity <= min_stock_level OR quantity <= 5
  const lowStockItems = items?.filter((item: any) => 
    item.quantity <= item.min_stock_level || item.quantity <= 5
  ) || [];

  // Convert to expected format
  const formattedItems = lowStockItems.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    quantity: item.quantity,
    minStockLevel: item.min_stock_level,
    cost: item.cost,
    price: item.price,
    margin: item.margin,
    imageUrl: item.image_url,
    isActive: item.is_active,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    categoryId: item.category_id,
    locationId: item.location_id,
    createdById: item.created_by_id,
    category: item.category ? {
      id: item.category.id,
      name: item.category.name,
    } : null,
  }));

  return serializeDecimal(formattedItems);
}

/**
 * Obtiene productos sin stock
 */
export async function getOutOfStockItems() {
  const items = await db.inventoryItem.findMany({
    where: { quantity: 0 },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  return serializeDecimal(items);
}

/**
 * Genera alertas de stock
 */
export async function generateStockAlerts() {
  const lowStockItems = await getLowStockItems();
  const outOfStockItems = await getOutOfStockItems();

  return {
    lowStock: lowStockItems,
    outOfStock: outOfStockItems,
    totalAlerts: lowStockItems.length + outOfStockItems.length,
  };
}

/**
 * Elimina un elemento de inventario
 */
export async function deleteInventoryItem(inventoryItemId: string) {
  // First delete related stock movements
  await db.stockMovement.deleteMany({
    where: { inventoryItemId },
  });

  // Then delete the inventory item
  return db.inventoryItem.delete({
    where: { id: inventoryItemId },
  });
} 