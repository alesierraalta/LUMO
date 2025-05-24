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

// Import icons
import { Tag, MapPin, ExternalLink } from "lucide-react";

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
  quantity: z.coerce.number().int().min(0, { message: "La cantidad no puede ser negativa" }).optional(),
  minStockLevel: z.coerce.number().int().min(0, { message: "El nivel mínimo no puede ser negativo" }).optional(),
  location: z.string().optional(),
  // Price change reason
  changeReason: z.string().optional(),
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

// Tipo para ubicaciones
type Location = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

export default function ProductForm({
  initialData,
  categories,
}: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  // Change default pricing mode to margin
  const [pricingMode, setPricingMode] = useState<"price" | "margin">("margin");
  const [priceChanged, setPriceChanged] = useState(false);

  // Initialize selectors when initialData changes
  useEffect(() => {
    if (initialData) {
      const categoryValue = initialData.categoryId || "uncategorized";
      setSelectedCategory(categoryValue);
      setSelectedLocation(initialData.location || "no-location");
    } else {
      setSelectedCategory("uncategorized");
      setSelectedLocation("no-location");
    }
  }, [initialData]);

  // Cargar ubicaciones
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations");
        if (response.ok) {
          const locationsData = await response.json();
          // Filter out migration descriptions and clean up location data
          const cleanedLocations = locationsData.map((location: Location) => ({
            ...location,
            description: location.description?.includes("migrada automáticamente") 
              ? undefined 
              : location.description
          }));
          setLocations(cleanedLocations);
        } else {
          console.error("Error fetching locations");
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // Update location selection when locations are loaded and we have initial data
  useEffect(() => {
    if (!loadingLocations && initialData?.location && locations.length > 0) {
      // Check if the initial location exists in our cleaned locations
      const foundLocation = locations.find(loc => loc.name === initialData.location);
      if (foundLocation) {
        setSelectedLocation(foundLocation.name);
      } else {
        // If not found, check if it's in the legacy format and try to find by name
        setSelectedLocation("no-location");
      }
    }
  }, [loadingLocations, locations, initialData]);

  // Configurar el formulario con react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
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
      changeReason: "",
    },
  });

  // Watch for changes in pricing fields
  const cost = watch("cost");
  const price = watch("price");
  const margin = watch("margin");
  
  // Track if price-related fields have changed
  useEffect(() => {
    if (initialData && (dirtyFields.price || dirtyFields.cost || dirtyFields.margin)) {
      setPriceChanged(true);
    } else {
      setPriceChanged(false);
    }
  }, [cost, price, margin, dirtyFields, initialData]);

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

  // Initialize calculations on component mount
  useEffect(() => {
    if (initialData) {
      // Set form values properly
      setValue("categoryId", initialData.categoryId || "uncategorized");
      setValue("location", initialData.location || "");
      
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
      </CardHeader>
      {error && (
        <div className="px-4 sm:px-6 mb-2">
          <div className="bg-destructive/20 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        <div className="px-4 sm:px-6 space-y-6">
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
                className="min-h-[80px] resize-y"
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
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price" id="price-mode" />
                  <Label htmlFor="price-mode" className="text-sm">Especificar Precio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="margin" id="margin-mode" />
                  <Label htmlFor="margin-mode" className="text-sm">Especificar Margen (Cálculo automático del precio)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Change reason field - only shown when editing an existing product and price fields have changed */}
            {initialData && priceChanged && (
              <div className="grid gap-2">
                <Label htmlFor="changeReason">Razón del cambio de precio</Label>
                <Textarea
                  id="changeReason"
                  placeholder="Razón del cambio de precio (opcional)"
                  {...register("changeReason")}
                />
                <p className="text-xs text-muted-foreground">
                  Proporcione un motivo para este cambio de precio (ajuste de costos, promoción, etc.)
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryId" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Categoría
                </Label>
                
                <Select
                  key={`category-${initialData?.id || 'new'}-${selectedCategory}`}
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setValue("categoryId", value === "uncategorized" ? undefined : value);
                  }}
                >
                  <SelectTrigger className="h-10">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Seleccionar categoría" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Sin categoría
                      </div>
                    </SelectItem>
                    {categories.length > 0 ? categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          {category.name}
                        </div>
                      </SelectItem>
                    )) : (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          Cargando categorías...
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  <span>¿No encuentras tu categoría? </span>
                  <a 
                    href="/categories" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Crear nueva categoría
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageUrl">URL de Imagen</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  {...register("imageUrl")}
                />
                {errors.imageUrl && (
                  <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
                )}
              </div>
            </div>

            {/* Inventory Fields */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Información de Inventario</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                
                <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Ubicación
                  </Label>
                  <Select
                    key={`location-${initialData?.id || 'new'}`}
                    value={selectedLocation}
                    onValueChange={(value) => {
                      setSelectedLocation(value);
                      setValue("location", value === "no-location" ? "" : value);
                    }}
                    disabled={loadingLocations}
                  >
                    <SelectTrigger className={`h-10 ${loadingLocations ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${loadingLocations ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
                        <SelectValue placeholder={
                          loadingLocations ? "Cargando ubicaciones..." : "Seleccionar ubicación"
                        } />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-location">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Sin ubicación
                        </div>
                      </SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.name}>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">{location.name}</span>
                              {location.description && (
                                <span className="text-xs text-muted-foreground">
                                  {location.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      {locations.length === 0 && !loadingLocations && (
                        <SelectItem value="no-location" disabled>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            No hay ubicaciones disponibles
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <span>¿No encuentras tu ubicación? </span>
                    <a 
                      href="/locations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Crear nueva ubicación
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/products")}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Card>
  );
}