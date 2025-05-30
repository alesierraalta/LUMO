import { getCurrentUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          },
          transactions: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                }
              }
            }
          }
        }
      }),
      prisma.sale.count()
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const body = await request.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.inventoryItemId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'Each item must have inventoryItemId, quantity, and unitPrice' },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const tax = subtotal * 0.10; // 10% tax rate
    const total = subtotal + tax;

    // Create sale with transactions
    const sale = await prisma.sale.create({
      data: {
        subtotal,
        tax,
        total,
        notes: notes || null,
        userId: user.id,
        transactions: {
          create: items.map((item: any) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        transactions: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
              }
            }
          }
        }
      }
    });

    // Update inventory quantities
    for (const item of items) {
      await prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      });

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          inventoryItemId: item.inventoryItemId,
          quantity: -item.quantity,
          type: 'STOCK_OUT',
          notes: `Sale transaction - Sale ID: ${sale.id}`,
          userId: user.id,
        }
      });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
} 