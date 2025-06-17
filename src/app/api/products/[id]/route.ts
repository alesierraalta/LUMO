import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateMargin, calculatePrice, serializeDecimal } from '@/lib/utils';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-simple';
import { db } from '@/lib/db-supabase';
import { getProductById } from '@/services/productService';

// Product update validation schema
const ProductUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  cost: z.number().min(0).optional(),
  price: z.number().min(0).optional(), // Permitir 0 para precios
  margin: z.number().min(0).optional(),
  categoryId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(), // Agregar locationId que faltaba
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authentication token and user
    const token = getTokenFromRequest(req);
    let user = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      };
      console.log('🔄 Using fallback user for product update:', user.email);
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    
    // Validate input data
    const validatedData = ProductUpdateSchema.parse(body);
    
    // Extract change reason and remove from update data
    const changeReason = validatedData.changeReason;
    delete validatedData.changeReason;
    
    // Check if product exists
    const existingProduct = await db.inventoryItem.findUnique({
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
      const duplicateSku = await db.inventoryItem.findUnique({
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
    
    // Get current values for calculations (handle null values)
    const currentCost = existingProduct.cost ? Number(existingProduct.cost) : null;
    const currentPrice = existingProduct.price ? Number(existingProduct.price) : null;
    const currentMargin = existingProduct.margin ? Number(existingProduct.margin) : null;
    
    const newCost = updateData.cost !== undefined ? updateData.cost : currentCost;
    const newPrice = updateData.price !== undefined ? updateData.price : currentPrice;
    const newMargin = updateData.margin !== undefined ? updateData.margin : currentMargin;
    
    // Check if price, cost or margin is changing
    const isPriceChanging = updateData.price !== undefined && updateData.price !== currentPrice;
    const isCostChanging = updateData.cost !== undefined && updateData.cost !== currentCost;
    const isMarginChanging = updateData.margin !== undefined && updateData.margin !== currentMargin;
    const isPricingChanged = isPriceChanging || isCostChanging || isMarginChanging;
    
    // Only calculate relationships if we have the necessary values
    if (newCost !== null && newPrice !== null) {
      // Ensure price and margin are consistent based on which one was updated
      if (updateData.margin !== undefined && updateData.price === undefined) {
        // Margin was updated, recalculate price
        updateData.price = calculatePrice(newCost, newMargin || 0);
      } else if (updateData.price !== undefined && updateData.margin === undefined) {
        // Price was updated, recalculate margin
        updateData.margin = calculateMargin(newCost, newPrice);
      } else if (updateData.cost !== undefined && updateData.price !== undefined && updateData.margin === undefined) {
        // Cost and price were updated, recalculate margin
        updateData.margin = calculateMargin(newCost, newPrice);
      } else if (updateData.cost !== undefined && updateData.margin !== undefined && updateData.price === undefined) {
        // Cost and margin were updated, recalculate price
        updateData.price = calculatePrice(newCost, newMargin || 0);
      } else if (updateData.cost !== undefined && updateData.price === undefined && updateData.margin === undefined && currentMargin !== null) {
        // Only cost was updated, maintain margin and recalculate price
        updateData.margin = currentMargin;
        updateData.price = calculatePrice(newCost, currentMargin);
      }
    }
    
    // Update the inventory item
    const product = await db.inventoryItem.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        category: true,
      },
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authentication token and user
    const token = getTokenFromRequest(req);
    let user = token ? await getCurrentUserFromToken(token) : null;
    
    // Fallback for Choreo deployment testing
    if (!user) {
      user = {
        id: 'dd97c238-6649-4e31-979b-c9ef12959998',
        email: 'alesierraalta@gmail.com',
        name: 'Alejandro Sierra (ROOT)',
        role: 'USER'
      };
      console.log('🔄 Using fallback user for product deletion:', user.email);
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const resolvedParams = await params;
    
    console.log('🗑️ Attempting to delete product:', resolvedParams.id);
    
    await db.inventoryItem.delete({
      where: { id: resolvedParams.id },
    });
    
    console.log('✅ Product deleted successfully:', resolvedParams.id);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete product', details: (error as any).message },
      { status: 500 }
    );
  }
} 