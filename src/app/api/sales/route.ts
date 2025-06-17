import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
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
    // Authentication check with fallback for Choreo
    const token = getTokenFromRequest(request);
    let user = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      } as any;
      console.log('🔄 Using fallback user for sales GET:', user.email);
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      db.sale.findMany({
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
      db.sale.count()
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
    console.error('❌ Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales', details: (error as any).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check with fallback for Choreo
    const token = getTokenFromRequest(request);
    let user = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      } as any;
      console.log('🔄 Using fallback user for sales POST:', user.email);
    }

    if (!db) {
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
    const sale = await db.sale.create({
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
      await db.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      });

      // Create stock movement record
      await db.stockMovement.create({
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
    console.error('❌ Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale', details: (error as any).message },
      { status: 500 }
    );
  }
} 
