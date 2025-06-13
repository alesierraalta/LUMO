import { NextResponse } from 'next/server';
import db from '@/lib/db-hybrid';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check with fallback for Choreo
    const token = getTokenFromRequest(req as any);
    let user = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      } as any;
      console.log('🔄 Using fallback user for sale GET:', user.email);
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const resolvedParams = await params;
    const sale = await db.sale.findUnique({
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
    console.error('❌ Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale', details: (error as any).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check with fallback for Choreo
    const token = getTokenFromRequest(request as any);
    let user = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      } as any;
      console.log('🔄 Using fallback user for sale DELETE:', user.email);
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const resolvedParams = await params;
    const sale = await db.sale.findUnique({
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
    // Note: For hybrid adapter, we'll handle this sequentially since transaction support may vary
    try {
      // Update sale status
      await db.sale.update({
        where: { id: resolvedParams.id },
        data: { status: 'CANCELLED' },
      });

      // Restore inventory for each product
      for (const transaction of sale.transactions) {
        await db.inventoryItem.update({
          where: { id: transaction.inventoryItemId },
          data: {
            quantity: {
              increment: transaction.quantity
            }
          }
        });

        // Create stock movement record
        await db.stockMovement.create({
          data: {
            inventoryItemId: transaction.inventoryItemId,
            quantity: transaction.quantity,
            type: 'ADJUSTMENT',
            notes: `Sale cancelled: ${sale.id}`,
            userId: user.id,
          }
        });
      }
    } catch (transactionError) {
      console.error('❌ Error in sale cancellation transaction:', transactionError);
      throw transactionError;
    }

    return NextResponse.json({ message: 'Sale cancelled successfully' });
  } catch (error) {
    console.error('❌ Error cancelling sale:', error);
    return NextResponse.json(
      { error: 'Failed to cancel sale', details: (error as any).message },
      { status: 500 }
    );
  }
} 