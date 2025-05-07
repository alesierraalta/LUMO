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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { calculateMargin, calculatePrice, createProductApi, updateProductApi } from "@/lib/client-utils";

// Import Radio Group components
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Esquema de validación para el formulario
const productSchema = z.object({
  name: z.string().min(1, { message: "El nombre del producto es requerido" }).max(100, { message: "El nombre no puede exceder los 100 caracteres" }),
  description: z.string().optional(),
  sku: z.string()
    .min(1, { message: "El SKU es requerido" }),
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
  margin: z.coerce.number().min(0, { message: "El margen no puede ser negativo" }).max(1000, { message: "El margen no puede exceder el 1000%" }),
  categoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  // Inventory fields
  quantity: z.coerce.number().int().min(0, { message: "La cantidad no puede ser negativa" }).default(0),
  minStockLevel: z.coerce.number().int().min(0, { message: "El nivel mínimo no puede ser negativo" }).default(5),
  location: z.string().optional(),
}).refine((data) => {
  const price = data.price as number;
  const cost = data.cost as number;
  return price > cost;
}, {
  message: "El precio de venta debe ser mayor que el costo",
  path: ["price"],
}).refine((data) => {
  if (data.categoryId && data.categoryId !== "uncategorized") {
    return true;
  }
  return true;
}, {
  message: "La categoría seleccionada no es válida",
  path: ["categoryId"],
}).refine((data) => {
  return !!(data.description || data.imageUrl);
}, {
  message: "Debe proporcionar al menos una descripción o una URL de imagen para el producto",
  path: ["description"],
});

// Keep the original Zod inference for type safety
type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
  initialData?: any;
  categories: any[];
};

