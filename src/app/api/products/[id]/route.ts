import { NextResponse } from 'next/server';
import { updateProduct, getProductById } from '@/services/productService';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Check if product exists
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { message: `Producto con ID '${id}' no encontrado` },
        { status: 404 }
      );
    }
    
    const product = await updateProduct(id, data);
    
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar el producto' },
      { status: 400 }
    );
  }
} 