import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ProductSale {
  inventoryItemId: string;
  _sum: {
    quantity: number | null;
    subtotal: number | null;
  };
}

interface ProductDetail {
  id: string;
  name: string;
  sku: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month
    const inventoryItemId = searchParams.get('productId'); // Keep productId for API compatibility

    // Base where clause
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

    // Get sales summary
    const salesSummary = await prisma.sale.aggregate({
      where,
      _sum: {
        total: true,
        subtotal: true,
        tax: true,
      },
      _count: true,
    });

    // Get product-wise sales
    const productSales = await prisma.saleTransaction.groupBy({
      by: ['inventoryItemId'],
      where: where.transactions?.some || {},
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: 10, // Top 10 products
    });

    // Fetch product details for the sales
    const productDetails = await prisma.inventoryItem.findMany({
      where: {
        id: {
          in: productSales.map((sale: ProductSale) => sale.inventoryItemId),
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    }) as ProductDetail[];

    // Get daily/weekly/monthly sales trend
    let dateGrouping;
    if (groupBy === 'week') {
      dateGrouping = 'date_trunc(\'week\', "date")';
    } else if (groupBy === 'month') {
      dateGrouping = 'date_trunc(\'month\', "date")';
    } else {
      dateGrouping = 'date_trunc(\'day\', "date")';
    }

    const salesTrend = await prisma.$queryRaw`
      SELECT 
        ${dateGrouping}::date as period,
        COUNT(*) as total_sales,
        SUM(total) as total_amount
      FROM sales
      WHERE date >= ${startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        AND date <= ${endDate ? new Date(endDate) : new Date()}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Combine product sales with product details
    const topProducts = productSales.map((sale: ProductSale) => ({
      ...sale,
      product: productDetails.find((p: ProductDetail) => p.id === sale.inventoryItemId),
    }));

    return NextResponse.json({
      summary: {
        totalSales: salesSummary._count,
        totalRevenue: salesSummary._sum.total,
        totalTax: salesSummary._sum.tax,
        averageOrderValue: salesSummary._count ? 
          Number(salesSummary._sum.total) / salesSummary._count : 0,
      },
      topProducts,
      salesTrend,
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    );
  }
} 