import { NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';
import { getCurrentUserFromToken, getTokenFromRequest } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    // Verificar usuario autenticado con fallback para Choreo
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
      console.log('🔄 Using fallback user for SKU check:', user.email);
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
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
    const existingItems = await db.inventoryItem.findMany({
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
    console.error('❌ Error al verificar SKUs:', error);
    return NextResponse.json(
      { error: 'Error al verificar SKUs', details: (error as any).message },
      { status: 500 }
    );
  }
} 
