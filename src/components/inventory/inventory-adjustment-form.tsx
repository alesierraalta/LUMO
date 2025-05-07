"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogConfirmation } from "@/components/ui/dialog-confirmation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Plus, Minus, Edit3, DollarSign, Percent } from "lucide-react";
import { calculateMargin, calculatePrice } from "@/lib/client-utils";

// Esquema de validación para el formulario
const inventoryAdjustmentSchema = z.object({
  operationType: z.enum(["add", "remove", "adjust"], {
    required_error: "El tipo de operación es requerido",
  }),
  quantity: z.coerce.number().int().min(1, { message: "La cantidad debe ser mayor que 0" }),
  minStockLevel: z.coerce.number().int().min(0, { message: "El nivel mínimo no puede ser negativo" }),
  location: z.string().optional(),
  notes: z.string().optional(),
  price: z.coerce.number().min(0, { message: "El precio no puede ser negativo" }),
  cost: z.coerce.number().min(0, { message: "El costo no puede ser negativo" }),
});

type InventoryAdjustmentValues = z.infer<typeof inventoryAdjustmentSchema>;

type InventoryAdjustmentFormProps = {
  inventoryItem: any;
  productName: string;
};

export default function InventoryAdjustmentForm({
  inventoryItem,
  productName,
}: InventoryAdjustmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [calculatedMargin, setCalculatedMargin] = useState<number | null>(null);

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InventoryAdjustmentValues>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      operationType: "adjust",
      quantity: inventoryItem.quantity,
      minStockLevel: inventoryItem.minStockLevel,
      location: inventoryItem.location || "",
      notes: "",
      price: inventoryItem.price,
      cost: inventoryItem.cost,
    },
  });

  const operationType = watch("operationType");
  const currentPrice = watch("price");
  const currentCost = watch("cost");

  // Calculate margin whenever price or cost changes
  useEffect(() => {
    if (currentPrice > 0) {
      const margin = calculateMargin(currentCost, currentPrice);
      setCalculatedMargin(margin);
    } else {
      setCalculatedMargin(null);
    }
  }, [currentPrice, currentCost]);
  
  // Manejadores para asegurar que los inputs numéricos funcionen correctamente con el teclado
  const handleNumericChange = (fieldName: keyof InventoryAdjustmentValues, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setValue(fieldName, value, { shouldValidate: true });
    }
  };

  // Manejar el envío del formulario
  const handleFormSubmit = async (data: InventoryAdjustmentValues) => {
    setIsLoading(true);

    try {
      let response;
      
      switch (data.operationType) {
        case "add":
          response = await toast.promise(
            fetch(`/api/inventory/${inventoryItem.id}/add-stock`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                quantity: data.quantity,
                notes: data.notes,
              }),
            }).then(res => {
              if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
              return res.json();
            }),
            {
              loading: `Añadiendo ${data.quantity} unidades al inventario...`,
              success: `Se han añadido ${data.quantity} unidades al inventario de "${productName}"`,
              error: (err) => `Error: ${err.message || "No se pudo añadir stock"}`,
            }
          );
          break;

        case "remove":
          response = await toast.promise(
            fetch(`/api/inventory/${inventoryItem.id}/remove-stock`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                quantity: data.quantity,
                notes: data.notes,
              }),
            }).then(res => {
              if (!res.ok) {
                return res.json().then(err => {
                  throw new Error(err.error || `Error ${res.status}: ${res.statusText}`);
                });
              }
              return res.json();
            }),
            {
              loading: `Retirando ${data.quantity} unidades del inventario...`,
              success: `Se han retirado ${data.quantity} unidades del inventario de "${productName}"`,
              error: (err) => `${err.message || "No se pudo reducir el stock"}`,
            }
          );
          break;

        case "adjust":
          const promises = [];
          const changeMessages = [];
          let newMargin = inventoryItem.margin;

          // Calculate new margin if price or cost changed
          if (inventoryItem.price !== data.price || inventoryItem.cost !== data.cost) {
            if (data.price > 0) {
              newMargin = calculateMargin(data.cost, data.price);
            } else {
              newMargin = 0;
            }
          }

          // Update financials (price, cost, margin) if changed
          if (
            inventoryItem.price !== data.price ||
            inventoryItem.cost !== data.cost ||
            inventoryItem.margin !== newMargin
          ) {
            promises.push(
              fetch(`/api/inventory/${inventoryItem.id}/financials`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  price: data.price,
                  cost: data.cost,
                  margin: newMargin,
                }),
              }).then(res => {
                if (!res.ok) throw new Error(`Error updating financials: ${res.statusText}`);
                return res.json();
              })
            );
            if (inventoryItem.price !== data.price) changeMessages.push(`precio a ${data.price}`);
            if (inventoryItem.cost !== data.cost) changeMessages.push(`costo a ${data.cost}`);
            if (inventoryItem.margin !== newMargin) changeMessages.push(`margen a ${newMargin.toFixed(2)}%`);
          }
          
          // Adjust quantity if different
          if (inventoryItem.quantity !== data.quantity) {
            promises.push(
              fetch(`/api/inventory/${inventoryItem.id}/adjust-stock`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  newQuantity: data.quantity,
                  notes: data.notes,
                }),
              }).then(res => {
                if (!res.ok) throw new Error(`Error adjusting stock: ${res.statusText}`);
                return res.json();
              })
            );
            changeMessages.push(`cantidad a ${data.quantity}`);
          }

          // Update min stock level if different
          if (inventoryItem.minStockLevel !== data.minStockLevel) {
            promises.push(
              fetch(`/api/inventory/${inventoryItem.id}/min-level`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  minLevel: data.minStockLevel,
                }),
              }).then(res => {
                if (!res.ok) throw new Error(`Error updating min level: ${res.statusText}`);
                return res.json();
              })
            );
            changeMessages.push(`nivel mínimo a ${data.minStockLevel}`);
          }

          // Update location if different
          if (inventoryItem.location !== data.location) {
            promises.push(
              fetch(`/api/inventory/${inventoryItem.id}/location`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  location: data.location,
                }),
              }).then(res => {
                if (!res.ok) throw new Error(`Error updating location: ${res.statusText}`);
                return res.json();
              })
            );
            changeMessages.push(`ubicación a "${data.location}"`);
          }

          if (promises.length === 0) {
            toast.info("No se detectaron cambios que actualizar");
            setIsLoading(false);
            return;
          }

          response = await toast.promise(
            Promise.all(promises),
            {
              loading: "Ajustando inventario...",
              success: `Inventario de "${productName}" actualizado: ${changeMessages.join(", ")}`,
              error: "Error al actualizar el inventario",
            }
          );
          break;
      }

      // Pequeña pausa para que el usuario vea el mensaje de éxito
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Redirección a la página de inventario
      router.push("/inventory");
      router.refresh();
    } catch (error: any) {
      console.error("Error en la operación:", error);
      toast.error(`Error: ${error.message || "Ha ocurrido un error inesperado"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar eliminación del inventario
  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      await toast.promise(
        fetch(`/api/inventory/${inventoryItem.id}`, {
          method: "DELETE",
        }).then(res => {
          if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
          return res.json();
        }),
        {
          loading: `Eliminando inventario de "${productName}"...`,
          success: `El item de inventario para "${productName}" ha sido eliminado correctamente`,
          error: (err) => `Error: ${err.message || "No se pudo eliminar el item"}`,
        }
      );

      router.push("/inventory");
      router.refresh();
    } catch (error: any) {
      console.error("Error eliminando item:", error);
    } finally {
      setShowDeleteConfirmation(false);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Ajustar Inventario - {productName}</CardTitle>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowDeleteConfirmation(true)}
            disabled={isLoading}
          >
            <Trash className="h-4 w-4 mr-2" />
            Eliminar Item
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="operationType">Tipo de Operación</Label>
              <Select 
                defaultValue="adjust" 
                onValueChange={(value: "add" | "remove" | "adjust") => setValue("operationType", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="operationType">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjust">
                    <Edit3 className="h-4 w-4 mr-2 inline-block" /> Ajustar Detalles
                  </SelectItem>
                  <SelectItem value="add">
                    <Plus className="h-4 w-4 mr-2 inline-block" /> Añadir Stock
                  </SelectItem>
                  <SelectItem value="remove">
                    <Minus className="h-4 w-4 mr-2 inline-block" /> Reducir Stock
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos condicionales basados en el tipo de operación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {operationType !== 'adjust' && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    {operationType === "add" ? "Cantidad a Añadir" : 
                    operationType === "remove" ? "Cantidad a Reducir" : 
                    "Nueva Cantidad Total"}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    {...register("quantity")}
                    placeholder="1"
                    disabled={isLoading}
                    onChange={(e) => handleNumericChange('quantity', e)}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                  )}
                </div>
              )}

              {operationType === "adjust" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad Total Actual</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="1"
                      {...register("quantity")}
                      placeholder="0"
                      disabled={isLoading}
                      onChange={(e) => handleNumericChange('quantity', e)}
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
                      disabled={isLoading}
                      onChange={(e) => handleNumericChange('minStockLevel', e)}
                    />
                    {errors.minStockLevel && (
                      <p className="text-sm text-destructive">{errors.minStockLevel.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio de Venta</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("price")}
                        placeholder="0.00"
                        className="pl-8"
                        disabled={isLoading}
                        onChange={(e) => handleNumericChange('price', e)}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Costo</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("cost")}
                        placeholder="0.00"
                        className="pl-8"
                        disabled={isLoading}
                        onChange={(e) => handleNumericChange('cost', e)}
                      />
                    </div>
                    {errors.cost && (
                      <p className="text-sm text-destructive">{errors.cost.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Margen Calculado</Label>
                    <div className="relative">
                      <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={calculatedMargin !== null ? `${calculatedMargin.toFixed(2)}%` : 'N/A'}
                        readOnly
                        className="pl-8 bg-muted text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="Almacén, Estante, etc."
                      disabled={isLoading}
                    />
                    {errors.location && (
                      <p className="text-sm text-destructive">{errors.location.message}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Añadir notas sobre el ajuste..."
                disabled={isLoading}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando Cambios..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Confirmation Dialog for Deletion */}
      <DialogConfirmation 
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        description={`¿Estás seguro de que quieres eliminar permanentemente el item "${productName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isLoading}
      />
    </>
  );
} 