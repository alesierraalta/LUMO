"use client";

import { useState } from "react";
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
import { Trash, Plus, Minus, Edit3 } from "lucide-react";

// Esquema de validación para el formulario
const inventoryAdjustmentSchema = z.object({
  operationType: z.enum(["add", "remove", "adjust"], {
    required_error: "El tipo de operación es requerido",
  }),
  quantity: z.coerce.number().int().min(1, { message: "La cantidad debe ser mayor que 0" }),
  minStockLevel: z.coerce.number().int().min(0, { message: "El nivel mínimo no puede ser negativo" }),
  location: z.string().optional(),
  notes: z.string().optional(),
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
      quantity: 1,
      minStockLevel: inventoryItem.minStockLevel,
      location: inventoryItem.location || "",
      notes: "",
    },
  });

  const operationType = watch("operationType");

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
          // Actualizar la cantidad, nivel mínimo y ubicación
          const promises = [];
          const changeMessages = [];

          // Ajustar la cantidad si es diferente
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
                if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
                return res.json();
              })
            );
            changeMessages.push(`cantidad a ${data.quantity}`);
          }

          // Actualizar nivel mínimo si es diferente
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
                if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
                return res.json();
              })
            );
            changeMessages.push(`nivel mínimo a ${data.minStockLevel}`);
          }

          // Actualizar ubicación si es diferente
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
                if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
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
          error: "Error al eliminar el item de inventario",
        }
      );
      
      // Pequeña pausa para que el usuario vea el mensaje de éxito
      await new Promise(resolve => setTimeout(resolve, 800));
      
      router.push("/inventory");
      router.refresh();
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      toast.error(`Error: ${error.message || "Ha ocurrido un error inesperado"}`);
      setIsLoading(false);
      setShowDeleteConfirmation(false);
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operationType">Tipo de Operación</Label>
                <Select
                  defaultValue="adjust"
                  onValueChange={(value) => setValue("operationType", value as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar operación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Añadir Stock</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="remove">
                      <div className="flex items-center">
                        <Minus className="h-4 w-4 mr-2" />
                        <span>Reducir Stock</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="adjust">
                      <div className="flex items-center">
                        <Edit3 className="h-4 w-4 mr-2" />
                        <span>Ajustar Directamente</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">{errors.quantity.message}</p>
                )}
              </div>

              {operationType === "adjust" && (
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
                  />
                  {errors.minStockLevel && (
                    <p className="text-sm text-destructive">{errors.minStockLevel.message}</p>
                  )}
                </div>
              )}
            </div>

            {operationType === "adjust" && (
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="Almacén, Estante, etc."
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Información adicional sobre este movimiento"
                rows={3}
                disabled={isLoading}
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
              {isLoading ? "Espere..." : "Cancelar"}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className={isLoading ? "animate-pulse" : ""}
            >
              {isLoading ? 
                (operationType === "add" ? "Añadiendo..." : 
                 operationType === "remove" ? "Reduciendo..." : 
                 "Guardando...") : 
                (operationType === "add" ? "Añadir Stock" : 
                 operationType === "remove" ? "Reducir Stock" : 
                 "Guardar Cambios")
              }
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Diálogo de confirmación para eliminación */}
      <DialogConfirmation
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        title="Eliminar Item de Inventario"
        description={`¿Estás seguro de que deseas eliminar el item de inventario para "${productName}"? Esta acción eliminará todos los movimientos de stock asociados y no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={isLoading}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
} 