export default function ProductForm({
  initialData,
  categories,
}: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Change default pricing mode to margin
  const [pricingMode, setPricingMode] = useState<"price" | "margin">("margin");

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      sku: "",
      cost: 0,
      price: 0,
      margin: 30, // Default 30% margin
      categoryId: "uncategorized",
      imageUrl: "",
      quantity: 0,
      minStockLevel: 5,
      location: "",
    },
  });

  // Event handlers for interactive calculations
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    setValue("cost", newCost);
    
    // Recalculate based on pricing mode
    if (pricingMode === "price") {
      // In price mode, update margin based on current price
      const currentPrice = getValues("price");
      if (currentPrice && newCost > 0) {
        const newMargin = calculateMargin(newCost, currentPrice);
        setValue("margin", newMargin);
      } else {
        setValue("margin", 0);
      }
    } else {
      // In margin mode, update price based on current margin
      const currentMargin = getValues("margin");
      if (currentMargin !== undefined && newCost > 0) {
        const newPrice = calculatePrice(newCost, currentMargin);
        setValue("price", newPrice);
      }
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setValue("price", newPrice);
    
    // Recalculate margin
    const currentCost = getValues("cost");
    if (currentCost > 0 && newPrice > 0) {
      const newMargin = calculateMargin(currentCost, newPrice);
      setValue("margin", newMargin);
    } else {
      setValue("margin", 0);
    }
  };

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = parseFloat(e.target.value) || 0;
    setValue("margin", newMargin);
    
    // Recalculate price
    const currentCost = getValues("cost");
    if (currentCost > 0) {
      const newPrice = calculatePrice(currentCost, newMargin);
      setValue("price", newPrice);
    }
  };

  // Handle pricing mode change
  const handlePricingModeChange = (value: string) => {
    const newMode = value as "price" | "margin";
    setPricingMode(newMode);
    
    // Recalculate values based on new mode
    const currentCost = getValues("cost");
    
    if (newMode === "price") {
      // Switching to price mode - price stays the same, recalculate margin
      const currentPrice = getValues("price");
      if (currentCost > 0 && currentPrice > 0) {
        const newMargin = calculateMargin(currentCost, currentPrice);
        setValue("margin", newMargin);
      }
    } else {
      // Switching to margin mode - margin stays the same, recalculate price
      const currentMargin = getValues("margin");
      if (currentCost > 0 && currentMargin !== undefined) {
        const newPrice = calculatePrice(currentCost, currentMargin);
        setValue("price", newPrice);
      }
    }
  };

  // Observar los cambios en costo y precio para calcular el margen
  const cost = watch("cost");
  const price = watch("price");
  const margin = watch("margin");

  // Initialize calculations on component mount
  useEffect(() => {
    if (initialData) {
      // If we have initial data, ensure margin is calculated correctly
      const initialCost = Number(initialData.cost || 0);
      const initialPrice = Number(initialData.price || 0);
      
      if (initialCost > 0 && initialPrice > 0) {
        const calculatedMargin = calculateMargin(initialCost, initialPrice);
        setValue("margin", calculatedMargin);
      }
    } else {
      // For new products, calculate initial price based on default margin
      const initialCost = getValues("cost");
      const initialMargin = getValues("margin");
      
      if (initialCost > 0 && initialMargin > 0) {
        const calculatedPrice = calculatePrice(initialCost, initialMargin);
        setValue("price", calculatedPrice);
      }
    }
  }, [initialData, setValue, getValues]);

  // Manejar el envío del formulario
  const handleFormSubmit = async (data: ProductFormValues) => {
    try {
      setIsLoading(true);
      setError("");
      
      // Ensure price and margin are consistent before submission
      // based on the current pricing mode
      if (pricingMode === "price") {
        // Calculate margin based on price
        const cost = Number(data.cost);
        const price = Number(data.price);
        if (cost > 0 && price > 0) {
          data.margin = calculateMargin(cost, price);
        }
      } else {
        // Calculate price based on margin
        const cost = Number(data.cost);
        const margin = Number(data.margin);
        if (cost > 0 && margin !== undefined) {
          data.price = calculatePrice(cost, margin);
        }
      }
      
      // If categoryId is "uncategorized", set it to null for the database
      if (data.categoryId === "uncategorized") {
        data.categoryId = undefined;
      }

      // Ensure inventory values are valid numbers
      data.quantity = Number(data.quantity) || 0;
      data.minStockLevel = Number(data.minStockLevel) || 5;
      
      if (initialData) {
        // Update existing product
        const updatedProduct = await updateProductApi(initialData.id, data);
        toast.success("Producto actualizado correctamente");
      } else {
        // Create new product
        const newProduct = await createProductApi(data);
        toast.success("Producto creado correctamente");
      }
      
      router.push("/products");
      router.refresh();
    } catch (error: any) {
      console.error("Error al guardar el producto:", error);
      setError(error.message || "Ocurrió un error al guardar el producto");
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
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        <div className="px-6 space-y-6">
          {/* Form fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre del producto"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del producto"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="SKU único"
                {...register("sku")}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>

            {/* Radio group for pricing mode selection */}
            <div className="space-y-2">
              <Label>Modo de Precios</Label>
              <RadioGroup 
                value={pricingMode} 
                onValueChange={handlePricingModeChange}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price" id="price-mode" />
                  <Label htmlFor="price-mode">Especificar Precio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="margin" id="margin-mode" />
                  <Label htmlFor="margin-mode">Especificar Margen (Cálculo automático del precio)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("cost")}
                  onChange={(e) => {
                    register("cost").onChange(e);
                    handleCostChange(e);
                  }}
                />
                {errors.cost && (
                  <p className="text-sm text-destructive">{errors.cost.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="margin">Margen (%)</Label>
                <Input
                  id="margin"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  disabled={pricingMode === "price"}
                  {...register("margin")}
                  onChange={(e) => {
                    register("margin").onChange(e);
                    handleMarginChange(e);
                  }}
                />
                {errors.margin && (
                  <p className="text-sm text-destructive">{errors.margin.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">
                Precio de Venta {pricingMode === "margin" && "(Calculado automáticamente)"}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={pricingMode === "margin"}
                className={pricingMode === "margin" ? "bg-muted" : ""}
                {...register("price")}
                onChange={(e) => {
                  register("price").onChange(e);
                  handlePriceChange(e);
                }}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
              {pricingMode === "margin" && (
                <p className="text-xs text-muted-foreground">
                  El precio se calcula automáticamente en base al costo y margen
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <Select
                defaultValue={initialData?.categoryId || "uncategorized"}
                onValueChange={(value) => setValue("categoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageUrl">URL de Imagen</Label>
              <Input
                id="imageUrl"
                placeholder="https://ejemplo.com/imagen.jpg"
                {...register("imageUrl")}
              />
            </div>

            {/* Inventory Fields */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Información de Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad Inicial</Label>
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
                
                <div className="grid gap-2">
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
                
                <div className="grid gap-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="Almacén, Estante, etc."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 flex justify-end gap-4">
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
    </Card>
  );
} 