import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        transactions: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    if (sale.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Sale is already cancelled' },
        { status: 400 }
      );
    }

    // Delete sale and restore inventory in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update sale status
      await tx.sale.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      });

      // Restore inventory for each product
      for (const transaction of sale.transactions) {
        await tx.inventoryItem.update({
          where: { productId: transaction.productId },
          data: {
            quantity: {
              increment: transaction.quantity
            },
            stockMovements: {
              create: {
                quantity: transaction.quantity,
                type: 'ADJUSTMENT',
                notes: `Sale cancelled: ${sale.id}`,
              }
            }
          }
        });
      }
    });

    return NextResponse.json({ message: 'Sale cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    return NextResponse.json(
      { error: 'Failed to cancel sale' },
      { status: 500 }
    );
  }
} 