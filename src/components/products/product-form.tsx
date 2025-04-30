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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Esquema de validación para el formulario
const productSchema = z.object({
  name: z.string().min(1, { message: "El nombre del producto es requerido" }).max(100, { message: "El nombre no puede exceder los 100 caracteres" }),
  description: z.string().optional().max(500, { message: "La descripción no puede exceder los 500 caracteres" }),
  sku: z.string()
    .min(1, { message: "El SKU es requerido" })
    .regex(/^PROD-[A-Z0-9]{5}$/, { 
      message: "El SKU debe tener el formato PROD-XXXXX (donde X son letras mayúsculas o números)" 
    }),
  cost: z.coerce
    .number()
    .min(0, { message: "El costo no puede ser negativo" })
    .max(999999.99, { message: "El costo no puede exceder los 999,999.99" })
    .refine((val) => {
      const decimals = val.toString().split('.')[1];
      return !decimals || decimals.length <= 2;
    }, { message: "El costo debe tener máximo 2 decimales" }),
  price: z.coerce
    .number()
    .min(0.01, { message: "El precio debe ser mayor que 0" })
    .max(999999.99, { message: "El precio no puede exceder los 999,999.99" })
    .refine((val) => {
      const decimals = val.toString().split('.')[1];
      return !decimals || decimals.length <= 2;
    }, { message: "El precio debe tener máximo 2 decimales" }),
  margin: z.coerce.number().optional().min(0, { message: "El margen no puede ser negativo" }).max(1000, { message: "El margen no puede exceder el 1000%" }),
  categoryId: z.string().optional(),
  imageUrl: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, { message: "La URL de la imagen debe ser válida (debe incluir http:// o https://)" })
    .refine((val) => {
      if (!val) return true;
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(val);
    }, { message: "La URL debe terminar en una extensión de imagen válida (.jpg, .jpeg, .png, .gif, .webp)" }),
}).refine((data) => data.price > data.cost, {
  message: "El precio de venta debe ser mayor que el costo",
  path: ["price"],
}).refine((data) => {
  if (data.categoryId && data.categoryId !== "none") {
    // This is a placeholder - in a real app, you'd check against actual category IDs
    return true;
  }
  return true; // For now, always pass since we can't access categories list in schema
}, {
  message: "La categoría seleccionada no es válida",
  path: ["categoryId"],
}).refine((data) => {
  if (data.margin) {
    const calculatedMargin = data.cost === 0 ? 0 : ((data.price - data.cost) / data.cost) * 100;
    return Math.abs(calculatedMargin - data.margin) < 0.1; // Small tolerance for rounding
  }
  return true;
}, {
  message: "El margen proporcionado no coincide con el cálculo basado en costo y precio",
  path: ["margin"],
}).refine((data) => {
  return !!(data.description || data.imageUrl);
}, {
  message: "Debe proporcionar al menos una descripción o una URL de imagen para el producto",
  path: ["description"],
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
      <Form {...{ register, handleSubmit, errors }}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          <FormField
            control={register("name")}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del producto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={register("description")}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción del producto"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={register("sku")}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="SKU único" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={register("cost")}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={register("price")}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Venta</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={register("margin")}
              name="margin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margen</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="pr-7"
                      {...field}
                      placeholder="0.00"
                      readOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={register("categoryId")}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={register("imageUrl")}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Imagen</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://ejemplo.com/imagen.jpg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
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
          </div>
        </form>
      </Form>
    </Card>
  );
} 