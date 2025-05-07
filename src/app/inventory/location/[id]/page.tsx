import { notFound } from "next/navigation";
import { getInventoryItemById } from "@/services/inventoryService";
import InventoryForm from "@/components/inventory/inventory-form";
import { updateLocationAction } from "./actions";

interface ChangeLocationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChangeLocationPage({ params }: ChangeLocationPageProps) {
  const resolvedParams = await params;
  const inventoryItem = await getInventoryItemById(resolvedParams.id);

  if (!inventoryItem) {
    notFound();
  }

  // Prepare the form data
  const formData = {
    quantity: inventoryItem.quantity,
    minStockLevel: inventoryItem.minStockLevel,
    location: inventoryItem.location || "",
  };

  // Create a submit handler that calls the server action
  const handleSubmit = async (data: any) => {
    "use client";
    
    return updateLocationAction(
      inventoryItem.id,
      inventoryItem.location,
      data
    );
  };

  return (
    <div className="container max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Cambiar Ubicación</h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Actualice la ubicación del producto <strong>{inventoryItem.product.name}</strong> en su inventario.
          La ubicación puede ser un almacén, estante, pasillo u otra referencia para localizar el producto.
        </p>
      </div>
      
      <InventoryForm 
        initialData={formData}
        productName={inventoryItem.product.name}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 