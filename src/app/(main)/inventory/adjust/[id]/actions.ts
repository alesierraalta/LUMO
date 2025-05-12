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
    // Adjust the stock if the quantity changed
    if (data.quantity !== currentQuantity) {
      await adjustStock(
        inventoryId,
        data.quantity,
        `Ajuste manual de cantidad de ${currentQuantity} a ${data.quantity}`
      );
    }
    
    // Update min stock level if changed
    if (data.minStockLevel !== currentMinStockLevel) {
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: { minStockLevel: data.minStockLevel }
      });
      return serializeDecimal(updatedItem);
    }
    
    // Update location if changed
    if (data.location !== currentLocation) {
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: { location: data.location }
      });
      return serializeDecimal(updatedItem);
    }

    // Revalidate the inventory pages
    revalidatePath('/inventory');
    
    // Redirect back to inventory
    redirect('/inventory');
  } catch (error) {
    // In a real app, you might want to handle this error more gracefully
    console.error("Error adjusting inventory:", error);
    throw new Error("Failed to adjust inventory");
  }
} 