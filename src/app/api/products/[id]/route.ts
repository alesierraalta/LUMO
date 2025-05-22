import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { calculateMargin, calculatePrice, serializeDecimal } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

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

// GET handler to fetch a single product
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Fetch the product with its relationships
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventory: true,
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { message: `Producto con ID '${id}' no encontrado` },
        { status: 404 }
      );
    }
    
    // Return the serialized product
    return NextResponse.json(serializeDecimal(product));
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener el producto' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await req.json();
    
    // Get current user from auth
    const { userId } = await auth();
    
    // Validate input data
    const validatedData = ProductUpdateSchema.parse(data);
    
    // Extract change reason and remove from update data
    const changeReason = validatedData.changeReason;
    delete validatedData.changeReason;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true
      }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { message: `Producto con ID '${id}' no encontrado` },
        { status: 404 }
      );
    }
    
    // If SKU is being updated, check it doesn't exist
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findUnique({
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
    
    // Extract inventory data
    const inventoryData: any = {};
    if (validatedData.quantity !== undefined) {
      inventoryData.quantity = validatedData.quantity;
      delete updateData.quantity;
    }
    if (validatedData.minStockLevel !== undefined) {
      inventoryData.minStockLevel = validatedData.minStockLevel;
      delete updateData.minStockLevel;
    }
    if (validatedData.location !== undefined) {
      inventoryData.location = validatedData.location;
      delete updateData.location;
    }
    
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
    
    // Prepare transaction to update both product and inventory
    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          inventory: true,
        },
      });
      
      // Update inventory if needed
      if (Object.keys(inventoryData).length > 0 && existingProduct.inventory) {
        await tx.inventoryItem.update({
          where: { productId: id },
          data: inventoryData
        });
      }
      
      // Create price history record if price, cost or margin changed
      if (isPricingChanged) {
        await tx.priceHistory.create({
          data: {
            inventoryItemId: id,
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
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: error.message || 'Error al actualizar el producto' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Existing code
} 