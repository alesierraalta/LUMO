"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateMargin } from "@/services/productService";

// Esquema de validación para el formulario
const productSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  description: z.string().optional(),
  sku: z.string().min(1, { message: "El SKU es requerido" }),
  cost: z.coerce.number().min(0, { message: "El costo no puede ser negativo" }),
  price: z.coerce.number().min(0.01, { message: "El precio debe ser mayor que 0" }),
  margin: z.coerce.number().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
  initialData?: any;
  categories: any[];
  onSubmit?: (data: ProductFormValues) => Promise<void>;
};

export default function ProductForm({
  initialData,
  categories,
  onSubmit,
}: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      sku: "",
      cost: 0,
      price: 0,
      margin: 0,
      categoryId: "none",
      imageUrl: "",
    },
  });

  // Observar los cambios en costo y precio para calcular el margen
  const cost = watch("cost");
  const price = watch("price");

  useEffect(() => {
    if (cost !== undefined && price !== undefined) {
      const newMargin = calculateMargin(Number(cost), Number(price));
      setValue("margin", newMargin);
    }
  }, [cost, price, setValue]);

  // Manejar el envío del formulario
  const handleFormSubmit = async (data: ProductFormValues) => {
    try {
      setIsLoading(true);
      setError("");
      
      // If categoryId is "none", set it to null for the database
      if (data.categoryId === "none") {
        data.categoryId = undefined;
      }
      
      if (onSubmit) {
        // Use passed onSubmit for edit functionality
        await onSubmit(data);
      } else {
        // Create product directly for new products
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al crear el producto');
        }
        
        toast.success('Producto creado exitosamente');
      }
      
      router.push("/products");
      router.refresh();
    } catch (error: any) {
      console.error("Error al guardar el producto:", error);
      setError(error.message || "Ocurrió un error al guardar el producto");
      toast.error(error.message || "Ocurrió un error al guardar el producto");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
      </CardHeader>
      {error && (
        <div className="px-6 mb-2">
          <div className="bg-destructive/20 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} placeholder="Nombre del producto" />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} placeholder="SKU único" />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descripción del producto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Costo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  {...register("cost")}
                  placeholder="0.00"
                />
              </div>
              {errors.cost && (
                <p className="text-sm text-destructive">{errors.cost.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  {...register("price")}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin">Margen</Label>
              <div className="relative">
                <Input
                  id="margin"
                  type="number"
                  step="0.01"
                  className="pr-7"
                  {...register("margin")}
                  placeholder="0.00"
                  readOnly
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <Select
                onValueChange={(value) => setValue("categoryId", value)}
                defaultValue={initialData?.categoryId || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de Imagen</Label>
              <Input
                id="imageUrl"
                {...register("imageUrl")}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/products")}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 