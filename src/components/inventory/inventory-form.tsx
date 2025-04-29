"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Esquema de validación para el formulario de inventario
const inventorySchema = z.object({
  quantity: z.coerce.number().int().min(0, { message: "La cantidad no puede ser negativa" }),
  minStockLevel: z.coerce.number().int().min(0, { message: "El nivel mínimo no puede ser negativo" }),
  location: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

type InventoryFormProps = {
  initialData?: any;
  productName?: string;
  onSubmit: (data: InventoryFormValues) => Promise<void>;
};

export default function InventoryForm({
  initialData,
  productName,
  onSubmit,
}: InventoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: initialData || {
      quantity: 0,
      minStockLevel: 5,
      location: "",
    },
  });

  // Manejar el envío del formulario
  const handleFormSubmit = async (data: InventoryFormValues) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      router.push("/inventory");
      router.refresh();
    } catch (error) {
      console.error("Error al guardar el inventario:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Ajustar Inventario" : "Inicializar Inventario"}
          {productName && ` - ${productName}`}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                {...register("quantity")}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Nivel Mínimo de Stock</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                step="1"
                {...register("minStockLevel")}
                placeholder="5"
              />
              {errors.minStockLevel && (
                <p className="text-sm text-destructive">{errors.minStockLevel.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="Almacén, Estante, etc."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/inventory")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Inicializar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 