"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Esquema de validación para el formulario
const stockMovementSchema = z.object({
  quantity: z.coerce.number().int().min(1, { message: "La cantidad debe ser mayor que 0" }),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "INITIAL"], {
    required_error: "El tipo de movimiento es requerido",
  }),
  notes: z.string().optional(),
});

type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

type StockMovementFormProps = {
  productName: string;
  currentStock: number;
  inventoryItemId: string;
  onSubmit: (data: StockMovementFormValues) => Promise<void>;
};

export default function StockMovementForm({
  productName,
  currentStock,
  inventoryItemId,
  onSubmit,
}: StockMovementFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      quantity: 1,
      type: "STOCK_IN",
      notes: "",
    },
  });

  const movementType = watch("type");

  // Manejar el envío del formulario
  const handleFormSubmit = async (data: StockMovementFormValues) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      router.push("/inventory");
      router.refresh();
    } catch (error) {
      console.error("Error al registrar el movimiento:", error);
      setIsLoading(false);
    }
  };

  const movementTypeLabels = {
    STOCK_IN: "Entrada de Stock",
    STOCK_OUT: "Salida de Stock",
    ADJUSTMENT: "Ajuste de Inventario",
    INITIAL: "Stock Inicial",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Movimiento de Stock - {productName}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm mb-2">
              Stock Actual: <span className="font-medium">{currentStock} unidades</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Movimiento</Label>
              <Select
                defaultValue="STOCK_IN"
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK_IN">Entrada de Stock</SelectItem>
                  <SelectItem value="STOCK_OUT">Salida de Stock</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste de Inventario</SelectItem>
                  <SelectItem value="INITIAL">Stock Inicial</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                {...register("quantity")}
                placeholder="1"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Información adicional sobre este movimiento"
              rows={3}
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
            {isLoading ? "Procesando..." : "Registrar " + (movementTypeLabels[movementType] || "Movimiento")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 