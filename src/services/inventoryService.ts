import { prisma } from "../lib/prisma";
import type { PrismaClient, Prisma } from "@prisma/client";
import { serializeDecimal } from "../lib/utils";

/**
 * Tipo para definir el estado del stock
 */
export enum StockStatus {
  NORMAL = "normal",
  LOW = "low",
  OUT_OF_STOCK = "out_of_stock"
}

/**
 * Tipo para crear un movimiento de stock
 */
export type StockMovementInput = {
  inventoryItemId: string;
  quantity: number;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "INITIAL";
  notes?: string;
  createdBy?: string;
};

/**
 * Obtiene todos los items de inventario
 */
export async function getAllInventoryItems() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: {
      updatedAt: "asc",
    },
  });
  return serializeDecimal(items);
}

/**
 * Obtiene un item de inventario por su ID
 */
export async function getInventoryItemById(id: string) {
  if (!id) {
    throw new Error("El ID del item de inventario es requerido");
  }
  
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: {
          date: "desc",
        },
        take: 10,
      },
    },
  });
  return serializeDecimal(item);
}

/**
 * Obtiene un item de inventario por SKU
 */
export async function getInventoryItemBySku(sku: string) {
  if (!sku) {
    throw new Error("El SKU del producto es requerido");
  }
  
  // Since sku is not directly accessible in InventoryItem, 
  // we need to query differently to find items by SKU
  const items = await prisma.inventoryItem.findMany({
    where: {
      sku: {
        equals: sku
      }
    },
    include: {
      stockMovements: {
        orderBy: {
          date: "desc",
        },
        take: 10,
      },
    },
    take: 1
  });
  
  const item = items.length > 0 ? items[0] : null;
  return serializeDecimal(item);
}

/**
 * Actualiza la cantidad mínima de stock para un item
 */
export async function updateMinStockLevel(inventoryItemId: string, minLevel: number) {
  if (minLevel < 0) {
    throw new Error("El nivel mínimo de stock no puede ser negativo");
  }

  return prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { 
      minStockLevel: minLevel,
      lastUpdated: new Date() // Set the lastUpdated date explicitly
    },
  });
}

/**
 * Actualiza la ubicación de un item en el inventario
 */
export async function updateItemLocation(inventoryItemId: string, location: string) {
  if (!inventoryItemId) {
    throw new Error("El ID del item de inventario es requerido");
  }
  
  // Verificar que el item existe
  const item = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });
  
  if (!item) {
    throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
  }

  return prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { 
      location,
      lastUpdated: new Date() // Set the lastUpdated date explicitly 
    },
  });
}

/**
 * Calcula el estado del stock basado en la cantidad actual y el nivel mínimo
 */
export function calculateStockStatus(quantity: number, minStockLevel: number): StockStatus {
  if (quantity <= 0) {
    return StockStatus.OUT_OF_STOCK;
  }
  
  if (quantity <= minStockLevel) {
    return StockStatus.LOW;
  }
  
  return StockStatus.NORMAL;
}

/**
 * Registra un movimiento de entrada de stock y actualiza la cantidad del inventario
 */
export async function addStock(inventoryItemId: string, quantity: number, notes?: string, createdBy?: string) {
  if (quantity <= 0) {
    throw new Error("La cantidad debe ser mayor que cero para entradas de stock");
  }

  return await prisma.$transaction(async (tx) => {
    // Obtener el item de inventario actual
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
    }

    // Registrar el movimiento con fecha explícita
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity,
        type: "STOCK_IN",
        notes,
        createdBy,
        date: new Date(), // Establecer fecha explícitamente
      },
    });

    // Actualizar la cantidad en el inventario
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: inventoryItem.quantity + quantity,
        lastUpdated: new Date(), // Actualizar también la fecha de última actualización
      },
    });

    return {
      movement,
      inventoryItem: updatedItem,
    };
  });
}

/**
 * Registra un movimiento de salida de stock y actualiza la cantidad del inventario
 */
