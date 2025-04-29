import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prismaClient = new PrismaClient();

// Schema for validating sale creation
const SaleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // Validate input
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    // Create the sale and update inventory in a transaction
    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      // Get the product with its current inventory
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          inventory: true,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.inventory) {
        throw new Error('Product inventory not found');
      }

      if (product.inventory.quantity < quantity) {
        throw new Error(`Insufficient inventory. Available: ${product.inventory.quantity}, Requested: ${quantity}`);
      }

      // Create inventory movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          quantity: -quantity,
          type: 'SALE',
          notes: 'Product sold',
        },
      });

      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { productId },
        data: {
          quantity: {
            decrement: quantity,
          },
          lastUpdated: new Date(),
        },
      });

      // Create sale record
      const sale = await tx.sale.create({
        data: {
          productId,
          quantity,
          price: product.price,
          movementId: movement.id,
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      });

      // Check if we need to create a low stock alert
      if (updatedInventory.quantity <= (product.inventory.minQuantity || 0)) {
        await tx.alert.create({
          data: {
            type: 'LOW_STOCK',
            productId,
            message: `Low stock alert: ${product.name} (${product.sku}) - ${updatedInventory.quantity} units remaining`,
            severity: 'WARNING',
          },
        });
      }

      return { sale, updatedInventory };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing sale:', error);

    // Handle Prisma errors
    if (
      error instanceof Error &&
      error.constructor.name === 'PrismaClientKnownRequestError' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Duplicate sale record' },
        { status: 400 }
      );
    }

    // Handle custom errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient inventory')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process sale' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const productId = searchParams.get('productId');

    // Build where clause based on filters
    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (productId) {
      where.transactions = {
        some: {
          productId,
        },
      };
    }

    // Get total count for pagination
    const total = await prismaClient.sale.count({ where });

    // Get paginated results
    const sales = await prismaClient.sale.findMany({
      where,
      include: {
        transactions: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      sales,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
} 