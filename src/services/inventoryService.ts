import { Prisma } from '@prisma/client';
import { serializeDecimal } from '@/lib/utils';
import { StockStatus } from '@/lib/inventory-utils';
import { StockMovementInput } from "@/lib/inventory-utils";
import db from '@/lib/db';

const prisma = db;

/**
 * Obtiene todos los elementos de inventario
 */
export async function getAllInventoryItems() {
  const items = await prisma.inventoryItem.findMany({
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
  const item = await prisma.inventoryItem.findUnique({
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
  const items = await prisma.inventoryItem.findMany({
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
  return prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { minStockLevel: minLevel },
  });
}

/**
 * Actualiza la ubicación de un producto
 */
export async function updateItemLocation(inventoryItemId: string, location: string) {
  // First, get the item to check current location  
  const item = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    select: { location: true, name: true },
  });

  return prisma.inventoryItem.update({
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

  return await prisma.$transaction(async (tx) => {
    // Obtener el producto actual
    const currentItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!currentItem) {
      throw new Error("Producto no encontrado");
    }

    // Calcular nueva cantidad
    const newQuantity = currentItem.quantity + quantity;

    // Actualizar el producto
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: newQuantity,
        lastUpdated: new Date(),
      },
    });

    // Crear movimiento de stock
    await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity,
        type: MovementType.STOCK_IN,
        notes: notes || `Stock añadido: ${quantity}`,
        createdBy,
      },
    });

    return serializeDecimal(updatedItem);
  });
}

/**
 * Remueve stock de un producto
 */
export async function removeStock(inventoryItemId: string, quantity: number, notes?: string, createdBy?: string) {
  if (quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0");
  }

  return await prisma.$transaction(async (tx) => {
    // Obtener el producto actual
    const currentItem = await tx.inventoryItem.findUnique({
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
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: newQuantity,
        lastUpdated: new Date(),
      },
    });

    // Crear movimiento de stock
    await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity: -quantity, // Negativo para indicar salida
        type: MovementType.STOCK_OUT,
        notes: notes || `Stock removido: ${quantity}`,
        createdBy,
      },
    });

    return serializeDecimal(updatedItem);
  });
}

/**
 * Ajusta el stock de un producto a una cantidad específica
 */
export async function adjustStock(inventoryItemId: string, newQuantity: number, notes?: string, createdBy?: string) {
  if (newQuantity < 0) {
    throw new Error("La cantidad no puede ser negativa");
  }

  return await prisma.$transaction(async (tx) => {
    // Obtener el producto actual
    const currentItem = await tx.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!currentItem) {
      throw new Error("Producto no encontrado");
    }

    // Calcular la diferencia
    const difference = newQuantity - currentItem.quantity;

    // Actualizar el producto
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantity: newQuantity,
        lastUpdated: new Date(),
      },
    });

    // Crear movimiento de stock
    await tx.stockMovement.create({
      data: {
        inventoryItemId,
        quantity: difference,
        type: MovementType.ADJUSTMENT,
        notes: notes || `Ajuste de stock: ${currentItem.quantity} → ${newQuantity}`,
        createdBy,
      },
    });

    return serializeDecimal(updatedItem);
  });
}

/**
 * Obtiene el historial de movimientos de stock para un producto
 */
export async function getStockMovementHistory(inventoryItemId: string, limit?: number) {
  const movements = await prisma.stockMovement.findMany({
    where: { inventoryItemId },
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  return serializeDecimal(movements);
}

/**
 * Obtiene todos los movimientos de stock con filtros y paginación
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
    sort = "date_desc",
  } = params || {};
  
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  // Filter by type
  if (type && type !== "all") {
    where.type = type;
  }
  
  // Filter by date range
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  // Filter by category
  if (categoryId) {
    where.inventoryItem = {
      categoryId,
    };
  }

  // Filter by search term
  if (search && search.trim()) {
    where.OR = [
      {
        inventoryItem: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        inventoryItem: {
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        notes: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Build order by clause
  let orderBy: any = { date: 'desc' };
  
  if (sort) {
    const [field, direction] = sort.split('_');
    const dir = direction === 'asc' ? 'asc' : 'desc';

    switch (field) {
      case 'date':
        orderBy = { date: dir };
      break;
      case 'quantity':
        orderBy = { quantity: dir };
      break;
      case 'type':
        orderBy = { type: dir };
      break;
      case 'product':
        orderBy = { inventoryItem: { name: dir } };
      break;
    default:
        orderBy = { date: 'desc' };
    }
  }
  
  let movements;
  
  // Special handling for quantity sorting since we need to sort by absolute value
  if (sort?.startsWith('quantity_')) {
    // First, get filtered IDs sorted by quantity
    const filteredIds = await prisma.stockMovement.findMany({
       where,
      select: { id: true, quantity: true },
    });
     
    // Sort by absolute value of quantity
    const sortedIds = await prisma.$queryRaw`
      SELECT id FROM (
        SELECT id, ABS(quantity) as abs_quantity
        FROM stock_movements 
        WHERE id IN (${Prisma.join(filteredIds.map(item => item.id))})
      ) sorted
      ORDER BY abs_quantity ${sort.endsWith('_asc') ? Prisma.sql`ASC` : Prisma.sql`DESC`}
      LIMIT ${limit} OFFSET ${skip}
    `;
    
    const ids = (sortedIds as any[]).map(item => item.id);
    
    movements = await prisma.stockMovement.findMany({
      where: {
        id: {
          in: ids
        }
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true,
            locationId: true,
            locationRelation: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      // Preserve the order from our sorted IDs
      orderBy: {
        id: 'asc'
      }
    });
    
    // Sort the results manually to match the order of our IDs
    movements = movements.sort((a, b) => {
      return ids.indexOf(a.id) - ids.indexOf(b.id);
    });
  } else {
    // For other sorting options, use the standard approach
    movements = await prisma.stockMovement.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true,
            locationId: true,
            locationRelation: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy,
      take: limit,
      skip,
    });
  }
  
  const total = await prisma.stockMovement.count({ where });
  
  // Ensure movements is always an array and data is serialized properly
  const safeMovements = Array.isArray(movements) ? movements : [];
  const serializedData = serializeDecimal(safeMovements) || [];
  
  return {
    data: Array.isArray(serializedData) ? serializedData : [],
    pagination: {
      total: total || 0,
      page,
      limit,
      totalPages: Math.ceil((total || 0) / limit)
    }
  };
}

/**
 * Obtiene items con stock bajo (por debajo del nivel mínimo)
 */
export async function getLowStockItems() {
  // Get all active products and filter by low stock
  const items = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: true,
      location: true,
    },
    orderBy: [
      { currentStock: 'asc' },
      { name: 'asc' }
    ],
  });

  // Filter products where currentStock is less than or equal to minLevel and greater than 0
  const lowStockItems = items.filter(item => 
    item.currentStock <= item.minLevel && item.currentStock > 0
  );
  
  return serializeDecimal(lowStockItems);
}

/**
 * Obtiene items sin stock (cantidad = 0)
 */
export async function getOutOfStockItems() {
  const items = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
      currentStock: 0,
    },
    include: {
      category: true,
      location: true,
    },
    orderBy: {
      name: 'asc',
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