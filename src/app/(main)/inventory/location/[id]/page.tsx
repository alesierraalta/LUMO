"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLocationAction } from "./actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MapPin } from "lucide-react";

export default function LocationInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const [inventoryItem, setInventoryItem] = useState<any>(null);
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
        setLocation(data.location || "");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inventory item:", error);
        setLoading(false);
      }
    }

    if (params.id) {
      fetchInventoryItem();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inventoryItem || !params.id) return;

    try {
      await updateLocationAction(
        params.id as string,
        inventoryItem.location,
        {
          quantity: inventoryItem.quantity,
          minStockLevel: inventoryItem.minStockLevel,
          location
        }
      );
      
      router.push("/inventory");
      router.refresh();
    } catch (error) {
      console.error("Error updating location:", error);
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
          { title: "Ubicación" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Ubicación de Inventario</CardTitle>
          </div>
          <CardDescription>
            Actualiza la ubicación para {inventoryItem.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">            
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ingrese la ubicación (ej. Almacén A, Estante 5)"
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
              <Button type="submit">Guardar Ubicación</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 