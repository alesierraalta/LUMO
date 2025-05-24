import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sale = await prisma.sale.findUnique({
      where: { id: resolvedParams.id },
      include: {
        transactions: {
          include: {
            inventoryItem: true,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sale = await prisma.sale.findUnique({
      where: { id: resolvedParams.id },
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
        where: { id: resolvedParams.id },
        data: { status: 'CANCELLED' },
      });

      // Restore inventory for each product
      for (const transaction of sale.transactions) {
        await tx.inventoryItem.update({
          where: { id: transaction.inventoryItemId },
          data: {
            quantity: {
              increment: transaction.quantity
            }
          }
        });

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            inventoryItemId: transaction.inventoryItemId,
            quantity: transaction.quantity,
            type: 'ADJUSTMENT',
            notes: `Sale cancelled: ${sale.id}`,
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