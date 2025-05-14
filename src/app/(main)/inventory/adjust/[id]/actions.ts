"use server";

import { prisma } from "@/lib/prisma";
import { adjustStock } from "@/services/inventoryService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serializeDecimal } from "@/lib/utils";

interface AdjustInventoryData {
  quantity: number;
  minStockLevel: number;
  location: string;
}

export async function adjustInventoryAction(
  inventoryId: string, 
  currentQuantity: number,
  currentMinStockLevel: number,
  currentLocation: string | null,
  data: AdjustInventoryData
) {
  try {
    let updated = false;
    
    // Adjust the stock if the quantity changed
    if (data.quantity !== currentQuantity) {
      await adjustStock(
        inventoryId,
        data.quantity,
        `Ajuste manual de cantidad de ${currentQuantity} a ${data.quantity}`
      );
      updated = true;
    }
    
    // Update min stock level if changed
    if (data.minStockLevel !== currentMinStockLevel) {
      await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: { minStockLevel: data.minStockLevel }
      });
      updated = true;
    }
    
    // Update location if changed
    if (data.location !== currentLocation) {
      await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: { location: data.location }
      });
      updated = true;
    }

    // Revalidate the inventory pages
    revalidatePath('/inventory');
    revalidatePath(`/inventory/adjust/${inventoryId}`);
    
    // Return success message and let the client handle the redirect
    return { 
      success: true, 
      updated,
      message: "Item de inventario actualizado correctamente" 
    };
  } catch (error) {
    console.error("Error adjusting inventory:", error);
    throw new Error("Error al ajustar el inventario");
  }
} 