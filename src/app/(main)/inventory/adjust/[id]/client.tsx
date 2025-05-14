"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adjustInventoryAction } from "./actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface ClientAdjustInventoryPageProps {
  inventoryId: string;
}

export default function ClientAdjustInventoryPage({ inventoryId }: ClientAdjustInventoryPageProps) {
  const router = useRouter();
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [minStockLevel, setMinStockLevel] = useState<number>(0);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the inventory item data
    async function fetchInventoryItem() {
      try {
        const response = await fetch(`/api/inventory/${inventoryId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch inventory item");
        }
        const data = await response.json();
        setInventoryItem(data);
        setQuantity(data.quantity);
        setMinStockLevel(data.minStockLevel);
        setLocation(data.location || "");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inventory item:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
        setLoading(false);
      }
    }

    fetchInventoryItem();
  }, [inventoryId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inventoryItem) return;

    try {
      const result = await adjustInventoryAction(
        inventoryId,
        inventoryItem.quantity,
        inventoryItem.minStockLevel,
        inventoryItem.location,
        {
          quantity: Number(quantity),
          minStockLevel: Number(minStockLevel),
          location
        }
      );
      
      if (result.success) {
        router.push("/inventory");
        router.refresh();
      }
    } catch (error) {
      console.error("Error adjusting inventory:", error);
      setError(error instanceof Error ? error.message : "Error al ajustar inventario");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <p className="text-lg text-red-500">Error: {error}</p>
        <Button className="mt-4" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <p className="text-lg">No se encontró el elemento de inventario</p>
        <Button className="mt-4" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: inventoryItem.name, href: `/inventory/edit/${inventoryId}` },
          { title: "Editar Stock" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Editar Stock</CardTitle>
          <CardDescription>
            Modifica la información del stock para {inventoryItem.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad Actual</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Valor actual: {inventoryItem.quantity}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Nivel Mínimo de Stock</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Valor actual: {inventoryItem.minStockLevel}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ingrese la ubicación"
              />
              <p className="text-sm text-muted-foreground">
                Ubicación actual: {inventoryItem.location || "No definida"}
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 