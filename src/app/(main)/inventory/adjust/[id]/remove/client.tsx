"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClientRemoveStockPageProps {
  inventoryId: string;
}

export default function ClientRemoveStockPage({ inventoryId }: ClientRemoveStockPageProps) {
  const router = useRouter();
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
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
    
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/${inventoryId}/remove-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      router.push("/inventory");
      router.refresh();
    } catch (error) {
      console.error("Error removing stock:", error);
      setError(error instanceof Error ? error.message : "Error al restar stock");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  if (error && !submitting) {
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

  const hasInsufficientStock = inventoryItem.quantity < quantity;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: inventoryItem.name, href: `/inventory/edit/${inventoryId}` },
          { title: "Restar Stock" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Restar Stock</CardTitle>
          <CardDescription>
            Reduce unidades del inventario de {inventoryItem.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  Stock Actual: <span className="font-medium">{inventoryItem.quantity} unidades</span>
                </p>
                {inventoryItem.location && (
                  <p className="text-sm">
                    Ubicación: <span className="font-medium">{inventoryItem.location}</span>
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad a Restar</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Debe ser un número mayor que cero
              </p>
            </div>
            
            {hasInsufficientStock && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  La cantidad a restar ({quantity}) es mayor que el stock disponible ({inventoryItem.quantity}).
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Razón del ajuste, número de orden, etc."
                className="resize-none min-h-[80px]"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || quantity <= 0 || hasInsufficientStock}
                variant="destructive"
              >
                {submitting ? "Restando..." : "Restar Stock"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 