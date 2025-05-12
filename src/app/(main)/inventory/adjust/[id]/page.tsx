"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adjustInventoryAction } from "./actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function AdjustInventoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [minStockLevel, setMinStockLevel] = useState<number>(0);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch the inventory item data
    async function fetchInventoryItem() {
      try {
        const response = await fetch(`/api/inventory/${params.id}`);
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
        setLoading(false);
      }
    }

    fetchInventoryItem();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inventoryItem) return;

    try {
      await adjustInventoryAction(
        params.id,
        inventoryItem.quantity,
        inventoryItem.minStockLevel,
        inventoryItem.location,
        {
          quantity: Number(quantity),
          minStockLevel: Number(minStockLevel),
          location
        }
      );
      
      router.push("/inventory");
      router.refresh();
    } catch (error) {
      console.error("Error adjusting inventory:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div>
        <p>No se encontró el elemento de inventario</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: inventoryItem.name, href: `/inventory/edit/${params.id}` },
          { title: "Ajustar Stock" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Ajustar Stock</CardTitle>
          <CardDescription>
            Modifica los niveles de stock y la ubicación para {inventoryItem.name}
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