import { notFound } from "next/navigation";
import Link from "next/link";
import { getInventoryItemById } from "@/services/inventoryService";
import InventoryAdjustmentForm from "@/components/inventory/inventory-adjustment-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdjustInventoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdjustInventoryPage({ params }: AdjustInventoryPageProps) {
  const resolvedParams = await params;
  const inventoryItem = await getInventoryItemById(resolvedParams.id);

  if (!inventoryItem) {
    notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/inventory">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
        </div>
      </div>
      
      <InventoryAdjustmentForm 
        inventoryItem={inventoryItem}
        productName={inventoryItem.name}
      />
      
      <div className="mt-6 text-center">
        <Link href="/inventory">
          <Button variant="outline">Volver al Inventario</Button>
        </Link>
      </div>
    </div>
  );
} 