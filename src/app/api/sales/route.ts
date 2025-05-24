import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';

// Schema for validating sale creation
const SaleItemSchema = z.object({
  inventoryItemId: z.string(),
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
    const validatedData = CreateSaleSchema.parse(body);

    // Create the sale and update inventory in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Validate inventory for all items
      for (const item of validatedData.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });

        if (!inventoryItem) {
          throw new Error(`Product not found: ${item.inventoryItemId}`);
        }

        if (inventoryItem.quantity < item.quantity) {
          throw new Error(`Insufficient inventory for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`);
        }
      }

      // Calculate totals
      const subtotal = validatedData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = subtotal * 0.16; // 16% tax
      const total = subtotal + tax;

      // Create sale
      const sale = await tx.sale.create({
        data: {
          subtotal,
          tax,
          total,
          notes: validatedData.notes,
          transactions: {
            create: validatedData.items.map(item => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            }))
          }
        },
        include: {
          transactions: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      // Update inventory and create stock movements
      for (const item of validatedData.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            type: 'STOCK_OUT',
            notes: `Sale: ${sale.id}`,
          },
        });
      }

      return sale;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing sale:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

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
    const inventoryItemId = searchParams.get('productId'); // Keep productId for API compatibility

    // Build where clause based on filters
    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (inventoryItemId) {
      where.transactions = {
        some: {
          inventoryItemId,
        },
      };
    }

    // Get total count for pagination
    const total = await prisma.sale.count({ where });

    // Get paginated results
    const sales = await prisma.sale.findMany({
      where,
      include: {
        transactions: {
          include: {
            inventoryItem: true,
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
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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