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
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: "asc",
      },
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
      product: true,
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
 * Obtiene un item de inventario por ID de producto
 */
export async function getInventoryItemByProductId(productId: string) {
  if (!productId) {
    throw new Error("El ID del producto es requerido");
  }
  
  const item = await prisma.inventoryItem.findUnique({
    where: { productId },
    include: {
      product: true,
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
 * Actualiza la cantidad mínima de stock para un item
 */
export async function updateMinStockLevel(inventoryItemId: string, minLevel: number) {
  if (minLevel < 0) {
    throw new Error("El nivel mínimo de stock no puede ser negativo");
  }

  return prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { minStockLevel: minLevel },
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
    data: { location },
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

  return await prisma.$transaction(async (tx: PrismaClient) => {
    // Obtener el item de inventario actual
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
    }

    // Registrar el movimiento
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity,
        type: "STOCK_IN",
        notes,
        createdBy,
      },
    });

    // Actualizar la cantidad en el inventario
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: inventoryItem.quantity + quantity,
      },
      include: {
        product: true,
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

  return await prisma.$transaction(async (tx: PrismaClient) => {
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

    // Registrar el movimiento
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity,
        type: "STOCK_OUT",
        notes,
        createdBy,
      },
    });

    // Actualizar la cantidad en el inventario
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: inventoryItem.quantity - quantity,
      },
      include: {
        product: true,
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

  return await prisma.$transaction(async (tx: PrismaClient) => {
    // Obtener el item de inventario actual
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
    }

    const difference = newQuantity - inventoryItem.quantity;

    // Registrar el movimiento
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity: Math.abs(difference),
        type: "ADJUSTMENT",
        notes: notes || `Ajuste de ${inventoryItem.quantity} a ${newQuantity} unidades`,
        createdBy,
      },
    });

    // Actualizar la cantidad en el inventario
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: newQuantity,
      },
      include: {
        product: true,
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
 * Obtiene items con stock bajo (por debajo del nivel mínimo)
 */
export async function getLowStockItems() {
  const items = await prisma.inventoryItem.findMany({
    where: {
      quantity: {
        lte: prisma.inventoryItem.fields.minStockLevel,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });
  return serializeDecimal(items);
}

/**
 * Obtiene items sin stock (cantidad = 0)
 */
export async function getOutOfStockItems() {
  const items = await prisma.inventoryItem.findMany({
    where: {
      quantity: 0,
    },
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });
  return serializeDecimal(items);
}

/**
 * Genera alertas para productos con stock bajo
 */
export async function generateStockAlerts() {
  const lowStockItems = await getLowStockItems();
  return serializeDecimal(lowStockItems.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    sku: item.product.sku,
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

  const result = await prisma.$transaction(async (tx: PrismaClient) => {
    // Verificar que el item existe
    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: { product: true }
    });

    if (!inventoryItem) {
      throw new Error(`Item de inventario con ID '${inventoryItemId}' no encontrado`);
    }

    // Obtener la cantidad de movimientos asociados para incluir en la respuesta
    const movementsCount = await tx.stockMovement.count({
      where: { inventoryItemId },
    });

    // Eliminar todos los movimientos de stock asociados
    await tx.stockMovement.deleteMany({
      where: { inventoryItemId },
    });

    // Eliminar el item de inventario
    await tx.inventoryItem.delete({
      where: { id: inventoryItemId },
    });

    return {
      deleted: true,
      item: {
        id: inventoryItem.id,
        productId: inventoryItem.productId,
        productName: inventoryItem.product.name,
        quantity: inventoryItem.quantity,
        minStockLevel: inventoryItem.minStockLevel,
        movementsDeleted: movementsCount
      }
    };
  });
  return serializeDecimal(result);
} 