export async function removeStock(inventoryItemId: string, quantity: number, notes?: string, createdBy?: string) {
  if (quantity <= 0) {
    throw new Error("La cantidad debe ser mayor que cero para salidas de stock");
  }

  return await prisma.$transaction(async (tx) => {
    // Obtener el item de inventario actual
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
    }

    // Verificar si hay suficiente stock
    if (inventoryItem.quantity < quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${inventoryItem.quantity}, Solicitado: ${quantity}`);
    }

    // Registrar el movimiento con fecha explícita
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity,
        type: "STOCK_OUT",
        notes,
        createdBy,
        date: new Date(), // Establecer fecha explícitamente
      },
    });

    // Actualizar la cantidad en el inventario
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: inventoryItem.quantity - quantity,
        lastUpdated: new Date(), // Actualizar también la fecha de última actualización
      },
    });

    return {
      movement,
      inventoryItem: updatedItem,
    };
  });
}

/**
 * Registra un ajuste de stock y actualiza la cantidad del inventario
 */
export async function adjustStock(inventoryItemId: string, newQuantity: number, notes?: string, createdBy?: string) {
  if (newQuantity < 0) {
    throw new Error("La cantidad no puede ser negativa");
  }

  return await prisma.$transaction(async (tx) => {
    // Obtener el item de inventario actual
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
    }

    // Calcular la diferencia para el registro del movimiento
    const difference = newQuantity - inventoryItem.quantity;
    const movementType = difference >= 0 ? "ADJUSTMENT" : "ADJUSTMENT";

    // Registrar el movimiento con fecha explícita
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity: Math.abs(difference),
        type: movementType,
        notes: notes || `Ajuste de stock de ${inventoryItem.quantity} a ${newQuantity}`,
        createdBy,
        date: new Date(), // Establecer fecha explícitamente
      },
    });

    // Actualizar la cantidad en el inventario
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: newQuantity,
        lastUpdated: new Date(), // Actualizar también la fecha de última actualización
      },
    });

    return {
      movement,
      inventoryItem: updatedItem,
    };
  });
}

/**
 * Obtiene el historial completo de movimientos para un item de inventario
 */
export async function getStockMovementHistory(inventoryItemId: string, limit?: number) {
  const movements = await prisma.stockMovement.findMany({
    where: {
      inventoryItemId,
    },
    orderBy: {
      date: "desc",
    },
    take: limit,
  });
  return serializeDecimal(movements);
}

/**
 * Obtiene todos los movimientos de stock con detalles del producto
 */
export async function getAllStockMovements(params?: {
  limit?: number;
  page?: number;
  type?: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "INITIAL";
  startDate?: Date;
  endDate?: Date;
}) {
  const { limit = 50, page = 1, type, startDate, endDate } = params || {};
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (type) {
    where.type = type;
  }
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = startDate;
    }
    if (endDate) {
      where.date.lte = endDate;
    }
  }
  
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip,
    }),
    prisma.stockMovement.count({ where })
  ]);
  
  return {
    data: serializeDecimal(movements),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Obtiene items con stock bajo (por debajo del nivel mínimo)
 */
export async function getLowStockItems() {
  // Use raw SQL to avoid Prisma client validation issues
  const items = await prisma.$queryRaw`
    SELECT i.*, c.name as category_name, c.id as category_id, c.description as category_description
    FROM inventory_items i
    LEFT JOIN categories c ON i."categoryId" = c.id
    WHERE i.quantity <= i."minStockLevel" AND i.quantity > 0
    ORDER BY i.quantity ASC, i.name ASC
  `;

  // Process the raw items to add the category relationship
  const processedItems = (items as any[]).map(item => {
    return {
      ...item,
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
 * Obtiene items sin stock (cantidad = 0)
 */
export async function getOutOfStockItems() {
  // Use raw SQL to avoid Prisma client validation issues
  const items = await prisma.$queryRaw`
    SELECT i.*, c.name as category_name, c.id as category_id, c.description as category_description
    FROM inventory_items i
    LEFT JOIN categories c ON i."categoryId" = c.id
    WHERE i.quantity = 0
    ORDER BY i.name ASC
  `;

  // Process the raw items to add the category relationship
  const processedItems = (items as any[]).map(item => {
    return {
      ...item,
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
 * Genera alertas para productos con stock bajo
 */
export async function generateStockAlerts() {
  const lowStockItems = await getLowStockItems();
  return serializeDecimal(lowStockItems.map((item: any) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    currentQuantity: item.quantity,
    minStockLevel: item.minStockLevel,
    status: item.quantity === 0 
      ? StockStatus.OUT_OF_STOCK 
      : StockStatus.LOW,
  })));
}

/**
 * Elimina un item de inventario y sus movimientos asociados
 */
export async function deleteInventoryItem(inventoryItemId: string) {
  if (!inventoryItemId) {
    throw new Error("El ID del item de inventario es requerido");
  }

  return await prisma.$transaction(async (tx) => {
    // Obtener el item antes de eliminarlo
    const itemToDelete = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: { 
        stockMovements: true 
      },
    });

    if (!itemToDelete) {
      throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
    }

    // Eliminar todos los movimientos asociados
    const deleteMovements = await tx.stockMovement.deleteMany({
      where: { inventoryItemId },
    });

    // Eliminar el item de inventario
    await tx.inventoryItem.delete({
      where: { id: inventoryItemId },
    });

    return {
      deleted: true,
      item: {
        id: itemToDelete.id,
        quantity: itemToDelete.quantity,
        minStockLevel: itemToDelete.minStockLevel,
        movementsDeleted: deleteMovements.count,
      },
    };
  });
} 