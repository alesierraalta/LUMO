import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Verificar usuario autenticado
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener lista de SKUs a verificar
    const requestData = await request.json();
    const skus = requestData.skus as string[];
    
    if (!Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de SKUs válido' },
        { status: 400 }
      );
    }

    // Limitar la cantidad de SKUs por consulta para evitar sobrecarga
    const maxSkus = 1000;
    if (skus.length > maxSkus) {
      return NextResponse.json(
        { error: `No se pueden verificar más de ${maxSkus} SKUs en una sola solicitud` },
        { status: 400 }
      );
    }

    // Verificar SKUs existentes en la base de datos
    const existingItems = await prisma.inventoryItem.findMany({
      where: {
        sku: {
          in: skus
        }
      },
      select: {
        sku: true
      }
    });

    // Crear array con resultado para cada SKU (true si existe, false si no)
    const existingSkus = new Set(existingItems.map(item => item.sku));
    
    const result = skus.map(sku => ({
      sku,
      existing: existingSkus.has(sku)
    }));

    return NextResponse.json({ skus: result });
  } catch (error) {
    console.error('Error al verificar SKUs:', error);
    return NextResponse.json(
      { error: 'Error al verificar SKUs' },
      { status: 500 }
    );
  }
} 