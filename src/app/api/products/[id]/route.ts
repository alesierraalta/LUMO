import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';
import { calculateMargin, calculatePrice, serializeDecimal } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Product update validation schema
const ProductUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  cost: z.number().min(0).optional(),
  price: z.number().min(0.01).optional(),
  margin: z.number().min(0).optional(),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
  // Inventory fields
  quantity: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  location: z.string().optional(),
  // Optional change reason for price history
  changeReason: z.string().optional()
});

// GET /api/products/[id] - Get a single product
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const product = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
      include: {
        category: true,
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(serializeDecimal(product));
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update a product
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    
    // Get current user from auth
    const { userId } = await auth();
    
    // Validate input data
    const validatedData = ProductUpdateSchema.parse(body);
    
    // Extract change reason and remove from update data
    const changeReason = validatedData.changeReason;
    delete validatedData.changeReason;
    
    // Check if product exists
    const existingProduct = await prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // If SKU is being updated, check it doesn't exist
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.inventoryItem.findUnique({
        where: { sku: validatedData.sku },
      });

      if (duplicateSku) {
        return NextResponse.json(
          { message: `El SKU '${validatedData.sku}' ya está en uso.` },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    let updateData = { ...validatedData };
    
    // Get current values for calculations
    const newCost = updateData.cost !== undefined ? updateData.cost : Number(existingProduct.cost);
    const newPrice = updateData.price !== undefined ? updateData.price : Number(existingProduct.price);
    const newMargin = updateData.margin !== undefined ? updateData.margin : Number(existingProduct.margin);
    
    // Check if price, cost or margin is changing
    const isPriceChanging = updateData.price !== undefined && updateData.price !== Number(existingProduct.price);
    const isCostChanging = updateData.cost !== undefined && updateData.cost !== Number(existingProduct.cost);
    const isMarginChanging = updateData.margin !== undefined && updateData.margin !== Number(existingProduct.margin);
    const isPricingChanged = isPriceChanging || isCostChanging || isMarginChanging;
    
    // Ensure price and margin are consistent based on which one was updated
    if (updateData.margin !== undefined && updateData.price === undefined) {
      // Margin was updated, recalculate price
      updateData.price = calculatePrice(newCost, newMargin);
    } else if (updateData.price !== undefined && updateData.margin === undefined) {
      // Price was updated, recalculate margin
      updateData.margin = calculateMargin(newCost, newPrice);
    } else if (updateData.cost !== undefined && updateData.price !== undefined && updateData.margin === undefined) {
      // Cost and price were updated, recalculate margin
      updateData.margin = calculateMargin(newCost, newPrice);
    } else if (updateData.cost !== undefined && updateData.margin !== undefined && updateData.price === undefined) {
      // Cost and margin were updated, recalculate price
      updateData.price = calculatePrice(newCost, newMargin);
    } else if (updateData.cost !== undefined && updateData.price === undefined && updateData.margin === undefined) {
      // Only cost was updated, maintain margin and recalculate price
      updateData.margin = Number(existingProduct.margin);
      updateData.price = calculatePrice(newCost, updateData.margin);
    }
    
    // Update the inventory item in a transaction
    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update inventory item
      const updatedProduct = await tx.inventoryItem.update({
        where: { id: resolvedParams.id },
        data: updateData,
        include: {
          category: true,
        },
      });
      
      // Create price history record if price, cost or margin changed
      if (isPricingChanged) {
        await tx.priceHistory.create({
          data: {
            inventoryItemId: resolvedParams.id,
            oldPrice: Number(existingProduct.price),
            newPrice: Number(updatedProduct.price),
            oldCost: Number(existingProduct.cost),
            newCost: Number(updatedProduct.cost),
            oldMargin: Number(existingProduct.margin),
            newMargin: Number(updatedProduct.margin),
            changeReason: changeReason || "Actualización de precio",
            userId: userId || undefined
          }
        });
      }
      
      return updatedProduct;
    });
    
    return NextResponse.json(serializeDecimal(product));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.inventoryItem.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 