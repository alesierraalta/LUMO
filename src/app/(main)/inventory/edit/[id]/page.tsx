"use client";

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { calculateMargin, calculatePrice } from "@/lib/client-utils"
import { locationsApi } from "@/lib/api-client"
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
  X,
  History
} from "lucide-react"

// Disable static generation for this page
export const dynamic = 'force-dynamic';

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  margin: number
  categoryId?: string
  sku: string
  cost?: number
  locationId?: string
}

interface Category {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
}

// Main component content
function EditProductContent() {
  const params = useParams()
  const productId = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [cost, setCost] = useState("")
  const [price, setPrice] = useState("")
  const [margin, setMargin] = useState("")
  const [originalCost, setOriginalCost] = useState("")
  const [originalPrice, setOriginalPrice] = useState("")
  const [originalMargin, setOriginalMargin] = useState("")
  const [changeReason, setChangeReason] = useState("")
  const [financialsChanged, setFinancialsChanged] = useState(false)
  
  // Load data once we have the ID
  useEffect(() => {
    if (!productId) return
    
    const loadData = async () => {
      try {
        // Fetch product data
        const fetchProduct = fetch(`/api/products/${productId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async res => {
          console.log('Product fetch response status:', res.status);
          console.log('Product fetch response headers:', res.headers.get('content-type'));
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('Product fetch error response:', errorText);
            throw new Error(`Failed to fetch product data: ${res.status} - ${errorText}`);
          }
          
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const responseText = await res.text();
            console.error('Product fetch returned non-JSON:', responseText.substring(0, 200));
            throw new Error('Product endpoint returned HTML instead of JSON');
          }
          
          return res.json();
        });
        
        // Fetch categories
        const fetchCategories = fetch('/api/categories', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async res => {
          console.log('Categories fetch response status:', res.status);
          console.log('Categories fetch response headers:', res.headers.get('content-type'));
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('Categories fetch error response:', errorText);
            throw new Error(`Failed to fetch categories: ${res.status} - ${errorText}`);
          }
          
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const responseText = await res.text();
            console.error('Categories fetch returned non-JSON:', responseText.substring(0, 200));
            throw new Error('Categories endpoint returned HTML instead of JSON');
          }
          
          return res.json();
        });

        // Fetch locations
        const fetchLocations = locationsApi.getAll().then(response => {
          console.log('Locations fetch response:', response);
          
          if (response.error) {
            console.error('Locations fetch error:', response.error);
            throw new Error(response.error);
          }
          
          return response.data || [];
        });

        const [productData, categoriesData, locationsData] = await Promise.all([
          fetchProduct,
          fetchCategories,
          fetchLocations
        ]);
        
        console.log('All data fetched successfully:', { productData, categoriesData, locationsData });
        
        // Ensure product data matches our interface
        if (productData) {
          setProduct({
            id: productData.id,
            name: productData.name,
            description: productData.description,
            price: Number(productData.price),
            margin: Number(productData.margin),
            categoryId: productData.categoryId || undefined,
            sku: productData.sku,
            cost: productData.cost,
            locationId: productData.locationId
          })
          
          // Initialize the form state variables
          const costStr = productData.cost ? productData.cost.toString() : "0";
          const priceStr = productData.price ? productData.price.toString() : "0";
          const marginStr = productData.margin ? productData.margin.toString() : "0";
          
          setCost(costStr);
          setPrice(priceStr);
          setMargin(marginStr);
          
          // Store original values for comparison
          setOriginalCost(costStr);
          setOriginalPrice(priceStr);
          setOriginalMargin(marginStr);
        }
        
        setCategories(categoriesData)
        setLocations(locationsData)
      } catch (error) {
        console.error("Failed to load data:", error)
        // Handle error appropriately - you could show an error message to the user
        alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    loadData()
  }, [productId])

  // Check if financial values have changed
  useEffect(() => {
    if (originalCost && originalPrice && originalMargin) {
      const costChanged = cost !== originalCost;
      const priceChanged = price !== originalPrice;
      const marginChanged = margin !== originalMargin;
      
      setFinancialsChanged(costChanged || priceChanged || marginChanged);
    }
  }, [cost, price, margin, originalCost, originalPrice, originalMargin]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!productId || !product) {
      console.error("Missing product ID or product data")
      return
    }
    
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const categoryValue = formData.get("category") as string
    const locationValue = formData.get("location") as string
    
    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      margin: parseFloat(formData.get("margin") as string),
      categoryId: categoryValue && categoryValue !== "uncategorized" ? categoryValue : undefined,
      sku: formData.get("sku") as string || product.sku,
      locationId: locationValue && locationValue !== "uncategorized" ? locationValue : undefined
    }

    try {
      // Update basic product data
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating product');
      }
      
      // If financials were changed, update them separately to record history
      if (financialsChanged) {
        const financialsData = {
          price: parseFloat(price),
          cost: parseFloat(cost),
          margin: parseFloat(margin),
          changeReason: changeReason || "Updated price/cost"
        };
        
        const financialsResponse = await fetch(`/api/inventory/${productId}/financials`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(financialsData)
        });
        
        if (!financialsResponse.ok) {
          const errorData = await financialsResponse.json();
          throw new Error(errorData.message || 'Error updating financials');
        }
      }
      
      router.push("/inventory?tab=products")
      router.refresh()
    } catch (error) {
      console.error("Failed to update product:", error)
      // Here you would typically show an error message to the user
    } finally {
      setLoading(false)
    }
  }

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = e.target.value;
    setCost(newCost);
    
    if (newCost && price) {
      const costVal = parseFloat(newCost);
      const priceVal = parseFloat(price);
      const newMargin = calculateMargin(costVal, priceVal);
      console.log('Calculated margin (edit):', newMargin, 'from cost:', costVal, 'price:', priceVal);
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
      console.log('Calculated margin (edit):', newMargin, 'from cost:', costVal, 'price:', priceVal);
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
      console.log('Calculated price (edit):', newPrice, 'from cost:', costVal, 'margin:', marginVal);
      setPrice(newPrice.toFixed(2));
    }
  };

  if (!product) {
    return (
      <div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Cargando datos del producto...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: "Editar Producto" }
        ]}
      />
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Editar Producto</h1>
          <p className="text-muted-foreground">Actualizar información del producto: {product.name}</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Tag className="w-3 h-3" />
          <span>{product.sku}</span>
        </Badge>
      </div>

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
                  defaultValue={product.name}
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
                  defaultValue={product.sku}
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
                defaultValue={product.description || ""}
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
                    value={cost}
                    onChange={handleCostChange}
                    placeholder="0.00"
                    className="h-11 pl-10"
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
                    value={price}
                    onChange={handlePriceChange}
                    placeholder="0.00"
                    className="h-11 pl-10"
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
                    value={margin}
                    onChange={handleMarginChange}
                    placeholder="0.00"
                    className="h-11 pr-8"
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

            {/* Alerta de cambios financieros */}
            {financialsChanged && (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                <History className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Cambios detectados en precios:</span> Se registrará el historial de estos cambios.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Razón del cambio (solo si hay cambios financieros) */}
        {financialsChanged && (
          <Card className="border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-600" />
                <span>Justificación del Cambio</span>
              </CardTitle>
              <CardDescription>
                Indique el motivo del cambio de precio o costo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="changeReason" className="text-sm font-medium">
                  Razón del Cambio *
                </Label>
                <Textarea
                  id="changeReason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Ej: Cambio de proveedor, ajuste de temporada, promoción especial..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )}

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
                <Select name="category" defaultValue={product.categoryId || "uncategorized"}>
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Sin categoría</span>
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
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
                <Select name="location" defaultValue={product.locationId || "uncategorized"}>
                  <SelectTrigger id="location" className="h-11">
                    <SelectValue placeholder="Seleccione una ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Sin ubicación</span>
                      </div>
                    </SelectItem>
                    {locations.map((location) => (
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

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/inventory?tab=products")}
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
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Export the main page component
export default function EditProductPage() {
  return <EditProductContent />;
} 