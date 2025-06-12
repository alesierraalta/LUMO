"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProductApi, ProductData, calculateMargin, calculatePrice } from "@/lib/client-utils"
import { locationsApi } from "@/lib/api-client"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  FileText, 
  MapPin, 
  Warehouse,
  Calculator,
  Save,
  X
} from "lucide-react"

// Disable static generation for this page
export const dynamic = 'force-dynamic';

// Main component with the form
function AddProductContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [error, setError] = useState("")
  const [cost, setCost] = useState("")
  const [price, setPrice] = useState("")
  const [margin, setMargin] = useState("")

  // Load categories and locations on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Categories fetch response status:', response.status);
        console.log('Categories fetch response headers:', response.headers.get('content-type'));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Categories fetch error response:', errorText);
          throw new Error(`Failed to fetch categories: ${response.status} - ${errorText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('Categories fetch returned non-JSON:', responseText.substring(0, 200));
          throw new Error('Categories endpoint returned HTML instead of JSON');
        }
        
        const data = await response.json();
        console.log('Categories data loaded:', data);
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError(`Error loading categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    async function fetchLocations() {
      try {
        const response = await locationsApi.getAll();
        console.log('Locations fetch response:', response);
        
        if (response.error) {
          console.error('Locations fetch error:', response.error);
          throw new Error(response.error);
        }
        
        if (response.data) {
          console.log('Locations data loaded:', response.data);
          setLocations(response.data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setError(`Error loading locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    fetchCategories();
    fetchLocations();
  }, [])

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = e.target.value;
    setCost(newCost);
    
    if (newCost && price) {
      const costVal = parseFloat(newCost);
      const priceVal = parseFloat(price);
      const newMargin = calculateMargin(costVal, priceVal);
      console.log('Calculated margin:', newMargin, 'from cost:', costVal, 'price:', priceVal);
      setMargin(newMargin.toString());
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value;
    setPrice(newPrice);
    
    if (cost && newPrice) {
      const costVal = parseFloat(cost);
      const priceVal = parseFloat(newPrice);
      const newMargin = calculateMargin(costVal, priceVal);
      console.log('Calculated margin:', newMargin, 'from cost:', costVal, 'price:', priceVal);
      setMargin(newMargin.toString());
    }
  };

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = e.target.value;
    setMargin(newMargin);
    
    if (cost && newMargin) {
      const costVal = parseFloat(cost);
      const marginVal = parseFloat(newMargin);
      const newPrice = calculatePrice(costVal, marginVal);
      console.log('Calculated price:', newPrice, 'from cost:', costVal, 'margin:', marginVal);
      setPrice(newPrice.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("") // Clear previous errors

    const formData = new FormData(e.currentTarget)
    const categoryValue = formData.get("category") as string
    const locationValue = formData.get("location") as string
    
    const productData: ProductData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      cost: parseFloat(formData.get("cost") as string),
      margin: parseFloat(formData.get("margin") as string),
      categoryId: categoryValue && categoryValue !== "uncategorized" ? categoryValue : undefined,
      sku: formData.get("sku") as string,
      quantity: parseInt(formData.get("quantity") as string) || 0,
      minStockLevel: parseInt(formData.get("minStockLevel") as string) || 5,
      locationId: locationValue && locationValue !== "uncategorized" ? locationValue : undefined
    }

    try {
      await createProductApi(productData)
      router.push("/inventory?tab=products")
      router.refresh()
    } catch (error: any) {
      console.error("Failed to create product:", error)
      // Extract error message from the error object
      const errorMessage = error.message || "Error al crear el producto"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: "Añadir Producto" }
        ]}
      />
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Añadir Nuevo Producto</h1>
          <p className="text-muted-foreground">Complete la información para crear un nuevo producto en su inventario</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Información Básica</span>
            </CardTitle>
            <CardDescription>
              Datos generales del producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>Nombre del Producto *</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ingrese nombre del producto"
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-medium flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span>SKU *</span>
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="Código único del producto"
                  className="h-11"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>Descripción</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descripción detallada del producto (opcional)"
                className="min-h-[120px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración Financiera */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Configuración Financiera</span>
            </CardTitle>
            <CardDescription>
              Precios, costos y márgenes de ganancia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium flex items-center space-x-1">
                  <Calculator className="w-4 h-4" />
                  <span>Costo *</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-11 pl-10"
                    value={cost}
                    onChange={handleCostChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Precio de Venta *</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-11 pl-10"
                    value={price}
                    onChange={handlePriceChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin" className="text-sm font-medium flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Margen</span>
                </Label>
                <div className="relative">
                  <Input
                    id="margin"
                    name="margin"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.01"
                    placeholder="0.00"
                    className="h-11 pr-8"
                    value={margin}
                    onChange={handleMarginChange}
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Calculator className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Cálculo de Margen</p>
                  <p className="mt-1">Fórmula: (Precio - Costo) / Costo × 100</p>
                  <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                    Ejemplo: Precio $100, Costo $50 = 100% de margen
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clasificación y Ubicación */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span>Clasificación y Ubicación</span>
            </CardTitle>
            <CardDescription>
              Organización del producto en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span>Categoría</span>
                </Label>
                <Select name="category">
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue placeholder="Seleccione una categoría (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Sin categoría</span>
                      </div>
                    </SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Ubicación</span>
                </Label>
                <Select name="location">
                  <SelectTrigger id="location" className="h-11">
                    <SelectValue placeholder="Seleccione una ubicación (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Sin ubicación</span>
                      </div>
                    </SelectItem>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>{location.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Inventario */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Warehouse className="w-5 h-5 text-orange-600" />
              <span>Control de Inventario</span>
            </CardTitle>
            <CardDescription>
              Cantidades y niveles de stock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>Cantidad Inicial</span>
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-11"
                  defaultValue="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minStockLevel" className="text-sm font-medium flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Nivel Mínimo de Stock</span>
                </Label>
                <Input
                  id="minStockLevel"
                  name="minStockLevel"
                  type="number"
                  min="0"
                  placeholder="5"
                  className="h-11"
                  defaultValue="5"
                />
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Gestión de Stock</p>
                  <p className="mt-1">El sistema le notificará cuando el inventario esté por debajo del nivel mínimo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => router.back()}
            disabled={loading}
            className="h-11 px-6"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="h-11 px-6 bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Guardando..." : "Guardar Producto"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Export the main page component
export default function AddProductPage() {
  return <AddProductContent />;
} 