import { prisma } from "../lib/prisma";
import { serializeDecimal } from "../lib/utils";
import type { Sale } from "../generated/prisma/index";

export type CreateSaleTransactionInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CreateSaleInput = {
  transactions: CreateSaleTransactionInput[];
  notes?: string;
  status?: Sale['status'];
};

export type UpdateSaleInput = {
  notes?: string;
  status?: Sale['status'];
};

/**
 * Get all sales with their transactions
 */
export async function getAllSales() {
  const sales = await prisma.sale.findMany({
    include: {
      transactions: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });
  
  return serializeDecimal(sales);
}

/**
 * Get a single sale by ID
 */
export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      transactions: {
        include: {
          product: true
        }
      }
    }
  });
  
  return serializeDecimal(sale);
}

/**
 * Create a new sale with its transactions
 */
export async function createSale(data: CreateSaleInput) {
  // Calculate transaction subtotals and validate stock
  const transactions = await Promise.all(data.transactions.map(async (t) => {
    // Get product to check stock
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { productId: t.productId }
    });

    if (!inventoryItem) {
      throw new Error(`No inventory found for product ${t.productId}`);
    }

    if (inventoryItem.quantity < t.quantity) {
      throw new Error(`Insufficient stock for product ${t.productId}`);
    }

    return {
      ...t,
      subtotal: t.quantity * t.unitPrice
    };
  }));

  // Calculate sale totals
  const subtotal = transactions.reduce((sum, t) => sum + t.subtotal, 0);
  const tax = subtotal * 0.16; // 16% tax
  const total = subtotal + tax;

  // Create sale and transactions in a transaction
  const sale = await prisma.$transaction(async (tx) => {
    // Create the sale
    const newSale = await tx.sale.create({
      data: {
        subtotal,
        tax,
        total,
        status: data.status || 'COMPLETED',
        notes: data.notes,
        transactions: {
          create: transactions.map(t => ({
            productId: t.productId,
            quantity: t.quantity,
            unitPrice: t.unitPrice,
            subtotal: t.subtotal
          }))
        }
      },
      include: {
        transactions: {
          include: {
            product: true
          }
        }
      }
    });

    // Update inventory for each product
    for (const transaction of transactions) {
      await tx.inventoryItem.update({
        where: { productId: transaction.productId },
        data: {
          quantity: {
            decrement: transaction.quantity
          }
        }
      });

      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          inventoryItemId: (await tx.inventoryItem.findUnique({
            where: { productId: transaction.productId }
          }))!.id,
          quantity: transaction.quantity,
          type: 'STOCK_OUT',
          notes: `Sale: ${newSale.id}`
        }
      });
    }

    return newSale;
  });

  return serializeDecimal(sale);
}

/**
 * Update a sale's status or notes
 */
export async function updateSale(id: string, data: UpdateSaleInput) {
  const sale = await prisma.sale.update({
    where: { id },
    data,
    include: {
      transactions: {
        include: {
          product: true
        }
      }
    }
  });

  return serializeDecimal(sale);
}

/**
 * Get sales statistics
 */
export async function getSalesStats(startDate: Date, endDate: Date) {
  const stats = await prisma.$transaction([
    // Total sales amount
    prisma.sale.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      },
      _sum: {
        total: true,
        tax: true
      },
      _count: true
    }),
    
    // Top selling products
    prisma.saleTransaction.groupBy({
      by: ['productId'],
      where: {
        sale: {
          date: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          subtotal: 'desc'
        }
      },
      take: 5
    })
  ]);

  return serializeDecimal(stats);
} 