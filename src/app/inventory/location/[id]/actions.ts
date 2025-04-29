"use server";

import { updateItemLocation } from "@/services/inventoryService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface LocationData {
  quantity: number;
  minStockLevel: number;
  location: string;
}

export async function updateLocationAction(
  inventoryId: string, 
  currentLocation: string | null,
  data: LocationData
) {
  try {
    // Only update the location, ignore other fields
    if (data.location !== currentLocation) {
      await updateItemLocation(inventoryId, data.location || "");
    }

    // Revalidate the inventory pages
    revalidatePath('/inventory');
    
    // Redirect back to inventory
    redirect('/inventory');
  } catch (error) {
    // In a real app, you might want to handle this error more gracefully
    console.error("Error updating location:", error);
    throw new Error("Failed to update location");
  }
} 