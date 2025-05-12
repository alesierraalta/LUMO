import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtener todos los elementos de inventario
    const items = await prisma.inventoryItem.findMany();
    
    // Crear fechas diferentes
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Actualizar cada elemento con una fecha diferente
    const updates = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let updateDate;
      
      // Asignar fechas distintas según el índice
      switch (i % 4) {
        case 0:
          updateDate = now;
          break;
        case 1:
          updateDate = yesterday;
          break;
        case 2:
          updateDate = twoDaysAgo;
          break;
        case 3:
          updateDate = threeDaysAgo;
          break;
        default:
          updateDate = now;
      }
      
      // Ejecutar la actualización usando SQL RAW
      // Esto evita problemas con las anotaciones @updatedAt
      updates.push(
        prisma.$executeRaw`
          UPDATE inventory_items 
          SET lastUpdated = ${updateDate.toISOString()} 
          WHERE id = ${item.id}
        `
      );
    }
    
    // Ejecutar todas las actualizaciones
    await Promise.all(updates);
    
    return NextResponse.json({
      success: true,
      message: `Actualizado ${updates.length} elementos con diferentes fechas.`
    });
  } catch (error) {
    console.error('Error al actualizar fechas:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 