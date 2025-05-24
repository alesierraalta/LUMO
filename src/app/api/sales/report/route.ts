import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause for date filtering
    const where = {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    };

    // Get sales with transaction details
    const sales = await prisma.sale.findMany({
      where,
      include: {
        transactions: {
          include: {
            inventoryItem: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totals = {
      count: sales.length,
      revenue: sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0),
      average: sales.length > 0
        ? sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0) / sales.length
        : 0,
    };

    return NextResponse.json({
      sales,
      totals,
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales report' },
      { status: 500 }
    );
  }
} 