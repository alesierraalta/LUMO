import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface SaleTransaction {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

// Schema for validating refund request
const RefundItemSchema = z.object({
  transactionId: z.string(),
  quantity: z.number().positive(),
});

const RefundSchema = z.object({
  items: z.array(RefundItemSchema),
  reason: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const validatedData = RefundSchema.parse(body);

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
        { error: 'Cannot refund a cancelled sale' },
        { status: 400 }
      );
    }

    // Validate refund items
    for (const refundItem of validatedData.items) {
      const transaction = sale.transactions.find((t: SaleTransaction) => t.id === refundItem.transactionId);
      if (!transaction) {
        return NextResponse.json(
          { error: `Transaction ${refundItem.transactionId} not found in sale` },
          { status: 400 }
        );
      }
      if (refundItem.quantity > transaction.quantity) {
        return NextResponse.json(
          { error: `Cannot refund more than original quantity for transaction ${refundItem.transactionId}` },
          { status: 400 }
        );
      }
    }

    // Process refund in a transaction
    const refund = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let totalRefundAmount = 0;

      // Process each refund item
      for (const refundItem of validatedData.items) {
        const transaction = sale.transactions.find((t: SaleTransaction) => t.id === refundItem.transactionId)!;
        const refundAmount = (transaction.unitPrice * refundItem.quantity);
        totalRefundAmount += refundAmount;

        // Restore inventory
        await tx.inventoryItem.update({
          where: { id: transaction.inventoryItemId },
          data: {
            quantity: {
              increment: refundItem.quantity
            }
          }
        });

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            inventoryItemId: transaction.inventoryItemId,
            quantity: refundItem.quantity,
            type: 'ADJUSTMENT',
            notes: `Refund from sale: ${sale.id}`,
          }
        });
      }

      // Calculate new totals
      const newSubtotal = Number(sale.subtotal) - totalRefundAmount;
      const newTax = newSubtotal * 0.16; // Keep same tax rate
      const newTotal = newSubtotal + newTax;

      // Update sale with new amounts
      const updatedSale = await tx.sale.update({
        where: { id: resolvedParams.id },
        data: {
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
          notes: `${sale.notes ? sale.notes + '\n' : ''}Refund: ${validatedData.reason}`,
        },
        include: {
          transactions: true,
        },
      });

      return {
        sale: updatedSale,
        refundAmount: totalRefundAmount,
      };
    });

    return NextResponse.json({
      message: 'Refund processed successfully',
      refundAmount: refund.refundAmount,
      sale: refund.sale,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
} 